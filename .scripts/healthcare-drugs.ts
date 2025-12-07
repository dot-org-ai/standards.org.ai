import { join } from 'path'
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
  type StandardRecord,
} from './utils'

// Define namespaces for healthcare standards
const NDC_NS = 'ndc.org.ai'
const RXNORM_NS = 'rxnorm.org.ai'
const NPI_NS = 'npi.org.ai'

const NDC_SOURCE_DIR = getSourcePath('Healthcare/NDC')
const RXNORM_SOURCE_DIR = getSourcePath('Healthcare/RxNorm')
const NPI_SOURCE_DIR = getSourcePath('Healthcare/NPI')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

/**
 * NDC Data Interfaces
 * Source: https://www.fda.gov/drugs/drug-approvals-and-databases/national-drug-code-directory
 */
interface NDCProductRow {
  PRODUCTID: string
  PRODUCTNDC: string
  PRODUCTTYPENAME: string
  PROPRIETARYNAME: string
  PROPRIETARYNAMESUFFIX: string
  NONPROPRIETARYNAME: string
  DOSAGEFORMNAME: string
  ROUTENAME: string
  STARTMARKETINGDATE: string
  ENDMARKETINGDATE: string
  MARKETINGCATEGORYNAME: string
  APPLICATIONNUMBER: string
  LABELERNAME: string
  SUBSTANCENAME: string
  ACTIVE_NUMERATOR_STRENGTH: string
  ACTIVE_INGRED_UNIT: string
  PHARM_CLASSES: string
  DEASCHEDULE: string
}

interface NDCPackageRow {
  PRODUCTID: string
  PRODUCTNDC: string
  NDCPACKAGECODE: string
  PACKAGEDESCRIPTION: string
  STARTMARKETINGDATE: string
  ENDMARKETINGDATE: string
  SAMPLE: string
}

interface NDCLabelerRow {
  LABELER_CODE: string
  LABELER_NAME: string
}

/**
 * RxNorm Data Interfaces
 * Source: https://www.nlm.nih.gov/research/umls/rxnorm/
 */
interface RxNormConceptRow {
  RXCUI: string
  LAT: string
  TS: string
  LUI: string
  STT: string
  SUI: string
  ISPREF: string
  RXAUI: string
  SAUI: string
  SCUI: string
  SDUI: string
  SAB: string
  TTY: string
  CODE: string
  STR: string
  SRL: string
  SUPPRESS: string
  CVF: string
}

interface RxNormRelationshipRow {
  RXCUI1: string
  RXAUI1: string
  STYPE1: string
  REL: string
  RXCUI2: string
  RXAUI2: string
  STYPE2: string
  RELA: string
  RUI: string
  SRUI: string
  SAB: string
  SL: string
  DIR: string
  RG: string
  SUPPRESS: string
  CVF: string
}

/**
 * NPI Data Interfaces
 * Source: https://npiregistry.cms.hhs.gov/
 */
interface NPIRow {
  NPI: string
  'Entity Type Code': string
  'Replacement NPI': string
  'Employer Identification Number (EIN)': string
  'Provider Organization Name (Legal Business Name)': string
  'Provider Last Name (Legal Name)': string
  'Provider First Name': string
  'Provider Middle Name': string
  'Provider Name Prefix Text': string
  'Provider Name Suffix Text': string
  'Provider Credential Text': string
  'Provider Other Organization Name': string
  'Provider Other Organization Name Type Code': string
  'Provider Other Last Name': string
  'Provider Other First Name': string
  'Provider Other Middle Name': string
  'Provider Other Name Prefix Text': string
  'Provider Other Name Suffix Text': string
  'Provider Other Credential Text': string
  'Provider Other Last Name Type Code': string
  'Provider First Line Business Mailing Address': string
  'Provider Second Line Business Mailing Address': string
  'Provider Business Mailing Address City Name': string
  'Provider Business Mailing Address State Name': string
  'Provider Business Mailing Address Postal Code': string
  'Provider Business Mailing Address Country Code (If outside U.S.)': string
  'Provider Business Mailing Address Telephone Number': string
  'Provider Business Mailing Address Fax Number': string
  'Provider First Line Business Practice Location Address': string
  'Provider Second Line Business Practice Location Address': string
  'Provider Business Practice Location Address City Name': string
  'Provider Business Practice Location Address State Name': string
  'Provider Business Practice Location Address Postal Code': string
  'Provider Business Practice Location Address Country Code (If outside U.S.)': string
  'Provider Business Practice Location Address Telephone Number': string
  'Provider Business Practice Location Address Fax Number': string
  'Provider Enumeration Date': string
  'Last Update Date': string
  'NPI Deactivation Reason Code': string
  'NPI Deactivation Date': string
  'NPI Reactivation Date': string
  'Provider Gender Code': string
  'Authorized Official Last Name': string
  'Authorized Official First Name': string
  'Authorized Official Middle Name': string
  'Authorized Official Title or Position': string
  'Authorized Official Telephone Number': string
  'Healthcare Provider Taxonomy Code_1': string
  'Provider License Number_1': string
  'Provider License Number State Code_1': string
  'Healthcare Provider Primary Taxonomy Switch_1': string
}

/**
 * Transform NDC Drug Products
 */
function transformNDCProducts(): void {
  console.log('Transforming NDC Drug Products...')
  const data = parseTSV<NDCProductRow>(join(NDC_SOURCE_DIR, 'product.txt'))

  const records: StandardRecord[] = data
    .filter(row => row.PRODUCTNDC)
    .map(row => {
      const proprietaryName = row.PROPRIETARYNAME + (row.PROPRIETARYNAMESUFFIX ? ' ' + row.PROPRIETARYNAMESUFFIX : '')
      return {
        ns: NDC_NS,
        type: 'Drug',
        id: toWikipediaStyleId(proprietaryName),
        name: proprietaryName,
        description: cleanDescription(
          `${row.NONPROPRIETARYNAME || proprietaryName} - ${row.DOSAGEFORMNAME || 'Drug Product'} (NDC: ${row.PRODUCTNDC})`
        ),
        code: row.PRODUCTNDC,
      }
    })

  writeStandardTSV(join(DATA_DIR, 'NDC.Products.tsv'), records)
}

/**
 * Transform NDC Package Codes
 */
function transformNDCPackages(): void {
  console.log('Transforming NDC Package Codes...')
  const data = parseTSV<NDCPackageRow>(join(NDC_SOURCE_DIR, 'package.txt'))

  const records: StandardRecord[] = data
    .filter(row => row.NDCPACKAGECODE)
    .map(row => ({
      ns: NDC_NS,
      type: 'Package',
      id: row.NDCPACKAGECODE.replace(/-/g, '_'),
      name: row.PACKAGEDESCRIPTION || row.NDCPACKAGECODE,
      description: cleanDescription(
        `Package: ${row.PACKAGEDESCRIPTION || row.NDCPACKAGECODE} (Product NDC: ${row.PRODUCTNDC})`
      ),
      code: row.NDCPACKAGECODE,
    }))

  writeStandardTSV(join(DATA_DIR, 'NDC.Packages.tsv'), records)

  // Write package-to-product relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.NDCPACKAGECODE && row.PRODUCTNDC)
    .map(row => ({
      fromNs: NDC_NS,
      fromType: 'Package',
      fromCode: row.NDCPACKAGECODE,
      toNs: NDC_NS,
      toType: 'Drug',
      toCode: row.PRODUCTNDC,
      relationshipType: 'package_of',
    }))

  writeTSV(
    join(REL_DIR, 'NDC.Package.Drug.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

/**
 * Transform NDC Labelers
 */
function transformNDCLabelers(): void {
  console.log('Transforming NDC Labelers...')

  // Extract unique labelers from product data
  const productData = parseTSV<NDCProductRow>(join(NDC_SOURCE_DIR, 'product.txt'))

  // Create a map to deduplicate labelers
  const labelerMap = new Map<string, { code: string; name: string }>()

  for (const row of productData) {
    if (row.PRODUCTNDC && row.LABELERNAME) {
      // Labeler code is the first segment of the NDC
      const labelerCode = row.PRODUCTNDC.split('-')[0]
      if (!labelerMap.has(labelerCode)) {
        labelerMap.set(labelerCode, {
          code: labelerCode,
          name: row.LABELERNAME,
        })
      }
    }
  }

  const records: StandardRecord[] = Array.from(labelerMap.values()).map(labeler => ({
    ns: NDC_NS,
    type: 'Labeler',
    id: toWikipediaStyleId(labeler.name),
    name: labeler.name,
    description: cleanDescription(`NDC Labeler: ${labeler.name} (Code: ${labeler.code})`),
    code: labeler.code,
  }))

  writeStandardTSV(join(DATA_DIR, 'NDC.Labelers.tsv'), records)
}

/**
 * Transform RxNorm Concepts
 */
function transformRxNormConcepts(): void {
  console.log('Transforming RxNorm Concepts...')
  const data = parseTSV<RxNormConceptRow>(join(RXNORM_SOURCE_DIR, 'RXNCONSO.RRF'))

  // Filter for English concepts that are not suppressed
  const records: StandardRecord[] = data
    .filter(row => row.RXCUI && row.LAT === 'ENG' && row.SUPPRESS !== 'Y')
    .map(row => ({
      ns: RXNORM_NS,
      type: 'Concept',
      id: toWikipediaStyleId(row.STR),
      name: row.STR,
      description: cleanDescription(`RxNorm ${row.TTY}: ${row.STR} (RXCUI: ${row.RXCUI})`),
      code: row.RXCUI,
    }))

  // Deduplicate by RXCUI (keep first occurrence)
  const uniqueRecords = Array.from(
    new Map(records.map(r => [r.code, r])).values()
  )

  writeStandardTSV(join(DATA_DIR, 'RxNorm.Concepts.tsv'), uniqueRecords)
}

/**
 * Transform RxNorm Ingredients
 */
function transformRxNormIngredients(): void {
  console.log('Transforming RxNorm Ingredients...')
  const data = parseTSV<RxNormConceptRow>(join(RXNORM_SOURCE_DIR, 'RXNCONSO.RRF'))

  // Filter for ingredient term types (IN = Ingredient)
  const records: StandardRecord[] = data
    .filter(row => row.RXCUI && row.TTY === 'IN' && row.LAT === 'ENG' && row.SUPPRESS !== 'Y')
    .map(row => ({
      ns: RXNORM_NS,
      type: 'Ingredient',
      id: toWikipediaStyleId(row.STR),
      name: row.STR,
      description: cleanDescription(`Active Ingredient: ${row.STR} (RXCUI: ${row.RXCUI})`),
      code: row.RXCUI,
    }))

  writeStandardTSV(join(DATA_DIR, 'RxNorm.Ingredients.tsv'), records)
}

/**
 * Transform RxNorm Dose Forms
 */
function transformRxNormForms(): void {
  console.log('Transforming RxNorm Dose Forms...')
  const data = parseTSV<RxNormConceptRow>(join(RXNORM_SOURCE_DIR, 'RXNCONSO.RRF'))

  // Filter for dose form term types (DF = Dose Form)
  const records: StandardRecord[] = data
    .filter(row => row.RXCUI && row.TTY === 'DF' && row.LAT === 'ENG' && row.SUPPRESS !== 'Y')
    .map(row => ({
      ns: RXNORM_NS,
      type: 'Form',
      id: toWikipediaStyleId(row.STR),
      name: row.STR,
      description: cleanDescription(`Dose Form: ${row.STR} (RXCUI: ${row.RXCUI})`),
      code: row.RXCUI,
    }))

  writeStandardTSV(join(DATA_DIR, 'RxNorm.Forms.tsv'), records)
}

/**
 * Transform RxNorm Strengths
 */
function transformRxNormStrengths(): void {
  console.log('Transforming RxNorm Strengths...')
  const data = parseTSV<RxNormConceptRow>(join(RXNORM_SOURCE_DIR, 'RXNCONSO.RRF'))

  // Filter for strength-related term types (SCD, SBD - Semantic Clinical/Branded Drug)
  const records: StandardRecord[] = data
    .filter(row =>
      row.RXCUI &&
      (row.TTY === 'SCD' || row.TTY === 'SBD') &&
      row.LAT === 'ENG' &&
      row.SUPPRESS !== 'Y'
    )
    .map(row => ({
      ns: RXNORM_NS,
      type: 'Strength',
      id: toWikipediaStyleId(row.STR),
      name: row.STR,
      description: cleanDescription(`${row.TTY === 'SCD' ? 'Clinical' : 'Branded'} Drug: ${row.STR} (RXCUI: ${row.RXCUI})`),
      code: row.RXCUI,
    }))

  writeStandardTSV(join(DATA_DIR, 'RxNorm.Strengths.tsv'), records)
}

/**
 * Transform RxNorm Relationships
 */
function transformRxNormRelationships(): void {
  console.log('Transforming RxNorm Relationships...')
  const data = parseTSV<RxNormRelationshipRow>(join(RXNORM_SOURCE_DIR, 'RXNREL.RRF'))

  // Filter for important relationships
  const relationships: Record<string, string>[] = data
    .filter(row =>
      row.RXCUI1 &&
      row.RXCUI2 &&
      row.SUPPRESS !== 'Y' &&
      ['tradename_of', 'ingredient_of', 'has_ingredient', 'consists_of', 'constitutes', 'contained_in', 'contains', 'form_of', 'has_form'].includes(row.RELA || '')
    )
    .map(row => ({
      fromNs: RXNORM_NS,
      fromType: 'Concept',
      fromCode: row.RXCUI1,
      toNs: RXNORM_NS,
      toType: 'Concept',
      toCode: row.RXCUI2,
      relationshipType: row.RELA || row.REL,
    }))

  writeTSV(
    join(REL_DIR, 'RxNorm.Concept.Concept.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

/**
 * Transform NPI Providers (Individual)
 */
function transformNPIProviders(): void {
  console.log('Transforming NPI Providers (Individuals)...')
  const data = parseCSV<NPIRow>(join(NPI_SOURCE_DIR, 'npidata.csv'))

  // Filter for Entity Type Code 1 (Individual)
  const records: StandardRecord[] = data
    .filter(row => row.NPI && row['Entity Type Code'] === '1')
    .map(row => {
      const firstName = row['Provider First Name'] || ''
      const lastName = row['Provider Last Name (Legal Name)'] || ''
      const fullName = `${firstName} ${lastName}`.trim()

      return {
        ns: NPI_NS,
        type: 'Provider',
        id: toWikipediaStyleId(fullName || row.NPI),
        name: fullName || `Provider ${row.NPI}`,
        description: cleanDescription(
          `Healthcare Provider: ${fullName} (NPI: ${row.NPI})${row['Healthcare Provider Taxonomy Code_1'] ? ` - ${row['Healthcare Provider Taxonomy Code_1']}` : ''}`
        ),
        code: row.NPI,
      }
    })

  writeStandardTSV(join(DATA_DIR, 'NPI.Providers.tsv'), records)
}

/**
 * Transform NPI Organizations
 */
function transformNPIOrganizations(): void {
  console.log('Transforming NPI Organizations...')
  const data = parseCSV<NPIRow>(join(NPI_SOURCE_DIR, 'npidata.csv'))

  // Filter for Entity Type Code 2 (Organization)
  const records: StandardRecord[] = data
    .filter(row => row.NPI && row['Entity Type Code'] === '2')
    .map(row => {
      const orgName = row['Provider Organization Name (Legal Business Name)'] || `Organization ${row.NPI}`

      return {
        ns: NPI_NS,
        type: 'Organization',
        id: toWikipediaStyleId(orgName),
        name: orgName,
        description: cleanDescription(
          `Healthcare Organization: ${orgName} (NPI: ${row.NPI})${row['Healthcare Provider Taxonomy Code_1'] ? ` - ${row['Healthcare Provider Taxonomy Code_1']}` : ''}`
        ),
        code: row.NPI,
      }
    })

  writeStandardTSV(join(DATA_DIR, 'NPI.Organizations.tsv'), records)
}

/**
 * Transform NPI Provider Taxonomies
 */
function transformNPITaxonomies(): void {
  console.log('Transforming NPI Provider Taxonomies...')
  const data = parseCSV<NPIRow>(join(NPI_SOURCE_DIR, 'npidata.csv'))

  // Extract unique taxonomy codes
  const taxonomySet = new Set<string>()
  for (const row of data) {
    if (row['Healthcare Provider Taxonomy Code_1']) {
      taxonomySet.add(row['Healthcare Provider Taxonomy Code_1'])
    }
  }

  const records: StandardRecord[] = Array.from(taxonomySet).map(code => ({
    ns: NPI_NS,
    type: 'Taxonomy',
    id: code.replace(/[^a-zA-Z0-9]/g, '_'),
    name: `Taxonomy ${code}`,
    description: cleanDescription(`Provider Taxonomy Code: ${code}`),
    code: code,
  }))

  writeStandardTSV(join(DATA_DIR, 'NPI.Taxonomies.tsv'), records)
}

/**
 * Main transformation function
 */
export async function transformHealthcareDrugs(): Promise<void> {
  console.log('=== Healthcare Drugs & Providers Transformation ===')
  ensureOutputDirs()

  // NDC Transformations
  try {
    transformNDCProducts()
    transformNDCPackages()
    transformNDCLabelers()
  } catch (error) {
    console.error('NDC transformation error (files may not exist yet):', error)
  }

  // RxNorm Transformations
  try {
    transformRxNormConcepts()
    transformRxNormIngredients()
    transformRxNormForms()
    transformRxNormStrengths()
    transformRxNormRelationships()
  } catch (error) {
    console.error('RxNorm transformation error (files may not exist yet):', error)
  }

  // NPI Transformations
  try {
    transformNPIProviders()
    transformNPIOrganizations()
    transformNPITaxonomies()
  } catch (error) {
    console.error('NPI transformation error (files may not exist yet):', error)
  }

  console.log('=== Healthcare Drugs & Providers Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformHealthcareDrugs()
}
