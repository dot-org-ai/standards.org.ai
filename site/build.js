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
fs.writeFileSync(path.join(OUT, "index.html"), page.replace(MARK, drawn.figure));
console.log(`  shelf       ${drawn.collections} collections, ${drawn.total.toLocaleString("en-US")} rows, ${drawn.whole} whole`);

for (const f of ["index.html", "404.html"]) {
  console.log("  " + f.padEnd(12) + String(fs.statSync(path.join(OUT, f)).size).padStart(8) + " bytes");
}
