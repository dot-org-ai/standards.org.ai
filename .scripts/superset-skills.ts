/**
 * Superset Skills Domain Script
 * Creates skills.org.ai as a superset of onet.org.ai skills
 *
 * This script:
 * 1. Imports all O*NET skills with sameAs links to canonical source
 * 2. Adds expanded/additional skills not in O*NET (modern tech skills, soft skills, etc.)
 * 3. Creates skill categories and relationships
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
const NS = 'skills.org.ai'
const CANONICAL_NS = NAMESPACES.ONET // onet.org.ai

const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// Aggregation domains for skills
const SKILL_AGGREGATIONS = 'business.org.ai|education.org.ai'

interface ONetSkill {
  ns: string
  type: string
  id: string
  name: string
  description: string
  code: string
  includedIn?: string
}

interface SkillDefinition {
  id: string
  name: string
  description: string
  code: string
  category: string
}

/**
 * Additional skills not in O*NET
 * Modern, tech-focused, and emerging skills
 */
const ADDITIONAL_SKILLS: SkillDefinition[] = [
  // Programming & Development
  { id: 'Python_Programming', name: 'Python Programming', description: 'Programming in Python for data science, automation, and web development', code: 'PROG-PY', category: 'Programming' },
  { id: 'JavaScript_Development', name: 'JavaScript Development', description: 'Full-stack JavaScript development including Node.js and frameworks', code: 'PROG-JS', category: 'Programming' },
  { id: 'TypeScript_Development', name: 'TypeScript Development', description: 'TypeScript development for type-safe applications', code: 'PROG-TS', category: 'Programming' },
  { id: 'Rust_Programming', name: 'Rust Programming', description: 'Systems programming in Rust', code: 'PROG-RUST', category: 'Programming' },
  { id: 'Go_Programming', name: 'Go Programming', description: 'Backend development in Go/Golang', code: 'PROG-GO', category: 'Programming' },
  { id: 'Mobile_Development', name: 'Mobile Development', description: 'iOS and Android application development', code: 'PROG-MOB', category: 'Programming' },

  // AI & Machine Learning
  { id: 'Machine_Learning', name: 'Machine Learning', description: 'Building and deploying machine learning models', code: 'AI-ML', category: 'AI/ML' },
  { id: 'Deep_Learning', name: 'Deep Learning', description: 'Neural network design and implementation', code: 'AI-DL', category: 'AI/ML' },
  { id: 'Natural_Language_Processing', name: 'Natural Language Processing', description: 'NLP techniques for text analysis and generation', code: 'AI-NLP', category: 'AI/ML' },
  { id: 'Computer_Vision', name: 'Computer Vision', description: 'Image and video analysis using AI', code: 'AI-CV', category: 'AI/ML' },
  { id: 'Prompt_Engineering', name: 'Prompt Engineering', description: 'Designing effective prompts for LLMs', code: 'AI-PROMPT', category: 'AI/ML' },
  { id: 'MLOps', name: 'MLOps', description: 'Operationalizing machine learning systems', code: 'AI-MLOPS', category: 'AI/ML' },
  { id: 'AI_Ethics', name: 'AI Ethics', description: 'Ethical considerations in AI development', code: 'AI-ETHICS', category: 'AI/ML' },

  // Data Skills
  { id: 'Data_Engineering', name: 'Data Engineering', description: 'Building data pipelines and infrastructure', code: 'DATA-ENG', category: 'Data' },
  { id: 'Data_Visualization', name: 'Data Visualization', description: 'Creating visual representations of data', code: 'DATA-VIZ', category: 'Data' },
  { id: 'SQL_Proficiency', name: 'SQL Proficiency', description: 'Database querying and management with SQL', code: 'DATA-SQL', category: 'Data' },
  { id: 'Big_Data_Processing', name: 'Big Data Processing', description: 'Processing large-scale datasets (Spark, Hadoop)', code: 'DATA-BIG', category: 'Data' },
  { id: 'Data_Storytelling', name: 'Data Storytelling', description: 'Communicating insights through data narratives', code: 'DATA-STORY', category: 'Data' },

  // Cloud & DevOps
  { id: 'AWS_Cloud', name: 'AWS Cloud', description: 'Amazon Web Services cloud platform expertise', code: 'CLOUD-AWS', category: 'Cloud' },
  { id: 'Azure_Cloud', name: 'Azure Cloud', description: 'Microsoft Azure cloud platform expertise', code: 'CLOUD-AZURE', category: 'Cloud' },
  { id: 'GCP_Cloud', name: 'GCP Cloud', description: 'Google Cloud Platform expertise', code: 'CLOUD-GCP', category: 'Cloud' },
  { id: 'Kubernetes', name: 'Kubernetes', description: 'Container orchestration with Kubernetes', code: 'DEVOPS-K8S', category: 'DevOps' },
  { id: 'Docker', name: 'Docker', description: 'Containerization with Docker', code: 'DEVOPS-DOCKER', category: 'DevOps' },
  { id: 'CI_CD', name: 'CI/CD', description: 'Continuous integration and deployment', code: 'DEVOPS-CICD', category: 'DevOps' },
  { id: 'Infrastructure_as_Code', name: 'Infrastructure as Code', description: 'Managing infrastructure through code (Terraform, etc.)', code: 'DEVOPS-IAC', category: 'DevOps' },

  // Cybersecurity
  { id: 'Penetration_Testing', name: 'Penetration Testing', description: 'Security testing and vulnerability assessment', code: 'SEC-PENTEST', category: 'Security' },
  { id: 'Security_Architecture', name: 'Security Architecture', description: 'Designing secure systems and networks', code: 'SEC-ARCH', category: 'Security' },
  { id: 'Incident_Response', name: 'Incident Response', description: 'Responding to security incidents', code: 'SEC-IR', category: 'Security' },
  { id: 'Cloud_Security', name: 'Cloud Security', description: 'Securing cloud infrastructure and applications', code: 'SEC-CLOUD', category: 'Security' },

  // Design & UX
  { id: 'UI_Design', name: 'UI Design', description: 'User interface design for digital products', code: 'DES-UI', category: 'Design' },
  { id: 'UX_Research', name: 'UX Research', description: 'User experience research methods', code: 'DES-UXR', category: 'Design' },
  { id: 'Design_Systems', name: 'Design Systems', description: 'Creating and maintaining design systems', code: 'DES-SYS', category: 'Design' },
  { id: 'Prototyping', name: 'Prototyping', description: 'Creating interactive prototypes', code: 'DES-PROTO', category: 'Design' },
  { id: 'Accessibility_Design', name: 'Accessibility Design', description: 'Designing for accessibility (a11y)', code: 'DES-A11Y', category: 'Design' },

  // Product & Business
  { id: 'Product_Management', name: 'Product Management', description: 'Managing product development lifecycle', code: 'PROD-MGMT', category: 'Product' },
  { id: 'Product_Strategy', name: 'Product Strategy', description: 'Defining product vision and roadmap', code: 'PROD-STRAT', category: 'Product' },
  { id: 'Growth_Hacking', name: 'Growth Hacking', description: 'Data-driven growth strategies', code: 'BUS-GROWTH', category: 'Business' },
  { id: 'Business_Analysis', name: 'Business Analysis', description: 'Analyzing business needs and requirements', code: 'BUS-ANLYS', category: 'Business' },
  { id: 'Agile_Methodologies', name: 'Agile Methodologies', description: 'Scrum, Kanban, and agile practices', code: 'BUS-AGILE', category: 'Business' },

  // Digital Marketing
  { id: 'SEO', name: 'SEO', description: 'Search engine optimization', code: 'MKT-SEO', category: 'Marketing' },
  { id: 'Content_Marketing', name: 'Content Marketing', description: 'Content strategy and creation', code: 'MKT-CONT', category: 'Marketing' },
  { id: 'Social_Media_Marketing', name: 'Social Media Marketing', description: 'Marketing on social media platforms', code: 'MKT-SOCIAL', category: 'Marketing' },
  { id: 'Marketing_Analytics', name: 'Marketing Analytics', description: 'Analyzing marketing performance data', code: 'MKT-ANLYS', category: 'Marketing' },
  { id: 'Email_Marketing', name: 'Email Marketing', description: 'Email campaign management and automation', code: 'MKT-EMAIL', category: 'Marketing' },

  // Soft Skills / Meta Skills
  { id: 'Remote_Collaboration', name: 'Remote Collaboration', description: 'Effective collaboration in distributed teams', code: 'SOFT-REMOTE', category: 'Soft Skills' },
  { id: 'Cross_Functional_Leadership', name: 'Cross-Functional Leadership', description: 'Leading across organizational boundaries', code: 'SOFT-XFUNC', category: 'Soft Skills' },
  { id: 'Continuous_Learning', name: 'Continuous Learning', description: 'Self-directed learning and skill development', code: 'SOFT-LEARN', category: 'Soft Skills' },
  { id: 'Digital_Literacy', name: 'Digital Literacy', description: 'Foundational digital technology skills', code: 'SOFT-DIGLTR', category: 'Soft Skills' },
  { id: 'Emotional_Intelligence', name: 'Emotional Intelligence', description: 'Understanding and managing emotions', code: 'SOFT-EQ', category: 'Soft Skills' },
]

/**
 * Import O*NET skills and create superset entries with sameAs links
 */
function importCanonicalSkills(): StandardRecord[] {
  console.log('Importing canonical O*NET skills...')

  const onetFile = join(DATA_DIR, 'ONET.Skills.tsv')
  if (!existsSync(onetFile)) {
    console.log('Warning: ONET.Skills.tsv not found')
    return []
  }

  const onetSkills = parseTSV<ONetSkill>(onetFile)
  console.log(`Found ${onetSkills.length} O*NET skills`)

  // Create superset entries with sameAs links
  const supersetRecords: StandardRecord[] = onetSkills.map(skill => ({
    ns: NS,
    type: 'Skill',
    id: skill.id,
    name: skill.name,
    description: skill.description,
    code: skill.code,
    sameAs: buildSameAs(CANONICAL_NS, 'Skill', skill.id),
    includedIn: SKILL_AGGREGATIONS,
  }))

  return supersetRecords
}

/**
 * Create additional skills not in O*NET
 */
function createAdditionalSkills(): StandardRecord[] {
  console.log('Creating additional skills...')

  return ADDITIONAL_SKILLS.map(skill => ({
    ns: NS,
    type: 'Skill',
    id: skill.id,
    name: skill.name,
    description: skill.description,
    code: skill.code,
    // No sameAs - these are NEW skills not in O*NET
    includedIn: SKILL_AGGREGATIONS,
  }))
}

/**
 * Create skill category records
 */
function createSkillCategories(): StandardRecord[] {
  console.log('Creating skill categories...')

  const categories = [...new Set(ADDITIONAL_SKILLS.map(s => s.category))]

  return categories.map(cat => ({
    ns: NS,
    type: 'SkillCategory',
    id: toWikipediaStyleId(cat),
    name: cat,
    description: `${cat} skill category`,
    code: cat.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    includedIn: SKILL_AGGREGATIONS,
  }))
}

/**
 * Create skill-category relationships
 */
function createCategoryRelationships(): Record<string, string>[] {
  console.log('Creating skill-category relationships...')

  return ADDITIONAL_SKILLS.map(skill => ({
    fromNs: NS,
    fromType: 'Skill',
    fromId: skill.id,
    toNs: NS,
    toType: 'SkillCategory',
    toId: toWikipediaStyleId(skill.category),
    relationshipType: 'belongsTo',
  }))
}

export async function transformSupersetSkills(): Promise<void> {
  console.log('=== Superset Skills Domain (skills.org.ai) ===')
  ensureOutputDirs()

  // Import canonical O*NET skills
  const canonicalSkills = importCanonicalSkills()

  // Create additional skills
  const additionalSkills = createAdditionalSkills()

  // Combine all skills
  const allSkills = [...canonicalSkills, ...additionalSkills]
  writeStandardTSV(join(DATA_DIR, 'Superset.Skills.tsv'), allSkills)
  console.log(`Wrote ${allSkills.length} total skills (${canonicalSkills.length} from O*NET + ${additionalSkills.length} new)`)

  // Create categories
  const categories = createSkillCategories()
  writeStandardTSV(join(DATA_DIR, 'Superset.SkillCategories.tsv'), categories)
  console.log(`Wrote ${categories.length} skill categories`)

  // Create relationships
  const categoryRels = createCategoryRelationships()
  writeTSV(
    join(REL_DIR, 'Superset.Skill.Category.tsv'),
    categoryRels,
    ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']
  )
  console.log(`Wrote ${categoryRels.length} skill-category relationships`)

  console.log('=== Superset Skills Domain Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformSupersetSkills()
}
