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

Deployed as a **Cloudflare Worker with static assets** via GitHub integration.
`worker.js` serves the site from `public/` and exposes a secure TMDB proxy at
`/api/tmdb`; `wrangler.toml` wires them together.

- `public/` — static site (`index.html`, `_headers`)
- `worker.js` — Worker entry (static assets + `/api/tmdb` proxy)
- `wrangler.toml` — `main = worker.js`, assets `directory = ./public`

Every push to `main` triggers a Workers build (`wrangler deploy`) automatically.

### Storing the TMDB key as a Worker secret

The proxy reads the key from `env.TMDB_API_KEY`, so it is never exposed in the
browser and you never have to type it.

**Dashboard:** open the **canastream** Worker → **Settings** → **Variables and
secrets** → **Add** → Type **Secret**, name `TMDB_API_KEY`, paste your v3 key →
**Save**, then redeploy.

**Or via CLI:**

```bash
npx wrangler secret put TMDB_API_KEY
```

When the secret is present, the page auto-detects the proxy and hides the key
field. Opening `public/index.html` locally (no Worker) still falls back to
manual entry.

## License

MIT — see [LICENSE](LICENSE).
