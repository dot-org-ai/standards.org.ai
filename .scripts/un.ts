/**
 * UN Standards Transformation Script
 * Transforms UN data (LOCODE, M49 Regions, EDIFACT) into standard TSV format
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import {
  NAMESPACES,
  StandardRecord,
  RelationshipRecord,
  parseCSV,
  writeStandardTSV,
  writeRelationshipTSV,
  writeTSV,
  toWikipediaStyleId,
  cleanDescription,
  getSourcePath,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
} from './utils'

const NS = NAMESPACES.UN
const SOURCE_DIR = getSourcePath('UN')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

interface LOCODERecord {
  Change: string
  Country: string
  Location: string
  Name: string
  NameWoDiacritics: string
  Subdivision: string
  Status: string
  Function: string
  Date: string
  IATA: string
  Coordinates: string
  Remarks: string
}

interface M49Record {
  name: string
  'alpha-2': string
  'alpha-3': string
  'country-code': string
  'iso_3166-2': string
  region: string
  'sub-region': string
  'intermediate-region': string
  'region-code': string
  'sub-region-code': string
  'intermediate-region-code': string
}

interface EDIFACTMessageType {
  code: string
  description: string
  revision: string
}

interface EDIFACTData {
  metadata: {
    source: string
    version: string
    total_messages: number
  }
  message_types: EDIFACTMessageType[]
}

function transformLOCODE(): void {
  console.log('Transforming UN/LOCODE...')

  const sourceFile = join(SOURCE_DIR, 'UN.LOCODE.CodeList.csv')
  const records = parseCSV<LOCODERecord>(sourceFile)

  const locations: StandardRecord[] = []
  const locationCountries: RelationshipRecord[] = []

  // Function codes mapping
  const functionDescriptions: Record<string, string> = {
    '0': 'Function not known',
    '1': 'Port (maritime)',
    '2': 'Rail terminal',
    '3': 'Road terminal',
    '4': 'Airport',
    '5': 'Postal exchange office',
    '6': 'Multimodal function',
    '7': 'Fixed transport function',
    'B': 'Border crossing',
  }

  for (const record of records) {
    const country = record.Country
    const location = record.Location
    if (!country || !location) continue

    const code = `${country}${location}`
    const name = record.Name || record.NameWoDiacritics
    if (!name) continue

    const id = `${country}_${toWikipediaStyleId(name)}`

    // Parse function codes to description
    const functions = record.Function || ''
    const funcDesc = functions
      .split('')
      .filter(c => c !== '-')
      .map(c => functionDescriptions[c] || '')
      .filter(Boolean)
      .join(', ')

    locations.push({
      ns: NS,
      type: 'Location',
      id,
      name,
      description: funcDesc,
      code,
    })

    // Relationship to country
    locationCountries.push({
      fromNs: NS,
      fromType: 'Location',
      fromId: id,
      toNs: NAMESPACES.ISO,
      toType: 'Country',
      toId: country,
      relationshipType: 'located_in',
    })
  }

  writeStandardTSV(join(DATA_DIR, 'UN.Locations.tsv'), locations)
  writeRelationshipTSV(join(REL_DIR, 'Location.Country.tsv'), locationCountries)
}

function transformM49Regions(): void {
  console.log('Transforming UN M49 Regions...')

  const sourceFile = join(SOURCE_DIR, 'UN.M49.Regions.csv')
  const records = parseCSV<M49Record>(sourceFile)

  // Extract unique regions and sub-regions
  const regionsMap = new Map<string, StandardRecord>()
  const subRegionsMap = new Map<string, StandardRecord>()
  const intermediateRegionsMap = new Map<string, StandardRecord>()
  const regionHierarchy: RelationshipRecord[] = []

  for (const record of records) {
    // Extract regions
    if (record.region && record['region-code'] && !regionsMap.has(record['region-code'])) {
      regionsMap.set(record['region-code'], {
        ns: NS,
        type: 'Region',
        id: toWikipediaStyleId(record.region),
        name: record.region,
        description: 'UN M49 Region',
        code: record['region-code'],
      })
    }

    // Extract sub-regions
    if (record['sub-region'] && record['sub-region-code'] && !subRegionsMap.has(record['sub-region-code'])) {
      const id = toWikipediaStyleId(record['sub-region'])
      subRegionsMap.set(record['sub-region-code'], {
        ns: NS,
        type: 'SubRegion',
        id,
        name: record['sub-region'],
        description: 'UN M49 Sub-Region',
        code: record['sub-region-code'],
      })

      // Link to parent region
      if (record.region) {
        regionHierarchy.push({
          fromNs: NS,
          fromType: 'SubRegion',
          fromId: id,
          toNs: NS,
          toType: 'Region',
          toId: toWikipediaStyleId(record.region),
          relationshipType: 'child_of',
        })
      }
    }

    // Extract intermediate regions
    if (record['intermediate-region'] && record['intermediate-region-code'] && !intermediateRegionsMap.has(record['intermediate-region-code'])) {
      const id = toWikipediaStyleId(record['intermediate-region'])
      intermediateRegionsMap.set(record['intermediate-region-code'], {
        ns: NS,
        type: 'IntermediateRegion',
        id,
        name: record['intermediate-region'],
        description: 'UN M49 Intermediate Region',
        code: record['intermediate-region-code'],
      })

      // Link to parent sub-region
      if (record['sub-region']) {
        regionHierarchy.push({
          fromNs: NS,
          fromType: 'IntermediateRegion',
          fromId: id,
          toNs: NS,
          toType: 'SubRegion',
          toId: toWikipediaStyleId(record['sub-region']),
          relationshipType: 'child_of',
        })
      }
    }
  }

  const regions = Array.from(regionsMap.values())
  const subRegions = Array.from(subRegionsMap.values())
  const intermediateRegions = Array.from(intermediateRegionsMap.values())

  writeStandardTSV(join(DATA_DIR, 'UN.Regions.tsv'), regions)
  writeStandardTSV(join(DATA_DIR, 'UN.SubRegions.tsv'), subRegions)
  writeStandardTSV(join(DATA_DIR, 'UN.IntermediateRegions.tsv'), intermediateRegions)
  writeRelationshipTSV(join(REL_DIR, 'Region.Hierarchy.tsv'), regionHierarchy)
}

function transformEDIFACT(): void {
  console.log('Transforming UN/EDIFACT Message Types...')

  const sourceFile = join(SOURCE_DIR, 'edifact-message-types.json')
  const content = readFileSync(sourceFile, 'utf-8')
  const data: EDIFACTData = JSON.parse(content)

  const messages: StandardRecord[] = []

  for (const msg of data.message_types) {
    if (!msg.code) continue

    messages.push({
      ns: NS,
      type: 'EDIFACTMessage',
      id: msg.code,
      name: msg.code,
      description: cleanDescription(msg.description),
      code: msg.code,
    })
  }

  writeStandardTSV(join(DATA_DIR, 'UN.EDIFACTMessages.tsv'), messages)
}

function transformEDIFACTCategories(): void {
  console.log('Transforming UN/EDIFACT Categories...')

  const sourceFile = join(SOURCE_DIR, 'edifact-categories.json')

  try {
    const content = readFileSync(sourceFile, 'utf-8')
    const data = JSON.parse(content)

    const categories: StandardRecord[] = []
    const messageCategories: RelationshipRecord[] = []

    if (data.categories && Array.isArray(data.categories)) {
      for (const cat of data.categories) {
        if (!cat.code) continue

        const id = toWikipediaStyleId(cat.name || cat.code)
        categories.push({
          ns: NS,
          type: 'EDIFACTCategory',
          id,
          name: cat.name || cat.code,
          description: cleanDescription(cat.description || ''),
          code: cat.code,
        })

        // Link messages to categories
        if (cat.messages && Array.isArray(cat.messages)) {
          for (const msgCode of cat.messages) {
            messageCategories.push({
              fromNs: NS,
              fromType: 'EDIFACTMessage',
              fromId: msgCode,
              toNs: NS,
              toType: 'EDIFACTCategory',
              toId: id,
              relationshipType: 'belongs_to',
            })
          }
        }
      }
    }

    if (categories.length > 0) {
      writeStandardTSV(join(DATA_DIR, 'UN.EDIFACTCategories.tsv'), categories)
      writeRelationshipTSV(join(REL_DIR, 'EDIFACTMessage.Category.tsv'), messageCategories)
    }
  } catch (e) {
    console.log('Skipping EDIFACT categories - file not found or invalid')
  }
}

export async function transformUN(): Promise<void> {
  console.log('=== UN Standards Transformation ===\n')
  ensureOutputDirs()

  transformM49Regions()
  transformLOCODE()
  transformEDIFACT()
  transformEDIFACTCategories()

  console.log('\n=== UN Transformation Complete ===')
}

// Run if called directly
if (import.meta.main) {
  transformUN().catch(console.error)
}
