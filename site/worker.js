/**
 * standards.org.ai — the standards register of The Org.AI Foundation.
 * Two shelves. One holds other people's records, copied and never corrected.
 * The other holds the few standards this Foundation writes itself.
 *
 * Serves three things and nothing else:
 *   /llms.txt  the machine face, verbatim from LANDING-CONTENT.md §8
 *   /*         the static assets in ./public via the ASSETS binding
 *   404        the design system's own refusal page
 *
 * Nothing here is generated at request time beyond the headers.
 * No external fetch, no data source, no analytics. There is no API here,
 * no download endpoint, no search endpoint and no feed.
 */

const LLMS_TXT = `# The Org.AI Foundation · Standards

> We copy other people's records and never correct them. The few we wrote ourselves sit
> on a second shelf, and say how unfinished they are.

standards.org.ai is the register of the Org.AI Foundation. It holds two shelves. The
first is other standards bodies, copied into this estate and never edited by us. The
second is the small number of standards this Foundation writes itself. Nothing here is
generated at request time and nothing here updates itself.

## Status

Everything below was measured from the standards.org.ai repository on 2026-07-28, at
git HEAD 08ee939. Every figure is followed by how it was counted. Nothing is estimated,
rounded, or carried over from an earlier document.

18 top-level folders on disk. 43 collections inside them hold at least one row. 466
original source files are kept in the repository. 223 generated entity files and 92
relationship files.

The arithmetic that proves the census, by section, from .data/*.tsv with headers
excluded:

  Work                        172,048
  Made and sold               202,790
  Health                      117,184
  Money and paperwork           5,183
  The lists everyone quotes   124,375
  Government registers          5,925
  ---------------------------------
  first shelf                 627,505
  ours, not any body's            514
  ---------------------------------
  total rows                  628,019

628,019 is the raw row count. It is not 628,019 distinct things: the .Scored,
.Extended and .Metadata views restate the same referent with extra columns, and one
pair of files is byte-identical. Counting unique (namespace, type, id) triples across
the 223 files, with id falling back to code where absent, the distinct figure is
478,507. Relationship rows: 861,416.

The 514 rows that are ours are Graph.Domains, Graph.Routing, Graph.Types,
Superset.Skills and Superset.SkillCategories. They belong to the second shelf or to
nothing, and must never appear in a count of what was copied from outside.

Two things are open and are marked as such wherever they appear:
- How much of each collection we hold has not been measured against any publisher's
  own total. No share, ratio or percentage is printed on any surface until it is.
- Nothing on the second shelf has an external binder. None of the six is at 1.0 and
  none will be until at least two people outside this Foundation have built something
  that depends on it.

## The machine face

There is no API here. There is no download endpoint, no search endpoint, no query
interface and no feed. The data lives in a git repository and this file is the only
machine face standards.org.ai currently serves. Do not treat any name in this file as
a resolvable endpoint.

As of 2026-07-28 the hosts that serve a real page a person can read are: axp.org.ai,
mdx.org.ai/docs, mdxld.org, product.md, schema.org.ai, todo.md.org.ai,
agents.md.org.ai, foundation.org.ai. onet.org.ai, apqc.org.ai and gs1.org.ai serve
holding pages. wikipedia.org.ai returns JSON and no human page. soc.org.ai serves
another site's page. naics.org.ai, un.org.ai, x12.org.ai, hl7.org.ai, iso.org.ai,
ieee.org.ai, iana.org.ai, w3.org.ai, epcis.org.ai, markdown.org.ai, mcp.org.ai and
gdpval.org.ai do not respond.

## The first shelf: what we copied

Six sections. Each names a body, what it governs, what it feeds in this estate, the
version and date we loaded, and how much of it we hold. Rows per collection are from
.data/*.tsv grouped by filename prefix, headers excluded.

### Work (7 collections, 172,048 rows)

O*NET                  133,288   database 30.0, folder db_30_0_text. Public domain.
                                 Occupations 1,016; tasks 18,797.
APQC PCF                30,987   7.4 Cross-Industry plus the industry frameworks at
                                 7.2.1 and 7.2.2. Membership or purchase; the file
                                 grants a royalty-free licence with attribution.
Advance CTE              3,978   Framework Crosswalk, September 2025. Free with
                                 attribution.
BLS                      3,447   OES May 2024; projections on 2022 NAICS, 2018 SOC.
                                 Public domain. One large series file undecoded.
CEDS                       158   No version stated. A sample of its elements.
ISCED                      137   ISCED 2011 levels, ISCED-F 2013 fields. UNESCO.
CASE                        53   No version stated. Frameworks and types only.

### Made and sold (7 collections, 202,790 rows)

UNSPSC                 183,288   No version stated. Registration required to
                                 download. No page templates: held as columns only.
GS1                      8,804   Product classification as of May 2025 with the
                                 November 2024 network release; events at 2.0.1; web
                                 vocabulary at 1.17. GS1 licence, free for members.
NAPCS                    5,362   NAPCS 2022. Public domain.
Schema.org               3,040   No version stated. CC BY-SA 3.0.
NAICS                    2,142   NAICS 2022. Public domain.
ETIM                       100   No version stated. 80 example classes of the
                                 several thousand it publishes.
eCl@ss                      54   No version stated. 49 segments, and none of the
                                 40,000-plus classes its own documentation names.

### Health (9 collections, 117,184 rows)

ICD-10-CM               98,208   FY 2026, 1 Oct 2025 to 30 Sep 2026. Public domain.
NDC                     10,000   Downloaded 5 Dec 2025. A 10,000-product sample of a
                                 directory with 135,586-plus in it. Public domain.
HCPCS Level II           7,907   January 2026. Public domain, CMS.
NPI provider taxonomy      883   Version 25.1, released 1 Jul 2025. NUCC.
HL7 FHIR                   127   R5, v5.0.0. CC0. Resources and datatypes.
SNOMED CT                   20   Top-level hierarchy only. Full set needs a SNOMED
                                 International licence we do not hold.
RxNorm                      16   Monthly release, October 2025. Term types only.
LOINC                       13   2.81, released 12 Aug 2025. Axes and categories
                                 only. LOINC licence agreement.
CPT                         10   Category information only. Codes are the AMA's and
                                 need a licence we do not hold.

### Money and paperwork (9 collections, 5,183 rows)

X12                      1,298   No version stated. 318 transaction sets, 845
                                 segments, 135 elements.
LEI                      1,123   No version stated. Registration authorities. GLEIF.
MCC                      1,010   ISO 18245:2023. ISO TC68 and the card networks.
ISO 20022                  657   No version stated. Message catalogue. ISO TC68;
                                 registration authority SWIFT.
EANCOM                     278   No version stated. GS1.
BIC / SWIFT                254   ISO 9362:2014. Structure and country codes only;
                                 not the register of banks.
Peppol                     236   No version stated. OpenPeppol.
UN/EDIFACT                 207   Directory D.20B. 195 of the 317 message types it
                                 publishes, plus 12 categories. UN terms of use.
ISIN                       120   No version stated. Numbering agencies. ANNA.

### The lists everyone quotes (5 collections, 124,375 rows)

UN/LOCODE              120,807   Notes cite the loc241 release. UN terms of use.
W3C                      2,077   22 specifications. Per-spec versions not stated.
                                 W3C Software and Document Licence; MDN licence
                                 cited for some tables. Four of the 22 folders are
                                 not W3C's: DOM and HTML are WHATWG's, Dublin Core
                                 is DCMI's, FOAF is the FOAF project's.
ISO 3166 / 4217 / 639      915   No edition stated. Some ISO standards are free and
                                 others must be bought.
IANA time zone database    547   From the vvo/tzdb mirror, downloaded 7 Dec 2025.
                                 Public domain.
UN M49                      29   No version stated. Regions only; no country rows.

### Government registers (6 collections, 5,925 rows)

Census Bureau            4,148   FIPS codes with the July 2023 metro-area
                                 delineation, downloaded 7 Dec 2025. Public domain.
SEC                      1,095   Four-digit SIC list, downloaded 7 Dec 2025. Public
                                 domain.
GSA                        228   PSC Manual April 2025 with the DLA supply classes.
                                 Public domain. Classes only.
USITC                      219   Downloaded 7 Dec 2025. Public domain. Chapters
                                 only, nothing beneath them.
USPTO                      203   Nice 12th edition 2025, with Locarno, CPC and USPC,
                                 downloaded 7 Dec 2025. Public domain. Nice's 45 and
                                 Locarno's 32 classes are whole; CPC and USPC are a
                                 handful of rows.
SBA                         32   13 CFR 121.201. Public domain. Business and
                                 contract types; not the thresholds by industry.

### Collections held only in part

Twelve collections hold a fraction of the standard they name, and each says so on its
own row on the page: CPT, LOINC, RxNorm, SNOMED CT, SBA, CASE, eCl@ss, ETIM, CEDS,
USPTO, GSA, USITC. NDC, UN M49, UN/EDIFACT, BLS and BIC/SWIFT are partial in the ways
named above.

### The publisher count, and why the page does not print it

Counting distinct publishing organisations named by this repository's own READMEs, and
merging collections that share a publisher (GS1 publishes both GS1 and EANCOM; ISO
publishes both ISO and ISO 20022; the U.S. Census Bureau publishes NAICS, NAPCS and the
Census geography; CMS publishes HCPCS and NDC), the figure is 37. It rests on
attributions rather than on a file count, so the visible page prints 18, 43 and 466,
which are mechanical, and leaves 37 here.

## Reserved but empty

This Foundation reserved a name in its estate for seventeen outside bodies. Eleven of
those names have data on disk today: onet, apqc, naics, gs1, un, x12, hl7, iso, iana,
w3, epcis. Six have nothing loaded: soc, ieee, wikipedia, markdown, mcp, gdpval. SOC
codes appear inside the BLS and Advance CTE files but there is no SOC collection.

Seven folders that hold real data answer to no reserved name at all: Advance CTE, BLS,
Ecommerce, Education, Finance, NAPCS and the U.S. agency folder. Between them they hold
25,418 rows.

The honest one-line version: 18 folders on disk; 43 collections with data; 6 of the 17
reserved names still empty.

## The second shelf: what we wrote

Six. None is at 1.0. None has an external binder.

AXP — the Agent eXperience Protocol. What an API must publish so an agent can transact
with it on first contact with no human reading documentation. Draft 0.3.0, dated
2026-07-21. Publisher apis.ax, verifier api.qa. $id https://apis.ax/axp.
Home: https://axp.org.ai

MDXLD — MDX carrying $id, $type and $context in its frontmatter. A superset of the open
MDX format whose frontmatter is a superset of YAML-LD. $context is permanently
https://schema.org.ai and carries no version. No version number of its own.
Home: https://mdx.org.ai/docs and https://mdxld.org

PRODUCT.md — one Markdown file describing who a product is for, how it speaks and what
it costs. Draft; the owner's ruling records 0.9 and the file itself carries no version
string. Its own page states that it is a specification we write, not a standard we host.
Home: https://product.md

TODO.md — a task list a machine can also read, in a plain Markdown file. No version
number. In use in this Foundation's own repositories. Home: https://todo.md.org.ai

schema.org.ai — our superset of Schema.org, extended for work machines do. No version
number. CC BY-SA 4.0; the vocabulary it extends is CC BY-SA 3.0. Its README states 871
types and its things directory holds 905 pages; the two have not been reconciled, so no
total is printed anywhere. Home: https://schema.org.ai

AGENTS.md frontmatter profile — the frontmatter an AGENTS.md file carries so one source
compiles to AGENTS.md, CLAUDE.md and .cursorrules. No version number.
Home: https://agents.md.org.ai

## The counters

Copied from others: 18 folders, 43 collections with anything in them, 466 original files
kept. Git-tracked top-level folders, excluding the dot-directories, node_modules and
site/; collections holding at least one row in .data; git ls-files .source.

Written down: 478,507 entries and 861,416 links between them. Unique (namespace, type,
id) triples across the 223 entity files, id falling back to code; rows carrying neither
an id nor a code are not entities and are not counted, and counting them would print
478,709 instead. Relationship rows across the 92 relationship files. The raw entity row
count is 628,019 and the difference is the same referent restated in more than one view.

How much of each: not measured, and therefore not printed. No share, ratio or percentage
for any collection appears on any surface of this site.

## How a page says where it came from

Every entry page in this estate carries one line of five plain phrases: Seeded from,
Curated here, Built as, Minted at, Operated by. On a page on the first shelf the second
phrase reads "Curated at" and names the curating home, because the copy is not the
curation, and the last three are blank and stay blank: a record we copied was not built,
minted or operated by anybody here. Where a step did not happen the line shows a visible
blank rather than a plausible name. A second line carries the loading receipt: the source
file, the licence, the generated file the row landed in, and the publisher's own code
kept unchanged.

## Licence and use

The transformation in this repository is CC BY-SA 4.0, copyright 2025 Standards.org.ai.
That covers the transformation and not the sources. Each source keeps its own licence and
each is named above; several require a licence or a purchase from their publisher before
the full set may be used, and those are marked.

We have not contacted any of the bodies named in this file. Nothing here is published with
their endorsement, their participation, or their knowledge, and nothing here should be read
as a claim of any of the three.

Nothing on standards.org.ai is generated at request time. This page and this file are
static, self-contained, and make zero external requests.
`;

const SEC = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "SAMEORIGIN",
  /* The page loads nothing from anywhere. The policy says so out loud.
     The style, the script and the font are all inside the document, so the
     policy admits inline and data: and admits no host at all. */
  "content-security-policy":
    "default-src 'none'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'unsafe-inline'; " +
    "font-src 'self' data:; " +
    "img-src 'self' data:; " +
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

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, { status: 405, headers: { allow: "GET, HEAD", ...SEC } });
    }

    if (url.pathname === "/llms.txt") {
      return new Response(LLMS_TXT, {
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=300, must-revalidate",
          ...SEC,
        },
      });
    }

    /* Everything else is a static asset. not_found_handling serves 404.html. */
    const res = await env.ASSETS.fetch(request);

    const ct = res.headers.get("content-type") || "";

    /* The asset server returns HTML as bare `text/html` with no charset, on the
       200 and on the 404 alike. The document declares utf-8 inside the sniff
       window, but a header that says nothing leaves the decision to the client,
       so both layers state it. Every HTML response, including the 404. */
    const extra = {};
    if (ct.startsWith("text/html") && !ct.includes("charset")) {
      extra["content-type"] = "text/html; charset=utf-8";
    }

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
