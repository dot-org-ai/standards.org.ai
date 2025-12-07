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
  type StandardRecord,
  type RelationshipRecord,
} from './utils'

const NS = 'us.org.ai'
const SOURCE_DIR = getSourcePath('SBA')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

interface SizeStandardRow {
  NAICSCode: string
  NAICSTitle: string
  SizeStandard: string
  SizeType: string
  Footnotes?: string
}

interface FootnoteRow {
  FootnoteCode: string
  FootnoteText: string
  ApplicableIndustries?: string
}

interface ExceptionRow {
  ExceptionCode: string
  Description: string
  ApplicableIndustries?: string
}

interface BusinessTypeRow {
  BusinessTypeCode: string
  BusinessTypeName: string
  Description: string
  EligibilityCriteria: string
  CertificationRequired: string
}

interface ContractTypeRow {
  ContractTypeCode: string
  ContractTypeName: string
  Description: string
  Threshold: string
  ApplicableBusinessTypes: string
}

/**
 * Parse size standard value to determine if it's revenue-based or employee-based
 */
function parseSizeType(sizeStandard: string): string {
  if (!sizeStandard) return 'Unknown'

  const standard = sizeStandard.toLowerCase().trim()

  // Check for revenue indicators
  if (standard.includes('million') || standard.includes('$') || standard.includes('revenue')) {
    return 'Revenue'
  }

  // Check for employee indicators
  if (standard.includes('employee') || standard.match(/^\d+$/)) {
    return 'Employees'
  }

  return 'Other'
}

/**
 * Clean and standardize size standard text
 */
function cleanSizeStandard(sizeStandard: string): string {
  if (!sizeStandard) return ''

  return sizeStandard
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\$\s+/g, '$')
}

/**
 * Transform SBA Size Standards by NAICS code
 */
function transformSizeStandards(): void {
  console.log('Transforming SBA Size Standards...')

  const sourceFile = join(SOURCE_DIR, 'SizeStandards.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Skipping size standards - file not found')
    console.log(`Expected file: ${sourceFile}`)
    return
  }

  const data = parseTSV<SizeStandardRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.NAICSCode && row.NAICSTitle)
    .map(row => ({
      ns: NS,
      type: 'SizeStandard',
      id: toWikipediaStyleId(row.NAICSTitle),
      name: row.NAICSTitle,
      description: `Size Standard: ${cleanSizeStandard(row.SizeStandard)}`,
      code: row.NAICSCode,
    }))

  writeStandardTSV(join(DATA_DIR, 'SBA.SizeStandards.tsv'), records)

  // Write extended size standard data
  const extendedData: Record<string, string>[] = data
    .filter(row => row.NAICSCode)
    .map(row => ({
      ns: NS,
      type: 'SizeStandard',
      naicsCode: row.NAICSCode,
      naicsTitle: row.NAICSTitle || '',
      sizeStandard: cleanSizeStandard(row.SizeStandard),
      sizeType: parseSizeType(row.SizeStandard),
      footnotes: row.Footnotes || '',
    }))

  writeTSV(
    join(DATA_DIR, 'SBA.SizeStandardsExtended.tsv'),
    extendedData,
    ['ns', 'type', 'naicsCode', 'naicsTitle', 'sizeStandard', 'sizeType', 'footnotes']
  )

  // Create relationships to NAICS codes
  const naicsRelationships: RelationshipRecord[] = data
    .filter(row => row.NAICSCode)
    .map(row => ({
      fromNs: NS,
      fromType: 'SizeStandard',
      fromId: toWikipediaStyleId(row.NAICSTitle),
      toNs: NAMESPACES.NAICS,
      toType: 'Industry',
      toId: row.NAICSCode,
      relationshipType: 'applies_to_naics',
    }))

  if (naicsRelationships.length > 0) {
    writeRelationshipTSV(join(REL_DIR, 'SBA.SizeStandard.NAICS.tsv'), naicsRelationships)
  }
}

/**
 * Transform industry footnotes that modify size standards
 */
function transformFootnotes(): void {
  console.log('Transforming SBA Industry Footnotes...')

  const sourceFile = join(SOURCE_DIR, 'IndustryFootnotes.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Skipping footnotes - file not found')
    return
  }

  const data = parseTSV<FootnoteRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.FootnoteCode && row.FootnoteText)
    .map(row => ({
      ns: NS,
      type: 'IndustryFootnote',
      id: row.FootnoteCode,
      name: `Footnote ${row.FootnoteCode}`,
      description: cleanDescription(row.FootnoteText),
      code: row.FootnoteCode,
    }))

  writeStandardTSV(join(DATA_DIR, 'SBA.IndustryFootnotes.tsv'), records)

  // Write extended footnote data
  const extendedData: Record<string, string>[] = data
    .filter(row => row.FootnoteCode)
    .map(row => ({
      ns: NS,
      type: 'IndustryFootnote',
      code: row.FootnoteCode,
      text: cleanDescription(row.FootnoteText),
      applicableIndustries: row.ApplicableIndustries || '',
    }))

  writeTSV(
    join(DATA_DIR, 'SBA.IndustryFootnotesExtended.tsv'),
    extendedData,
    ['ns', 'type', 'code', 'text', 'applicableIndustries']
  )
}

/**
 * Transform exception codes for size standards
 */
function transformExceptions(): void {
  console.log('Transforming SBA Exception Codes...')

  const sourceFile = join(SOURCE_DIR, 'ExceptionCodes.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Skipping exception codes - file not found')
    return
  }

  const data = parseTSV<ExceptionRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.ExceptionCode && row.Description)
    .map(row => ({
      ns: NS,
      type: 'ExceptionCode',
      id: row.ExceptionCode,
      name: `Exception ${row.ExceptionCode}`,
      description: cleanDescription(row.Description),
      code: row.ExceptionCode,
    }))

  writeStandardTSV(join(DATA_DIR, 'SBA.ExceptionCodes.tsv'), records)

  // Write extended exception data
  const extendedData: Record<string, string>[] = data
    .filter(row => row.ExceptionCode)
    .map(row => ({
      ns: NS,
      type: 'ExceptionCode',
      code: row.ExceptionCode,
      description: cleanDescription(row.Description),
      applicableIndustries: row.ApplicableIndustries || '',
    }))

  writeTSV(
    join(DATA_DIR, 'SBA.ExceptionCodesExtended.tsv'),
    extendedData,
    ['ns', 'type', 'code', 'description', 'applicableIndustries']
  )
}

/**
 * Transform business types (Small, Small Disadvantaged, WOSB, HUBZone, SDVOSB, 8(a))
 */
function transformBusinessTypes(): void {
  console.log('Transforming SBA Business Types...')

  // Define standard SBA business types if no source file exists
  const standardBusinessTypes: BusinessTypeRow[] = [
    {
      BusinessTypeCode: 'SB',
      BusinessTypeName: 'Small Business',
      Description: 'A business that meets SBA size standards for its industry',
      EligibilityCriteria: 'Must meet size standards based on NAICS code (employees or revenue)',
      CertificationRequired: 'Self-certification',
    },
    {
      BusinessTypeCode: 'SDB',
      BusinessTypeName: 'Small Disadvantaged Business',
      Description: 'A small business that is at least 51% owned by socially and economically disadvantaged individuals',
      EligibilityCriteria: 'Must be small, 51%+ owned/controlled by disadvantaged individuals, meet net worth requirements',
      CertificationRequired: 'SBA certification required',
    },
    {
      BusinessTypeCode: 'WOSB',
      BusinessTypeName: 'Women-Owned Small Business',
      Description: 'A small business that is at least 51% owned and controlled by women',
      EligibilityCriteria: 'Must be small, 51%+ owned/controlled by one or more women who are U.S. citizens',
      CertificationRequired: 'Self-certification or third-party certification',
    },
    {
      BusinessTypeCode: 'EDWOSB',
      BusinessTypeName: 'Economically Disadvantaged Women-Owned Small Business',
      Description: 'A WOSB that is also economically disadvantaged',
      EligibilityCriteria: 'Must meet WOSB criteria plus economic disadvantage requirements',
      CertificationRequired: 'Self-certification or third-party certification',
    },
    {
      BusinessTypeCode: 'HUBZONE',
      BusinessTypeName: 'Historically Underutilized Business Zone',
      Description: 'A small business located in a HUBZone with at least 35% of employees residing in a HUBZone',
      EligibilityCriteria: 'Must be small, principal office in HUBZone, 35%+ employees in HUBZone, 51%+ owned by U.S. citizens',
      CertificationRequired: 'SBA certification required',
    },
    {
      BusinessTypeCode: 'SDVOSB',
      BusinessTypeName: 'Service-Disabled Veteran-Owned Small Business',
      Description: 'A small business at least 51% owned and controlled by service-disabled veterans',
      EligibilityCriteria: 'Must be small, 51%+ owned/controlled by one or more service-disabled veterans',
      CertificationRequired: 'VA verification or SBA certification',
    },
    {
      BusinessTypeCode: 'VOSB',
      BusinessTypeName: 'Veteran-Owned Small Business',
      Description: 'A small business at least 51% owned and controlled by veterans',
      EligibilityCriteria: 'Must be small, 51%+ owned/controlled by one or more veterans',
      CertificationRequired: 'VA verification or self-certification',
    },
    {
      BusinessTypeCode: '8A',
      BusinessTypeName: '8(a) Business Development Program',
      Description: 'A business development program for small disadvantaged businesses',
      EligibilityCriteria: 'Must be small, disadvantaged, potential for success, good character, 51%+ owned by disadvantaged individuals',
      CertificationRequired: 'SBA certification required (9-year program)',
    },
  ]

  const sourceFile = join(SOURCE_DIR, 'BusinessTypes.tsv')
  const data = existsSync(sourceFile)
    ? parseTSV<BusinessTypeRow>(sourceFile)
    : standardBusinessTypes

  const records: StandardRecord[] = data
    .filter(row => row.BusinessTypeCode && row.BusinessTypeName)
    .map(row => ({
      ns: NS,
      type: 'BusinessType',
      id: row.BusinessTypeCode,
      name: row.BusinessTypeName,
      description: cleanDescription(row.Description),
      code: row.BusinessTypeCode,
    }))

  writeStandardTSV(join(DATA_DIR, 'SBA.BusinessTypes.tsv'), records)

  // Write extended business type data
  const extendedData: Record<string, string>[] = data
    .filter(row => row.BusinessTypeCode)
    .map(row => ({
      ns: NS,
      type: 'BusinessType',
      code: row.BusinessTypeCode,
      name: row.BusinessTypeName,
      description: cleanDescription(row.Description),
      eligibilityCriteria: cleanDescription(row.EligibilityCriteria),
      certificationRequired: row.CertificationRequired,
    }))

  writeTSV(
    join(DATA_DIR, 'SBA.BusinessTypesExtended.tsv'),
    extendedData,
    ['ns', 'type', 'code', 'name', 'description', 'eligibilityCriteria', 'certificationRequired']
  )
}

/**
 * Transform federal contract set-aside types
 */
function transformContractTypes(): void {
  console.log('Transforming SBA Contract Types...')

  // Define standard contract set-aside types
  const standardContractTypes: ContractTypeRow[] = [
    {
      ContractTypeCode: 'SB_SET_ASIDE',
      ContractTypeName: 'Small Business Set-Aside',
      Description: 'Competition limited to small businesses',
      Threshold: 'No specific threshold',
      ApplicableBusinessTypes: 'SB',
    },
    {
      ContractTypeCode: '8A_SET_ASIDE',
      ContractTypeName: '8(a) Set-Aside',
      Description: 'Competition limited to 8(a) program participants',
      Threshold: 'Up to $4M for manufacturing, $7M for other',
      ApplicableBusinessTypes: '8A',
    },
    {
      ContractTypeCode: 'HUBZONE_SET_ASIDE',
      ContractTypeName: 'HUBZone Set-Aside',
      Description: 'Competition limited to HUBZone certified businesses',
      Threshold: 'No specific threshold',
      ApplicableBusinessTypes: 'HUBZONE',
    },
    {
      ContractTypeCode: 'SDVOSB_SET_ASIDE',
      ContractTypeName: 'SDVOSB Set-Aside',
      Description: 'Competition limited to service-disabled veteran-owned small businesses',
      Threshold: 'No specific threshold',
      ApplicableBusinessTypes: 'SDVOSB',
    },
    {
      ContractTypeCode: 'WOSB_SET_ASIDE',
      ContractTypeName: 'WOSB Set-Aside',
      Description: 'Competition limited to women-owned small businesses in underrepresented industries',
      Threshold: 'No specific threshold',
      ApplicableBusinessTypes: 'WOSB,EDWOSB',
    },
    {
      ContractTypeCode: 'EDWOSB_SET_ASIDE',
      ContractTypeName: 'EDWOSB Set-Aside',
      Description: 'Competition limited to economically disadvantaged women-owned small businesses',
      Threshold: 'No specific threshold',
      ApplicableBusinessTypes: 'EDWOSB',
    },
    {
      ContractTypeCode: 'VOSB_SET_ASIDE',
      ContractTypeName: 'VOSB Set-Aside',
      Description: 'Competition limited to veteran-owned small businesses',
      Threshold: 'No specific threshold',
      ApplicableBusinessTypes: 'VOSB,SDVOSB',
    },
    {
      ContractTypeCode: 'SOLE_SOURCE_8A',
      ContractTypeName: '8(a) Sole Source',
      Description: 'Non-competitive award to an 8(a) participant',
      Threshold: 'Up to $4M for manufacturing, $7M for other',
      ApplicableBusinessTypes: '8A',
    },
  ]

  const sourceFile = join(SOURCE_DIR, 'ContractTypes.tsv')
  const data = existsSync(sourceFile)
    ? parseTSV<ContractTypeRow>(sourceFile)
    : standardContractTypes

  const records: StandardRecord[] = data
    .filter(row => row.ContractTypeCode && row.ContractTypeName)
    .map(row => ({
      ns: NS,
      type: 'ContractType',
      id: row.ContractTypeCode,
      name: row.ContractTypeName,
      description: cleanDescription(row.Description),
      code: row.ContractTypeCode,
    }))

  writeStandardTSV(join(DATA_DIR, 'SBA.ContractTypes.tsv'), records)

  // Write extended contract type data
  const extendedData: Record<string, string>[] = data
    .filter(row => row.ContractTypeCode)
    .map(row => ({
      ns: NS,
      type: 'ContractType',
      code: row.ContractTypeCode,
      name: row.ContractTypeName,
      description: cleanDescription(row.Description),
      threshold: row.Threshold,
      applicableBusinessTypes: row.ApplicableBusinessTypes,
    }))

  writeTSV(
    join(DATA_DIR, 'SBA.ContractTypesExtended.tsv'),
    extendedData,
    ['ns', 'type', 'code', 'name', 'description', 'threshold', 'applicableBusinessTypes']
  )

  // Create relationships between contract types and business types
  const relationships: RelationshipRecord[] = []
  for (const row of data) {
    if (!row.ApplicableBusinessTypes) continue

    const businessTypes = row.ApplicableBusinessTypes.split(',').map(bt => bt.trim())
    for (const businessType of businessTypes) {
      if (businessType) {
        relationships.push({
          fromNs: NS,
          fromType: 'ContractType',
          fromId: row.ContractTypeCode,
          toNs: NS,
          toType: 'BusinessType',
          toId: businessType,
          relationshipType: 'applicable_to',
        })
      }
    }
  }

  if (relationships.length > 0) {
    writeRelationshipTSV(join(REL_DIR, 'SBA.ContractType.BusinessType.tsv'), relationships)
  }
}

/**
 * Main transformation function
 */
export async function transformSBA(): Promise<void> {
  console.log('=== SBA Transformation ===')
  ensureOutputDirs()

  transformSizeStandards()
  transformFootnotes()
  transformExceptions()
  transformBusinessTypes()
  transformContractTypes()

  console.log('=== SBA Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformSBA()
}
