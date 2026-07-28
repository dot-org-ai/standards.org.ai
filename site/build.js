/**
 * standards.org.ai — the build.
 *
 * "Not a CDN, not a same-origin subresource: one HTTP request for the entire
 * site." One document. One inline <style>. One inline <script>. One base64
 * font. One data-URI favicon. Build gate 1: the network panel shows one
 * request, the document itself. Zero others.
 *
 * So the three subresources are not shipped as subresources. They are folded
 * into the two documents here.
 *
 *   src/     is authored, and is what a human reads and edits.
 *   public/  is generated, and is what wrangler serves.
 *
 * Gate 14 (the uncompressed ceiling) is asserted, not estimated: this script
 * exits non-zero if a document exceeds it.
 *
 * `node build.js --og` re-renders src/og.png from src/og-card.html with
 * headless Chrome. Ordinary builds only copy the committed PNG and never need
 * a browser. The render runs with the working directory at src/ because the
 * card's @font-face path is relative on purpose (DESIGN-ADAPT §6.3).
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const esbuild = require("esbuild");

const SRC = path.join(__dirname, "src");
const OUT = path.join(__dirname, "public");

/**
 * Gate 14: the ceiling is foundation's 90 KB, UNCHANGED.
 *
 * DESIGN-ADAPT §8 flagged this gate as "at genuine risk on this page" —
 * forty-nine two-line register rows against foundation's seven six-name
 * specimens — and named three levers to pull before raising the number, with
 * "copy is never the lever" as the fourth. All three were pulled, because all
 * three are required anyway:
 *   1. site.js ships without the matcher, the 42-entry list, the answer
 *      states, the drain, the idle wipe and the combobox ARIA (delta 4.1).
 *      The largest single saving.
 *   2. styles.css ships without .ask / .aperture / .well / .sug / .chips /
 *      .answer / .aledger / .dquery / .spec (delta 4.5).
 *   3. The font subset is untouched: the card needs the axis up to 600, so
 *      narrowing it would buy little and risk the wrong weight on the card.
 *
 * After those three the register fits under the ceiling with room to spare, and
 * the build prints the measured size of every document on every run — that
 * printout is the number, not a figure copied into this comment where it would
 * go stale the next time a row is edited. The register did not need the gate
 * raised, so it is not raised. A ceiling that moves whenever a build approaches
 * it is not a gate.
 */
const CEILING = 90 * 1024;

const read = (p) => fs.readFileSync(path.join(SRC, p), "utf8");

/* ── the OG card, rendered only when asked ─────────────────────────────────── */

if (process.argv.includes("--og")) {
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  /* cwd: SRC. The card's font path is relative, and an absolute one falls back
     silently to the system face and ships the card in the wrong typeface. */
  execFileSync(chrome, [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1200,630",
    "--screenshot=og.png",
    "og-card.html",
  ], { cwd: SRC, stdio: "inherit" });
  const png = fs.statSync(path.join(SRC, "og.png"));
  console.log("  og.png      " + String(png.size).padStart(7) + " bytes, rendered from src/og-card.html");
}

/* ── the font, folded into the one @font-face ──────────────────────────────── */

const woff2 = fs.readFileSync(path.join(SRC, "fonts/publicsans-subset.woff2"));
const fontURI = "data:font/woff2;base64," + woff2.toString("base64");

let css = read("styles.css").replace(
  /url\("\/fonts\/publicsans-subset\.woff2"\)/,
  'url("' + fontURI + '")'
);
if (css.indexOf(fontURI) === -1) {
  throw new Error("the @font-face src did not match — the font was not inlined");
}

/* @charset is only meaningful as the first bytes of an EXTERNAL stylesheet.
   Inside <style> it is an invalid at-rule that browsers discard silently, so it
   costs nothing to render and costs the artefact a clean CSS validation. It
   stays in src/styles.css and is dropped here. The encoding is already carried
   twice over: the document's own <meta charset="utf-8"> and the worker's
   Content-Type header. */
css = css.replace(/^@charset\s+"[^"]*";\s*/i, "");

/* ── minify: no copy, no mechanism and no state is touched, only bytes ─────── */

css = esbuild.transformSync(css, { loader: "css", minify: true }).code.trim();
const js = esbuild
  .transformSync(read("site.js"), { loader: "js", minify: true, target: "es2017" })
  .code.trim();

/* ── the two documents ─────────────────────────────────────────────────────── */

const STYLE_TAG = '<link rel="stylesheet" href="/styles.css">';
const SCRIPT_TAG = '<script src="/site.js" defer></script>';

function inline(name, withScript) {
  let html = read(name);
  if (html.indexOf(STYLE_TAG) === -1) throw new Error(name + ": no stylesheet link to replace");
  html = html.replace(STYLE_TAG, "<style>" + css + "</style>");
  if (withScript) {
    if (html.indexOf(SCRIPT_TAG) === -1) throw new Error(name + ": no script tag to replace");
    html = html.replace(SCRIPT_TAG, "<script>" + js + "</script>");
  }
  return html;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "fonts"), { recursive: true });

/* the 404 carries no script at all */
const pages = [["index.html", true], ["404.html", false]];
let failed = false;

for (const [name, withScript] of pages) {
  const html = inline(name, withScript);
  fs.writeFileSync(path.join(OUT, name), html);
  const bytes = Buffer.byteLength(html);
  const over = bytes > CEILING;
  failed = failed || over;
  console.log(
    "  " + name.padEnd(12) + String(bytes).padStart(7) + " bytes" +
    "  (" + (bytes / 1024).toFixed(1) + " KB of 90)" + (over ? "  ← OVER CEILING" : "")
  );
}

/* the licence travels with the face it licenses. Nothing requests it. */
fs.copyFileSync(
  path.join(SRC, "fonts/publicsans-OFL.txt"),
  path.join(OUT, "fonts/publicsans-OFL.txt")
);

/* the OG card — fetched only by link unfurlers, never by the page itself,
   so the one-request law is untouched. */
fs.copyFileSync(path.join(SRC, "og.png"), path.join(OUT, "og.png"));

console.log(
  "  " + "(font)".padEnd(12) + String(woff2.length).padStart(7) + " bytes raw, " +
  fontURI.length + " base64, inlined"
);

if (failed) {
  console.error("\nbuild gate 14 failed: a document exceeds " + (CEILING / 1024) + " KB uncompressed.");
  console.error("The levers are named at the top of this file. Copy is never one of them.");
  process.exit(1);
}
