import { join } from 'path'
import * as XLSX from 'xlsx'
import {
  NAMESPACES,
  parseTSV,
  writeTSV,
  getSourcePath,
  getRelationshipsPath,
  ensureOutputDirs,
  type StandardRecord,
} from './utils'

const SOURCE_DIR = getSourcePath('Census')
const REL_DIR = getRelationshipsPath()

interface SICNAICSMapping {
  sicCode: string
  sicDescription: string
  naicsCode: string
  naicsDescription: string
  partIndicator: string
}

/**
 * Parse the Census Bureau SIC to NAICS crosswalk Excel file
 */
function parseSICNAICSCrosswalk(): SICNAICSMapping[] {
  const filePath = join(SOURCE_DIR, '1987_SIC_to_1997_NAICS.xls')
  console.log(`Reading SIC-NAICS crosswalk from: ${filePath}`)

  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  // Convert to array of arrays with empty string as default
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][]

  console.log(`Loaded ${data.length} rows from Excel`)

  // Skip header row and filter to only rows with both SIC and NAICS codes
  const mappings: SICNAICSMapping[] = []

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const sicCode = String(row[0] || '').trim()
    const partIndicator = String(row[1] || '').trim()
    const sicDescription = String(row[2] || '').trim()
    const naicsCode = String(row[3] || '').trim()
    const naicsDescription = String(row[4] || '').trim()

    // Only include rows that have both a SIC code and NAICS code
    if (sicCode && naicsCode) {
      mappings.push({
        sicCode,
        sicDescription,
        naicsCode,
        naicsDescription,
        partIndicator,
      })
    }
  }

  console.log(`Extracted ${mappings.length} SIC-NAICS mappings`)
  return mappings
}

/**
 * Load existing SIC codes from SEC.SICCodes.tsv to get proper IDs
 */
function loadSICCodes(): Map<string, string> {
  const sicFile = join(process.cwd(), '.data', 'SEC.SICCodes.tsv')
  console.log(`Loading SIC codes from: ${sicFile}`)

  const data = parseTSV<StandardRecord>(sicFile)
  const sicMap = new Map<string, string>()

  for (const record of data) {
    if (record.code && record.id) {
      sicMap.set(record.code, record.id)
    }
  }

  console.log(`Loaded ${sicMap.size} SIC codes`)
  return sicMap
}

/**
 * Load existing NAICS codes from NAICS.Industries.tsv to get proper IDs
 */
function loadNAICSCodes(): Map<string, string> {
  const naicsFile = join(process.cwd(), '.data', 'NAICS.Industries.tsv')
  console.log(`Loading NAICS industries from: ${naicsFile}`)

  const data = parseTSV<StandardRecord>(naicsFile)
  const naicsMap = new Map<string, string>()

  for (const record of data) {
    if (record.code && record.id) {
      naicsMap.set(record.code, record.id)
    }
  }

  console.log(`Loaded ${naicsMap.size} NAICS industries`)
  return naicsMap
}

/**
 * Create SIC to NAICS crosswalk relationship file
 */
export async function transformSICNAICSCrosswalk(): Promise<void> {
  console.log('=== SIC to NAICS Crosswalk Transformation ===')
  ensureOutputDirs()

  // Load the crosswalk mappings from Census Bureau
  const mappings = parseSICNAICSCrosswalk()

  // Load existing SIC and NAICS codes to get proper IDs
  const sicCodes = loadSICCodes()
  const naicsCodes = loadNAICSCodes()

  // Build relationship records
  const relationships: Record<string, string>[] = []
  const skipped: { sic: string; naics: string; reason: string }[] = []

  for (const mapping of mappings) {
    const sicId = sicCodes.get(mapping.sicCode)
    const naicsId = naicsCodes.get(mapping.naicsCode)

    if (!sicId) {
      skipped.push({
        sic: mapping.sicCode,
        naics: mapping.naicsCode,
        reason: `SIC code ${mapping.sicCode} not found in SEC.SICCodes.tsv`,
      })
      continue
    }

    if (!naicsId) {
      skipped.push({
        sic: mapping.sicCode,
        naics: mapping.naicsCode,
        reason: `NAICS code ${mapping.naicsCode} not found in NAICS.Industries.tsv`,
      })
      continue
    }

    relationships.push({
      fromNs: NAMESPACES.SEC,
      fromType: 'SICCode',
      fromId: sicId,
      toNs: NAMESPACES.NAICS,
      toType: 'Industry',
      toId: naicsId,
      relationshipType: 'maps_to',
    })
  }

  console.log(`Created ${relationships.length} SIC-NAICS relationships`)

  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} mappings:`)
    // Show first 10 skipped items
    skipped.slice(0, 10).forEach(item => {
      console.log(`  ${item.sic} -> ${item.naics}: ${item.reason}`)
    })
    if (skipped.length > 10) {
      console.log(`  ... and ${skipped.length - 10} more`)
    }
  }

  // Write the relationship file
  const outputPath = join(REL_DIR, 'SIC.NAICS.Crosswalk.tsv')
  writeTSV(outputPath, relationships, [
    'fromNs',
    'fromType',
    'fromId',
    'toNs',
    'toType',
    'toId',
    'relationshipType',
  ])

  console.log(`Wrote SIC-NAICS crosswalk to: ${outputPath}`)
  console.log('=== SIC to NAICS Crosswalk Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformSICNAICSCrosswalk()
}
