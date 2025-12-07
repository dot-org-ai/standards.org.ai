import { join } from 'path'
import {
  NAMESPACES,
  parseCSV,
  writeStandardTSV,
  writeTSV,
  toWikipediaStyleId,
  cleanDescription,
  getSourcePath,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
  type StandardRecord,
} from './utils'

const NS = NAMESPACES.NAPCS
const SOURCE_DIR = getSourcePath('NAPCS')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

interface NAPCSRow {
  Level: string
  'Hierarchical structure': string
  Code: string
  Parent: string
  'Code title': string
  Superscript: string
  'Code definition': string
}

function getNAPCSType(level: string): string {
  switch (level) {
    case '1':
      return 'Group'
    case '2':
      return 'Class'
    case '3':
      return 'Subclass'
    case '4':
      return 'Detail'
    default:
      return 'Product'
  }
}

function transformProducts(): void {
  console.log('Transforming NAPCS Products...')
  const data = parseCSV<NAPCSRow>(join(SOURCE_DIR, 'NAPCS.2022.Structure.csv'))

  // Create a map for hierarchy lookups
  const codeMap = new Map<string, NAPCSRow>()
  for (const row of data) {
    if (row.Code) {
      codeMap.set(row.Code, row)
    }
  }

  const records: StandardRecord[] = data
    .filter(row => row.Code && row['Code title'])
    .map(row => ({
      ns: NS,
      type: getNAPCSType(row.Level),
      id: toWikipediaStyleId(row['Code title']),
      name: row['Code title'],
      description: cleanDescription(row['Code definition']),
      code: row.Code,
    }))

  writeStandardTSV(join(DATA_DIR, 'NAPCS.Products.tsv'), records)

  // Write hierarchy relationships
  const relationships: Record<string, string>[] = []
  for (const row of data) {
    if (!row.Code || !row.Parent) continue

    const parent = codeMap.get(row.Parent)
    if (parent) {
      relationships.push({
        fromNs: NS,
        fromType: getNAPCSType(row.Level),
        fromCode: row.Code,
        toNs: NS,
        toType: getNAPCSType(parent.Level),
        toCode: row.Parent,
        relationshipType: 'child_of',
      })
    }
  }

  writeTSV(
    join(REL_DIR, 'NAPCS.Product.Product.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

function transformGroups(): void {
  console.log('Extracting NAPCS Groups...')
  const data = parseCSV<NAPCSRow>(join(SOURCE_DIR, 'NAPCS.2022.Structure.csv'))

  // Extract only level 1 (Groups)
  const groupRecords: StandardRecord[] = data
    .filter(row => row.Level === '1' && row.Code && row['Code title'])
    .map(row => ({
      ns: NS,
      type: 'Group',
      id: toWikipediaStyleId(row['Code title']),
      name: row['Code title'],
      description: cleanDescription(row['Code definition']),
      code: row.Code,
    }))

  writeStandardTSV(join(DATA_DIR, 'NAPCS.Groups.tsv'), groupRecords)
}

export async function transformNAPCS(): Promise<void> {
  console.log('=== NAPCS Transformation ===')
  ensureOutputDirs()

  transformProducts()
  transformGroups()

  console.log('=== NAPCS Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformNAPCS()
}
