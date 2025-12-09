import { join } from 'path'
import { existsSync } from 'fs'
import {
  NAMESPACES,
  parseTSV,
  parseCSV,
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
  type RelationshipRecord,
} from './utils'

// Define namespaces for finance standards
const ISO20022_NS = NAMESPACES.ISO20022
const LEI_NS = NAMESPACES.LEI
const ISIN_NS = NAMESPACES.ISIN
const MCC_NS = NAMESPACES.MCC
const SWIFT_NS = NAMESPACES.SWIFT

const SOURCE_DIR = getSourcePath('Finance')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// ============================================================================
// ISO 20022 - Financial Services Messages
// ============================================================================

interface ISO20022BusinessAreaRow {
  Code: string
  Name: string
  Description: string
}

interface ISO20022MessageDefinitionRow {
  MessageID: string
  BusinessArea: string
  Name: string
  Description: string
  Usage: string
}

interface ISO20022DataTypeRow {
  DataType: string
  Category: string
  Description: string
  Format: string
  Example: string
}

function transformISO20022(): void {
  console.log('Transforming ISO 20022...')

  // Transform Business Areas
  const businessAreasFile = join(SOURCE_DIR, 'ISO20022', 'BusinessAreas.tsv')
  if (existsSync(businessAreasFile)) {
    const businessAreas = parseTSV<ISO20022BusinessAreaRow>(businessAreasFile)
    const businessAreaRecords: StandardRecord[] = businessAreas.map(ba => ({
      ns: ISO20022_NS,
      type: 'ISO20022.BusinessArea',
      id: toWikipediaStyleId(ba.Name),
      name: ba.Name,
      description: cleanDescription(ba.Description),
      code: ba.Code,
      includedIn: getAggregationsForType('BusinessArea'),
    }))
    writeStandardTSV(join(DATA_DIR, 'Finance.ISO20022.BusinessAreas.tsv'), businessAreaRecords)
    console.log(`  - Processed ${businessAreaRecords.length} business areas`)
  }

  // Transform Message Definitions
  const messageDefsFile = join(SOURCE_DIR, 'ISO20022', 'MessageDefinitions.tsv')
  if (existsSync(messageDefsFile)) {
    const messageDefs = parseTSV<ISO20022MessageDefinitionRow>(messageDefsFile)
    const messageDefRecords: StandardRecord[] = messageDefs.map(md => ({
      ns: ISO20022_NS,
      type: 'ISO20022.Message',
      id: toWikipediaStyleId(md.Name),
      name: md.Name,
      description: cleanDescription(md.Description),
      code: md.MessageID,
      includedIn: getAggregationsForType('Message'),
    }))
    writeStandardTSV(join(DATA_DIR, 'Finance.ISO20022.Messages.tsv'), messageDefRecords)
    console.log(`  - Processed ${messageDefRecords.length} messages`)

    // Create relationships: Message -> BusinessArea
    const businessAreas = parseTSV<ISO20022BusinessAreaRow>(businessAreasFile)
    const messageBusinessAreaRels: RelationshipRecord[] = messageDefs
      .filter(md => md.BusinessArea)
      .map(md => {
        // Find the business area by code to get its name
        const businessArea = businessAreas.find(ba => ba.Code === md.BusinessArea)
        if (!businessArea) return null

        return {
          fromNs: ISO20022_NS,
          fromType: 'ISO20022.Message',
          fromId: toWikipediaStyleId(md.Name),
          toNs: ISO20022_NS,
          toType: 'ISO20022.BusinessArea',
          toId: toWikipediaStyleId(businessArea.Name),
          relationshipType: 'belongs_to',
        }
      })
      .filter((rel): rel is RelationshipRecord => rel !== null)

    if (messageBusinessAreaRels.length > 0) {
      writeTSV(
        join(REL_DIR, 'Finance.ISO20022.Message.BusinessArea.tsv'),
        messageBusinessAreaRels as unknown as Record<string, string>[],
        ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']
      )
      console.log(`  - Created ${messageBusinessAreaRels.length} message-business area relationships`)
    }
  }

  // Transform Data Types
  const dataTypesFile = join(SOURCE_DIR, 'ISO20022', 'DataTypes.tsv')
  if (existsSync(dataTypesFile)) {
    const dataTypes = parseTSV<ISO20022DataTypeRow>(dataTypesFile)
    const dataTypeRecords: StandardRecord[] = dataTypes.map(dt => ({
      ns: ISO20022_NS,
      type: 'ISO20022.DataType',
      id: toWikipediaStyleId(dt.DataType),
      name: dt.DataType,
      description: cleanDescription(dt.Description),
      code: dt.DataType,
      includedIn: getAggregationsForType('DataType'),
    }))
    writeStandardTSV(join(DATA_DIR, 'Finance.ISO20022.DataTypes.tsv'), dataTypeRecords)
    console.log(`  - Processed ${dataTypeRecords.length} data types`)
  }
}

// ============================================================================
// LEI - Legal Entity Identifier
// ============================================================================

interface LEIRegistrationAuthorityRow {
  'Registration Authority Code': string
  Country: string
  'Country Code': string
  'Jurisdiction (country or region)': string
  'International name of Register': string
  'Local name of Register': string
  'International name of organisation responsible for the Register': string
  'Local name of organisation responsible for the Register': string
  Website: string
  Comments: string
}

interface LEIEntityTypeRow {
  Code: string
  Name: string
  Description: string
  Standard: string
}

function transformLEI(): void {
  console.log('Transforming LEI...')

  // Transform Registration Authorities
  const registrationAuthoritiesFile = join(SOURCE_DIR, 'LEI', 'RegistrationAuthorities.tsv')
  if (existsSync(registrationAuthoritiesFile)) {
    const authorities = parseTSV<Record<string, string>>(registrationAuthoritiesFile)
    const authorityRecords: StandardRecord[] = authorities
      .map(auth => {
        // Handle the field with potential BOM and quotes - try multiple variations
        const code = auth['Registration Authority Code'] ||
                     auth['﻿"Registration Authority Code"'] ||
                     auth['"﻿""Registration Authority Code"""'] ||
                     Object.keys(auth).find(k => k.includes('Registration Authority Code')) &&
                     auth[Object.keys(auth).find(k => k.includes('Registration Authority Code'))!] ||
                     ''

        if (!code || !code.trim()) return null

        const name = auth['International name of Register'] ||
                     auth['International name of organisation responsible for the Register'] ||
                     code
        const description = [
          auth.Country,
          auth['Jurisdiction (country or region)'],
          auth.Comments
        ].filter(Boolean).join(' - ')

        return {
          ns: LEI_NS,
          type: 'LEI.RegistrationAuthority',
          id: toWikipediaStyleId(name),
          name: name,
          description: cleanDescription(description),
          code: code.trim(),
          includedIn: getAggregationsForType('RegistrationAuthority'),
        }
      })
      .filter((auth): auth is StandardRecord => auth !== null)
    writeStandardTSV(join(DATA_DIR, 'Finance.LEI.RegistrationAuthorities.tsv'), authorityRecords)
    console.log(`  - Processed ${authorityRecords.length} registration authorities`)
  }

  // Transform Entity Types
  const entityTypesFile = join(SOURCE_DIR, 'LEI', 'EntityTypes.tsv')
  if (existsSync(entityTypesFile)) {
    const entityTypes = parseTSV<LEIEntityTypeRow>(entityTypesFile)
    const entityTypeRecords: StandardRecord[] = entityTypes
      .filter(et => et.Name && et.Name.trim())
      .map(et => ({
        ns: LEI_NS,
        type: 'LEI.EntityType',
        id: toWikipediaStyleId(et.Name),
        name: et.Name,
        description: cleanDescription(et.Description),
        code: et.Code,
        includedIn: getAggregationsForType('EntityType'),
      }))
    writeStandardTSV(join(DATA_DIR, 'Finance.LEI.EntityTypes.tsv'), entityTypeRecords)
    console.log(`  - Processed ${entityTypeRecords.length} entity types`)
  }
}

// ============================================================================
// ISIN - International Securities Identification Number
// ============================================================================

interface ISINIssuingAgencyRow {
  CountryCode: string
  Country: string
  Agency: string
  Type: string
  Website: string
}

function transformISIN(): void {
  console.log('Transforming ISIN...')

  // Transform Issuing Agencies
  const agenciesFile = join(SOURCE_DIR, 'ISIN', 'IssuingAgencies.tsv')
  if (existsSync(agenciesFile)) {
    const agencies = parseTSV<ISINIssuingAgencyRow>(agenciesFile)
    const agencyRecords: StandardRecord[] = agencies
      .filter(agency => agency.Agency && agency.Agency.trim())
      .map(agency => ({
        ns: ISIN_NS,
        type: 'ISIN.IssuingAgency',
        id: toWikipediaStyleId(agency.Agency),
        name: agency.Agency,
        description: cleanDescription(`${agency.Country} (${agency.CountryCode}) - ${agency.Type}`),
        code: agency.CountryCode,
        includedIn: getAggregationsForType('IssuingAgency'),
      }))
    writeStandardTSV(join(DATA_DIR, 'Finance.ISIN.Agencies.tsv'), agencyRecords)
    console.log(`  - Processed ${agencyRecords.length} issuing agencies`)
  }
}

// ============================================================================
// MCC - Merchant Category Codes
// ============================================================================

interface MCCCategoryRow {
  RangeStart: string
  RangeEnd: string
  Category: string
  Description: string
}

interface MCCCodeRow {
  MCC: string
  Description: string
  CombinedDescription: string
  USDADescription: string
  IRSDescription: string
  IRSReportable: string
}

function transformMCC(): void {
  console.log('Transforming MCC...')

  // Transform Categories
  const categoriesFile = join(SOURCE_DIR, 'MCC', 'Categories.tsv')
  if (existsSync(categoriesFile)) {
    const categories = parseTSV<MCCCategoryRow>(categoriesFile)
    const categoryRecords: StandardRecord[] = categories
      .filter(cat => cat.Category && cat.Category.trim())
      .map(cat => ({
        ns: MCC_NS,
        type: 'MCC.Category',
        id: toWikipediaStyleId(cat.Category),
        name: cat.Category,
        description: cleanDescription(cat.Description),
        code: `${cat.RangeStart}-${cat.RangeEnd}`,
        includedIn: getAggregationsForType('Category'),
      }))
    writeStandardTSV(join(DATA_DIR, 'Finance.MCC.Categories.tsv'), categoryRecords)
    console.log(`  - Processed ${categoryRecords.length} categories`)
  }

  // Transform Codes
  const codesFile = join(SOURCE_DIR, 'MCC', 'Codes.tsv')
  if (existsSync(codesFile)) {
    const codes = parseTSV<MCCCodeRow>(codesFile)
    const codeRecords: StandardRecord[] = codes
      .filter(code => code.MCC && code.MCC.trim())
      .map(code => ({
        ns: MCC_NS,
        type: 'MCC.Code',
        id: code.MCC,
        name: code.Description || code.CombinedDescription,
        description: cleanDescription(code.CombinedDescription || code.Description),
        code: code.MCC,
        includedIn: getAggregationsForType('Code'),
      }))
    writeStandardTSV(join(DATA_DIR, 'Finance.MCC.Codes.tsv'), codeRecords)
    console.log(`  - Processed ${codeRecords.length} codes`)

    // Create relationships: Code -> Category
    const categories = parseTSV<MCCCategoryRow>(categoriesFile)
    const codeCategoryRels: RelationshipRecord[] = []

    for (const code of codes) {
      if (!code.MCC) continue
      const mccNum = parseInt(code.MCC)
      if (isNaN(mccNum)) continue

      // Find the category this code belongs to
      const category = categories.find(cat => {
        const start = parseInt(cat.RangeStart)
        const end = parseInt(cat.RangeEnd)
        return mccNum >= start && mccNum <= end
      })

      if (category) {
        codeCategoryRels.push({
          fromNs: MCC_NS,
          fromType: 'MCC.Code',
          fromId: code.MCC,
          toNs: MCC_NS,
          toType: 'MCC.Category',
          toId: toWikipediaStyleId(category.Category),
          relationshipType: 'belongs_to',
        })
      }
    }

    if (codeCategoryRels.length > 0) {
      writeTSV(
        join(REL_DIR, 'Finance.MCC.Code.Category.tsv'),
        codeCategoryRels as unknown as Record<string, string>[],
        ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']
      )
      console.log(`  - Created ${codeCategoryRels.length} code-category relationships`)
    }
  }
}

// ============================================================================
// SWIFT - BIC/SWIFT Codes
// ============================================================================

interface SWIFTStructureRow {
  Position: string
  Length: string
  Component: string
  Type: string
  Description: string
  Example: string
}

interface SWIFTCountryCodeRow {
  Code: string
  Country: string
  Region: string
}

function transformSWIFT(): void {
  console.log('Transforming SWIFT...')

  // Transform Country Codes
  const countryCodesFile = join(SOURCE_DIR, 'SWIFT', 'CountryCodes.tsv')
  if (existsSync(countryCodesFile)) {
    const countryCodes = parseTSV<SWIFTCountryCodeRow>(countryCodesFile)
    const countryCodeRecords: StandardRecord[] = countryCodes
      .filter(cc => cc.Code && cc.Code.trim())
      .map(cc => ({
        ns: SWIFT_NS,
        type: 'SWIFT.CountryCode',
        id: cc.Code,
        name: cc.Country,
        description: cleanDescription(`${cc.Region} - ${cc.Code}`),
        code: cc.Code,
        includedIn: getAggregationsForType('CountryCode'),
      }))
    writeStandardTSV(join(DATA_DIR, 'Finance.SWIFT.Countries.tsv'), countryCodeRecords)
    console.log(`  - Processed ${countryCodeRecords.length} country codes`)
  }

  // Transform Structure (BIC/SWIFT code structure)
  const structureFile = join(SOURCE_DIR, 'SWIFT', 'Structure.tsv')
  if (existsSync(structureFile)) {
    const structure = parseTSV<SWIFTStructureRow>(structureFile)
    const structureRecords: StandardRecord[] = structure
      .filter(s => s.Component && s.Component.trim())
      .map(s => ({
        ns: SWIFT_NS,
        type: 'SWIFT.StructureComponent',
        id: toWikipediaStyleId(s.Component),
        name: s.Component,
        description: cleanDescription(`${s.Description} (Position: ${s.Position}, Length: ${s.Length}, Type: ${s.Type})`),
        code: s.Position,
        includedIn: getAggregationsForType('StructureComponent'),
      }))
    writeStandardTSV(join(DATA_DIR, 'Finance.SWIFT.Structure.tsv'), structureRecords)
    console.log(`  - Processed ${structureRecords.length} structure components`)
  }
}

// ============================================================================
// Main Transform Function
// ============================================================================

export async function transformFinance(): Promise<void> {
  console.log('=== Finance Standards Transformation ===')
  ensureOutputDirs()

  try {
    transformISO20022()
  } catch (e) {
    console.log('ISO 20022 transformation failed or skipped:', e)
  }

  try {
    transformLEI()
  } catch (e) {
    console.log('LEI transformation failed or skipped:', e)
  }

  try {
    transformISIN()
  } catch (e) {
    console.log('ISIN transformation failed or skipped:', e)
  }

  try {
    transformMCC()
  } catch (e) {
    console.log('MCC transformation failed or skipped:', e)
  }

  try {
    transformSWIFT()
  } catch (e) {
    console.log('SWIFT transformation failed or skipped:', e)
  }

  console.log('=== Finance Standards Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformFinance()
}
