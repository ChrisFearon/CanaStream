// CanaStream Worker
// Serves the static site (from the `public/` assets directory) and exposes a
// secure TMDB proxy at /api/tmdb. The TMDB key lives in env.TMDB_API_KEY as a
// Worker secret, so it is never exposed to the browser.

const TMDB_BASE = "https://api.themoviedb.org/3";

// Only allow the read-only endpoints this app actually uses.
const ALLOWED_PREFIXES = [
  "/search/",
  "/discover/",
  "/trending/",
  "/movie/",
  "/tv/",
  "/genre/",
  "/configuration",
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/tmdb") {
      return handleTmdb(url, env);
    }

    if (url.pathname === "/api/plex") {
      return handlePlex(url, env);
    }

    if (url.pathname === "/api/omdb") {
      return handleOmdb(url, env);
    }

    // Everything else: serve static assets (index.html, etc.).
    return env.ASSETS.fetch(request);
  },
};

async function handleTmdb(url, env) {
  const path = url.searchParams.get("path");

  if (!path || !path.startsWith("/")) {
    return json({ error: "missing_or_invalid_path" }, 400);
  }
  if (!ALLOWED_PREFIXES.some((p) => path.startsWith(p))) {
    return json({ error: "path_not_allowed" }, 403);
  }

  const key = env.TMDB_API_KEY;
  if (!key) {
    // No secret configured yet — signal the client to fall back to manual key.
    return json({ error: "not_configured" }, 503);
  }

  const tmdbUrl = new URL(TMDB_BASE + path);
  url.searchParams.forEach((value, name) => {
    if (name !== "path") tmdbUrl.searchParams.set(name, value);
  });
  tmdbUrl.searchParams.set("api_key", key);

  const upstream = await fetch(tmdbUrl.toString(), {
    headers: { accept: "application/json" },
  });
  const body = await upstream.text();

  return new Response(body, {
    status: upstream.status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Cache reads at the edge for 5 minutes to spare your TMDB quota.
      "cache-control": "public, max-age=300",
    },
  });
}

// Secure proxy to a personal Plex Media Server. The server URL and token live
// in env.PLEX_SERVER_URL / env.PLEX_TOKEN as Worker secrets, so they are never
// exposed to the browser. With no `query`, this acts as a config probe.
async function handlePlex(url, env) {
  const base = env.PLEX_SERVER_URL;
  const token = env.PLEX_TOKEN;

  if (!base || !token) {
    // Secrets not set — tell the client Plex is unavailable.
    return json({ error: "not_configured" }, 503);
  }

  const query = url.searchParams.get("query");
  if (!query) {
    // Lightweight probe used by the UI to decide whether to show Plex features.
    return json({ configured: true }, 200);
  }

  // Plex's universal search hub. Token is passed as a query param and never
  // forwarded to the browser.
  const plexUrl = new URL(base.replace(/\/+$/, "") + "/hubs/search");
  plexUrl.searchParams.set("query", query);
  plexUrl.searchParams.set("limit", "20");
  plexUrl.searchParams.set("X-Plex-Token", token);

  let upstream;
  try {
    upstream = await fetch(plexUrl.toString(), {
      headers: { accept: "application/json" },
    });
  } catch (e) {
    // Most common cause: the server URL is not reachable from Cloudflare's
    // edge (a LAN address) or presents an untrusted TLS certificate.
    return json({ error: "plex_unreachable", detail: String(e) }, 502);
  }

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Personal data — keep it out of shared/edge caches, brief client cache.
      "cache-control": "private, max-age=60",
    },
  });
}

// Secure proxy to OMDb (omdbapi.com) for true IMDb ratings. The key lives in
// env.OMDB_API_KEY as a Worker secret. With no `i`/`t`, acts as a config probe.
async function handleOmdb(url, env) {
  const key = env.OMDB_API_KEY;
  if (!key) {
    return json({ error: "not_configured" }, 503);
  }

  const i = url.searchParams.get("i"); // IMDb id, e.g. tt0111161
  const t = url.searchParams.get("t"); // title fallback
  if (!i && !t) {
    // Probe used by the UI to decide whether to show IMDb ratings.
    return json({ configured: true }, 200);
  }
  if (i && !/^tt\d+$/i.test(i)) {
    return json({ error: "invalid_imdb_id" }, 400);
  }

  const omdb = new URL("https://www.omdbapi.com/");
  if (i) {
    omdb.searchParams.set("i", i);
  } else {
    omdb.searchParams.set("t", t);
    const y = url.searchParams.get("y");
    if (y) omdb.searchParams.set("y", y);
  }
  omdb.searchParams.set("apikey", key);

  let upstream;
  try {
    upstream = await fetch(omdb.toString(), { headers: { accept: "application/json" } });
  } catch (e) {
    return json({ error: "omdb_unreachable", detail: String(e) }, 502);
  }

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // IMDb ratings change slowly — cache a day at the edge.
      "cache-control": "public, max-age=86400",
    },
  });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
