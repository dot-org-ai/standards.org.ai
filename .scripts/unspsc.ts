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

const NS = NAMESPACES.UNSPSC
const SOURCE_DIR = getSourcePath('UNSPSC')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

interface UNSPSCRow {
  segmentCode: string
  segmentTitle: string
  familyCode: string
  familyTitle: string
  classCode: string
  classTitle: string
  commodityCode: string
  commodityTitle: string
  definition: string
}

function transformUNSPSC(): void {
  console.log('Transforming UNSPSC Codes...')
  const data = parseTSV<UNSPSCRow>(join(SOURCE_DIR, 'UNSPSC.Codes.tsv'))

  // Extract unique segments, families, classes, commodities
  const segmentsMap = new Map<string, UNSPSCRow>()
  const familiesMap = new Map<string, UNSPSCRow>()
  const classesMap = new Map<string, UNSPSCRow>()
  const commoditiesMap = new Map<string, UNSPSCRow>()

  for (const row of data) {
    if (row.segmentCode && row.segmentTitle && !segmentsMap.has(row.segmentCode)) {
      segmentsMap.set(row.segmentCode, row)
    }
    if (row.familyCode && row.familyTitle && !familiesMap.has(row.familyCode)) {
      familiesMap.set(row.familyCode, row)
    }
    if (row.classCode && row.classTitle && !classesMap.has(row.classCode)) {
      classesMap.set(row.classCode, row)
    }
    if (row.commodityCode && row.commodityTitle && !commoditiesMap.has(row.commodityCode)) {
      commoditiesMap.set(row.commodityCode, row)
    }
  }

  // Write Segments
  const segmentRecords: StandardRecord[] = Array.from(segmentsMap.values()).map(row => ({
    ns: NS,
    type: 'Segment',
    id: toWikipediaStyleId(row.segmentTitle),
    name: row.segmentTitle,
    description: '',
    code: row.segmentCode,
    includedIn: getAggregationsForType('Segment'),
  }))
  writeStandardTSV(join(DATA_DIR, 'UNSPSC.Segments.tsv'), segmentRecords)

  // Write Families
  const familyRecords: StandardRecord[] = Array.from(familiesMap.values()).map(row => ({
    ns: NS,
    type: 'Family',
    id: toWikipediaStyleId(row.familyTitle),
    name: row.familyTitle,
    description: '',
    code: row.familyCode,
    includedIn: getAggregationsForType('Family'),
  }))
  writeStandardTSV(join(DATA_DIR, 'UNSPSC.Families.tsv'), familyRecords)

  // Write Classes
  const classRecords: StandardRecord[] = Array.from(classesMap.values()).map(row => ({
    ns: NS,
    type: 'Class',
    id: toWikipediaStyleId(row.classTitle),
    name: row.classTitle,
    description: '',
    code: row.classCode,
    includedIn: getAggregationsForType('Class'),
  }))
  writeStandardTSV(join(DATA_DIR, 'UNSPSC.Classes.tsv'), classRecords)

  // Write Commodities
  const commodityRecords: StandardRecord[] = Array.from(commoditiesMap.values()).map(row => ({
    ns: NS,
    type: 'Commodity',
    id: toWikipediaStyleId(row.commodityTitle),
    name: row.commodityTitle,
    description: cleanDescription(row.definition),
    code: row.commodityCode,
    includedIn: getAggregationsForType('Product'),
  }))
  writeStandardTSV(join(DATA_DIR, 'UNSPSC.Commodities.tsv'), commodityRecords)

  // Write all products combined
  const allProducts: StandardRecord[] = [
    ...segmentRecords,
    ...familyRecords,
    ...classRecords,
    ...commodityRecords,
  ]
  writeStandardTSV(join(DATA_DIR, 'UNSPSC.Products.tsv'), allProducts)

  // Write hierarchy relationships
  const hierarchyRelationships: Record<string, string>[] = []

  // Family -> Segment
  for (const row of familiesMap.values()) {
    if (row.segmentCode) {
      hierarchyRelationships.push({
        fromNs: NS,
        fromType: 'Family',
        fromCode: row.familyCode,
        toNs: NS,
        toType: 'Segment',
        toCode: row.segmentCode,
        relationshipType: 'child_of',
      })
    }
  }

  // Class -> Family
  for (const row of classesMap.values()) {
    if (row.familyCode) {
      hierarchyRelationships.push({
        fromNs: NS,
        fromType: 'Class',
        fromCode: row.classCode,
        toNs: NS,
        toType: 'Family',
        toCode: row.familyCode,
        relationshipType: 'child_of',
      })
    }
  }

  // Commodity -> Class
  for (const row of commoditiesMap.values()) {
    if (row.classCode) {
      hierarchyRelationships.push({
        fromNs: NS,
        fromType: 'Commodity',
        fromCode: row.commodityCode,
        toNs: NS,
        toType: 'Class',
        toCode: row.classCode,
        relationshipType: 'child_of',
      })
    }
  }

  writeTSV(
    join(REL_DIR, 'UNSPSC.Hierarchy.tsv'),
    hierarchyRelationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

export async function transformUNSPSCData(): Promise<void> {
  console.log('=== UNSPSC Transformation ===')
  ensureOutputDirs()

  transformUNSPSC()

  console.log('=== UNSPSC Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformUNSPSCData()
}
