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
  ChapterCode: string
  ChapterTitle: string
  ChapterRange: string
  ChapterDescription: string
}

interface ICDBlockRow {
  BlockCode: string
  BlockTitle: string
  BlockRange: string
  ChapterCode: string
  BlockDescription: string
}

interface ICDCategoryRow {
  CategoryCode: string
  CategoryTitle: string
  BlockCode: string
  ChapterCode: string
  CategoryDescription: string
  Includes: string
  Excludes: string
}

interface ICDCodeRow {
  DiagnosisCode: string
  DiagnosisTitle: string
  CategoryCode: string
  BlockCode: string
  ChapterCode: string
  DiagnosisDescription: string
  Includes: string
  Excludes: string
  ClinicalNotes: string
  Billable: string
}

// ============================================================================
// SNOMED Interfaces
// ============================================================================

interface SNOMEDConceptRow {
  ConceptId: string
  FullySpecifiedName: string
  PreferredTerm: string
  Definition: string
  Active: string
  EffectiveTime: string
  ModuleId: string
  DefinitionStatusId: string
}

interface SNOMEDDescriptionRow {
  DescriptionId: string
  ConceptId: string
  Term: string
  TypeId: string
  LanguageCode: string
  CaseSignificanceId: string
  Active: string
  EffectiveTime: string
  ModuleId: string
}

interface SNOMEDRelationshipRow {
  RelationshipId: string
  SourceId: string
  DestinationId: string
  TypeId: string
  CharacteristicTypeId: string
  ModifierId: string
  RelationshipGroup: string
  Active: string
  EffectiveTime: string
  ModuleId: string
}

interface SNOMEDRefSetRow {
  RefSetId: string
  RefSetName: string
  RefSetDescription: string
  RefSetType: string
  ModuleId: string
  Active: string
  EffectiveTime: string
}

// ============================================================================
// LOINC Interfaces
// ============================================================================

interface LOINCCodeRow {
  LOINC_NUM: string
  COMPONENT: string
  PROPERTY: string
  TIME_ASPCT: string
  SYSTEM: string
  SCALE_TYP: string
  METHOD_TYP: string
  LONG_COMMON_NAME: string
  SHORTNAME: string
  STATUS: string
  CLASS: string
  CONSUMER_NAME: string
  EXAMPLE_UNITS: string
  RELATEDNAMES2: string
}

interface LOINCPanelRow {
  LOINC_NUM: string
  LONG_COMMON_NAME: string
  SHORTNAME: string
  STATUS: string
  CLASS: string
  TYPE: string
  CONSUMER_NAME: string
}

interface LOINCAnswerListRow {
  AnswerListId: string
  AnswerListName: string
  Description: string
  AnswerListType: string
  ExternalCode: string
}

interface LOINCPartRow {
  PartNumber: string
  PartName: string
  PartType: string
  Status: string
  Description: string
}

// ============================================================================
// ICD Transformation Functions
// ============================================================================

function transformICDChapters(): void {
  console.log('Transforming ICD Chapters...')
  const sourceFile = join(SOURCE_DIR, 'ICD.Chapters.tsv')

  if (!existsSync(sourceFile)) {
    console.log('ICD.Chapters.tsv not found, skipping...')
    return
  }

  try {
    const data = parseTSV<ICDChapterRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.ChapterCode)
      .map(row => ({
        ns: NS_ICD,
        type: 'Chapter',
        id: toWikipediaStyleId(row.ChapterTitle),
        name: row.ChapterTitle,
        description: cleanDescription(row.ChapterDescription),
        code: row.ChapterCode,
      }))

    writeStandardTSV(join(DATA_DIR, 'ICD.Chapters.tsv'), records)
  } catch (e) {
    console.log('Error processing ICD chapters:', e)
  }
}

function transformICDBlocks(): void {
  console.log('Transforming ICD Blocks...')
  const sourceFile = join(SOURCE_DIR, 'ICD.Blocks.tsv')

  if (!existsSync(sourceFile)) {
    console.log('ICD.Blocks.tsv not found, skipping...')
    return
  }

  try {
    const data = parseTSV<ICDBlockRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.BlockCode)
      .map(row => ({
        ns: NS_ICD,
        type: 'Block',
        id: toWikipediaStyleId(row.BlockTitle),
        name: row.BlockTitle,
        description: cleanDescription(row.BlockDescription),
        code: row.BlockCode,
      }))

    writeStandardTSV(join(DATA_DIR, 'ICD.Blocks.tsv'), records)

    // Write block-chapter relationships
    const relationships: Record<string, string>[] = data
      .filter(row => row.BlockCode && row.ChapterCode)
      .map(row => ({
        fromNs: NS_ICD,
        fromType: 'Block',
        fromCode: row.BlockCode,
        toNs: NS_ICD,
        toType: 'Chapter',
        toCode: row.ChapterCode,
        relationshipType: 'child_of',
      }))

    writeTSV(
      join(REL_DIR, 'ICD.Block.Chapter.tsv'),
      relationships,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
    )
  } catch (e) {
    console.log('Error processing ICD blocks:', e)
  }
}

function transformICDCategories(): void {
  console.log('Transforming ICD Categories...')
  const sourceFile = join(SOURCE_DIR, 'ICD.Categories.tsv')

  if (!existsSync(sourceFile)) {
    console.log('ICD.Categories.tsv not found, skipping...')
    return
  }

  try {
    const data = parseTSV<ICDCategoryRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.CategoryCode)
      .map(row => ({
        ns: NS_ICD,
        type: 'Category',
        id: toWikipediaStyleId(row.CategoryTitle),
        name: row.CategoryTitle,
        description: cleanDescription(row.CategoryDescription),
        code: row.CategoryCode,
      }))

    writeStandardTSV(join(DATA_DIR, 'ICD.Categories.tsv'), records)

    // Write category-block relationships
    const relationships: Record<string, string>[] = data
      .filter(row => row.CategoryCode && row.BlockCode)
      .map(row => ({
        fromNs: NS_ICD,
        fromType: 'Category',
        fromCode: row.CategoryCode,
        toNs: NS_ICD,
        toType: 'Block',
        toCode: row.BlockCode,
        relationshipType: 'child_of',
      }))

    writeTSV(
      join(REL_DIR, 'ICD.Category.Block.tsv'),
      relationships,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
    )
  } catch (e) {
    console.log('Error processing ICD categories:', e)
  }
}

function transformICDCodes(): void {
  console.log('Transforming ICD Codes...')
  const sourceFile = join(SOURCE_DIR, 'ICD.Codes.tsv')

  if (!existsSync(sourceFile)) {
    console.log('ICD.Codes.tsv not found, skipping...')
    return
  }

  try {
    const data = parseTSV<ICDCodeRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.DiagnosisCode)
      .map(row => ({
        ns: NS_ICD,
        type: 'Code',
        id: toWikipediaStyleId(row.DiagnosisTitle),
        name: row.DiagnosisTitle,
        description: cleanDescription(row.DiagnosisDescription),
        code: row.DiagnosisCode,
      }))

    writeStandardTSV(join(DATA_DIR, 'ICD.Codes.tsv'), records)

    // Write code-category relationships
    const relationships: Record<string, string>[] = data
      .filter(row => row.DiagnosisCode && row.CategoryCode)
      .map(row => ({
        fromNs: NS_ICD,
        fromType: 'Code',
        fromCode: row.DiagnosisCode,
        toNs: NS_ICD,
        toType: 'Category',
        toCode: row.CategoryCode,
        relationshipType: 'child_of',
      }))

    writeTSV(
      join(REL_DIR, 'ICD.Code.Category.tsv'),
      relationships,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
    )
  } catch (e) {
    console.log('Error processing ICD codes:', e)
  }
}

// ============================================================================
// SNOMED Transformation Functions
// ============================================================================

function transformSNOMEDConcepts(): void {
  console.log('Transforming SNOMED Concepts...')
  const sourceFile = join(SOURCE_DIR, 'SNOMED.Concepts.tsv')

  if (!existsSync(sourceFile)) {
    console.log('SNOMED.Concepts.tsv not found, skipping...')
    return
  }

  try {
    const data = parseTSV<SNOMEDConceptRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.ConceptId)
      .map(row => ({
        ns: NS_SNOMED,
        type: 'Concept',
        id: toWikipediaStyleId(row.PreferredTerm),
        name: row.PreferredTerm,
        description: cleanDescription(row.Definition),
        code: row.ConceptId,
      }))

    writeStandardTSV(join(DATA_DIR, 'SNOMED.Concepts.tsv'), records)
  } catch (e) {
    console.log('Error processing SNOMED concepts:', e)
  }
}

function transformSNOMEDDescriptions(): void {
  console.log('Transforming SNOMED Descriptions...')
  const sourceFile = join(SOURCE_DIR, 'SNOMED.Descriptions.tsv')

  if (!existsSync(sourceFile)) {
    console.log('SNOMED.Descriptions.tsv not found, skipping...')
    return
  }

  try {
    const data = parseTSV<SNOMEDDescriptionRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.DescriptionId)
      .map(row => ({
        ns: NS_SNOMED,
        type: 'Description',
        id: toWikipediaStyleId(row.Term),
        name: row.Term,
        description: cleanDescription(`Type: ${row.TypeId}, Language: ${row.LanguageCode}`),
        code: row.DescriptionId,
      }))

    writeStandardTSV(join(DATA_DIR, 'SNOMED.Descriptions.tsv'), records)

    // Write description-concept relationships
    const relationships: Record<string, string>[] = data
      .filter(row => row.DescriptionId && row.ConceptId)
      .map(row => ({
        fromNs: NS_SNOMED,
        fromType: 'Description',
        fromCode: row.DescriptionId,
        toNs: NS_SNOMED,
        toType: 'Concept',
        toCode: row.ConceptId,
        relationshipType: 'describes',
      }))

    writeTSV(
      join(REL_DIR, 'SNOMED.Description.Concept.tsv'),
      relationships,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
    )
  } catch (e) {
    console.log('Error processing SNOMED descriptions:', e)
  }
}

function transformSNOMEDRelationships(): void {
  console.log('Transforming SNOMED Relationships...')
  const sourceFile = join(SOURCE_DIR, 'SNOMED.Relationships.tsv')

  if (!existsSync(sourceFile)) {
    console.log('SNOMED.Relationships.tsv not found, skipping...')
    return
  }

  try {
    const data = parseTSV<SNOMEDRelationshipRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.RelationshipId)
      .map(row => ({
        ns: NS_SNOMED,
        type: 'Relationship',
        id: row.RelationshipId,
        name: `Relationship ${row.RelationshipId}`,
        description: cleanDescription(`${row.SourceId} -> ${row.TypeId} -> ${row.DestinationId}`),
        code: row.RelationshipId,
      }))

    writeStandardTSV(join(DATA_DIR, 'SNOMED.Relationships.tsv'), records)

    // Write concept-concept relationships
    const relationships: Record<string, string>[] = data
      .filter(row => row.SourceId && row.DestinationId)
      .map(row => ({
        fromNs: NS_SNOMED,
        fromType: 'Concept',
        fromCode: row.SourceId,
        toNs: NS_SNOMED,
        toType: 'Concept',
        toCode: row.DestinationId,
        relationshipType: row.TypeId,
        relationshipId: row.RelationshipId,
      }))

    writeTSV(
      join(REL_DIR, 'SNOMED.Concept.Concept.tsv'),
      relationships,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType', 'relationshipId']
    )
  } catch (e) {
    console.log('Error processing SNOMED relationships:', e)
  }
}

function transformSNOMEDRefSets(): void {
  console.log('Transforming SNOMED Reference Sets...')
  const sourceFile = join(SOURCE_DIR, 'SNOMED.RefSets.tsv')

  if (!existsSync(sourceFile)) {
    console.log('SNOMED.RefSets.tsv not found, skipping...')
    return
  }

  try {
    const data = parseTSV<SNOMEDRefSetRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.RefSetId)
      .map(row => ({
        ns: NS_SNOMED,
        type: 'RefSet',
        id: toWikipediaStyleId(row.RefSetName),
        name: row.RefSetName,
        description: cleanDescription(row.RefSetDescription),
        code: row.RefSetId,
      }))

    writeStandardTSV(join(DATA_DIR, 'SNOMED.RefSets.tsv'), records)
  } catch (e) {
    console.log('Error processing SNOMED reference sets:', e)
  }
}

// ============================================================================
// LOINC Transformation Functions
// ============================================================================

function transformLOINCCodes(): void {
  console.log('Transforming LOINC Codes...')
  const sourceFile = join(SOURCE_DIR, 'LOINC.Codes.tsv')

  if (!existsSync(sourceFile)) {
    console.log('LOINC.Codes.tsv not found, skipping...')
    return
  }

  try {
    const data = parseTSV<LOINCCodeRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.LOINC_NUM)
      .map(row => ({
        ns: NS_LOINC,
        type: 'Code',
        id: toWikipediaStyleId(row.LONG_COMMON_NAME),
        name: row.LONG_COMMON_NAME,
        description: cleanDescription(`${row.COMPONENT} - ${row.PROPERTY} - ${row.SYSTEM}`),
        code: row.LOINC_NUM,
      }))

    writeStandardTSV(join(DATA_DIR, 'LOINC.Codes.tsv'), records)
  } catch (e) {
    console.log('Error processing LOINC codes:', e)
  }
}

function transformLOINCPanels(): void {
  console.log('Transforming LOINC Panels...')
  const sourceFile = join(SOURCE_DIR, 'LOINC.Panels.tsv')

  if (!existsSync(sourceFile)) {
    console.log('LOINC.Panels.tsv not found, skipping...')
    return
  }

  try {
    const data = parseTSV<LOINCPanelRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.LOINC_NUM)
      .map(row => ({
        ns: NS_LOINC,
        type: 'Panel',
        id: toWikipediaStyleId(row.LONG_COMMON_NAME),
        name: row.LONG_COMMON_NAME,
        description: cleanDescription(`Type: ${row.TYPE}, Class: ${row.CLASS}`),
        code: row.LOINC_NUM,
      }))

    writeStandardTSV(join(DATA_DIR, 'LOINC.Panels.tsv'), records)
  } catch (e) {
    console.log('Error processing LOINC panels:', e)
  }
}

function transformLOINCAnswerLists(): void {
  console.log('Transforming LOINC Answer Lists...')
  const sourceFile = join(SOURCE_DIR, 'LOINC.AnswerLists.tsv')

  if (!existsSync(sourceFile)) {
    console.log('LOINC.AnswerLists.tsv not found, skipping...')
    return
  }

  try {
    const data = parseTSV<LOINCAnswerListRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.AnswerListId)
      .map(row => ({
        ns: NS_LOINC,
        type: 'AnswerList',
        id: toWikipediaStyleId(row.AnswerListName),
        name: row.AnswerListName,
        description: cleanDescription(row.Description),
        code: row.AnswerListId,
      }))

    writeStandardTSV(join(DATA_DIR, 'LOINC.AnswerLists.tsv'), records)
  } catch (e) {
    console.log('Error processing LOINC answer lists:', e)
  }
}

function transformLOINCParts(): void {
  console.log('Transforming LOINC Parts...')
  const sourceFile = join(SOURCE_DIR, 'LOINC.Parts.tsv')

  if (!existsSync(sourceFile)) {
    console.log('LOINC.Parts.tsv not found, skipping...')
    return
  }

  try {
    const data = parseTSV<LOINCPartRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.PartNumber)
      .map(row => ({
        ns: NS_LOINC,
        type: 'Part',
        id: toWikipediaStyleId(row.PartName),
        name: row.PartName,
        description: cleanDescription(row.Description),
        code: row.PartNumber,
      }))

    writeStandardTSV(join(DATA_DIR, 'LOINC.Parts.tsv'), records)
  } catch (e) {
    console.log('Error processing LOINC parts:', e)
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
  transformICDBlocks()
  transformICDCategories()
  transformICDCodes()

  // Transform SNOMED
  console.log('\n--- SNOMED Transformation ---')
  transformSNOMEDConcepts()
  transformSNOMEDDescriptions()
  transformSNOMEDRelationships()
  transformSNOMEDRefSets()

  // Transform LOINC
  console.log('\n--- LOINC Transformation ---')
  transformLOINCCodes()
  transformLOINCPanels()
  transformLOINCAnswerLists()
  transformLOINCParts()

  console.log('\n=== Healthcare Terminology Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformHealthcareTerminology()
}
