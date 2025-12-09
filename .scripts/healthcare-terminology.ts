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
} from './utils'

const NS_ICD = NAMESPACES.ICD
const NS_SNOMED = NAMESPACES.SNOMED
const NS_LOINC = NAMESPACES.LOINC
const SOURCE_DIR = getSourcePath('Healthcare')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// ============================================================================
// ICD Interfaces
// ============================================================================

interface ICDChapterRow {
  chapter_number: string
  code_range: string
  title: string
}

interface ICDCodeRow {
  code: string
  is_billable: string
  short_description: string
  long_description: string
}

// ============================================================================
// SNOMED Interfaces
// ============================================================================

interface SNOMEDHierarchyRow {
  concept_id: string
  fully_specified_name: string
  description: string
}

// ============================================================================
// LOINC Interfaces
// ============================================================================

interface LOINCPartRow {
  part_type: string
  description: string
  examples: string
}

interface LOINCCategoryRow {
  category: string
  description: string
}

// ============================================================================
// ICD Transformation Functions
// ============================================================================

function transformICDChapters(): void {
  console.log('Transforming ICD Chapters...')
  const sourceFile = join(SOURCE_DIR, 'ICD/chapters.tsv')

  try {
    const data = parseTSV<ICDChapterRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.chapter_number)
      .map(row => ({
        ns: NS_ICD,
        type: 'Chapter',
        id: toWikipediaStyleId(row.title),
        name: row.title,
        description: cleanDescription(`Chapter ${row.chapter_number}: ${row.code_range}`),
        code: row.chapter_number,
        includedIn: getAggregationsForType('Chapter'),
      }))

    writeStandardTSV(join(DATA_DIR, 'ICD.Chapters.tsv'), records)
    console.log(`  Processed ${records.length} ICD chapters`)
  } catch (e) {
    console.log('Error processing ICD chapters:', e)
  }
}

function transformICDCodes(): void {
  console.log('Transforming ICD Codes...')
  const sourceFile = join(SOURCE_DIR, 'ICD/codes.tsv')

  try {
    const data = parseTSV<ICDCodeRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.code)
      .map(row => ({
        ns: NS_ICD,
        type: 'Code',
        id: toWikipediaStyleId(row.short_description || row.code),
        name: row.short_description || row.code,
        description: cleanDescription(row.long_description || ''),
        code: row.code,
        includedIn: getAggregationsForType('Code'),
      }))

    writeStandardTSV(join(DATA_DIR, 'ICD.Codes.tsv'), records)
    console.log(`  Processed ${records.length} ICD codes`)
  } catch (e) {
    console.log('Error processing ICD codes:', e)
  }
}

// ============================================================================
// SNOMED Transformation Functions
// ============================================================================

function transformSNOMEDConcepts(): void {
  console.log('Transforming SNOMED Concepts...')
  const sourceFile = join(SOURCE_DIR, 'SNOMED/hierarchy.tsv')

  try {
    const data = parseTSV<SNOMEDHierarchyRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.concept_id)
      .map(row => ({
        ns: NS_SNOMED,
        type: 'Concept',
        id: toWikipediaStyleId(row.fully_specified_name),
        name: row.fully_specified_name,
        description: cleanDescription(row.description),
        code: row.concept_id,
        includedIn: getAggregationsForType('Concept'),
      }))

    writeStandardTSV(join(DATA_DIR, 'SNOMED.Concepts.tsv'), records)
    console.log(`  Processed ${records.length} SNOMED concepts`)
  } catch (e) {
    console.log('Error processing SNOMED concepts:', e)
  }
}

// ============================================================================
// LOINC Transformation Functions
// ============================================================================

function transformLOINCParts(): void {
  console.log('Transforming LOINC Parts...')
  const sourceFile = join(SOURCE_DIR, 'LOINC/parts.tsv')

  try {
    const data = parseTSV<LOINCPartRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.part_type)
      .map(row => ({
        ns: NS_LOINC,
        type: 'Part',
        id: toWikipediaStyleId(row.part_type),
        name: row.part_type,
        description: cleanDescription(row.description || ''),
        code: row.part_type,
        includedIn: getAggregationsForType('Part'),
      }))

    writeStandardTSV(join(DATA_DIR, 'LOINC.Parts.tsv'), records)
    console.log(`  Processed ${records.length} LOINC parts`)
  } catch (e) {
    console.log('Error processing LOINC parts:', e)
  }
}

function transformLOINCCategories(): void {
  console.log('Transforming LOINC Categories...')
  const sourceFile = join(SOURCE_DIR, 'LOINC/categories.tsv')

  try {
    const data = parseTSV<LOINCCategoryRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.category)
      .map(row => ({
        ns: NS_LOINC,
        type: 'Category',
        id: toWikipediaStyleId(row.category),
        name: row.category,
        description: cleanDescription(row.description || ''),
        code: row.category,
        includedIn: getAggregationsForType('Category'),
      }))

    writeStandardTSV(join(DATA_DIR, 'LOINC.Categories.tsv'), records)
    console.log(`  Processed ${records.length} LOINC categories`)
  } catch (e) {
    console.log('Error processing LOINC categories:', e)
  }
}

// ============================================================================
// Main Transform Function
// ============================================================================

export async function transformHealthcareTerminology(): Promise<void> {
  console.log('=== Healthcare Terminology Transformation ===')
  ensureOutputDirs()

  // Transform ICD
  console.log('\n--- ICD Transformation ---')
  transformICDChapters()
  transformICDCodes()

  // Transform SNOMED
  console.log('\n--- SNOMED Transformation ---')
  transformSNOMEDConcepts()

  // Transform LOINC
  console.log('\n--- LOINC Transformation ---')
  transformLOINCParts()
  transformLOINCCategories()

  console.log('\n=== Healthcare Terminology Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformHealthcareTerminology()
}
