/**
 * BEA Input-Output → Industry suppliesTo Industry (with technical coefficient).
 *
 * Decodes the BEA Industry-by-Industry Total Requirements table (Summary level,
 * After Redefinitions) into a directed inter-industry supply relationship, keyed
 * to NAICS code prefixes via BEA's official BEA-industry↔NAICS concordance.
 *
 * Source files (in .source/BEA/, downloaded by download-bea.sh):
 *   - IxI_TR_1997-2023_Summary.xlsx
 *       Industry-by-Industry Total Requirements, After Redefinitions, Summary
 *       (~73 BEA summary industries). Per-year sheets ('1997'…'2023').
 *       Cell (row i, col j) = total industry output of i required, directly +
 *       indirectly, per dollar of industry j's *final demand* (Leontief total
 *       requirements). This is the directed "i supplies to j" coefficient.
 *   - BEA-Industry-and-Commodity-Codes-and-NAICS-Concordance.xlsx
 *       Maps each BEA Summary code → its "Related 2017 NAICS Codes" (prefixes).
 *
 * Output:
 *   - .data/relationships/BEA.Industry.suppliesTo.Industry.tsv
 *       One row per directed BEA-summary pair (i→j) above the coefficient floor,
 *       carrying the coefficient + the NAICS prefix sets each side maps to. The
 *       atlas bridge (scripts/bridge-bea-io.ts) resolves these prefixes to live
 *       Industry nodes and fans out the `suppliesTo` edges.
 *   - .data/relationships/BEA.Industry.suppliesTo.Industry.unmapped.tsv
 *       BEA summary codes with no NAICS mapping (government / scrap / imports),
 *       reported, never minted.
 *
 * Coefficient semantics: total-requirements (Leontief inverse) coefficient in
 * producers' prices, dimensionless ($ of i output per $ of j final demand).
 * The diagonal (i==i) is excluded (own-industry feedback, always > 1). Cells
 * below COEFF_FLOOR are dropped as negligible.
 *
 * Deterministic, no LLM. Run: bun run .scripts/bea-io.ts
 */
import { join } from 'path'
import * as XLSX from 'xlsx'
import { getSourcePath, getRelationshipsPath, writeTSV, ensureOutputDirs } from './utils'

const SOURCE_DIR = getSourcePath('BEA')
const REL_DIR = getRelationshipsPath()

// Latest available year sheet in the 1997-2023 workbook.
const YEAR = '2023'
// Drop inter-industry requirement cells at/below this share. 0.001 = a tenth of
// a cent of i's output per dollar of j's final demand — below this the link is
// economic noise. Tunable; reported in the run summary.
const COEFF_FLOOR = 0.001

interface ConcordanceEntry {
  summaryCode: string
  summaryDesc: string
  sectorCode: string
  /** NAICS prefixes this BEA summary industry maps to (from "Related 2017 NAICS Codes"). */
  naicsPrefixes: string[]
}

/** Parse the BEA↔NAICS concordance → Map<summaryCode, ConcordanceEntry>. */
function parseConcordance(): Map<string, ConcordanceEntry> {
  const filePath = join(SOURCE_DIR, 'BEA-Industry-and-Commodity-Codes-and-NAICS-Concordance.xlsx')
  const wb = XLSX.readFile(filePath)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][]

  // Header is at row index 4:
  //   Sector | Description | Summary | Description | U.Summary | Description |
  //   Detail | Description | GO Detail | Description | Notes | Related 2017 NAICS Codes | ...
  const SECTOR = 0, SUMMARY = 2, SUMMARY_DESC = 3, RELATED = 11
  const out = new Map<string, ConcordanceEntry>()

  for (let i = 5; i < rows.length; i++) {
    const r = rows[i]
    const summaryCode = String(r[SUMMARY] ?? '').trim()
    if (!summaryCode) continue
    let entry = out.get(summaryCode)
    if (!entry) {
      entry = {
        summaryCode,
        summaryDesc: String(r[SUMMARY_DESC] ?? '').trim(),
        sectorCode: String(r[SECTOR] ?? '').trim(),
        naicsPrefixes: [],
      }
      out.set(summaryCode, entry)
    }
    const related = String(r[RELATED] ?? '').trim()
    if (related) {
      for (const tok of related.split(';')) {
        const code = tok.trim()
        if (!code || code.toLowerCase() === 'n.a.') continue
        // "23*" means "all of NAICS 23" → prefix 23.
        const prefix = code.endsWith('*') ? code.slice(0, -1) : code
        // Keep alphanumerics only (NAICS codes are digits; guard junk).
        if (/^[0-9]{2,6}$/.test(prefix) && !entry.naicsPrefixes.includes(prefix)) {
          entry.naicsPrefixes.push(prefix)
        }
      }
    }
  }
  // Sort each prefix list for stable output.
  for (const e of out.values()) e.naicsPrefixes.sort()
  return out
}

interface MatrixCell {
  fromCode: string
  toCode: string
  coefficient: number
}

/** Parse the IxI Total Requirements Summary matrix for YEAR → directed cells. */
function parseRequirementsMatrix(): {
  cells: MatrixCell[]
  codeDesc: Map<string, string>
} {
  const filePath = join(SOURCE_DIR, 'IxI_TR_1997-2023_Summary.xlsx')
  const wb = XLSX.readFile(filePath)
  if (!wb.SheetNames.includes(YEAR)) {
    throw new Error(`Year sheet '${YEAR}' not found in ${filePath}; sheets: ${wb.SheetNames.join(',')}`)
  }
  const sheet = wb.Sheets[YEAR]
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][]

  // Layout (0-indexed):
  //   r5: [ '', 'Industries/Industries', <colCode...> ]     ← column BEA codes
  //   r6: [ 'Code', 'Industry Description', <colDesc...> ]   ← column descriptions
  //   r7+: [ rowCode, rowDesc, <coefficient...> ]            ← supplying-industry rows
  const CODE_ROW = 5
  const DESC_ROW = 6
  const DATA_START = 7
  const FIRST_VALUE_COL = 2

  const colCodes: string[] = []
  for (let c = FIRST_VALUE_COL; c < grid[CODE_ROW].length; c++) {
    colCodes.push(String(grid[CODE_ROW][c] ?? '').trim())
  }

  const codeDesc = new Map<string, string>()
  for (let c = FIRST_VALUE_COL; c < grid[DESC_ROW].length; c++) {
    const code = colCodes[c - FIRST_VALUE_COL]
    if (code) codeDesc.set(code, String(grid[DESC_ROW][c] ?? '').trim())
  }

  const cells: MatrixCell[] = []
  for (let r = DATA_START; r < grid.length; r++) {
    const row = grid[r]
    const fromCode = String(row[0] ?? '').trim()
    if (!fromCode) continue
    if (!codeDesc.has(fromCode)) codeDesc.set(fromCode, String(row[1] ?? '').trim())
    for (let c = FIRST_VALUE_COL; c < row.length; c++) {
      const toCode = colCodes[c - FIRST_VALUE_COL]
      if (!toCode) continue
      const raw = row[c]
      const coefficient = typeof raw === 'number' ? raw : parseFloat(String(raw))
      if (!Number.isFinite(coefficient)) continue
      cells.push({ fromCode, toCode, coefficient })
    }
  }
  return { cells, codeDesc }
}

function main() {
  console.log(`\n── BEA Input-Output → Industry suppliesTo Industry (year ${YEAR}, floor ${COEFF_FLOOR}) ──\n`)
  ensureOutputDirs()

  const concordance = parseConcordance()
  console.log(`Concordance: ${concordance.size} BEA summary codes`)
  const mappable = [...concordance.values()].filter((e) => e.naicsPrefixes.length > 0)
  const unmapped = [...concordance.values()].filter((e) => e.naicsPrefixes.length === 0)
  console.log(`  mapped to NAICS: ${mappable.length} ; unmapped (gov/scrap/imports): ${unmapped.length}`)

  const { cells, codeDesc } = parseRequirementsMatrix()
  console.log(`Requirements matrix: ${cells.length} cells (${codeDesc.size} industries)`)

  // Filter: drop diagonal, drop below floor, require BOTH endpoints mappable.
  const mappableCodes = new Set(mappable.map((e) => e.summaryCode))
  let droppedDiag = 0,
    droppedFloor = 0,
    droppedUnmapped = 0
  const kept: MatrixCell[] = []
  for (const cell of cells) {
    if (cell.fromCode === cell.toCode) {
      droppedDiag++
      continue
    }
    if (cell.coefficient < COEFF_FLOOR) {
      droppedFloor++
      continue
    }
    if (!mappableCodes.has(cell.fromCode) || !mappableCodes.has(cell.toCode)) {
      droppedUnmapped++
      continue
    }
    kept.push(cell)
  }
  console.log(
    `Kept ${kept.length} directed pairs (dropped: ${droppedDiag} diagonal, ${droppedFloor} below-floor, ${droppedUnmapped} unmapped-endpoint)`,
  )

  // Emit one row per kept directed pair, carrying coefficient + NAICS prefixes.
  // fromId/toId = BEA summary codes; the atlas bridge resolves prefixes → nodes.
  const relRows = kept
    .map((cell) => {
      const from = concordance.get(cell.fromCode)!
      const to = concordance.get(cell.toCode)!
      return {
        fromNs: 'bea.org.ai',
        fromType: 'Industry',
        fromId: cell.fromCode,
        fromNaics: from.naicsPrefixes.join(','),
        fromName: from.summaryDesc,
        toNs: 'bea.org.ai',
        toType: 'Industry',
        toId: cell.toCode,
        toNaics: to.naicsPrefixes.join(','),
        toName: to.summaryDesc,
        relationshipType: 'suppliesTo',
        coefficient: cell.coefficient.toFixed(6),
        year: YEAR,
        table: 'IxI_TR_Summary_AfterRedef',
      }
    })
    .sort((a, b) => Number(b.coefficient) - Number(a.coefficient))

  writeTSV(
    join(REL_DIR, 'BEA.Industry.suppliesTo.Industry.tsv'),
    relRows,
    [
      'fromNs', 'fromType', 'fromId', 'fromNaics', 'fromName',
      'toNs', 'toType', 'toId', 'toNaics', 'toName',
      'relationshipType', 'coefficient', 'year', 'table',
    ],
  )

  // Report unmapped BEA codes (never minted).
  const unmappedRows = unmapped.map((e) => ({
    summaryCode: e.summaryCode,
    summaryDesc: e.summaryDesc,
    sectorCode: e.sectorCode,
    reason: 'no NAICS concordance (government / scrap / noncomparable-imports)',
  }))
  writeTSV(
    join(REL_DIR, 'BEA.Industry.suppliesTo.Industry.unmapped.tsv'),
    unmappedRows,
    ['summaryCode', 'summaryDesc', 'sectorCode', 'reason'],
  )

  // Coefficient distribution (for the run summary / verification).
  const coeffs = relRows.map((r) => Number(r.coefficient)).sort((a, b) => a - b)
  const pct = (p: number) => coeffs[Math.floor((coeffs.length - 1) * p)]
  console.log(`\nCoefficient distribution (kept):`)
  console.log(`  min=${coeffs[0]?.toFixed(4)} p50=${pct(0.5)?.toFixed(4)} p90=${pct(0.9)?.toFixed(4)} p99=${pct(0.99)?.toFixed(4)} max=${coeffs[coeffs.length - 1]?.toFixed(4)}`)
  console.log(`\nTop 8 inter-industry requirements:`)
  for (const r of relRows.slice(0, 8)) {
    console.log(`  ${r.coefficient}  ${r.fromName}  →  ${r.toName}`)
  }
  console.log(`\nUnmapped BEA codes (reported, not minted): ${unmapped.map((e) => e.summaryCode).join(', ')}\n`)
}

main()
