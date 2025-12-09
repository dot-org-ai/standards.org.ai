/**
 * Superset Process Domain Script
 * Creates process.org.ai as a superset of apqc.org.ai
 *
 * This script:
 * 1. Imports all APQC processes with sameAs links to canonical source
 * 2. Adds expanded/additional processes not in APQC
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
const NS = 'process.org.ai'
const CANONICAL_NS = NAMESPACES.APQC // apqc.org.ai

const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// Aggregation domains for processes
const PROCESS_AGGREGATIONS = 'business.org.ai|manufacturing.org.ai|healthcare.org.ai|finance.org.ai|retail.org.ai|logistics.org.ai'

interface APQCProcess {
  ns: string
  type: string
  id: string
  name: string
  description: string
  code: string
  includedIn?: string
}

/**
 * Additional process categories not in APQC
 * These extend the taxonomy with modern/tech-focused processes
 */
const ADDITIONAL_PROCESSES: Array<{
  id: string
  name: string
  description: string
  code: string
  category: string
}> = [
  // Software Development Processes
  { id: 'Software_Development_Lifecycle', name: 'Software Development Lifecycle', description: 'End-to-end process for developing software products', code: 'SDLC', category: 'Technology' },
  { id: 'Agile_Development', name: 'Agile Development', description: 'Iterative software development methodology', code: 'AGILE', category: 'Technology' },
  { id: 'DevOps_Pipeline', name: 'DevOps Pipeline', description: 'Continuous integration and deployment process', code: 'DEVOPS', category: 'Technology' },
  { id: 'Code_Review', name: 'Code Review', description: 'Peer review process for source code', code: 'CODE-REV', category: 'Technology' },
  { id: 'Quality_Assurance_Testing', name: 'Quality Assurance Testing', description: 'Software testing and quality validation', code: 'QA-TEST', category: 'Technology' },

  // AI/ML Processes
  { id: 'Machine_Learning_Operations', name: 'Machine Learning Operations', description: 'MLOps - operationalizing ML models', code: 'MLOPS', category: 'AI/ML' },
  { id: 'Model_Training', name: 'Model Training', description: 'Training machine learning models', code: 'ML-TRAIN', category: 'AI/ML' },
  { id: 'Data_Pipeline_Management', name: 'Data Pipeline Management', description: 'Managing data ingestion and transformation pipelines', code: 'DATA-PIPE', category: 'AI/ML' },
  { id: 'AI_Governance', name: 'AI Governance', description: 'Governance and ethics for AI systems', code: 'AI-GOV', category: 'AI/ML' },

  // Digital Transformation Processes
  { id: 'Digital_Transformation', name: 'Digital Transformation', description: 'Modernizing business through digital technology', code: 'DIG-TRANS', category: 'Digital' },
  { id: 'Process_Automation', name: 'Process Automation', description: 'Automating manual business processes', code: 'PROC-AUTO', category: 'Digital' },
  { id: 'Robotic_Process_Automation', name: 'Robotic Process Automation', description: 'RPA implementation and management', code: 'RPA', category: 'Digital' },
  { id: 'API_Management', name: 'API Management', description: 'Managing APIs and integrations', code: 'API-MGMT', category: 'Digital' },

  // Cloud Processes
  { id: 'Cloud_Migration', name: 'Cloud Migration', description: 'Moving workloads to cloud infrastructure', code: 'CLOUD-MIG', category: 'Cloud' },
  { id: 'Cloud_Operations', name: 'Cloud Operations', description: 'Managing cloud infrastructure and services', code: 'CLOUD-OPS', category: 'Cloud' },
  { id: 'Infrastructure_as_Code', name: 'Infrastructure as Code', description: 'Managing infrastructure through code', code: 'IAC', category: 'Cloud' },

  // Security Processes
  { id: 'Security_Operations', name: 'Security Operations', description: 'SecOps - security monitoring and response', code: 'SECOPS', category: 'Security' },
  { id: 'Vulnerability_Management', name: 'Vulnerability Management', description: 'Identifying and remediating vulnerabilities', code: 'VULN-MGMT', category: 'Security' },
  { id: 'Identity_Access_Management', name: 'Identity Access Management', description: 'Managing user identities and access', code: 'IAM', category: 'Security' },
  { id: 'Incident_Response', name: 'Incident Response', description: 'Responding to security incidents', code: 'INC-RESP', category: 'Security' },

  // Data Processes
  { id: 'Data_Governance', name: 'Data Governance', description: 'Governance policies for organizational data', code: 'DATA-GOV', category: 'Data' },
  { id: 'Data_Quality_Management', name: 'Data Quality Management', description: 'Ensuring data quality and accuracy', code: 'DATA-QUAL', category: 'Data' },
  { id: 'Master_Data_Management', name: 'Master Data Management', description: 'Managing master data across systems', code: 'MDM', category: 'Data' },
  { id: 'Data_Analytics', name: 'Data Analytics', description: 'Analyzing data for insights', code: 'DATA-ANLYS', category: 'Data' },

  // Customer Experience Processes
  { id: 'Customer_Journey_Mapping', name: 'Customer Journey Mapping', description: 'Mapping and optimizing customer journeys', code: 'CJM', category: 'Customer' },
  { id: 'Omnichannel_Experience', name: 'Omnichannel Experience', description: 'Managing consistent customer experience across channels', code: 'OMNI-CX', category: 'Customer' },
  { id: 'Customer_Success_Management', name: 'Customer Success Management', description: 'Ensuring customer success and retention', code: 'CSM', category: 'Customer' },

  // Innovation Processes
  { id: 'Design_Thinking', name: 'Design Thinking', description: 'Human-centered design process', code: 'DES-THINK', category: 'Innovation' },
  { id: 'Rapid_Prototyping', name: 'Rapid Prototyping', description: 'Quick iteration on product concepts', code: 'PROTO', category: 'Innovation' },
  { id: 'Innovation_Management', name: 'Innovation Management', description: 'Managing innovation pipeline and initiatives', code: 'INNOV-MGMT', category: 'Innovation' },
]

/**
 * Import APQC processes and create superset entries with sameAs links
 */
function importCanonicalProcesses(): StandardRecord[] {
  console.log('Importing canonical APQC processes...')

  const apqcFile = join(DATA_DIR, 'APQC.Processes.tsv')
  if (!existsSync(apqcFile)) {
    console.log('Warning: APQC.Processes.tsv not found')
    return []
  }

  const apqcProcesses = parseTSV<APQCProcess>(apqcFile)
  console.log(`Found ${apqcProcesses.length} APQC processes`)

  // Create superset entries with sameAs links
  const supersetRecords: StandardRecord[] = apqcProcesses.map(proc => ({
    ns: NS,
    type: 'Process',
    id: proc.id,
    name: proc.name,
    description: proc.description,
    code: proc.code,
    sameAs: buildSameAs(CANONICAL_NS, 'Process', proc.id),
    includedIn: PROCESS_AGGREGATIONS,
  }))

  return supersetRecords
}

/**
 * Create additional processes not in APQC
 */
function createAdditionalProcesses(): StandardRecord[] {
  console.log('Creating additional processes...')

  const additionalRecords: StandardRecord[] = ADDITIONAL_PROCESSES.map(proc => ({
    ns: NS,
    type: 'Process',
    id: proc.id,
    name: proc.name,
    description: proc.description,
    code: proc.code,
    // No sameAs - these are NEW processes not in APQC
    includedIn: PROCESS_AGGREGATIONS,
  }))

  return additionalRecords
}

/**
 * Create process category records
 */
function createProcessCategories(): StandardRecord[] {
  console.log('Creating process categories...')

  const categories = [...new Set(ADDITIONAL_PROCESSES.map(p => p.category))]

  return categories.map(cat => ({
    ns: NS,
    type: 'ProcessCategory',
    id: toWikipediaStyleId(cat),
    name: cat,
    description: `${cat} process category`,
    code: cat.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    includedIn: PROCESS_AGGREGATIONS,
  }))
}

/**
 * Create process-category relationships
 */
function createCategoryRelationships(): Record<string, string>[] {
  console.log('Creating process-category relationships...')

  return ADDITIONAL_PROCESSES.map(proc => ({
    fromNs: NS,
    fromType: 'Process',
    fromId: proc.id,
    toNs: NS,
    toType: 'ProcessCategory',
    toId: toWikipediaStyleId(proc.category),
    relationshipType: 'belongs_to',
  }))
}

export async function transformSupersetProcess(): Promise<void> {
  console.log('=== Superset Process Domain (process.org.ai) ===')
  ensureOutputDirs()

  // Import canonical APQC processes
  const canonicalProcesses = importCanonicalProcesses()

  // Create additional processes
  const additionalProcesses = createAdditionalProcesses()

  // Combine all processes
  const allProcesses = [...canonicalProcesses, ...additionalProcesses]
  writeStandardTSV(join(DATA_DIR, 'Superset.Processes.tsv'), allProcesses)
  console.log(`Wrote ${allProcesses.length} total processes (${canonicalProcesses.length} from APQC + ${additionalProcesses.length} new)`)

  // Create categories
  const categories = createProcessCategories()
  writeStandardTSV(join(DATA_DIR, 'Superset.ProcessCategories.tsv'), categories)
  console.log(`Wrote ${categories.length} process categories`)

  // Create relationships
  const categoryRels = createCategoryRelationships()
  writeTSV(
    join(REL_DIR, 'Superset.Process.Category.tsv'),
    categoryRels,
    ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']
  )
  console.log(`Wrote ${categoryRels.length} process-category relationships`)

  console.log('=== Superset Process Domain Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformSupersetProcess()
}
