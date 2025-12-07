/**
 * Healthcare HL7 FHIR Standards Transformation Script
 * Transforms FHIR R4/R5 data into standard TSV format
 *
 * Data sources:
 * - FHIR R4 Specification: https://www.hl7.org/fhir/R4/
 * - FHIR R5 Specification: https://www.hl7.org/fhir/R5/
 * - FHIR Definitions (JSON): https://hl7.org/fhir/downloads.html
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import {
  NAMESPACES,
  StandardRecord,
  RelationshipRecord,
  writeStandardTSV,
  writeRelationshipTSV,
  toWikipediaStyleId,
  cleanDescription,
  getSourcePath,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
} from './utils'

const NS = 'fhir.org.ai'
const SOURCE_DIR = getSourcePath('Healthcare/FHIR')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// FHIR StructureDefinition interface
interface FHIRStructureDefinition {
  resourceType: string
  id: string
  url: string
  version?: string
  name: string
  title?: string
  status: string
  experimental?: boolean
  date?: string
  publisher?: string
  description?: string
  purpose?: string
  copyright?: string
  fhirVersion?: string
  kind: string
  abstract: boolean
  type: string
  baseDefinition?: string
  derivation?: string
  snapshot?: {
    element: FHIRElement[]
  }
  differential?: {
    element: FHIRElement[]
  }
}

interface FHIRElement {
  id: string
  path: string
  short?: string
  definition?: string
  min: number
  max: string
  type?: Array<{
    code: string
    profile?: string[]
    targetProfile?: string[]
  }>
  meaningWhenMissing?: string
  isModifier?: boolean
  isSummary?: boolean
  binding?: {
    strength: string
    valueSet?: string
    description?: string
  }
}

// FHIR ValueSet interface
interface FHIRValueSet {
  resourceType: string
  id: string
  url: string
  version?: string
  name: string
  title?: string
  status: string
  experimental?: boolean
  publisher?: string
  description?: string
  purpose?: string
  copyright?: string
  compose?: {
    include: Array<{
      system?: string
      concept?: Array<{
        code: string
        display?: string
      }>
      filter?: any[]
      valueSet?: string[]
    }>
    exclude?: any[]
  }
  expansion?: {
    timestamp: string
    total?: number
    contains?: Array<{
      system: string
      code: string
      display?: string
    }>
  }
}

// FHIR CodeSystem interface
interface FHIRCodeSystem {
  resourceType: string
  id: string
  url: string
  version?: string
  name: string
  title?: string
  status: string
  experimental?: boolean
  publisher?: string
  description?: string
  purpose?: string
  copyright?: string
  caseSensitive?: boolean
  valueSet?: string
  hierarchyMeaning?: string
  compositional?: boolean
  versionNeeded?: boolean
  content: string
  count?: number
  property?: Array<{
    code: string
    uri?: string
    description?: string
    type: string
  }>
  concept?: FHIRConcept[]
}

interface FHIRConcept {
  code: string
  display?: string
  definition?: string
  designation?: any[]
  property?: Array<{
    code: string
    valueCode?: string
    valueString?: string
    valueCoding?: any
  }>
  concept?: FHIRConcept[]
}

// FHIR SearchParameter interface
interface FHIRSearchParameter {
  resourceType: string
  id: string
  url: string
  version?: string
  name: string
  status: string
  experimental?: boolean
  publisher?: string
  description?: string
  purpose?: string
  code: string
  base: string[]
  type: string
  expression?: string
  xpath?: string
  xpathUsage?: string
  target?: string[]
  comparator?: string[]
  modifier?: string[]
  chain?: string[]
  component?: Array<{
    definition: string
    expression: string
  }>
}

// FHIR OperationDefinition interface
interface FHIROperationDefinition {
  resourceType: string
  id: string
  url: string
  version?: string
  name: string
  title?: string
  status: string
  kind: string
  experimental?: boolean
  publisher?: string
  description?: string
  purpose?: string
  affectsState?: boolean
  code: string
  comment?: string
  base?: string
  resource?: string[]
  system: boolean
  type: boolean
  instance: boolean
  inputProfile?: string
  outputProfile?: string
  parameter?: Array<{
    name: string
    use: string
    min: number
    max: string
    documentation?: string
    type?: string
    targetProfile?: string[]
    searchType?: string
    binding?: {
      strength: string
      valueSet: string
    }
    part?: any[]
  }>
}

// FHIR Bundle interface for parsing JSON bundles
interface FHIRBundle {
  resourceType: string
  type: string
  entry?: Array<{
    fullUrl?: string
    resource: any
  }>
}

/**
 * Transform FHIR Resources from StructureDefinition files
 */
function transformResources(): void {
  console.log('Transforming FHIR Resources...')

  const definitionsFile = join(SOURCE_DIR, 'definitions.json')

  if (!existsSync(definitionsFile)) {
    console.log('definitions.json not found, skipping Resources...')
    return
  }

  try {
    const content = readFileSync(definitionsFile, 'utf-8')
    const bundle: FHIRBundle = JSON.parse(content)

    const resources: StandardRecord[] = []
    const relationships: RelationshipRecord[] = []

    if (bundle.entry) {
      for (const entry of bundle.entry) {
        const sd = entry.resource as FHIRStructureDefinition

        if (sd.resourceType !== 'StructureDefinition') continue
        if (sd.kind !== 'resource') continue
        if (sd.derivation === 'constraint') continue // Skip profiles here

        const id = toWikipediaStyleId(sd.name)

        resources.push({
          ns: NS,
          type: 'Resource',
          id,
          name: sd.name,
          description: cleanDescription(sd.description || sd.title || ''),
          code: sd.id,
        })

        // Create relationship to base definition if it exists
        if (sd.baseDefinition) {
          const baseType = sd.baseDefinition.split('/').pop() || ''
          if (baseType) {
            relationships.push({
              fromNs: NS,
              fromType: 'Resource',
              fromId: id,
              toNs: NS,
              toType: 'Resource',
              toId: toWikipediaStyleId(baseType),
              relationshipType: 'extends',
            })
          }
        }
      }
    }

    writeStandardTSV(join(DATA_DIR, 'FHIR.Resources.tsv'), resources)
    if (relationships.length > 0) {
      writeRelationshipTSV(join(REL_DIR, 'FHIR.Resource.Resource.tsv'), relationships)
    }
  } catch (e) {
    console.error('Error transforming Resources:', e)
  }
}

/**
 * Transform FHIR Data Types from StructureDefinition files
 */
function transformDataTypes(): void {
  console.log('Transforming FHIR Data Types...')

  const definitionsFile = join(SOURCE_DIR, 'definitions.json')

  if (!existsSync(definitionsFile)) {
    console.log('definitions.json not found, skipping Data Types...')
    return
  }

  try {
    const content = readFileSync(definitionsFile, 'utf-8')
    const bundle: FHIRBundle = JSON.parse(content)

    const dataTypes: StandardRecord[] = []
    const relationships: RelationshipRecord[] = []

    if (bundle.entry) {
      for (const entry of bundle.entry) {
        const sd = entry.resource as FHIRStructureDefinition

        if (sd.resourceType !== 'StructureDefinition') continue
        if (sd.kind !== 'primitive-type' && sd.kind !== 'complex-type') continue

        const id = toWikipediaStyleId(sd.name)

        dataTypes.push({
          ns: NS,
          type: 'DataType',
          id,
          name: sd.name,
          description: cleanDescription(sd.description || sd.title || ''),
          code: sd.id,
        })

        // Create relationship to base definition
        if (sd.baseDefinition) {
          const baseType = sd.baseDefinition.split('/').pop() || ''
          if (baseType) {
            relationships.push({
              fromNs: NS,
              fromType: 'DataType',
              fromId: id,
              toNs: NS,
              toType: 'DataType',
              toId: toWikipediaStyleId(baseType),
              relationshipType: 'extends',
            })
          }
        }
      }
    }

    writeStandardTSV(join(DATA_DIR, 'FHIR.DataTypes.tsv'), dataTypes)
    if (relationships.length > 0) {
      writeRelationshipTSV(join(REL_DIR, 'FHIR.DataType.DataType.tsv'), relationships)
    }
  } catch (e) {
    console.error('Error transforming Data Types:', e)
  }
}

/**
 * Transform FHIR ValueSets
 */
function transformValueSets(): void {
  console.log('Transforming FHIR ValueSets...')

  const valueSetsFile = join(SOURCE_DIR, 'valuesets.json')

  if (!existsSync(valueSetsFile)) {
    console.log('valuesets.json not found, skipping ValueSets...')
    return
  }

  try {
    const content = readFileSync(valueSetsFile, 'utf-8')
    const bundle: FHIRBundle = JSON.parse(content)

    const valueSets: StandardRecord[] = []
    const relationships: RelationshipRecord[] = []

    if (bundle.entry) {
      for (const entry of bundle.entry) {
        const vs = entry.resource as FHIRValueSet

        if (vs.resourceType !== 'ValueSet') continue

        const id = toWikipediaStyleId(vs.name)

        valueSets.push({
          ns: NS,
          type: 'ValueSet',
          id,
          name: vs.name,
          description: cleanDescription(vs.description || vs.title || ''),
          code: vs.id,
        })

        // Create relationships to included CodeSystems
        if (vs.compose?.include) {
          for (const include of vs.compose.include) {
            if (include.system) {
              const systemId = include.system.split('/').pop() || ''
              if (systemId) {
                relationships.push({
                  fromNs: NS,
                  fromType: 'ValueSet',
                  fromId: id,
                  toNs: NS,
                  toType: 'CodeSystem',
                  toId: toWikipediaStyleId(systemId),
                  relationshipType: 'includes_codes_from',
                })
              }
            }
          }
        }
      }
    }

    writeStandardTSV(join(DATA_DIR, 'FHIR.ValueSets.tsv'), valueSets)
    if (relationships.length > 0) {
      writeRelationshipTSV(join(REL_DIR, 'FHIR.ValueSet.CodeSystem.tsv'), relationships)
    }
  } catch (e) {
    console.error('Error transforming ValueSets:', e)
  }
}

/**
 * Transform FHIR CodeSystems
 */
function transformCodeSystems(): void {
  console.log('Transforming FHIR CodeSystems...')

  const codeSystemsFile = join(SOURCE_DIR, 'codesystems.json')

  if (!existsSync(codeSystemsFile)) {
    console.log('codesystems.json not found, skipping CodeSystems...')
    return
  }

  try {
    const content = readFileSync(codeSystemsFile, 'utf-8')
    const bundle: FHIRBundle = JSON.parse(content)

    const codeSystems: StandardRecord[] = []

    if (bundle.entry) {
      for (const entry of bundle.entry) {
        const cs = entry.resource as FHIRCodeSystem

        if (cs.resourceType !== 'CodeSystem') continue

        const id = toWikipediaStyleId(cs.name)

        codeSystems.push({
          ns: NS,
          type: 'CodeSystem',
          id,
          name: cs.name,
          description: cleanDescription(cs.description || cs.title || ''),
          code: cs.id,
        })
      }
    }

    writeStandardTSV(join(DATA_DIR, 'FHIR.CodeSystems.tsv'), codeSystems)
  } catch (e) {
    console.error('Error transforming CodeSystems:', e)
  }
}

/**
 * Transform FHIR Profiles
 */
function transformProfiles(): void {
  console.log('Transforming FHIR Profiles...')

  const profilesFile = join(SOURCE_DIR, 'profiles-resources.json')

  if (!existsSync(profilesFile)) {
    console.log('profiles-resources.json not found, skipping Profiles...')
    return
  }

  try {
    const content = readFileSync(profilesFile, 'utf-8')
    const bundle: FHIRBundle = JSON.parse(content)

    const profiles: StandardRecord[] = []
    const relationships: RelationshipRecord[] = []

    if (bundle.entry) {
      for (const entry of bundle.entry) {
        const sd = entry.resource as FHIRStructureDefinition

        if (sd.resourceType !== 'StructureDefinition') continue
        if (sd.derivation !== 'constraint') continue

        const id = toWikipediaStyleId(sd.name)

        profiles.push({
          ns: NS,
          type: 'Profile',
          id,
          name: sd.name,
          description: cleanDescription(sd.description || sd.title || ''),
          code: sd.id,
        })

        // Create relationship to base definition
        if (sd.baseDefinition) {
          const baseType = sd.baseDefinition.split('/').pop() || ''
          if (baseType) {
            relationships.push({
              fromNs: NS,
              fromType: 'Profile',
              fromId: id,
              toNs: NS,
              toType: 'Resource',
              toId: toWikipediaStyleId(baseType),
              relationshipType: 'constrains',
            })
          }
        }
      }
    }

    writeStandardTSV(join(DATA_DIR, 'FHIR.Profiles.tsv'), profiles)
    if (relationships.length > 0) {
      writeRelationshipTSV(join(REL_DIR, 'FHIR.Profile.Resource.tsv'), relationships)
    }
  } catch (e) {
    console.error('Error transforming Profiles:', e)
  }
}

/**
 * Transform FHIR Extensions
 */
function transformExtensions(): void {
  console.log('Transforming FHIR Extensions...')

  const extensionsFile = join(SOURCE_DIR, 'extensions.json')

  if (!existsSync(extensionsFile)) {
    console.log('extensions.json not found, skipping Extensions...')
    return
  }

  try {
    const content = readFileSync(extensionsFile, 'utf-8')
    const bundle: FHIRBundle = JSON.parse(content)

    const extensions: StandardRecord[] = []

    if (bundle.entry) {
      for (const entry of bundle.entry) {
        const sd = entry.resource as FHIRStructureDefinition

        if (sd.resourceType !== 'StructureDefinition') continue
        if (sd.type !== 'Extension') continue

        const id = toWikipediaStyleId(sd.name)

        extensions.push({
          ns: NS,
          type: 'Extension',
          id,
          name: sd.name,
          description: cleanDescription(sd.description || sd.title || ''),
          code: sd.id,
        })
      }
    }

    writeStandardTSV(join(DATA_DIR, 'FHIR.Extensions.tsv'), extensions)
  } catch (e) {
    console.error('Error transforming Extensions:', e)
  }
}

/**
 * Transform FHIR SearchParameters
 */
function transformSearchParameters(): void {
  console.log('Transforming FHIR SearchParameters...')

  const searchParamsFile = join(SOURCE_DIR, 'search-parameters.json')

  if (!existsSync(searchParamsFile)) {
    console.log('search-parameters.json not found, skipping SearchParameters...')
    return
  }

  try {
    const content = readFileSync(searchParamsFile, 'utf-8')
    const bundle: FHIRBundle = JSON.parse(content)

    const searchParams: StandardRecord[] = []
    const relationships: RelationshipRecord[] = []

    if (bundle.entry) {
      for (const entry of bundle.entry) {
        const sp = entry.resource as FHIRSearchParameter

        if (sp.resourceType !== 'SearchParameter') continue

        const id = toWikipediaStyleId(sp.name)

        searchParams.push({
          ns: NS,
          type: 'SearchParameter',
          id,
          name: sp.name,
          description: cleanDescription(sp.description || ''),
          code: sp.code,
        })

        // Create relationships to base resources
        if (sp.base) {
          for (const baseResource of sp.base) {
            relationships.push({
              fromNs: NS,
              fromType: 'SearchParameter',
              fromId: id,
              toNs: NS,
              toType: 'Resource',
              toId: toWikipediaStyleId(baseResource),
              relationshipType: 'applies_to',
            })
          }
        }
      }
    }

    writeStandardTSV(join(DATA_DIR, 'FHIR.SearchParameters.tsv'), searchParams)
    if (relationships.length > 0) {
      writeRelationshipTSV(join(REL_DIR, 'FHIR.SearchParameter.Resource.tsv'), relationships)
    }
  } catch (e) {
    console.error('Error transforming SearchParameters:', e)
  }
}

/**
 * Transform FHIR Operations
 */
function transformOperations(): void {
  console.log('Transforming FHIR Operations...')

  const operationsFile = join(SOURCE_DIR, 'operations.json')

  if (!existsSync(operationsFile)) {
    console.log('operations.json not found, skipping Operations...')
    return
  }

  try {
    const content = readFileSync(operationsFile, 'utf-8')
    const bundle: FHIRBundle = JSON.parse(content)

    const operations: StandardRecord[] = []
    const relationships: RelationshipRecord[] = []

    if (bundle.entry) {
      for (const entry of bundle.entry) {
        const op = entry.resource as FHIROperationDefinition

        if (op.resourceType !== 'OperationDefinition') continue

        const id = toWikipediaStyleId(op.name)

        operations.push({
          ns: NS,
          type: 'Operation',
          id,
          name: op.name,
          description: cleanDescription(op.description || op.title || ''),
          code: op.code,
        })

        // Create relationships to applicable resources
        if (op.resource) {
          for (const resource of op.resource) {
            relationships.push({
              fromNs: NS,
              fromType: 'Operation',
              fromId: id,
              toNs: NS,
              toType: 'Resource',
              toId: toWikipediaStyleId(resource),
              relationshipType: 'operates_on',
            })
          }
        }
      }
    }

    writeStandardTSV(join(DATA_DIR, 'FHIR.Operations.tsv'), operations)
    if (relationships.length > 0) {
      writeRelationshipTSV(join(REL_DIR, 'FHIR.Operation.Resource.tsv'), relationships)
    }
  } catch (e) {
    console.error('Error transforming Operations:', e)
  }
}

/**
 * Main transformation function
 */
export async function transformHealthcareFHIR(): Promise<void> {
  console.log('=== Healthcare HL7 FHIR Standards Transformation ===\n')
  ensureOutputDirs()

  transformResources()
  transformDataTypes()
  transformValueSets()
  transformCodeSystems()
  transformProfiles()
  transformExtensions()
  transformSearchParameters()
  transformOperations()

  console.log('\n=== FHIR Transformation Complete ===')
}

// Run if called directly
if (import.meta.main) {
  transformHealthcareFHIR().catch(console.error)
}
