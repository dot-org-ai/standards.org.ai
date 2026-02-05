#!/usr/bin/env npx tsx
/**
 * APQC to NAICS Crosswalk Generator
 *
 * Creates two crosswalk mapping files:
 * 1. APQC.Industry.NAICS.Industry.tsv - Maps 17 APQC industries to NAICS codes
 * 2. APQC.Category.NAICS.Sector.tsv - Maps 13 APQC process categories to 20 NAICS sectors
 *
 * This is a manually-curated mapping based on subject-matter analysis of the
 * APQC Process Classification Framework and NAICS 2022 industry codes.
 */

import { join } from 'path'
import { writeFileSync, mkdirSync, existsSync } from 'fs'

const ROOT = import.meta.dirname
const REL_DIR = join(ROOT, '..', '.data', 'relationships')

// ─── Namespaces ──────────────────────────────────────────────────────────────

const APQC_NS = 'apqc.org.ai'
const NAICS_NS = 'naics.org.ai'

// ─── NAICS Sector Definitions ────────────────────────────────────────────────

interface NAICSSector {
  code: string
  name: string
  id: string
  type: string // Sector or NAICSIndustry (for compound-code sectors)
}

const NAICS_SECTORS: NAICSSector[] = [
  { code: '11', name: 'Agriculture, Forestry, Fishing and Hunting', id: 'Agriculture,_Forestry,_Fishing_and_Hunting', type: 'Sector' },
  { code: '21', name: 'Mining, Quarrying, and Oil and Gas Extraction', id: 'Mining,_Quarrying,_and_Oil_and_Gas_Extraction', type: 'Sector' },
  { code: '22', name: 'Utilities', id: 'Utilities', type: 'Sector' },
  { code: '23', name: 'Construction', id: 'Construction', type: 'Sector' },
  { code: '31-33', name: 'Manufacturing', id: 'Manufacturing', type: 'NAICSIndustry' },
  { code: '42', name: 'Wholesale Trade', id: 'Wholesale_Trade', type: 'Sector' },
  { code: '44-45', name: 'Retail Trade', id: 'Retail_Trade', type: 'NAICSIndustry' },
  { code: '48-49', name: 'Transportation and Warehousing', id: 'Transportation_and_Warehousing', type: 'NAICSIndustry' },
  { code: '51', name: 'Information', id: 'Information', type: 'Sector' },
  { code: '52', name: 'Finance and Insurance', id: 'Finance_and_Insurance', type: 'Sector' },
  { code: '53', name: 'Real Estate and Rental and Leasing', id: 'Real_Estate_and_Rental_and_Leasing', type: 'Sector' },
  { code: '54', name: 'Professional, Scientific, and Technical Services', id: 'Professional,_Scientific,_and_Technical_Services', type: 'Sector' },
  { code: '55', name: 'Management of Companies and Enterprises', id: 'Management_of_Companies_and_Enterprises', type: 'Sector' },
  { code: '56', name: 'Administrative and Support and Waste Management and Remediation Services', id: 'Administrative_and_Support_and_Waste_Management_and_Remediation_Services', type: 'Sector' },
  { code: '61', name: 'Educational Services', id: 'Educational_Services', type: 'Sector' },
  { code: '62', name: 'Health Care and Social Assistance', id: 'Health_Care_and_Social_Assistance', type: 'Sector' },
  { code: '71', name: 'Arts, Entertainment, and Recreation', id: 'Arts,_Entertainment,_and_Recreation', type: 'Sector' },
  { code: '72', name: 'Accommodation and Food Services', id: 'Accommodation_and_Food_Services', type: 'Sector' },
  { code: '81', name: 'Other Services (except Public Administration)', id: 'Other_Services_(except_Public_Administration)', type: 'Sector' },
  { code: '92', name: 'Public Administration', id: 'Public_Administration', type: 'Sector' },
]

// ─── APQC Industry → NAICS Mapping ──────────────────────────────────────────

interface IndustryMapping {
  apqcIndustry: string
  naicsType: string
  naicsId: string
  coverage: 'universal' | 'full' | 'primary' | 'partial'
  notes: string
}

const INDUSTRY_MAPPINGS: IndustryMapping[] = [
  // cross-industry → ALL sectors
  ...NAICS_SECTORS.map((s): IndustryMapping => ({
    apqcIndustry: 'Cross_Industry',
    naicsType: s.type,
    naicsId: s.id,
    coverage: 'universal',
    notes: 'Cross-industry processes apply to all NAICS sectors',
  })),

  // aerospace-and-defense → Transportation Equipment Manufacturing
  { apqcIndustry: 'aerospace-and-defense', naicsType: 'IndustryGroup', naicsId: 'Aerospace_Product_and_Parts_Manufacturing', coverage: 'primary', notes: 'NAICS 3364 - Aerospace Product and Parts Manufacturing' },
  { apqcIndustry: 'aerospace-and-defense', naicsType: 'IndustryGroup', naicsId: 'Ship_and_Boat_Building', coverage: 'primary', notes: 'NAICS 3366 - Ship and Boat Building' },
  { apqcIndustry: 'aerospace-and-defense', naicsType: 'IndustryGroup', naicsId: 'Other_Transportation_Equipment_Manufacturing', coverage: 'primary', notes: 'NAICS 3369 - Other Transportation Equipment Manufacturing' },

  // airline → Scheduled Air Transportation
  { apqcIndustry: 'airline', naicsType: 'IndustryGroup', naicsId: 'Scheduled_Air_Transportation', coverage: 'full', notes: 'NAICS 4811 - Scheduled Air Transportation' },

  // automotive → Motor Vehicle Manufacturing + Dealers
  { apqcIndustry: 'automotive', naicsType: 'IndustryGroup', naicsId: 'Motor_Vehicle_Manufacturing', coverage: 'primary', notes: 'NAICS 3361 - Motor Vehicle Manufacturing' },
  { apqcIndustry: 'automotive', naicsType: 'IndustryGroup', naicsId: 'Motor_Vehicle_Body_and_Trailer_Manufacturing', coverage: 'primary', notes: 'NAICS 3362 - Motor Vehicle Body and Trailer Manufacturing' },
  { apqcIndustry: 'automotive', naicsType: 'IndustryGroup', naicsId: 'Motor_Vehicle_Parts_Manufacturing', coverage: 'primary', notes: 'NAICS 3363 - Motor Vehicle Parts Manufacturing' },
  { apqcIndustry: 'automotive', naicsType: 'IndustryGroup', naicsId: 'Automobile_Dealers', coverage: 'partial', notes: 'NAICS 4411 - Automobile Dealers' },
  { apqcIndustry: 'automotive', naicsType: 'IndustryGroup', naicsId: 'Other_Motor_Vehicle_Dealers', coverage: 'partial', notes: 'NAICS 4412 - Other Motor Vehicle Dealers' },
  { apqcIndustry: 'automotive', naicsType: 'IndustryGroup', naicsId: 'Automotive_Parts,_Accessories,_and_Tire_Retailers', coverage: 'partial', notes: 'NAICS 4413 - Automotive Parts, Accessories, and Tire Retailers' },

  // banking → Depository/Nondepository Credit
  { apqcIndustry: 'banking', naicsType: 'IndustryGroup', naicsId: 'Monetary_Authorities-Central_Bank', coverage: 'primary', notes: 'NAICS 5211 - Monetary Authorities-Central Bank' },
  { apqcIndustry: 'banking', naicsType: 'IndustryGroup', naicsId: 'Depository_Credit_Intermediation', coverage: 'primary', notes: 'NAICS 5221 - Depository Credit Intermediation' },
  { apqcIndustry: 'banking', naicsType: 'IndustryGroup', naicsId: 'Nondepository_Credit_Intermediation', coverage: 'primary', notes: 'NAICS 5222 - Nondepository Credit Intermediation' },
  { apqcIndustry: 'banking', naicsType: 'IndustryGroup', naicsId: 'Activities_Related_to_Credit_Intermediation', coverage: 'primary', notes: 'NAICS 5223 - Activities Related to Credit Intermediation' },

  // broadcasting → Radio/TV Broadcasting + Content Providers
  { apqcIndustry: 'broadcasting', naicsType: 'IndustryGroup', naicsId: 'Radio_and_Television_Broadcasting_Stations', coverage: 'full', notes: 'NAICS 5161 - Radio and Television Broadcasting Stations' },
  { apqcIndustry: 'broadcasting', naicsType: 'IndustryGroup', naicsId: 'Media_Streaming_Distribution_Services,_Social_Networks,_and_Other_Media_Networks_and_Content_Providers', coverage: 'full', notes: 'NAICS 5162 - Media Streaming Distribution Services and Content Providers' },

  // city-government → Executive/Legislative
  { apqcIndustry: 'city-government', naicsType: 'IndustryGroup', naicsId: 'Executive,_Legislative,_and_Other_General_Government_Support', coverage: 'primary', notes: 'NAICS 9211 - Executive, Legislative, and Other General Government Support' },

  // consumer-electronics → Computer/Electronic Manufacturing + Retail
  { apqcIndustry: 'consumer-electronics', naicsType: 'IndustryGroup', naicsId: 'Computer_and_Peripheral_Equipment_Manufacturing', coverage: 'primary', notes: 'NAICS 3341 - Computer and Peripheral Equipment Manufacturing' },
  { apqcIndustry: 'consumer-electronics', naicsType: 'IndustryGroup', naicsId: 'Communications_Equipment_Manufacturing', coverage: 'primary', notes: 'NAICS 3342 - Communications Equipment Manufacturing' },
  { apqcIndustry: 'consumer-electronics', naicsType: 'IndustryGroup', naicsId: 'Audio_and_Video_Equipment_Manufacturing', coverage: 'primary', notes: 'NAICS 3343 - Audio and Video Equipment Manufacturing' },
  { apqcIndustry: 'consumer-electronics', naicsType: 'IndustryGroup', naicsId: 'Semiconductor_and_Other_Electronic_Component_Manufacturing', coverage: 'primary', notes: 'NAICS 3344 - Semiconductor and Other Electronic Component Manufacturing' },
  { apqcIndustry: 'consumer-electronics', naicsType: 'IndustryGroup', naicsId: 'Navigational,_Measuring,_Electromedical,_and_Control_Instruments_Manufacturing', coverage: 'primary', notes: 'NAICS 3345 - Navigational, Measuring, Electromedical, and Control Instruments Manufacturing' },
  { apqcIndustry: 'consumer-electronics', naicsType: 'IndustryGroup', naicsId: 'Manufacturing_and_Reproducing_Magnetic_and_Optical_Media', coverage: 'primary', notes: 'NAICS 3346 - Manufacturing and Reproducing Magnetic and Optical Media' },
  { apqcIndustry: 'consumer-electronics', naicsType: 'IndustryGroup', naicsId: 'Electronics_and_Appliance_Retailers', coverage: 'partial', notes: 'NAICS 4492 - Electronics and Appliance Retailers' },

  // consumer-products → Food/Beverage/Textile/Chemical Manufacturing
  { apqcIndustry: 'consumer-products', naicsType: 'Subsector', naicsId: 'Food_Manufacturing', coverage: 'primary', notes: 'NAICS 311 - Food Manufacturing' },
  { apqcIndustry: 'consumer-products', naicsType: 'Subsector', naicsId: 'Beverage_and_Tobacco_Product_Manufacturing', coverage: 'primary', notes: 'NAICS 312 - Beverage and Tobacco Product Manufacturing' },
  { apqcIndustry: 'consumer-products', naicsType: 'Subsector', naicsId: 'Textile_Mills', coverage: 'primary', notes: 'NAICS 313 - Textile Mills' },
  { apqcIndustry: 'consumer-products', naicsType: 'Subsector', naicsId: 'Textile_Product_Mills', coverage: 'primary', notes: 'NAICS 314 - Textile Product Mills' },
  { apqcIndustry: 'consumer-products', naicsType: 'Subsector', naicsId: 'Apparel_Manufacturing', coverage: 'primary', notes: 'NAICS 315 - Apparel Manufacturing' },
  { apqcIndustry: 'consumer-products', naicsType: 'Subsector', naicsId: 'Leather_and_Allied_Product_Manufacturing', coverage: 'primary', notes: 'NAICS 316 - Leather and Allied Product Manufacturing' },
  { apqcIndustry: 'consumer-products', naicsType: 'Subsector', naicsId: 'Paper_Manufacturing', coverage: 'primary', notes: 'NAICS 322 - Paper Manufacturing' },
  { apqcIndustry: 'consumer-products', naicsType: 'Subsector', naicsId: 'Chemical_Manufacturing', coverage: 'primary', notes: 'NAICS 325 - Chemical Manufacturing' },

  // education → Educational Services
  { apqcIndustry: 'education', naicsType: 'IndustryGroup', naicsId: 'Elementary_and_Secondary_Schools', coverage: 'full', notes: 'NAICS 6111 - Elementary and Secondary Schools' },
  { apqcIndustry: 'education', naicsType: 'IndustryGroup', naicsId: 'Junior_Colleges', coverage: 'full', notes: 'NAICS 6112 - Junior Colleges' },
  { apqcIndustry: 'education', naicsType: 'IndustryGroup', naicsId: 'Colleges,_Universities,_and_Professional_Schools', coverage: 'full', notes: 'NAICS 6113 - Colleges, Universities, and Professional Schools' },
  { apqcIndustry: 'education', naicsType: 'IndustryGroup', naicsId: 'Business_Schools_and_Computer_and_Management_Training', coverage: 'full', notes: 'NAICS 6114 - Business Schools and Computer and Management Training' },
  { apqcIndustry: 'education', naicsType: 'IndustryGroup', naicsId: 'Technical_and_Trade_Schools', coverage: 'full', notes: 'NAICS 6115 - Technical and Trade Schools' },
  { apqcIndustry: 'education', naicsType: 'IndustryGroup', naicsId: 'Other_Schools_and_Instruction', coverage: 'full', notes: 'NAICS 6116 - Other Schools and Instruction' },
  { apqcIndustry: 'education', naicsType: 'IndustryGroup', naicsId: 'Educational_Support_Services', coverage: 'full', notes: 'NAICS 6117 - Educational Support Services' },

  // health-insurance → Direct Health Insurance
  { apqcIndustry: 'health-insurance', naicsType: 'NationalIndustry', naicsId: 'Direct_Health_and_Medical_Insurance_Carriers', coverage: 'full', notes: 'NAICS 524114 - Direct Health and Medical Insurance Carriers' },

  // healthcare-provider → Ambulatory/Hospitals/Nursing
  { apqcIndustry: 'healthcare-provider', naicsType: 'Subsector', naicsId: 'Ambulatory_Health_Care_Services', coverage: 'primary', notes: 'NAICS 621 - Ambulatory Health Care Services' },
  { apqcIndustry: 'healthcare-provider', naicsType: 'Subsector', naicsId: 'Hospitals', coverage: 'primary', notes: 'NAICS 622 - Hospitals' },
  { apqcIndustry: 'healthcare-provider', naicsType: 'Subsector', naicsId: 'Nursing_and_Residential_Care_Facilities', coverage: 'primary', notes: 'NAICS 623 - Nursing and Residential Care Facilities' },

  // life-sciences → Pharma/Medical Equipment + R&D/Labs
  { apqcIndustry: 'life-sciences', naicsType: 'IndustryGroup', naicsId: 'Pharmaceutical_and_Medicine_Manufacturing', coverage: 'primary', notes: 'NAICS 3254 - Pharmaceutical and Medicine Manufacturing' },
  { apqcIndustry: 'life-sciences', naicsType: 'IndustryGroup', naicsId: 'Medical_Equipment_and_Supplies_Manufacturing', coverage: 'primary', notes: 'NAICS 3391 - Medical Equipment and Supplies Manufacturing' },
  { apqcIndustry: 'life-sciences', naicsType: 'IndustryGroup', naicsId: 'Scientific_Research_and_Development_Services', coverage: 'partial', notes: 'NAICS 5417 - Scientific Research and Development Services' },
  { apqcIndustry: 'life-sciences', naicsType: 'IndustryGroup', naicsId: 'Medical_and_Diagnostic_Laboratories', coverage: 'partial', notes: 'NAICS 6215 - Medical and Diagnostic Laboratories' },

  // petroleum-downstream → Refineries + Wholesale
  { apqcIndustry: 'petroleum-downstream', naicsType: 'NAICSIndustry', naicsId: 'Petroleum_Refineries', coverage: 'primary', notes: 'NAICS 32411 - Petroleum Refineries' },
  { apqcIndustry: 'petroleum-downstream', naicsType: 'IndustryGroup', naicsId: 'Petroleum_and_Petroleum_Products_Merchant_Wholesalers', coverage: 'partial', notes: 'NAICS 4247 - Petroleum and Petroleum Products Merchant Wholesalers' },

  // petroleum-upstream → Extraction + Support
  { apqcIndustry: 'petroleum-upstream', naicsType: 'IndustryGroup', naicsId: 'Oil_and_Gas_Extraction', coverage: 'primary', notes: 'NAICS 2111 - Oil and Gas Extraction' },
  { apqcIndustry: 'petroleum-upstream', naicsType: 'IndustryGroup', naicsId: 'Support_Activities_for_Mining', coverage: 'primary', notes: 'NAICS 2131 - Support Activities for Mining' },

  // property-and-casualty-insurance → P&C Insurance
  { apqcIndustry: 'property-and-casualty-insurance', naicsType: 'NationalIndustry', naicsId: 'Direct_Property_and_Casualty_Insurance_Carriers', coverage: 'full', notes: 'NAICS 524126 - Direct Property and Casualty Insurance Carriers' },

  // retail → All Retail Trade
  { apqcIndustry: 'retail', naicsType: 'NAICSIndustry', naicsId: 'Retail_Trade', coverage: 'full', notes: 'NAICS 44-45 - All Retail Trade' },

  // telecommunications → Telecom subsectors
  { apqcIndustry: 'telecommunications', naicsType: 'IndustryGroup', naicsId: 'Wired_and_Wireless_Telecommunications_(except_Satellite)', coverage: 'full', notes: 'NAICS 5171 - Wired and Wireless Telecommunications (except Satellite)' },
  { apqcIndustry: 'telecommunications', naicsType: 'IndustryGroup', naicsId: 'Satellite_Telecommunications', coverage: 'full', notes: 'NAICS 5174 - Satellite Telecommunications' },
  { apqcIndustry: 'telecommunications', naicsType: 'IndustryGroup', naicsId: 'All_Other_Telecommunications', coverage: 'full', notes: 'NAICS 5178 - All Other Telecommunications' },

  // utilities → Electric/Gas/Water
  { apqcIndustry: 'utilities', naicsType: 'IndustryGroup', naicsId: 'Electric_Power_Generation,_Transmission_and_Distribution', coverage: 'full', notes: 'NAICS 2211 - Electric Power Generation, Transmission and Distribution' },
]

// ─── APQC Category Definitions ───────────────────────────────────────────────

interface APQCCategory {
  number: number
  name: string
}

const APQC_CATEGORIES: APQCCategory[] = [
  { number: 1, name: 'Develop Vision and Strategy' },
  { number: 2, name: 'Design and Develop Products and Services' },
  { number: 3, name: 'Market and Sell Products and Services' },
  { number: 4, name: 'Deliver Products' },
  { number: 5, name: 'Deliver Services' },
  { number: 6, name: 'Manage Customer Service' },
  { number: 7, name: 'Develop and Manage Human Capital' },
  { number: 8, name: 'Manage Information Technology' },
  { number: 9, name: 'Manage Financial Resources' },
  { number: 10, name: 'Acquire, Construct, and Manage Assets' },
  { number: 11, name: 'Manage Enterprise Risk, Compliance, Remediation, and Resiliency' },
  { number: 12, name: 'Manage External Relationships' },
  { number: 13, name: 'Develop and Manage Business Capabilities' },
]

// ─── Applicability Rules ─────────────────────────────────────────────────────

type Applicability = 'universal' | 'applicable' | 'partial' | 'not-applicable'

// Sectors where Category 4 (Deliver Products) is applicable
const CAT4_APPLICABLE = new Set(['11', '21', '22', '23', '31-33', '42', '44-45'])
const CAT4_PARTIAL = new Set(['48-49', '51'])
// All others are not-applicable

// Sectors where Category 5 (Deliver Services) is applicable
const CAT5_APPLICABLE = new Set(['51', '52', '54', '55', '56', '61', '62', '71', '72', '81', '92'])
const CAT5_PARTIAL = new Set(['11', '21', '22', '23', '31-33', '42', '44-45', '48-49', '53'])
// No not-applicable for Cat 5

function getApplicability(categoryNumber: number, sectorCode: string): { applicability: Applicability, notes: string } {
  // Universal categories: 1, 7, 8, 9, 10, 11, 12, 13
  const universalCategories = new Set([1, 7, 8, 9, 10, 11, 12, 13])
  if (universalCategories.has(categoryNumber)) {
    const universalNotes: Record<number, string> = {
      1: 'Strategic planning applies to all sectors',
      7: 'HR management applies to all sectors',
      8: 'IT management applies to all sectors',
      9: 'Financial management applies to all sectors',
      10: 'Asset management applies to all sectors',
      11: 'Risk and compliance management applies to all sectors',
      12: 'External relationship management applies to all sectors',
      13: 'Business capability development applies to all sectors',
    }
    return { applicability: 'universal', notes: universalNotes[categoryNumber] || '' }
  }

  // Category 2 (Design Products/Services) - applicable for all
  if (categoryNumber === 2) {
    return { applicability: 'applicable', notes: getCategory2Notes(sectorCode) }
  }

  // Category 3 (Market/Sell) - applicable for all
  if (categoryNumber === 3) {
    return { applicability: 'applicable', notes: getCategory3Notes(sectorCode) }
  }

  // Category 4 (Deliver Products)
  if (categoryNumber === 4) {
    if (CAT4_APPLICABLE.has(sectorCode)) {
      return { applicability: 'applicable', notes: getCategory4Notes(sectorCode) }
    }
    if (CAT4_PARTIAL.has(sectorCode)) {
      return { applicability: 'partial', notes: getCategory4Notes(sectorCode) }
    }
    return { applicability: 'not-applicable', notes: 'Primarily service-based sector' }
  }

  // Category 5 (Deliver Services)
  if (categoryNumber === 5) {
    if (CAT5_APPLICABLE.has(sectorCode)) {
      return { applicability: 'applicable', notes: getCategory5Notes(sectorCode) }
    }
    if (CAT5_PARTIAL.has(sectorCode)) {
      return { applicability: 'partial', notes: getCategory5Notes(sectorCode) }
    }
    return { applicability: 'not-applicable', notes: 'Primarily product-based sector' }
  }

  // Category 6 (Customer Service) - applicable for all
  if (categoryNumber === 6) {
    return { applicability: 'applicable', notes: getCategory6Notes(sectorCode) }
  }

  // Fallback
  return { applicability: 'applicable', notes: '' }
}

function getCategory2Notes(code: string): string {
  const notes: Record<string, string> = {
    '11': 'Agricultural product and service development',
    '21': 'Extraction technology and service development',
    '22': 'Utility service and infrastructure development',
    '23': 'Construction method and service development',
    '31-33': 'Core manufacturing product development',
    '42': 'Distribution service development',
    '44-45': 'Retail product and service development',
    '48-49': 'Transportation service development',
    '51': 'Information product and content development',
    '52': 'Financial product and service development',
    '53': 'Property and leasing service development',
    '54': 'Professional service development',
    '55': 'Management service development',
    '56': 'Administrative service development',
    '61': 'Educational program development',
    '62': 'Healthcare service development',
    '71': 'Entertainment and recreation offering development',
    '72': 'Hospitality service development',
    '81': 'Service development across other services',
    '92': 'Public program and service development',
  }
  return notes[code] || ''
}

function getCategory3Notes(code: string): string {
  const notes: Record<string, string> = {
    '11': 'Marketing of agricultural products',
    '21': 'Marketing of extracted resources',
    '22': 'Utility service marketing',
    '23': 'Construction services marketing',
    '31-33': 'Core manufacturing sales and marketing',
    '42': 'Wholesale distribution marketing',
    '44-45': 'Core retail marketing and merchandising',
    '48-49': 'Transportation service marketing',
    '51': 'Information product marketing',
    '52': 'Financial product marketing',
    '53': 'Property marketing and leasing',
    '54': 'Professional service marketing',
    '55': 'Corporate service marketing',
    '56': 'Administrative service marketing',
    '61': 'Educational service marketing and enrollment',
    '62': 'Healthcare service marketing',
    '71': 'Entertainment and event marketing',
    '72': 'Hospitality marketing',
    '81': 'Service marketing across other services',
    '92': 'Public service outreach and communication',
  }
  return notes[code] || ''
}

function getCategory4Notes(code: string): string {
  const notes: Record<string, string> = {
    '11': 'Agricultural product delivery and distribution',
    '21': 'Resource extraction and delivery',
    '22': 'Utility delivery infrastructure',
    '23': 'Construction project delivery',
    '31-33': 'Core manufacturing product delivery',
    '42': 'Wholesale product distribution',
    '44-45': 'Retail product delivery and fulfillment',
    '48-49': 'Transportation as product delivery enabler',
    '51': 'Physical media and hardware delivery',
    '53': 'Property and equipment delivery',
  }
  return notes[code] || 'Primarily service-based sector'
}

function getCategory5Notes(code: string): string {
  const notes: Record<string, string> = {
    '11': 'Agricultural support services',
    '21': 'Mining support services',
    '22': 'Utility service delivery',
    '23': 'Construction project management services',
    '31-33': 'After-sales and maintenance services',
    '42': 'Value-added distribution services',
    '44-45': 'Retail customer services',
    '48-49': 'Transportation and logistics services',
    '51': 'Core information service delivery',
    '52': 'Core financial service delivery',
    '53': 'Property management services',
    '54': 'Core professional service delivery',
    '55': 'Core management service delivery',
    '56': 'Core administrative service delivery',
    '61': 'Core educational service delivery',
    '62': 'Core healthcare service delivery',
    '71': 'Core entertainment and recreation service delivery',
    '72': 'Core hospitality service delivery',
    '81': 'Core service delivery for other services',
    '92': 'Core public service delivery',
  }
  return notes[code] || ''
}

function getCategory6Notes(code: string): string {
  const notes: Record<string, string> = {
    '11': 'Agricultural customer support',
    '21': 'Mining client service management',
    '22': 'Utility customer service',
    '23': 'Construction client management',
    '31-33': 'Manufacturing customer support',
    '42': 'Wholesale customer service',
    '44-45': 'Core retail customer service',
    '48-49': 'Transportation customer service',
    '51': 'Information service customer support',
    '52': 'Financial customer service',
    '53': 'Property management customer service',
    '54': 'Professional client service',
    '55': 'Corporate customer service',
    '56': 'Administrative customer service',
    '61': 'Student and stakeholder service',
    '62': 'Patient and client service',
    '71': 'Patron and visitor service',
    '72': 'Guest service management',
    '81': 'Customer service for other services',
    '92': 'Citizen service management',
  }
  return notes[code] || ''
}

// ─── TSV Writing ─────────────────────────────────────────────────────────────

function escapeForTSV(value: string): string {
  return value.replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\r/g, '')
}

function writeTSV(filePath: string, headers: string[], rows: string[][]): void {
  const lines = [
    headers.join('\t'),
    ...rows.map(row => row.map(escapeForTSV).join('\t')),
  ]
  writeFileSync(filePath, lines.join('\n'), 'utf-8')
  console.log(`Wrote ${rows.length} records to ${filePath}`)
}

// ─── Main ────────────────────────────────────────────────────────────────────

function generateIndustryMapping(): void {
  console.log('=== Generating APQC Industry to NAICS Industry Crosswalk ===')

  const headers = ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType', 'coverage', 'notes']
  const rows: string[][] = INDUSTRY_MAPPINGS.map(m => [
    APQC_NS,
    'Industry',
    m.apqcIndustry,
    NAICS_NS,
    m.naicsType,
    m.naicsId,
    'maps_to',
    m.coverage,
    m.notes,
  ])

  const outputPath = join(REL_DIR, 'APQC.Industry.NAICS.Industry.tsv')
  writeTSV(outputPath, headers, rows)
  console.log(`  ${rows.length} industry mappings across ${new Set(INDUSTRY_MAPPINGS.map(m => m.apqcIndustry)).size} APQC industries`)
}

function generateCategoryApplicability(): void {
  console.log('=== Generating APQC Category to NAICS Sector Applicability Matrix ===')

  const headers = ['apqcCategory', 'categoryName', 'naicsSectorCode', 'naicsSectorName', 'applicability', 'notes']
  const rows: string[][] = []

  for (const category of APQC_CATEGORIES) {
    for (const sector of NAICS_SECTORS) {
      const { applicability, notes } = getApplicability(category.number, sector.code)
      rows.push([
        String(category.number),
        category.name,
        sector.code,
        sector.name,
        applicability,
        notes,
      ])
    }
  }

  const outputPath = join(REL_DIR, 'APQC.Category.NAICS.Sector.tsv')
  writeTSV(outputPath, headers, rows)

  // Summary statistics
  const counts = { universal: 0, applicable: 0, partial: 0, 'not-applicable': 0 }
  for (const row of rows) {
    counts[row[4] as keyof typeof counts]++
  }
  console.log(`  ${rows.length} total cells (${APQC_CATEGORIES.length} categories x ${NAICS_SECTORS.length} sectors)`)
  console.log(`  Breakdown: ${counts.universal} universal, ${counts.applicable} applicable, ${counts.partial} partial, ${counts['not-applicable']} not-applicable`)
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

function main(): void {
  console.log('APQC to NAICS Crosswalk Generator\n')

  // Ensure output directory exists
  if (!existsSync(REL_DIR)) {
    mkdirSync(REL_DIR, { recursive: true })
  }

  generateIndustryMapping()
  console.log()
  generateCategoryApplicability()
  console.log('\n=== APQC-NAICS Crosswalk Generation Complete ===')
}

main()
