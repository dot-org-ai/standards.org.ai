// Decode the BLS OEWS national industry-specific occupation employment+wage
// matrix (`all_data_M_2024.xlsx`, ~81 MB) into a relationship TSV:
//
//   .data/relationships/BLS.OEWS.Industry.Occupation.tsv
//     (NAICS Industry code → SOC Occupation code, with TOT_EMP + mean/median wage)
//
// This is the deterministic source for the `Industry employs Occupation` edge
// (ADR-0057 Graph-1 NET family; ~58k named as a deterministic SG win). The raw
// xlsx has long been on disk but UNDECODED — only a thin 410-edge Sector-grain
// `seed-v1` (the reverse `employedIn`) ever reached the graph.
//
// SOURCE SHAPE (sheet "All May 2024 data", 32 cols, ~414k rows):
//   AREA / AREA_TYPE   — 1=U.S. (national), 2=State, 3=Territory, 4=MSA, 6=NonMetro
//   NAICS / NAICS_TITLE — NAICS industry code for the row
//   I_GROUP            — industry level: "cross-industry" | "sector" | "3-digit"
//                        | "4-digit" | "5-digit" | "6-digit" (± ", ownership")
//   OWN_CODE           — ownership split (5=Private, 1/2/3=Govt, 1235=All, …)
//   OCC_CODE / OCC_TITLE — SOC code ("15-1252")
//   O_GROUP            — SOC level: "total" | "major" | "minor" | "broad" | "detailed"
//   TOT_EMP, H_MEAN, A_MEAN, H_MEDIAN, A_MEDIAN, EMP_PRSE, percentiles…
//
// ROW FILTER (what we keep — the national industry×occupation matrix, no
// double-counting):
//   • AREA_TYPE == "1"                  → national only (drop state/MSA/nonmetro)
//   • I_GROUP   != "cross-industry"     → industry-specific only (the
//                                         cross-industry rows are the national
//                                         all-industry rollup → would double-count)
//   • I_GROUP   has no ", ownership"     → the plain industry row already carries
//                                         the relevant published total; the
//                                         ", ownership" variants are sub-splits
//                                         that would double-count employment
//   • O_GROUP   == "detailed"           → leaf SOC occupation (skip major/minor/
//                                         broad aggregate rows that re-sum
//                                         their detailed children)
//
// EMITTED GRAIN: one row per (published NAICS code, published SOC code). The
// OEWS file occasionally lists the same industry twice (a NAICS aggregated to
// 3-digit appears once "3-digit" and once "4-digit" — see Field Descriptions);
// those carry an identical published cell, so we de-dup on (NAICS, OCC) keeping
// the row with the larger TOT_EMP (identical when truly duplicated).
//
// Wage sentinels are normalized: "*" (wage not available), "#" (wage ≥
// $115/hr / $239,200/yr top-code), "**" (employment not available) → emitted
// as empty cells (the atlas bridge treats them as null).
//
// NAICS→node and SOC→node crosswalk + ancestor-rollup for codes the atlas
// hasn't seeded as their own node lives in the ATLAS bridge
// (scripts/bridge-bls-oews.ts), which knows the live `ontology_nodes` codes.
// This generator stays source-faithful: it emits the OEWS-published codes.
//
// USAGE:  bun run .scripts/bls-oews.ts

import { join } from 'path'
import { existsSync } from 'fs'
import * as XLSX from 'xlsx'
import {
  NAMESPACES,
  writeTSV,
  getSourcePath,
  getRelationshipsPath,
  ensureOutputDirs,
} from './utils'

const SOURCE_FILE = join(getSourcePath('BLS'), 'all_data_M_2024.xlsx')
const REL_DIR = getRelationshipsPath()
const OUT_FILE = join(REL_DIR, 'BLS.OEWS.Industry.Occupation.tsv')
const SHEET = 'All May 2024 data'

// Normalize an OEWS numeric cell: strip thousands separators and BLS sentinels
// ("*", "**", "#", "~"). Returns a clean numeric string or '' (empty).
function num(raw: unknown): string {
  if (raw == null) return ''
  const s = String(raw).trim()
  if (s === '' || s === '*' || s === '**' || s === '#' || s === '~') return ''
  const cleaned = s.replace(/[$,]/g, '')
  return /^-?\d+(\.\d+)?$/.test(cleaned) ? cleaned : ''
}

interface Edge {
  naicsCode: string
  socCode: string
  naicsTitle: string
  socTitle: string
  totEmp: string
  empPrse: string
  hMean: string
  aMean: string
  hMedian: string
  aMedian: string
}

export function transformOEWS(): void {
  console.log('=== BLS OEWS Industry×Occupation Decode ===')
  ensureOutputDirs()

  if (!existsSync(SOURCE_FILE)) {
    console.error(`Source not found: ${SOURCE_FILE}`)
    process.exit(1)
  }

  console.log(`Reading ${SOURCE_FILE} (~81 MB, ~20-30s)…`)
  const t0 = Date.now()
  const wb = XLSX.readFile(SOURCE_FILE)
  if (!wb.SheetNames.includes(SHEET)) {
    console.error(`Sheet "${SHEET}" not found. Sheets: ${wb.SheetNames.join(', ')}`)
    process.exit(1)
  }
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[SHEET], { defval: '' })
  console.log(`  parsed ${rows.length.toLocaleString()} rows in ${((Date.now() - t0) / 1000).toFixed(1)}s`)

  // De-dup on (NAICS, OCC) keeping the row with larger TOT_EMP.
  const edges = new Map<string, Edge>()
  let national = 0
  let industrySpecific = 0
  let kept = 0
  let droppedOwnership = 0
  let droppedCrossIndustry = 0
  let droppedNonDetailed = 0

  for (const r of rows) {
    if (String(r['AREA_TYPE']).trim() !== '1') continue // national only
    national++

    const iGroup = String(r['I_GROUP']).trim()
    if (iGroup === 'cross-industry') {
      droppedCrossIndustry++
      continue
    }
    industrySpecific++
    if (iGroup.includes('ownership')) {
      droppedOwnership++
      continue
    }
    if (String(r['O_GROUP']).trim() !== 'detailed') {
      droppedNonDetailed++
      continue
    }

    const naicsCode = String(r['NAICS']).trim()
    const socCode = String(r['OCC_CODE']).trim()
    if (!naicsCode || !socCode) continue

    const totEmp = num(r['TOT_EMP'])
    const edge: Edge = {
      naicsCode,
      socCode,
      naicsTitle: String(r['NAICS_TITLE']).trim(),
      socTitle: String(r['OCC_TITLE']).trim(),
      totEmp,
      empPrse: num(r['EMP_PRSE']),
      hMean: num(r['H_MEAN']),
      aMean: num(r['A_MEAN']),
      hMedian: num(r['H_MEDIAN']),
      aMedian: num(r['A_MEDIAN']),
    }

    const key = `${naicsCode}|${socCode}`
    const prev = edges.get(key)
    if (!prev || (Number(totEmp) || 0) > (Number(prev.totEmp) || 0)) {
      edges.set(key, edge)
    }
    kept++
  }

  console.log(`\nRow funnel:`)
  console.log(`  national (AREA_TYPE=1):        ${national.toLocaleString()}`)
  console.log(`  dropped cross-industry rollup: ${droppedCrossIndustry.toLocaleString()}`)
  console.log(`  industry-specific:             ${industrySpecific.toLocaleString()}`)
  console.log(`  dropped ", ownership" splits:  ${droppedOwnership.toLocaleString()}`)
  console.log(`  dropped non-detailed (agg) occ: ${droppedNonDetailed.toLocaleString()}`)
  console.log(`  kept (pre-dedup):              ${kept.toLocaleString()}`)
  console.log(`  distinct (NAICS, SOC) edges:   ${edges.size.toLocaleString()}`)

  const distinctNaics = new Set([...edges.values()].map((e) => e.naicsCode))
  const distinctSoc = new Set([...edges.values()].map((e) => e.socCode))
  console.log(`  distinct NAICS codes:          ${distinctNaics.size}`)
  console.log(`  distinct SOC codes:            ${distinctSoc.size}`)

  // Write the relationship TSV. fromId = NAICS Industry code, toId = SOC
  // Occupation code, relationshipType = employs (Industry→Occupation per
  // ADR-0057). Employment + wage attributes ride on the edge as extra columns.
  const records = [...edges.values()]
    .sort((a, b) => a.naicsCode.localeCompare(b.naicsCode) || a.socCode.localeCompare(b.socCode))
    .map((e) => ({
      fromNs: NAMESPACES.NAICS,
      fromType: 'Industry',
      fromId: e.naicsCode,
      toNs: NAMESPACES.BLS,
      toType: 'Occupation',
      toId: e.socCode,
      relationshipType: 'employs',
      naicsTitle: e.naicsTitle,
      occTitle: e.socTitle,
      totalEmployment: e.totEmp,
      employmentPrse: e.empPrse,
      hourlyMean: e.hMean,
      annualMean: e.aMean,
      hourlyMedian: e.hMedian,
      annualMedian: e.aMedian,
    }))

  writeTSV(OUT_FILE, records, [
    'fromNs',
    'fromType',
    'fromId',
    'toNs',
    'toType',
    'toId',
    'relationshipType',
    'naicsTitle',
    'occTitle',
    'totalEmployment',
    'employmentPrse',
    'hourlyMean',
    'annualMean',
    'hourlyMedian',
    'annualMedian',
  ])

  console.log(`\nWrote ${records.length.toLocaleString()} rows → ${OUT_FILE}`)
  console.log('=== BLS OEWS Decode Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformOEWS()
}
