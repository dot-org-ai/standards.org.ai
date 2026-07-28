# LANDING-CONTENT.md — standards.org.ai

**The complete copy and structure of the landing page.** Everything a person reads on this
page is written out below, verbatim. The designer and the builder write **no original prose**.
If a string is needed and is not in this file, it is a content decision — ask, do not invent.

**Sibling of** `/Users/nathanclevenger/projects/foundation.org.ai/LANDING-CONTENT.md`. This page
is the same institution writing things down, in the same grammar, at the same type scale, under
the same laws. Where this file diverges from foundation's, the divergence is written out and
argued (§0.4, §8, §11) rather than inherited silently.

**Sources of truth for every fact on this page:**

| What | Where |
|---|---|
| the ratified hierarchy, Door 7, the strip, the honest-census rules | `/Users/nathanclevenger/projects/org.ai/docs/docket/org-ai-hierarchy-proposal.md` (OWNER-RATIFIED 2026-07-26) |
| the fixation gate, the two-shelf reading | `/Users/nathanclevenger/projects/org.ai/CONTEXT.md` |
| every count, version, date, licence and depth statement | this repository, measured 2026-07-28 (§10 records the command for each) |
| the shelf-two artifacts | the repos named in §5, read 2026-07-28 |
| every link | `curl` against the live host, 2026-07-28 (§9) |

**Every number on this page was measured from this repository on 28 July 2026 and nothing was
carried over from an earlier document.** Where an earlier document and the disk disagree, the
disk wins and the page says so out loud (§3.1 aside, §1.5 row two).

---

## 0 · The laws this file obeys

**0.1 · The height law (ratified).**
> *Nothing on the site is ever taller than the answer to the question she came with.*

The person who arrives here came with one question, and it is almost always the same one:
*where did that come from, and is it current?* Everything above the fold answers it. The shelves
are what happens when you scroll. They exist so she can find her own row, not so she can study
the whole set.

**0.2 · The honesty law.** No surface prints a number that has not been checked, and every number
that is printed is printed beside the way it was counted. One counter is **unmeasured** and
therefore **prints no number at all** — it prints the fact that the measurement has not been done.
That is not a placeholder for a builder to fill in later; it is the copy.

**0.3 · The no-fake-functionality law.** There is no search box on this page, because there is
nothing behind one. There is no download, no API, no feed and no "browse the data" button, because
none of those is served. The page is a register you read. If a control appears on this page that
does nothing, the page has broken its own law.

**0.4 · The link law, and a deliberate divergence from foundation.**
Only a property **this Foundation owns** that serves **a real page a person can read**, verified
by `curl` on the day of the deploy, may be a link. Everything else is text.

Foundation's law 0.4 says `.org.ai` only. This page widens it by two names, on purpose:
`product.md` and `mdxld.org` are the Foundation's own, they serve real pages today, and they are
the published homes of two of the six standards on shelf two. Refusing to link a live home because
of its suffix would send the reader nowhere and teach her nothing. The **Layer rule already says a
suffix is an address, never a membership test**, so the widening follows the ratified rule rather
than bending it. The complete registry is §9. It has seven entries plus the parent and
`/llms.txt`.

**0.5 · Citation, not destination.** This page names roughly fifty outside bodies. **It links to
none of them.** Naming a body is a citation; a link is a destination, and we do not send a person
off this Foundation's property to finish a sentence we started. This is also how the no-outreach
rule looks from the outside: **we have contacted nobody, we claim nothing on anybody's behalf, and
no outside body has been asked for or has given anything.** Every outside body's site is text.

**0.6 · Ingest-only, said in plain words.** Nothing on the first shelf is ours to edit. The page
says *copied* and *never corrected*, never "curated", "cleaned", "improved" or "harmonised".
Where we changed the file format, the page says so (§1.4).

**0.7 · Depth over presence.** A folder existing is not the same as a standard being held. Every
row that holds a fraction of its standard **says which fraction, in words, on its own row**. A row
that says nothing about depth is claiming to hold the whole of what it names, and that claim must
be true.

**0.8 · Self-contained.** Zero external requests. No CDN fonts, no scripts, no images, no
analytics, no live data feeds. Every string on the page is hard-coded from this file.

---

## 1 · HERO — above the fold

There is **no aperture on this page.** Foundation's hero carries an input box that matches a list
built into the page; this one carries none, because a register has nothing honest for a box to do
that a row of nav words does not already do better. The builder therefore drops the entire `#ask`
block, `.aperture` / `.well` / `.sug` / `.chips` / `.answer` CSS and the matcher, and the fold
budget those cost is spent on the counters' check-lines instead.

Fold order: wordmark, mission, honesty line, three counters with all three check-lines, nav words.

### 1.1 · Wordmark

```
The Org.AI Foundation · Standards
```

Set once, small, above the mission line. No tagline beside it, no logo mark. `The Org.AI
Foundation` and `Standards` are set at the same weight; the `·` between them is UNLIT.

### 1.2 · Mission line

```
We copy other people's records and never correct them.
The few we wrote ourselves sit on a second shelf, and say how unfinished they are.
```

Two sentences, set as one block. The line break above is the intended break on wide screens; on
narrow screens it wraps naturally. This is the largest type on the page. Nothing is larger, ever.

Both shelves are in it, and so is the promise this page keeps about each: *never corrected* is the
promise about theirs, *say how unfinished they are* is the promise about ours.

### 1.3 · No chips

Foundation's hero carries four chips under its box. This one carries none. The nav words at the
bottom of the fold are the only navigation the hero offers, and they are the section list.

### 1.4 · The one line of honesty

Set small, directly under the mission, always visible, never a tooltip:

```
We do change the file format. We do not change what the record says.
```

**Do not soften this and do not drop it.** It answers, before it is asked, the only fair objection
to the word *copy*: the rows in this repository are tab-separated files with our own column names,
and a reader who learns that later without being told first has caught us. She is told first.

### 1.5 · The three counters

Set at the same size as everything else in the hero. No big-number treatment, no count-up
animation, no colour. Three rows, each with a label, a value, and one small line saying how to
check it. Row three is the point of the page.

```
Copied from others      18 folders · 43 collections with anything in them
                        · 466 original files kept

                        Counted on disk on 28 July 2026. Git-tracked top-level folders,
                        excluding the dot-directories, node_modules and site/;
                        collections inside them that hold at least one row; the original
                        files kept beside them. All three are countable by hand.

Written down            478,507 entries · 861,416 links between them

                        Counted from the files in this repository the same day. The
                        raw figure was 628,019. The same entry turns up in more than
                        one view of itself, and 478,507 is what survived removing the
                        repeats.

How much of each        Not measured yet.

                        Some of these hold a fraction of their standard, and every one
                        of them says so in words on its own row. We have not measured
                        any of them against its publisher's own total, so no share is
                        printed here.
```

**Builder note, non-negotiable:** row three has no number, no digit, no dash, no zero, no
"coming soon" skeleton and no reserved slot, at any moment including mid-animation, in both
schemes, at every breakpoint. The words `Not measured yet.` are the value. **There is not a single
digit anywhere in row three, value or check-line** — that is deliberate, and it is stricter than
foundation's row three, which is allowed digits in its check-line and has none either.

**Content note on row two:** *"The raw figure was 628,019 … 478,507 is what survived removing the
repeats"* is the cheapest possible proof that the other two rows were also checked, and it is the
same move foundation makes with *"We said 19 before we checked; 17 is what survived."* Keep it.

**Content note on row one:** the three figures are three different kinds of thing on purpose — a
folder count, a collection count, and a file count — because a person who only reads one of them
should still be reading something she could verify herself.

---

## 2 · THE NAV — seven words

Seven words, one row, no dropdowns, no search icon, no sign-in. Each word is a **scroll anchor on
this page**. **No nav word is an outbound link.**

| # | Word | Anchor | What clicking it does |
|---|---|---|---|
| 1 | Work | `#work` | Scrolls to the bodies that describe jobs, the steps inside them, and how you train for them. |
| 2 | Made and sold | `#made-and-sold` | Scrolls to the bodies that name what a business makes, buys and ships. |
| 3 | Health | `#health` | Scrolls to the bodies a clinic, a pharmacy or an insurer has to write on a form. |
| 4 | Money and paperwork | `#money-and-paperwork` | Scrolls to the bodies that identify who is paying, and the messages that carry the order. |
| 5 | The lists everyone quotes | `#the-lists-everyone-quotes` | Scrolls to the short lists the other standards are built on top of. |
| 6 | Government registers | `#government-registers` | Scrolls to what one government publishes and everybody trading with it has to use. |
| 7 | What we wrote ourselves | `#what-we-wrote-ourselves` | Scrolls to the six standards nobody outside this Foundation governs. |

**Sticky behaviour.** The nav is not sticky on load. It becomes sticky only after the hero has
scrolled out of view, and it fades in. The current section's word is marked. This keeps the fold
clean, which is the height law.

**Markup note (gate 11).** Every word is a `name + separator` unit at `white-space: nowrap` with an
explicit `<wbr>` between units. This row is longer than foundation's and the sticky nav is the only
element on the page allowed to scroll horizontally. Verify `document.scrollWidth === innerWidth` at
320, 360, 390 and 430 px before shipping.

---

## 3 · THE SIX SECTIONS OF SHELF ONE

**Shape of every section, identical six times, and identical again for §5:**

```
{SECTION NAME}
{ONE-LINE TEST, plain words}

{ROWS — each two lines, mono for the quoted names and versions, sans for the plain phrases}

{THE HUMAN EXAMPLE — a short paragraph with a situation and what she gets}

{ASIDE — optional, mono, one honest extra fact}
```

**The row grammar, fixed, every row identical:**

```
{BODY, as it names itself}      {what it governs, one short phrase}
{what it feeds in our estate} · {version and date we loaded, or: no version stated}
```

The body name and every version string are **quotations of somebody else's record** and are set in
mono. Everything else is our prose and is set in sans. **No name in any row is a link** (§0.5).
**No row prints how many rows it holds** — those counts live in `/llms.txt` (§7). What a row does
print, and must, is **depth in words** wherever we hold a fraction (§0.7).

**One line appears once, under the first section only:**

```
None of these bodies has a page of ours yet. Every name on this shelf is text, and every
one of them belongs to somebody else.
```

**The forty-three rows below are the complete first shelf, each placed exactly once.** If a
collection is added to the repository it gets a row here and a line in `/llms.txt`, and nothing
else on the page moves.

---

### 3.1 · Work

**Heading:** `Work`

**The test, in plain words:**
```
If it is a list of jobs, of the steps inside them, or of how you train for them,
it is here.
```

**Rows:**
```
O*NET                    every U.S. occupation, its tasks, its skills, its tools
                         Feeds occupations · loaded db_30_0_text, the O*NET database
                         version 30.0. Public domain, a U.S. Government work.

APQC PCF                 every process a business runs, named the same way across
                         industries
                         Feeds process · Process Classification Framework 7.4
                         Cross-Industry, plus the industry frameworks at 7.2.1 and
                         7.2.2. APQC membership or purchase; the framework file
                         itself grants a perpetual royalty-free licence with
                         attribution to APQC and IBM.

BLS                      how many people hold each job, and what each pays
                         Feeds occupations and industries · Occupational Employment
                         Statistics, May 2024; the projections matrix on 2022 NAICS
                         and 2018 SOC. Public domain. One large series file is
                         documented here and has not been decoded.

Advance CTE              which course of study leads to which job
                         Feeds skills and courses · Framework Crosswalk, September
                         2025. Free with attribution.

ISCED                    UNESCO's levels of education and its fields of study
                         Feeds education · ISCED 2011 for the levels, ISCED-F 2013
                         for the fields. UNESCO.

CEDS                     the U.S. common vocabulary for school data
                         Feeds education · no version stated. A sample of its
                         elements, not the set it publishes.

CASE                     the format for publishing a set of learning standards
                         Feeds education · no version stated. The frameworks and the
                         types, and none of the competencies underneath them.
```

**The human example:**
```
A careers adviser wants to know where the task list on a job page came from.

She reads one row. O*NET, the U.S. Labor Department's database, version 30.0, the folder
we loaded. Not a summary of it, not our reading of it, not a number we worked out. The
same words the department published, and the name of the file they came out of. If she
wants to check us she now knows exactly what to download.
```

**Aside:**
```
Our own notes still say O*NET 29.1. The folder on disk says 30.0. The folder is what we
loaded, so 30.0 is what this page prints.
```

---

### 3.2 · Made and sold

**Heading:** `Made and sold`

**The test, in plain words:**
```
If it is a way of naming what a business makes, buys or ships, it is here.
```

**Rows:**
```
NAICS                    how North America names its industries
                         Feeds industries · NAICS 2022. Public domain.

NAPCS                    the products those industries sell
                         Feeds products · NAPCS 2022. Public domain.

UNSPSC                   one code for anything a business buys
                         Feeds products · no version stated; the download requires
                         registration. The largest thing we hold, and the only one
                         with no page of its own yet.

GS1                      what a product is, where it went, and the words for both
                         Feeds products and logistics · product classification as of
                         May 2025, with the November 2024 network release beside it;
                         the event standard at 2.0.1; the web vocabulary at 1.17.
                         GS1 General Specifications licence, free for members.

eCl@ss                   the European classification for industrial and technical
                         products
                         Feeds products · no version stated. The forty-nine segments
                         at the top, and none of the forty thousand classes its own
                         documentation says sit underneath them.

ETIM                     the classification electrical wholesalers use
                         Feeds products · no version stated. Eighty example classes
                         out of the several thousand it publishes.

Schema.org               the vocabulary the web uses to describe things to machines
                         Feeds schema · no version stated. CC BY-SA 3.0.
```

**The human example:**
```
A buyer is told a supplier's catalogue is GS1 ready, and does not know what that would
mean.

One row tells her GS1 is three different things with three different dates: a product
classification as of May 2025, an event standard at 2.0.1, and a web vocabulary at 1.17.
She can now ask the supplier which one, which is the real question, and the row got her
there without a single badge.
```

**Aside:**
```
Our own superset of Schema.org is on the other shelf, under What we wrote ourselves.
```

---

### 3.3 · Health

**Heading:** `Health`

**The test, in plain words:**
```
If a clinic, a pharmacy or an insurer has to write it on a form, it is here.
```

**Rows:**
```
ICD-10-CM                every diagnosis a U.S. clinician can write down
                         Feeds health · fiscal year 2026, which runs 1 October 2025
                         to 30 September 2026. Public domain.

HCPCS Level II           the codes for supplies and services a doctor bills for
                         Feeds health · January 2026. Public domain, from CMS.

NDC                      the FDA's directory of finished drug products
                         Feeds health and products · downloaded 5 December 2025. Ten
                         thousand products out of the hundred and thirty-five
                         thousand the directory holds. We took a sample, and this is
                         it.

NPI provider taxonomy    the code that says what kind of clinician someone is
                         Feeds health and occupations · version 25.1, released
                         1 July 2025. Public use, maintained by NUCC.

HL7 FHIR                 the shape of a health record moving between two systems
                         Feeds health · R5, version 5.0.0. CC0. The resources and
                         the datatypes.

SNOMED CT                clinical terms
                         Feeds health · the top-level hierarchy only. The full set
                         needs a licence from SNOMED International and we do not
                         hold one.

RxNorm                   normalised drug names
                         Feeds health · the monthly release, October 2025. Free to
                         use. The term types, and none of the drugs under them.

LOINC                    the identifiers for lab results and measurements
                         Feeds health · 2.81, released 12 August 2025. Its axes and
                         its categories, and none of its codes. Use is governed by
                         the LOINC licence agreement.

CPT                      the codes for medical procedures
                         Feeds health · category information only. The codes are the
                         AMA's and need a licence we do not hold.
```

**The human example:**
```
A hospital analyst is checking whether the diagnosis codes behind an answer page are
current.

The row says fiscal year 2026, and says what that means: 1 October 2025 to 30 September
2026. One row down she learns we hold ten thousand drug products out of a hundred and
thirty-five thousand, because that is the sample we took. She now knows one of these is
safe to rely on and the other is not, and she found that out in eleven seconds.
```

**Aside:**
```
Two of these need a licence we do not hold: SNOMED CT and CPT. We hold the parts their
publishers make public and nothing else, and the rows say which parts.
```

---

### 3.4 · Money and paperwork

**Heading:** `Money and paperwork`

**The test, in plain words:**
```
If it identifies who is paying, or it is the message that carries the order,
it is here.
```

**Rows:**
```
ISO 20022                the message one bank sends another
                         Feeds finance · no version stated. The message catalogue.
                         ISO TC68 maintains it; SWIFT holds the registry.

LEI                      the twenty-character code that says which company this is
                         Feeds business · no version stated. The registration
                         authorities. GLEIF maintains it.

ISIN                     the code for a security
                         Feeds finance · no version stated. The national numbering
                         agencies. ANNA maintains it.

MCC                      the four digits on a card payment that say what kind of
                         shop it was
                         Feeds finance and business · ISO 18245:2023. ISO TC68 and
                         the card networks maintain it.

BIC                      the code that identifies a bank
                         Feeds finance · ISO 9362:2014. The structure and its country
                         codes, and not the register of banks itself. SWIFT maintains
                         it.

X12                      North America's electronic purchase orders and invoices
                         Feeds logistics and products · no version stated. Its
                         transaction sets, its segments and its elements.

UN/EDIFACT               the same idea, for the rest of the world
                         Feeds logistics · directory D.20B. Public domain under the
                         UN terms of use.

EANCOM                   GS1's version of EDIFACT for consumer goods
                         Feeds logistics and products · no version stated. GS1
                         maintains it.

Peppol                   Europe's e-invoicing network, now used well beyond Europe
                         Feeds logistics · no version stated. OpenPeppol maintains
                         it.
```

**The human example:**
```
A payments engineer wants the merchant category code list and wants to know whose it is.

The row names ISO 18245:2023, and names ISO TC68 and the card networks as the ones who
maintain it. We are neither, and the row does not pretend otherwise. What we are is the
place that copied it and wrote down the date. That is a smaller claim than most pages
about standards make, and it is the one we can keep.
```

**Aside:**
```
UN/EDIFACT publishes 317 message types. We hold 195 of them.
```

---

### 3.5 · The lists everyone quotes

**Heading:** `The lists everyone quotes`

**The test, in plain words:**
```
If the other standards on this page cite it rather than compete with it, it is here.
```

**Rows:**
```
ISO 3166 · 4217 · 639    country codes, currency codes, language codes
                         Feeds places, units and language · no edition stated. Some
                         ISO standards are free and others must be bought.

UN/LOCODE                a code for every port, airport and inland place goods pass
                         through
                         Feeds places and logistics · our notes cite the loc241
                         release. Public domain under the UN terms of use.

UN M49                   the UN's regions of the world
                         Feeds places · no version stated. The regions only, and none
                         of the countries underneath them.

IANA time zone database  the zones, and the rules for when the clocks change
                         Feeds units and places · taken from the vvo/tzdb mirror,
                         downloaded 7 December 2025. Public domain.

W3C                      the specifications the web is written to
                         Feeds tech and schema · twenty-two of them, from JSON-LD and
                         RDF to WCAG and ARIA. Per-specification versions are not
                         stated. W3C Software and Document Licence, with MDN's
                         licence cited for some tables.
```

**The human example:**
```
A developer wonders why country codes are filed beside the web's specifications.

Because nearly every other row on this page cites one of them. When a shipping record
names a country it is naming ISO 3166; when it names a port, UN/LOCODE; when it stamps a
time, the IANA database; when it is published as linked data, a W3C specification decides
what that means. This section is the bottom of the pile, and the rows above it lean on it.
```

**Aside:**
```
Four of the twenty-two specification folders filed under W3C are not W3C's. DOM and HTML
are WHATWG's, Dublin Core is DCMI's, FOAF is the FOAF project's. The folder name is a
shelf label, not an attribution.
```

---

### 3.6 · Government registers

**Heading:** `Government registers`

**The test, in plain words:**
```
If one government publishes it and everyone trading with that government has to use it,
it is here.
```

**Rows:**
```
Census Bureau            state and county codes, and the metro-area boundaries
                         Feeds places · FIPS codes with the July 2023 metro-area
                         delineation, downloaded 7 December 2025. Public domain.

SEC                      the older industry list, still used on filings
                         Feeds industries · the four-digit SIC list, downloaded
                         7 December 2025. Public domain.

USITC                    the tariff schedule for goods entering the United States
                         Feeds products · downloaded 7 December 2025. Public domain.
                         The chapters, and nothing beneath them.

GSA                      the codes the federal government buys under
                         Feeds products and services · Product Service Code Manual,
                         April 2025, with the supply classes beside it. Public
                         domain. The classes, and almost nothing beneath them.

SBA                      what counts as a small business
                         Feeds business · 13 CFR 121.201. Public domain. The business
                         and contract types, and not the size thresholds by industry.

USPTO                    the classes a trademark or a patent is filed under
                         Feeds law and products · Nice Classification 12th edition
                         2025, with Locarno, CPC and USPC beside it, downloaded
                         7 December 2025. Public domain. The Nice and Locarno classes
                         are whole; the patent classifications are a handful of rows.
```

**The human example:**
```
A contractor is trying to work out which product-service code a bid falls under.

The row tells her what we hold and, more usefully, what we do not: the April 2025 manual's
classes, and almost nothing beneath them. She learns in one line that this is not the place
to finish that job. A page that had let her find that out on her own would have cost her
the afternoon.
```

**Aside:**
```
Four of these six are the beginning of a register rather than the register. Each row says
which.
```

---

## 4 · WHAT WE WROTE OURSELVES — the second shelf

Same frame, same type, same geometry as the six above. **The frame does not change** because the
shelf changed; the repetition is the argument, and a bespoke treatment here would print a claim in
layout that the copy is not allowed to make.

**Heading:** `What we wrote ourselves`

**The test, in plain words:**
```
If nobody outside this Foundation governs it, it is here. That is the whole test.
```

**Rows.** Same two-line grammar, with the status where the version goes. **The name is a link
only where §9 says it is live.**

```
AXP                      what an API has to publish so an agent can use it on first
                         contact, with nobody reading the documentation
                         Draft 0.3.0, dated 21 July 2026. Published by apis.ax and
                         verified by api.qa. Home: axp.org.ai

MDXLD                    MDX with $id, $type and $context in the frontmatter
                         No version number. A superset of the open MDX format, whose
                         frontmatter is itself a superset of YAML-LD. $context is
                         always https://schema.org.ai, with no version in it.
                         Home: mdx.org.ai/docs and mdxld.org

PRODUCT.md               one Markdown file saying who a product is for, how it speaks
                         and what it costs
                         Draft. Its own page calls itself the one-page home of the
                         specification and says plainly that it is a specification we
                         write, not a standard we host. The owner's ruling records it
                         at 0.9; the file carries no version string, so this page says
                         draft. Home: product.md

TODO.md                  a task list a machine can also read, in a plain Markdown file
                         No version number. In use in this Foundation's own repos
                         today. Home: todo.md.org.ai

schema.org.ai            our superset of Schema.org, extended for work machines do
                         No version number. Adds our own types on top of the ones
                         Schema.org publishes. CC BY-SA 4.0; the vocabulary it
                         extends is CC BY-SA 3.0. Home: schema.org.ai

AGENTS.md                the frontmatter an AGENTS.md file carries so one file can
                         compile to AGENTS.md, CLAUDE.md and .cursorrules
                         No version number. Home: agents.md.org.ai
```

**The human example:**
```
A developer is deciding whether to build against AXP.

The row says draft. It says 0.3.0. It says 21 July 2026. And the section says nobody
outside this Foundation has yet built anything that depends on it. Then the row links to
the specification, which is live and readable today. Nothing has been oversold, and the decision is hers with
the facts already in front of her.
```

**Aside — the honest statement of status. Do not trim it:**
```
One of the six carries a version and a status in its own file: AXP, draft 0.3.0. The other
five carry no version number at all. None of them is at 1.0, and none will be until at
least two people outside this Foundation have built something that depends on it. That has
not happened for any of them.
```

**Builder note.** That aside is the fixation gate in plain words. The letters, the phrase
"fixation gate", and any count of adopters, users, downloads, stars or integrations are banned
(§11). *Nobody outside this Foundation has built anything on any of these*, and the page says it
in words rather than printing a zero.

**On the count "six":** counted by reading the six rows above. There is no seventh, and a seventh
may not be added to this page without being added to `/llms.txt` in the same change.

---

## 5 · HOW A PAGE SAYS WHERE IT CAME FROM — showcase section

Placed **after** the seven sections. This is the one place on the page where the visitor is shown
a mechanism rather than a shelf. Registers are dropped; single measure, left-anchored, the widest
vertical padding on the page.

**Heading:**
```
How a page says where it came from
```

**Lead-in, one sentence:**
```
The same line sits at the bottom of every page in this estate, so you never have to ask
where a fact came from — and on this shelf most of that line is blank, which is the
point.
```

**The strip. Reproduce character for character.**

```
  onet.org.ai/29-1292.00
  Dental Hygienists

  Seeded from the O*NET database 30.0 — Curated at occupations.org.ai — Built as
    — Minted at — Operated by

  loaded from db_30_0_text · public domain, a U.S. Government work · one row in
    ONET.Occupations.tsv · code 29-1292.00, kept exactly as published
```

**Builder notes on the strip:**

1. **Every name in it is text, not a link.** `onet.org.ai` serves a holding page and
   `occupations.org.ai` serves nothing (§9).
2. **The five phrases are the ratified ones**, in the ratified order: *Seeded from — Curated
   here — Built as — Minted at — Operated by.* The second reads **`Curated at {name}`** here
   rather than *Curated here*, because this page is the copy and not the curation. One slot, two
   readings, same position, every time.
3. **The four separators are em dashes and they are the owner's**, quoted from the ratified
   provenance line. **They are the only em dashes on this page the builder may place**, and the
   builder authors none at all: the lead-in above and the §12 404 note carry the only other two,
   and both are ratified prose reproduced character for character (§14).
4. **Three of the five phrases end in nothing, and stay dark.** `Built as`, `Minted at` and
   `Operated by` are followed by a visible blank. The refusal is implemented as the *absence* of
   an animation — the blank phrases carry no rule anywhere in CSS or JS, so the builder cannot
   light them by accident.
5. **The second line is the loading receipt**, which is this shelf's version of foundation's
   measurement line: what file it came out of, under what licence, into which of our files, and
   the publisher's own code kept unchanged.
6. Every fact in the strip is real: that row exists in `.data/ONET.Occupations.tsv` with code
   `29-1292.00` and name `Dental Hygienists`, and its source folder on disk is `db_30_0_text`.

**The three notes below the strip. Exact copy, separated by hairlines, never three columns:**

```
Five plain phrases, the same five on every page in this estate. On a page like this one
only the first two ever fill in, because a record we copied was not built, minted or
operated by anybody here.

Where a step did not happen the line shows a blank instead of a plausible name. Three of
the five are blank above, and none of the three will ever fill in. A blank is information.

This is a specimen. The page it describes is not published. The row it is drawn from is
in this repository today.
```

---

## 6 · WHAT THIS IS

Placed after the showcase. Under 60 words, as mandated. **58 words — do not add one.** The one
section with no motion beyond a single 300 ms opacity fade.

**Heading:**
```
What this is
```

**Body (58 words — do not extend):**
```
This is the Org.AI Foundation's standards register. One shelf holds other people's
records, copied and never corrected, with the date and the version we loaded.

The other holds the handful of standards we wrote ourselves, each one saying how
unfinished it is.

Where we hold a piece of something rather than all of it, the page says which.
```

---

## 7 · FOOTER

Four rows on `--well`, opened by a full-frame rule. No newsletter box, no social icons, no partner
logos, no cookie banner — the page loads nothing, so there is nothing to consent to.

**Row 1 — the seven words again, as scroll anchors, UNLIT:**
```
Work · Made and sold · Health · Money and paperwork · The lists everyone quotes ·
Government registers · What we wrote ourselves
```

**Row 2 — the honest state of the register:**
```
Eighteen folders on disk and forty-three collections with anything in them, counted on
28 July 2026. Six standards of our own, none of them finished. Six outside bodies this
Foundation has already reserved a place for have nothing loaded yet, and they are named
one at a time in /llms.txt. This page was written from the repository, on the day it was
counted.
```

**Row 3 — what is actually open today, labelled as such.** These seven are links. Preceded by its
own small label:
```
Open today:  axp.org.ai · mdx.org.ai/docs · mdxld.org · product.md · schema.org.ai ·
todo.md.org.ai · agents.md.org.ai
```

Every one of them is a home of something on the second shelf. **Nothing on the first shelf appears
in this row, because nothing on the first shelf is open.** If that ever stops being true the row
grows; it never gets padded.

**Rule.**

**Closing line:**
```
The Org.AI Foundation · standards.org.ai · For machines: /llms.txt
```

`The Org.AI Foundation` is a link to `https://foundation.org.ai`. `standards.org.ai` is this host
and is **text** — a page does not link to itself. `/llms.txt` is a link (same origin).

*The page ends on the only concentrated colour it contains, and that colour is exactly the set of
things that are real.*

---

## 8 · `/llms.txt` — the machine-facing file

Served at `https://standards.org.ai/llms.txt`, `Content-Type: text/plain; charset=utf-8`,
`cache-control: public, max-age=300, must-revalidate`. Held as a template literal in the worker,
not as a file in `public/`, so the machine face and the human page cannot drift apart. Reproduce
verbatim.

```
# The Org.AI Foundation · Standards

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
```

---

## 9 · THE PERMITTED-LINK REGISTRY

Checked live with `curl` on **2026-07-28**. **These are the only outbound links allowed anywhere
on the page.** Every other name in this file is text.

| Destination | Verified state, 2026-07-28 | Where it may appear |
|---|---|---|
| `https://axp.org.ai/` | 200, real page — "AXP — The Agent eXperience Protocol" | §4 AXP row; footer row 3 |
| `https://mdx.org.ai/docs` | `mdx.org.ai/` 307 to `/docs`; `/docs` 200, real docs site | §4 MDXLD row; footer row 3. **Link `/docs` directly**, never the redirect |
| `https://mdxld.org/` | 200, real page | §4 MDXLD row; footer row 3 |
| `https://product.md/` | 200, real page — "PRODUCT.md, the open standard for describing a product" | §4 PRODUCT.md row; footer row 3 |
| `https://schema.org.ai/` | 200, real page | §4 schema.org.ai row; footer row 3 |
| `https://todo.md.org.ai/` | 200, real page — "TODO.md — a task list a machine can also read" | §4 TODO.md row; footer row 3 |
| `https://agents.md.org.ai/` | 200, real page — "AGENTS.md — the MDXLD frontmatter profile" | §4 AGENTS.md row; footer row 3 |
| `https://foundation.org.ai/` | 200, real page | footer closing line only |
| `/llms.txt` | same origin, served by this worker | footer closing line only |

**Explicitly not links, with the reason:**

- **Every outside body named on this page** — `onetcenter.org`, `gs1.org`, `hl7.org`, `w3.org`,
  `iso.org`, `x12.org`, `peppol.org`, `unspsc.org`, `apqc.org`, `snomed.org`, `loinc.org`,
  `nucc.org`, `careertech.org`, and the rest. Somebody else's property. **Naming a body is a
  citation; a link is a destination, and we do not hand a reader off to finish our sentence.**
  This one applies even where the site is plainly live and plainly correct.
- `onet.org.ai`, `apqc.org.ai`, `gs1.org.ai` — 200, but a holding page. A holding page behind a
  link is a broken promise wearing a link's clothes.
- `soc.org.ai` — 200, but serves another site's page. A misroute is worse than a dark name.
- `wikipedia.org.ai` — 200, but returns JSON. Sending a person to a JSON blob is the same broken
  promise.
- `naics.org.ai`, `un.org.ai`, `x12.org.ai`, `hl7.org.ai`, `iso.org.ai`, `ieee.org.ai`,
  `iana.org.ai`, `w3.org.ai`, `epcis.org.ai`, `markdown.org.ai`, `mcp.org.ai`, `gdpval.org.ai` —
  no response at all.
- `occupations.org.ai`, `products.org.ai`, `industries.org.ai`, `process.org.ai`,
  `education.org.ai`, `logistics.org.ai`, `health.org.ai`, `places.org.ai`, `units.org.ai`,
  `language.org.ai`, `finance.org.ai`, `business.org.ai`, `law.org.ai`, `tech.org.ai`,
  `skills.org.ai`, `courses.org.ai`, `services.org.ai` — the destinations named in the rows'
  *Feeds* phrases. Not checked as human pages and **not needed as links**: the phrase says where
  the row lands in this estate, not where to click.
- `standards.org.ai` — **this host. A page does not link to itself, and on the day this file was
  written the host did not respond at all.**
- `md.org.ai` — 200 and real, and it is the `.md` register rather than anything on this page's two
  shelves. Not named on this page, so not a link on this page.

**Re-check before every deploy.** If one of the nine goes down it drops to text the same day and
footer row 3 gets shorter. If a name in the "not links" list comes up **and serves a real page a
person can read**, it may be promoted, and `/llms.txt` must be edited in the same change.

**One more thing to do on the day this ships:** `foundation.org.ai`'s own permitted-link registry
currently lists `standards.org.ai` under *"do not resolve or error."* That entry must be re-checked
and, if this host is live, promoted in the same change that ships this page.

---

## 10 · WHERE EVERY NUMBER ON THE PAGE CAME FROM

Every figure printed on the visible page or in `/llms.txt`, and the command that produced it. Run
in the repository root on 2026-07-28.

| Figure | Command |
|---|---|
| 18 folders | `git ls-tree -d --name-only HEAD \| grep -v '^\.' \| wc -l` — git-tracked top-level folders. A bare `ls -d */` returns 19: it also picks up the untracked `site/`, this website's own source, which is not a copied standard |
| 43 collections with data | the 43 rows of §3 and §8, each holding at least one row in `.data`; verified by grouping `.data/*.tsv` on filename prefix and splitting the four grouped folders on their second segment |
| 466 original files | `git ls-files .source \| wc -l` |
| 628,019 raw rows | `awk 'FNR>1{c++}END{print c}' .data/*.tsv` |
| 478,507 distinct entries | unique `(ns, type, id)` triples across the 223 files, `id` falling back to `code`, header excluded. A row carrying neither an `id` nor a `code` is not an entity and is not counted; keeping them would print 478,709 |
| 861,416 links | `awk 'FNR>1{c++}END{print c}' .data/relationships/*.tsv` |
| 223 entity files · 92 relationship files | `ls .data/*.tsv \| wc -l` · `ls .data/relationships/*.tsv \| wc -l` |
| every per-collection row count in §8 | `.data/*.tsv` grouped by filename prefix, header excluded |
| 514 rows that are ours | `Graph.*` (419) + `Superset.*` (95) |
| the six section totals, summing to 627,505 + 514 = 628,019 | the per-collection counts above, added |
| 1,016 occupations · 18,797 tasks | `awk 'FNR>1{c++}END{print c}' .data/ONET.Occupations.tsv` and `.data/ONET.Tasks.tsv` |
| 25,418 rows outside the reserved names | Advance CTE 3,978 + BLS 3,447 + Ecommerce 3,194 + Education 348 + Finance 3,164 + NAPCS 5,362 + U.S. agencies 5,925 |
| 37 publishers | distinct publishing organisations named by this repository's own READMEs, merging shared publishers. Attribution-based, therefore `/llms.txt` only |
| every version, date and licence | the repository's own `.source/README.md` or the relevant `.source/*/README.md`, or a source filename. **"No version stated" is a real answer and is printed as one** |
| 905 pages / 871 types in schema.org.ai | `find things -name '*.mdx' \| wc -l` in that repo, against its README. **They disagree, so no total is printed** |
| every live/dead state in §9 | `curl -s -o /dev/null -w "%{http_code}"` per host |

**If a figure changes, it changes here first, then on the page, then in `/llms.txt`, in one
change.** A figure that appears on the page and not in this table is a bug.

---

## 11 · META AND OPEN GRAPH COPY

**`<title>`** (58 chars):
```
Org.AI Foundation Standards: what we copied, what we wrote
```

**`<meta name="description">`** (158 chars):
```
Two shelves. One holds other people's records, copied and never corrected, with the date we loaded each. The other holds the few standards we wrote ourselves.
```

**Open Graph:**
```
og:type          website
og:site_name     The Org.AI Foundation · Standards
og:url           https://standards.org.ai/
og:title         The Org.AI Foundation · Standards
og:description   We copy other people's records and never correct them. The few we wrote
                 ourselves sit on a second shelf, and say how unfinished they are.
og:locale        en_US
og:image         https://standards.org.ai/og.png
og:image:width   1200
og:image:height  630
og:image:alt     The Org.AI Foundation Standards. Other people's records, copied and
                 never corrected. Ours on a second shelf, marked unfinished.
```

**Twitter card:**
```
twitter:card         summary_large_image
twitter:image        https://standards.org.ai/og.png
twitter:title        The Org.AI Foundation · Standards
twitter:description  We copy other people's records and never correct them. The few we
                     wrote ourselves sit on a second shelf, and say how unfinished
                     they are.
```

**Note on the `og:image` divergence, so this page does not inherit a contradiction.**
Foundation's written spec refuses `og:image` and mandates `twitter:card: summary`; foundation's
*shipped* page carries `og:image` and `summary_large_image`. **The shipped code is the newer
decision and this page follows it.** The card is a committed PNG fetched only by link unfurlers,
never by the page, so the one-request law is untouched.

**The og-card, `src/og-card.html`.** 1200×630, rendered once by headless Chrome and committed as
`src/og.png`. Layout is the page's own object at poster scale: a 6 px accent edge inset 96 px on
the left, then a flex column at `space-between`. Three strings, and no others:

```
wordmark   The Org.AI Foundation · Standards
substance  Other people's records, copied and <em>never corrected</em>.
           Ours on a second shelf, marked unfinished.
host       standards.org.ai
```

The `<em>` is recoloured to the accent with `font-style: normal`. Use `&nbsp;` to protect the
intended line breaks. **Keep the font path relative** (`url("fonts/publicsans-subset.woff2")`) so
the card renders correctly from `file://` with the working directory at `src/`; an absolute path
falls back silently to the system face and the card ships in the wrong typeface. Tokens are
hard-coded literals mirroring the dark palette, with a comment saying so, because a share card has
no `prefers-color-scheme`.

**Other head elements:**
```
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://standards.org.ai/">
```

No `<meta name="generator">`, no verification tags, no `preconnect`, no `dns-prefetch`, no
`theme-color`.

**Favicon.** Inline SVG data URI, roughly 190 bytes, zero requests, carrying its own dark ground so
it reads on light and dark browser chrome. **The object is two stacked bars, not one** — this page's
subject is two shelves, and a single accent bar is foundation's object and belongs to foundation.
Both bars at least 2.6/32 of the viewBox thick, or they render sub-pixel at 16 px and disappear.

**Glyph budget.** The shipped font subset covers `U+0020-007E`, `U+00A0`, `U+00B7`, `U+2013`,
`U+2014`, `U+2018`, `U+2019`, `U+201C`, `U+201D`. Every string in this file is inside it, including
`O*NET`, `eCl@ss` and `13 CFR 121.201`. **No copyright sign, section sign or dagger appears
anywhere on this page** — where an attribution would want one, the copy spells the word instead
("copyright 2025 Standards.org.ai"). If a future string needs a new glyph, the `--unicodes` list is
extended and the font re-subset in the same change, or the glyph falls back silently to the system
face.

---

## 12 · THE 404 PAGE

Same stylesheet, same wordmark, no script at all. Copy shape is foundation's: a headline that is a
refusal, one line saying what this page is, the section list, a rule, the closing line.

**Headline:**
```
There is no page here.
```

**One line:**
```
This host holds a register of standards. If you followed a link to a body's own page, that
page does not exist here — we hold the record, not the body.
```

**Then:**
```
Pick a section instead:
Work · Made and sold · Health · Money and paperwork · The lists everyone quotes ·
Government registers · What we wrote ourselves
```

Each is an anchor into `/#{slug}`.

**Rule.**

**Closing line, identical to the footer's:**
```
The Org.AI Foundation · standards.org.ai · For machines: /llms.txt
```

---

## 13 · THE COMPLETE SECTION ORDER

```
 1  Hero                              wordmark · mission line · honesty line ·
                                      three counters · seven-word nav
 2  Work                              7 rows
 3  Made and sold                     7 rows
 4  Health                            9 rows
 5  Money and paperwork               9 rows
 6  The lists everyone quotes         5 rows
 7  Government registers              6 rows
 8  What we wrote ourselves           6 rows
 9  How a page says where it came from    (the showcase strip)
10  What this is                          (58 words)
11  Footer
```

Eleven sections. One idea each. The seven in the middle are **the same shape seven times**, and the
seventh is the second shelf in the same frame as the first six. The sections run 5 to 9 rows and
the frame never changes: **a bespoke layout for a heavier section would print a per-section weight
by design, which is the same claim §14 forbids in digits. The repetition is the argument.**

---

## 14 · STRINGS AND DEVICES THE BUILDER MAY NOT ADD

**Carried over from foundation's §11 unchanged:**

- "Coming soon", "Beta", "Early access", "Join the waitlist", "Get notified"
- "Sign up", "Log in", "Get started", "Learn more", "Explore"
- Any statistic not present in this file
- Any testimonial, partner name, funder name, or press logo
- Any use of the words "graph", "ontology", "taxonomy", "canonical", "dimension", "rung",
  "G1", "G2", "G3", "G4", "G5", "membrane" in visible page copy, `alt`, `aria-label`, `title`,
  or CSS-generated content. **One exemption, added 2026-07-28: a publisher's own name for a code
  set, quoted in a row's `dt`.** `NPI provider taxonomy` (§3, health) is what NUCC calls it, and
  the row's `dt` slot is a citation, not our description of what the thing is — the same reason
  `eCl@ss` keeps its `@`. The ban reaches every word this page writes about its own contents; it
  does not reach a name we are copying. It still reaches the `dd`, the `alt`, the `aria-label`,
  the `title` and CSS-generated content without exception.
- Any claim that a page, API or search is available when it is not

**New, and specific to a standards register:**

- **"Authoritative", "trusted", "official", "the official source", "the industry standard",
  "de facto standard", "gold standard."** We are not the source of any of it. We are the place
  that copied it and wrote down the date.
- **"Certified", "conformant", "compliant", "validated", "accredited"** describing our relationship
  to any outside body. No body has certified anything here.
- **"In partnership with", "in collaboration with", "with the support of", "endorsed by",
  "member of", "contributor to"**, or any outside body's logo, mark, or name used as a badge.
  **We have contacted nobody.**
- **"Complete", "comprehensive", "full coverage", "the complete set", "all of", "everything"**
  as a claim about any collection. Where we hold the whole of what a row names, the row simply
  does not say otherwise; where we do not, the row says which fraction (§0.7).
- **"1.0", "v1", "stable", "final", "released", "production-ready", "GA", "recommended",
  "standard" (as a status)** applied to anything on the second shelf.
- **Any count of adopters, users, downloads, implementations, integrations, stars, or binders**,
  and any zero standing in for one. The fixation gate is stated in words in §4's aside, and words
  are the only permitted form.
- **"Real-time", "live", "always up to date", "continuously synced", "automatically updated."**
  Nothing here updates itself. Every collection carries the date it was loaded and that date is
  the whole claim.
- **"Download", "API", "browse the data", "query", "search"**, or any control implying one, unless
  the thing exists and §9 has verified it.
- **Any share, ratio, percentage or fraction expressing how much of a standard we hold** — that is
  the unmeasured counter, and it is unmeasured everywhere, not only in the hero.
- **Any number in the third counter, in the value or in the check-line.** Row three carries no
  digit at all.
- **Any per-section count of bodies, collections or rows on the visible page.** Those live in
  `/llms.txt`. **The one exception, and it is required rather than permitted: a depth statement
  that the repository itself states about a single row** — "195 of the 317 message types",
  "ten thousand out of a hundred and thirty-five thousand", "49 segments and none of the classes
  beneath them". Those are the honesty law, not a size boast, and they belong on the row.
- **Any outside body's own URL as a link** (§0.5). Naming it is a citation; linking it is a
  destination.
- **`standards.org.ai` as a link on `standards.org.ai`.**
- **Em dashes.** **No em dash in any string the builder or designer authors. Nowhere, ever.**
  The em dashes that ship are quoted, never written, and there are exactly six of them:
  - the **four separators inside the showcase strip in §5**, quoted from the ratified provenance
    line;
  - the **two inside ratified prose** — the §5 lead-in ("…where a fact came from — and on this
    shelf most of that line is blank…") and the §12 404 note ("…does not exist here — we hold the
    record, not the body"). Both were ratified as prose and are reproduced character for character.
    Foundation's own `h1` ships one; these are family-consistent, and rewriting them to a comma or
    a colon would be the builder editing ratified copy, which is the larger offence. Do not "fix"
    them.

  *Ruling, 2026-07-28.* This entry previously read "the four separators … are the only em dashes
  permitted anywhere on this page … nowhere else, in any string, ever", which contradicted the
  lead-in this same file prescribes in §5 and the 404 note it prescribes in §12, and contradicted
  `DESIGN-ADAPT.md` §7.4 and build gate 15, both of which already carve the two prose dashes out by
  name. The law was always about **authorship**, not about the glyph: the builder may not introduce
  one, and ratified copy carries its own. Restated that way, and the count is now stated so a
  seventh is a finding on sight.

**Devices, carried over from foundation's DESIGN-SPEC §12 in full and restated where a register
tempts a builder differently:**

- No count-up numbers, no animated statistics, no odometer, no skeleton or reserved slot in the
  unmeasured counter at any moment including mid-animation.
- **No status badge, pill, chip, dot, tick, cross, traffic light or coloured label** on any row.
  A row's status is words. A green dot beside "public domain" would be a visual variable encoding
  a fact a visitor cannot check from this page.
- **No accent on anything that is not real today.** Four of the seven middle sections contain zero
  accent, because nothing in them is live.
- **No hover state, underline, colour change or pointer cursor on any text-only name** — and this
  page is nearly all text-only names, so this gate matters more here than at foundation.
- **No table, no card, no panel, no tile, no card grid, ever.** Rows are text in two lines; the
  only recess on this page is the showcase strip.
- **No sorting, filtering, expanding, collapsing, tabbing or searching of the rows.** A register
  you can sort is a database, and there is no database behind this page.
- Zero icons. Not one glyph that is not a letter, a `·`, a permitted `—` (the em dash entry
  above governs which six), or a `→`.
- No photograph, illustration, canvas, SVG scene, particle field, node-and-edge drawing,
  constellation, mesh, lattice or globe. No emulsion, grain, dust, vignette, sepia, paper tone,
  engraving or texture overlay. **The page draws nothing.**
- No gradient anywhere including in text, no `background-clip: text`. No cool hue: no blue, cyan,
  violet, teal or terminal green. No neon, blur, glass, glow or bloom. No display serif, italic
  headline, drop cap, or tracked-uppercase kicker. No `#000`, no `#fff`. No border-radius above
  2 px. **No centring, at any breakpoint.**
- No modal, toast, tooltip, accordion, tabs, carousel, drawer, sticky call to action or hamburger.
  No sign-up, waitlist, newsletter, social icon, cookie banner or analytics.
- No pin, no track inflation, no parallax, no replay of any arrival. No hover that moves, scales or
  lifts. No bounce, elastic, spring or overshoot. No idle loop, zero rAF at rest. No typewriter
  effect.
- **No external request of any kind.** One document, one inline `<style>`, one inline `<script>`,
  one base64 font, one data-URI favicon.

**The gate that outranks the rest:** *turning off all motion changes nothing about what this page
asserts.* If a fact on this page is only legible while something is moving, it is not on the page.
