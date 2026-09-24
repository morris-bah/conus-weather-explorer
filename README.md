# CONUS Weather Explorer

A Svelte web app for exploring weather across the contiguous United States, with a location-aware AI weather conversation.

## VS Code / local development

1. Install Node.js 22.12 or newer and pnpm 10.
2. Open this repository folder in VS Code and accept the recommended Svelte extension.
3. Run `pnpm install`.
4. Copy `.env.example` to `.env` in the repository root. To use chat outside Replit, set your own `OPENAI_API_KEY` in that file. Never commit this file. Maps and public weather feeds do not require a key.
5. Run **Tasks: Run Task → Weather: start development** from the VS Code command palette.
6. Open `http://localhost:5173`. Optionally launch **Weather: debug browser** from Run and Debug.

The frontend runs on 5173 and its local-only Vite proxy forwards `/api` to the API on 5000. The backend watches TypeScript source. Stop development terminals with Ctrl+C. On Replit, use the configured workflows rather than the local VS Code tasks; AI credentials are supplied by Replit AI Integrations.

Manual local terminals:

```sh
pnpm --filter @workspace/api-server run dev:local
```

```sh
# macOS/Linux; VS Code tasks also work across platforms.
LOCAL_DEV=1 PORT=5173 BASE_PATH=/ pnpm --filter @workspace/weather-explorer run dev
```

## Data and limitations

- Radar: RainViewer, subject to its coverage, resolution, and availability.
- Weather, cloud cover, temperature, and wind: Open-Meteo forecasts/model-derived current conditions, not an official station-observation network. Point markers are samples, not a continuous gridded analysis.
- Place search: Open-Meteo geocoding. Include a state for ambiguous city names.
- Chat: OpenAI, grounded in fetched weather for the selected or mentioned location. A recognized location recenters the map. Follow-up questions retain location context. Chat cannot directly inspect radar imagery.
- Source failures are displayed rather than replaced with simulated weather. Internet access is required.
- Weather data is not for emergency, aviation, or navigation decisions. Check https://weather.gov for official warnings.
- Open-Meteo free access has usage/licensing restrictions, including noncommercial limits. Review provider terms and obtain an appropriate plan before commercial/high-volume deployment. Map tile and radar providers also impose usage limits.

## Project

- `artifacts/weather-explorer`: Svelte + Vite frontend.
- `artifacts/api-server`: Express API; `/api/weather/chat`.
- `lib/api-spec/openapi.yaml`: API contract; regenerate with `pnpm --filter @workspace/api-spec run codegen`.
- `.vscode`: development tasks, recommended extensions, browser debugger.

No database is required. Chat context is sent from the browser rather than stored on the server. Server caches public weather responses for five minutes. AI keys stay server-side. For an unrestricted public release, add user authentication and per-user quotas; the initial API has basic in-process rate/concurrency limits, not distributed abuse protection.