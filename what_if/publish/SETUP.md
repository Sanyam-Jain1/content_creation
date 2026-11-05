# Auto-posting setup (one-time, about 30–40 minutes)

After setup, everything runs on its own. Every hour a GitHub Action checks `queue.json`, uploads any reel that is
due to **Instagram Reels** and **YouTube Shorts**, posts the first comment, and writes the links back into
`queue.json`. Every Monday it renews the Instagram token. You only add new entries to the queue.

Current schedule (edit `queue.json`; times are in `config.timezone`, currently `UTC`):

| Entry | Reel | Posts at |
| --- | --- | --- |
| ep00 | 10× stronger | Sun 8 Nov, 19:00 |
| ep03 | 10× smaller | Tue 10 Nov, 19:00 |
| ep01 | Time freeze | Thu 12 Nov, 19:00 |
| ep02 | Eat sunlight | Sat 14 Nov, 19:00 |

> Set `"timezone"` to your own (for example `"America/New_York"`, `"Europe/London"`, `"Asia/Kolkata"`) so 19:00 is
> your audience's evening.

---

## Step 1: default branch (done)
GitHub only runs scheduled workflows from the repository's **default branch** (`claude/epic-dirac-c85o6e`).
The reels, the queue and the workflow are merged there already. If you ever change the default branch, update `"branch"` in `queue.json`.

## Step 2: Instagram token (Meta "Instagram API with Unified login")
1. @waitwhattv must be a Professional account. It already is if you see "Professional dashboard" on your profile.
2. <https://developers.facebook.com> → **My Apps → Create app** → filter **Content management** → tick the Instagram use case.
3. **Use cases → Customize → API setup with Unified login**:
   - **Business portfolio:** click **+ Business portfolio** and create one (free; a name and email are enough).
   - **1. Configure your app → Create new configuration:** keep the defaults (system-user token, *never expires*), make sure
     `instagram_content_publish` and `instagram_manage_comments` are included, and pick @waitwhattv as the asset.
     Skip the redirect and login URL; if a redirect URL is required, use `https://github.com/Sanyam-Jain1/content_creation`.
   - **Roles** tab → add @waitwhattv as an **Instagram Tester**, then accept the invite in Instagram
     (☰ → Website permissions → Apps and websites → Tester invites).
   - **2. Generate access tokens → Add account → Generate token.** Copy the **token** and the **Instagram account ID** shown next to it.
   - Skip webhooks and app review; you're only posting to your own account.

The older "Instagram login" tokens (starting with `IG`, valid 60 days) also work; the weekly job renews those.

## Step 3: YouTube (optional, but recommended)
1. Go to <https://console.cloud.google.com> → create a project → **APIs & Services → Library** → enable **YouTube Data API v3**.
2. Open the **OAuth consent screen** → External → fill in the app name and your email → add yourself as a test user.
   Then set the **Publishing status to "In production"**. In "Testing" status the login stops working after 7 days. The
   "unverified app" warning you'll see when you log in is fine for your own channel.
3. Go to **Credentials → Create credentials → OAuth client ID → Desktop app**. Copy the client ID and secret.
4. On **your own computer** (it opens a browser), run:
   ```bash
   pip install requests
   ```
   ```bash
   python3 what_if/publish/publish.py youtube-auth
   ```
   Paste the client ID and secret when asked, log in with the channel's Google account, and copy the printed **refresh token**.
5. Know this before relying on it: YouTube says videos uploaded through the API by **unaudited** projects stay **private** until the
   project passes its API compliance audit (a form linked from the YouTube API docs). Until then, open YouTube Studio
   and flip each uploaded Short to Public (one tap), or apply for the audit.

## Step 4: add the secrets to GitHub
On GitHub, open the repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
| --- | --- |
| `IG_ACCESS_TOKEN` | Instagram token (Step 2) |
| `IG_USER_ID` | the Instagram account ID shown next to the token (Step 2) |
| `YT_CLIENT_ID` | Google OAuth client ID (Step 3) |
| `YT_CLIENT_SECRET` | Google OAuth client secret |
| `YT_REFRESH_TOKEN` | from `youtube-auth` |
| `GH_PAT` | *Only needed for 60-day `IG...` tokens (automatic renewal):* a [fine-grained token](https://github.com/settings/personal-access-tokens/new) for this repo only, with **Secrets: Read and write** |

Never paste these into chat or commit them. Each one can post publicly as you.

## Step 5: test, then let it run
**Actions → Publish reels → Run workflow**:
1. `mode = check`: should print your Instagram username and YouTube channel name.
2. `mode = plan`: shows what will post, and when.
3. Optional: `mode = run`, `only = ep00` posts the first reel right now.

From then on it posts on schedule. Results appear in `queue.json` under each entry's `state`
(`posted` with a link, or `error` with the reason; it retries up to 3 times).

## Day-to-day
- **New reel:** render it, then add an entry to `queue.json` (copy an existing one and change `id`, `post_at`, `file`, `cover`, captions).
- **Hold a post:** set `"approved": false`. **Pause everything:** set `"enabled": false`.
- **Pinned comment:** the first comment is posted automatically; pin it from the Instagram app (the API can't pin).
- **TikTok:** not automated yet. TikTok's posting API only allows *private* posts until your app passes TikTok's audit.
  Post to TikTok from the same MP4 by hand, or ask me to add TikTok once you have an audited app.
