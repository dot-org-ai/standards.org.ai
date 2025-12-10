/**
 * IANA Standards Transformation Script
 * Transforms IANA timezone data into standard TSV format
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import {
  NAMESPACES,
  StandardRecord,
  RelationshipRecord,
  writeStandardTSV,
  writeRelationshipTSV,
  toWikipediaStyleId,
  cleanDescription,
  getSourcePath,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
  getAggregationsForType,
} from './utils'

const NS = NAMESPACES.IANA
const SOURCE_DIR = getSourcePath('IANA')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

interface TimezoneRecord {
  value: string
  abbr: string
  offset: number
  isdst: boolean
  text: string
  utc: string[]
}

interface TZDBZone {
  name: string
  countries: string[]
  offsets?: number[]
}

interface TZDBData {
  version: string
  zones: TZDBZone[]
}

function transformTimezones(): void {
  console.log('Transforming IANA Timezones...')

  const sourceFile = join(SOURCE_DIR, 'timezones.json')
  const content = readFileSync(sourceFile, 'utf-8')
  const timezones: TimezoneRecord[] = JSON.parse(content)

  const tzRecords: StandardRecord[] = []
  const tzZones: StandardRecord[] = []
  const zoneToTimezone: RelationshipRecord[] = []

  // Track unique IANA zone names
  const zoneSet = new Set<string>()

  for (const tz of timezones) {
    if (!tz.value) continue

    const id = toWikipediaStyleId(tz.value)
    const offsetStr = tz.offset >= 0 ? `+${tz.offset}` : `${tz.offset}`

    tzRecords.push({
      ns: NS,
      type: 'Timezone',
      id,
      name: tz.value,
      description: cleanDescription(tz.text),
      code: tz.abbr,
      includedIn: getAggregationsForType('Timezone'),
    })

    // Add individual IANA zone identifiers
    if (tz.utc && Array.isArray(tz.utc)) {
      for (const zone of tz.utc) {
        if (!zone || zoneSet.has(zone)) continue
        zoneSet.add(zone)

        const zoneId = zone.replace(/\//g, '_')

        tzZones.push({
          ns: NS,
          type: 'Zone',
          id: zoneId,
          name: zone,
          description: `UTC${offsetStr}`,
          code: zone,
          includedIn: getAggregationsForType('Timezone'),
        })

        zoneToTimezone.push({
          fromNs: NS,
          fromType: 'Zone',
          fromId: zoneId,
          toNs: NS,
          toType: 'Timezone',
          toId: id,
          relationshipType: 'belongsTo',
        })
      }
    }
  }

  writeStandardTSV(join(DATA_DIR, 'IANA.Timezones.tsv'), tzRecords)
  writeStandardTSV(join(DATA_DIR, 'IANA.Zones.tsv'), tzZones)
  writeRelationshipTSV(join(REL_DIR, 'Zone.Timezone.tsv'), zoneToTimezone)
}

function transformTZDB(): void {
  console.log('Transforming IANA TZDB...')

  const sourceFile = join(SOURCE_DIR, 'tzdb-full.json')

  try {
    const content = readFileSync(sourceFile, 'utf-8')
    const data: TZDBData = JSON.parse(content)

    const zoneCountries: RelationshipRecord[] = []

    if (data.zones && Array.isArray(data.zones)) {
      for (const zone of data.zones) {
        if (!zone.name || !zone.countries) continue

        const zoneId = zone.name.replace(/\//g, '_')

        for (const countryCode of zone.countries) {
          if (!countryCode) continue

          zoneCountries.push({
            fromNs: NS,
            fromType: 'Zone',
            fromId: zoneId,
            toNs: NAMESPACES.ISO,
            toType: 'Country',
            toId: countryCode,
            relationshipType: 'usedIn',
          })
        }
      }
    }

    if (zoneCountries.length > 0) {
      writeRelationshipTSV(join(REL_DIR, 'Zone.Country.tsv'), zoneCountries)
    }
  } catch (e) {
    console.log('Skipping TZDB - file not found or invalid')
  }
}

export async function transformIANA(): Promise<void> {
  console.log('=== IANA Standards Transformation ===\n')
  ensureOutputDirs()

  transformTimezones()
  transformTZDB()

  console.log('\n=== IANA Transformation Complete ===')
}

// Run if called directly
if (import.meta.main) {
  transformIANA().catch(console.error)
}
