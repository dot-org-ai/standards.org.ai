/**
 * Superset Services Domain Script
 * Creates services.org.ai as a new service taxonomy
 *
 * This script:
 * 1. Creates a comprehensive service taxonomy (no single canonical source)
 * 2. Maps to related industry codes where applicable
 * 3. Covers both traditional and digital services
 */

import { join } from 'path'
import {
  NAMESPACES,
  writeStandardTSV,
  writeTSV,
  toWikipediaStyleId,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
  type StandardRecord,
} from './utils'

// Superset namespace
const NS = 'services.org.ai'

const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// Aggregation domains for services
const SERVICE_AGGREGATIONS = 'business.org.ai|retail.org.ai|healthcare.org.ai|finance.org.ai'

interface ServiceDefinition {
  id: string
  name: string
  description: string
  code: string
  category: string
  subcategory?: string
}

/**
 * Comprehensive service taxonomy
 */
const SERVICE_TAXONOMY: ServiceDefinition[] = [
  // Professional Services
  { id: 'Legal_Services', name: 'Legal Services', description: 'Legal counsel, representation, and advisory services', code: 'PROF-LEGAL', category: 'Professional Services' },
  { id: 'Accounting_Services', name: 'Accounting Services', description: 'Accounting, auditing, and tax preparation services', code: 'PROF-ACCT', category: 'Professional Services' },
  { id: 'Management_Consulting', name: 'Management Consulting', description: 'Business strategy and management advisory services', code: 'PROF-MGMT', category: 'Professional Services' },
  { id: 'Engineering_Services', name: 'Engineering Services', description: 'Engineering design and consulting services', code: 'PROF-ENG', category: 'Professional Services' },
  { id: 'Architecture_Services', name: 'Architecture Services', description: 'Architectural design and planning services', code: 'PROF-ARCH', category: 'Professional Services' },
  { id: 'Marketing_Services', name: 'Marketing Services', description: 'Marketing strategy, advertising, and brand services', code: 'PROF-MKT', category: 'Professional Services' },
  { id: 'HR_Services', name: 'HR Services', description: 'Human resources consulting and staffing services', code: 'PROF-HR', category: 'Professional Services' },

  // Technology Services
  { id: 'Software_Development_Services', name: 'Software Development Services', description: 'Custom software development and programming', code: 'TECH-DEV', category: 'Technology Services' },
  { id: 'Cloud_Services', name: 'Cloud Services', description: 'Cloud computing, hosting, and infrastructure services', code: 'TECH-CLOUD', category: 'Technology Services' },
  { id: 'Managed_IT_Services', name: 'Managed IT Services', description: 'Outsourced IT management and support', code: 'TECH-MSP', category: 'Technology Services' },
  { id: 'Cybersecurity_Services', name: 'Cybersecurity Services', description: 'Security consulting, assessment, and protection', code: 'TECH-SEC', category: 'Technology Services' },
  { id: 'Data_Analytics_Services', name: 'Data Analytics Services', description: 'Data analysis, visualization, and insights', code: 'TECH-DATA', category: 'Technology Services' },
  { id: 'AI_ML_Services', name: 'AI/ML Services', description: 'Artificial intelligence and machine learning solutions', code: 'TECH-AI', category: 'Technology Services' },
  { id: 'Integration_Services', name: 'Integration Services', description: 'System integration and API development', code: 'TECH-INT', category: 'Technology Services' },

  // Financial Services
  { id: 'Banking_Services', name: 'Banking Services', description: 'Retail and commercial banking services', code: 'FIN-BANK', category: 'Financial Services' },
  { id: 'Investment_Services', name: 'Investment Services', description: 'Investment management and advisory', code: 'FIN-INV', category: 'Financial Services' },
  { id: 'Insurance_Services', name: 'Insurance Services', description: 'Insurance products and risk management', code: 'FIN-INS', category: 'Financial Services' },
  { id: 'Payment_Services', name: 'Payment Services', description: 'Payment processing and money transfer', code: 'FIN-PAY', category: 'Financial Services' },
  { id: 'Lending_Services', name: 'Lending Services', description: 'Consumer and business lending', code: 'FIN-LEND', category: 'Financial Services' },
  { id: 'Wealth_Management', name: 'Wealth Management', description: 'High-net-worth financial planning', code: 'FIN-WM', category: 'Financial Services' },

  // Healthcare Services
  { id: 'Medical_Services', name: 'Medical Services', description: 'Physician and clinical care services', code: 'HEALTH-MED', category: 'Healthcare Services' },
  { id: 'Dental_Services', name: 'Dental Services', description: 'Dental care and oral health services', code: 'HEALTH-DENT', category: 'Healthcare Services' },
  { id: 'Mental_Health_Services', name: 'Mental Health Services', description: 'Psychological and psychiatric services', code: 'HEALTH-MH', category: 'Healthcare Services' },
  { id: 'Home_Healthcare', name: 'Home Healthcare', description: 'In-home medical and nursing care', code: 'HEALTH-HOME', category: 'Healthcare Services' },
  { id: 'Telehealth_Services', name: 'Telehealth Services', description: 'Remote healthcare delivery via technology', code: 'HEALTH-TELE', category: 'Healthcare Services' },
  { id: 'Laboratory_Services', name: 'Laboratory Services', description: 'Medical testing and diagnostics', code: 'HEALTH-LAB', category: 'Healthcare Services' },

  // Education Services
  { id: 'K12_Education', name: 'K-12 Education', description: 'Primary and secondary education services', code: 'EDU-K12', category: 'Education Services' },
  { id: 'Higher_Education', name: 'Higher Education', description: 'College and university education', code: 'EDU-HIGHER', category: 'Education Services' },
  { id: 'Professional_Training', name: 'Professional Training', description: 'Corporate and professional development', code: 'EDU-PROF', category: 'Education Services' },
  { id: 'Online_Learning', name: 'Online Learning', description: 'E-learning and digital education platforms', code: 'EDU-ONLINE', category: 'Education Services' },
  { id: 'Tutoring_Services', name: 'Tutoring Services', description: 'One-on-one and small group tutoring', code: 'EDU-TUTOR', category: 'Education Services' },

  // Logistics & Transportation
  { id: 'Freight_Services', name: 'Freight Services', description: 'Cargo transportation and logistics', code: 'LOG-FREIGHT', category: 'Logistics' },
  { id: 'Warehousing_Services', name: 'Warehousing Services', description: 'Storage and distribution facilities', code: 'LOG-WARE', category: 'Logistics' },
  { id: 'Last_Mile_Delivery', name: 'Last Mile Delivery', description: 'Final delivery to end customers', code: 'LOG-LAST', category: 'Logistics' },
  { id: 'Fulfillment_Services', name: 'Fulfillment Services', description: 'Order fulfillment and e-commerce logistics', code: 'LOG-FULFILL', category: 'Logistics' },
  { id: 'Supply_Chain_Services', name: 'Supply Chain Services', description: 'End-to-end supply chain management', code: 'LOG-SCM', category: 'Logistics' },

  // Creative Services
  { id: 'Graphic_Design', name: 'Graphic Design', description: 'Visual design and branding services', code: 'CREAT-GRAPH', category: 'Creative Services' },
  { id: 'Video_Production', name: 'Video Production', description: 'Video creation and editing services', code: 'CREAT-VIDEO', category: 'Creative Services' },
  { id: 'Content_Creation', name: 'Content Creation', description: 'Written and multimedia content development', code: 'CREAT-CONT', category: 'Creative Services' },
  { id: 'Photography_Services', name: 'Photography Services', description: 'Professional photography and editing', code: 'CREAT-PHOTO', category: 'Creative Services' },
  { id: 'UX_Design', name: 'UX Design', description: 'User experience design and research', code: 'CREAT-UX', category: 'Creative Services' },

  // Business Support Services
  { id: 'Customer_Support', name: 'Customer Support', description: 'Customer service and help desk operations', code: 'BUS-CUST', category: 'Business Support' },
  { id: 'Call_Center_Services', name: 'Call Center Services', description: 'Inbound and outbound call center operations', code: 'BUS-CALL', category: 'Business Support' },
  { id: 'Virtual_Assistant', name: 'Virtual Assistant', description: 'Remote administrative support services', code: 'BUS-VA', category: 'Business Support' },
  { id: 'Bookkeeping_Services', name: 'Bookkeeping Services', description: 'Financial record keeping and maintenance', code: 'BUS-BOOK', category: 'Business Support' },
  { id: 'Payroll_Services', name: 'Payroll Services', description: 'Payroll processing and administration', code: 'BUS-PAY', category: 'Business Support' },

  // Platform Services (Digital)
  { id: 'SaaS_Platform', name: 'SaaS Platform', description: 'Software as a Service delivery', code: 'PLAT-SAAS', category: 'Platform Services' },
  { id: 'PaaS_Platform', name: 'PaaS Platform', description: 'Platform as a Service for developers', code: 'PLAT-PAAS', category: 'Platform Services' },
  { id: 'Marketplace_Platform', name: 'Marketplace Platform', description: 'Multi-sided marketplace services', code: 'PLAT-MKT', category: 'Platform Services' },
  { id: 'API_Platform', name: 'API Platform', description: 'API-based services and integrations', code: 'PLAT-API', category: 'Platform Services' },
  { id: 'Data_Platform', name: 'Data Platform', description: 'Data services and data-as-a-service', code: 'PLAT-DATA', category: 'Platform Services' },

  // Subscription Services
  { id: 'Media_Subscription', name: 'Media Subscription', description: 'Streaming and content subscription services', code: 'SUB-MEDIA', category: 'Subscription Services' },
  { id: 'Software_Subscription', name: 'Software Subscription', description: 'Software licensing subscription', code: 'SUB-SW', category: 'Subscription Services' },
  { id: 'Box_Subscription', name: 'Box Subscription', description: 'Physical product subscription boxes', code: 'SUB-BOX', category: 'Subscription Services' },
  { id: 'Membership_Services', name: 'Membership Services', description: 'Membership-based access and benefits', code: 'SUB-MEM', category: 'Subscription Services' },

  // Gig/On-Demand Services
  { id: 'Rideshare_Services', name: 'Rideshare Services', description: 'On-demand transportation services', code: 'GIG-RIDE', category: 'On-Demand Services' },
  { id: 'Food_Delivery', name: 'Food Delivery', description: 'Restaurant and meal delivery services', code: 'GIG-FOOD', category: 'On-Demand Services' },
  { id: 'Freelance_Services', name: 'Freelance Services', description: 'On-demand professional freelancing', code: 'GIG-FREE', category: 'On-Demand Services' },
  { id: 'Home_Services', name: 'Home Services', description: 'On-demand home maintenance and repair', code: 'GIG-HOME', category: 'On-Demand Services' },
]

/**
 * Create service records
 */
function createServiceRecords(): StandardRecord[] {
  console.log('Creating service records...')

  return SERVICE_TAXONOMY.map(svc => ({
    ns: NS,
    type: 'Service',
    id: svc.id,
    name: svc.name,
    description: svc.description,
    code: svc.code,
    // No sameAs - services.org.ai is the canonical source
    includedIn: SERVICE_AGGREGATIONS,
  }))
}

/**
 * Create service category records
 */
function createServiceCategories(): StandardRecord[] {
  console.log('Creating service categories...')

  const categories = [...new Set(SERVICE_TAXONOMY.map(s => s.category))]

  return categories.map(cat => ({
    ns: NS,
    type: 'ServiceCategory',
    id: toWikipediaStyleId(cat),
    name: cat,
    description: `${cat} category`,
    code: cat.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    includedIn: SERVICE_AGGREGATIONS,
  }))
}

/**
 * Create service-category relationships
 */
function createCategoryRelationships(): Record<string, string>[] {
  console.log('Creating service-category relationships...')

  return SERVICE_TAXONOMY.map(svc => ({
    fromNs: NS,
    fromType: 'Service',
    fromId: svc.id,
    toNs: NS,
    toType: 'ServiceCategory',
    toId: toWikipediaStyleId(svc.category),
    relationshipType: 'belongsTo',
  }))
}

export async function transformSupersetServices(): Promise<void> {
  console.log('=== Superset Services Domain (services.org.ai) ===')
  ensureOutputDirs()

  // Create service records
  const services = createServiceRecords()
  writeStandardTSV(join(DATA_DIR, 'Superset.Services.tsv'), services)
  console.log(`Wrote ${services.length} services`)

  // Create categories
  const categories = createServiceCategories()
  writeStandardTSV(join(DATA_DIR, 'Superset.ServiceCategories.tsv'), categories)
  console.log(`Wrote ${categories.length} service categories`)

  // Create relationships
  const categoryRels = createCategoryRelationships()
  writeTSV(
    join(REL_DIR, 'Superset.Service.Category.tsv'),
    categoryRels,
    ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']
  )
  console.log(`Wrote ${categoryRels.length} service-category relationships`)

  console.log('=== Superset Services Domain Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformSupersetServices()
}
