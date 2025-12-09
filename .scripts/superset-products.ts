/**
 * Superset Products Domain Script
 * Creates products.org.ai as a superset of GS1 (GPC) and UNSPSC
 *
 * This script:
 * 1. Imports all GS1 GPC products with sameAs links to gs1.org.ai
 * 2. Imports all UNSPSC products with sameAs links to un.org.ai
 * 3. Adds expanded/additional product categories (digital products, SaaS, subscriptions, etc.)
 * 4. Creates semantic mappings and relationships
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
const NS = 'products.org.ai'
const CANONICAL_NS_GS1 = NAMESPACES.GS1 // gs1.org.ai
const CANONICAL_NS_UNSPSC = NAMESPACES.UNSPSC // un.org.ai

const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// Aggregation domains for products
const PRODUCT_AGGREGATIONS = 'business.org.ai|manufacturing.org.ai|retail.org.ai'

interface GS1Product {
  ns: string
  type: string
  id: string
  name: string
  description: string
  code: string
  sameAs?: string
  includedIn?: string
}

interface UNSPSCProduct {
  ns: string
  type: string
  id: string
  name: string
  description: string
  code: string
}

/**
 * Additional product categories not in GS1 or UNSPSC
 * These extend the taxonomy with modern/digital products
 */
const ADDITIONAL_PRODUCTS: Array<{
  id: string
  name: string
  description: string
  code: string
  category: string
}> = [
  // Digital Products
  { id: 'Digital_Software_License', name: 'Digital Software License', description: 'Software product delivered via digital license', code: 'SOFT-LIC', category: 'Digital' },
  { id: 'Mobile_Application', name: 'Mobile Application', description: 'Software application for mobile devices', code: 'MOBILE-APP', category: 'Digital' },
  { id: 'Web_Application', name: 'Web Application', description: 'Software application accessed via web browser', code: 'WEB-APP', category: 'Digital' },
  { id: 'Desktop_Software', name: 'Desktop Software', description: 'Software application for desktop computers', code: 'DESKTOP-APP', category: 'Digital' },
  { id: 'Plugin_Extension', name: 'Plugin/Extension', description: 'Software plugin or browser extension', code: 'PLUGIN', category: 'Digital' },

  // SaaS Products
  { id: 'SaaS_Platform', name: 'SaaS Platform', description: 'Software as a Service platform subscription', code: 'SAAS-PLAT', category: 'SaaS' },
  { id: 'SaaS_Business_Application', name: 'SaaS Business Application', description: 'Cloud-based business application subscription', code: 'SAAS-BIZ', category: 'SaaS' },
  { id: 'SaaS_Collaboration_Tool', name: 'SaaS Collaboration Tool', description: 'Cloud-based collaboration and communication tool', code: 'SAAS-COLLAB', category: 'SaaS' },
  { id: 'SaaS_Analytics_Tool', name: 'SaaS Analytics Tool', description: 'Cloud-based analytics and business intelligence tool', code: 'SAAS-ANLYT', category: 'SaaS' },
  { id: 'SaaS_Security_Solution', name: 'SaaS Security Solution', description: 'Cloud-based security and compliance solution', code: 'SAAS-SEC', category: 'SaaS' },

  // Cloud Services
  { id: 'Cloud_Infrastructure_Service', name: 'Cloud Infrastructure Service', description: 'Infrastructure as a Service (IaaS) offering', code: 'CLOUD-IAAS', category: 'Cloud' },
  { id: 'Cloud_Platform_Service', name: 'Cloud Platform Service', description: 'Platform as a Service (PaaS) offering', code: 'CLOUD-PAAS', category: 'Cloud' },
  { id: 'Cloud_Storage_Service', name: 'Cloud Storage Service', description: 'Cloud-based storage and backup service', code: 'CLOUD-STOR', category: 'Cloud' },
  { id: 'Cloud_Database_Service', name: 'Cloud Database Service', description: 'Cloud-based database service', code: 'CLOUD-DB', category: 'Cloud' },
  { id: 'Serverless_Computing', name: 'Serverless Computing', description: 'Function as a Service (FaaS) offering', code: 'CLOUD-FAAS', category: 'Cloud' },

  // Digital Media
  { id: 'Digital_Audio_Content', name: 'Digital Audio Content', description: 'Digital audio files, music, podcasts, audiobooks', code: 'DIG-AUDIO', category: 'DigitalMedia' },
  { id: 'Digital_Video_Content', name: 'Digital Video Content', description: 'Digital video files, movies, shows, courses', code: 'DIG-VIDEO', category: 'DigitalMedia' },
  { id: 'Digital_EBook', name: 'Digital E-Book', description: 'Electronic book in digital format', code: 'DIG-EBOOK', category: 'DigitalMedia' },
  { id: 'Digital_Photography', name: 'Digital Photography', description: 'Digital photos, stock images, vector graphics', code: 'DIG-PHOTO', category: 'DigitalMedia' },
  { id: 'Digital_Font', name: 'Digital Font', description: 'Digital typeface or font family', code: 'DIG-FONT', category: 'DigitalMedia' },

  // Subscription Products
  { id: 'Subscription_Box', name: 'Subscription Box', description: 'Recurring physical product subscription box', code: 'SUB-BOX', category: 'Subscription' },
  { id: 'Subscription_Media_Streaming', name: 'Subscription Media Streaming', description: 'Streaming media subscription service', code: 'SUB-STREAM', category: 'Subscription' },
  { id: 'Subscription_News', name: 'Subscription News', description: 'Digital news and magazine subscription', code: 'SUB-NEWS', category: 'Subscription' },
  { id: 'Subscription_Software', name: 'Subscription Software', description: 'Software subscription with recurring billing', code: 'SUB-SOFT', category: 'Subscription' },
  { id: 'Membership_Program', name: 'Membership Program', description: 'Paid membership with recurring benefits', code: 'SUB-MEMBER', category: 'Subscription' },

  // Blockchain/Crypto Products
  { id: 'NFT_Digital_Art', name: 'NFT Digital Art', description: 'Non-fungible token representing digital art', code: 'NFT-ART', category: 'Blockchain' },
  { id: 'NFT_Collectible', name: 'NFT Collectible', description: 'Non-fungible token collectible item', code: 'NFT-COLL', category: 'Blockchain' },
  { id: 'Cryptocurrency_Token', name: 'Cryptocurrency Token', description: 'Digital cryptocurrency or utility token', code: 'CRYPTO-TOK', category: 'Blockchain' },
  { id: 'Smart_Contract', name: 'Smart Contract', description: 'Blockchain-based smart contract product', code: 'SMART-CONT', category: 'Blockchain' },
  { id: 'Decentralized_Application', name: 'Decentralized Application', description: 'DApp running on blockchain technology', code: 'DAPP', category: 'Blockchain' },

  // API & Developer Products
  { id: 'API_Service', name: 'API Service', description: 'Application Programming Interface as a product', code: 'API-SVC', category: 'Developer' },
  { id: 'Developer_SDK', name: 'Developer SDK', description: 'Software Development Kit for developers', code: 'DEV-SDK', category: 'Developer' },
  { id: 'Developer_Framework', name: 'Developer Framework', description: 'Software framework for application development', code: 'DEV-FRAME', category: 'Developer' },
  { id: 'Developer_Library', name: 'Developer Library', description: 'Code library or package for developers', code: 'DEV-LIB', category: 'Developer' },
  { id: 'Developer_Tool', name: 'Developer Tool', description: 'Development tool or utility for programmers', code: 'DEV-TOOL', category: 'Developer' },

  // AI/ML Products
  { id: 'AI_Model', name: 'AI Model', description: 'Pre-trained artificial intelligence model', code: 'AI-MODEL', category: 'AI' },
  { id: 'ML_Dataset', name: 'ML Dataset', description: 'Machine learning training dataset', code: 'ML-DATA', category: 'AI' },
  { id: 'AI_API_Service', name: 'AI API Service', description: 'AI/ML capability exposed via API', code: 'AI-API', category: 'AI' },
  { id: 'Computer_Vision_Model', name: 'Computer Vision Model', description: 'Computer vision AI model or service', code: 'AI-VISION', category: 'AI' },
  { id: 'Natural_Language_Model', name: 'Natural Language Model', description: 'Natural language processing model or service', code: 'AI-NLP', category: 'AI' },

  // Virtual & Augmented Reality
  { id: 'VR_Experience', name: 'VR Experience', description: 'Virtual reality experience or application', code: 'VR-EXP', category: 'Virtual' },
  { id: 'AR_Application', name: 'AR Application', description: 'Augmented reality application', code: 'AR-APP', category: 'Virtual' },
  { id: 'Metaverse_Asset', name: 'Metaverse Asset', description: 'Virtual asset or property in metaverse', code: 'META-ASSET', category: 'Virtual' },
  { id: 'Virtual_Good', name: 'Virtual Good', description: 'Digital item for use in virtual environments', code: 'VIRT-GOOD', category: 'Virtual' },
  { id: 'Digital_Avatar', name: 'Digital Avatar', description: 'Digital avatar or character representation', code: 'AVATAR', category: 'Virtual' },

  // IoT & Connected Devices
  { id: 'IoT_Device', name: 'IoT Device', description: 'Internet of Things connected device', code: 'IOT-DEV', category: 'IoT' },
  { id: 'Smart_Home_Device', name: 'Smart Home Device', description: 'Connected smart home device or appliance', code: 'SMART-HOME', category: 'IoT' },
  { id: 'Wearable_Device', name: 'Wearable Device', description: 'Wearable technology device', code: 'WEARABLE', category: 'IoT' },
  { id: 'IoT_Sensor', name: 'IoT Sensor', description: 'Connected sensor for data collection', code: 'IOT-SENS', category: 'IoT' },
  { id: 'Connected_Vehicle_System', name: 'Connected Vehicle System', description: 'Connected car or vehicle technology system', code: 'CONN-VEH', category: 'IoT' },
]

/**
 * Import GS1 GPC products and create superset entries with sameAs links
 */
function importGS1Products(): StandardRecord[] {
  console.log('Importing GS1 GPC products...')

  // Try to find GS1 product files
  const possibleFiles = [
    join(DATA_DIR, 'GS1.Bricks.tsv'),
    join(DATA_DIR, 'GS1.Classes.tsv'),
    join(DATA_DIR, 'GS1.Families.tsv'),
    join(DATA_DIR, 'GS1.Segments.tsv'),
  ]

  const records: StandardRecord[] = []

  for (const file of possibleFiles) {
    if (!existsSync(file)) {
      console.log(`  Skipping ${file} (not found)`)
      continue
    }

    const products = parseTSV<GS1Product>(file)
    console.log(`  Found ${products.length} products in ${file}`)

    // Create superset entries with sameAs links
    const supersetRecords: StandardRecord[] = products.map(prod => ({
      ns: NS,
      type: prod.type,
      id: prod.id,
      name: prod.name,
      description: prod.description,
      code: prod.code,
      sameAs: buildSameAs(CANONICAL_NS_GS1, prod.type, prod.id),
      includedIn: PRODUCT_AGGREGATIONS,
    }))

    records.push(...supersetRecords)
  }

  console.log(`Total GS1 products imported: ${records.length}`)
  return records
}

/**
 * Import UNSPSC products and create superset entries with sameAs links
 */
function importUNSPSCProducts(): StandardRecord[] {
  console.log('Importing UNSPSC products...')

  const unspscFile = join(DATA_DIR, 'UNSPSC.Products.tsv')
  if (!existsSync(unspscFile)) {
    console.log('Warning: UNSPSC.Products.tsv not found')
    return []
  }

  const unspscProducts = parseTSV<UNSPSCProduct>(unspscFile)
  console.log(`Found ${unspscProducts.length} UNSPSC products`)

  // Create superset entries with sameAs links
  const supersetRecords: StandardRecord[] = unspscProducts.map(prod => ({
    ns: NS,
    type: prod.type,
    id: prod.id,
    name: prod.name,
    description: prod.description,
    code: prod.code,
    sameAs: buildSameAs(CANONICAL_NS_UNSPSC, prod.type, prod.id),
    includedIn: PRODUCT_AGGREGATIONS,
  }))

  return supersetRecords
}

/**
 * Create additional products not in GS1 or UNSPSC
 */
function createAdditionalProducts(): StandardRecord[] {
  console.log('Creating additional modern products...')

  const additionalRecords: StandardRecord[] = ADDITIONAL_PRODUCTS.map(prod => ({
    ns: NS,
    type: 'Product',
    id: prod.id,
    name: prod.name,
    description: prod.description,
    code: prod.code,
    // No sameAs - these are NEW products not in GS1 or UNSPSC
    includedIn: PRODUCT_AGGREGATIONS,
  }))

  return additionalRecords
}

/**
 * Create product category records
 */
function createProductCategories(): StandardRecord[] {
  console.log('Creating product categories...')

  const categories = [...new Set(ADDITIONAL_PRODUCTS.map(p => p.category))]

  return categories.map(cat => ({
    ns: NS,
    type: 'ProductCategory',
    id: toWikipediaStyleId(cat),
    name: cat,
    description: `${cat} product category`,
    code: cat.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    includedIn: PRODUCT_AGGREGATIONS,
  }))
}

/**
 * Create product-category relationships
 */
function createCategoryRelationships(): Record<string, string>[] {
  console.log('Creating product-category relationships...')

  return ADDITIONAL_PRODUCTS.map(prod => ({
    fromNs: NS,
    fromType: 'Product',
    fromId: prod.id,
    toNs: NS,
    toType: 'ProductCategory',
    toId: toWikipediaStyleId(prod.category),
    relationshipType: 'belongs_to',
  }))
}

export async function transformSupersetProducts(): Promise<void> {
  console.log('=== Superset Products Domain (products.org.ai) ===')
  ensureOutputDirs()

  // Import canonical GS1 products
  const gs1Products = importGS1Products()

  // Import canonical UNSPSC products
  const unspscProducts = importUNSPSCProducts()

  // Create additional products
  const additionalProducts = createAdditionalProducts()

  // Combine all products
  const allProducts = [...gs1Products, ...unspscProducts, ...additionalProducts]
  writeStandardTSV(join(DATA_DIR, 'Superset.Products.tsv'), allProducts)
  console.log(`Wrote ${allProducts.length} total products (${gs1Products.length} from GS1 + ${unspscProducts.length} from UNSPSC + ${additionalProducts.length} new)`)

  // Create categories
  const categories = createProductCategories()
  writeStandardTSV(join(DATA_DIR, 'Superset.ProductCategories.tsv'), categories)
  console.log(`Wrote ${categories.length} product categories`)

  // Create relationships
  const categoryRels = createCategoryRelationships()
  writeTSV(
    join(REL_DIR, 'Superset.Product.Category.tsv'),
    categoryRels,
    ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']
  )
  console.log(`Wrote ${categoryRels.length} product-category relationships`)

  console.log('=== Superset Products Domain Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformSupersetProducts()
}
