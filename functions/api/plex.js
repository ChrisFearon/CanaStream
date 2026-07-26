// Cloudflare Pages Function — secure Plex proxy.
// Mirrors handlePlex() in worker.js. Holds the personal Plex server URL and
// token server-side as secrets (env.PLEX_SERVER_URL / env.PLEX_TOKEN) so they
// are never exposed to the browser. The client calls /api/plex?query=... and
// this function forwards a universal search to the Plex server.

export async function onRequest(context) {
  const { request, env } = context;
  const reqUrl = new URL(request.url);

  const base = env.PLEX_SERVER_URL;
  const token = env.PLEX_TOKEN;

  if (!base || !token) {
    // Secrets not set — tell the client Plex is unavailable.
    return json({ error: "not_configured" }, 503);
  }

  const query = reqUrl.searchParams.get("query");
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

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
