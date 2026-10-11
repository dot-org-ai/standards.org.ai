/**
 * standards.org.ai: the Org.AI Foundation's register of standards. Two shelves: other bodies' standards, quoted as
 * published and credited, and the few standards this Foundation writes itself.
 *
 * Serves the static files build.js writes to ./public via the ASSETS binding, and nothing generated at request time:
 *   /                    the register (its markdown twin, /index.md, for a request that prefers text/markdown)
 *   /llms.txt, /llms-full.txt, /index.md, /index.json, /robots.txt, /sitemap.xml   the machine faces
 *   404                  the design system's own refusal page
 * On standards.org.ai itself, plain http is sent to https and every response asks browsers to stay on https. Any
 * other host the Worker answers on (workers.dev, a preview) is marked noindex, so only standards.org.ai is indexed.
 * No external fetch, no data source, no analytics.
 */

const HOST = "standards.org.ai";
/* Each page and its markdown twin: a request for the page that prefers markdown gets the twin at the page's own
   address. */
const TWINS = { "/": "/index.md" };

/* Does this Accept header prefer markdown to HTML? Honours q-values; a bare text/markdown wins. */
function wantsMarkdown(accept) {
  const q = (type) => {
    let best = -1;
    for (const part of accept.split(",")) {
      const [t, ...params] = part.trim().toLowerCase().split(";");
      if (t !== type) continue;
      const qp = params.map((x) => x.trim()).find((x) => x.startsWith("q="));
      best = Math.max(best, qp ? Number(qp.slice(2)) || 0 : 1);
    }
    return best;
  };
  const md = q("text/markdown");
  return md > 0 && md >= q("text/html");
}

/* The machine faces' types, stated rather than left to the asset server's guess. */
const TYPES = { ".md": "text/markdown; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".json": "application/json; charset=utf-8", ".xml": "application/xml; charset=utf-8" };

const SEC = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "SAMEORIGIN",
  /* The page loads its style, script, font and images from this origin and from no other host. Its only requests
     elsewhere are the Foundation's search, reading the record and the vocabulary once someone reaches for it. */
  "content-security-policy":
    "default-src 'none'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "font-src 'self'; " +
    "img-src 'self' data:; " +
    // the estate's edge analytics snippet posts to this origin's /e; allow it rather than log a violation on every page.
    // The Foundation's search (find.js) reads the occupations from foundation.org.ai and Schema.org's terms from schema.org.ai.
    "connect-src 'self' https://foundation.org.ai https://schema.org.ai; " +
    "form-action 'self'; " +
    "frame-ancestors 'self'; " +
    "base-uri 'none'",
};

function withHeaders(res, extra) {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(SEC)) h.set(k, v);
  if (extra) for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const canonical = url.hostname === HOST;

    /* standards.org.ai is https only: a GET or HEAD is moved for good, anything else keeps its method. */
    if (canonical && url.protocol === "http:") {
      url.protocol = "https:";
      return new Response(null, { status: request.method === "GET" || request.method === "HEAD" ? 301 : 308, headers: { location: url.href, ...SEC } });
    }
    /* stay on https here; anywhere else, stay out of the index */
    const site = canonical ? { "strict-transport-security": "max-age=31536000" } : { "x-robots-tag": "noindex" };

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, { status: 405, headers: { allow: "GET, HEAD", ...SEC, ...site } });
    }

    /* A page asked for as markdown is answered with its twin; both answers vary on Accept. */
    const twin = TWINS[url.pathname];
    if (twin && wantsMarkdown(request.headers.get("accept") || "")) {
      const md = await env.ASSETS.fetch(new Request(new URL(twin, url), { method: request.method }));
      return withHeaders(md, { "content-type": TYPES[".md"], "cache-control": "public, max-age=300, must-revalidate", vary: "Accept", ...site });
    }

    /* Everything else is a static asset. not_found_handling serves 404.html. */
    const res = await env.ASSETS.fetch(request);

    const ct = res.headers.get("content-type") || "";

    /* The asset server returns HTML as bare `text/html` with no charset, on the
       200 and on the 404 alike. The document declares utf-8 inside the sniff
       window, but a header that says nothing leaves the decision to the client,
       so both layers state it. Every HTML response, including the 404. */
    const extra = { ...site };
    if (ct.startsWith("text/html") && !ct.includes("charset")) {
      extra["content-type"] = "text/html; charset=utf-8";
    }
    const ext = (url.pathname.match(/\.[a-z]+$/) || [""])[0];
    if (res.ok && TYPES[ext]) extra["content-type"] = TYPES[ext];
    if (twin) extra.vary = "Accept";
    // the machine index is for any program, from anywhere
    if (res.ok && url.pathname === "/index.json") extra["access-control-allow-origin"] = "*";

    /* The immutable year is gated on a successful response as well as on the
       path. A miss under /fonts/ comes back as the 404 page, and pinning that
       in the browser cache for a year is not recoverable by a redeploy. */
    extra["cache-control"] =
      res.ok && (ct.includes("font/") || url.pathname.startsWith("/fonts/"))
        ? "public, max-age=31536000, immutable"
        : "public, max-age=300, must-revalidate";

    return withHeaders(res, extra);
  },
};
