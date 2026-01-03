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
          relationshipType: 'belongsTo',
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
          relationshipType: 'belongsTo',
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
// MCC to NAICS Relationships
// ============================================================================

function transformMCCNAICSRelationships(): void {
  console.log('Transforming MCC to NAICS relationships...')

  const categoriesFile = join(SOURCE_DIR, 'MCC', 'Categories.tsv')
  if (!existsSync(categoriesFile)) {
    console.log('  - MCC Categories file not found, skipping')
    return
  }

  const categories = parseTSV<MCCCategoryRow>(categoriesFile)

  // Define mapping from MCC categories to NAICS industries/sectors
  // Maps MCC category ID (Wikipedia-style) to NAICS ID and relationship description
  const mccToNaicsMapping: Array<{
    mccCategoryId: string
    naicsId: string
    naicsType: string
    relationshipType: string
  }> = [
    // Agricultural Services (0001-1499) -> Agriculture, Forestry, Fishing and Hunting (11)
    { mccCategoryId: 'Agricultural_Services', naicsId: 'Agriculture,_Forestry,_Fishing_and_Hunting', naicsType: 'Sector', relationshipType: 'classifies_merchants_in' },

    // Contracted Services (1500-2999) -> Construction (23)
    { mccCategoryId: 'Contracted_Services', naicsId: 'Construction', naicsType: 'Sector', relationshipType: 'classifies_merchants_in' },

    // Airlines (3000-3299) -> Air Transportation (481)
    { mccCategoryId: 'Airlines', naicsId: 'Air_Transportation', naicsType: 'Subsector', relationshipType: 'classifies_merchants_in' },

    // Car Rental (3300-3499) -> Rental and Leasing Services (532)
    { mccCategoryId: 'Car_Rental', naicsId: 'Rental_and_Leasing_Services', naicsType: 'Subsector', relationshipType: 'classifies_merchants_in' },

    // Lodging (3500-3999) -> Accommodation (721)
    { mccCategoryId: 'Lodging', naicsId: 'Accommodation', naicsType: 'Subsector', relationshipType: 'classifies_merchants_in' },

    // Transportation Services (4000-4799) -> Transportation (48-49)
    { mccCategoryId: 'Transportation_Services', naicsId: 'Transit_and_Ground_Passenger_Transportation', naicsType: 'Subsector', relationshipType: 'classifies_merchants_in' },

    // Telecommunication Services (4800-4899) -> Telecommunications (517)
    { mccCategoryId: 'Telecommunication_Services', naicsId: 'Telecommunications', naicsType: 'Subsector', relationshipType: 'classifies_merchants_in' },

    // Retail Outlet Services (5000-5599) -> General Merchandise Retailers (452)
    { mccCategoryId: 'Retail_Outlet_Services', naicsId: 'General_Merchandise_Retailers', naicsType: 'Subsector', relationshipType: 'classifies_merchants_in' },

    // Clothing Stores (5600-5699) -> Clothing Retailers (448)
    { mccCategoryId: 'Clothing_Stores', naicsId: 'Clothing,_Clothing_Accessories,_Shoe,_and_Jewelry_Retailers', naicsType: 'Subsector', relationshipType: 'classifies_merchants_in' },

    // Miscellaneous Stores (5700-5799) -> Sporting Goods, Hobby, Book Retailers (451)
    { mccCategoryId: 'Miscellaneous_Stores', naicsId: 'Sporting_Goods,_Hobby,_Musical_Instrument,_Book,_and_Miscellaneous_Retailers', naicsType: 'Subsector', relationshipType: 'classifies_merchants_in' },

    // Eating and Drinking Places (5800-5999) -> Food Services and Drinking Places (722)
    { mccCategoryId: 'Eating_and_Drinking_Places', naicsId: 'Food_Services_and_Drinking_Places', naicsType: 'Subsector', relationshipType: 'classifies_merchants_in' },

    // Financial Institutions (6000-6299) -> Finance and Insurance (52)
    { mccCategoryId: 'Financial_Institutions', naicsId: 'Finance_and_Insurance', naicsType: 'Sector', relationshipType: 'classifies_merchants_in' },

    // Insurance (6300-6399) -> Insurance Carriers and Related Activities (524)
    { mccCategoryId: 'Insurance', naicsId: 'Insurance_Carriers_and_Related_Activities', naicsType: 'Subsector', relationshipType: 'classifies_merchants_in' },

    // Insurance Services (6400-6513) -> Insurance Carriers and Related Activities (524)
    { mccCategoryId: 'Insurance_Services', naicsId: 'Insurance_Carriers_and_Related_Activities', naicsType: 'Subsector', relationshipType: 'classifies_merchants_in' },

    // Personal Services (7000-7299) -> Personal and Laundry Services (812)
    { mccCategoryId: 'Personal_Services', naicsId: 'Personal_and_Laundry_Services', naicsType: 'Subsector', relationshipType: 'classifies_merchants_in' },

    // Business Services (7300-7399) -> Professional, Scientific, and Technical Services (54)
    { mccCategoryId: 'Business_Services', naicsId: 'Professional,_Scientific,_and_Technical_Services', naicsType: 'Sector', relationshipType: 'classifies_merchants_in' },

    // Automotive Repair Services (7500-7599) -> Repair and Maintenance (811)
    { mccCategoryId: 'Automotive_Repair_Services', naicsId: 'Repair_and_Maintenance', naicsType: 'Subsector', relationshipType: 'classifies_merchants_in' },

    // Miscellaneous Repair Services (7600-7699) -> Repair and Maintenance (811)
    { mccCategoryId: 'Miscellaneous_Repair_Services', naicsId: 'Repair_and_Maintenance', naicsType: 'Subsector', relationshipType: 'classifies_merchants_in' },

    // Recreation Services (7800-7999) -> Arts, Entertainment, and Recreation (71)
    { mccCategoryId: 'Recreation_Services', naicsId: 'Arts,_Entertainment,_and_Recreation', naicsType: 'Sector', relationshipType: 'classifies_merchants_in' },

    // Medical and Health Services (8000-8099) -> Health Care and Social Assistance (62)
    { mccCategoryId: 'Medical_and_Health_Services', naicsId: 'Health_Care_and_Social_Assistance', naicsType: 'Sector', relationshipType: 'classifies_merchants_in' },

    // Legal and Educational Services (8100-8299) -> Educational Services (61)
    { mccCategoryId: 'Legal_and_Educational_Services', naicsId: 'Educational_Services', naicsType: 'Sector', relationshipType: 'classifies_merchants_in' },

    // Accounting and Bookkeeping (8300-8399) -> Professional, Scientific, and Technical Services (54)
    { mccCategoryId: 'Accounting_and_Bookkeeping', naicsId: 'Professional,_Scientific,_and_Technical_Services', naicsType: 'Sector', relationshipType: 'classifies_merchants_in' },

    // Professional Services (8400-8499) -> Professional, Scientific, and Technical Services (54)
    { mccCategoryId: 'Professional_Services', naicsId: 'Professional,_Scientific,_and_Technical_Services', naicsType: 'Sector', relationshipType: 'classifies_merchants_in' },

    // Membership Organizations (8600-8699) -> Religious, Grantmaking, Civic, Professional, and Similar Organizations (813)
    { mccCategoryId: 'Membership_Organizations', naicsId: 'Religious,_Grantmaking,_Civic,_Professional,_and_Similar_Organizations', naicsType: 'Subsector', relationshipType: 'classifies_merchants_in' },

    // Architectural and Engineering Services (8700-8899) -> Professional, Scientific, and Technical Services (54)
    { mccCategoryId: 'Architectural_and_Engineering_Services', naicsId: 'Professional,_Scientific,_and_Technical_Services', naicsType: 'Sector', relationshipType: 'classifies_merchants_in' },

    // Government Services (9000-9099) -> Public Administration (92)
    { mccCategoryId: 'Government_Services', naicsId: 'Public_Administration', naicsType: 'Sector', relationshipType: 'classifies_merchants_in' },

    // Professional and Government Services (9100-9399) -> Public Administration (92)
    { mccCategoryId: 'Professional_and_Government_Services', naicsId: 'Public_Administration', naicsType: 'Sector', relationshipType: 'classifies_merchants_in' },

    // Government and Utilities (9400-9799) -> Utilities (22)
    { mccCategoryId: 'Government_and_Utilities', naicsId: 'Utilities', naicsType: 'Sector', relationshipType: 'classifies_merchants_in' },
  ]

  // Create relationship records
  const relationships: RelationshipRecord[] = mccToNaicsMapping
    .filter(mapping => {
      // Verify the MCC category exists
      const category = categories.find(cat => toWikipediaStyleId(cat.Category) === mapping.mccCategoryId)
      if (!category) {
        console.log(`  - Warning: MCC category not found: ${mapping.mccCategoryId}`)
        return false
      }
      return true
    })
    .map(mapping => ({
      fromNs: MCC_NS,
      fromType: 'MCC.Category',
      fromId: mapping.mccCategoryId,
      toNs: NAMESPACES.NAICS,
      toType: mapping.naicsType,
      toId: mapping.naicsId,
      relationshipType: mapping.relationshipType,
    }))

  if (relationships.length > 0) {
    writeTSV(
      join(REL_DIR, 'Finance.MCC.Category.NAICS.Industry.tsv'),
      relationships as unknown as Record<string, string>[],
      ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']
    )
    console.log(`  - Created ${relationships.length} MCC-NAICS relationships`)
  } else {
    console.log('  - No MCC-NAICS relationships created')
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

  try {
    transformMCCNAICSRelationships()
  } catch (e) {
    console.log('MCC-NAICS relationships transformation failed or skipped:', e)
  }

  console.log('=== Finance Standards Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformFinance()
}
