/**
 * Education Standards Transformation Script
 * Transforms education data (ISCED, CEDS, CASE) into standard TSV format
 *
 * Data sources:
 * - ISCED: UNESCO International Standard Classification of Education
 * - CEDS: Common Education Data Standards (U.S. Department of Education)
 * - CASE: Competency and Academic Standards Exchange (IMS Global)
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import {
  NAMESPACES,
  StandardRecord,
  RelationshipRecord,
  parseTSV,
  parseCSV,
  writeStandardTSV,
  writeRelationshipTSV,
  toWikipediaStyleId,
  cleanDescription,
  getSourcePath,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
  getAggregationsForType,
} from './utils'

// Use proper education namespace
const EDUCATION_NS = NAMESPACES.ISCED // education.org.ai
const SOURCE_DIR = getSourcePath('Education')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// ISCED Interfaces
interface ISCEDLevel {
  code: string
  name: string
  description: string
  ageRange?: string
  duration?: string
  orientation?: string
}

interface ISCEDField {
  code: string
  name: string
  broadField?: string
  narrowField?: string
  detailedField?: string
}

interface ISCEDProgramme {
  code: string
  orientation: string
  description: string
  applicableLevels?: string
  emphasis?: string
}

// CEDS Interfaces
interface CEDSElement {
  elementId: string
  name: string
  definition: string
  domain: string
  entity: string
  dataType: string
  optionSet: string
}

interface CEDSOptionSet {
  optionSetName: string
  code: string
  description: string
  definition: string
  domain: string
}

interface CEDSDomain {
  code: string
  name: string
  description: string
  category: string
  focus: string
}

interface CEDSEntity {
  code: string
  name: string
  description: string
  domain: string
  superType?: string
  category?: string
}

// CASE Interfaces
interface CASEFramework {
  code: string
  name: string
  description: string
  creator?: string
  publisher?: string
  subject?: string
  educationLevel?: string
  jurisdiction?: string
  language?: string
  adoptionStatus?: string
}

interface CASEStandard {
  code: string
  uri: string
  identifier: string
  humanCodingScheme: string
  listEnumeration?: string
  fullStatement: string
  abbreviatedStatement?: string
  conceptKeywords?: string[]
  language?: string
  educationLevel?: string[]
  subject?: string
  framework: string
  parent?: string
  children?: string[]
}

interface CASECompetency {
  code: string
  uri: string
  identifier: string
  humanCodingScheme: string
  competencyText: string
  competencyCategory?: string
  competencyLabel?: string
  conceptKeywords?: string[]
  language?: string
  educationLevel?: string[]
  framework: string
  subject?: string
  proficiencyLevel?: string
  bloomsLevel?: string
  dokLevel?: string
}

interface CASEAssociation {
  code: string
  uri: string
  identifier: string
  associationType: string
  originNodeURI: string
  destinationNodeURI: string
  sequenceNumber?: string
  weight?: string
  connectionCitation?: string
}

/**
 * Transform ISCED Education Levels
 */
function transformISCEDLevels(): void {
  console.log('Transforming ISCED Education Levels...')

  // Read from source TSV file
  const sourcePath = join(SOURCE_DIR, 'ISCED', 'Levels.tsv')
  const levels = parseTSV<ISCEDLevel>(sourcePath)

  const levelRecords: StandardRecord[] = levels.map(level => ({
    ns: EDUCATION_NS,
    type: 'ISCEDLevel',
    id: `ISCED_Level_${level.code.replace(/\//g, '_')}`,
    name: level.name,
    description: cleanDescription(level.description),
    code: level.code,
    includedIn: getAggregationsForType('Level'),
  }))

  writeStandardTSV(join(DATA_DIR, 'Education.ISCED.Levels.tsv'), levelRecords)
}

/**
 * Transform ISCED Fields of Education
 */
function transformISCEDFields(): void {
  console.log('Transforming ISCED Fields of Education...')

  // Read from source TSV file
  const sourcePath = join(SOURCE_DIR, 'ISCED', 'Fields.tsv')
  const fields = parseTSV<ISCEDField>(sourcePath)

  const fieldRecords: StandardRecord[] = fields.map(field => {
    // Build description from hierarchical field structure
    let description = ''
    if (field.broadField) {
      description = field.broadField
    }
    if (field.narrowField && field.narrowField !== field.broadField) {
      description += description ? ` > ${field.narrowField}` : field.narrowField
    }
    if (field.detailedField && field.detailedField !== field.narrowField) {
      description += description ? ` > ${field.detailedField}` : field.detailedField
    }

    return {
      ns: EDUCATION_NS,
      type: 'ISCEDField',
      id: `ISCED_Field_${field.code}`,
      name: field.name,
      description: cleanDescription(description || field.name),
      code: field.code,
      includedIn: getAggregationsForType('Field'),
    }
  })

  writeStandardTSV(join(DATA_DIR, 'Education.ISCED.Fields.tsv'), fieldRecords)
}

/**
 * Transform ISCED Programme Orientations
 */
function transformISCEDProgrammes(): void {
  console.log('Transforming ISCED Programme Orientations...')

  // Read from source TSV file
  const sourcePath = join(SOURCE_DIR, 'ISCED', 'Programmes.tsv')
  const programmes = parseTSV<ISCEDProgramme>(sourcePath)

  const programmeRecords: StandardRecord[] = programmes.map(programme => ({
    ns: EDUCATION_NS,
    type: 'ISCEDProgramme',
    id: `ISCED_Programme_${programme.code}`,
    name: programme.orientation,
    description: cleanDescription(programme.description),
    code: programme.code,
    includedIn: getAggregationsForType('Level'),
  }))

  writeStandardTSV(join(DATA_DIR, 'Education.ISCED.Programmes.tsv'), programmeRecords)
}

/**
 * Transform CEDS Data Elements
 */
function transformCEDSElements(): void {
  console.log('Transforming CEDS Data Elements...')

  // Read from source TSV file
  const sourcePath = join(SOURCE_DIR, 'CEDS', 'Elements.tsv')
  const elements = parseTSV<CEDSElement>(sourcePath)

  const elementRecords: StandardRecord[] = elements.map(element => ({
    ns: EDUCATION_NS,
    type: 'CEDSElement',
    id: `CEDS_Element_${element.elementId}`,
    name: element.name,
    description: cleanDescription(element.definition),
    code: element.elementId,
    includedIn: getAggregationsForType('Element'),
  }))

  writeStandardTSV(join(DATA_DIR, 'Education.CEDS.Elements.tsv'), elementRecords)
}

/**
 * Transform CEDS Domains
 */
function transformCEDSDomains(): void {
  console.log('Transforming CEDS Domains...')

  // Read from source TSV file
  const sourcePath = join(SOURCE_DIR, 'CEDS', 'Domains.tsv')
  const domains = parseTSV<CEDSDomain>(sourcePath)

  const domainRecords: StandardRecord[] = domains.map(domain => ({
    ns: EDUCATION_NS,
    type: 'CEDSDomain',
    id: `CEDS_Domain_${domain.code}`,
    name: domain.name,
    description: cleanDescription(domain.description),
    code: domain.code,
    includedIn: getAggregationsForType('Field'),
  }))

  writeStandardTSV(join(DATA_DIR, 'Education.CEDS.Domains.tsv'), domainRecords)
}

/**
 * Transform CEDS Entities
 */
function transformCEDSEntities(): void {
  console.log('Transforming CEDS Entities...')

  // Read from source TSV file
  const sourcePath = join(SOURCE_DIR, 'CEDS', 'Entities.tsv')
  const entities = parseTSV<CEDSEntity>(sourcePath)

  const entityRecords: StandardRecord[] = entities.map(entity => ({
    ns: EDUCATION_NS,
    type: 'CEDSEntity',
    id: `CEDS_Entity_${entity.code}`,
    name: entity.name,
    description: cleanDescription(entity.description),
    code: entity.code,
    includedIn: getAggregationsForType('Type'),
  }))

  writeStandardTSV(join(DATA_DIR, 'Education.CEDS.Entities.tsv'), entityRecords)
}

/**
 * Transform CEDS Option Sets
 */
function transformCEDSOptionSets(): void {
  console.log('Transforming CEDS Option Sets...')

  // Read from source TSV file
  const sourcePath = join(SOURCE_DIR, 'CEDS', 'OptionSets.tsv')
  const optionSets = parseTSV<CEDSOptionSet>(sourcePath)

  // Group by option set name to create unique option sets
  const uniqueOptionSets = new Map<string, CEDSOptionSet>()

  for (const option of optionSets) {
    if (!uniqueOptionSets.has(option.optionSetName)) {
      uniqueOptionSets.set(option.optionSetName, option)
    }
  }

  const optionSetRecords: StandardRecord[] = Array.from(uniqueOptionSets.values()).map(optionSet => ({
    ns: EDUCATION_NS,
    type: 'CEDSOptionSet',
    id: `CEDS_OptionSet_${optionSet.optionSetName}`,
    name: optionSet.optionSetName,
    description: cleanDescription(optionSet.description || optionSet.definition),
    code: optionSet.optionSetName,
    includedIn: getAggregationsForType('Code'),
  }))

  writeStandardTSV(join(DATA_DIR, 'Education.CEDS.OptionSets.tsv'), optionSetRecords)
}

/**
 * Transform CASE Frameworks
 */
function transformCASEFrameworks(): void {
  console.log('Transforming CASE Frameworks...')

  // Read from source TSV file
  const sourcePath = join(SOURCE_DIR, 'CASE', 'Frameworks.tsv')
  const frameworks = parseTSV<CASEFramework>(sourcePath)

  const frameworkRecords: StandardRecord[] = frameworks.map(framework => ({
    ns: EDUCATION_NS,
    type: 'CASEFramework',
    id: `CASE_Framework_${framework.code}`,
    name: framework.name,
    description: cleanDescription(framework.description),
    code: framework.code,
    includedIn: getAggregationsForType('Framework'),
  }))

  writeStandardTSV(join(DATA_DIR, 'Education.CASE.Frameworks.tsv'), frameworkRecords)
}

/**
 * Transform CASE Competency Types
 */
function transformCASECompetencyTypes(): void {
  console.log('Transforming CASE Competency Types...')

  // Define interface for competency type
  interface CASECompetencyType {
    code: string
    name: string
    description: string
    usage: string
    examples: string
  }

  // Read from source TSV file
  const sourcePath = join(SOURCE_DIR, 'CASE', 'CompetencyTypes.tsv')
  const competencyTypes = parseTSV<CASECompetencyType>(sourcePath)

  const competencyTypeRecords: StandardRecord[] = competencyTypes.map(type => ({
    ns: EDUCATION_NS,
    type: 'CASECompetencyType',
    id: `CASE_CompetencyType_${type.code}`,
    name: type.name,
    description: cleanDescription(type.description),
    code: type.code,
  }))

  writeStandardTSV(join(DATA_DIR, 'Education.CASE.CompetencyTypes.tsv'), competencyTypeRecords)
}

/**
 * Transform CASE Association Types
 */
function transformCASEAssociationTypes(): void {
  console.log('Transforming CASE Association Types...')

  // Define interface for association type
  interface CASEAssociationType {
    code: string
    name: string
    description: string
    direction: string
    usage: string
    examples: string
  }

  // Read from source TSV file
  const sourcePath = join(SOURCE_DIR, 'CASE', 'AssociationTypes.tsv')
  const associationTypes = parseTSV<CASEAssociationType>(sourcePath)

  const associationTypeRecords: StandardRecord[] = associationTypes.map(type => ({
    ns: EDUCATION_NS,
    type: 'CASEAssociationType',
    id: `CASE_AssociationType_${type.code}`,
    name: type.name,
    description: cleanDescription(type.description),
    code: type.code,
  }))

  writeStandardTSV(join(DATA_DIR, 'Education.CASE.AssociationTypes.tsv'), associationTypeRecords)
}

/**
 * Main transformation function
 */
export async function transformEducation(): Promise<void> {
  console.log('=== Education Standards Transformation ===\n')
  ensureOutputDirs()

  // Transform ISCED standards
  transformISCEDLevels()
  transformISCEDFields()
  transformISCEDProgrammes()

  // Transform CEDS standards
  transformCEDSDomains()
  transformCEDSEntities()
  transformCEDSElements()
  transformCEDSOptionSets()

  // Transform CASE frameworks
  transformCASEFrameworks()
  transformCASECompetencyTypes()
  transformCASEAssociationTypes()

  console.log('\n=== Education Transformation Complete ===')
}

// Run if called directly
if (import.meta.main) {
  transformEducation().catch(console.error)
}
