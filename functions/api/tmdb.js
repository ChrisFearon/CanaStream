// Cloudflare Pages Function — secure TMDB proxy.
// Holds the TMDB API key server-side as a secret (env.TMDB_API_KEY) so it is
// never exposed to the browser. The client calls /api/tmdb?path=/search/multi&query=...
// and this function forwards the request to TMDB with the key attached.

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

export async function onRequest(context) {
  const { request, env } = context;
  const reqUrl = new URL(request.url);
  const path = reqUrl.searchParams.get("path");

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
  reqUrl.searchParams.forEach((value, name) => {
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
