/**
 * standards.org.ai, the build.
 *
 *   src/     is written by hand: the register page, the 404 page and the font.
 *   public/  is generated here, and is what wrangler serves. Do not edit it.
 *
 * The register shares its design, header and footer with foundation.org.ai.
 */

const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "src");
const OUT = path.join(__dirname, "public");

// empty public/ rather than replace it, so a running `wrangler dev` keeps watching the same folder
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) fs.rmSync(path.join(OUT, f), { recursive: true, force: true });
for (const f of ["index.html", "404.html", "og.png", "favicon.ico", "favicon.svg", "apple-touch-icon.png"]) fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
fs.cpSync(path.join(SRC, "fonts"), path.join(OUT, "fonts"), { recursive: true });

for (const f of ["index.html", "404.html"]) {
  console.log("  " + f.padEnd(12) + String(fs.statSync(path.join(OUT, f)).size).padStart(8) + " bytes");
}
