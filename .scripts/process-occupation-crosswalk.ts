import { join } from 'path'
import {
  NAMESPACES,
  parseTSV,
  writeTSV,
  getRelationshipsPath,
  ensureOutputDirs,
  type StandardRecord,
} from './utils'

const REL_DIR = getRelationshipsPath()

/**
 * Manual mapping of top-level APQC Process Groups to relevant O*NET Occupations
 * Based on the business processes and the occupations that typically perform them
 */
const PROCESS_OCCUPATION_MAPPINGS: Record<string, string[]> = {
  // 1.0 Develop Vision and Strategy
  'Develop_Vision_and_Strategy': [
    'Chief_Executives',
    'Chief_Sustainability_Officers',
    'General_and_Operations_Managers',
    'Management_Analysts',
    'Business_Intelligence_Analysts',
    'Investment_Fund_Managers',
  ],

  // 2.0 Develop and Manage Products and Services
  'Develop_and_Manage_Products_and_Services': [
    'General_and_Operations_Managers',
    'Architectural_and_Engineering_Managers',
    'Industrial_Production_Managers',
    'Quality_Control_Systems_Managers',
    'Industrial_Engineers',
    'Mechanical_Engineers',
    'Software_Developers',
  ],

  // 3.0 Market and Sell Products and Services
  'Market_and_Sell_Products_and_Services': [
    'Marketing_Managers',
    'Sales_Managers',
    'Advertising_and_Promotions_Managers',
    'Public_Relations_Managers',
    'Sales_Representatives,_Wholesale_and_Manufacturing,_Technical_and_Scientific_Products',
    'Sales_Representatives,_Wholesale_and_Manufacturing,_Except_Technical_and_Scientific_Products',
    'Market_Research_Analysts_and_Marketing_Specialists',
    'Advertising_Sales_Agents',
  ],

  // 4.0 Manage Supply Chain for Physical Products
  'Manage_Supply_Chain_for_Physical_Products': [
    'Transportation,_Storage,_and_Distribution_Managers',
    'Supply_Chain_Managers',
    'Purchasing_Managers',
    'Industrial_Production_Managers',
    'Logisticians',
    'Shipping,_Receiving,_and_Inventory_Clerks',
    'Material_Moving_Workers,_All_Other',
  ],

  // 6.0 Manage Customer Service
  'Manage_Customer_Service': [
    'Customer_Service_Representatives',
    'First-Line_Supervisors_of_Office_and_Administrative_Support_Workers',
    'General_and_Operations_Managers',
  ],

  // 7.0 Develop and Manage Human Capital
  'Develop_and_Manage_Human_Capital': [
    'Human_Resources_Managers',
    'Compensation_and_Benefits_Managers',
    'Training_and_Development_Managers',
    'Human_Resources_Specialists',
    'Training_and_Development_Specialists',
    'Compensation,_Benefits,_and_Job_Analysis_Specialists',
    'Labor_Relations_Specialists',
  ],

  // 8.0 Manage Information Technology (IT)
  'Manage_Information_Technology_(IT)': [
    'Computer_and_Information_Systems_Managers',
    'Software_Developers',
    'Database_Administrators',
    'Network_and_Computer_Systems_Administrators',
    'Computer_Network_Architects',
    'Information_Security_Analysts',
    'Computer_Systems_Analysts',
    'Software_Quality_Assurance_Analysts_and_Testers',
  ],

  // 9.0 Manage Financial Resources
  'Manage_Financial_Resources': [
    'Financial_Managers',
    'Treasurers_and_Controllers',
    'Accountants_and_Auditors',
    'Financial_and_Investment_Analysts',
    'Budget_Analysts',
    'Credit_Analysts',
    'Tax_Preparers',
    'Bookkeeping,_Accounting,_and_Auditing_Clerks',
  ],

  // 10.0 Acquire, Construct, and Manage Assets
  'Acquire,_Construct,_and_Manage_Assets': [
    'Facilities_Managers',
    'Property,_Real_Estate,_and_Community_Association_Managers',
    'Construction_Managers',
    'Purchasing_Managers',
    'Purchasing_Agents,_Except_Wholesale,_Retail,_and_Farm_Products',
    'Real_Estate_Brokers',
    'Real_Estate_Sales_Agents',
  ],

  // 11.0 Manage Enterprise Risk, Compliance, Remediation, and Resiliency
  'Manage_Enterprise_Risk,_Compliance,_Remediation,_and_Resiliency': [
    'Compliance_Officers',
    'Emergency_Management_Directors',
    'Security_Managers',
    'Occupational_Health_and_Safety_Specialists',
    'Environmental_Compliance_Inspectors',
  ],

  // 12.0 Manage External Relationships
  'Manage_External_Relationships': [
    'Public_Relations_Managers',
    'Public_Relations_Specialists',
    'General_and_Operations_Managers',
    'Fundraising_Managers',
    'Social_and_Community_Service_Managers',
  ],

  // 13.0 Develop and Manage Business Capabilities
  'Develop_and_Manage_Business_Capabilities': [
    'Management_Analysts',
    'Business_Intelligence_Analysts',
    'General_and_Operations_Managers',
    'Operations_Research_Analysts',
    'Project_Management_Specialists',
  ],
}

/**
 * Load existing APQC processes from APQC.Processes.tsv to get proper IDs
 */
function loadAPQCProcesses(): Map<string, StandardRecord> {
  const apqcFile = join(process.cwd(), '.data', 'APQC.Processes.tsv')
  console.log(`Loading APQC processes from: ${apqcFile}`)

  const data = parseTSV<StandardRecord>(apqcFile)
  const apqcMap = new Map<string, StandardRecord>()

  for (const record of data) {
    if (record.id && record.type === 'ProcessGroup') {
      apqcMap.set(record.id, record)
    }
  }

  console.log(`Loaded ${apqcMap.size} APQC ProcessGroups`)
  return apqcMap
}

/**
 * Load existing O*NET occupations from ONET.Occupations.tsv to get proper IDs
 */
function loadONETOccupations(): Map<string, StandardRecord> {
  const onetFile = join(process.cwd(), '.data', 'ONET.Occupations.tsv')
  console.log(`Loading O*NET occupations from: ${onetFile}`)

  const data = parseTSV<StandardRecord>(onetFile)
  const onetMap = new Map<string, StandardRecord>()

  for (const record of data) {
    if (record.id && record.type === 'Occupation') {
      onetMap.set(record.id, record)
    }
  }

  console.log(`Loaded ${onetMap.size} O*NET Occupations`)
  return onetMap
}

/**
 * Create APQC Process to O*NET Occupation crosswalk relationship file
 */
export async function transformProcessOccupationCrosswalk(): Promise<void> {
  console.log('=== APQC Process to O*NET Occupation Crosswalk Transformation ===')
  ensureOutputDirs()

  // Load existing APQC and O*NET data to get proper IDs
  const apqcProcesses = loadAPQCProcesses()
  const onetOccupations = loadONETOccupations()

  // Build relationship records
  const relationships: Record<string, string>[] = []
  const skipped: { process: string; occupation: string; reason: string }[] = []

  for (const [processId, occupationIds] of Object.entries(PROCESS_OCCUPATION_MAPPINGS)) {
    const process = apqcProcesses.get(processId)

    if (!process) {
      console.log(`Warning: APQC ProcessGroup not found: ${processId}`)
      continue
    }

    for (const occupationId of occupationIds) {
      const occupation = onetOccupations.get(occupationId)

      if (!occupation) {
        skipped.push({
          process: processId,
          occupation: occupationId,
          reason: `O*NET Occupation not found: ${occupationId}`,
        })
        continue
      }

      relationships.push({
        fromNs: NAMESPACES.APQC,
        fromType: 'ProcessGroup',
        fromId: process.id,
        toNs: NAMESPACES.ONET,
        toType: 'Occupation',
        toId: occupation.id,
        relationshipType: 'performed_by',
      })
    }
  }

  console.log(`Created ${relationships.length} APQC-ONET relationships`)

  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} mappings:`)
    skipped.forEach(item => {
      console.log(`  ${item.process} -> ${item.occupation}: ${item.reason}`)
    })
  }

  // Write the relationship file
  const outputPath = join(REL_DIR, 'APQC.Process.ONET.Occupation.tsv')
  writeTSV(outputPath, relationships, [
    'fromNs',
    'fromType',
    'fromId',
    'toNs',
    'toType',
    'toId',
    'relationshipType',
  ])

  console.log(`Wrote APQC-ONET crosswalk to: ${outputPath}`)
  console.log('=== APQC Process to O*NET Occupation Crosswalk Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformProcessOccupationCrosswalk()
}
