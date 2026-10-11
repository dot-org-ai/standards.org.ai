/**
 * standards.org.ai, the build.
 *
 *   src/     is written by hand: the register page, the 404 page and the font.
 *   public/  is generated here, and is what wrangler serves. Do not edit it.
 *
 * The register shares its design, header and footer with foundation.org.ai. The hero's shelf is counted from the
 * repository's .data when this runs (shelf.js), so its figures are never older than the build.
 */

const fs = require("fs");
const path = require("path");
const shelf = require("./shelf.js");

const SRC = path.join(__dirname, "src");
const OUT = path.join(__dirname, "public");

// empty public/ rather than replace it, so a running `wrangler dev` keeps watching the same folder
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) fs.rmSync(path.join(OUT, f), { recursive: true, force: true });
// find.js is the Foundation's search, the same file on every Foundation site: built in dot-org-ai/foundation.org.ai, copied here
for (const f of ["index.html", "404.html", "find.js", "og.png", "favicon.ico", "favicon.svg", "apple-touch-icon.png"]) fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
fs.cpSync(path.join(SRC, "fonts"), path.join(OUT, "fonts"), { recursive: true });

// the hero's shelf, drawn from the register and counted from ../.data
const MARK = "<!-- shelf: drawn by shelf.js at build time -->";
const page = fs.readFileSync(path.join(SRC, "index.html"), "utf8");
if (page.split(MARK).length !== 2) throw new Error("build: index.html should hold the shelf's mark once");
const drawn = shelf.build(page, path.join(__dirname, "..", ".data"));
// every count of collections typed into the page (its description, its share text) must be the one the shelf counted
for (const m of page.matchAll(/(\d+) collections/g)) if (+m[1] !== drawn.collections) throw new Error(`build: the page says ${m[1]} collections, and the register holds ${drawn.collections}`);
const built = page.replace(MARK, drawn.figure);
console.log(`  shelf       ${drawn.collections} collections, ${drawn.total.toLocaleString("en-US")} rows, ${drawn.whole} whole`);

/* ---------------- the machine faces (discovery.js) ----------------
   robots.txt, sitemap.xml, llms.txt and llms-full.txt, the page's markdown twin, index.json, and the JSON-LD and
   alternate links in the page's head. Every figure in them is the shelf's own count, made above. */
const D = require("./discovery.js");
const HOST = "standards.org.ai", O = D.origin(HOST);
const fmt = (n) => n.toLocaleString("en-US");
const m = D.meta(built);
const home = { path: "/", md: "/index.md", title: m.title };
const ours = drawn.sections.find((s) => s.ours), copied = drawn.sections.filter((s) => !s.ours);
const homes = {}; // our standards' own sites, as the register links them
for (const [, id, li] of built.matchAll(/<li class="std" id="(std-[^"]+)"[^>]*>([\s\S]*?)<\/li>/g)) {
  const h = li.match(/<span class="home">([\s\S]*?)<\/span>/);
  if (h) homes[id] = [...h[1].matchAll(/href="([^"]+)"/g)].map((x) => x[1]);
}
for (const b of ours.items) if (!homes[b.id] || !homes[b.id].length) throw new Error("build: our standard " + b.name + " has no site on the register");
const secRows = (s) => s.items.reduce((n, b) => n + (b.rows || 0), 0);
const summary = `The Org.AI Foundation's register of standards: ${drawn.collections} collections quoted from the bodies that publish them, beside the ${D.words(ours.items.length)} standards the Foundation writes itself.`;
const about = `The first shelf holds other bodies' standards, quoted as published and credited, each row naming its body, the version loaded and the terms of use: ${fmt(drawn.total)} rows in ${drawn.collections} collections, ${drawn.whole} of them held whole, counted from the repository's data when this file was built. The second shelf holds the ${D.words(ours.items.length)} standards the Foundation writes itself, each with its own site. Nothing here is generated at request time.`;

// the page, with its JSON-LD: the register as a list, each collection by its row on the page, ours by their own sites
const graph = D.pageGraph(HOST, "standards.org.ai", home, m, [{
  "@type": "ItemList", "@id": O + "/#register", name: "The register of standards", numberOfItems: drawn.collections + ours.items.length,
  itemListElement: drawn.sections.flatMap((s) => s.items).map((b, i) => ({
    "@type": "ListItem", position: i + 1,
    item: s_item(b),
  })),
}]);
function s_item(b) {
  const it = { "@type": "CreativeWork", name: b.name, description: b.what, url: O + "/#" + b.id };
  if (b.k === "ours") { it.url = homes[b.id][0]; it.creator = { "@id": D.ORG_ID }; if (homes[b.id].length > 1) it.sameAs = homes[b.id].slice(1); }
  return it;
}
fs.writeFileSync(path.join(OUT, "index.html"), D.intoHead(built, HOST, home, graph));
const pageMd = D.toMarkdown(built, O + "/", { skip: ["sh-plot", "sh-key"] });
fs.writeFileSync(path.join(OUT, "index.md"), pageMd + `\nThis page as HTML: ${O}/. Everything on this site in one file: ${O}/llms-full.txt.\n`);

const KIND = { whole: "Whole", part: "In part", ours: "Ours" };
fs.writeFileSync(path.join(OUT, "llms.txt"), `# standards.org.ai

> ${summary}

${about}

## The register

${D.link("The register", O + "/", "every collection, by section: what it holds, the version loaded and the terms it is held on")}
${copied.map((s) => D.link(s.name, O + "/#" + s.id, `${s.items.length} collections, ${s.items.filter((b) => b.k === "part").length} held in part; ${fmt(secRows(s))} rows`)).join("\n")}
${D.link("Our standards", O + "/#ours", `the ${D.words(ours.items.length)} standards the Foundation writes itself`)}
${D.link("How we cite", O + "/#cite", "the source line every record carries, traced back to its publisher")}

## Our standards

${ours.items.map((b) => D.link(b.name, homes[b.id][0], b.what)).join("\n")}

## Machine faces

${D.machineLines(HOST, [home])}

## The data

${D.link("dot-org-ai/standards.org.ai", "https://github.com/dot-org-ai/standards.org.ai", "every collection as TSV, with the code that loads it and the counts above")}

## The Foundation's sites

${D.siteLines(HOST)}

## Licence

${D.link("Each collection's terms", O + "/#register", "free to reuse on its publisher's terms, as its row on the register states")}
${D.link("The code", "https://github.com/dot-org-ai/standards.org.ai", "public, on GitHub")}
`);

fs.writeFileSync(path.join(OUT, "llms-full.txt"), `# standards.org.ai, in full

> ${summary}

${about}

## The page: ${O}/

${D.nest(pageMd)}
## Rows and links for each collection

Rows are the repository's .data files for the collection, header excluded. Links are the rows of .data/relationships that run inside the collection or between it and another; a link between two collections counts for both.

| Collection | Section | Held | Rows | Links |
| --- | --- | --- | --- | --- |
${copied.flatMap((s) => s.items.map((b) => `| ${b.name} | ${s.name} | ${KIND[b.k]} | ${fmt(b.rows)} | ${fmt(b.links)} |`)).join("\n")}

## Our standards

${ours.items.map((b) => `- **${b.name}**: ${b.what}. ${homes[b.id].join(", ")}`).join("\n")}

## The Foundation's sites

${D.siteLines(HOST)}
`);

fs.writeFileSync(path.join(OUT, "index.json"), D.indexJson(HOST, {
  name: "standards.org.ai", description: summary,
  license: "Every collection here is free to reuse on its publisher's terms, as its row on the register states, and the code that loads them is public.",
  pages: [home],
  data: [{ key: "github", url: "https://github.com/dot-org-ai/standards.org.ai" }],
}));
fs.writeFileSync(path.join(OUT, "robots.txt"), D.robots(HOST, "the Org.AI Foundation's register of standards."));
fs.writeFileSync(path.join(OUT, "sitemap.xml"), D.sitemap(HOST, [home]));

for (const f of ["index.html", "index.md", "llms.txt", "llms-full.txt", "index.json", "robots.txt", "sitemap.xml", "404.html"]) {
  console.log("  " + f.padEnd(12) + String(fs.statSync(path.join(OUT, f)).size).padStart(8) + " bytes");
}
