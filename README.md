# EMPIRE: RISE & RUIN — World Intelligence v0.7

**Multiplayer strategic economy + integrated 3-D globe + source-attributed world data.**

This project extends the currently deployed `ThoughtThinker/RiseandRun` game. It preserves the 2–6 player room-code multiplayer engine (SSE), actions, economic rules, and 8-round match schedule. It adds a full-screen 3-D command center opened directly from the game. Select a country and action in the dashboard to return to that country and action in the game, without leaving the match.

## Upload/update an existing Render deployment

Repository: https://github.com/ThoughtThinker/RiseandRun
Service: https://dashboard.render.com/web/srv-db4qj55ckfvc73ftckb0

**Extract the ZIP and commit its contents to the root of the EXISTING repository** (do **not** upload the ZIP archive itself):

- Replace `server.js`, `public/index.html` and `public/intel.html`.
- Add `public/globe.js`, `public/assets/earth-surface.png`, `public/assets/earth-relief.jpg`.
- Replace `package.json`, `render.yaml` and `Dockerfile` only if you want this package's matching versions. Other files may be kept.
- Add `extended-test.mjs` to keep a repeatable smoke-test harness.
- Keep folder structure: the homepage **must** be `public/index.html` and the intelligence page **must** be `public/intel.html`.

Commit to the `main` branch. If Render does not auto-deploy, open your existing Render web service → **Manual Deploy → Deploy latest commit**. Do **not** create a second Render service. Wait for the deployment to report **Live**.

Then open:

- Main game: https://empire-rise-ruin.onrender.com/
- Standalone globe: https://empire-rise-ruin.onrender.com/intel.html
- Diagnostic: https://empire-rise-ruin.onrender.com/health
- Source statuses: https://empire-rise-ruin.onrender.com/api/intelligence

**Important:** This package has been locally syntax-checked, API smoke-tested, and visually previewed via a browser fallback. External provider connectivity and end-to-end public multiplayer must be re-tested after deployment. Server restarts erase active rooms until persistent multiplayer storage is added; old browser sessions now detect expired rooms and return to the lobby.

## In-game experience

1. Enter or create a multiplayer room. Click the persistent **3-D WORLD INTELLIGENCE** button.
2. Rotate the WebGL Earth (coastlines/borders from GSHHG) and select overlays for influence, debt, shaded NOAA ETOPO1 relief, weather, shipping routes/chokepoints, earthquakes and polling.
3. Select a country, view live observations, annual macro context and fictional country debt, then examine a **pre-decision simulator** explaining cost, influence, income and debt changes under current game rules.
4. Select a proposed action, click **Select this country in the game**, and submit it in the synchronized multiplayer game.
5. If the device does not support WebGL, the globe falls back to a zoomable 2-D projection with markers and illustrated land shapes; all intelligence panels remain available.

The WebGL globe is a true GPU-rendered 3-D sphere. The **terrain-relief layer is shaded NOAA elevation imagery**, not a height-displaced 3-D terrain mesh. Trade arcs and port locations are illustrative approximate geography, **not live AIS shipping traffic or validated route congestion**.

## Data sources and validity

| Signal | Provider | Timeliness | Game effect |
| --- | --- | --- | --- |
| Wind, rain, temperature at 8 sample sites | Open-Meteo | Current/near-time; may be unavailable | Existing capped weather-pressure game rule |
| Exchange rates EUR, GBP, JPY | Frankfurter / ECB | Daily ECB-based reference | Existing capped market-stress debt modifier |
| Bitcoin and Ethereum | CoinGecko | Recent API snapshot | Fallback volatility signal, **not a stock-market proxy** |
| Earthquakes M4.5+ | USGS official GeoJSON | Past day, fetched every 30 min | Informational overlay; no automatic disaster impact |
| U.S. official severe weather alerts | NOAA / National Weather Service | Active alerts for **Texas only** | Informational only; not a nationwide/global forecast |
| Country GDP growth | World Bank | Annual and historical | Context only; not game GDP/debt |
| WTI oil price, S&P 500 index, 10-year Treasury yield | FRED | Latest published observations; may be delayed | Informational, opt-in with free key |
| Election polling | Administrator-curated sourced entries | Depends on sources and field dates | Existing neutral uncertainty scenario, never outcome prediction |

**Missing/stale feeds are labeled as such.** Source timestamps are distinct from fetch times. The server caches feeds and freezes the game modifier snapshot **for each round**. None of these sources provides real-time trading quotes, precise local impact forecasts, or election predictions.

### Optional: FRED real energy/markets

1. Get a free FRED API key: https://fred.stlouisfed.org/docs/api/api_key.html
2. In Render → `empire-rise-ruin` → Environment add **`FRED_API_KEY`** with your key as a secret environment variable. Never put it in the public GitHub repo or front-end HTML.
3. Redeploy (Render will normally restart after env changes). The intelligence panel will show WTI crude oil (DCOILWTICO), S&P 500 (SP500), and 10-year Treasury yield (DGS10) if FRED returns available published observations.

### Optional: sourced polling

In Render → Environment, set `POLLS_JSON` to a JSON array of verified, neutral poll measurements. Example schema (these are **fictional placeholders for explaining the format; do not publish as measured data**):

```json
[
  {
    "country": "usa",
    "sourceUrl": "https://REPLACE-WITH-REAL-POLL-SOURCE.example",
    "fieldEnd": "YYYY-MM-DD",
    "population": "Registered voters / adults / likely voters (as reported)",
    "changePoints": 0
  }
]
```

Use only real source URLs, accurate end dates, real sampled population and an actual observed change. If omitted, polling is marked **unconfigured**. Do not infer voter preferences from user data; the game does not favor or predict candidates or parties.

## Running and testing locally

```bash
node --version       # Node >=18
npm install
npm test             # existing room smoke test
node extended-test.mjs
npm start
```

Navigate to `http://localhost:3000/`. Internet access is necessary for real provider feeds, but **not** for the frontend, map assets or multiplayer room engine.

## Scope and next steps

- **Implemented:** integrated world-intelligence overlay, WebGL sphere, NOAA terrain-shading view, local coastlines, ports/chokepoints, weather/debt/influence/polling/seismic layers, USGS/NWS/World Bank/FRED optional feeds, country intelligence and pre-decision briefing, source-failure statuses, stale-session reset and tests.
- **Not yet included:** real elevation-displaced terrain geometry, licensed live AIS vessel traffic, a universal reliable global live polling data provider, automatic global NWS-equivalent warnings for every country, or persistent game rooms across Render restarts.
- **Recommended for a subsequent release:** choose a licensed AIS source, add DEM mesh tiles with quotas/licensing, build an opt-in polling editorial review workflow, deploy a persistent room-state store (e.g., Render Postgres/Key Value) with reconnectable deadlines, and multi-device load testing.

## Geographic source attribution

- **GSHHG:** Wessel, P. and Smith, W. H. F. (1996), *A Global Self-consistent, Hierarchical, High-resolution Shoreline Database*; GSHHG is distributed under the **LGPL**. Original coastlines and administrative boundaries from the Basemap distribution. https://www.ngdc.noaa.gov/mgg/shorelines/shorelines.html
- **NOAA ETOPO1:** Amante, C. and Eakins, B.W. (2009), *ETOPO1 1 Arc-Minute Global Relief Model*, DOI `10.7289/V5C8276M`. Relief imagery sourced via the Basemap data distribution, NOAA/NCEI attribution. https://www.ncei.noaa.gov/products/etopo-global-relief-model

These map assets are for a stylized educational game, **not navigation, trading, emergency response or professional weather alerts**.
