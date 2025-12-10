/**
 * Superset Occupations Domain Script
 * Creates occupations.org.ai as a superset of onet.org.ai
 *
 * This script:
 * 1. Imports all O*NET occupations with sameAs links to canonical source
 * 2. Adds expanded/additional occupations not in O*NET
 * 3. Creates semantic mappings and relationships
 */

import { join } from 'path'
import { existsSync } from 'fs'
import {
  NAMESPACES,
  parseTSV,
  writeStandardTSV,
  writeTSV,
  toWikipediaStyleId,
  cleanDescription,
  buildSameAs,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
  type StandardRecord,
} from './utils'

// Superset namespace
const NS = 'occupations.org.ai'
const CANONICAL_NS = NAMESPACES.ONET // onet.org.ai

const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// Aggregation domains for occupations
const OCCUPATION_AGGREGATIONS = 'business.org.ai|manufacturing.org.ai|healthcare.org.ai|finance.org.ai|retail.org.ai|tech.org.ai'

interface ONETOccupation {
  ns: string
  type: string
  id: string
  name: string
  description: string
  code: string
  sameAs?: string
  includedIn?: string
}

/**
 * Additional modern/emerging occupations not in O*NET
 * These extend the taxonomy with tech-focused and emerging roles
 */
const ADDITIONAL_OCCUPATIONS: Array<{
  id: string
  name: string
  description: string
  code: string
  category: string
}> = [
  // AI/ML Roles
  { id: 'AI_Engineer', name: 'AI Engineer', description: 'Design, develop, and deploy artificial intelligence systems and models', code: 'AI-ENG', category: 'AI/ML' },
  { id: 'Machine_Learning_Engineer', name: 'Machine Learning Engineer', description: 'Build and deploy machine learning models and systems at scale', code: 'ML-ENG', category: 'AI/ML' },
  { id: 'Prompt_Engineer', name: 'Prompt Engineer', description: 'Design and optimize prompts for large language models and AI systems', code: 'PROMPT-ENG', category: 'AI/ML' },
  { id: 'AI_Ethics_Specialist', name: 'AI Ethics Specialist', description: 'Ensure ethical development and deployment of AI systems', code: 'AI-ETHICS', category: 'AI/ML' },
  { id: 'MLOps_Engineer', name: 'MLOps Engineer', description: 'Operationalize machine learning models and maintain ML infrastructure', code: 'MLOPS-ENG', category: 'AI/ML' },

  // Modern Software Engineering
  { id: 'DevOps_Engineer', name: 'DevOps Engineer', description: 'Bridge development and operations, automating deployment and infrastructure', code: 'DEVOPS-ENG', category: 'Software Engineering' },
  { id: 'Site_Reliability_Engineer', name: 'Site Reliability Engineer', description: 'Ensure reliability, performance, and scalability of production systems', code: 'SRE', category: 'Software Engineering' },
  { id: 'Full_Stack_Engineer', name: 'Full Stack Engineer', description: 'Develop both front-end and back-end components of software applications', code: 'FULLSTACK-ENG', category: 'Software Engineering' },
  { id: 'Platform_Engineer', name: 'Platform Engineer', description: 'Build and maintain internal developer platforms and infrastructure', code: 'PLATFORM-ENG', category: 'Software Engineering' },
  { id: 'Cloud_Architect', name: 'Cloud Architect', description: 'Design and implement cloud infrastructure and migration strategies', code: 'CLOUD-ARCH', category: 'Software Engineering' },

  // Data Roles
  { id: 'Data_Scientist', name: 'Data Scientist', description: 'Analyze complex data sets and build predictive models to drive business insights', code: 'DATA-SCI', category: 'Data' },
  { id: 'Data_Engineer', name: 'Data Engineer', description: 'Design, build, and maintain data pipelines and infrastructure', code: 'DATA-ENG', category: 'Data' },
  { id: 'Analytics_Engineer', name: 'Analytics Engineer', description: 'Transform raw data into clean, actionable datasets for analysis', code: 'ANALYTICS-ENG', category: 'Data' },
  { id: 'Data_Product_Manager', name: 'Data Product Manager', description: 'Manage data products and drive data-driven product decisions', code: 'DATA-PM', category: 'Data' },

  // Cybersecurity
  { id: 'Security_Engineer', name: 'Security Engineer', description: 'Design and implement security systems and protocols', code: 'SEC-ENG', category: 'Cybersecurity' },
  { id: 'Penetration_Tester', name: 'Penetration Tester', description: 'Test systems and networks for security vulnerabilities', code: 'PENTEST', category: 'Cybersecurity' },
  { id: 'Security_Architect', name: 'Security Architect', description: 'Design comprehensive security architectures for organizations', code: 'SEC-ARCH', category: 'Cybersecurity' },
  { id: 'Threat_Intelligence_Analyst', name: 'Threat Intelligence Analyst', description: 'Analyze and respond to cybersecurity threats', code: 'THREAT-INTEL', category: 'Cybersecurity' },

  // Product & Design
  { id: 'Product_Designer', name: 'Product Designer', description: 'Design user experiences and interfaces for digital products', code: 'PROD-DES', category: 'Product & Design' },
  { id: 'UX_Researcher', name: 'UX Researcher', description: 'Conduct user research to inform product and design decisions', code: 'UX-RES', category: 'Product & Design' },
  { id: 'Growth_Product_Manager', name: 'Growth Product Manager', description: 'Drive product growth through experimentation and optimization', code: 'GROWTH-PM', category: 'Product & Design' },
  { id: 'Design_Systems_Engineer', name: 'Design Systems Engineer', description: 'Build and maintain design systems and component libraries', code: 'DESIGN-SYS-ENG', category: 'Product & Design' },

  // Blockchain & Web3
  { id: 'Blockchain_Engineer', name: 'Blockchain Engineer', description: 'Develop blockchain-based applications and smart contracts', code: 'BLOCKCHAIN-ENG', category: 'Blockchain' },
  { id: 'Smart_Contract_Developer', name: 'Smart Contract Developer', description: 'Write and audit smart contracts for blockchain platforms', code: 'SMART-CONTRACT', category: 'Blockchain' },
  { id: 'Web3_Developer', name: 'Web3 Developer', description: 'Build decentralized applications and Web3 interfaces', code: 'WEB3-DEV', category: 'Blockchain' },

  // Emerging Tech Roles
  { id: 'Quantum_Computing_Engineer', name: 'Quantum Computing Engineer', description: 'Develop quantum algorithms and applications', code: 'QUANTUM-ENG', category: 'Emerging Tech' },
  { id: 'AR_VR_Developer', name: 'AR/VR Developer', description: 'Create augmented and virtual reality experiences', code: 'AR-VR-DEV', category: 'Emerging Tech' },
  { id: 'IoT_Engineer', name: 'IoT Engineer', description: 'Design and develop Internet of Things systems and devices', code: 'IOT-ENG', category: 'Emerging Tech' },
  { id: 'Robotics_Engineer', name: 'Robotics Engineer', description: 'Design, build, and program robotic systems', code: 'ROBOTICS-ENG', category: 'Emerging Tech' },

  // Modern Business Roles
  { id: 'Revenue_Operations_Manager', name: 'Revenue Operations Manager', description: 'Optimize revenue processes across sales, marketing, and customer success', code: 'REVOPS-MGR', category: 'Business Operations' },
  { id: 'Customer_Success_Engineer', name: 'Customer Success Engineer', description: 'Provide technical guidance to ensure customer success and retention', code: 'CS-ENG', category: 'Business Operations' },
  { id: 'Technical_Writer', name: 'Technical Writer', description: 'Create technical documentation, guides, and API references', code: 'TECH-WRITER', category: 'Business Operations' },
  { id: 'Developer_Advocate', name: 'Developer Advocate', description: 'Build relationships with developer communities and promote technical products', code: 'DEV-ADV', category: 'Business Operations' },
]

/**
 * Import O*NET occupations and create superset entries with sameAs links
 */
function importCanonicalOccupations(): StandardRecord[] {
  console.log('Importing canonical O*NET occupations...')

  const onetFile = join(DATA_DIR, 'ONET.Occupations.tsv')
  if (!existsSync(onetFile)) {
    console.log('Warning: ONET.Occupations.tsv not found')
    return []
  }

  const onetOccupations = parseTSV<ONETOccupation>(onetFile)
  console.log(`Found ${onetOccupations.length} O*NET occupations`)

  // Create superset entries with sameAs links
  const supersetRecords: StandardRecord[] = onetOccupations.map(occ => ({
    ns: NS,
    type: 'Occupation',
    id: occ.id,
    name: occ.name,
    description: occ.description,
    code: occ.code,
    sameAs: buildSameAs(CANONICAL_NS, 'Occupation', occ.id),
    includedIn: OCCUPATION_AGGREGATIONS,
  }))

  return supersetRecords
}

/**
 * Create additional occupations not in O*NET
 */
function createAdditionalOccupations(): StandardRecord[] {
  console.log('Creating additional occupations...')

  const additionalRecords: StandardRecord[] = ADDITIONAL_OCCUPATIONS.map(occ => ({
    ns: NS,
    type: 'Occupation',
    id: occ.id,
    name: occ.name,
    description: occ.description,
    code: occ.code,
    // No sameAs - these are NEW occupations not in O*NET
    includedIn: OCCUPATION_AGGREGATIONS,
  }))

  return additionalRecords
}

/**
 * Create occupation category records
 */
function createOccupationCategories(): StandardRecord[] {
  console.log('Creating occupation categories...')

  const categories = [...new Set(ADDITIONAL_OCCUPATIONS.map(o => o.category))]

  return categories.map(cat => ({
    ns: NS,
    type: 'OccupationCategory',
    id: toWikipediaStyleId(cat),
    name: cat,
    description: `${cat} occupation category`,
    code: cat.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    includedIn: OCCUPATION_AGGREGATIONS,
  }))
}

/**
 * Create occupation-category relationships
 */
function createCategoryRelationships(): Record<string, string>[] {
  console.log('Creating occupation-category relationships...')

  return ADDITIONAL_OCCUPATIONS.map(occ => ({
    fromNs: NS,
    fromType: 'Occupation',
    fromId: occ.id,
    toNs: NS,
    toType: 'OccupationCategory',
    toId: toWikipediaStyleId(occ.category),
    relationshipType: 'belongsTo',
  }))
}

export async function transformSupersetOccupations(): Promise<void> {
  console.log('=== Superset Occupations Domain (occupations.org.ai) ===')
  ensureOutputDirs()

  // Import canonical O*NET occupations
  const canonicalOccupations = importCanonicalOccupations()

  // Create additional occupations
  const additionalOccupations = createAdditionalOccupations()

  // Combine all occupations
  const allOccupations = [...canonicalOccupations, ...additionalOccupations]
  writeStandardTSV(join(DATA_DIR, 'Superset.Occupations.tsv'), allOccupations)
  console.log(`Wrote ${allOccupations.length} total occupations (${canonicalOccupations.length} from O*NET + ${additionalOccupations.length} new)`)

  // Create categories
  const categories = createOccupationCategories()
  writeStandardTSV(join(DATA_DIR, 'Superset.OccupationCategories.tsv'), categories)
  console.log(`Wrote ${categories.length} occupation categories`)

  // Create relationships
  const categoryRels = createCategoryRelationships()
  writeTSV(
    join(REL_DIR, 'Superset.Occupation.Category.tsv'),
    categoryRels,
    ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']
  )
  console.log(`Wrote ${categoryRels.length} occupation-category relationships`)

  console.log('=== Superset Occupations Domain Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformSupersetOccupations()
}
