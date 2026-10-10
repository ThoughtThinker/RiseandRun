# Empire v0.8 globe display fix — GitHub web-upload layout

Your current GitHub repo stores the imagery directly in `public/`, but the original globe code tried to load images from `public/assets/`. Also the deployed `public/index.html`, `public/intel.html`, and `public/globe.js` were still v0.7. This small package fixes both issues without editing the server.

## Upload three files

1. Open https://github.com/ThoughtThinker/RiseandRun/tree/main/public
2. Click **Add file → Upload files** from inside this `public` folder.
3. Drag only the three extracted files `index.html`, `intel.html`, and `globe.js` from this package into the upload area. If GitHub asks whether to replace or overwrite the existing files, confirm. Keep the filenames exactly as shown. Commit to `main`.
4. **Do not** move or re-upload the existing `earth-relief.jpg`, `earth-surface.png`, and `stylized-clouds.png`. They are already directly in `public/`, matching the asset URLs in this fixed `globe.js`.
5. Wait for Render deployment. If the deploy doesn't start, open https://dashboard.render.com/web/srv-db4qj55ckfvc73ftckb0 → Manual Deploy → Deploy latest commit.
6. Visit https://empire-rise-ruin.onrender.com and https://empire-rise-ruin.onrender.com/intel.html. Hard reload (Mac: Cmd+Shift+R).

## Verify

- The main header must say **WORLD COMMAND v0.8**. If it still doesn't, `index.html` wasn't replaced or your browser is caching the old page.
- Open https://empire-rise-ruin.onrender.com/earth-relief.jpg — it should load an image.
- Open https://empire-rise-ruin.onrender.com/globe.js — it should show JavaScript, not `{"error":"Not found"}`.
- For the main globe, create/join a game room; the lobby game section is hidden until then.
- Polling remains empty until POLLS_JSON is configured; weather and finance overlays need successful external provider responses and may be unchanged if the real data is quiet.

These three files are the v0.8 browser files, with texture image paths adjusted to the files currently uploaded to GitHub. The existing server.js and game data remain untouched.
