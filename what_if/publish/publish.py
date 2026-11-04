#!/usr/bin/env python3
"""Auto-publisher for the WHAT IF? reels: Instagram Reels + YouTube Shorts.

    python3 what_if/publish/publish.py plan              # dry run: what is due, what would be posted
    python3 what_if/publish/publish.py run               # post everything that is due (used by the GitHub Action)
    python3 what_if/publish/publish.py run --only ep01   # post one entry now, ignoring its time
    python3 what_if/publish/publish.py check             # verify credentials, no posting
    python3 what_if/publish/publish.py ig-refresh        # print a refreshed Instagram token (60-day tokens)
    python3 what_if/publish/publish.py youtube-auth      # one-time, on YOUR computer: get a YouTube refresh token

Credentials come from environment variables (GitHub Actions secrets), never from files in the repo:
    IG_ACCESS_TOKEN                      Instagram API with Instagram Login, long-lived user token
    YT_CLIENT_ID, YT_CLIENT_SECRET,      Google OAuth "Desktop app" client
    YT_REFRESH_TOKEN                     from `youtube-auth`
A platform with missing credentials is skipped, not failed.

queue.json drives everything: an entry is posted when `approved` is true, its `post_at`
(in config.timezone) has passed, and that platform's status is still "pending".
Results (ids, permalinks, errors) are written back into queue.json.
"""
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
QUEUE = HERE / "queue.json"

IG_VERSION = os.environ.get("IG_API_VERSION", "v25.0")
IG_GRAPH = os.environ.get("IG_GRAPH_BASE", "https://graph.instagram.com")
IG_RUPLOAD = os.environ.get("IG_RUPLOAD_BASE", "https://rupload.facebook.com")
GOOGLE_TOKEN = os.environ.get("GOOGLE_TOKEN_URL", "https://oauth2.googleapis.com/token")
YT_UPLOAD = os.environ.get("YT_UPLOAD_BASE", "https://www.googleapis.com/upload/youtube/v3/videos")
YT_API = os.environ.get("YT_API_BASE", "https://www.googleapis.com/youtube/v3")
TIMEOUT = 120


def log(*a):
    print(*a, flush=True)


def load():
    return json.loads(QUEUE.read_text())


def save(q):
    QUEUE.write_text(json.dumps(q, indent=1, ensure_ascii=False) + "\n")


def due(q, entry, now):
    tz = ZoneInfo(q["config"].get("timezone", "UTC"))
    at = datetime.strptime(entry["post_at"], "%Y-%m-%d %H:%M").replace(tzinfo=tz)
    return now >= at, at


def raw_url(q, rel):
    """Public URL of a file in this (public) repo, for Instagram's cover_url."""
    c = q["config"]
    branch = os.environ.get("GITHUB_REF_NAME") or c["branch"]
    return f"https://raw.githubusercontent.com/{c['repo']}/{branch}/{rel}"


# ======================= Instagram =======================
class IG:
    def __init__(self, token):
        self.token = token
        self.base = f"{IG_GRAPH}/{IG_VERSION}"

    def _check(self, r):
        try:
            j = r.json()
        except ValueError:
            j = {"raw": r.text[:300]}
        if r.status_code >= 400 or "error" in j:
            raise RuntimeError(f"Instagram {r.status_code}: {j.get('error', j)}")
        return j

    def me(self):
        return self._check(requests.get(f"{self.base}/me", params={"fields": "user_id,username,account_type", "access_token": self.token}, timeout=TIMEOUT))

    def publish_reel(self, q, entry, state, save_cb):
        p = entry["instagram"]
        video = REPO / entry["file"]
        uid = self.me()["user_id"]
        # 1) container (resumable upload: no public video URL needed)
        if not state.get("container"):
            params = {"media_type": "REELS", "upload_type": "resumable", "caption": p["caption"],
                      "share_to_feed": "true", "access_token": self.token}
            if entry.get("cover"):
                params["cover_url"] = raw_url(q, entry["cover"])
            elif p.get("thumb_offset_ms") is not None:
                params["thumb_offset"] = str(p["thumb_offset_ms"])
            j = self._check(requests.post(f"{self.base}/{uid}/media", data=params, timeout=TIMEOUT))
            state["container"] = j["id"]
            state["upload_uri"] = j.get("uri") or f"{IG_RUPLOAD}/ig-api-upload/{IG_VERSION}/{j['id']}"
            state["status"] = "uploading"
            save_cb()
            # 2) send the MP4 bytes
            data = video.read_bytes()
            log(f"  instagram: uploading {video.name} ({len(data) / 1e6:.1f} MB)")
            r = requests.post(state["upload_uri"], data=data, timeout=600,
                              headers={"Authorization": f"OAuth {self.token}", "offset": "0", "file_size": str(len(data))})
            self._check(r)
        # 3) wait for processing
        cid = state["container"]
        for i in range(60):
            j = self._check(requests.get(f"{self.base}/{cid}", params={"fields": "status_code,status", "access_token": self.token}, timeout=TIMEOUT))
            code = j.get("status_code")
            log(f"  instagram: container {cid} -> {code}")
            if code == "FINISHED":
                break
            if code == "PUBLISHED":
                return self._finish(state, None, save_cb, already=True)
            if code in ("ERROR", "EXPIRED"):
                state["container"] = None  # start over next run
                raise RuntimeError(f"Instagram processing {code}: {j.get('status')}")
            time.sleep(min(30, 5 + i * 2))
        else:
            raise RuntimeError("Instagram processing timed out; will resume next run")
        # 4) publish
        j = self._check(requests.post(f"{self.base}/{uid}/media_publish", data={"creation_id": cid, "access_token": self.token}, timeout=TIMEOUT))
        return self._finish(state, j["id"], save_cb, comment=p.get("first_comment"))

    def _finish(self, state, media_id, save_cb, already=False, comment=None):
        state["status"] = "posted"
        state["posted_at"] = datetime.now(ZoneInfo("UTC")).strftime("%Y-%m-%d %H:%M UTC")
        if media_id:
            state["id"] = media_id
            try:
                state["permalink"] = self._check(requests.get(f"{self.base}/{media_id}", params={"fields": "permalink", "access_token": self.token}, timeout=TIMEOUT)).get("permalink")
            except Exception as e:  # noqa: BLE001
                log(f"  instagram: permalink lookup failed: {e}")
            if comment:  # needs instagram_business_manage_comments; pin it by hand in the app
                try:
                    self._check(requests.post(f"{self.base}/{media_id}/comments", data={"message": comment, "access_token": self.token}, timeout=TIMEOUT))
                    state["first_comment"] = "posted"
                except Exception as e:  # noqa: BLE001
                    state["first_comment"] = f"failed: {e}"[:200]
        save_cb()
        log(f"  instagram: POSTED {state.get('permalink') or state.get('id') or ''}")
        return state

    def refresh(self):
        r = requests.get(f"{IG_GRAPH}/refresh_access_token", params={"grant_type": "ig_refresh_token", "access_token": self.token}, timeout=TIMEOUT)
        return self._check(r)


# ======================= YouTube =======================
class YT:
    def __init__(self, cid, secret, refresh):
        r = requests.post(GOOGLE_TOKEN, data={"client_id": cid, "client_secret": secret, "refresh_token": refresh, "grant_type": "refresh_token"}, timeout=TIMEOUT)
        j = r.json()
        if "access_token" not in j:
            raise RuntimeError(f"YouTube token refresh failed: {j}")
        self.h = {"Authorization": f"Bearer {j['access_token']}"}

    def channel(self):
        r = requests.get(f"{YT_API}/channels", params={"part": "snippet", "mine": "true"}, headers=self.h, timeout=TIMEOUT)
        j = r.json()
        if r.status_code >= 400:
            raise RuntimeError(f"YouTube {r.status_code}: {j}")
        return j["items"][0]["snippet"]["title"] if j.get("items") else "(no channel)"

    def upload(self, q, entry, state, save_cb):
        p = entry["youtube"]
        video = REPO / entry["file"]
        meta = {"snippet": {"title": p["title"][:100], "description": p["description"], "tags": p.get("tags", []),
                            "categoryId": str(q["config"].get("youtube_category", "24"))},
                "status": {"privacyStatus": q["config"].get("youtube_privacy", "public"), "selfDeclaredMadeForKids": False,
                           "containsSyntheticMedia": bool(q["config"].get("youtube_synthetic_disclosure", False))}}
        size = video.stat().st_size
        r = requests.post(YT_UPLOAD, params={"uploadType": "resumable", "part": "snippet,status"}, json=meta, timeout=TIMEOUT,
                          headers=dict(self.h, **{"X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": str(size)}))
        if r.status_code >= 400:
            raise RuntimeError(f"YouTube init {r.status_code}: {r.text[:300]}")
        log(f"  youtube: uploading {video.name} ({size / 1e6:.1f} MB)")
        r = requests.put(r.headers["Location"], data=video.read_bytes(), headers=dict(self.h, **{"Content-Type": "video/mp4"}), timeout=900)
        j = r.json()
        if r.status_code >= 400 or "id" not in j:
            raise RuntimeError(f"YouTube upload {r.status_code}: {j}")
        state.update(status="posted", id=j["id"], permalink=f"https://youtube.com/shorts/{j['id']}",
                     privacy=j.get("status", {}).get("privacyStatus"), posted_at=datetime.now(ZoneInfo("UTC")).strftime("%Y-%m-%d %H:%M UTC"))
        save_cb()
        log(f"  youtube: POSTED {state['permalink']} ({state['privacy']})")
        return state


# ======================= commands =======================
def clients():
    out = {}
    if os.environ.get("IG_ACCESS_TOKEN"):
        out["instagram"] = IG(os.environ["IG_ACCESS_TOKEN"])
    if all(os.environ.get(k) for k in ("YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN")):
        out["youtube"] = lambda: YT(os.environ["YT_CLIENT_ID"], os.environ["YT_CLIENT_SECRET"], os.environ["YT_REFRESH_TOKEN"])
    return out


def cmd_plan(q, now):
    c = q["config"]
    log(f"publishing {'ENABLED' if c.get('enabled') else 'DISABLED'} · timezone {c.get('timezone')} · now {now.astimezone(ZoneInfo(c.get('timezone', 'UTC'))):%Y-%m-%d %H:%M}")
    have = clients()
    log(f"credentials: instagram={'yes' if 'instagram' in have else 'NO'} youtube={'yes' if 'youtube' in have else 'NO'}\n")
    for e in q["queue"]:
        is_due, at = due(q, e, now)
        f = REPO / e["file"]
        flags = []
        if not f.exists():
            flags.append("MISSING FILE")
        if not e.get("approved"):
            flags.append("not approved")
        states = ", ".join(f"{pl}:{e['state'].get(pl, {}).get('status', 'pending')}" for pl in q["config"]["platforms"])
        log(f"{e['id']:<6} {at:%a %d %b %H:%M}  {'DUE ' if is_due else 'later'}  {states}  {' '.join(flags)}")
        log(f"       {e['instagram']['caption'].splitlines()[0]}")


def cmd_run(q, now, only=None):
    c = q["config"]
    if not c.get("enabled") and not only:
        log("publishing is disabled in queue.json (config.enabled = false)")
        return 0
    have = clients()
    failures = 0
    for e in q["queue"]:
        if only and e["id"] != only:
            continue
        is_due, _ = due(q, e, now)
        if not e.get("approved") or (not is_due and not only):
            continue
        for pl in c["platforms"]:
            st = e["state"].setdefault(pl, {"status": "pending"})
            if st.get("status") == "posted":
                continue
            if pl not in have:
                log(f"{e['id']}: {pl} skipped (no credentials)")
                continue
            if st.get("attempts", 0) >= c.get("max_attempts", 3):
                log(f"{e['id']}: {pl} gave up after {st['attempts']} attempts: {st.get('error')}")
                continue
            log(f"{e['id']}: posting to {pl}")
            st["attempts"] = st.get("attempts", 0) + 1
            try:
                if pl == "instagram":
                    have[pl].publish_reel(q, e, st, lambda: save(q))
                elif pl == "youtube":
                    have[pl]().upload(q, e, st, lambda: save(q))
                st.pop("error", None)
            except Exception as ex:  # noqa: BLE001
                failures += 1
                st["error"] = str(ex)[:400]
                log(f"  {pl}: FAILED {ex}")
            save(q)
    return 1 if failures else 0


def cmd_check():
    have = clients()
    if not have:
        log("no credentials in the environment")
    if "instagram" in have:
        try:
            log("instagram:", have["instagram"].me())
        except Exception as e:  # noqa: BLE001
            log("instagram: FAILED", e)
    if "youtube" in have:
        try:
            log("youtube channel:", have["youtube"]().channel())
        except Exception as e:  # noqa: BLE001
            log("youtube: FAILED", e)


def cmd_youtube_auth():
    """Loopback OAuth on your own computer -> prints YT_REFRESH_TOKEN."""
    import http.server
    import secrets
    import urllib.parse
    import webbrowser
    cid = os.environ.get("YT_CLIENT_ID") or input("YT_CLIENT_ID: ").strip()
    sec = os.environ.get("YT_CLIENT_SECRET") or input("YT_CLIENT_SECRET: ").strip()
    state = secrets.token_urlsafe(16)
    got = {}

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):  # noqa: N802
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            got.update({k: v[0] for k, v in qs.items()})
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Done. You can close this tab and go back to the terminal.")

        def log_message(self, *a):
            pass

    srv = http.server.HTTPServer(("127.0.0.1", 0), Handler)
    redirect = f"http://127.0.0.1:{srv.server_port}"
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode({
        "client_id": cid, "redirect_uri": redirect, "response_type": "code", "state": state,
        "scope": "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
        "access_type": "offline", "prompt": "consent"})
    log("Opening your browser to authorise YouTube uploads. If it doesn't open, visit:\n" + url)
    webbrowser.open(url)
    while "code" not in got and "error" not in got:
        srv.handle_request()
    if got.get("state") != state or "code" not in got:
        sys.exit(f"authorisation failed: {got}")
    j = requests.post(GOOGLE_TOKEN, data={"code": got["code"], "client_id": cid, "client_secret": sec, "redirect_uri": redirect,
                                          "grant_type": "authorization_code"}, timeout=TIMEOUT).json()
    if "refresh_token" not in j:
        sys.exit(f"no refresh token returned: {j}")
    log("\nYT_REFRESH_TOKEN (add it as a GitHub secret; do not commit it):\n" + j["refresh_token"])


def main():
    args = sys.argv[1:]
    cmd = args[0] if args else "plan"
    now = datetime.now(ZoneInfo("UTC"))
    if "--now" in args:  # testing: pretend it is this time (UTC, "YYYY-MM-DD HH:MM")
        now = datetime.strptime(args[args.index("--now") + 1], "%Y-%m-%d %H:%M").replace(tzinfo=ZoneInfo("UTC"))
    if cmd == "youtube-auth":
        return cmd_youtube_auth()
    if cmd == "check":
        return cmd_check()
    if cmd == "ig-refresh":
        j = IG(os.environ["IG_ACCESS_TOKEN"]).refresh()
        print(j["access_token"])
        print(f"(valid for {int(j.get('expires_in', 0)) // 86400} days)", file=sys.stderr)
        return 0
    q = load()
    if cmd == "plan":
        return cmd_plan(q, now)
    if cmd == "run":
        only = args[args.index("--only") + 1] if "--only" in args else None
        return cmd_run(q, now, only)
    sys.exit(__doc__)


if __name__ == "__main__":
    sys.exit(main() or 0)
