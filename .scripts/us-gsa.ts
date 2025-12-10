import { join } from 'path'
import { existsSync } from 'fs'
import {
  NAMESPACES,
  parseTSV,
  parseCSV,
  writeStandardTSV,
  writeTSV,
  writeRelationshipTSV,
  toWikipediaStyleId,
  cleanDescription,
  getSourcePath,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
  getAggregationsForType,
  type StandardRecord,
  type RelationshipRecord,
} from './utils'

// Add GSA namespace
const NS = NAMESPACES.GSA
const SOURCE_DIR = getSourcePath('GSA')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

/**
 * Product Service Code (PSC) interfaces
 * Source: https://www.acquisition.gov/psc-manual
 */
interface PSCRow {
  code: string
  name: string
  description: string
  category: string
  isService: string
  isProduct: string
}

/**
 * Federal Supply Classification (FSC) interfaces
 * Source: https://www.gsa.gov/reference/fsc-codes
 */
interface FSCRow {
  code: string
  name: string
  group: string
  class: string
}

interface FSCGroupRow {
  code: string
  name: string
}

/**
 * GSA Schedule interfaces
 * Source: https://www.gsa.gov/buy-through-us/purchasing-programs/gsa-multiple-award-schedule
 */
interface ScheduleRow {
  code: string
  name: string
  description: string
  category: string
}

interface SINRow {
  code: string
  name: string
  description: string
  schedule: string
  category: string
}

/**
 * Government-Wide Acquisition Contract (GWAC) interfaces
 */
interface GWACRow {
  code: string
  name: string
  agency: string
  scope: string
  ceiling: string
  orderingProcedures: string
}

/**
 * Blanket Purchase Agreement (BPA) interfaces
 */
interface BPARow {
  code: string
  name: string
  vendor: string
  schedule: string
  scope: string
}

/**
 * SAM.gov Entity interfaces
 */
interface EntityStatusRow {
  code: string
  name: string
  description: string
}

/**
 * Transform Product Service Codes (PSC)
 * PSC codes are 4-character alphanumeric codes
 * First character indicates category (letter for services, number for products)
 */
function transformPSC(): void {
  console.log('Transforming GSA Product Service Codes...')

  const sourceFile = join(SOURCE_DIR, 'PSC.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Skipping PSC - file not found')
    return
  }

  const data = parseTSV<PSCRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'PSC',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: cleanDescription(row.description || ''),
      code: row.code,
      includedIn: getAggregationsForType('PSC'),
    }))

  writeStandardTSV(join(DATA_DIR, 'GSA.PSC.tsv'), records)

  // Write PSC metadata with additional fields
  const pscMetadata: Record<string, string>[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'PSC',
      code: row.code,
      name: row.name,
      description: cleanDescription(row.description || ''),
      category: row.category || '',
      isService: row.isService || '',
      isProduct: row.isProduct || '',
    }))

  writeTSV(
    join(DATA_DIR, 'GSA.PSC.Metadata.tsv'),
    pscMetadata,
    ['ns', 'type', 'code', 'name', 'description', 'category', 'isService', 'isProduct']
  )

  // Write PSC to PSC Category relationships
  const categoryRelationships: Record<string, string>[] = data
    .filter(row => row.code && row.category)
    .map(row => ({
      fromNs: NS,
      fromType: 'PSC',
      fromCode: row.code,
      toNs: NS,
      toType: 'PSCCategory',
      toCode: row.category,
      relationshipType: 'belongsToCategory',
    }))

  if (categoryRelationships.length > 0) {
    writeTSV(
      join(REL_DIR, 'GSA.PSC.PSCCategory.tsv'),
      categoryRelationships,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
    )
  }
}

/**
 * Transform PSC Categories
 * Categories are the first 2 characters of PSC codes
 */
function transformPSCCategories(): void {
  console.log('Transforming GSA PSC Categories...')

  const sourceFile = join(SOURCE_DIR, 'PSC.Categories.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Skipping PSC Categories - file not found')
    return
  }

  const data = parseTSV<{
    code: string
    name: string
    type: string
  }>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'PSCCategory',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: row.type || '',
      code: row.code,
      includedIn: getAggregationsForType('PSCCategory'),
    }))

  writeStandardTSV(join(DATA_DIR, 'GSA.PSCCategory.tsv'), records)
}

interface FSCSourceRow {
  code: string
  name: string
  description: string
  parent: string
}

/**
 * Transform Federal Supply Classification (FSC) codes
 * FSC codes are 4-digit numeric codes
 */
function transformFSC(): void {
  console.log('Transforming GSA Federal Supply Classification from source file...')

  const sourceFile = join(SOURCE_DIR, 'fsc_codes.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Warning: fsc_codes.tsv not found, skipping FSC')
    return
  }

  const data = parseTSV<FSCSourceRow>(sourceFile)
  console.log(`Loaded ${data.length} FSC codes from source`)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'FSC',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: cleanDescription(row.description || row.name),
      code: row.code,
      includedIn: getAggregationsForType('FSC'),
    }))

  writeStandardTSV(join(DATA_DIR, 'GSA.FSCCodes.tsv'), records)
  console.log(`Wrote ${records.length} FSC codes to GSA.FSCCodes.tsv`)

  // Write FSC to FSC Group relationships (parent field)
  const groupRelationships: Record<string, string>[] = data
    .filter(row => row.code && row.parent)
    .map(row => ({
      fromNs: NS,
      fromType: 'FSC',
      fromCode: row.code,
      toNs: NS,
      toType: 'FSCGroup',
      toCode: row.parent,
      relationshipType: 'belongsToGroup',
    }))

  if (groupRelationships.length > 0) {
    writeTSV(
      join(REL_DIR, 'GSA.FSC.FSCGroup.tsv'),
      groupRelationships,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
    )
    console.log(`Wrote ${groupRelationships.length} FSC -> FSC Group relationships`)
  }
}

/**
 * Transform FSC Groups
 * FSC Groups are 2-digit codes (first 2 digits of FSC)
 */
function transformFSCGroups(): void {
  console.log('Transforming GSA FSC Groups...')

  const sourceFile = join(SOURCE_DIR, 'FSC.Groups.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Skipping FSC Groups - file not found')
    return
  }

  const data = parseTSV<FSCGroupRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'FSCGroup',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: '',
      code: row.code,
      includedIn: getAggregationsForType('FSCGroup'),
    }))

  writeStandardTSV(join(DATA_DIR, 'GSA.FSCGroup.tsv'), records)
}

/**
 * Transform GSA Schedules (Multiple Award Schedule - MAS)
 * Formerly numbered schedules, now consolidated into MAS
 */
function transformSchedules(): void {
  console.log('Transforming GSA Schedules...')

  const sourceFile = join(SOURCE_DIR, 'Schedules.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Skipping Schedules - file not found')
    return
  }

  const data = parseTSV<ScheduleRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'Schedule',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: cleanDescription(row.description || ''),
      code: row.code,
      includedIn: getAggregationsForType('Schedule'),
    }))

  writeStandardTSV(join(DATA_DIR, 'GSA.Schedule.tsv'), records)
}

/**
 * Transform Special Item Numbers (SINs)
 * SINs define specific products/services under GSA Schedules
 */
function transformSINs(): void {
  console.log('Transforming GSA Special Item Numbers...')

  const sourceFile = join(SOURCE_DIR, 'SINs.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Skipping SINs - file not found')
    return
  }

  const data = parseTSV<SINRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'SIN',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: cleanDescription(row.description || ''),
      code: row.code,
      includedIn: getAggregationsForType('SIN'),
    }))

  writeStandardTSV(join(DATA_DIR, 'GSA.SIN.tsv'), records)

  // Write SIN to Schedule relationships
  const scheduleRelationships: Record<string, string>[] = data
    .filter(row => row.code && row.schedule)
    .map(row => ({
      fromNs: NS,
      fromType: 'SIN',
      fromCode: row.code,
      toNs: NS,
      toType: 'Schedule',
      toCode: row.schedule,
      relationshipType: 'belongsToSchedule',
    }))

  if (scheduleRelationships.length > 0) {
    writeTSV(
      join(REL_DIR, 'GSA.SIN.Schedule.tsv'),
      scheduleRelationships,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
    )
  }
}

/**
 * Transform Government-Wide Acquisition Contracts (GWACs)
 * GWACs are pre-competed, multiple award contracts
 */
function transformGWACs(): void {
  console.log('Transforming GSA Government-Wide Acquisition Contracts...')

  const sourceFile = join(SOURCE_DIR, 'GWACs.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Skipping GWACs - file not found')
    return
  }

  const data = parseTSV<GWACRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'GWAC',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: cleanDescription(row.scope || ''),
      code: row.code,
      includedIn: getAggregationsForType('GWAC'),
    }))

  writeStandardTSV(join(DATA_DIR, 'GSA.GWAC.tsv'), records)

  // Write GWAC metadata with additional fields
  const gwacMetadata: Record<string, string>[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'GWAC',
      code: row.code,
      name: row.name,
      agency: row.agency || '',
      scope: cleanDescription(row.scope || ''),
      ceiling: row.ceiling || '',
      ordering: cleanDescription(row.orderingProcedures || ''),
    }))

  writeTSV(
    join(DATA_DIR, 'GSA.GWAC.Metadata.tsv'),
    gwacMetadata,
    ['ns', 'type', 'code', 'name', 'agency', 'scope', 'ceiling', 'ordering']
  )
}

/**
 * Transform Blanket Purchase Agreements (BPAs)
 * BPAs are agreements established under GSA Schedules
 */
function transformBPAs(): void {
  console.log('Transforming GSA Blanket Purchase Agreements...')

  const sourceFile = join(SOURCE_DIR, 'BPAs.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Skipping BPAs - file not found')
    return
  }

  const data = parseTSV<BPARow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'BPA',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: cleanDescription(row.scope || ''),
      code: row.code,
      includedIn: getAggregationsForType('BPA'),
    }))

  writeStandardTSV(join(DATA_DIR, 'GSA.BPA.tsv'), records)

  // Write BPA to Schedule relationships
  const scheduleRelationships: Record<string, string>[] = data
    .filter(row => row.code && row.schedule)
    .map(row => ({
      fromNs: NS,
      fromType: 'BPA',
      fromCode: row.code,
      toNs: NS,
      toType: 'Schedule',
      toCode: row.schedule,
      relationshipType: 'basedOnSchedule',
    }))

  if (scheduleRelationships.length > 0) {
    writeTSV(
      join(REL_DIR, 'GSA.BPA.Schedule.tsv'),
      scheduleRelationships,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
    )
  }
}

/**
 * Transform SAM.gov Entity Statuses
 * Entity registration statuses in System for Award Management
 */
function transformEntityStatuses(): void {
  console.log('Transforming SAM.gov Entity Statuses...')

  const sourceFile = join(SOURCE_DIR, 'EntityStatus.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Skipping Entity Statuses - file not found')
    return
  }

  const data = parseTSV<EntityStatusRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'EntityStatus',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: cleanDescription(row.description || ''),
      code: row.code,
      includedIn: getAggregationsForType('EntityStatus'),
    }))

  writeStandardTSV(join(DATA_DIR, 'GSA.EntityStatus.tsv'), records)
}

/**
 * Transform UEI (Unique Entity Identifier) information
 * UEI replaced DUNS numbers in SAM.gov
 */
function transformUEI(): void {
  console.log('Transforming UEI information...')

  // Create a single record describing UEI format and validation
  const records: StandardRecord[] = [
    {
      ns: NS,
      type: 'UEI',
      id: 'Unique_Entity_Identifier',
      name: 'Unique Entity Identifier',
      description: 'A 12-character alphanumeric identifier assigned to entities registered in SAM.gov. Replaced DUNS numbers in April 2022.',
      code: 'UEI',
      includedIn: getAggregationsForType('UEI'),
    },
  ]

  writeStandardTSV(join(DATA_DIR, 'GSA.UEI.tsv'), records)

  // Write UEI format specification
  const ueiSpec: Record<string, string>[] = [
    {
      ns: NS,
      type: 'UEI',
      code: 'UEI',
      format: '12-character alphanumeric (excluding O and I to avoid confusion)',
      checkDigit: 'No check digit algorithm',
      validation: 'Must be registered in SAM.gov',
      example: 'J5MBE2NKPQR4',
    },
  ]

  writeTSV(
    join(DATA_DIR, 'GSA.UEI.Specification.tsv'),
    ueiSpec,
    ['ns', 'type', 'code', 'format', 'checkDigit', 'validation', 'example']
  )
}

/**
 * Main transformation function
 * Exports all GSA procurement standards
 */
export async function transformGSA(): Promise<void> {
  console.log('=== GSA Transformation ===')
  ensureOutputDirs()

  // Product Service Codes
  transformPSC()
  transformPSCCategories()

  // Federal Supply Classification
  transformFSC()
  transformFSCGroups()

  // Contract Vehicles
  transformSchedules()
  transformSINs()
  transformGWACs()
  transformBPAs()

  // SAM.gov Entity Data
  transformEntityStatuses()
  transformUEI()

  console.log('=== GSA Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformGSA()
}
