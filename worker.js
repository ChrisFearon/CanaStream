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
  "/configuration",
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/tmdb") {
      return handleTmdb(url, env);
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

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
