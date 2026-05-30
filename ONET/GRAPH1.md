# O\*NET in Graph-1 (the economy as it is) — `Tool` + `usesTool`

This note records, at the source of truth, a Graph-1 Noun-identity decision made
downstream in the atlas (`explore.startups.studio`) per **ADR-0057** ("The economy
is three graphs; lock Graph-1"). It does **not** change any `.data/*.tsv` export.

## `Tool` is a locked Graph-1 Noun (O\*NET)

ADR-0057 §B fixes a 19-Noun Graph-1 set. **`Tool` is one of them**, sourced from
O\*NET. It is a first-class standard entity here already — see `ONET/[Tool].mdx`
(`$type: ONET/Tool`, `sameAs https://standards.org.ai/Tool/{code}`, with an
"Occupations Using This Tool" section). The published exports are authoritative
for it:

- **`.data/ONET.Tools.tsv`** — 18,105 Tool nodes
  (cols: `ns, type(=Tool), id(slug), name, description, code(UNSPSC), sameAs, includedIn`).
- **`.data/relationships/ONET.Occupation.Tool.tsv`** — 41,662 `Occupation → Tool`
  rows (`relationshipType = usesTool`).

## The `usesTool` edge (Occupation → Tool)

`relationships/ONET.Occupation.Tool.tsv` is the standard-grounded
`Occupation usesTool Tool` crosswalk. ADR-0057 §B rule 2 calls it out explicitly:
the atlas had been folding O\*NET Tools into an overloaded `uses` → **Product**
edge (so `usesTool` → `Tool` read **0** in production). The fix is to **split**
`uses`:

- `usesTool` → **Tool** (physical instrument — this file),
- `usesSoftware` → Product (O\*NET Technology),
- legacy `uses` → Product.

The atlas now seeds the `Tool` node-type and wires `usesTool` additively from
these two TSVs (atlas `scripts/bridge-onet-tool.ts`; atlas issue #573). No export
in this repo changed — the data was already correct; only the *consumer's*
typing did.

## Noun-identity note: Tool ≈ a re-typed slice of Product

Measured against production: **18,104 / 18,105** O\*NET Tools collide with an
existing atlas `Products` node by normalized name, and **18,003** share the exact
same slug (the prior fold seeded the Tool list as Products and matched by slug).
Whether the colliding Products should be **retyped** to `Tool` (vs. kept as a
dual classification) is an open Graph-1 Noun-identity decision for the ADR-0057
thread. O\*NET remains canonical for the `Tool` Noun regardless; the additive
`Tool` seed is independent of that decision.

> Counts (TSV rows vs. wired edges): the crosswalk has 41,662 rows, but ~38,847
> wire after Occupation-slug resolution (some O\*NET occupations in the Tool file
> are not in the atlas's seeded Occupation set). That gap is a resolution
> artifact, not a data defect in this repo.

Refs: ADR-0057 (`explore.startups.studio/docs/adr/0057-…`), the Graph-1 readiness
audit (`explore.startups.studio/docs/graph1-lock-readiness-audit.md` §6, Track A
item 1), `GRAPH1-TRIPLES.md` (`usesTool` triple).
