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
  parseCSV,
  writeStandardTSV,
  writeRelationshipTSV,
  toWikipediaStyleId,
  cleanDescription,
  getSourcePath,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
} from './utils'

// Add Education namespace
const EDUCATION_NS = 'standards.org.ai'
const SOURCE_DIR = getSourcePath('Education')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// ISCED Interfaces
interface ISCEDLevel {
  code: string
  name: string
  description: string
  category: string
  orientation?: string
  ageRange?: string
  durationYears?: string
  entryRequirements?: string
  typicalOutcomes?: string
}

interface ISCEDField {
  code: string
  name: string
  description: string
  broadField?: string
  narrowField?: string
  detailedField?: string
  level?: string
  examples?: string[]
  exclusions?: string[]
}

interface ISCEDProgramme {
  code: string
  name: string
  description: string
  orientation: string
  level: string
  field?: string
  duration?: string
  credits?: string
  completionLevel?: string
}

// CEDS Interfaces
interface CEDSElement {
  code: string
  name: string
  definition: string
  dataType: string
  domain?: string
  entity?: string
  optionSet?: string
  usageNotes?: string
  businessRules?: string
  technicalNotes?: string
  source?: string
  version?: string
  status?: string
}

interface CEDSOptionSet {
  code: string
  name: string
  definition: string
  optionSetType?: string
  values?: Array<{
    code: string
    value: string
    definition: string
  }>
  source?: string
  version?: string
  status?: string
}

interface CEDSDomain {
  code: string
  name: string
  description: string
  category?: string
  entities?: string[]
  elements?: string[]
  version?: string
}

interface CEDSEntity {
  code: string
  name: string
  definition: string
  domain?: string
  attributes?: string[]
  relationships?: Array<{
    type: string
    relatedEntity: string
    cardinality: string
  }>
  primaryKey?: string
  version?: string
}

// CASE Interfaces
interface CASEFramework {
  code: string
  uri: string
  identifier: string
  title: string
  description: string
  creator?: string
  publisher?: string
  subject?: string[]
  educationLevel?: string[]
  language?: string
  version?: string
  adoptionStatus?: string
  statusStartDate?: string
  licenseURI?: string
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

  // ISCED 2011 Levels 0-8
  const levels: ISCEDLevel[] = [
    {
      code: '0',
      name: 'Early childhood education',
      description: 'Education designed to support early development in preparation for participation in school and society',
      category: 'Early childhood',
      ageRange: '0-5 years',
      durationYears: '1-3 years',
      entryRequirements: 'None',
      typicalOutcomes: 'Early literacy, numeracy, and socialization skills',
    },
    {
      code: '1',
      name: 'Primary education',
      description: 'Programmes designed to provide learning and educational activities designed to provide students with fundamental skills in reading, writing and mathematics',
      category: 'Primary',
      ageRange: '6-11 years',
      durationYears: '4-7 years',
      entryRequirements: 'ISCED level 0 or none',
      typicalOutcomes: 'Basic literacy, numeracy, and foundational knowledge',
    },
    {
      code: '2',
      name: 'Lower secondary education',
      description: 'Programmes designed to build on primary education and lay the foundation for lifelong learning',
      category: 'Secondary',
      ageRange: '12-14 years',
      durationYears: '2-5 years',
      entryRequirements: 'ISCED level 1',
      typicalOutcomes: 'Extended general education and some specialized learning',
    },
    {
      code: '3',
      name: 'Upper secondary education',
      description: 'Programmes designed to complete secondary education in preparation for tertiary education or provide skills relevant to employment',
      category: 'Secondary',
      ageRange: '15-17 years',
      durationYears: '2-5 years',
      entryRequirements: 'ISCED level 2',
      typicalOutcomes: 'Secondary school completion certificate or vocational qualification',
    },
    {
      code: '4',
      name: 'Post-secondary non-tertiary education',
      description: 'Programmes that provide learning experiences building on secondary education, preparing for labour market entry or tertiary education',
      category: 'Post-secondary',
      ageRange: '17+ years',
      durationYears: '0.5-3 years',
      entryRequirements: 'ISCED level 3',
      typicalOutcomes: 'Advanced vocational skills or preparation for tertiary education',
    },
    {
      code: '5',
      name: 'Short-cycle tertiary education',
      description: 'Short first tertiary programmes that are typically practically-based, occupationally-specific and prepare for labour market entry',
      category: 'Tertiary',
      ageRange: '18+ years',
      durationYears: '2-3 years',
      entryRequirements: 'ISCED level 3 or 4',
      typicalOutcomes: 'Associate degree, advanced diploma, or equivalent qualification',
    },
    {
      code: '6',
      name: "Bachelor's or equivalent level",
      description: 'First tertiary programmes designed to provide intermediate academic and/or professional knowledge, skills and competencies',
      category: 'Tertiary',
      ageRange: '18+ years',
      durationYears: '3-4 years',
      entryRequirements: 'ISCED level 3 or 4',
      typicalOutcomes: "Bachelor's degree or equivalent",
    },
    {
      code: '7',
      name: "Master's or equivalent level",
      description: 'Second tertiary programmes designed to provide advanced academic and/or professional knowledge, skills and competencies',
      category: 'Tertiary',
      ageRange: '22+ years',
      durationYears: '1-2 years',
      entryRequirements: 'ISCED level 6',
      typicalOutcomes: "Master's degree or equivalent",
    },
    {
      code: '8',
      name: 'Doctoral or equivalent level',
      description: 'Tertiary programmes designed to lead to an advanced research qualification',
      category: 'Tertiary',
      ageRange: '24+ years',
      durationYears: '3-5 years',
      entryRequirements: 'ISCED level 7',
      typicalOutcomes: 'PhD, doctorate, or equivalent research degree',
    },
  ]

  const levelRecords: StandardRecord[] = levels.map(level => ({
    ns: EDUCATION_NS,
    type: 'ISCEDLevel',
    id: `ISCED_${level.code}`,
    name: level.name,
    description: cleanDescription(level.description),
    code: level.code,
  }))

  writeStandardTSV(join(DATA_DIR, 'Education.ISCED.Levels.tsv'), levelRecords)
}

/**
 * Transform ISCED Fields of Education
 */
function transformISCEDFields(): void {
  console.log('Transforming ISCED Fields of Education...')

  // Sample ISCED-F 2013 Broad Fields
  const fields: ISCEDField[] = [
    {
      code: '00',
      name: 'Generic programmes and qualifications',
      description: 'Programmes and qualifications not further defined',
      broadField: 'Generic programmes and qualifications',
    },
    {
      code: '01',
      name: 'Education',
      description: 'Programmes and qualifications for teachers and education science',
      broadField: 'Education',
    },
    {
      code: '02',
      name: 'Arts and humanities',
      description: 'Programmes and qualifications in arts, humanities and languages',
      broadField: 'Arts and humanities',
    },
    {
      code: '03',
      name: 'Social sciences, journalism and information',
      description: 'Programmes and qualifications in social and behavioural science, journalism and information',
      broadField: 'Social sciences, journalism and information',
    },
    {
      code: '04',
      name: 'Business, administration and law',
      description: 'Programmes and qualifications in business, administration and law',
      broadField: 'Business, administration and law',
    },
    {
      code: '05',
      name: 'Natural sciences, mathematics and statistics',
      description: 'Programmes and qualifications in biological and related sciences, environment, physical sciences, mathematics and statistics',
      broadField: 'Natural sciences, mathematics and statistics',
    },
    {
      code: '06',
      name: 'Information and Communication Technologies',
      description: 'Programmes and qualifications in ICT',
      broadField: 'Information and Communication Technologies',
    },
    {
      code: '07',
      name: 'Engineering, manufacturing and construction',
      description: 'Programmes and qualifications in engineering and engineering trades, manufacturing and processing, and architecture and construction',
      broadField: 'Engineering, manufacturing and construction',
    },
    {
      code: '08',
      name: 'Agriculture, forestry, fisheries and veterinary',
      description: 'Programmes and qualifications in agriculture, forestry, fisheries and veterinary',
      broadField: 'Agriculture, forestry, fisheries and veterinary',
    },
    {
      code: '09',
      name: 'Health and welfare',
      description: 'Programmes and qualifications in health and welfare',
      broadField: 'Health and welfare',
    },
    {
      code: '10',
      name: 'Services',
      description: 'Programmes and qualifications in services',
      broadField: 'Services',
    },
  ]

  const fieldRecords: StandardRecord[] = fields.map(field => ({
    ns: EDUCATION_NS,
    type: 'ISCEDField',
    id: toWikipediaStyleId(field.name),
    name: field.name,
    description: cleanDescription(field.description),
    code: field.code,
  }))

  writeStandardTSV(join(DATA_DIR, 'Education.ISCED.Fields.tsv'), fieldRecords)
}

/**
 * Transform CEDS Data Elements (sample/placeholder)
 */
function transformCEDSElements(): void {
  console.log('Transforming CEDS Data Elements...')

  // Sample CEDS elements - in production, this would load from actual CEDS data files
  const elements: CEDSElement[] = [
    {
      code: 'E000001',
      name: 'Person Identifier',
      definition: 'A unique identifier for a person',
      dataType: 'String',
      domain: 'Person',
      entity: 'Person',
      status: 'Active',
      version: '11.0',
    },
    {
      code: 'E000002',
      name: 'First Name',
      definition: 'The first name of a person',
      dataType: 'String',
      domain: 'Person',
      entity: 'Person',
      status: 'Active',
      version: '11.0',
    },
    {
      code: 'E000003',
      name: 'Last Name',
      definition: 'The last name of a person',
      dataType: 'String',
      domain: 'Person',
      entity: 'Person',
      status: 'Active',
      version: '11.0',
    },
  ]

  const elementRecords: StandardRecord[] = elements.map(element => ({
    ns: EDUCATION_NS,
    type: 'CEDSElement',
    id: toWikipediaStyleId(element.name),
    name: element.name,
    description: cleanDescription(element.definition),
    code: element.code,
  }))

  if (elementRecords.length > 0) {
    writeStandardTSV(join(DATA_DIR, 'Education.CEDS.Elements.tsv'), elementRecords)
  }
}

/**
 * Transform CEDS Domains (sample/placeholder)
 */
function transformCEDSDomains(): void {
  console.log('Transforming CEDS Domains...')

  // Sample CEDS domains
  const domains: CEDSDomain[] = [
    {
      code: 'D001',
      name: 'Person',
      description: 'Information about individuals including students, staff, and parents',
      category: 'Core',
    },
    {
      code: 'D002',
      name: 'Organization',
      description: 'Information about educational organizations',
      category: 'Core',
    },
    {
      code: 'D003',
      name: 'Program',
      description: 'Information about educational programs and services',
      category: 'Programs',
    },
    {
      code: 'D004',
      name: 'Assessment',
      description: 'Information about assessments, tests, and evaluations',
      category: 'Assessment',
    },
    {
      code: 'D005',
      name: 'Competencies',
      description: 'Information about competencies, standards, and learning objectives',
      category: 'Learning',
    },
  ]

  const domainRecords: StandardRecord[] = domains.map(domain => ({
    ns: EDUCATION_NS,
    type: 'CEDSDomain',
    id: toWikipediaStyleId(domain.name),
    name: domain.name,
    description: cleanDescription(domain.description),
    code: domain.code,
  }))

  writeStandardTSV(join(DATA_DIR, 'Education.CEDS.Domains.tsv'), domainRecords)
}

/**
 * Transform CASE Frameworks (sample/placeholder)
 */
function transformCASEFrameworks(): void {
  console.log('Transforming CASE Frameworks...')

  // Sample CASE frameworks - in production, this would load from actual CASE data files
  const frameworks: CASEFramework[] = [
    {
      code: 'CCSS',
      uri: 'http://www.corestandards.org/',
      identifier: 'CCSS',
      title: 'Common Core State Standards',
      description: 'The Common Core State Standards for Mathematics and English Language Arts & Literacy in History/Social Studies, Science, and Technical Subjects',
      publisher: 'National Governors Association Center for Best Practices, Council of Chief State School Officers',
      subject: ['Mathematics', 'English Language Arts'],
      language: 'en',
      adoptionStatus: 'Adopted',
    },
    {
      code: 'NGSS',
      uri: 'https://www.nextgenscience.org/',
      identifier: 'NGSS',
      title: 'Next Generation Science Standards',
      description: 'The Next Generation Science Standards are K–12 science content standards',
      publisher: 'NGSS Lead States',
      subject: ['Science'],
      language: 'en',
      adoptionStatus: 'Adopted',
    },
  ]

  const frameworkRecords: StandardRecord[] = frameworks.map(framework => ({
    ns: EDUCATION_NS,
    type: 'CASEFramework',
    id: framework.code,
    name: framework.title,
    description: cleanDescription(framework.description),
    code: framework.code,
  }))

  if (frameworkRecords.length > 0) {
    writeStandardTSV(join(DATA_DIR, 'Education.CASE.Frameworks.tsv'), frameworkRecords)
  }
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

  // Transform CEDS standards
  transformCEDSElements()
  transformCEDSDomains()

  // Transform CASE frameworks
  transformCASEFrameworks()

  console.log('\n=== Education Transformation Complete ===')
}

// Run if called directly
if (import.meta.main) {
  transformEducation().catch(console.error)
}
