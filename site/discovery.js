/**
 * The machine faces every Foundation site carries, the same on each: robots.txt, sitemap.xml, llms.txt and
 * llms-full.txt, a markdown twin of every page, index.json, and the JSON-LD and alternate links in each page's head.
 *
 * This file is the same, byte for byte, in standards.org.ai, insurance.org.ai and law.org.ai. Each site's build.js
 * calls it with its own pages and data, after the pages themselves are built, so the twins say what the pages say.
 */

const BOTS = ["*", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot"];

/* The Foundation's sites, each in one line taken from its own page. */
const SITES = [
  { host: "foundation.org.ai", what: "The Org.AI Foundation's open record of human work: 1,016 occupations and 18,796 tasks, each traced to its source." },
  { host: "schema.org.ai", what: "Every Schema.org term, as published, and the .org.ai superset the Foundation adds." },
  { host: "standards.org.ai", what: "The Foundation's register of standards: other bodies' collections, quoted and credited, beside the six standards the Foundation writes." },
  { host: "insurance.org.ai", what: "Which acts in insurance need a license, and the 56 regulators that issue it." },
  { host: "law.org.ai", what: "Which acts of legal help are reserved to licensed humans, and which a lawyer may supervise a machine in doing." },
  { host: "mdx.org.ai", what: "The MDX documentation: structured data, unstructured content, executable code and UI components in one format." },
  { host: "primitives.org.ai", what: "The fundamental abstractions for building AI-native software." },
];

const ORG_ID = "https://foundation.org.ai/#org";
const ORG = { "@type": "NGO", "@id": ORG_ID, name: "Org.AI Foundation", url: "https://foundation.org.ai/", logo: "https://foundation.org.ai/apple-touch-icon.png", sameAs: ["https://github.com/dot-org-ai"] };
const MCP = { url: "https://foundation.org.ai/mcp", transport: "streamable-http", about: "the Foundation's record of work" };

const origin = (host) => "https://" + host;
/* a count under eleven in words, as the pages write them; larger ones in figures */
const words = (n) => (n >= 0 && n <= 10 ? ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] : n.toLocaleString("en-US"));
/* a page's markdown nested under a heading of llms-full.txt: every heading two levels down */
const nest = (md) => md.replace(/^(#{1,4}) /gm, "##$1 ");

function robots(host, what) {
  const o = origin(host);
  return `# ${host}: ${what} Every page and machine face is open to search engines, AI crawlers and agents.
# Agents: start at ${o}/llms.txt (${o}/llms-full.txt carries everything in one file)
# and ${o}/index.json. The Foundation's record of work answers over MCP at ${MCP.url}

${BOTS.map((b) => `User-agent: ${b}\nContent-Signal: search=yes, ai-input=yes, ai-train=yes\nAllow: /\n`).join("\n")}
Sitemap: ${o}/sitemap.xml
`;
}

function sitemap(host, pages) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${origin(host)}${p.path}</loc></url>`).join("\n")}
</urlset>
`;
}

/* ---------------- HTML to markdown ----------------
   A small parser for the sites' own hand-written pages: tags and text into a tree, then the tree into markdown. What a
   reader is not meant to see (aria-hidden, hidden, scripts, drawings, forms) is left out; screen-reader text is kept,
   since it is part of what the page says. */

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const RAW = new Set(["script", "style", "textarea", "title"]);
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rarr: "→", larr: "←", darr: "↓", uarr: "↑", middot: "·", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…", ndash: "–", sect: "§", copy: "©" };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => (e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e.toLowerCase()] ?? m));

function parse(html) {
  const root = { tag: "#root", attrs: {}, kids: [] };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+|<)/g;
  let m;
  while ((m = re.exec(html))) {
    const top = stack[stack.length - 1];
    if (m[1]) {
      const t = m[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === t) { stack.length = i; break; }
    } else if (m[2]) {
      const tag = m[2].toLowerCase(), attrs = {};
      for (const a of (m[3] || "").matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[a[1].toLowerCase()] = decode(a[2] ?? a[3] ?? a[4] ?? "");
      const node = { tag, attrs, kids: [] };
      top.kids.push(node);
      if (RAW.has(tag)) {
        const end = html.toLowerCase().indexOf("</" + tag, re.lastIndex);
        node.raw = html.slice(re.lastIndex, end < 0 ? html.length : end);
        re.lastIndex = end < 0 ? html.length : html.indexOf(">", end) + 1;
      } else if (!VOID.has(tag) && !m[4]) stack.push(node);
    } else if (m[5] !== undefined) top.kids.push({ text: m[5] });
  }
  return root;
}

const cls = (n) => " " + (n.attrs?.class || "") + " ";
const SKIP_TAGS = new Set(["script", "style", "svg", "template", "noscript", "form", "button", "input", "select", "textarea", "label", "img", "picture", "video", "audio", "iframe", "canvas", "head", "title", "meta", "link"]);
const BLOCK = new Set(["p", "div", "section", "article", "header", "footer", "main", "nav", "aside", "figure", "figcaption", "ul", "ol", "li", "dl", "dt", "dd", "table", "thead", "tbody", "tr", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "hr", "fieldset"]);

function findMain(node) {
  if (node.tag === "main") return node;
  for (const k of node.kids || []) { const f = k.tag && findMain(k); if (f) return f; }
  return null;
}

function toMarkdown(html, pageUrl, { skip = [] } = {}) {
  const abs = (h) => { try { return new URL(h, pageUrl).href; } catch { return h; } };
  const hidden = (n) => n.tag && (SKIP_TAGS.has(n.tag) || n.attrs["aria-hidden"] === "true" || "hidden" in n.attrs || skip.some((c) => cls(n).includes(" " + c + " ")));
  const isBlock = (n) => n.tag && BLOCK.has(n.tag);

  /* inline text of a node: links, emphasis, quotes, code */
  function inline(n) {
    if (n.text !== undefined) return decode(n.text).replace(/\s+/g, " ");
    if (hidden(n)) return "";
    const inner = () => n.kids.map(inline).join("");
    switch (n.tag) {
      case "br": return "\n";
      case "a": {
        const t = inner().trim(), href = n.attrs.href;
        if (!t) return "";
        return href && !href.startsWith("javascript:") ? `[${t}](${abs(href)})` : t;
      }
      case "strong": case "b": { const t = inner().trim(); return t ? `**${t}**` : ""; }
      case "em": case "i": case "cite": { const t = inner().trim(); return t ? `_${t}_` : ""; }
      case "q": { const t = inner().trim(); return t ? `“${t}”` : ""; }
      case "code": case "kbd": { const t = inner(); return t ? "`" + t + "`" : ""; }
      default: {
        // the design's label and its note under a value, as the eye reads them: "Label: value. Note"
        if (cls(n).includes(" k ")) { const t = inner().trim(); return t ? `**${t}**\u0002` : ""; }
        if (cls(n).includes(" sub ")) { const t = inner().trim(); return t ? "\u0001" + t : ""; }
        return inner();
      }
    }
  }
  const clean = (s) => s
    .replace(/\s*\u0002\s*/g, ": ")
    .replace(/([.!?:;,][*_”’"]*)?\s*\u0001/g, (m, p) => (p ? p + " " : ". "))
    .replace(/\)\[/g, ") · [")
    // two sentences the design sets side by side, with nothing between them in the markup
    .replace(/([a-z0-9)”][.!?])([A-Z“])/g, "$1 $2")
    .replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim();
  /* a definition list as lines of "**term**: definition", a list inside a definition run together with semicolons */
  function defs(n) {
    const items = [];
    let dt = "";
    const ddText = (c) => {
      const lists = c.kids.filter((x) => (x.tag === "ul" || x.tag === "ol") && !hidden(x));
      if (!lists.length) return clean(inline(c));
      return lists.flatMap((l) => l.kids.filter((li) => li.tag === "li" && !hidden(li)).map((li) => clean(inline(li)))).join("; ");
    };
    const walk = (c) => { if (hidden(c)) return; if (c.tag === "dt") dt = clean(inline(c)); else if (c.tag === "dd") items.push(`**${dt}**: ${ddText(c)}`); else (c.kids || []).forEach(walk); };
    n.kids.forEach(walk);
    return items;
  }
  /* every block in a list item, run together as one line: a heading in bold, then its words. In a numbered list, a
     badge that repeats the item's own number is left out, since the list numbers it. */
  function itemLine(n, number) {
    const parts = [];
    const walk = (k) => {
      if (hidden(k)) return;
      if (k.tag === "dl") { parts.push({ t: "", block: true, defs: defs(k) }); return; }
      if (k.text !== undefined || !isBlock(k)) { const t = inline(k); if (parts.length && !parts[parts.length - 1].block) parts[parts.length - 1].t += t; else parts.push({ t, block: false }); return; }
      if (/^h[1-6]$/.test(k.tag)) { const t = clean(inline(k)); if (t) parts.push({ t: `**${t}**`, block: true, head: true }); return; }
      if (k.tag === "ul" || k.tag === "ol") { parts.push({ t: "", block: true, list: k }); return; }
      k.kids.forEach(walk);
      parts.push({ t: "", block: true });
    };
    n.kids.forEach(walk);
    let line = "", sub = [], dl = [];
    for (const p of parts) {
      if (p.list) { sub.push(p.list); continue; }
      if (p.defs) { dl.push(...p.defs); continue; }
      const t = clean(p.t);
      if (!t) continue;
      if (!line && number !== undefined && (t === String(number) || t === String(number).padStart(2, "0"))) continue;
      if (!line) line = t;
      else if (/\*\*$/.test(line) && line.startsWith("**") && !line.slice(2, -2).includes("**")) line += ": " + t;
      else line += (/[.!?:;,]$/.test(line) ? " " : ". ") + t;
    }
    // a link that opens with the item's own number, as an index of the list below does
    if (number !== undefined) line = line.replace(new RegExp("^\\[0?" + number + "(?=[A-Z])"), "[");
    return { line, sub, dl };
  }
  function list(n, depth) {
    const ordered = n.tag === "ol";
    let i = +(n.attrs.start || 1);
    const out = [];
    for (const li of n.kids.filter((k) => k.tag === "li" && !hidden(k))) {
      const { line, sub, dl } = itemLine(li, ordered ? i : undefined);
      if (line) out.push("  ".repeat(depth) + (ordered ? `${i++}. ` : "- ") + line);
      for (const d of dl) out.push("  ".repeat(depth + 1) + "- " + d);
      for (const s of sub) out.push(list(s, depth + 1));
    }
    return out.filter(Boolean).join("\n");
  }
  function table(n) {
    const rows = [];
    const walk = (k) => { if (hidden(k)) return; if (k.tag === "tr") rows.push(k.kids.filter((c) => c.tag === "th" || c.tag === "td").map((c) => clean(inline(c)).replace(/\|/g, "\\|"))); else (k.kids || []).forEach(walk); };
    walk(n);
    if (!rows.length) return "";
    const cap = n.kids.find((k) => k.tag === "caption");
    const w = Math.max(...rows.map((r) => r.length));
    const line = (r) => "| " + Array.from({ length: w }, (_, i) => r[i] || "").join(" | ") + " |";
    return (cap ? clean(inline(cap)) + "\n\n" : "") + [line(rows[0]), "| " + Array(w).fill("---").join(" | ") + " |", ...rows.slice(1).map(line)].join("\n");
  }
  function blocks(n) {
    const out = [];
    let run = "";
    const flush = () => { const t = clean(run); if (t) out.push(t); run = ""; };
    for (const k of n.kids) {
      if (hidden(k)) continue;
      if (k.text !== undefined || !isBlock(k)) { run += inline(k); continue; }
      flush();
      const t = k.tag;
      if (/^h[1-6]$/.test(t)) { const s = clean(inline(k)); if (s) out.push("#".repeat(+t[1]) + " " + s); }
      else if (t === "ul" || t === "ol") { const s = list(k, 0); if (s) out.push(s); }
      else if (t === "dl") {
        const items = [];
        let dt = "";
        const walk = (c) => { if (hidden(c)) return; if (c.tag === "dt") dt = clean(inline(c)); else if (c.tag === "dd") { items.push(`- **${dt}**: ${clean(inline(c))}`); } else (c.kids || []).forEach(walk); };
        k.kids.forEach(walk);
        if (items.length) out.push(items.join("\n"));
      }
      else if (t === "table") { const s = table(k); if (s) out.push(s); }
      else if (t === "blockquote") { const s = blocks(k); if (s) out.push(s.split("\n").map((l) => "> " + l).join("\n")); }
      else if (t === "hr") out.push("---");
      else if (t === "p" || t === "figcaption" || t === "dt" || t === "dd" || t === "pre") { const s = clean(inline(k)); if (s) out.push(s); }
      else { const s = blocks(k); if (s) out.push(s); }
    }
    flush();
    return out.join("\n\n");
  }
  const main = findMain(parse(html));
  if (!main) throw new Error("discovery: the page has no <main>");
  return blocks(main).replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/* ---------------- the page's own head ---------------- */

function meta(html) {
  const get = (re) => decode((html.match(re) || [])[1] || "");
  return {
    title: get(/<title>([^<]*)<\/title>/i),
    description: get(/<meta name="description" content="([^"]*)"/i),
    canonical: get(/<link rel="canonical" href="([^"]*)"/i),
  };
}

const ldScript = (graph) => `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c")}</script>`;

/* The nodes every page carries: the Foundation, the site, the page, and on a page below the home page its trail. */
function pageGraph(host, siteName, page, m, extra = []) {
  const o = origin(host), url = o + page.path;
  const site = { "@type": "WebSite", "@id": o + "/#website", name: siteName, url: o + "/", inLanguage: "en", publisher: { "@id": ORG_ID } };
  const web = { "@type": "WebPage", "@id": url, url, name: m.title, description: m.description, isPartOf: { "@id": o + "/#website" }, inLanguage: "en" };
  const graph = [ORG, site, web];
  if (page.path !== "/") {
    web.breadcrumb = { "@id": url + "#breadcrumb" };
    graph.push({ "@type": "BreadcrumbList", "@id": url + "#breadcrumb", itemListElement: [{ "@type": "ListItem", position: 1, name: siteName, item: o + "/" }, { "@type": "ListItem", position: 2, name: page.crumb || m.title, item: url }] });
  }
  return graph.concat(extra);
}

/* Put the alternates and the JSON-LD into a built page's head, after its canonical link. */
function intoHead(html, host, page, graph) {
  const o = origin(host);
  const tags = [`<link rel="alternate" type="text/markdown" href="${o}${page.md}" title="This page as markdown">`];
  if (page.path === "/") tags.push(`<link rel="alternate" type="application/json" href="${o}/index.json" title="This site's machine index">`);
  tags.push(ldScript(graph));
  const at = html.search(/<link rel="canonical" [^>]*>/i);
  if (at < 0) throw new Error("discovery: " + page.path + " has no canonical link");
  const end = html.indexOf(">", at) + 1;
  return html.slice(0, end) + "\n" + tags.join("\n") + html.slice(end);
}

/* ---------------- llms.txt, llms-full.txt, index.json ---------------- */

const link = (name, url, what) => `- [${name}](${url})${what ? ": " + what : ""}`;

function machineLines(host, pages, data = []) {
  const o = origin(host);
  return [
    link("index.json", o + "/index.json", "this site's pages, machine faces and the Foundation's other sites, as JSON"),
    link("llms-full.txt", o + "/llms-full.txt", "every page's words and the site's data in one markdown file"),
    ...pages.map((p) => link(p.md.slice(1), o + p.md, (p.path === "/" ? "the home page" : "the page " + p.path) + " as markdown, also served at " + o + p.path + " for Accept: text/markdown")),
    ...data.map((d) => link(d.name, d.url, d.what)),
    link("sitemap.xml", o + "/sitemap.xml", "every page"),
    link("robots.txt", o + "/robots.txt", "open to every crawler: search, AI answers and AI training"),
    link("The Foundation's MCP server", MCP.url, "the record of work over the Model Context Protocol (Streamable HTTP, keyless, read-only)"),
  ].join("\n");
}
const siteLines = (host) => SITES.filter((s) => s.host !== host).map((s) => link(s.host, origin(s.host) + "/", s.what)).join("\n");

function indexJson(host, { name, description, license, pages, data = [] }) {
  const o = origin(host);
  return JSON.stringify({
    name, url: o + "/", description,
    publisher: { name: "Org.AI Foundation", url: "https://foundation.org.ai/" },
    license,
    pages: pages.map((p) => ({ url: o + p.path, title: p.title, markdown: o + p.md })),
    machine: {
      llms: o + "/llms.txt", llmsFull: o + "/llms-full.txt", sitemap: o + "/sitemap.xml", robots: o + "/robots.txt",
      ...Object.fromEntries(data.map((d) => [d.key, d.url])),
    },
    mcp: MCP,
    sites: SITES.map((s) => ({ host: s.host, url: origin(s.host) + "/", what: s.what })),
  }, null, 2) + "\n";
}

module.exports = { words, nest, parse, BOTS, SITES, ORG, ORG_ID, MCP, origin, robots, sitemap, toMarkdown, meta, ldScript, pageGraph, intoHead, link, machineLines, siteLines, indexJson, decode };
