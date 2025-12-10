import { join } from 'path'
import {
  NAMESPACES,
  parseTSV,
  writeStandardTSV,
  writeTSV,
  toWikipediaStyleId,
  cleanDescription,
  getSourcePath,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
  getAggregationsForType,
  type StandardRecord,
} from './utils'

const NS = NAMESPACES.NAICS
const SOURCE_DIR = getSourcePath('NAICS')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

interface NAICSRow {
  changeIndicator: string
  '2022NAICSCode': string
  '2022NAICSTitle': string
}

interface NAICSDescriptionRow {
  Code: string
  Title: string
  Description: string
}

// Load descriptions map from the descriptions file
function loadDescriptions(): Map<string, string> {
  const descMap = new Map<string, string>()
  try {
    const descData = parseTSV<NAICSDescriptionRow>(join(SOURCE_DIR, 'NAICS.Descriptions.tsv'))
    for (const row of descData) {
      if (row.Code && row.Description && row.Description !== 'NULL') {
        descMap.set(row.Code, row.Description)
      }
    }
    console.log(`Loaded ${descMap.size} NAICS descriptions`)
  } catch (e) {
    console.log('Warning: Could not load NAICS descriptions:', e)
  }
  return descMap
}

function getNAICSLevel(code: string): string {
  const codeLength = code.length
  switch (codeLength) {
    case 2:
      return 'Sector'
    case 3:
      return 'Subsector'
    case 4:
      return 'IndustryGroup'
    case 5:
      return 'NAICSIndustry'
    case 6:
      return 'NationalIndustry'
    default:
      return 'Industry'
  }
}

function getParentCode(code: string): string | null {
  if (code.length <= 2) return null
  return code.slice(0, -1)
}

function transformIndustries(descMap: Map<string, string>): void {
  console.log('Transforming NAICS Industries...')
  const data = parseTSV<NAICSRow>(join(SOURCE_DIR, 'NAICS.Industries.tsv'))

  // Clean titles (remove trailing 'T' markers)
  const cleanTitle = (title: string): string => {
    return title.replace(/T\s*$/, '').trim()
  }

  // Create a map for hierarchy lookups
  const codeMap = new Map<string, NAICSRow>()
  for (const row of data) {
    const code = row['2022NAICSCode']
    if (code) {
      codeMap.set(code, row)
    }
  }

  const records: StandardRecord[] = data
    .filter(row => row['2022NAICSCode'])
    .map(row => ({
      ns: NS,
      type: getNAICSLevel(row['2022NAICSCode']),
      id: toWikipediaStyleId(cleanTitle(row['2022NAICSTitle'])),
      name: cleanTitle(row['2022NAICSTitle']),
      description: cleanDescription(descMap.get(row['2022NAICSCode']) || ''),
      code: row['2022NAICSCode'],
      includedIn: getAggregationsForType('Industry'),
    }))

  writeStandardTSV(join(DATA_DIR, 'NAICS.Industries.tsv'), records)

  // Write hierarchy relationships
  const relationships: Record<string, string>[] = []
  for (const row of data) {
    const code = row['2022NAICSCode']
    if (!code) continue

    const parentCode = getParentCode(code)
    if (parentCode && codeMap.has(parentCode)) {
      relationships.push({
        fromNs: NS,
        fromType: getNAICSLevel(code),
        fromCode: code,
        toNs: NS,
        toType: getNAICSLevel(parentCode),
        toCode: parentCode,
        relationshipType: 'childOf',
      })
    }
  }

  writeTSV(
    join(REL_DIR, 'NAICS.Industry.Industry.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

function transformSectors(descMap: Map<string, string>): void {
  console.log('Extracting NAICS Sectors...')
  const data = parseTSV<NAICSRow>(join(SOURCE_DIR, 'NAICS.Industries.tsv'))

  // Clean titles (remove trailing 'T' markers)
  const cleanTitle = (title: string): string => {
    return title.replace(/T\s*$/, '').trim()
  }

  // Extract only 2-digit sector codes
  const sectorRecords: StandardRecord[] = data
    .filter(row => row['2022NAICSCode'] && row['2022NAICSCode'].length === 2)
    .map(row => ({
      ns: NS,
      type: 'Sector',
      id: toWikipediaStyleId(cleanTitle(row['2022NAICSTitle'])),
      name: cleanTitle(row['2022NAICSTitle']),
      description: cleanDescription(descMap.get(row['2022NAICSCode']) || ''),
      code: row['2022NAICSCode'],
      includedIn: getAggregationsForType('Sector'),
    }))

  writeStandardTSV(join(DATA_DIR, 'NAICS.Sectors.tsv'), sectorRecords)
}

export async function transformNAICS(): Promise<void> {
  console.log('=== NAICS Transformation ===')
  ensureOutputDirs()

  // Load descriptions first
  const descMap = loadDescriptions()

  transformIndustries(descMap)
  transformSectors(descMap)

  console.log('=== NAICS Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformNAICS()
}
