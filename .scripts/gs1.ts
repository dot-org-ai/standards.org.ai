import { join } from 'path'
import { existsSync } from 'fs'
import {
  NAMESPACES,
  parseTSV,
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

const NS = NAMESPACES.GS1
const SOURCE_DIR = getSourcePath('GS1')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

interface GPCSchemaRow {
  segmentCode: string
  segmentTitle: string
  segmentDefinition: string
  familyCode: string
  familyTitle: string
  familyDefinition: string
  classCode: string
  classTitle: string
  classDefinition: string
  brickCode: string
  brickTitle: string
  brickDefinitionIncludes: string
  brickDefinitionExcludes: string
  attributeCode: string
  attributeTitle: string
  attributeDefinition: string
  attributeValueCode: string
  attributeValueTitle: string
  attributeValueDefinition: string
}

interface VocabularyRow {
  id: string
  label: string
  type: string
  description: string
  source: string
  verb: string
  noun: string
  relatedEvent: string
}

interface LocationTypeRow {
  id: string
  label: string
  type: string
  description: string
  source: string
  parentType: string
  glnFunctionalType: string
}

interface BusinessStepRow {
  businessStep: string
  verb: string
  noun: string
  description: string
}

interface DispositionRow {
  disposition: string
  verb: string
  description: string
}

interface IdentifierRow {
  identifier: string
  class: string
  description: string
}

interface GLNFunctionalTypeRow {
  id: string
  label: string
  description: string
}

function transformGPCHierarchy(): void {
  console.log('Transforming GS1 GPC Hierarchy...')
  const data = parseTSV<GPCSchemaRow>(join(SOURCE_DIR, 'GS1.Schema.tsv'))

  // Extract unique segments
  const segmentsMap = new Map<string, GPCSchemaRow>()
  const familiesMap = new Map<string, GPCSchemaRow>()
  const classesMap = new Map<string, GPCSchemaRow>()
  const bricksMap = new Map<string, GPCSchemaRow>()
  const attributesMap = new Map<string, GPCSchemaRow>()

  for (const row of data) {
    if (row.segmentCode && !segmentsMap.has(row.segmentCode)) {
      segmentsMap.set(row.segmentCode, row)
    }
    if (row.familyCode && !familiesMap.has(row.familyCode)) {
      familiesMap.set(row.familyCode, row)
    }
    if (row.classCode && !classesMap.has(row.classCode)) {
      classesMap.set(row.classCode, row)
    }
    if (row.brickCode && !bricksMap.has(row.brickCode)) {
      bricksMap.set(row.brickCode, row)
    }
    if (row.attributeCode && !attributesMap.has(row.attributeCode)) {
      attributesMap.set(row.attributeCode, row)
    }
  }

  // Write Segments
  const segmentRecords: StandardRecord[] = Array.from(segmentsMap.values()).map(row => ({
    ns: NS,
    type: 'Segment',
    id: toWikipediaStyleId(row.segmentTitle),
    name: row.segmentTitle,
    description: cleanDescription(row.segmentDefinition),
    code: row.segmentCode,
  }))
  writeStandardTSV(join(DATA_DIR, 'GS1.Segments.tsv'), segmentRecords)

  // Write Families
  const familyRecords: StandardRecord[] = Array.from(familiesMap.values()).map(row => ({
    ns: NS,
    type: 'Family',
    id: toWikipediaStyleId(row.familyTitle),
    name: row.familyTitle,
    description: cleanDescription(row.familyDefinition),
    code: row.familyCode,
  }))
  writeStandardTSV(join(DATA_DIR, 'GS1.Families.tsv'), familyRecords)

  // Write Classes
  const classRecords: StandardRecord[] = Array.from(classesMap.values()).map(row => ({
    ns: NS,
    type: 'Class',
    id: toWikipediaStyleId(row.classTitle),
    name: row.classTitle,
    description: cleanDescription(row.classDefinition),
    code: row.classCode,
  }))
  writeStandardTSV(join(DATA_DIR, 'GS1.Classes.tsv'), classRecords)

  // Write Bricks
  const brickRecords: StandardRecord[] = Array.from(bricksMap.values()).map(row => ({
    ns: NS,
    type: 'Brick',
    id: toWikipediaStyleId(row.brickTitle),
    name: row.brickTitle,
    description: cleanDescription(`Includes: ${row.brickDefinitionIncludes || ''} Excludes: ${row.brickDefinitionExcludes || ''}`),
    code: row.brickCode,
  }))
  writeStandardTSV(join(DATA_DIR, 'GS1.Bricks.tsv'), brickRecords)

  // Write Attributes
  const attributeRecords: StandardRecord[] = Array.from(attributesMap.values()).map(row => ({
    ns: NS,
    type: 'Attribute',
    id: toWikipediaStyleId(row.attributeTitle),
    name: row.attributeTitle,
    description: cleanDescription(row.attributeDefinition),
    code: row.attributeCode,
  }))
  writeStandardTSV(join(DATA_DIR, 'GS1.Attributes.tsv'), attributeRecords)

  // Write hierarchy relationships
  const hierarchyRelationships: Record<string, string>[] = []

  // Family -> Segment
  for (const row of familiesMap.values()) {
    if (row.segmentCode) {
      hierarchyRelationships.push({
        fromNs: NS,
        fromType: 'Family',
        fromCode: row.familyCode,
        toNs: NS,
        toType: 'Segment',
        toCode: row.segmentCode,
        relationshipType: 'child_of',
      })
    }
  }

  // Class -> Family
  for (const row of classesMap.values()) {
    if (row.familyCode) {
      hierarchyRelationships.push({
        fromNs: NS,
        fromType: 'Class',
        fromCode: row.classCode,
        toNs: NS,
        toType: 'Family',
        toCode: row.familyCode,
        relationshipType: 'child_of',
      })
    }
  }

  // Brick -> Class
  for (const row of bricksMap.values()) {
    if (row.classCode) {
      hierarchyRelationships.push({
        fromNs: NS,
        fromType: 'Brick',
        fromCode: row.brickCode,
        toNs: NS,
        toType: 'Class',
        toCode: row.classCode,
        relationshipType: 'child_of',
      })
    }
  }

  writeTSV(
    join(REL_DIR, 'GS1.Hierarchy.tsv'),
    hierarchyRelationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )

  // Write brick-attribute relationships
  const brickAttributeRelationships: Record<string, string>[] = []
  const seenBrickAttr = new Set<string>()

  for (const row of data) {
    if (row.brickCode && row.attributeCode) {
      const key = `${row.brickCode}-${row.attributeCode}`
      if (!seenBrickAttr.has(key)) {
        seenBrickAttr.add(key)
        brickAttributeRelationships.push({
          fromNs: NS,
          fromType: 'Brick',
          fromCode: row.brickCode,
          toNs: NS,
          toType: 'Attribute',
          toCode: row.attributeCode,
          relationshipType: 'has_attribute',
        })
      }
    }
  }

  writeTSV(
    join(REL_DIR, 'GS1.Brick.Attribute.tsv'),
    brickAttributeRelationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

function transformVocabulary(): void {
  console.log('Transforming GS1 Vocabulary...')
  try {
    const data = parseTSV<VocabularyRow>(join(SOURCE_DIR, 'GS1.Vocabulary.tsv'))

    const records: StandardRecord[] = data
      .filter(row => row.id && row.label)
      .map(row => ({
        ns: NS,
        type: row.type || 'Vocabulary',
        id: toWikipediaStyleId(row.label),
        name: row.label,
        description: cleanDescription(row.description),
        code: row.id,
      }))

    writeStandardTSV(join(DATA_DIR, 'GS1.Vocabulary.tsv'), records)
  } catch (e) {
    console.log('GS1.Vocabulary.tsv not found, skipping...')
  }
}

function transformLocationTypes(): void {
  console.log('Transforming GS1 Location Types...')
  try {
    const data = parseTSV<LocationTypeRow>(join(SOURCE_DIR, 'GS1.Location.Types.tsv'))

    const records: StandardRecord[] = data
      .filter(row => row.id && row.label)
      .map(row => ({
        ns: NS,
        type: 'LocationType',
        id: toWikipediaStyleId(row.label),
        name: row.label,
        description: cleanDescription(row.description),
        code: row.id,
      }))

    writeStandardTSV(join(DATA_DIR, 'GS1.LocationTypes.tsv'), records)

    // Write location type hierarchy
    const relationships: Record<string, string>[] = data
      .filter(row => row.parentType)
      .map(row => ({
        fromNs: NS,
        fromType: 'LocationType',
        fromCode: row.id,
        toNs: NS,
        toType: 'LocationType',
        toCode: row.parentType,
        relationshipType: 'subtype_of',
      }))

    writeTSV(
      join(REL_DIR, 'GS1.LocationType.LocationType.tsv'),
      relationships,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
    )
  } catch (e) {
    console.log('GS1.Location.Types.tsv not found, skipping...')
  }
}

function transformBusinessSteps(): void {
  console.log('Transforming GS1 Business Steps...')
  try {
    const data = parseTSV<BusinessStepRow>(join(SOURCE_DIR, 'GS1.BusinessStep.VerbMapping.tsv'))

    const records: StandardRecord[] = data
      .filter(row => row.businessStep)
      .map(row => ({
        ns: NS,
        type: 'BusinessStep',
        id: toWikipediaStyleId(row.businessStep),
        name: row.businessStep,
        description: cleanDescription(`${row.verb} ${row.noun}. ${row.description || ''}`),
        code: row.businessStep.toLowerCase(),
      }))

    writeStandardTSV(join(DATA_DIR, 'GS1.BusinessSteps.tsv'), records)
  } catch (e) {
    console.log('GS1.BusinessStep.VerbMapping.tsv not found, skipping...')
  }
}

function transformDispositions(): void {
  console.log('Transforming GS1 Dispositions...')
  const sourceFile = join(SOURCE_DIR, 'GS1.Disposition.VerbMapping.tsv')

  if (!existsSync(sourceFile)) {
    console.log('GS1.Disposition.VerbMapping.tsv not found, skipping...')
    return
  }

  try {
    const data = parseTSV<DispositionRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.disposition)
      .map(row => ({
        ns: NS,
        type: 'Disposition',
        id: toWikipediaStyleId(row.disposition),
        name: row.disposition,
        description: cleanDescription(row.description || `${row.verb} action`),
        code: row.disposition.toLowerCase(),
      }))

    writeStandardTSV(join(DATA_DIR, 'GS1.Dispositions.tsv'), records)
  } catch (e) {
    console.log('Error processing dispositions:', e)
  }
}

function transformIdentifiers(): void {
  console.log('Transforming GS1 Identifiers...')
  const sourceFile = join(SOURCE_DIR, 'GS1.Identifier.ClassMapping.tsv')

  if (!existsSync(sourceFile)) {
    console.log('GS1.Identifier.ClassMapping.tsv not found, skipping...')
    return
  }

  try {
    const data = parseTSV<IdentifierRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.identifier)
      .map(row => ({
        ns: NS,
        type: 'IdentifierType',
        id: row.identifier,
        name: row.identifier,
        description: cleanDescription(row.description || ''),
        code: row.identifier,
      }))

    writeStandardTSV(join(DATA_DIR, 'GS1.IdentifierTypes.tsv'), records)
  } catch (e) {
    console.log('Error processing identifiers:', e)
  }
}

function transformGLNFunctionalTypes(): void {
  console.log('Transforming GS1 GLN Functional Types...')
  const sourceFile = join(SOURCE_DIR, 'GS1.GLN.FunctionalTypes.tsv')

  if (!existsSync(sourceFile)) {
    console.log('GS1.GLN.FunctionalTypes.tsv not found, skipping...')
    return
  }

  try {
    const data = parseTSV<GLNFunctionalTypeRow>(sourceFile)

    const records: StandardRecord[] = data
      .filter(row => row.id && row.label)
      .map(row => ({
        ns: NS,
        type: 'GLNFunctionalType',
        id: toWikipediaStyleId(row.label),
        name: row.label,
        description: cleanDescription(row.description || ''),
        code: row.id,
      }))

    writeStandardTSV(join(DATA_DIR, 'GS1.GLNFunctionalTypes.tsv'), records)
  } catch (e) {
    console.log('Error processing GLN functional types:', e)
  }
}

export async function transformGS1(): Promise<void> {
  console.log('=== GS1 Transformation ===')
  ensureOutputDirs()

  transformGPCHierarchy()
  transformVocabulary()
  transformLocationTypes()
  transformBusinessSteps()
  transformDispositions()
  transformIdentifiers()
  transformGLNFunctionalTypes()

  console.log('=== GS1 Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformGS1()
}
