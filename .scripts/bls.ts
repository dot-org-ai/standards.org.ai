import { join } from 'path'
import { existsSync } from 'fs'
import {
  NAMESPACES,
  parseTSV,
  writeStandardTSV,
  writeTSV,
  writeRelationshipTSV,
  toWikipediaStyleId,
  cleanDescription,
  getSourcePath,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
  type StandardRecord,
  type RelationshipRecord,
} from './utils'

const NS = NAMESPACES.BLS
const SOURCE_DIR = getSourcePath('BLS')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

interface EmploymentRow {
  socCode: string
  occupationTitle: string
  totalEmployment: string
  employmentRSE: string
  source: string
}

interface IndustryRow {
  industry_code: string
  industry_name: string
  display_level: string
  selectable: string
  sort_sequence: string
}

interface OccupationRow {
  occupation_code: string
  occupation_name: string
  occupation_description: string
  display_level: string
  selectable: string
  sort_sequence: string
}

function getSOCLevel(code: string): string {
  if (!code) return 'Occupation'

  // SOC code format: XX-XXXX or XX-XXXX.XX
  const baseCode = code.split('.')[0]

  if (baseCode.endsWith('-0000')) return 'MajorGroup'
  if (baseCode.endsWith('000')) return 'MinorGroup'
  if (baseCode.endsWith('00')) return 'BroadGroup'
  return 'DetailedOccupation'
}

function getParentSOCCode(code: string): string | null {
  if (!code) return null

  const baseCode = code.split('.')[0]

  // Major group (XX-0000) has no parent
  if (baseCode.endsWith('-0000')) return null

  // Minor group (XX-X000) -> Major group (XX-0000)
  if (baseCode.endsWith('000')) {
    return baseCode.slice(0, 3) + '0000'
  }

  // Broad group (XX-XX00) -> Minor group (XX-X000)
  if (baseCode.endsWith('00')) {
    return baseCode.slice(0, 4) + '000'
  }

  // Detailed (XX-XXXX) -> Broad group (XX-XX00)
  return baseCode.slice(0, 5) + '00'
}

function transformEmployment(): void {
  console.log('Transforming BLS Employment data...')
  const data = parseTSV<EmploymentRow>(join(SOURCE_DIR, 'Occupations.Employment.tsv'))

  // Create a map for hierarchy lookups
  const codeMap = new Map<string, EmploymentRow>()
  for (const row of data) {
    if (row.socCode) {
      codeMap.set(row.socCode, row)
    }
  }

  const records: StandardRecord[] = data
    .filter(row => row.socCode && row.occupationTitle)
    .map(row => ({
      ns: NS,
      type: getSOCLevel(row.socCode),
      id: toWikipediaStyleId(row.occupationTitle),
      name: row.occupationTitle,
      description: `Total Employment: ${row.totalEmployment?.trim() || 'N/A'}`,
      code: row.socCode,
    }))

  writeStandardTSV(join(DATA_DIR, 'BLS.Occupations.tsv'), records)

  // Write hierarchy relationships
  const relationships: Record<string, string>[] = []
  for (const row of data) {
    const code = row.socCode
    if (!code) continue

    const parentCode = getParentSOCCode(code)
    if (parentCode && codeMap.has(parentCode)) {
      relationships.push({
        fromNs: NS,
        fromType: getSOCLevel(code),
        fromCode: code,
        toNs: NS,
        toType: getSOCLevel(parentCode),
        toCode: parentCode,
        relationshipType: 'child_of',
      })
    }
  }

  writeTSV(
    join(REL_DIR, 'BLS.Occupation.Occupation.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )

  // Write BLS to ONET occupation linkages
  const onetRelationships: Record<string, string>[] = data
    .filter(row => row.socCode)
    .map(row => {
      // Convert BLS SOC code to ONET format (add .00 suffix if needed)
      const baseCode = row.socCode.split('.')[0]
      const onetCode = row.socCode.includes('.') ? row.socCode : `${baseCode}.00`

      return {
        fromNs: NS,
        fromType: getSOCLevel(row.socCode),
        fromCode: row.socCode,
        toNs: NAMESPACES.ONET,
        toType: 'Occupation',
        toCode: onetCode,
        relationshipType: 'same_as',
      }
    })

  writeTSV(
    join(REL_DIR, 'BLS.ONET.Occupation.tsv'),
    onetRelationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

function transformEmploymentStats(): void {
  console.log('Transforming BLS Employment Statistics...')
  const data = parseTSV<EmploymentRow>(join(SOURCE_DIR, 'Occupations.Employment.tsv'))

  // Write employment statistics as extended data
  const statsRecords: Record<string, string>[] = data
    .filter(row => row.socCode && row.totalEmployment)
    .map(row => ({
      ns: NS,
      type: getSOCLevel(row.socCode),
      code: row.socCode,
      name: row.occupationTitle,
      totalEmployment: row.totalEmployment?.trim() || '',
      employmentRse: row.employmentRSE?.trim() || '',
      source: row.source || '',
    }))

  writeTSV(
    join(DATA_DIR, 'BLS.EmploymentStats.tsv'),
    statsRecords,
    ['ns', 'type', 'code', 'name', 'totalEmployment', 'employmentRse', 'source']
  )
}

function getIndustryLevel(code: string): string {
  if (!code) return 'Industry'

  // Industry codes vary in length and structure
  if (code.includes('--')) return 'Sector'
  if (code === '000000' || code === '000001') return 'CrossIndustry'
  if (code.endsWith('0000')) return 'Industry'
  if (code.endsWith('000')) return 'IndustryGroup'
  return 'Industry'
}

function transformIndustries(): void {
  console.log('Transforming BLS Industries...')

  const sourceFile = join(SOURCE_DIR, 'oe.industry')
  if (!existsSync(sourceFile)) {
    console.log('Skipping industries - file not found')
    return
  }

  const data = parseTSV<IndustryRow>(sourceFile)

  const industries: StandardRecord[] = data
    .filter(row => row.industry_code && row.industry_name)
    .map(row => ({
      ns: NS,
      type: getIndustryLevel(row.industry_code),
      id: toWikipediaStyleId(row.industry_name),
      name: row.industry_name,
      description: '',
      code: row.industry_code,
    }))

  writeStandardTSV(join(DATA_DIR, 'BLS.Industries.tsv'), industries)

  // Create industry-NAICS relationships for sector codes
  const naicsRelationships: RelationshipRecord[] = data
    .filter(row => row.industry_code && row.industry_code.includes('--'))
    .map(row => {
      // Extract NAICS sector code from BLS format (e.g., "11--12" -> "11", "31-33" -> "31-33")
      const naicsCode = row.industry_code.replace('--', '-')
      return {
        fromNs: NS,
        fromType: 'Sector',
        fromId: toWikipediaStyleId(row.industry_name),
        toNs: NAMESPACES.NAICS,
        toType: 'Sector',
        toId: naicsCode,
        relationshipType: 'same_as',
      }
    })

  if (naicsRelationships.length > 0) {
    writeRelationshipTSV(join(REL_DIR, 'BLS.NAICS.Industry.tsv'), naicsRelationships)
  }
}

function transformOESOccupations(): void {
  console.log('Transforming BLS OES Occupations...')

  const sourceFile = join(SOURCE_DIR, 'oe.occupation')
  if (!existsSync(sourceFile)) {
    console.log('Skipping OES occupations - file not found')
    return
  }

  const data = parseTSV<OccupationRow>(sourceFile)

  const occupations: StandardRecord[] = data
    .filter(row => row.occupation_code && row.occupation_name)
    .map(row => ({
      ns: NS,
      type: getSOCLevel(row.occupation_code),
      id: toWikipediaStyleId(row.occupation_name),
      name: row.occupation_name,
      description: cleanDescription(row.occupation_description || ''),
      code: row.occupation_code,
    }))

  writeStandardTSV(join(DATA_DIR, 'BLS.OESOccupations.tsv'), occupations)
}

export async function transformBLS(): Promise<void> {
  console.log('=== BLS Transformation ===')
  ensureOutputDirs()

  transformEmployment()
  transformEmploymentStats()
  transformIndustries()
  transformOESOccupations()

  console.log('=== BLS Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformBLS()
}
