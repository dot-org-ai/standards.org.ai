# DESIGN-ADAPT.md — standards.org.ai

**This is not a design. It is an adapter.** foundation.org.ai's `DESIGN-SPEC.md` (1,279 lines) is
the design; this file says which parts of it are copied without touching, which parts are pointed at
different content, and the small number of places where this page's subject legitimately forces a
departure. Every departure below carries its argument. A departure without an argument in this file
is a bug.

**Read in this order and do not skip:**

| Order | File | Authority |
|---|---|---|
| 1 | `/Users/nathanclevenger/projects/standards.org.ai/site/LANDING-CONTENT.md` | **the copy law.** Every visible string. If a string is needed and is not there, ask; do not invent |
| 2 | `/Users/nathanclevenger/projects/foundation.org.ai/DESIGN-SPEC.md` | the design system this page wears |
| 3 | `/Users/nathanclevenger/projects/foundation.org.ai/src/styles.css` | the shipped tokens; the file wins over the prose where they disagree |
| 4 | this file | the adapter, and only the adapter |

**Never modify anything outside `standards.org.ai/site/`.** The repository around it is the ingest
pipeline; the site is a self-contained worker project inside it.

**The no-outreach rule is absolute.** No issue, comment, `@`-mention, email, form, or contact of any
kind outside our own repositories. This page names roughly fifty outside bodies and contacts none of
them. Design consequence, stated once and enforced in §7: no logo, no mark, no badge, no seal, no
"in partnership with", and no outbound link to any of them (copy law §0.5).

---

## 0 · The one-sentence brief

> standards.org.ai is the same institution, in the same clothes, writing down a register instead of
> a map.

Everything in this file follows from that sentence. The tokens, the type scale, the palettes, the
spacing curve, the motion grammar and the honesty laws are **inherited, not re-derived**. The page's
own subject — two shelves, forty-nine rows, and a version string on every one of them — forces
exactly **six** structural deltas. They are enumerated in §4 and nowhere else.

**Register:** brand. Design *is* the product here; there is no application behind this page.

**Theme:** not a decision. Both schemes ship, inherited verbatim. The scene sentence that would have
forced a choice is: *a hospital analyst at 11 a.m. under office fluorescents, on a laptop, checking
whether the diagnosis codes behind an answer page are current, with eleven seconds of patience.*
Office fluorescents force light to be first-class, and foundation's warm-paper light palette
(`--ground: oklch(0.972 0.005 86)`) already is. Nothing to add.

---

## 1 · The object, ruled

Foundation's object is **a straight edge travelling across type** — the boundary between what has
been written down and what has not, doing seven jobs (the pass, the door cut, the caret, the spine,
the record rule, the idle wipe, the close).

**Ruling: this page inherits the edge deliberately, and does not invent a second object.**

The argument is the brief's own sentence. The edge is *writing down having a leading edge*, and this
page is the same institution doing the same act on a different subject — copying somebody else's
record and writing the date beside it. A sibling that borrowed the tokens and invented its own
object would read as two design systems arguing; a sibling that borrowed the tokens and invented
nothing reads as one institution with two surfaces. That is what is true.

**Two of the edge's seven jobs do not exist here, and nothing replaces them.**

| Job | Here |
|---|---|
| The pass | **kept.** One hairline writes the fold in 1,150 ms, once |
| The door cut ×7 | **kept.** Seven sections, same five-slot stagger |
| The spine | **kept.** Eleven ticks, same as foundation. Content law §13 lists eleven sections |
| The record rule | **kept, and sharper.** It lights two of five phrases here instead of four of five |
| The close | **kept.** Seven live names cut in over 900 ms |
| The caret | **gone.** There is no input. Nothing takes its place (§4.1) |
| The idle wipe | **gone.** There is no placeholder to wipe |

**The page's own object, for the two surfaces that are not the page:** the favicon and the share
card need one mark, and it may not be foundation's vertical edge, which belongs to foundation. Copy
law §11 rules it: **two stacked bars.** Two shelves seen edge-on, in the page's own scroll order —
theirs above, ours below. Spec in §6.

**The bars appear nowhere on the page itself.** The page draws nothing. A favicon is browser chrome
and a share card is fetched only by unfurlers; both are outside the one-request law and outside the
no-imagery law, and foundation already argues both exemptions.

---

## 2 · Inherited verbatim — copy these, do not re-derive them

Anything in this section that appears in a diff as "improved", "modernised", "simplified" or
"cleaned up" is a regression. The values are load-bearing and their reasons are in `DESIGN-SPEC.md`.

### 2.1 · Colour — both palettes, whole

`styles.css:19–109`, byte for byte. Eleven names, the same eleven jobs in both schemes, authored in
OKLCH at hue 78–86 with chroma 0.005–0.007 on every neutral.

- Dark (`:root`) — the identity, the default. `--ground: oklch(0.178 0.006 78)` … `--now:
  oklch(0.800 0.118 68)`.
- Light (`@media (prefers-color-scheme: light)`) — warm paper, hue 80–86. `--ground: oklch(0.972
  0.005 86)` … `--now: oklch(0.530 0.118 62)`.
- `--ink-2-src` and the `@media (prefers-contrast: more)` promotion block. **Do not inline the dark
  values into the light scheme.** The whole point of `--ink-2-src` is that contrast promotion is
  palette-relative.
- `@media (pointer: coarse) { --d-cut: 380ms; --d-step: 40ms }`.
- `color-scheme: dark light` on `:root`.

**The rule a builder cannot get wrong: there is no token below 4.5:1 that renders a character.**
There is no `--ink-4`, and none is added for this page. `·` and `—` are read aloud and carry
structure, so they are UNLIT, not decorative. Hairlines and rings are not glyphs and live in
`--rule`, `--rule-faint`, `--now-deep`.

### 2.2 · The four states, and the fourth is not a colour

| State | Token | Means |
|---|---|---|
| CHECKED | `--ink` | you can verify this by looking at this page |
| WRITTEN | `--ink-2` | written down; not real yet |
| UNLIT | `--ink-3` | a step that has not happened, or furniture around a claim |
| WITHHELD | **no token, no glyph** | the measurement has not been done |

WITHHELD renders nothing. No dim placeholder, no reserved slot, no skeleton, no dash, no zero. The
honesty law is satisfied *by construction* — there is no token in which to print a dim zero.

Consequence, and it is this page's second signature, same as foundation's: **`Not measured yet.` is
CHECKED while the two real numbers are WRITTEN**, because *that no number is printed* is the one
thing a stranger can verify by looking. The brightest words in the counter block are a refusal.

Copy law §1.5 is stricter than foundation here and the stricter form governs: **row three carries no
digit at all, in the value or in the check-line.** Foundation permits digits in row three's
check-line; this page does not.

### 2.3 · The two axes, and there is no third

- **BRIGHTNESS answers *how sure are we?*** Stated as contrast from the ground, never as luminance
  direction, so it survives inversion into light mode intact.
- **HUE answers *is it now?*** The accent is `--now`. It is the page's only present tense.

**The visual-variable law (`DESIGN-SPEC` §2.4), and it decides §4.5 of this file:**

> No visual variable on this page may encode a fact that a visitor cannot check from this page.

Every variable is checkable or conventional. There is no third class and nothing in a third class
ships.

**Exhaustive accent inventory for this page — nothing else, ever:**
the seven live home addresses in the shelf-two rows · the seven addresses in the footer's
`Open today:` row · `/llms.txt` in the closing line · the focus ring · the travelling edge · the
current word's underline in the sticky nav · a spine tick for the 700 ms it is being marked.

That is the whole list. It is shorter than foundation's because this page has no input, no caret, no
suggestions and no bracketed scroll action. **Six of the seven sections contain zero accent**, and
that is not a gap to fill — see §3.5.

### 2.4 · Type

Faces, verbatim:

```css
--font: "Public Sans Var", system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-rec: ui-monospace, SFMono-Regular, Menlo, "Cascadia Mono", "Segoe UI Mono",
            "Roboto Mono", "Liberation Mono", monospace;
```

Public Sans Variable (USWDS, OFL-1.1), self-hosted, **one face**, `font-display: block`. The
argument is provenance, not mood: it is the US federal design system's face, and the largest single
thing on the first shelf is a federal release. Not Inter, not Söhne, not Space Grotesk, not Geist,
and explicitly not `-apple-system`, which resolves to SF Pro on a Mac — the reflex wearing a system
stack.

Mono is the **system stack, zero bytes**, and it is semantic, not decorative:

> The Foundation authors the sans. It does not author the record.

**On this page that rule does more work than it does at foundation**, because nearly every row
contains both. §3.4.3 gives the exact mechanical test for which characters go mono.

Scale, verbatim — 46 / 36 / 28 / 22 / 17 / 13.5, ratios 1.28 · 1.29 · 1.27 · 1.29 · 1.26. Monotone,
no flat step, and the page descends as it goes, which *is* the height law made visual.

```css
--t-mission: clamp(1.4375rem, 1.05rem + 2.15vw, 2.875rem);   /* the ceiling. Nothing is larger */
--t-door:    clamp(1.4375rem, 1.02rem + 1.42vw, 2.25rem);
--t-section: clamp(1.4375rem, 1.16rem + 0.9vw, 1.75rem);
--t-lede:    clamp(1.1875rem, 1.06rem + 0.42vw, 1.375rem);
--t-body:    1.0625rem;    --t-mono: 0.9375rem;    --t-nav: 0.9375rem;
--t-fine:    0.84375rem;   --t-strip: clamp(0.71rem, 2.42vw, 0.9375rem);
```

Weights: display 340 (not 300 — hairline light-on-dark at display size is a legibility risk), body
400 (never 300), labels 470, wordmark 520, "What this is" 330.

Measures: body and examples 62 ch, test lines 46 ch, check-lines 56 ch, footer estate paragraph
72 ch, "What this is" 54 ch. `font-variant-numeric: tabular-nums lining` on the counter block — the
one place the page shows it can count.

### 2.5 · Space, radii, motion

```css
--s1:4px; --s2:8px; --s3:12px; --s4:16px; --s5:24px;
--s6:32px; --s7:48px; --s8:72px; --s9:108px; --s10:160px;   /* non-linear, for rhythm */

--pad-x: clamp(18px, 5vw, 96px);
--frame: min(1240px, 100% - 2 * var(--pad-x));
--radius: 2px;                       /* recesses only. Nothing exceeds 2px, anywhere */

--ease-write: cubic-bezier(0.16, 1, 0.3, 1);      /* anything the edge does */
--ease-state: cubic-bezier(0.22, 0.61, 0.36, 1);  /* state changes */
--d-micro:120ms; --d-state:260ms; --d-cut:700ms; --d-step:90ms; --d-pass:1150ms; --d-tick:700ms;
```

**The armature.** `.frame { width: var(--frame); margin-left: var(--pad-x); margin-right: 0 }` —
left-anchored, **never centred, at any breakpoint.** Centring is what makes a dark page read as a
template.

**The rhythm curve** — the page is not evenly spaced: dense → open → widest → tight → compressed.

| Section | Vertical space |
|---|---|
| 1 Hero | packed, one fold, `min-height: 100svh` |
| 2–8 the seven sections | `padding-block: clamp(--s8, 13vh, --s9)`, `min-height: 82svh` |
| 9 the strip | `padding-block: clamp(--s9, 17vh, 14rem)` — widest on the page |
| 10 What this is | `padding-block: clamp(--s7, 10vh, --s9)` |
| 11 Footer | `padding-block: clamp(--s6, 6vh, --s7)`, on `--well` |

`100vh` appears nowhere. `svh` only, so every fold guarantee is computed against the toolbar-expanded
worst case.

### 2.6 · The recess, and the one shadow in the system

Foundation has two recesses (the input, the strip). **This page has exactly one**, because there is
no input.

```css
background: var(--well);
border: 1px solid var(--rule);
border-radius: var(--radius);
box-shadow: inset 0 1px 0 var(--recess-top), inset 0 -1px 0 var(--recess-bot);
```

`--ground` → `--well` is a 1.08:1 step, deliberately near the threshold of visibility: a recess is
legible from three summed signals, never from fill alone. **There is no elevation shadow anywhere on
this page.** Nothing else has a background, a border, a fill or a shadow — not a row, not a section,
not the two shelves.

### 2.7 · The edge and spine motif, mechanically

Content-agnostic, copy `styles.css:196–260` and the corresponding `site.js` blocks whole.

- `.spine` — 1 px hairline at `left: max(0px, calc(var(--pad-x) - 21px))`, moving to viewport `x: 0`
  with 9 px tick stubs at ≤ 720 px. **It exists only where she has been.** No track ahead, not even a
  dim one. It advances one discrete stroke in `markTick`, never from scroll position.
  > It cannot be a progress bar, because it never shows how much is left.
- `.tick` — eleven of them, from `[data-tick]`. Each flashes `--now` for `--d-tick`, then settles
  UNLIT. Marked at the instant a section's heading finishes being written.
- `.cut-edge` / `.pass-edge` — the visible 1 px `--now` element, `position: absolute` / `fixed`,
  animated with `transform: translateX()` only, running one pixel ahead of the reveal.
- `clipTo(el, f)` — `inset(0 X% 0 -0.14em)`. **The negative left inset is not a typo**; without it
  the ink of the first glyph clips.

### 2.8 · Adaptive-mode blocks — carry across untouched

- **`@media (prefers-reduced-motion: reduce)`** — all six duration tokens to 1 ms/0 ms, and arrival
  is still composed: `html.js body { opacity: 0 }` → `html.js.arrived body { opacity: 1; transition:
  opacity 200ms linear }`. Every element renders in its **final state at load**. `scroll-behavior:
  smooth` stays gated behind `no-preference`.
- **`@media (forced-colors: active)`** — the recess drops to `Canvas` + `1px solid CanvasText`, no
  shadow; links to `LinkText`; every hairline and edge to `CanvasText`; CHECKED text to `CanvasText`.
  Note why the sticky nav's current-word marker is an **underline and not a box-shadow**
  (`styles.css:250`): forced-colors drops box-shadows and would take the marker with them.
- **`@media (hover: hover)` around every `:hover` rule**, each with an `:active` equivalent. Nothing
  depends on a cursor and nothing uses hover to reveal information.
- **`:focus-visible { outline: 2px solid var(--now); outline-offset: 3px }`** — focus *is* the
  present tense, the one place the accent and the accessibility requirement are the same idea.
- `.vh`, `.skip`, `::selection`, the reset, `.u`.

### 2.9 · The `.u` + `<wbr>` markup pattern — non-negotiable

Every list of names is built as `name + separator` units at `white-space: nowrap`, with an explicit
`<wbr>` between units:

```html
<li class="u"><a href="#work">Work</a><span class="sep"> · </span></li><wbr><li class="u">…
```

Without the `<wbr>` there is no break opportunity between adjacent nowrap units and the row silently
overflows. This page's nav labels are multi-word (`Money and paperwork`, `The lists everyone
quotes`) and each must stay whole, so the pattern matters more here than at foundation. Note also
`styles.css:137` — **no `overflow-x: hidden` on body**, deliberately, because it would clamp
`document.scrollWidth` and make the overflow gate unfalsifiable.

---

## 3 · Section-by-section mapping

Eleven sections, one idea each. Content law §13 is the order; `DESIGN-SPEC` §5 is the treatment.

### 3.1 · Hero — the fold, in DOM order

Foundation's hero has six children; this one has five. The aperture is gone.

```
<a class="skip">              visually offscreen until :focus
<div class="spine">           aria-hidden
<nav class="sticky">          hidden on load
<header class="hero" id="hero">
  <div class="frame hero-in">          flex column, space-between, min-height: calc(100svh - --pad-hero)
    p.wordmark.pass                    The Org.AI Foundation · Standards      --t-nav / 520 / UNLIT
    h1.mission.pass                    two sentences, <br class="wide-only">  --t-mission / CHECKED
    p.honesty.pass                     We do change the file format…          --t-fine / UNLIT / 62ch
    dl.counters.pass                   three .crow                            see below
    ul.words.herowords.pass            seven words, with the seam rule        --t-nav / WRITTEN
```

Every hero child carries `class="pass"` — the hook the load sweep clips.

**Wordmark.** `The Org.AI Foundation · Standards`. Both halves at the same weight (520), the `·` at
UNLIT via `.sep`. No tagline beside it. No logo mark: a register that has published one page has not
earned a symbol, and every mark it could draw today would be a claim.

**Mission.** `--t-mission` / wght 340 / `letter-spacing: -0.026em` / `line-height: 1.08` / CHECKED.
The intended wide-screen break is `<br class="wide-only">` with `@media (max-width: 1099px) {
.wide-only { display: none } }`, inherited verbatim. At 1440 the second sentence still wraps inside
the frame; three lines of 46 px is correct and is not a reason to lower the ceiling. **Nothing on
this page is ever larger than `--t-mission`.**

**Honesty line.** Foundation's `.honesty` class, verbatim, but it moves: at foundation it sits under
the input, here it sits directly under the mission, `margin-top: var(--gap-hero-sm)`. It is always
visible, never a tooltip, never truncated, never behind a disclosure. Copy law §1.4: *do not soften
this and do not drop it.*

**Counters.** `dl.counters > div.crow > dt + dd`, verbatim geometry:

```css
.crow { display: grid; grid-template-columns: 192px minmax(0, 1fr);
        column-gap: var(--s5); border-top: 1px solid var(--rule-faint); padding-block: 10px; }
```

Labels — `Copied from others`, `Written down`, `How much of each` — all fit the 192 px register at
`--t-fine` / 470. The `--rule-faint` hairline **runs full width on all three rows, including row
three.** A partial rule would read as a progress bar and imply a number is coming.

Row three's value is the string `Not measured yet.` at CHECKED, typeset identically to the other two.
No number treatment, no colour, no size change, no reserved digit slot, no dash, no skeleton, no
ellipsis — at any moment including mid-animation, in both schemes, at every breakpoint.

`.cval.num` (`tabular-nums lining`) on rows one and two only. **Row three gets no `.num` class**,
because there is nothing to align.

**No chips.** Copy law §1.3. The `.chips` / `.under` block does not ship.

### 3.2 · The fold guarantee — recomputed, and the ruling that makes it hold

Foundation's guarantee: at ≥ 360 px wide and ≥ 748 **svh**, the wordmark, mission, aperture, chips,
honesty line and all three counters with all three check-lines are above the fold; the nav-word row
may fall below.

**This page's counters are substantially taller than foundation's** — row one's value is two lines,
and all three check-lines run to four or five lines at 360 px against foundation's two or three.
Estimated stack at 360 × 748 with foundation's ≤ 760 px block applied unchanged:

```
pad-hero 14 · wordmark 15 · gap 14 · mission ~129 · gap 14 · honesty ~39 · gap 14
counters ~484 · gap 14 · nav words ~97                                   ≈ 835 px
```

That is **≈ 87 px over a 748 px budget.** Foundation's four named levers (`--gap-hero-lg` floor →
`.crow` padding-block → `--t-mission` vw coefficient → `--t-mission` floor) recover about 26 px
between them. They are not enough, and the "Never:" list forbids the tempting fixes: never cut a
counter, never drop body below 17 px, never remove the honesty line.

**Ruling: pull the fifth lever, which foundation already authorises and never needed.** Foundation's
own §9.1 says *"the nav-word row may fall below 780 svh; the third counter never may."* On this page
that row is seven multi-word labels wrapping to three lines — 97 px — and it is the only element in
the fold that is duplicated verbatim in the footer. Let it fall.

**The fold guarantee for standards.org.ai, restated:**

> At ≥ 360 px wide and ≥ 748 svh, the wordmark, the mission, the honesty line and **all three
> counters with all three check-lines** are above the fold. **The seven-word nav row is permitted to
> fall below the fold at ≤ 400 px wide.** Above 400 px it may not.

With that, plus `--gap-hero-lg` → `clamp(0.5rem, 1.2svh, 1.5rem)` and `.crow { padding-block: 6px }`
inside the ≤ 760 px block, the estimate lands at **≈ 700 px**, with ~48 px of margin.

**These are estimates from character counts, not measurements.** The builder measures them in a real
browser at 360×748, 390×748, 390×844, 1280×720 and 1440×900, and if a build misses, the levers are
pulled in this order, stopping at the first success:

1. `--gap-hero-lg` floor inside the ≤ 760 block
2. `.crow` `padding-block` inside the ≤ 760 block
3. `--t-mission` vw coefficient (2.15 → 1.75)
4. `.check` line-height inside the ≤ 760 block (1.38 → 1.32)

**Never:** cut a counter, cut a check-line, drop `--t-body` below 17 px, drop `.check` below 12 px,
remove the honesty line, or move a counter below the fold. If all four levers are pulled and it
still misses, **that is a content decision and it goes to the owner** — the check-lines are the only
remaining mass and their wording is ratified.

### 3.3 · The nav — seven words, and the one breakpoint that had to move

Seven scroll anchors, no dropdowns, no search icon, no sign-in, **no hamburger.** A hamburger for
seven same-page anchors is a lie about how deep the site is.

Not sticky on load. After the hero's bottom edge passes, a solid 48 px bar fades in over 220 ms:
`background: var(--ground)`, **solid — no backdrop blur, no glass**, 1 px bottom `--rule`, words at
`--t-nav` / UNLIT, the current section at `--ink` with a 1 px `--now` underline at 6 px offset.
`scroll-margin-top: 84px` on every section.

**Delta (§4.2): the sticky nav's horizontal-scroll treatment moves from `max-width: 900px` to
`max-width: 1120px`.** This page's seven labels total ≈ 128 characters against foundation's ≈ 78. At
`--t-nav` 15 px that is ≈ 920 px of text; the frame at a 900 px viewport is 810 px, so foundation's
900 px breakpoint would leave the row overflowing between roughly 900 and 1040 px. The
`overflow-x: auto` + `mask-image` edge-fade block therefore applies from 1120 px down.
**`.reg`'s collapse stays at 900 px.** Two rules that shared a breakpoint at foundation no longer
share one here, because foundation's 900 was tuned to foundation's shorter labels.

The exact width is a measurement, not a guess: the builder finds the width at which the row stops
fitting on one line and sets the breakpoint 40 px above it.

This row is the **only** horizontally scrolling element on the page.

### 3.4 · The seven sections — the frame is foundation's, the row is new

Content law §3 and §4: seven sections, **identical shape seven times**, running 5 to 9 rows. The
seventh is the second shelf in the same frame as the first six.

> A bespoke layout for a heavier section would print a per-section weight by design, which is the
> same claim the copy law forbids in digits. **The repetition is the argument.**

#### 3.4.1 · The frame — verbatim

```html
<section class="door [seam]" id="{slug}" data-tick="{n}">
  <div class="frame reg">
    <div class="ra"><h2 class="dh cut">{NAME}</h2></div>
    <div class="rb">
      <p class="test cut">{one-line test, plain words}</p>
      <dl class="rows cut">…</dl>
      <div class="ex cut"><p>{situation}</p><p>{what she gets}</p></div>
      <p class="none cut">…</p>      <!-- Work only -->
      <p class="aside cut">…</p>
    </div>
  </div>
</section>
```

`.reg` is `minmax(0, 0.82fr) minmax(0, 1.18fr)`, `column-gap: clamp(2rem, 5vw, 6rem)`, collapsing to
one column at 900 px. Register A names; register B is the thing. `#work` carries `.seam` →
`border-top: 0`, because the hero's nav-word underline **is** its opening rule. The page has no
seams.

**The hanging heading column stays**, even though this page's register B is denser than
foundation's. At 1440 the columns are ≈ 479 px and ≈ 689 px, and the left column is mostly
whitespace. That is not waste. The spine runs at the far left, the heading column is the second
vertical alignment and the row-name column is the third — three left-anchored tab stops running the
whole length of the page, which is what makes seven sections scan as one ruled ledger at speed.
Breaking the rows to full frame would buy 479 px of measure and cost the composition.

**No numbering. No per-section counts. No icons. No card. No table.**

#### 3.4.2 · The register row — the one new primitive, and it is `.crow` doing a second job

Copy law §3 fixes the grammar, every row identical:

```
{BODY, as it names itself}      {what it governs, one short phrase}
{what it feeds in our estate} · {version and date we loaded, or: no version stated}
```

That is **exactly** the counter row: a label in register A, a value in register B, and a fine UNLIT
line beneath it saying how to check. The hero teaches the grammar three times above the fold, and
then the page is that same grammar forty-nine more times. **One primitive, two jobs** — the same
discipline as one object doing seven jobs.

```css
/* ═══ THE REGISTER ROWS — .crow's geometry, second job ═══ */

:root { --rname: 232px; }          /* the mono tab stop. 23 chars at --t-mono, plus air */

.rows { margin-top: var(--s6); }   /* = .spec's margin-top at foundation, verbatim */

.rrow {
  display: grid;
  grid-template-columns: var(--rname) minmax(0, 1fr);
  column-gap: var(--s5);
  border-top: 1px solid var(--rule-faint);
  padding-block: 10px;
}
.rrow dt {                          /* the body's own name — a quotation, therefore mono */
  font-family: var(--font-rec);
  font-size: var(--t-mono);
  line-height: 1.56;
  color: var(--ink-2);
  padding-top: 1px;
  overflow-wrap: anywhere;          /* the floor at 320 px */
}
.rrow dd { display: flex; flex-direction: column; }

.gov  { font-size: var(--t-body); line-height: 1.4;  color: var(--ink-2); }
.load { font-size: var(--t-fine); line-height: 1.56; color: var(--ink-3);
        max-width: 62ch; margin-top: 4px; }

/* a bare version token quoted from the publisher, inline in our sentence */
.load .v { font-family: var(--font-rec); font-size: 0.92em; }
```

Sizing check at 1440: register B ≈ 689 px, minus 232 px name column and a 24 px gap, leaves ≈ 433 px
for `.gov` — ≈ 53 ch at 17 px, comfortably inside the 62 ch body measure and just above the 46 ch
test-line measure. `.load` self-caps at 62 ch (≈ 403 px). Nothing exceeds a reading measure.

`--rname` is 232 px because the longest name on the page, `IANA time zone database`, is 23
characters ≈ 207 px at `--t-mono`, and a fixed tab stop is what makes forty-nine rows read as a
ledger rather than as forty-nine paragraphs.

**`border-top` is on every row including the first**, which is what opens the ledger under the test
line. Same reason as the counters: a partial rule reads as a progress bar.

#### 3.4.3 · Sans or mono — the mechanical test

Copy law §3: *"The body name and every version string are quotations of somebody else's record and
are set in mono. Everything else is our prose and is set in sans."* The builder needs a test that
does not require judgement, so here it is:

**Mono, and nothing else:**

1. The `dt` — the body as it names itself. `O*NET`, `APQC PCF`, `HCPCS Level II`, `ISO 3166 · 4217 ·
   639`, `NPI provider taxonomy`, `eCl@ss`, `UN/EDIFACT`.
2. Inside `.load`, **bare identifier tokens only**, wrapped in `<span class="v">`: `30.0`, `7.4`,
   `7.2.1`, `2.0.1`, `1.17`, `R5`, `5.0.0`, `2.81`, `25.1`, `D.20B`, `db_30_0_text`, `loc241`,
   `ISO 18245:2023`, `ISO 9362:2014`, `13 CFR 121.201`, `0.3.0`.
3. The showcase strip in full (`.rec-t`), the footer's `Open today:` addresses, and `/llms.txt`.

**Sans, including things a builder will reflexively set in mono:** dates written as words
(`1 October 2025`, `September 2025`, `May 2024`), licence names (`Public domain`, `CC0`,
`CC BY-SA 3.0`), fiscal-year phrasing, the `Feeds …` phrase, every depth statement, every human
example, and every aside.

The test in one sentence: **a bare token the publisher stamped is mono; a sentence we wrote about it
is sans, even when the sentence is about them.** `0.92em` on `.v` is because mono runs a larger
x-height than Public Sans at the same nominal size; 0.92 lands them optically even against
`--t-fine`.

#### 3.4.4 · `.aside` drops mono — the one class whose treatment changes

Foundation sets `.aside { font-family: var(--font-rec) }` because its one aside is a bare address —
a quotation. **Every aside on this page is our own sentence** ("Our own notes still say O*NET 29.1.
The folder on disk says 30.0."). Setting our own prose in the record face would break the mono law
in the one place a reader is most likely to be looking for a tell.

```css
.aside { font-family: inherit; }   /* our sentence, not their record */
```

`--t-fine` / UNLIT / `margin-top: var(--s5)`, otherwise verbatim. Any bare token inside an aside
(`0.3.0`, `29.1`, `30.0`) goes mono via `.v`, exactly as in `.load`.

#### 3.4.5 · Responsive

- **≤ 900 px** — `.reg` collapses to one column, heading stacks above (foundation's block, verbatim).
  `.rrow` keeps its two columns; register B is now the full frame and there is more room, not less.
- **≤ 700 px** — `.rrow` collapses. This is the **same breakpoint at which `.spec` collapses to the
  tight column at foundation**, and it is the same gesture for the same reason, so no new breakpoint
  is introduced:

  ```css
  @media (max-width: 700px) {
    .rrow { grid-template-columns: minmax(0, 1fr); row-gap: 2px; padding-block: 9px; }
    .rrow dt { padding-top: 0; }
    .gov { line-height: 1.32; }
    .load { font-size: 12px; line-height: 1.38; margin-top: 2px; }
  }
  ```

  At 700 px the two-column form would leave `.gov` at ≈ 37 ch, which is the floor; below it, the
  name takes its own line.

#### 3.4.6 · `.none`, once

Copy law: one line, under the first section only. Foundation's `.none` class verbatim, `--t-fine` /
UNLIT, `d4` in the cut stagger.

### 3.5 · The two shelves — the distinction, and the refusal to draw one

This is the design question the brief poses, and the answer is the most important ruling in this
file.

**Ruling: the second shelf gets no visual treatment of its own. The accent distribution *is* the
distinction, and it is the only form of it that survives the visual-variable law.**

The argument, in three moves:

1. **Copy law §4 forecloses the obvious answer.** *"The frame does not change because the shelf
   changed; the repetition is the argument, and a bespoke treatment here would print a claim in
   layout that the copy is not allowed to make."* A tinted band, a different rule weight, a
   left-hand marker, a background, an inverted header — every one of them prints a rank.
2. **A hue for the shelves would be exactly the error the honesty law forbids.** Encoding a
   constitutional distinction in a colour nobody can decode from the page is the same category of
   mistake as printing an unmeasured number. `--now` already has one meaning and it is *now*.
3. **The distinction is already there, for free, and it is checkable.** Six of the seven sections
   contain **zero accent**, because nothing on the first shelf is open. The seventh contains seven
   accented addresses, because those seven resolve today. A visitor can verify that by clicking. The
   footer then gathers the same seven into one row.

So the composition is: six dark sections, then the only lit section on the page, then the strip,
then the footer's amber row. **The darkness is what makes seven lit names mean something.** A page
that decorated the first shelf would have spent its ending to decorate its middle.

**The rhyme worth building deliberately.** Copy law §4 puts *the status where the version goes* —
`Draft 0.3.0` and `No version number` occupy the same slot in the same grammar that holds
`version 30.0` and `no version stated` on the shelf above. That is the strip's `Curated here` /
`Curated at` move: **one slot, two readings, same position, every time.** Nothing in CSS marks it.
The reader finds it, which is the point.

**Where the accent goes, precisely — and it is not on the name.**

> The accent goes on the **home address inside `.load`**, never on the `dt`.

Three reasons, and the third is the honesty law:

1. The address is the thing that actually resolves. `AXP` does not resolve; `axp.org.ai` does.
2. Six lit `dt`s in a column of forty-nine unlit ones would make **the column itself** read as the
   affordance, and the other forty-three cannot keep that promise. *No text-only name on this page
   has a hover state, an underline, a colour change or a pointer cursor* — and this page is nearly
   all text-only names, so that gate matters more here than at foundation.
3. It resolves `PRODUCT.md` and `schema.org.ai`, whose names *are* addresses, without a special case.

```html
<span class="load">…Home: <a class="dom live" href="https://axp.org.ai/">axp.org.ai</a></span>
```

`a.live` verbatim: `--now`, 1 px `--now-deep` underline at `text-underline-offset: 4px`. MDXLD
carries two (`mdx.org.ai/docs` and `mdxld.org`); link `/docs` directly, never the redirect.

**Re-verify every one of the seven with `curl` on the day of the deploy.** If one is down it drops
to `<span class="dom">` the same day and footer row 3 gets shorter. It never gets padded.

### 3.6 · The showcase strip — the same mechanism, three refusals instead of one

`.strip-sec`, `.sh`, `.lede`, `.strip`, `.rec-t`, `.notes` — verbatim. Registers dropped; single
measure, left-anchored, widest vertical padding on the page.

The strip is the **only recess on this page.** `padding: clamp(1.75rem, 3.5vw, 3rem)`, mono at
`--t-strip`, `white-space: pre` above 860 px and `pre-wrap` + `padding-left: 4ch; text-indent: -4ch`
below. **Never a horizontal scrollbar, never a pin, on any device.**

Longest authored line is 80 characters ≈ 720 px at `--t-strip` 15 px; the strip's inner width at
860 px is ≈ 714 px, so the `pre` → `pre-wrap` switch is right at the edge. **The builder verifies
the exact switch point and moves it up to 880 px if 860 clips.**

**The signature is sharper here than at foundation, and it is the reason this section exists.**
Foundation's rule lights four of five phrases and leaves one dark. This page's rule lights **two of
five and leaves three dark**, and completes past all three anyway.

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    html.motion .strip { view-timeline-name: --record; view-timeline-axis: block; }
    html.motion .strip .strip-rule {
      animation: draw linear both; animation-timeline: --record;
      animation-range: entry 55% cover 62%;
    }
    html.motion .strip .ph-seeded  { animation: light steps(1,end) both;
      animation-timeline: --record; animation-range: entry 62% entry 64%; }
    html.motion .strip .ph-curated { animation: light steps(1,end) both;
      animation-timeline: --record; animation-range: entry 72% entry 74%; }
    /* .ph-built, .ph-minted and .ph-operated have no animation, anywhere.
       They render UNLIT, always. There is nothing here that can light them. */
  }
}
```

**The refusal is implemented as the absence of a rule**, exactly as WITHHELD is implemented as the
absence of a token. A builder cannot accidentally light `Built as`, `Minted at` or `Operated by`,
because there is nothing to light them with. The same absence must hold in the JS fallback: the
`.lit` class is applied to two elements and the other three are not in the list.

`html:not(.motion)` promotes `.ph-seeded` and `.ph-curated` to `--ink` and **leaves the other three
UNLIT** — the motion-off still shows the same two-of-five picture.

**In the blanks, draw nothing.** No dash, no underscore, no dotted rule, no greyed box, no dimmed
placeholder text, no `content: "—"`. The `white-space: pre` preserves the authored space and a
visible blank is the whole design. *A blank is information.*

The four `—` separators inside the strip are the owner's, quoted from the ratified provenance line,
and are **the only em dashes permitted inside the strip.** Elsewhere the rule is §7.4's: none the
designer or builder authors, and ratified prose reproduced as ratified.

The three notes below: three short paragraphs in one 62 ch measure, separated by `--rule-faint`
hairlines. **Not three columns** — three equal text columns is the identical-card-grid fingerprint
with the boxes taken off.

**No accent anywhere in the strip.** `onet.org.ai` serves a holding page and `occupations.org.ai`
serves nothing; every name in the strip is `<span class="dom">`.

### 3.7 · What this is

`h2.sh.fade` + `.whatbody.fade`. `--t-lede` / wght 330 / **54 ch** / WRITTEN, paragraphs at 1.1em.
**58 words. Do not add one.**

The one section with no motion beyond a single 300 ms opacity fade. After ten scenes of
choreography, the section that states the mission in plain words does not perform. That is the
loudest thing restraint can do here.

### 3.8 · Footer

On `--well`, opened by a full-frame `--rule`. Four rows, verbatim classes:

1. `.footwords` — the seven words again, UNLIT, 45 px tap height, rising to CHECKED on hover.
2. `.estate` — the honest state of the register, `--t-fine` / UNLIT / **72 ch**.
3. `.opentoday` — `<span class="olabel">Open today:</span>` then the **seven** live addresses, mono
   at `--now` with 1 px `--now-deep` underlines. Foundation has five; this page has seven; the row
   is a census, not a layout, and it grows or shrinks with the `curl` check.

> **Target size, ruled 2026-07-28 and recorded so it is decided rather than drifted into.** At
> 390 px the `.opentoday` addresses and the shelf-two `Home:` links render 14-18 px tall. WCAG 2.2
> SC 2.5.8 has an inline exception for a target inside a sentence, and these are inside sentences —
> a census row and a row's second line. `foundation.org.ai` ships the identical treatment, so this
> is parity, not a regression, and nothing changes today. **If a future pass wants more thumb room,
> the lever is `padding-block` on `.opentoday .u`, never a larger `font-size`**: `--t-fine` is what
> puts the footer at the bottom of the type rank, and growing it would promote fine print to body
> copy and break the rank the whole page is built on.
4. `<hr class="frule">` then `.closing`: `The Org.AI Foundation · standards.org.ai · For machines:
   /llms.txt`.

In the closing line: **`The Org.AI Foundation` is a link** (`a.live`, to `https://foundation.org.ai`
— a real page, verified), **`standards.org.ai` is text** (a page does not link to itself), and
`/llms.txt` is a link. Foundation's `.closing .dom { color: var(--now) }` rule must therefore be
scoped so it colours only the two anchors, not the bare host name.

> The page ends on the only concentrated colour it contains, and that colour is exactly the set of
> things that are real.

### 3.9 · 404

`src/404.html`, ~34 lines, same stylesheet, **no script at all**. Reuses `.nf`, `.wordmark`,
`.dhead`, `.anote`, `.ddoors`, `.frule`, `.closing`. Swap the headline, the one line, the seven
anchors (`/#{slug}`) and the closing line. Copy law §12 has all of it.

`.nf .ddoors { max-width: 40ch }` at foundation is tuned to short door names; this page's labels run
to 25 characters, so raise it to `52ch` and verify no anchor wraps at 390 px. That is a measurement,
not a preference.

---

## 4 · The complete list of deltas

Six. Every one of them is forced by this page's subject, and there are no others. **A seventh delta
appearing in a build is a bug unless it is argued here first.**

| # | Delta | Forced by | Argument |
|---|---|---|---|
| **4.1** | The aperture, the caret, the idle wipe, the suggestion list, the answer states and the matcher are **deleted**, and nothing replaces them | copy law §0.3, §1 | A register has nothing honest for a box to do. **Do not keep an input box that does nothing** — that is the no-fake-functionality law inverted. The fold budget goes to the counters' check-lines. See §5.1 for the motion consequence |
| **4.2** | The sticky nav's overflow treatment moves from 900 px to ~1120 px | seven multi-word labels, ≈ 128 chars | Foundation's 900 was tuned to foundation's shorter labels. `.reg`'s collapse stays at 900 |
| **4.3** | `.rrow` — a new class, and it is `.crow`'s geometry pointed at a second job | forty-nine two-line rows | Not a new primitive: the same grid, the same hairline, the same `padding-block`, the same value-plus-fine-line stack. The hero teaches it, the page repeats it |
| **4.4** | `.aside` drops `--font-rec` | every aside here is our own sentence | Setting our prose in the record face breaks the mono law in the place a reader looks for a tell |
| **4.5** | Foundation's `.spec` (five-cell specimen grid) does not ship; foundation's `.ask`, `.aperture`, `.well`, `.sug`, `.chips`, `.answer`, `.aledger`, `.dquery` CSS does not ship | no specimens, no input | Dead CSS in an 90 KB budget is a byte cost with no argument |
| **4.6** | The favicon and the OG card carry **two stacked bars**, not foundation's single vertical edge | copy law §11 | Foundation's edge belongs to foundation. This page's subject is two shelves. §6 |

**And one refusal that reads like a delta and is not one.**

The brief asks for "dashed/ghost conventions for anything unbuilt." **There is no ghost convention on
this page, and adding one would break the honesty law.**

A thing that does not exist is stated in **words at UNLIT**, never drawn as a dashed outline, a
greyed box, a skeleton, a reserved slot, a struck-through row, a hatched fill or a dotted rule.
`border-style: dashed` and `border-style: dotted` do not appear anywhere in the stylesheet, and a
build containing either fails review. The reason is structural, not stylistic: a dashed placeholder
is a *shape shaped like the thing that is missing*, which is a picture of an unverified claim —
precisely what WITHHELD refuses to render.

The page has exactly two places where absence is expressed, and both are already designed:

- **Counter three** — the words `Not measured yet.` at CHECKED, and not one digit.
- **The strip's three blank phrases** — a visible blank, and the *absence of an animation*.

Six of the seven sections carrying zero accent is the third, and it needs no convention at all: it
is what darkness looks like.

---

## 5 · Scroll choreography, section by section

Same stillness discipline, unchanged laws.

- **Only `opacity`, `transform` and `clip-path` animate.** No layout property, ever. Foundation's one
  named exception (`height` on the growing answer container) **does not exist here**, because the
  answer does not exist. So on this page the rule is absolute with no exception at all.
- **Every arrival observer is `once: true`. Nothing on this page ever replays.** Scroll back up and
  the page is exactly as you left it, fully written.
- **A scrub is a control, not a performance**, and is exempt. There is exactly one scrubbed scene.
- **Nothing is pinned. No scroll track is inflated.** No parallax, no camera, no z-axis, no
  mouse-follow, no idle loop. **rAF runs only while a tween is in flight and stops on the last one.**
- Easing: `--ease-write` for anything the edge does, `--ease-state` for state changes. No bounce, no
  elastic, no spring, no overshoot.
- `will-change: clip-path` is set **only while an animation is in flight**, released on
  `transitionend` with a `setTimeout` backstop. **At most eight concurrent clip-path animations**;
  the fling guard enforces it.

### 5.1 · Scene 0 — THE PASS (0 → 1,150 ms), and the silence after it

One 1 px `--now` hairline enters at `x = 0` and sweeps to the viewport's right edge over 1,150 ms on
`--ease-write`. Every element it crosses is revealed at the instant it crosses it. The wordmark, the
mission, the honesty line, all three counters and the seven words are not staggered and are not
faded: they are **inscribed by one moving edge in one pass.** Because every hero element is anchored
to the same left edge, they begin together and finish in width order.

Counter three needs no special-casing. Where a value would be, the edge writes `Not measured yet.` at
CHECKED — the brightest thing it writes in that block. **No number counts up, anywhere on this page,
at any point, ever.**

**The handoff, and this is delta 4.1's motion consequence.** At foundation the edge exits and the
caret is still blinking, because the page has asked a question. **Here the edge exits and the page is
still.** Nothing blinks, nothing pulses, no scroll cue appears, no chevron, no "scroll" label, no
hint animation, no auto-scroll nudge. A register does not ask you anything, so nothing on it waits
for an answer. **Filling the caret's silence is the single most likely way to break this page.**

### 5.2 · Scene 1 — the hero hands over

Not a transition. Past 40 % of the hero the hero contents fade with an 8 px rise over the following
30 %; the sticky bar fades in at the hero's bottom edge over 220 ms. Verbatim.

### 5.3 · Scenes 2–8 — the section cut (×7)

`IntersectionObserver`, `rootMargin: "-30% 0px -30% 0px"`, fires once, then `unobserve`.

| Offset | What | Class |
|---|---|---|
| 0 | the section's top hairline draws left to right, `scaleX(0→1)`, 500 ms | `.drawn::before` |
| 0 | the section heading, revealed by a vertical edge over `--d-cut`, the visible 1 px edge one pixel ahead | `.dh.cut` |
| +90 ms | the test line | `.test.cut.d1` |
| +180 ms | **the whole row ledger, as one block** | `.rows.cut.d2` |
| +270 ms | the human example | `.ex.cut.d3` |
| +360 ms | the aside, and (Work only) the `.none` line | `.aside.cut.d4` |

**Ruling: the row ledger is cut as one block, never row by row.** Three reasons, in order of weight:

1. **A per-row stagger ranks the rows by arrival order**, which is a per-row weight the copy law
   forbids in digits and therefore forbids in time.
2. The ≤ 8 concurrent clip-path cap. Nine rows in one section would breach it on its own.
3. Forty-nine individually staggered rows is scroll-site theatre, and the fling guard would snap
   most of them anyway.

The five delay slots are foundation's five delay slots with foundation's five delay values. **No new
motion is introduced anywhere in this page's densest sections.**

One consequence to watch: a nine-row ledger is 600–1,000 px tall and the edge sweeps it
horizontally in one gesture. That is on-brand — it is the writing edge crossing an entire register at
once — but it is a large compositing layer. `will-change` discipline is mandatory, and `@media
(pointer: coarse)` already shortens `--d-cut` to 380 ms, which is the correct lever if it feels long
on a phone. Do not add a second lever.

**Nothing translates. Nothing fades in from nowhere.** By the third section she can predict it
exactly, and that predictability is the argument: the copy law says the seven sections are the same
shape seven times, and the motion says so before the copy does.

### 5.4 · The tick (×11)

Eleven `[data-tick]` sections: seven sections, the strip, What this is, the footer, the closing line.
Each tick is marked at the instant its heading finishes being written, flashes `--now` for
`--d-tick`, then settles UNLIT. **There is no track ahead of the reading line — not a dim one, not a
rail, not a remaining length.** A rebuild on resize re-measures without erasing what was already
marked and never re-flashes the accent.

### 5.5 · Scene 9 — the record rule. The one scrubbed scene.

Driven by the strip's own passage through the viewport at natural page height. **No pin, no track
inflation, no extra height.** Native `animation-timeline: view()` where supported, an
`IntersectionObserver` + rAF scrub writing the identical thresholds otherwise, detected with
`CSS.supports`, **never with a user-agent string.**

*Seeded from* lights. *Curated at* lights. **The rule reaches `Built as`, `Minted at` and `Operated
by`, none of them light, and the rule completes past all three anyway.**

Nothing explains this. The note underneath already says *"A blank is information."* The motion has
just performed the sentence.

The second line — the loading receipt — draws its own rule and lights at WRITTEN. **No accent
anywhere in the strip.**

Then the three notes fade, 200 ms stagger, no movement.

### 5.6 · Scene 10 — What this is

A 300 ms opacity fade and nothing else.

### 5.7 · Scene 11 — the close

When the footer enters, the `Open today:` row is cut in by the edge, left to right, slowly (900 ms).
**The page ends by writing down its seven true things.** Nothing else in the footer moves.

### 5.8 · Failure modes, ruled

- **Tweens are time-based, not frame-based.** `t = (now − t0) / dur`, clamped. A dropped frame skips
  positions, never the endpoint.
- **`visibilitychange → hidden` finishes every in-flight tween immediately.** A backgrounded tab
  cannot come back to a half-written page.
- **`resize`, debounced 150 ms** — finish all live tweens, rebuild geometry, re-assert final states
  without a tween. A resize is not a scene.
- **The fling guard** — more than two sections entering within 250 ms adds `html.snap` and puts every
  remaining section straight into its final state with no animation. *A fling means she is
  travelling, not reading.* On a forty-nine-row register this fires often and that is correct.
- **The boot script un-sets `.motion` if the main script fails within 1,200 ms or errors.** Every
  motion rule is written as `html.motion .x { …hidden… }` with the visible state as the default,
  never the reverse. A broken script can never leave this page clipped to invisibility.

### 5.9 · Reduced motion — a designed still

`@media (prefers-reduced-motion: reduce)` sets all six duration tokens to 1 ms/0 ms. Every element
renders in its **final state at load**: the fold fully written, all seven sections fully revealed,
the spine fully drawn with all eleven ticks settled to UNLIT, the record rule fully drawn with
**three phrases UNLIT**, the shelf-two addresses amber, the footer's amber row present.

**Arrival is still composed:** one 200 ms opacity fade of the document. The page arrives
deliberately rather than snapping.

**The gate that outranks the rest:** *turning off all motion changes nothing about what this page
asserts.* If a fact is only legible while something is moving, it is not on the page.

---

## 6 · Identity — favicon and share card

### 6.1 · No logo mark

A register that has published one page has not earned a symbol. The identity is the pairing: **Public
Sans — the census publisher's own face — and one amber that means *now*.** Both are visible on every
screen and both are arguments rather than decoration.

### 6.2 · The favicon — two stacked bars

Browser chrome, not page imagery. `data:` URI, zero requests, ~250 bytes.

```html
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'
 viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2313110e'/%3E
 %3Crect x='5' y='10' width='22' height='3' fill='%238d8b87'/%3E
 %3Crect x='5' y='19' width='22' height='3' fill='%23f0af66'/%3E%3C/svg%3E">
```

- **Two bars, in the page's own scroll order.** Upper = theirs, `--ink-3` (`#8d8b87`), because
  nothing on that shelf is open. Lower = ours, `--now` (`#f0af66`), because seven addresses resolve
  today. The colours are the accent law doing its one existing job, not a new variable, and they are
  checkable against footer row 3.
- **Both bars 3/32 of the viewBox**, above the 2.6/32 floor. Thinner renders sub-pixel at 16 px and
  disappears.
- It carries its own dark ground so it reads on light and dark browser chrome alike.
- It depicts nothing that is not true, and it is legible in a crowded tab strip because nobody else's
  favicon is two horizontal bars.

### 6.3 · The share card — `src/og-card.html` → committed `src/og.png`

1200 × 630, standalone document, rendered **once** by headless Chrome and committed as `src/og.png`.
Ordinary builds only `copyFileSync` it; no build ever needs a browser. Fetched only by link
unfurlers, never by the page, so the one-request law is untouched.

Copy law §11 fixes the three strings and forbids a fourth:

```
wordmark   The Org.AI Foundation · Standards
substance  Other people's records, copied and <em>never corrected</em>.
           Ours on a second shelf, marked unfinished.
host       standards.org.ai
```

**Layout — the page's own object at poster scale.** Foundation's card carries a 6 px vertical `--now`
edge inset 96 px on the left; **this card carries the two stacked bars instead**, and drops the
vertical edge entirely, because that edge is foundation's.

```
ground   #13110e, full bleed
padding  96px left, 84px block, 96px right
column   display: flex; flex-direction: column; justify-content: space-between; height: 100%

  ┌ top group
  │  two bars:  128 × 7 px, 18 px apart, upper #8d8b87, lower #f0af66, radius 0
  │  32 px gap
  │  wordmark:  30px / wght 600 / #bdbbb8 / letter-spacing 0
  └
     substance: 58px / wght 550 / line-height 1.22 / letter-spacing -0.015em / #f3f2ee
                <em> → color #f0af66; font-style: normal
     host:      26px / wght 400 / #8d8b87
```

Four details that break silently if they are got wrong:

1. **Keep the font path relative** — `url("fonts/publicsans-subset.woff2")`, not `/fonts/…` — so the
   card renders from `file://` with the working directory at `src/`. An absolute path falls back to
   the system face and the card ships in the wrong typeface. **This is the single most breakable
   thing in the pipeline.**
2. **Tokens are hard-coded literals mirroring the dark palette**, with a comment saying so. A share
   card has no `prefers-color-scheme`, so it commits to dark. They will drift otherwise.
3. `@font-face { font-weight: 200 700; font-display: block }`. The card uses 550 and 600, so **the
   font subset's axis range must cover 330–600**, not just the page's 330–520.
4. `&nbsp;` protects the intended line breaks. No box, no logo, no gradient, no border.

**The substance line is the card's whole job.** It is not the mission line and it is not the title:
it is the one sentence that tells a stranger what the two shelves are, and it is the same sentence
the page's `og:description` carries.

### 6.4 · Head, and the divergence recorded rather than inherited

`og:image` and `twitter:card: summary_large_image` ship. `DESIGN-SPEC` §11.3 refuses both;
foundation's **shipped** page carries both, and the shipped code is the newer decision. **This file
records that in writing so the sibling does not inherit a contradiction.** Same for the wordmark:
the docs say `Org.AI Foundation`, the page says `The Org.AI Foundation`; the page wins.

Head order, verbatim from foundation:

```
<!doctype html> · <html lang="en"> · <meta charset="utf-8">     ← first element, inside the sniff window
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title> · <meta name="description"> · <meta name="robots" content="index, follow">
<link rel="canonical">
og:type/site_name/url/title/description/locale/image(+width,height,alt)
twitter:card/image/title/description
<link rel="icon" href="data:image/svg+xml,…">
<link rel="stylesheet" href="/styles.css">          ← replaced by <style> at build
<script>…4-line boot…</script>                      ← the ONLY blocking script
```

Explicitly absent and to stay absent: `<meta name="generator">`, verification tags, `preconnect`,
`dns-prefetch`, `theme-color` (a fixed theme colour would fight the light/dark response).

**Glyph budget.** The subset covers `U+0020-007E`, `U+00A0`, `U+00B7`, `U+2013`, `U+2014`, `U+2018`,
`U+2019`, `U+201C`, `U+201D`. Every string in the copy law is inside it, including `O*NET`, `eCl@ss`
and `13 CFR 121.201`. **No `©`, `§` or `†` appears anywhere** — the copy spells the word instead. A
future string needing a new glyph extends `--unicodes` and re-subsets in the same change, or the
glyph falls back silently to the system face.

---

## 7 · Anti-slop — explicit, and specific to this page

Foundation's `DESIGN-SPEC` §12 carries in full. This section adds the traps a **standards register**
sets that a map does not. Each is match-and-refuse: if you are about to write it, the element is
wrong and gets rewritten with different structure.

### 7.1 · The category reflex, both altitudes

- **First-order** — *"standards body → institutional navy, a seal or crest, a serif wordmark, a
  globe, ISO-blue, a certification badge."* Refused: the neutrals are warm at hue 78–86, there is no
  cool hue anywhere, no seal, no crest, no serif, no globe, and **the page draws nothing.**
- **Second-order** — *"standards site that isn't institutional-navy → developer-docs dark mode:
  monospace everything, a left sidebar tree, a version dropdown, syntax-highlighted blocks,
  copy-to-clipboard buttons, an `npm install` line."* Refused: no sidebar, no tree, no dropdown, no
  code block, no copy button, nothing to install. **Mono appears only where the page quotes somebody
  else's record**; every sentence on the page is sans. This is the trap one tier deeper and it is the
  one a competent builder will actually fall into.
- **The competitor sentence.** A competitor writes: *"a searchable, filterable directory of standards
  with coverage badges and a comparison table."* This one is: **a page that writes itself with one
  moving edge, where six of seven sections are deliberately dark, the brightest words are a refusal
  to print a number, and the only colour is the seven addresses that actually resolve.**

### 7.2 · The eight refusals a register tempts

1. **The table.** Forty-nine rows beg for `<table>`, zebra stripes, a sticky header row, sortable
   columns, a resize handle. **None of it ships.** Rows are a `<dl>` of `.rrow` — semantically a
   register *is* term-and-definition — and they carry one `--rule-faint` hairline each and nothing
   else. **No zebra striping, no alternating tint, no row hover, no row background, ever.**
2. **The status badge.** `Public domain` / `Draft` / `licence required` will beg for a pill, a chip, a
   dot, a tick, a cross or a traffic light. **A row's status is words.** A green dot beside "public
   domain" is a visual variable encoding a fact a visitor cannot check from this page.
3. **The coverage bar.** *"How much of each"* will beg for a progress bar, a donut, a sparkline, a
   heat cell or a percentage. **This is the unmeasured counter.** No chart primitive appears anywhere
   in the stylesheet or the markup: no `<svg>`, no `<canvas>`, no width-driven fill element, no
   `conic-gradient`, no ratio, no share, no percentage. Not in the hero, not on a row, not in a
   tooltip, not in `alt` text.
4. **The logo wall.** Forty-three named bodies beg for a grid of marks. **We have contacted nobody**,
   we hold no licence to any of their marks, and a logo grid is a partnership claim drawn in
   pictures. Zero images of any kind.
5. **The comparison table.** *Theirs | Ours* side by side is the obvious way to render two shelves and
   it is banned. **The shelves are sequential, in scroll order, in the same frame.** Six dark, then
   one lit.
6. **The control that does nothing.** No search field, no filter chips, no sort menu, no "expand all",
   no accordion, no tabs, no pagination, no "browse the data", no "download", no "API". If a control
   appears on this page that does nothing, the page has broken its own law.
7. **The version chip.** Version strings are inline mono tokens inside a sentence. Never a boxed
   chip, never a coloured tag, never a `v` prefix the publisher did not write.
8. **The relationship diagram.** *"The lists everyone quotes"* names the layer everything else cites,
   and it will beg for a node-and-edge drawing, a stack diagram or a dependency graph. **The page
   draws nothing.** The human example already says it in words, better.

### 7.3 · The cross-register absolute bans, restated because they apply here too

- **Side-stripe borders.** No `border-left` or `border-right` above 1 px as a coloured accent on any
  row, section, aside or note. Never intentional.
- **Gradient text.** No `background-clip: text`, no gradient anywhere on the page including in text.
- **Glassmorphism.** No blur, glass, glow or bloom. The sticky bar is a **solid** `--ground`.
- **The hero-metric template.** Big number, small label, supporting stats, gradient accent. The
  counters are ledger rows at body size with no colour and no big-number treatment. One of them has
  no number at all.
- **Identical card grids.** No card, panel or tile except the one recess. No card grid, ever. Nothing
  nested that need not be.
- **Modal as first thought.** No modal, toast, tooltip, drawer, carousel, sticky CTA or hamburger.

### 7.4 · Copy discipline

- **No em dash in any string the designer or builder authors — owner-ratified copy carries its own.**
  Nothing the designer or builder writes may contain one. Ratified copy is reproduced character for
  character: that is the four separators inside the showcase strip, quoted from the ratified
  provenance line, plus the two em dashes inside ratified prose (the §9 lede and the 404 note). Do
  not "fix" anything.
- **The banned vocabulary stays out of visible copy, `alt`, `aria-label`, `title` and CSS-generated
  content**: *graph, ontology, taxonomy, canonical, dimension, rung, membrane, G1, G2, G3, G4, G5.*
  The two-shelf letters in particular are internal vocabulary and appear nowhere in the artefact.
  The one exemption is copy law §14's, added 2026-07-28: **a publisher's own name for a code set,
  quoted in a row's `dt`** — `NPI provider taxonomy` is what NUCC calls it, and the `dt` slot is a
  citation rather than our description. The `dd` and the four attributes carry no exemption.
- **Every word earns its place.** No restated headings, no intro that repeats the title, no "Learn
  more", no "Explore", no "Get started".
- Copy law §14's register-specific bans are absolute: **"authoritative", "trusted", "official",
  "certified", "compliant", "in partnership with", "complete", "comprehensive", "real-time", "1.0",
  "stable", "production-ready"**, and any count of adopters, users, downloads, stars or integrations.

### 7.5 · The interaction gate that matters most here

> **No text-only name on this page has a hover state, an underline, a colour change or a pointer
> cursor.**

This page is nearly all text-only names — forty-three body names, roughly fifty outside bodies, every
`Feeds …` destination, every name in the strip. `span.dom { cursor: text }` and nothing else. A hover
state is a promise of navigation and only nine strings on this page can keep it. **This is the
interaction layer of the honesty law**, and it is the gate a builder is most likely to violate by
reflex.

---

## 8 · Build gates — a build ships iff all fifteen are true

Renumbered from `DESIGN-SPEC` §13, with the two that this page's subject changes marked.

1. The network panel shows **one request: the document itself.** Zero others, over a full scroll to
   the footer, in both colour schemes.
2. No cool hue appears anywhere; every neutral is tinted hue 78–86.
3. Every string naming a destination or a count sits at exactly one of CHECKED / WRITTEN / UNLIT /
   WITHHELD.
4. **Counter three contains no digit at any point** — in the value or in the check-line — and no
   accent, at every moment including mid-animation, in both schemes, at every breakpoint.
   *(stricter than foundation's gate 4)*
5. `Not measured yet.` is the brightest-contrast string in the counter block.
6. **Six of the seven sections contain zero accent; the seventh contains exactly seven accented
   addresses, and each one returns 200 with a real human page on the day of the deploy.**
   *(this page's version of foundation's gate 6)*
7. The spine exists only above the reading line and ends unlit.
8. **Turning off all motion changes nothing about what the page asserts.**
9. No text-only name has a hover state, an underline, or a pointer cursor.
10. Nothing on the page pushes anything else down at any time. Nothing grows; there is no state.
11. **Zero elements overflow the document at 320, 360, 390 and 430 px.** `document.scrollWidth ===
    innerWidth` at all four. The sticky nav row is the only horizontally scrolling element.
12. **The third counter's check-line is whole and on screen at 360×748, 390×748, 390×844, 1280×720
    and 1440×900.** The nav-word row may fall below the fold at ≤ 400 px and may not above it.
    *(§3.2)*
13. **`Built as`, `Minted at` and `Operated by` are each whole, on screen and unlit** at the end of
    the record scene, at 390 px and 1440 px, motion on and motion off. **No dash, underscore, dotted
    rule or placeholder box appears in any of the three blanks.**
14. The single document is **≤ 90 KB uncompressed**, and `document.fonts` reports exactly one face.
15. **Run over the built artefact, not over `src/`** — source comments are stripped by esbuild and
    never ship, so grepping `src/` reports hits that no reader can ever see and the gate can never
    pass. The gate is:
    **`grep -riE 'dashed|dotted|<table|<svg|<canvas|conic-gradient|linear-gradient|background-clip|
    box-shadow: 0|em dash|—' public/*.html`**, with exactly three carve-outs:
    - the **four authored `—` separators inside the strip**, quoted from the ratified provenance line;
    - the **sticky-nav `mask-image` / `-webkit-mask-image` edge-fade `linear-gradient`**, inherited
      verbatim from `foundation.org.ai/src/styles.css:739-740` (§9 reuse ledger, "verbatim");
    - **em dashes inside owner-ratified copy** — today exactly two, the §9 lede
      (copy law §5's lead-in) and the 404 note (copy law §12's one line); copy law §14 states the
      whole count, six, and is the governing text. Foundation's own `h1`
      ships one; these are family-consistent. Do not "fix" them.

    Anything else is a finding. In particular any *new* em dash in designer- or builder-authored
    copy is a finding (§7.4), and any `dashed` / `dotted` / `<table` / `<svg` / `<canvas` /
    `conic-gradient` / `background-clip` hit is a finding without exception.

**Gate 14 is at genuine risk on this page** and the levers are named in order:

1. Ship `site.js` without the four hero-input consumers, the matcher, the answer states, the drain
   and the combobox ARIA (§9). This is required anyway and is the largest single saving.
2. Ship `styles.css` without the `.ask` / `.aperture` / `.well` / `.sug` / `.chips` / `.answer` /
   `.aledger` / `.dquery` / `.spec` blocks (delta 4.5).
3. Narrow the font axis: `wght=330:620` instead of `200:700` in the instancer step. It must still
   cover 600 for the share card.
4. **Copy is never the lever.** If all three are pulled and the document is still over 90 KB, that is
   a report to the owner, not an edit.

---

## 9 · Reuse ledger — what to copy, adapt, drop

| From foundation | Verdict | Note |
|---|---|---|
| `build.js` | **near-verbatim** | change only the page list. Keep the throw-on-no-match guards, the font-inline verification, the 90 KB assert and the exit code |
| `worker.js` — `SEC`, `withHeaders`, the 405 branch, the cache split | **verbatim** | `default-src 'none'` with no host allowed anywhere is the one-request law expressed as policy |
| `worker.js` — `LLMS_TXT` | **replace the body, keep the skeleton** | copy law §8 has it verbatim. Template literal in the worker, never a file in `public/` |
| `worker.js` — HTML `content-type` | **fix, do not copy** | foundation's HTML responses come back as bare `text/html` with no charset. Force `text/html; charset=utf-8` on every HTML response including the 404 |
| `wrangler.jsonc` | **near-verbatim** | change `name` and `routes`. Keep `run_worker_first: true`, `not_found_handling: "404-page"` and the comment explaining why a negation list would route around the worker |
| `package.json` | **verbatim** | three scripts, two dev deps |
| `styles.css` tokens (1–109) | **verbatim** | both palettes, contrast block, coarse-pointer block, `@charset` |
| `styles.css` reset / ground / `.frame` / `.vh` / `.skip` / `:focus-visible` / `::selection` / `.u` (111–195) | **verbatim** | |
| `styles.css` `.spine` / `.tick` / `.sticky` (196–260) | **verbatim**, one breakpoint moved | delta 4.2 |
| `styles.css` hero (261–299, 465–499) | **adapt** | keep `.wordmark` `.mission` `.honesty` `.counters` `.crow` `.cval` `.check` `.words` `.herowords`. Drop `.ask` `.aperture` `.well` `.well-in` `#q` `.ph` `.go` `.sug` `.under` `.chips` `.answer` `.acard-*` `.aledger` `.anote` `.aacts` `.dquery` `.dbody` `.dpick` |
| `styles.css` `.door` / `.reg` / `.dh` / `.test` / `.ex` / `.none` (500–551) | **verbatim** | `.spec` dropped, `.aside` loses `--font-rec` (delta 4.4), `.rows` / `.rrow` / `.gov` / `.load` added (delta 4.3) |
| `styles.css` `.strip-sec` / `.strip` / `.rec-t` (552–610) | **adapt** | keep the recess, the `pre` → `pre-wrap` reflow, the phrase classes. Three `.ph-*` get no rule instead of one |
| `styles.css` `.what` / `.fade` / `.foot` / `.frule` / `.closing` (612–656) | **verbatim** | scope `.closing .dom` to anchors only (§3.8) |
| `styles.css` 404 block (657–666) | **near-verbatim** | `.nf .ddoors { max-width: 52ch }` |
| `styles.css` motion / responsive / reduced-motion / forced-colors (668–807) | **verbatim** | re-verify gate 11 after the `.rrow` addition |
| `src/404.html` | **near-verbatim** | swap headline, wordmark, anchor list, closing line. No script |
| `src/og-card.html` | **adapt** | three new strings, two bars replacing the vertical edge (§6.3), **keep the relative font path**, re-render from `src/` and commit the PNG |
| `index.html` head + the 4-line boot script | **verbatim** | new title / description / OG strings, new favicon object |
| `index.html` `.u` + `<wbr>` pattern | **verbatim** | gate 11 depends on it |
| `site.js` — tween engine, `clipTo`, arrival observers, fling guard, spine, sticky spy, scroll and resize handlers, `releaseWillChange`, `visibilitychange` finish | **near-verbatim** | strip the four hero-input consumers; keep the pass, the cut, the tick, the scrub, the close |
| `site.js` — matcher, answer states, drain, idle wipe, combobox ARIA | **drop entirely** | delta 4.1 |

**Accessibility contract, carried whole:** `<html lang="en">`; focus never removed;
`prefers-contrast: more` compresses ranks rather than removing them; `forced-colors` handled;
**no-JS renders every section, every string, every anchor and every permitted link.** With the input
gone, this page has no interactive control other than anchors, so the no-JS page is the full page.

---

## 10 · Open items — strings needed, and measurements the builder must take

Per copy law §0: *"If a string is needed and is not in this file, it is a content decision — ask, do
not invent."* This adapter needs **two strings that do not exist**, both accessibility affordances.

**Strings, for the owner to ratify or replace:**

1. Skip-link text. Foundation's is `Skip to the seven doors`. Proposed here: **`Skip to the
   register`**.
2. `aria-label` on the sticky nav. Foundation's is `The seven doors`. Proposed here: **`The seven
   sections`**.

Neither is visible copy. Both are announced by screen readers, so both are copy decisions.

**Measurements the builder takes in a real browser and reports, because this file estimated them
from character counts:**

| # | Measure | This file's estimate | Gate |
|---|---|---|---|
| M1 | Hero stack height at 360×748 with the §3.2 levers pulled | ≈ 700 px of 748 | 12 |
| M2 | The width at which the seven sticky-nav labels stop fitting on one line | ≈ 1,080 px → breakpoint at 1,120 px | 11 |
| M3 | The width at which the strip's longest 80-char line stops fitting under `white-space: pre` | ≈ 860–880 px | — |
| M4 | `document.scrollWidth === innerWidth` at 320, 360, 390, 430 | — | 11 |
| M5 | `public/index.html` uncompressed byte count | unknown; foundation ships 86,451 with 3.5 KB of headroom | 14 |
| M6 | `.nf .ddoors` at 390 px — no anchor wraps | `52ch` | — |

**Two things to do on the day this ships, both on our own surfaces:**

1. Re-run the `curl` check over all nine permitted links (copy law §9). Anything not returning 200
   with a real human page drops to text the same day, and `/llms.txt` is edited in the same change.
2. foundation.org.ai's own permitted-link registry lists `standards.org.ai` under *"do not resolve or
   error."* Re-check it and, if this host is live, promote it **in the same change that ships this
   page.**

**No outreach, on either.** Both are edits to repositories we own.
