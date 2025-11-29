Fetcher script

This script fetches the UCI Gravel World Series calendar, geocodes locations with Nominatim (with local cache), and writes `server/data/calendar.json`.

Run locally:

```bash
cd server/scripts
npm install
npm run fetch
```

When run in GitHub Actions, the workflow will commit `server/data/calendar.json` back to the repo if it changed.

To serve the JSON from GitHub Pages or the frontend `public/` folder, add a step in your CI that copies `server/data/calendar.json` to `frontend/public/calendar.json` and commits it. Example:

```bash
cp server/data/calendar.json frontend/public/calendar.json
git add frontend/public/calendar.json
git commit -m "Update public calendar.json" || true
git push
```
