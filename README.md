# EMPIRE: Rise & Ruin — World Command v0.8

A playable 2–6-person multiplayer geopolitical strategy prototype. **This version is ready for upload but is not automatically deployed.** It replaces v0.7 in the existing GitHub repository and Render service.

## What's new

- **Realistic-looking globe in the main game and World Intelligence:** a 3-D WebGL sphere with authentic NOAA-derived shaded elevation/bathymetry, atmospheric/day–night shading, deterministic starfield and transparent **decorative** cloud texture. On browsers without WebGL, a real-geography CPU-rendered orthographic globe replaces the old schematic fallback. Works on mobile drag, wheel zoom and country selection.
- **More map layers:** player influence, invented sovereign debt, sampled Open-Meteo weather, historical GDP growth, illustrative shipping routes/ports, USGS reported earthquakes, and *curated-only* political polling data.
- **Actual multiplayer interaction:** shipping voyage order with cash gains based on fleet, Shipping Magnate bonus and weather/market modifiers from the **round-frozen** intelligence snapshot; delivery counts influence final ranking. Sponsorship accords: offer a rival $2–8M, receive +2 country influence only if they accept before planning closes. Limit one outstanding/accepted proposal per sender per round. Server verifies sessions and settles both sides at the same time.
- **Decision briefing:** main game displays transparent cost/benefit preview with current round's frozen modifiers; World Intelligence now simulates the cargo action as well.
- **Separate real data from simulation:** real observations are dated and attributed; GDP/debt, game scores, and trade-route economics are fictional. Decorative clouds are **not** live weather imagery, and no live AIS/vessel tracking is claimed.

## Deploy to the existing game

Repo: `https://github.com/ThoughtThinker/RiseandRun`  
Render service: `https://dashboard.render.com/web/srv-db4qj55ckfvc73ftckb0`  
Game URL (v0.7 until v0.8 deployed): `https://empire-rise-ruin.onrender.com`

1. Unzip `empire-world-command-v08.zip` and upload the **contents of the extracted folder** to the root of the `RiseandRun` repository, replacing existing files. Do not upload only the ZIP itself. Keep the structure:

   ```
   server.js
   package.json
   render.yaml
   Dockerfile
   public/index.html
   public/intel.html
   public/globe.js
   public/assets/earth-relief.jpg
   public/assets/earth-surface.png
   public/assets/stylized-clouds.png
   extended-test.mjs
   diplomacy-test.mjs
   mock-intelligence-test.mjs
   mock-providers.cjs
   ```

2. Commit to `main`.
3. In Render, choose **Manual Deploy → Deploy latest commit** if auto-deploy doesn't start. Wait for status **Live** and check the deployed commit SHA.
4. Visit the game URL. Create a 2-player room. Both users should see the globe, new shipping order, and live diplomatic offers. The intelligence page is also at `/intel.html`.

## Testing locally

Node.js >= 18. From the extracted project folder:

```
npm install
npm run test:all
npm start
```

Open `http://localhost:3000/` and `http://localhost:3000/intel.html`.

Testing performed here:

- Node syntax checks for server, globe and embedded browser JavaScript.
- Browser render with a no-WebGL fallback, actual local relief texture, country selection, alternate map layers and pre-decision simulator.
- Mocked provider tests for weather, FX, crypto, USGS, NWS/Texas, World Bank and optional FRED.
- Multiplayer tests with 3 players, offers, acceptance, rejection/authorization checks, round resolution, shipments and SSE.

The local browser cannot enable WebGL, so the **GPU path still needs a real-device visual check**. External live API connectivity on Render is not asserted by these mocked tests.

## Data coverage and configuration

- **Open-Meteo:** sampled forecast/current observations for eight cities representing playable countries; observations may lag and are **not comprehensive** countrywide hazard forecasts.
- **Frankfurter / ECB:** published reference exchange rates (daily, not intraday).
- **CoinGecko:** public crypto quotes (may be rate-limited).
- **USGS:** reported M4.5+ earthquakes past day, subject to feed availability.
- **NWS / NOAA:** severe-weather alerts **limited to Texas**. No global weather-alert coverage claimed.
- **World Bank:** **historical annual** GDP growth figures, not real-time market pricing.
- **FRED:** latest *published* oil, Treasury yield and S&P 500 observations if `FRED_API_KEY` is set in Render; not tick-by-tick. No key means unconfigured.
- **Political polling:** no generic verified free world-polling endpoint is assumed. `POLLS_JSON` may supply sourced, dated entries (with country ID, fieldEnd, sourceUrl, changePoints and population). Polls are not election results or forecasts.

### Geographic imagery

- `earth-relief.jpg` is a pre-existing shaded bathymetry/topography imagery asset from the prior v0.7 package, attributed there to **NOAA ETOPO1 / NCEI**. Its colors depict physical geography; it is not a live satellite image or a dynamically refreshed weather satellite layer.
- `earth-surface.png` is a vector-derived country-boundaries texture from v0.7 and serves as an optional stylized map style.
- `stylized-clouds.png` is a locally generated synthetic decorative cloud mask, not a weather product.
- Shipping corridors and most point markers are game/reference routes, not measured vessel movements.
- NASA's separate Blue Marble satellite imagery is a future asset option, **not included** in this build: https://svs.gsfc.nasa.gov/2915

## Known limitations / next steps

- Rooms, player sessions and deals are stored in Render server RAM. Restarts erase matches; persistent storage (e.g., Render Postgres), reconnect-friendly sessions, and server-side match cleanup are still important before competition release.
- Polling is intentionally empty until credible curated records are provided.
- Seismic and weather signals are factual observations, but not every signal is automatically converted to a fictional economic effect. Only the documented gameplay weather/FX-derived modifiers affect rounds.
- No live vessel AIS data, fully elevation-displaced geometry, official global weather-alert coverage or licensed detailed satellite tiles.
- This implementation has no accounts, anti-sybil protections or rate limiting and should not be used as a real-money service.
