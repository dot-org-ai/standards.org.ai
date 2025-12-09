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
const NDC_NS = 'standards.org.ai'
const RXNORM_NS = 'standards.org.ai'
const NPI_NS = 'standards.org.ai'
const CPT_NS = 'standards.org.ai'
const HCPCS_NS = 'standards.org.ai'

const SOURCE_DIR = getSourcePath('Healthcare')
const NDC_SOURCE_DIR = getSourcePath('Healthcare/NDC')
const RXNORM_SOURCE_DIR = getSourcePath('Healthcare/RxNorm')
const NPI_SOURCE_DIR = getSourcePath('Healthcare/NPI')
const CPT_SOURCE_DIR = getSourcePath('Healthcare/CPT')
const HCPCS_SOURCE_DIR = getSourcePath('Healthcare/HCPCS')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

/**
 * NDC Data Interfaces
 * Source: https://www.fda.gov/drugs/drug-approvals-and-databases/national-drug-code-directory
 */
interface NDCProductRow {
  product_ndc: string
  generic_name: string
  brand_name: string
  dosage_form: string
  route: string
  marketing_category: string
  labeler_name: string
}

/**
 * RxNorm Data Interfaces
 * Source: https://www.nlm.nih.gov/research/umls/rxnorm/
 */
interface RxNormTermTypeRow {
  term_type: string
  description: string
  example: string
}

/**
 * NPI Data Interfaces
 * Source: https://npiregistry.cms.hhs.gov/
 */
interface NPITaxonomyRow {
  code: string
  grouping: string
  classification: string
  specialization: string
  display_name: string
  section: string
}

/**
 * CPT Data Interfaces
 * Source: https://www.ama-assn.org/practice-management/cpt
 */
interface CPTCategoryRow {
  category_range: string
  category_name: string
  description: string
}

/**
 * HCPCS Data Interfaces
 * Source: https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets
 */
interface HCPCSCodeRow {
  code: string
  long_description: string
  short_description: string
  coverage_code: string
  add_date: string
  effective_date: string
  action_code: string
}

/**
 * Transform NDC Drug Products
 */
function transformNDCProducts(): void {
  console.log('Transforming NDC Drug Products...')
  const data = parseTSV<NDCProductRow>(join(NDC_SOURCE_DIR, 'products.tsv'))

  const records: StandardRecord[] = data
    .filter(row => row.product_ndc)
    .map(row => {
      const name = row.brand_name || row.generic_name
      return {
        ns: NDC_NS,
        type: 'NDC_Product',
        id: toWikipediaStyleId(name),
        name: name,
        description: cleanDescription(
          `${row.generic_name} - ${row.dosage_form || 'Drug Product'} (NDC: ${row.product_ndc})`
        ),
        code: row.product_ndc,
      }
    })

  writeStandardTSV(join(DATA_DIR, 'NDC.Products.tsv'), records)
  console.log(`  Processed ${records.length} NDC products`)
}

/**
 * Transform RxNorm Term Types
 */
function transformRxNormTermTypes(): void {
  console.log('Transforming RxNorm Term Types...')
  const data = parseTSV<RxNormTermTypeRow>(join(RXNORM_SOURCE_DIR, 'term_types.tsv'))

  const records: StandardRecord[] = data
    .filter(row => row.term_type)
    .map(row => ({
      ns: RXNORM_NS,
      type: 'RxNorm_TermType',
      id: toWikipediaStyleId(row.term_type),
      name: row.term_type,
      description: cleanDescription(row.description || ''),
      code: row.term_type,
    }))

  writeStandardTSV(join(DATA_DIR, 'RxNorm.TermTypes.tsv'), records)
  console.log(`  Processed ${records.length} RxNorm term types`)
}

/**
 * Transform NPI Taxonomy Codes
 */
function transformNPITaxonomyCodes(): void {
  console.log('Transforming NPI Taxonomy Codes...')
  const data = parseTSV<NPITaxonomyRow>(join(NPI_SOURCE_DIR, 'taxonomy_codes.tsv'))

  const records: StandardRecord[] = data
    .filter(row => row.code)
    .map(row => ({
      ns: NPI_NS,
      type: 'NPI_Taxonomy',
      id: toWikipediaStyleId(row.display_name || row.code),
      name: row.display_name || row.code,
      description: cleanDescription(
        `${row.grouping}${row.classification ? ' - ' + row.classification : ''}${row.specialization ? ' - ' + row.specialization : ''}`
      ),
      code: row.code,
    }))

  writeStandardTSV(join(DATA_DIR, 'NPI.Taxonomies.tsv'), records)
  console.log(`  Processed ${records.length} NPI taxonomy codes`)
}

/**
 * Transform CPT Categories
 */
function transformCPTCategories(): void {
  console.log('Transforming CPT Categories...')
  const data = parseTSV<CPTCategoryRow>(join(CPT_SOURCE_DIR, 'categories.tsv'))

  const records: StandardRecord[] = data
    .filter(row => row.category_range && row.category_name)
    .map(row => ({
      ns: CPT_NS,
      type: 'CPT_Category',
      id: toWikipediaStyleId(row.category_name),
      name: row.category_name,
      description: cleanDescription(row.description || ''),
      code: row.category_range,
    }))

  writeStandardTSV(join(DATA_DIR, 'CPT.Categories.tsv'), records)
  console.log(`  Processed ${records.length} CPT categories`)
}

/**
 * Transform HCPCS Codes
 */
function transformHCPCSCodes(): void {
  console.log('Transforming HCPCS Codes...')
  const data = parseTSV<HCPCSCodeRow>(join(HCPCS_SOURCE_DIR, 'codes.tsv'))

  const records: StandardRecord[] = data
    .filter(row => row.code)
    .map(row => ({
      ns: HCPCS_NS,
      type: 'HCPCS_Code',
      id: toWikipediaStyleId(row.code),
      name: row.short_description || row.code,
      description: cleanDescription(row.long_description || ''),
      code: row.code,
    }))

  writeStandardTSV(join(DATA_DIR, 'HCPCS.Codes.tsv'), records)
  console.log(`  Processed ${records.length} HCPCS codes`)
}

/**
 * Main transformation function
 */
export async function transformHealthcareDrugs(): Promise<void> {
  console.log('=== Healthcare Drugs & Providers Transformation ===\n')
  ensureOutputDirs()

  // NDC Transformations
  try {
    transformNDCProducts()
  } catch (error) {
    console.error('NDC transformation error:', error)
  }

  // RxNorm Transformations
  try {
    transformRxNormTermTypes()
  } catch (error) {
    console.error('RxNorm transformation error:', error)
  }

  // NPI Transformations
  try {
    transformNPITaxonomyCodes()
  } catch (error) {
    console.error('NPI transformation error:', error)
  }

  // CPT Transformations
  try {
    transformCPTCategories()
  } catch (error) {
    console.error('CPT transformation error:', error)
  }

  // HCPCS Transformations
  try {
    transformHCPCSCodes()
  } catch (error) {
    console.error('HCPCS transformation error:', error)
  }

  console.log('\n=== Healthcare Drugs & Providers Transformation Complete ===')
}

// Run if called directly
if (import.meta.main) {
  transformHealthcareDrugs()
}
