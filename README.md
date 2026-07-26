# 🍁 CanaStream

Search for titles streaming in **Canada** across Netflix, Disney+, Prime Video, and Crave — in a single, self-contained web page.

CanaStream queries [The Movie Database (TMDB)](https://www.themoviedb.org/) with `watch_region=CA`, so results reflect what's actually streamable in the Canadian region.

## Features

- **Search a title** — find a specific movie or show and see which of your selected services carry it in Canada.
- **Browse by service** — list popular titles currently available on the services you pick.
- **Trending now** — TMDB's most-searched/most-popular titles this week, filtered to what's streamable in Canada on your selected services.
- **Live provider data** — provider logos come straight from TMDB's Canadian availability data.
- **No build step** — one HTML file, opens in any modern browser.

## Setup

1. Get a free TMDB API key: [themoviedb.org → Settings → API](https://www.themoviedb.org/settings/api) (use the **v3 API Read** key).
2. Open `index.html` in your browser.
3. Paste your API key into the field at the top, pick your services, and search.

> Your API key stays in the page during your session only — it is never stored or transmitted anywhere except to TMDB.

## Services & TMDB provider IDs (Canada)

| Service       | TMDB ID |
|---------------|---------|
| Netflix       | 8       |
| Disney+       | 337     |
| Prime Video   | 9       |
| Crave         | 230     |
| Apple TV+     | 350     |

## Notes

- Availability reflects "streamable in Canada," not "Canadian-produced" — TMDB does not expose a CanCon flag.
- Data and images courtesy of TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.

## Deploy (Cloudflare Pages)

This repo is deploy-ready for Cloudflare Pages via GitHub integration:

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Pick the `CanaStream` repo.
3. Build settings: **Framework preset = None**, **Build command = (leave empty)**, **Build output directory = `/`**.
4. **Save and Deploy.** Every push to `main` redeploys automatically.

`_headers` sets security/caching headers; `wrangler.toml` declares the static output dir.

## License

MIT — see [LICENSE](LICENSE).
