/**
 * The hero's shelf: every collection on the register as a book, as tall as the rows it holds, on a log scale.
 *
 * Counted from this repository at build time (../.data), so the figure never goes stale: rows per collection are the
 * .data/*.tsv files grouped by filename prefix, header excluded, as LANDING-CONTENT.md §10 counts them. The sections,
 * names, anchors and whole-or-part come from the register itself (src/index.html), so the shelf and the rows under
 * it cannot disagree. The build stops on any data file it cannot place, and on any collection without rows.
 *
 * Everything is drawn here, as HTML and CSS, so the page does not move when it loads; the page's script only adds
 * the card a book shows when you point at it.
 */

const fs = require("fs");
const path = require("path");

// which .data files each collection on the register is counted from: the filename prefix, the four grouped folders
// split on their second segment, the UN folder split by file into the three UN standards the register lists
const FILES = {
  "O*NET": ["ONET"], "APQC PCF": ["APQC"], "BLS": ["BLS"], "Advance CTE": ["AdvanceCTE"],
  "ISCED": ["Education.ISCED"], "CEDS": ["Education.CEDS"], "CASE": ["Education.CASE"],
  "NAICS": ["NAICS"], "NAPCS": ["NAPCS"], "UNSPSC": ["UNSPSC"], "GS1": ["GS1"],
  "eCl@ss": ["Ecommerce.ECLASS"], "ETIM": ["Ecommerce.ETIM"], "Schema.org": ["Ecommerce.SchemaOrg"],
  "ICD-10-CM": ["ICD"], "HCPCS Level II": ["HCPCS"], "NDC": ["NDC"], "NPI provider taxonomy": ["NPI"], "HL7 FHIR": ["FHIR"],
  "SNOMED CT": ["SNOMED"], "RxNorm": ["RxNorm"], "LOINC": ["LOINC"], "CPT": ["CPT"],
  "ISO 20022": ["Finance.ISO20022"], "LEI": ["Finance.LEI"], "ISIN": ["Finance.ISIN"], "MCC": ["Finance.MCC"], "BIC": ["Finance.SWIFT"],
  "X12": ["EDI.X12"], "UN/EDIFACT": ["UN.EDIFACTCategories", "UN.EDIFACTMessages"], "EANCOM": ["EDI.EANCOM"], "Peppol": ["EDI.Peppol"],
  "ISO 3166 · 4217 · 639": ["ISO"], "UN/LOCODE": ["UN.Locations", "UN.Subdivisions"], "UN M49": ["UN.Regions", "UN.SubRegions", "UN.IntermediateRegions"],
  "IANA time zone database": ["IANA"], "W3C": ["W3C"],
  "Census Bureau": ["Census"], "SEC": ["SEC"], "USITC": ["USITC"], "GSA": ["GSA"], "SBA": ["SBA"], "USPTO": ["USPTO"],
};
// rows this Foundation wrote (LANDING-CONTENT.md §10): never counted as copied
const OURS = ["Graph", "Superset"];

// a shorter name for a book's spine, used only when the full name does not fit on it (the card and the register give
// the full name)
const SPINE = { "IANA time zone database": "IANA", "NPI provider taxonomy": "NPI", "ISO 3166 · 4217 · 639": "ISO 3166", "UN/EDIFACT": "EDIFACT", "UN M49": "M49" };

/* The scale. Each decade of rows is `dec` px tall; a book's foot is one row (10^0), so a book is log10(rows) × dec.
   The page sets --dec by the window's height, so the hero fits it: these three must match its three steps (x, y and
   z in the CSS), because the build decides from them, for each step, which names fit on their books. */
const LAYOUT = {
  x: { dec: 46, font: 11 }, // a tall window
  y: { dec: 40, font: 11 }, // a shorter one
  z: { dec: 36, font: 11 }, // shorter still, and every phone
};
const OURS_DEC = 2.5; // our six are standards, not rows: one height, halfway between two lines so it reads as no value (--oh in the CSS)
const HEADROOM = 8; // above the tallest book (--room)
const PAD_IN = 14; // a name on its book: 7px from the foot, room at the top
const GAP_UP = 6; // a name above its book

/* Public Sans at weight 600, advance widths in thousandths of an em for U+0020 to U+007E and then "·", measured in
   Chrome from the page's own font file. Used to decide, here, whether a name fits on its book. */
const ADV = "233,268,455,610,671,923,749,255,319,324,437,573,261,386,249,367,630,418,617,649,644,659,643,615,660,643,250,261,563,573,563,528,829,719,678,705,708,628,605,747,768,296,396,701,578,903,769,748,645,762,687,682,606,713,689,962,704,640,655,322,367,322,479,537,243,560,603,545,603,572,396,626,585,258,277,571,317,882,586,571,602,602,402,517,404,589,513,785,577,550,489,359,266,360,592,246".split(",").map(Number);
/* and at weight 400, for the sections' names under the shelves */
const ADV_400 = "243,251,425,603,658,904,708,248,303,309,394,555,241,377,225,351,612,407,596,630,628,640,623,601,648,624,225,240,546,555,545,521,831,710,670,689,693,621,594,733,766,283,388,682,577,885,754,734,636,748,676,670,593,701,672,953,688,607,637,303,351,303,473,517,218,553,597,543,597,567,396,623,577,247,262,562,303,865,577,565,596,596,391,506,389,581,504,780,564,535,481,328,263,332,568".split(",").map(Number);
function textWidth(s, px, table = ADV, tracking = 0.01) {
  let w = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0);
    const a = c >= 32 && c <= 126 ? table[c - 32] : ch === "·" && table === ADV ? ADV[95] : null;
    if (a == null) throw new Error("shelf: no width for " + JSON.stringify(ch) + " in " + s);
    w += a / 1000 + tracking; // and the spine's letter-spacing, 0.01em
  }
  return w * px + 2; // and 2px to spare, for kerning and rounding
}
const NAME_PX = 13, BOOK_MIN = 15, GAP = 3; // the sections' names (0.8125rem), the narrowest book and the gap between two (--g)

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const text = (s) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const fmt = (n) => n.toLocaleString("en-US");

/* the register as the page lists it: each section, and each entry's anchor, name, line and whole, part or ours */
function readRegister(html) {
  const sections = [];
  for (const m of html.matchAll(/<section class="band reg shelf-sec" id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)) {
    const [, id, body] = m;
    const name = text((body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || "");
    const items = [...body.matchAll(/<li class="std" id="(std-[^"]+)"[^>]*>([\s\S]*?)<\/li>/g)].map(([, sid, li]) => ({
      id: sid,
      name: text((li.match(/<h3[^>]*>([\s\S]*?)<\/h3>/) || [])[1] || ""),
      what: text((li.match(/<p class="what">([\s\S]*?)<\/p>/) || [])[1] || ""),
      k: (li.match(/<i class="ov (whole|part|ours)"/) || [])[1],
    }));
    if (!name || !items.length || items.some((i) => !i.name || !i.what || !i.k)) throw new Error("shelf: could not read the register section " + id);
    // the section's own count, typed by hand, must agree with its rows
    const count = text((body.match(/<p class="count num">([\s\S]*?)<\/p>/) || [])[1] || "");
    const parts = items.filter((i) => i.k === "part").length;
    const want = items.length + " standards, " + (items.every((i) => i.k === "ours") ? "written here" : parts + " held in part");
    if (count !== want) throw new Error(`shelf: the ${name} section says "${count}", and its rows say "${want}"`);
    sections.push({ id, name, items, ours: items.every((i) => i.k === "ours") });
  }
  if (sections.length < 2 || !sections[sections.length - 1].ours) throw new Error("shelf: the register should end with our standards");
  return sections;
}

/* links per collection, from ../.data/relationships: a file runs between two collections, inside one, or is not the
   register's (BEA is not on it; Superset and Graph are ours). A link between two counts for both. */
const BETWEEN = {
  "APQC.Category.NAICS.Sector": ["APQC PCF", "NAICS"], "APQC.Industry.NAICS.Industry": ["APQC PCF", "NAICS"], "APQC.Process.ONET.Occupation": ["APQC PCF", "O*NET"],
  "BLS.NAICS.Industry": ["BLS", "NAICS"], "BLS.OEWS.Industry.Occupation": ["BLS", "NAICS"], "BLS.ONET.Occupation": ["BLS", "O*NET"],
  "CareerCluster.NAICS": ["Advance CTE", "NAICS"], "Country.Region": ["ISO 3166 · 4217 · 639", "UN M49"], "Finance.MCC.Category.NAICS.Industry": ["MCC", "NAICS"],
  "GS1.Segment.NAICS.Industry": ["GS1", "NAICS"], "Location.Country": ["UN/LOCODE", "ISO 3166 · 4217 · 639"], "ONET.Occupation.NAICS.Industry": ["O*NET", "NAICS"],
  "SIC.NAICS.Crosswalk": ["SEC", "NAICS"], "SOC.CIP": ["O*NET", "Advance CTE"], "SOC.CareerCluster": ["O*NET", "Advance CTE"], "SOC.SubCluster": ["O*NET", "Advance CTE"],
  "SOC.NAICS": ["O*NET", "NAICS"], "UNSPSC.Segment.NAICS.Industry": ["UNSPSC", "NAICS"],
};
const INSIDE = [["AdvanceCTE.", "Advance CTE"], ["CIP.", "Advance CTE"], ["APQC.", "APQC PCF"], ["BLS.", "BLS"], ["Census.", "Census Bureau"], ["Country.", "ISO 3166 · 4217 · 639"],
  ["Ecommerce.ETIM.", "ETIM"], ["Ecommerce.SchemaOrg.", "Schema.org"], ["EDIFACTMessage.", "UN/EDIFACT"], ["Finance.ISO20022.", "ISO 20022"], ["Finance.MCC.", "MCC"], ["GS1.", "GS1"],
  ["GSA.", "GSA"], ["NAICS.", "NAICS"], ["NAPCS.", "NAPCS"], ["ONET.", "O*NET"], ["Region.", "UN M49"], ["SEC.", "SEC"], ["SBA.", "SBA"], ["UN.Location.", "UN/LOCODE"],
  ["UNSPSC.", "UNSPSC"], ["USPTO.", "USPTO"], ["W3C.", "W3C"], ["WCAG.", "W3C"], ["OWL.", "W3C"], ["Zone.", "IANA time zone database"]];
const NOT_OURS_TO_COUNT = ["BEA.", "Superset.", "Graph."];
function countLinks(dir) {
  const links = {};
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".tsv")).sort()) {
    const base = f.slice(0, -4);
    const n = fs.readFileSync(path.join(dir, f), "utf8").split("\n").filter((l, i) => i > 0 && l.length).length;
    if (BETWEEN[base]) { for (const c of BETWEEN[base]) links[c] = (links[c] || 0) + n; continue; }
    if (NOT_OURS_TO_COUNT.some((p) => base.startsWith(p))) continue;
    const hits = INSIDE.filter(([p]) => base.startsWith(p));
    if (hits.length !== 1) throw new Error("shelf: .data/relationships/" + f + " belongs to " + (hits.length ? hits.map((h) => h[1]).join(" and ") : "no collection"));
    links[hits[0][1]] = (links[hits[0][1]] || 0) + n;
  }
  for (const c of [...Object.values(BETWEEN).flat(), ...INSIDE.map((h) => h[1])]) if (!FILES[c]) throw new Error("shelf: links name " + c + ", which is not a collection");
  return links;
}

/* rows per collection, from ../.data */
function countRows(dataDir) {
  const rows = {};
  let ours = 0;
  for (const f of fs.readdirSync(dataDir).filter((f) => f.endsWith(".tsv")).sort()) {
    const base = f.slice(0, -4);
    const owners = Object.keys(FILES).filter((c) => FILES[c].some((k) => base === k || base.startsWith(k + ".")));
    const isOurs = OURS.some((k) => base === k || base.startsWith(k + "."));
    if (owners.length + (isOurs ? 1 : 0) !== 1) throw new Error("shelf: .data/" + f + " belongs to " + (owners.length ? owners.join(" and ") : "no collection"));
    const n = fs.readFileSync(path.join(dataDir, f), "utf8").split("\n").filter((l, i) => i > 0 && l.length).length;
    if (isOurs) ours += n;
    else rows[owners[0]] = (rows[owners[0]] || 0) + n;
  }
  return { rows, ours };
}

function build(html, dataDir) {
  const sections = readRegister(html);
  const { rows } = countRows(dataDir);
  const links = countLinks(path.join(dataDir, "relationships"));
  const copied = sections.filter((s) => !s.ours), ourSec = sections.find((s) => s.ours);
  const books = copied.flatMap((s) => s.items);
  for (const b of books) {
    if (!FILES[b.name]) throw new Error("shelf: the register lists " + b.name + ", which shelf.js does not know how to count");
    if (!rows[b.name]) throw new Error("shelf: no rows in .data for " + b.name);
    b.rows = rows[b.name];
    b.links = links[b.name] || 0;
  }
  for (const c of Object.keys(FILES)) if (!books.some((b) => b.name === c)) throw new Error("shelf: " + c + " is counted but not on the register");

  const total = books.reduce((n, b) => n + b.rows, 0);
  const most = books.reduce((a, b) => (b.rows > a.rows ? b : a)), least = books.reduce((a, b) => (b.rows < a.rows ? b : a));
  const top = Math.log10(most.rows); // the tallest book sets the height of the shelf
  const ticks = Math.floor(top); // lines at 10, 100, … up to the last whole decade under the tallest book

  // a name sits on its book where it fits; where it does not, its spine name, then above the book; else the card names it
  function place(b, h, L) {
    const full = b.name, short = SPINE[b.name];
    const tops = Math.ceil(top * L.dec) + HEADROOM;
    for (const t of [full, short]) if (t && textWidth(t, L.font) + PAD_IN <= h) return { t, at: "in" };
    for (const t of [full, short]) if (t && h + GAP_UP + textWidth(t, L.font) <= tops) return { t, at: "up" };
    return { t: full, at: "no" };
  }
  // one span per name a book shows, classed with where it stands at each step: x-in, y-up, z-no and so on
  const spine = (b) => {
    const l = Math.log10(b.rows), at = {};
    for (const [k, L] of Object.entries(LAYOUT)) at[k] = place(b, Math.round(l * L.dec), L);
    const names = [...new Set(Object.values(at).map((p) => p.t))];
    return names.map((t) => `<span class="t ${Object.entries(at).map(([k, p]) => k + "-" + (p.t === t ? p.at : "no")).join(" ")}">${esc(t)}</span>`).join("");
  };
  for (const b of ourSec.items) for (const L of Object.values(LAYOUT)) {
    if (textWidth(b.name, L.font) + PAD_IN > Math.round(OURS_DEC * L.dec)) throw new Error("shelf: " + b.name + " does not fit on its book");
  }

  let i = 0;
  const KIND = { whole: "The whole standard", part: "Part of the standard", ours: "Written by the Foundation" };
  const book = (b) => `<a class="bk ${b.k}" href="#${b.id}" tabindex="-1" style="--i:${i++}${b.rows ? ";--l:" + Math.log10(b.rows).toFixed(4) : ""}" data-n="${esc(b.name)}" data-w="${esc(b.what)}"${b.rows ? ` data-r="${b.rows}"` : ""}${b.links ? ` data-x="${b.links}"` : ""}>${b.rows ? spine(b) : `<span class="t ${Object.keys(LAYOUT).map((k) => k + "-in").join(" ")}">${esc(b.name)}</span>`}</a>`;
  const group = (s) => `<div class="sh-grp${s.ours ? " ours" : ""}" style="--n:${s.items.length}"><div class="sh-books" aria-hidden="true">${s.items.map(book).join("")}</div>` +
    `<a class="sh-name" href="#${s.id}">${esc(s.name)}</a></div>`;

  const lines = Array.from({ length: ticks }, (_, k) => `<i style="--k:${k + 1}"></i>`).join("");
  const axis = Array.from({ length: ticks + 1 }, (_, k) => `<span style="--k:${k}">${fmt(10 ** k)}</span>`).join("");
  const whole = books.filter((b) => b.k === "whole").length;
  const nBooks = books.length + ourSec.items.length;
  const inner = sections.reduce((n, s) => n + s.items.length - 1, 0);
  // a section's name stays on one line; where it is wider than its books at their narrowest, the books leave it room
  const overhang = Math.ceil(sections.reduce((n, s) => n + Math.max(0, textWidth(s.name, NAME_PX, ADV_400, 0) - (s.items.length * BOOK_MIN + (s.items.length - 1) * GAP)), 0));

  const figure =
    `<figure class="sh" aria-labelledby="sh-cap" style="--top:${top.toFixed(4)};--ticks:${ticks};--nb:${nBooks};--ng:${inner};--nc:${copied.length - 1};--lx:${overhang}px">` +
    `<div class="sh-plot"><div class="sh-axis" aria-hidden="true">${axis}<em class="sh-val"></em></div>` +
    `<nav class="sh-scroll" aria-label="Shelves"><div class="sh-board"><div class="sh-lines" aria-hidden="true">${lines}<i class="sh-guide"></i></div><div class="sh-copied">` +
    copied.map(group).join("") + `</div>` + group(ourSec) + `</div></nav></div>` +
    `<div class="sh-under"><figcaption id="sh-cap">Each book is a collection, as tall as its rows; each line is ten times the one below. ` +
    `<span class="num">${fmt(total)}</span> rows, from ${esc(least.name)}&#x27;s <span class="num">${fmt(least.rows)}</span> to ${esc(most.name)}&#x27;s <span class="num">${fmt(most.rows)}</span>. ` +
    `In amber, the ${ourSec.items.length} standards we write, set apart from the scale.</figcaption>` +
    `<ul class="sh-key" aria-hidden="true"><li><i class="sw whole"></i>The whole standard</li><li><i class="sw part"></i>Part of it</li><li><i class="sw ours"></i>Written by us</li></ul></div>` +
    `<div class="sr"><table><caption>Rows held for each collection on the register</caption><thead><tr><th scope="col">Collection</th><th scope="col">Section</th><th scope="col">Held</th><th scope="col">Rows</th></tr></thead><tbody>` +
    copied.flatMap((s) => s.items.map((b) => `<tr><th scope="row">${esc(b.name)}</th><td>${esc(s.name)}</td><td>${KIND[b.k]}</td><td>${fmt(b.rows)}</td></tr>`)).join("") +
    `</tbody></table></div></figure>`;

  return { figure, total, collections: books.length, whole, most, least, sections };
}

module.exports = { build, LAYOUT, OURS_DEC, HEADROOM };
