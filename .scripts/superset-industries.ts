/**
 * Superset Industries Domain Script
 * Creates industries.org.ai as a superset of naics.org.ai
 *
 * This script:
 * 1. Imports all NAICS industries with sameAs links to canonical source
 * 2. Adds expanded/additional industries not in NAICS
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
const NS = 'industries.org.ai'
const CANONICAL_NS = NAMESPACES.NAICS // naics.org.ai

const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// Aggregation domains for industries
const INDUSTRY_AGGREGATIONS = 'business.org.ai'

interface NAICSIndustry {
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
 * Additional industry categories not in NAICS
 * These extend the taxonomy with modern/emerging industries
 */
const ADDITIONAL_INDUSTRIES: Array<{
  id: string
  name: string
  description: string
  code: string
  category: string
}> = [
  // AI & Machine Learning Industries
  { id: 'Artificial_Intelligence_Services', name: 'Artificial Intelligence Services', description: 'AI/ML model development, training, and deployment services', code: 'AI-SVC', category: 'AI/ML' },
  { id: 'Machine_Learning_Platforms', name: 'Machine Learning Platforms', description: 'Platforms for building and deploying ML models', code: 'ML-PLAT', category: 'AI/ML' },
  { id: 'AI_Training_Data_Services', name: 'AI Training Data Services', description: 'Data labeling, annotation, and curation for AI training', code: 'AI-DATA', category: 'AI/ML' },
  { id: 'Computer_Vision_Services', name: 'Computer Vision Services', description: 'Image and video analysis using AI', code: 'CV-SVC', category: 'AI/ML' },
  { id: 'Natural_Language_Processing', name: 'Natural Language Processing', description: 'NLP services including text analysis, translation, and generation', code: 'NLP-SVC', category: 'AI/ML' },

  // Blockchain & Web3
  { id: 'Blockchain_Infrastructure', name: 'Blockchain Infrastructure', description: 'Blockchain networks, nodes, and infrastructure services', code: 'BLOCK-INFRA', category: 'Blockchain' },
  { id: 'Cryptocurrency_Exchanges', name: 'Cryptocurrency Exchanges', description: 'Platforms for trading digital currencies', code: 'CRYPTO-EX', category: 'Blockchain' },
  { id: 'DeFi_Platforms', name: 'Decentralized Finance (DeFi) Platforms', description: 'Decentralized financial services and applications', code: 'DEFI', category: 'Blockchain' },
  { id: 'NFT_Marketplaces', name: 'NFT Marketplaces', description: 'Platforms for creating and trading non-fungible tokens', code: 'NFT-MKT', category: 'Blockchain' },

  // Creator & Gig Economy
  { id: 'Creator_Economy_Platforms', name: 'Creator Economy Platforms', description: 'Platforms enabling content creators to monetize their work', code: 'CREATOR-PLAT', category: 'Creator Economy' },
  { id: 'Influencer_Marketing', name: 'Influencer Marketing', description: 'Services connecting brands with social media influencers', code: 'INFLU-MKT', category: 'Creator Economy' },
  { id: 'Gig_Economy_Platforms', name: 'Gig Economy Platforms', description: 'Marketplaces connecting freelancers with short-term work', code: 'GIG-PLAT', category: 'Gig Economy' },
  { id: 'Freelance_Services', name: 'Freelance Services', description: 'Independent contractor services across various domains', code: 'FREELANCE', category: 'Gig Economy' },

  // Cloud & SaaS
  { id: 'Cloud_Native_Development', name: 'Cloud Native Development', description: 'Development of cloud-native applications and services', code: 'CLOUD-DEV', category: 'Cloud' },
  { id: 'Serverless_Computing', name: 'Serverless Computing', description: 'Function-as-a-service and serverless platforms', code: 'SERVERLESS', category: 'Cloud' },
  { id: 'Container_Orchestration', name: 'Container Orchestration', description: 'Kubernetes and container management services', code: 'CONTAINER', category: 'Cloud' },
  { id: 'Multi_Cloud_Management', name: 'Multi-Cloud Management', description: 'Tools and services for managing multiple cloud providers', code: 'MULTICLOUD', category: 'Cloud' },

  // Cybersecurity
  { id: 'Zero_Trust_Security', name: 'Zero Trust Security', description: 'Security architecture based on zero trust principles', code: 'ZEROTRUST', category: 'Cybersecurity' },
  { id: 'Security_Operations_Centers', name: 'Security Operations Centers', description: 'Managed security monitoring and incident response', code: 'SOC', category: 'Cybersecurity' },
  { id: 'Threat_Intelligence', name: 'Threat Intelligence', description: 'Cyber threat detection and intelligence services', code: 'THREAT-INT', category: 'Cybersecurity' },

  // Sustainability & Clean Tech
  { id: 'Carbon_Capture_Technology', name: 'Carbon Capture Technology', description: 'Technologies for capturing and storing carbon emissions', code: 'CARBON-CAP', category: 'Sustainability' },
  { id: 'Renewable_Energy_Tech', name: 'Renewable Energy Technology', description: 'Advanced renewable energy generation and storage', code: 'RENEW-TECH', category: 'Sustainability' },
  { id: 'Sustainable_Materials', name: 'Sustainable Materials', description: 'Development of eco-friendly and biodegradable materials', code: 'SUST-MAT', category: 'Sustainability' },
  { id: 'ESG_Analytics', name: 'ESG Analytics', description: 'Environmental, social, and governance reporting and analytics', code: 'ESG-ANLYT', category: 'Sustainability' },

  // Other Emerging Industries
  { id: 'Quantum_Computing', name: 'Quantum Computing', description: 'Quantum computing hardware and software development', code: 'QUANTUM', category: 'Emerging Tech' },
  { id: 'Edge_Computing', name: 'Edge Computing', description: 'Computing at the network edge for low-latency applications', code: 'EDGE-COMP', category: 'Emerging Tech' },
  { id: 'Digital_Twin_Technology', name: 'Digital Twin Technology', description: 'Virtual replicas of physical systems for simulation', code: 'DIG-TWIN', category: 'Emerging Tech' },
  { id: 'Autonomous_Vehicle_Tech', name: 'Autonomous Vehicle Technology', description: 'Self-driving vehicle systems and infrastructure', code: 'AUTO-VEH', category: 'Emerging Tech' },
  { id: 'Space_Technology', name: 'Space Technology', description: 'Commercial space exploration and satellite services', code: 'SPACE-TECH', category: 'Emerging Tech' },
  { id: 'Biotechnology_Innovation', name: 'Biotechnology Innovation', description: 'Advanced biotech including gene editing and synthetic biology', code: 'BIOTECH', category: 'Emerging Tech' },
]

/**
 * Import NAICS industries and create superset entries with sameAs links
 */
function importCanonicalIndustries(): StandardRecord[] {
  console.log('Importing canonical NAICS industries...')

  const industriesFile = join(DATA_DIR, 'NAICS.Industries.tsv')
  const sectorsFile = join(DATA_DIR, 'NAICS.Sectors.tsv')

  let allIndustries: NAICSIndustry[] = []

  // Import sectors
  if (existsSync(sectorsFile)) {
    const sectors = parseTSV<NAICSIndustry>(sectorsFile)
    console.log(`Found ${sectors.length} NAICS sectors`)
    allIndustries.push(...sectors)
  } else {
    console.log('Warning: NAICS.Sectors.tsv not found')
  }

  // Import all industry levels (subsectors, industry groups, industries, national industries)
  if (existsSync(industriesFile)) {
    const industries = parseTSV<NAICSIndustry>(industriesFile)
    console.log(`Found ${industries.length} NAICS industry records`)
    allIndustries.push(...industries)
  } else {
    console.log('Warning: NAICS.Industries.tsv not found')
  }

  if (allIndustries.length === 0) {
    return []
  }

  // Create superset entries with sameAs links
  const supersetRecords: StandardRecord[] = allIndustries.map(industry => ({
    ns: NS,
    type: industry.type,
    id: industry.id,
    name: industry.name,
    description: industry.description || '',
    code: industry.code,
    sameAs: buildSameAs(CANONICAL_NS, industry.type, industry.id),
    includedIn: INDUSTRY_AGGREGATIONS,
  }))

  return supersetRecords
}

/**
 * Create additional industries not in NAICS
 */
function createAdditionalIndustries(): StandardRecord[] {
  console.log('Creating additional industries...')

  const additionalRecords: StandardRecord[] = ADDITIONAL_INDUSTRIES.map(industry => ({
    ns: NS,
    type: 'Industry',
    id: industry.id,
    name: industry.name,
    description: industry.description,
    code: industry.code,
    // No sameAs - these are NEW industries not in NAICS
    includedIn: INDUSTRY_AGGREGATIONS,
  }))

  return additionalRecords
}

/**
 * Create industry category records
 */
function createIndustryCategories(): StandardRecord[] {
  console.log('Creating industry categories...')

  const categories = [...new Set(ADDITIONAL_INDUSTRIES.map(i => i.category))]

  return categories.map(cat => ({
    ns: NS,
    type: 'IndustryCategory',
    id: toWikipediaStyleId(cat),
    name: cat,
    description: `${cat} industry category`,
    code: cat.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    includedIn: INDUSTRY_AGGREGATIONS,
  }))
}

/**
 * Create industry-category relationships
 */
function createCategoryRelationships(): Record<string, string>[] {
  console.log('Creating industry-category relationships...')

  return ADDITIONAL_INDUSTRIES.map(industry => ({
    fromNs: NS,
    fromType: 'Industry',
    fromId: industry.id,
    toNs: NS,
    toType: 'IndustryCategory',
    toId: toWikipediaStyleId(industry.category),
    relationshipType: 'belongs_to',
  }))
}

export async function transformSupersetIndustries(): Promise<void> {
  console.log('=== Superset Industries Domain (industries.org.ai) ===')
  ensureOutputDirs()

  // Import canonical NAICS industries
  const canonicalIndustries = importCanonicalIndustries()

  // Create additional industries
  const additionalIndustries = createAdditionalIndustries()

  // Combine all industries
  const allIndustries = [...canonicalIndustries, ...additionalIndustries]
  writeStandardTSV(join(DATA_DIR, 'Superset.Industries.tsv'), allIndustries)
  console.log(`Wrote ${allIndustries.length} total industries (${canonicalIndustries.length} from NAICS + ${additionalIndustries.length} new)`)

  // Create categories
  const categories = createIndustryCategories()
  writeStandardTSV(join(DATA_DIR, 'Superset.IndustryCategories.tsv'), categories)
  console.log(`Wrote ${categories.length} industry categories`)

  // Create relationships
  const categoryRels = createCategoryRelationships()
  writeTSV(
    join(REL_DIR, 'Superset.Industry.Category.tsv'),
    categoryRels,
    ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']
  )
  console.log(`Wrote ${categoryRels.length} industry-category relationships`)

  console.log('=== Superset Industries Domain Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformSupersetIndustries()
}
