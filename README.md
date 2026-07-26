# 🍁 CanaStream

Search for titles streaming in **Canada** across Netflix, Disney+, Prime Video, and Crave — in a single, self-contained web page.

CanaStream queries [The Movie Database (TMDB)](https://www.themoviedb.org/) with `watch_region=CA`, so results reflect what's actually streamable in the Canadian region.

## Features

- **Search a title** — find a specific movie or show and see which of your selected services carry it in Canada.
- **Browse by service** — list popular titles currently available on the services you pick.
- **Trending now** — TMDB's most-searched/most-popular titles this week, filtered to what's streamable in Canada on your selected services.
- **Upcoming** — upcoming theatrical movie releases in Canada plus TV shows with a future first-air date, merged and sorted by soonest, each showing its release date.
- **Cost filter** — show titles that are included with a subscription (free/included), available to rent or buy (paid), or both. Each provider is labelled Included / Free / Rent / Buy.
- **Genre & score filters** — narrow the current results by genre and by minimum score (TMDB `vote_average`, 0–10). Both apply instantly to whatever is on screen, in any tab.
- **IMDb & Rotten Tomatoes** — when an OMDb key is configured, opening a title's detail drawer shows its real **IMDb** rating (and vote count, linked to IMDb) plus the **Rotten Tomatoes** critics' Tomatometer. Both come from a single OMDb lookup. (RT data is mostly available for movies; audience scores aren't exposed by OMDb.)
- **Live provider data** — provider logos come straight from TMDB's Canadian availability data.
- **Your Plex library** — when a Plex server is configured, any result you already own shows an **▶ Plex** badge, and a **My Plex** filter chip lets you narrow results to titles in your library.
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
| YouTube       | 192     |

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

### Connecting a Plex server

The app can cross-reference your own Plex Media Server. Add two more Worker
secrets:

| Secret            | Value                                                        |
|-------------------|--------------------------------------------------------------|
| `PLEX_SERVER_URL` | Base URL of your Plex server, e.g. `https://xxx.plex.direct:32400` |
| `PLEX_TOKEN`      | Your Plex auth token (`X-Plex-Token`)                        |

```bash
npx wrangler secret put PLEX_SERVER_URL
npx wrangler secret put PLEX_TOKEN
```

`worker.js` exposes a secure `/api/plex` proxy that forwards a universal search
to your server with the token attached — the token and URL never reach the
browser. When both secrets are set, the page shows the **▶ Plex** badge and the
**My Plex** filter chip automatically.

> **Reachability:** Cloudflare runs the proxy at the edge, so `PLEX_SERVER_URL`
> must be reachable from the public internet with a **valid TLS certificate**. A
> LAN address like `http://192.168.x.x:32400` will not work. The simplest
> option is Plex's own `https://<id>.plex.direct:32400` domain (remote access
> enabled), which ships a trusted cert; a Cloudflare Tunnel to your server also
> works.

### Adding true IMDb ratings (OMDb)

The detail drawer can show a title's real IMDb rating via the free
[OMDb API](https://www.omdbapi.com/). Get a key
([omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx) — the free tier
allows 1,000 lookups/day) and add it as a Worker secret:

| Secret          | Value                       |
|-----------------|-----------------------------|
| `OMDB_API_KEY`  | Your OMDb API key           |

```bash
npx wrangler secret put OMDB_API_KEY
```

`worker.js` exposes a secure `/api/omdb` proxy (edge-cached for a day, since
these ratings change slowly). When the secret is set, opening a title fetches
its `imdb_id` from TMDB, looks it up on OMDb, and shows **IMDb** and **Rotten
Tomatoes** badges in the drawer — both parsed from the same response. If the key
is absent the app simply omits the badges — nothing else changes.

## License

MIT — see [LICENSE](LICENSE).
