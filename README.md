# Empire: Rise & Ruin v0.3 — Living World

Run `npm start` with Node.js 18+ and open http://localhost:3000. Players on separate devices need a publicly reachable server URL. This is a multiplayer prototype, not production hosting.

## New in v0.3
- Open-Meteo current weather readings for eight representative city coordinates, refreshed every 15 minutes. Weather severity reduces local income and stability.
- CoinGecko free public BTC/ETH market quotes, refreshed every 15 minutes. BTC volatility is a **prototype proxy**, not a stock or macroeconomic market index. Market volatility modestly affects sovereign debt interest.
- Election polling is **not fabricated or automatically scraped**. Optionally set `POLLS_JSON` to a JSON array of sourced, dated country poll-shift records, e.g. `[ {"country":"usa","sourceUrl":"https://example.org/poll","fieldEnd":"2026-10-01","population":"Adults","changePoints":5} ]`. This is only a schema example, not a real poll. An absolute shift of at least 5 points adds a small uncertainty surcharge to debt interest, without implying a winner or advantage for a party.
- New map overlays: influence, debt risk, weather pressure, polling uncertainty.
- Each round freezes one shared intelligence snapshot. Feed failures are labeled `stale` and the last snapshot is retained.

## Important limitations
No production authentication, persistence, abuse protection, or verified cross-device deployment. Server state is in-memory. Weather readings are representative points, not country-wide assessments. Poll changes are not election predictions. Crypto price volatility is not equivalent to real-world financial-market conditions. The prototype uses live sources only when outbound server networking succeeds; it clearly labels failed feeds as stale.

## Data sources
Open-Meteo: https://open-meteo.com/
CoinGecko: https://www.coingecko.com/
Check attribution, terms and rate limits before public/commercial deployment.

## v0.4 upgrade and deployment notes
- Added Frankfurter's ECB-based USD/EUR, USD/GBP and USD/JPY reference exchange rates and seven-day percentage movements. These are daily reference rates, not intraday tradable quotes or equity prices.
- The sovereign interest modifier now prefers absolute seven-day FX movement; falls back to BTC volatility only when FX data is unavailable. Thresholds are gameplay rules, not forecasts.
- A public multiplayer deployment requires a Node.js-capable backend hosting service. Wix static file upload alone cannot run server.js or keep room state synchronized.
- Before a public launch: add durable persistence, room/session security, origin restrictions, request rate limiting, health checks, reconnect tests, and host the Node server. The current prototype stores rooms in memory and is not production ready.
- Election polling remains manual and sourced via POLLS_JSON; it is not a live automatic feed.

## Hosting preparation (v0.4 deployment package)
- `render.yaml` is a sample Render Blueprint for a single Node web service. It does **not** deploy itself. Connect a Git repository containing these files to Render to deploy.
- `Dockerfile` supports a container-capable Node host.
- `/health` provides an HTTP health endpoint.
- Open the resulting HTTPS service URL directly for both game UI and multiplayer API. A Wix page can link to it or embed it after testing.
- **Critical:** This is a demonstration server with in-memory rooms and no production abuse protections. Free-tier sleeping/restarts can erase games. Do not submit as a reliable contest entry before adding persistent room storage and testing with separate devices.

## Render deployment checklist
1. Connect the Render and GitHub apps in ChatGPT, or push these root-level files to a GitHub repository.
2. In Render, create a Blueprint from the repository and review `render.yaml` (Node web service, free plan).
3. After deployment, visit `https://YOUR-SERVICE.onrender.com/health` and the root URL.
4. Test with two devices using separate browser sessions. `npm test` performs a local server smoke test.
5. Rooms remain in memory; free-tier instance sleeping and restarts can end active games. Production launch requires persistent room storage and security hardening.
