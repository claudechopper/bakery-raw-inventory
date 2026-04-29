# Bakery Raw Inventory

Single-page bakery raw-ingredient ordering + inventory app for 2–3 shared iPads/phones. No login, sync via Railway backend.

## Architecture

- **Frontend** — `index.html` (vanilla HTML/CSS/JS, ~2K lines). Deployed to GitHub Pages.
- **Backend** — `server/` (Node + Express + persistent JSON file). Deployed to Railway with a mounted volume at `/data` so state survives restarts.

## Live URLs

- App: `https://claudechopper.github.io/bakery-raw-inventory/`
- API: set in Settings → Cloud Sync after Railway deploy

## Sync flow

1. Each device sets a nickname (e.g. "Kitchen iPad") + the Railway URL in Settings.
2. Editing pushes to `PUT /bakeryRaw/state` automatically.
3. Other devices hit the big "🔄 Pull Latest" button to refresh.
4. UI shows "Last synced by Kitchen iPad at 3:15pm".

## Local dev

```bash
cd server
npm install
npm start          # runs on :3001
```

Then open `index.html` in a browser, set Railway URL to `http://localhost:3001`.

## Railway deploy

1. New project → Deploy from GitHub repo → `bakery-raw-inventory`
2. **Root Directory** = `server`
3. Add a **Volume** mounted at `/data`
4. Env vars:
   - `API_SECRET` = `3zzJMvS72_sjN2oYRGeJhA` (matches the hardcoded secret in `index.html`)
   - `DATA_DIR` = `/data`
5. Railway auto-detects `npm start`.
