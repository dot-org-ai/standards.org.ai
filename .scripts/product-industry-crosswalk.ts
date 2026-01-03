#!/usr/bin/env bun

/**
 * Product-to-Industry Crosswalk
 *
 * Creates relationships between product classifications (GS1, UNSPSC) and NAICS industries.
 * These mappings enable supply chain analysis by connecting what is produced/sold to which
 * industries produce/distribute those products.
 *
 * Output files:
 * - .data/relationships/GS1.Segment.NAICS.Industry.tsv
 * - .data/relationships/UNSPSC.Segment.NAICS.Industry.tsv
 */

import {
  parseTSV,
  writeRelationshipTSV,
  getRelationshipsPath,
  NAMESPACES,
  type RelationshipRecord,
} from './utils'
import { join } from 'path'

interface ProductSegment {
  ns: string
  type: string
  id: string
  name: string
  code: string
}

interface NAICSIndustry {
  ns: string
  type: string
  id: string
  name: string
  code: string
}

/**
 * GS1 Segment to NAICS Industry mappings
 * Based on semantic alignment of product categories to industries
 */
const GS1_TO_NAICS_MAPPINGS: Record<string, Array<{ type: string; id: string; relationship: string }>> = {
  // Food & Beverage
  'Food/Beverage': [
    { type: 'NAICSIndustry', id: 'Manufacturing', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Food_Manufacturing', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Beverage_and_Tobacco_Product_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],
  'Tobacco/Cannabis': [
    { type: 'Subsector', id: 'Beverage_and_Tobacco_Product_Manufacturing', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Crop_Production', relationship: 'produced_by' },
  ],
  'Crops': [
    { type: 'Sector', id: 'Agriculture,_Forestry,_Fishing_and_Hunting', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Crop_Production', relationship: 'produced_by' },
  ],
  'Horticulture Plants': [
    { type: 'Subsector', id: 'Crop_Production', relationship: 'produced_by' },
  ],

  // Animals & Pet Care
  'Live Animals': [
    { type: 'Sector', id: 'Agriculture,_Forestry,_Fishing_and_Hunting', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Animal_Production_and_Aquaculture', relationship: 'produced_by' },
  ],
  'Pet Care/Food': [
    { type: 'Subsector', id: 'Food_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],

  // Apparel & Textiles
  'Clothing': [
    { type: 'NAICSIndustry', id: 'Manufacturing', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Apparel_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],
  'Footwear': [
    { type: 'Subsector', id: 'Apparel_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],

  // Personal Care & Beauty
  'Beauty/Personal Care/Hygiene': [
    { type: 'Subsector', id: 'Chemical_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],
  'Healthcare': [
    { type: 'Subsector', id: 'Chemical_Manufacturing', relationship: 'produced_by' },
    { type: 'Sector', id: 'Health_Care_and_Social_Assistance', relationship: 'distributed_by' },
  ],

  // Electronics & Computing
  'Computing': [
    { type: 'Subsector', id: 'Computer_and_Electronic_Product_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],
  'Communications': [
    { type: 'Subsector', id: 'Computer_and_Electronic_Product_Manufacturing', relationship: 'produced_by' },
    { type: 'Sector', id: 'Information', relationship: 'distributed_by' },
  ],
  'Audio Visual/Photography': [
    { type: 'Subsector', id: 'Computer_and_Electronic_Product_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],

  // Home & Furniture
  'Home Appliances': [
    { type: 'Subsector', id: 'Electrical_Equipment,_Appliance,_and_Component_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],
  'Household/Office Furniture/Furnishings': [
    { type: 'Subsector', id: 'Furniture_and_Related_Product_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],
  'Kitchenware and Tableware': [
    { type: 'NAICSIndustry', id: 'Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],

  // Building & Construction
  'Building Products': [
    { type: 'NAICSIndustry', id: 'Manufacturing', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Wood_Product_Manufacturing', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Nonmetallic_Mineral_Product_Manufacturing', relationship: 'produced_by' },
    { type: 'Sector', id: 'Construction', relationship: 'distributed_by' },
  ],
  'Plumbing/Heating/Ventilation/Air Conditioning': [
    { type: 'Subsector', id: 'Fabricated_Metal_Product_Manufacturing', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Machinery_Manufacturing', relationship: 'produced_by' },
    { type: 'Sector', id: 'Construction', relationship: 'distributed_by' },
  ],
  'Electrical Supplies': [
    { type: 'Subsector', id: 'Electrical_Equipment,_Appliance,_and_Component_Manufacturing', relationship: 'produced_by' },
    { type: 'Sector', id: 'Construction', relationship: 'distributed_by' },
  ],

  // Tools & Equipment
  'Tools/Equipment': [
    { type: 'Subsector', id: 'Fabricated_Metal_Product_Manufacturing', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Machinery_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],
  'Tool Storage/Workshop Aids': [
    { type: 'Subsector', id: 'Fabricated_Metal_Product_Manufacturing', relationship: 'produced_by' },
  ],

  // Vehicles & Transportation
  'Vehicle': [
    { type: 'Subsector', id: 'Transportation_Equipment_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],

  // Chemicals & Materials
  'Cleaning/Hygiene Products': [
    { type: 'Subsector', id: 'Chemical_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],
  'Pest/Plant Control Products': [
    { type: 'Subsector', id: 'Chemical_Manufacturing', relationship: 'produced_by' },
  ],
  'Lubricants': [
    { type: 'Subsector', id: 'Petroleum_and_Coal_Products_Manufacturing', relationship: 'produced_by' },
  ],
  'Fluids/Fuels/Gases': [
    { type: 'Subsector', id: 'Petroleum_and_Coal_Products_Manufacturing', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Chemical_Manufacturing', relationship: 'produced_by' },
  ],
  'Raw Materials (Non Food)': [
    { type: 'Sector', id: 'Mining,_Quarrying,_and_Oil_and_Gas_Extraction', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Manufacturing', relationship: 'produced_by' },
  ],

  // Industrial & Manufacturing
  'Industrial Fluid Pumps/Systems': [
    { type: 'Subsector', id: 'Machinery_Manufacturing', relationship: 'produced_by' },
  ],

  // Paper & Printing
  'Textual/Printed/Reference Materials': [
    { type: 'Subsector', id: 'Paper_Manufacturing', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Printing_and_Related_Support_Activities', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],
  'Stationery/Office Machinery/Occasion Supplies': [
    { type: 'Subsector', id: 'Paper_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],

  // Entertainment & Recreation
  'Music': [
    { type: 'Sector', id: 'Information', relationship: 'distributed_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],
  'Toys/Games': [
    { type: 'Subsector', id: 'Miscellaneous_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],
  'Sports Equipment': [
    { type: 'Subsector', id: 'Miscellaneous_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],
  'Camping': [
    { type: 'Subsector', id: 'Miscellaneous_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],

  // Arts & Crafts
  'Arts/Crafts/Needlework': [
    { type: 'Subsector', id: 'Miscellaneous_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],

  // Lawn & Garden
  'Lawn/Garden Supplies': [
    { type: 'Subsector', id: 'Chemical_Manufacturing', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Fabricated_Metal_Product_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],

  // Safety & Security
  'Safety/Protection - DIY': [
    { type: 'Subsector', id: 'Miscellaneous_Manufacturing', relationship: 'produced_by' },
  ],
  'Safety/Security/Surveillance': [
    { type: 'Subsector', id: 'Computer_and_Electronic_Product_Manufacturing', relationship: 'produced_by' },
  ],

  // Storage & Containers
  'Storage/Haulage Containers': [
    { type: 'Subsector', id: 'Plastics_and_Rubber_Products_Manufacturing', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Fabricated_Metal_Product_Manufacturing', relationship: 'produced_by' },
  ],

  // Personal Accessories
  'Personal Accessories': [
    { type: 'Subsector', id: 'Miscellaneous_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],

  // Services & Other
  'Services/Vending Machines': [
    { type: 'Subsector', id: 'Machinery_Manufacturing', relationship: 'produced_by' },
  ],
  'Postmortem Products': [
    { type: 'Subsector', id: 'Miscellaneous_Manufacturing', relationship: 'produced_by' },
  ],
  'Monetary Assets': [
    { type: 'Sector', id: 'Finance_and_Insurance', relationship: 'distributed_by' },
  ],
}

/**
 * UNSPSC Segment to NAICS Industry mappings
 */
const UNSPSC_TO_NAICS_MAPPINGS: Record<string, Array<{ type: string; id: string; relationship: string }>> = {
  // Live animals and plants
  'Live Plant and Animal Material and Accessories and Supplies': [
    { type: 'Sector', id: 'Agriculture,_Forestry,_Fishing_and_Hunting', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Crop_Production', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Animal_Production_and_Aquaculture', relationship: 'produced_by' },
  ],

  // Raw materials
  'Mineral and Textile and Inedible Plant and Animal Materials': [
    { type: 'Sector', id: 'Mining,_Quarrying,_and_Oil_and_Gas_Extraction', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Textile_Mills', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Manufacturing', relationship: 'produced_by' },
  ],

  // Chemicals
  'Chemicals including Bio Chemicals and Gas Materials': [
    { type: 'Subsector', id: 'Chemical_Manufacturing', relationship: 'produced_by' },
  ],

  // Rubber, plastics, resin
  'Resin and Rosin and Rubber and Foam and Film and Elastomeric Materials': [
    { type: 'Subsector', id: 'Plastics_and_Rubber_Products_Manufacturing', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Chemical_Manufacturing', relationship: 'produced_by' },
  ],

  // Paper
  'Paper Materials and Products': [
    { type: 'Subsector', id: 'Paper_Manufacturing', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Printing_and_Related_Support_Activities', relationship: 'produced_by' },
  ],

  // Fuels
  'Fuels and Fuel Additives and Lubricants and Anti corrosive Materials': [
    { type: 'Subsector', id: 'Petroleum_and_Coal_Products_Manufacturing', relationship: 'produced_by' },
    { type: 'Sector', id: 'Mining,_Quarrying,_and_Oil_and_Gas_Extraction', relationship: 'produced_by' },
  ],

  // Mining machinery
  'Mining and Well Drilling Machinery and Accessories': [
    { type: 'Subsector', id: 'Machinery_Manufacturing', relationship: 'produced_by' },
    { type: 'Sector', id: 'Mining,_Quarrying,_and_Oil_and_Gas_Extraction', relationship: 'distributed_by' },
  ],

  // Agricultural machinery
  'Farming and Fishing and Forestry and Wildlife Machinery and Accessories': [
    { type: 'Subsector', id: 'Machinery_Manufacturing', relationship: 'produced_by' },
    { type: 'Sector', id: 'Agriculture,_Forestry,_Fishing_and_Hunting', relationship: 'distributed_by' },
  ],

  // Construction machinery
  'Building and Construction Machinery and Accessories': [
    { type: 'Subsector', id: 'Machinery_Manufacturing', relationship: 'produced_by' },
    { type: 'Sector', id: 'Construction', relationship: 'distributed_by' },
  ],

  // Manufacturing machinery
  'Industrial Manufacturing and Processing Machinery and Accessories': [
    { type: 'Subsector', id: 'Machinery_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Manufacturing', relationship: 'distributed_by' },
  ],

  // Material handling
  'Material Handling and Conditioning and Storage Machinery and their Accessories and Supplies': [
    { type: 'Subsector', id: 'Machinery_Manufacturing', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Warehousing_and_Storage', relationship: 'distributed_by' },
  ],

  // Vehicles
  'Vehicles and their Accessories and Components': [
    { type: 'Subsector', id: 'Transportation_Equipment_Manufacturing', relationship: 'produced_by' },
    { type: 'NAICSIndustry', id: 'Retail_Trade', relationship: 'distributed_by' },
  ],

  // Power generation
  'Power Generation and Distribution Machinery and Accessories': [
    { type: 'Subsector', id: 'Machinery_Manufacturing', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Electrical_Equipment,_Appliance,_and_Component_Manufacturing', relationship: 'produced_by' },
    { type: 'Sector', id: 'Utilities', relationship: 'distributed_by' },
  ],

  // General tools
  'Tools and General Machinery': [
    { type: 'Subsector', id: 'Fabricated_Metal_Product_Manufacturing', relationship: 'produced_by' },
    { type: 'Subsector', id: 'Machinery_Manufacturing', relationship: 'produced_by' },
  ],

  // Services
  'Healthcare Services': [
    { type: 'Sector', id: 'Health_Care_and_Social_Assistance', relationship: 'distributed_by' },
  ],
  'Education and Training Services': [
    { type: 'Sector', id: 'Educational_Services', relationship: 'distributed_by' },
  ],
  'Travel and Food and Lodging and Entertainment Services': [
    { type: 'Sector', id: 'Accommodation_and_Food_Services', relationship: 'distributed_by' },
    { type: 'Sector', id: 'Arts,_Entertainment,_and_Recreation', relationship: 'distributed_by' },
  ],
  'Personal and Domestic Services': [
    { type: 'Sector', id: 'Other_Services_(except_Public_Administration)', relationship: 'distributed_by' },
  ],
  'Public Order and Security and Safety Services': [
    { type: 'Sector', id: 'Public_Administration', relationship: 'distributed_by' },
  ],
  'Politics and Civic Affairs Services': [
    { type: 'Sector', id: 'Public_Administration', relationship: 'distributed_by' },
  ],
  'Organizations and Clubs': [
    { type: 'Sector', id: 'Other_Services_(except_Public_Administration)', relationship: 'distributed_by' },
  ],
  'Land and Buildings and Structures and Thoroughfares': [
    { type: 'Sector', id: 'Construction', relationship: 'produced_by' },
    { type: 'Sector', id: 'Real_Estate_and_Rental_and_Leasing', relationship: 'distributed_by' },
  ],
}

/**
 * Transform product-industry crosswalk data
 */
export async function transformProductIndustryCrosswalk(): Promise<void> {
  console.log('\n🔗 Transforming Product-Industry Crosswalk...')

  // Load data files
  const gs1Segments = parseTSV<ProductSegment>(join(process.cwd(), '.data', 'GS1.Segments.tsv'))
  const unspscSegments = parseTSV<ProductSegment>(join(process.cwd(), '.data', 'UNSPSC.Segments.tsv'))
  const naicsIndustries = parseTSV<NAICSIndustry>(join(process.cwd(), '.data', 'NAICS.Industries.tsv'))

  console.log(`  Loaded ${gs1Segments.length} GS1 segments`)
  console.log(`  Loaded ${unspscSegments.length} UNSPSC segments`)
  console.log(`  Loaded ${naicsIndustries.length} NAICS industries`)

  // Create NAICS lookup by type and ID
  const naicsLookup = new Map<string, NAICSIndustry>()
  for (const industry of naicsIndustries) {
    const key = `${industry.type}:${industry.id}`
    naicsLookup.set(key, industry)
  }

  // Generate GS1 to NAICS relationships
  const gs1Relationships: RelationshipRecord[] = []
  let gs1MappedCount = 0

  for (const segment of gs1Segments) {
    const mappings = GS1_TO_NAICS_MAPPINGS[segment.name]
    if (mappings) {
      gs1MappedCount++
      for (const mapping of mappings) {
        const key = `${mapping.type}:${mapping.id}`
        const naicsIndustry = naicsLookup.get(key)

        if (naicsIndustry) {
          gs1Relationships.push({
            fromNs: segment.ns,
            fromType: segment.type,
            fromId: segment.id,
            toNs: naicsIndustry.ns,
            toType: naicsIndustry.type,
            toId: naicsIndustry.id,
            relationshipType: mapping.relationship,
          })
        } else {
          console.warn(`    ⚠ NAICS industry not found: ${mapping.type} - ${mapping.id}`)
        }
      }
    }
  }

  // Generate UNSPSC to NAICS relationships
  const unspscRelationships: RelationshipRecord[] = []
  let unspscMappedCount = 0

  for (const segment of unspscSegments) {
    const mappings = UNSPSC_TO_NAICS_MAPPINGS[segment.name]
    if (mappings) {
      unspscMappedCount++
      for (const mapping of mappings) {
        const key = `${mapping.type}:${mapping.id}`
        const naicsIndustry = naicsLookup.get(key)

        if (naicsIndustry) {
          unspscRelationships.push({
            fromNs: segment.ns,
            fromType: segment.type,
            fromId: segment.id,
            toNs: naicsIndustry.ns,
            toType: naicsIndustry.type,
            toId: naicsIndustry.id,
            relationshipType: mapping.relationship,
          })
        } else {
          console.warn(`    ⚠ NAICS industry not found: ${mapping.type} - ${mapping.id}`)
        }
      }
    }
  }

  // Write relationship files
  const relPath = getRelationshipsPath()

  writeRelationshipTSV(
    join(relPath, 'GS1.Segment.NAICS.Industry.tsv'),
    gs1Relationships
  )

  writeRelationshipTSV(
    join(relPath, 'UNSPSC.Segment.NAICS.Industry.tsv'),
    unspscRelationships
  )

  console.log(`  ✓ GS1 to NAICS: ${gs1MappedCount}/${gs1Segments.length} segments mapped, ${gs1Relationships.length} relationships`)
  console.log(`  ✓ UNSPSC to NAICS: ${unspscMappedCount}/${unspscSegments.length} segments mapped, ${unspscRelationships.length} relationships`)
}

// Allow running this script directly
if (import.meta.main) {
  transformProductIndustryCrosswalk()
    .then(() => {
      console.log('✓ Product-Industry Crosswalk transformation complete')
      process.exit(0)
    })
    .catch(error => {
      console.error('Error transforming product-industry crosswalk:', error)
      process.exit(1)
    })
}
