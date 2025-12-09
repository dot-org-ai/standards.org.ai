import { join } from 'path'
import { existsSync } from 'fs'
import {
  NAMESPACES,
  parseTSV,
  parseCSV,
  writeStandardTSV,
  writeTSV,
  toWikipediaStyleId,
  cleanDescription,
  getSourcePath,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
  getAggregationsForType,
  type StandardRecord,
} from './utils'

const NS = NAMESPACES.SEC
const SOURCE_DIR = getSourcePath('SEC')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// SEC Form Types data
const SEC_FORMS = [
  {
    code: '10-K',
    name: 'Annual Report',
    description: 'Comprehensive annual report filed by public companies, containing audited financial statements, business operations, risk factors, and management discussion.',
    category: 'Annual',
    frequency: 'Annual',
    filers: 'All domestic public companies',
  },
  {
    code: '10-Q',
    name: 'Quarterly Report',
    description: 'Quarterly report containing unaudited financial statements and updates on company operations and financial condition.',
    category: 'Quarterly',
    frequency: 'Quarterly (3 times per year)',
    filers: 'All domestic public companies',
  },
  {
    code: '8-K',
    name: 'Current Report',
    description: 'Report of material events or corporate changes that shareholders should know about, filed on an as-needed basis.',
    category: 'Current',
    frequency: 'As needed (within 4 business days of event)',
    filers: 'All domestic public companies',
  },
  {
    code: 'S-1',
    name: 'Registration Statement',
    description: 'Initial registration form for new securities, required for companies planning to go public via IPO.',
    category: 'Registration',
    frequency: 'One-time (for IPO)',
    filers: 'Companies planning initial public offering',
  },
  {
    code: 'DEF 14A',
    name: 'Proxy Statement',
    description: 'Definitive proxy statement providing shareholders with information needed to vote on corporate matters at annual or special meetings.',
    category: 'Proxy',
    frequency: 'Annual (before shareholder meeting)',
    filers: 'Public companies with shareholder votes',
  },
  {
    code: '20-F',
    name: 'Annual Report (Foreign)',
    description: 'Annual report filed by foreign private issuers, equivalent to Form 10-K for international companies.',
    category: 'Annual',
    frequency: 'Annual',
    filers: 'Foreign private issuers',
  },
  {
    code: '6-K',
    name: 'Current Report (Foreign)',
    description: 'Report of material information filed by foreign private issuers, equivalent to Form 8-K.',
    category: 'Current',
    frequency: 'As needed',
    filers: 'Foreign private issuers',
  },
  {
    code: 'S-3',
    name: 'Registration Statement (Shelf)',
    description: 'Short-form registration statement allowing eligible companies to register securities for sale over time.',
    category: 'Registration',
    frequency: 'As needed',
    filers: 'Well-known seasoned issuers',
  },
  {
    code: 'S-4',
    name: 'Registration Statement (M&A)',
    description: 'Registration statement for securities issued in mergers, acquisitions, and exchange offers.',
    category: 'Registration',
    frequency: 'As needed (for M&A transactions)',
    filers: 'Companies involved in M&A',
  },
  {
    code: 'S-8',
    name: 'Registration Statement (Employee Plans)',
    description: 'Registration statement for securities offered to employees through benefit plans, stock options, or ESPPs.',
    category: 'Registration',
    frequency: 'As needed',
    filers: 'Companies with employee benefit plans',
  },
  {
    code: '3',
    name: 'Initial Statement of Beneficial Ownership',
    description: 'Initial statement filed by insiders when they become officers, directors, or 10% shareholders.',
    category: 'Ownership',
    frequency: 'One-time (upon becoming insider)',
    filers: 'Corporate insiders',
  },
  {
    code: '4',
    name: 'Statement of Changes in Beneficial Ownership',
    description: 'Statement reporting changes in insider holdings, filed when insiders buy or sell company stock.',
    category: 'Ownership',
    frequency: 'Within 2 business days of transaction',
    filers: 'Corporate insiders with transactions',
  },
  {
    code: '5',
    name: 'Annual Statement of Beneficial Ownership',
    description: 'Annual statement of changes in beneficial ownership for certain exempt transactions not previously reported.',
    category: 'Ownership',
    frequency: 'Annual (within 45 days of fiscal year end)',
    filers: 'Corporate insiders with exempt transactions',
  },
  {
    code: 'SC 13D',
    name: 'Schedule 13D',
    description: 'Beneficial ownership report filed when acquiring more than 5% of a company with intent to influence control.',
    category: 'Ownership',
    frequency: 'Within 10 days of crossing 5% threshold',
    filers: 'Active investors with 5%+ ownership',
  },
  {
    code: 'SC 13G',
    name: 'Schedule 13G',
    description: 'Simplified beneficial ownership report for passive investors acquiring more than 5% of a company.',
    category: 'Ownership',
    frequency: 'Within 45 days of calendar year end',
    filers: 'Passive investors with 5%+ ownership',
  },
]

// Filing Categories
const FILING_CATEGORIES = [
  {
    code: 'Annual',
    name: 'Annual Reports',
    description: 'Comprehensive annual financial reports and disclosures filed once per year.',
    forms: '10-K, 20-F',
  },
  {
    code: 'Quarterly',
    name: 'Quarterly Reports',
    description: 'Quarterly financial reports and updates filed three times per year.',
    forms: '10-Q',
  },
  {
    code: 'Current',
    name: 'Current Reports',
    description: 'Reports of material events and changes filed as they occur.',
    forms: '8-K, 6-K',
  },
  {
    code: 'Registration',
    name: 'Registration Statements',
    description: 'Statements registering securities for public sale or specific corporate actions.',
    forms: 'S-1, S-3, S-4, S-8',
  },
  {
    code: 'Proxy',
    name: 'Proxy Statements',
    description: 'Statements providing information for shareholder voting on corporate matters.',
    forms: 'DEF 14A, DEFR14A, DEFA14A',
  },
  {
    code: 'Ownership',
    name: 'Beneficial Ownership',
    description: 'Reports of insider transactions and beneficial ownership positions.',
    forms: '3, 4, 5, SC 13D, SC 13G',
  },
]

// Filer Types
const FILER_TYPES = [
  {
    code: 'LAF',
    name: 'Large Accelerated Filer',
    criteria: 'Worldwide market value of voting and non-voting common equity held by non-affiliates of $700 million or more',
    requirements: '10-K due 60 days after fiscal year end; 10-Q due 40 days after quarter end',
  },
  {
    code: 'AF',
    name: 'Accelerated Filer',
    criteria: 'Worldwide market value of voting and non-voting common equity held by non-affiliates of $75 million or more but less than $700 million',
    requirements: '10-K due 75 days after fiscal year end; 10-Q due 40 days after quarter end',
  },
  {
    code: 'NAF',
    name: 'Non-Accelerated Filer',
    criteria: 'Worldwide market value of voting and non-voting common equity held by non-affiliates of less than $75 million',
    requirements: '10-K due 90 days after fiscal year end; 10-Q due 45 days after quarter end',
  },
  {
    code: 'SRC',
    name: 'Smaller Reporting Company',
    criteria: 'Public float of less than $250 million or annual revenues of less than $100 million with public float less than $700 million',
    requirements: 'Reduced disclosure requirements; scaled executive compensation disclosures',
  },
  {
    code: 'EGC',
    name: 'Emerging Growth Company',
    criteria: 'Total annual gross revenues of less than $1.235 billion during most recent fiscal year',
    requirements: 'Confidential IPO filing allowed; reduced financial statement requirements; exempt from certain governance requirements for up to 5 years',
  },
]

// SIC Divisions (A-K)
const SIC_DIVISIONS = [
  {
    code: 'A',
    name: 'Agriculture, Forestry, and Fishing',
    description: 'Establishments primarily engaged in agricultural production, forestry, commercial fishing, hunting and trapping.',
    majorGroups: '01-09',
  },
  {
    code: 'B',
    name: 'Mining',
    description: 'Establishments primarily engaged in mining, including extraction of minerals occurring naturally.',
    majorGroups: '10-14',
  },
  {
    code: 'C',
    name: 'Construction',
    description: 'Establishments primarily engaged in construction activities, including building construction, heavy construction, and special trade contractors.',
    majorGroups: '15-17',
  },
  {
    code: 'D',
    name: 'Manufacturing',
    description: 'Establishments engaged in mechanical, physical, or chemical transformation of materials, substances, or components into new products.',
    majorGroups: '20-39',
  },
  {
    code: 'E',
    name: 'Transportation, Communications, Electric, Gas, and Sanitary Services',
    description: 'Establishments providing transportation, communications, and utilities services to the general public.',
    majorGroups: '40-49',
  },
  {
    code: 'F',
    name: 'Wholesale Trade',
    description: 'Establishments primarily engaged in selling merchandise to retailers, industrial, commercial, institutional, or professional users.',
    majorGroups: '50-51',
  },
  {
    code: 'G',
    name: 'Retail Trade',
    description: 'Establishments primarily engaged in selling merchandise for personal or household consumption.',
    majorGroups: '52-59',
  },
  {
    code: 'H',
    name: 'Finance, Insurance, and Real Estate',
    description: 'Establishments operating in financial services, insurance, and real estate industries.',
    majorGroups: '60-67',
  },
  {
    code: 'I',
    name: 'Services',
    description: 'Establishments primarily engaged in providing services to individuals, businesses, and government.',
    majorGroups: '70-89',
  },
  {
    code: 'J',
    name: 'Public Administration',
    description: 'Establishments of federal, state, and local government agencies engaged in administration of public programs.',
    majorGroups: '91-97',
  },
  {
    code: 'K',
    name: 'Nonclassifiable Establishments',
    description: 'Establishments that cannot be classified in any other division.',
    majorGroups: '99',
  },
]

// Sample SIC Major Groups (full list would be much longer)
const SIC_MAJOR_GROUPS = [
  { code: '01', name: 'Agricultural Production - Crops', division: 'A' },
  { code: '02', name: 'Agricultural Production - Livestock', division: 'A' },
  { code: '07', name: 'Agricultural Services', division: 'A' },
  { code: '10', name: 'Metal Mining', division: 'B' },
  { code: '13', name: 'Oil and Gas Extraction', division: 'B' },
  { code: '15', name: 'Building Construction - General Contractors', division: 'C' },
  { code: '16', name: 'Heavy Construction Other Than Building', division: 'C' },
  { code: '17', name: 'Construction - Special Trade Contractors', division: 'C' },
  { code: '20', name: 'Food and Kindred Products', division: 'D' },
  { code: '22', name: 'Textile Mill Products', division: 'D' },
  { code: '23', name: 'Apparel and Other Finished Products', division: 'D' },
  { code: '26', name: 'Paper and Allied Products', division: 'D' },
  { code: '27', name: 'Printing, Publishing, and Allied Industries', division: 'D' },
  { code: '28', name: 'Chemicals and Allied Products', division: 'D' },
  { code: '33', name: 'Primary Metal Industries', division: 'D' },
  { code: '34', name: 'Fabricated Metal Products', division: 'D' },
  { code: '35', name: 'Industrial and Commercial Machinery', division: 'D' },
  { code: '36', name: 'Electronic and Other Electrical Equipment', division: 'D' },
  { code: '37', name: 'Transportation Equipment', division: 'D' },
  { code: '38', name: 'Measuring, Analyzing, and Controlling Instruments', division: 'D' },
  { code: '39', name: 'Miscellaneous Manufacturing Industries', division: 'D' },
  { code: '40', name: 'Railroad Transportation', division: 'E' },
  { code: '42', name: 'Motor Freight Transportation and Warehousing', division: 'E' },
  { code: '45', name: 'Transportation by Air', division: 'E' },
  { code: '48', name: 'Communications', division: 'E' },
  { code: '49', name: 'Electric, Gas, and Sanitary Services', division: 'E' },
  { code: '50', name: 'Wholesale Trade - Durable Goods', division: 'F' },
  { code: '51', name: 'Wholesale Trade - Non-Durable Goods', division: 'F' },
  { code: '52', name: 'Building Materials, Hardware, Garden Supply', division: 'G' },
  { code: '53', name: 'General Merchandise Stores', division: 'G' },
  { code: '54', name: 'Food Stores', division: 'G' },
  { code: '56', name: 'Apparel and Accessory Stores', division: 'G' },
  { code: '57', name: 'Home Furniture, Furnishings, and Equipment', division: 'G' },
  { code: '58', name: 'Eating and Drinking Places', division: 'G' },
  { code: '59', name: 'Miscellaneous Retail', division: 'G' },
  { code: '60', name: 'Depository Institutions', division: 'H' },
  { code: '61', name: 'Non-Depository Credit Institutions', division: 'H' },
  { code: '62', name: 'Security and Commodity Brokers', division: 'H' },
  { code: '63', name: 'Insurance Carriers', division: 'H' },
  { code: '64', name: 'Insurance Agents, Brokers, and Service', division: 'H' },
  { code: '65', name: 'Real Estate', division: 'H' },
  { code: '67', name: 'Holding and Other Investment Offices', division: 'H' },
  { code: '70', name: 'Hotels, Rooming Houses, Camps', division: 'I' },
  { code: '72', name: 'Personal Services', division: 'I' },
  { code: '73', name: 'Business Services', division: 'I' },
  { code: '75', name: 'Automotive Repair, Services, and Parking', division: 'I' },
  { code: '78', name: 'Motion Pictures', division: 'I' },
  { code: '79', name: 'Amusement and Recreation Services', division: 'I' },
  { code: '80', name: 'Health Services', division: 'I' },
  { code: '82', name: 'Educational Services', division: 'I' },
  { code: '83', name: 'Social Services', division: 'I' },
  { code: '87', name: 'Engineering, Accounting, Research, Management', division: 'I' },
  { code: '99', name: 'Nonclassifiable Establishments', division: 'K' },
]

// Sample SIC Codes (full list would have thousands - these are examples)
const SIC_CODES = [
  { code: '0111', name: 'Wheat', division: 'A', majorGroup: '01', industryGroup: '011' },
  { code: '0112', name: 'Rice', division: 'A', majorGroup: '01', industryGroup: '011' },
  { code: '0115', name: 'Corn', division: 'A', majorGroup: '01', industryGroup: '011' },
  { code: '0116', name: 'Soybeans', division: 'A', majorGroup: '01', industryGroup: '011' },
  { code: '1311', name: 'Crude Petroleum and Natural Gas', division: 'B', majorGroup: '13', industryGroup: '131' },
  { code: '1381', name: 'Drilling Oil and Gas Wells', division: 'B', majorGroup: '13', industryGroup: '138' },
  { code: '1389', name: 'Oil and Gas Field Services', division: 'B', majorGroup: '13', industryGroup: '138' },
  { code: '2011', name: 'Meat Packing Plants', division: 'D', majorGroup: '20', industryGroup: '201' },
  { code: '2013', name: 'Sausages and Other Prepared Meats', division: 'D', majorGroup: '20', industryGroup: '201' },
  { code: '2834', name: 'Pharmaceutical Preparations', division: 'D', majorGroup: '28', industryGroup: '283' },
  { code: '2835', name: 'In Vitro and In Vivo Diagnostic Substances', division: 'D', majorGroup: '28', industryGroup: '283' },
  { code: '2836', name: 'Biological Products (No Diagnostic)', division: 'D', majorGroup: '28', industryGroup: '283' },
  { code: '3571', name: 'Electronic Computers', division: 'D', majorGroup: '35', industryGroup: '357' },
  { code: '3572', name: 'Computer Storage Devices', division: 'D', majorGroup: '35', industryGroup: '357' },
  { code: '3661', name: 'Telephone and Telegraph Apparatus', division: 'D', majorGroup: '36', industryGroup: '366' },
  { code: '3663', name: 'Radio and Television Broadcasting and Communications Equipment', division: 'D', majorGroup: '36', industryGroup: '366' },
  { code: '3674', name: 'Semiconductors and Related Devices', division: 'D', majorGroup: '36', industryGroup: '367' },
  { code: '3711', name: 'Motor Vehicles and Passenger Car Bodies', division: 'D', majorGroup: '37', industryGroup: '371' },
  { code: '3714', name: 'Motor Vehicle Parts and Accessories', division: 'D', majorGroup: '37', industryGroup: '371' },
  { code: '3721', name: 'Aircraft', division: 'D', majorGroup: '37', industryGroup: '372' },
  { code: '4512', name: 'Air Transportation, Scheduled', division: 'E', majorGroup: '45', industryGroup: '451' },
  { code: '4813', name: 'Telephone Communications (No Radio)', division: 'E', majorGroup: '48', industryGroup: '481' },
  { code: '4832', name: 'Radio Broadcasting Stations', division: 'E', majorGroup: '48', industryGroup: '483' },
  { code: '4833', name: 'Television Broadcasting Stations', division: 'E', majorGroup: '48', industryGroup: '483' },
  { code: '4841', name: 'Cable and Other Pay Television Services', division: 'E', majorGroup: '48', industryGroup: '484' },
  { code: '4899', name: 'Communications Services', division: 'E', majorGroup: '48', industryGroup: '489' },
  { code: '4911', name: 'Electric Services', division: 'E', majorGroup: '49', industryGroup: '491' },
  { code: '4924', name: 'Natural Gas Distribution', division: 'E', majorGroup: '49', industryGroup: '492' },
  { code: '5045', name: 'Computers and Computer Peripheral Equipment and Software', division: 'F', majorGroup: '50', industryGroup: '504' },
  { code: '5331', name: 'Variety Stores', division: 'G', majorGroup: '53', industryGroup: '533' },
  { code: '5411', name: 'Grocery Stores', division: 'G', majorGroup: '54', industryGroup: '541' },
  { code: '5600', name: 'Apparel and Accessory Stores', division: 'G', majorGroup: '56', industryGroup: '560' },
  { code: '5812', name: 'Eating Places', division: 'G', majorGroup: '58', industryGroup: '581' },
  { code: '5961', name: 'Catalog and Mail-Order Houses', division: 'G', majorGroup: '59', industryGroup: '596' },
  { code: '6021', name: 'National Commercial Banks', division: 'H', majorGroup: '60', industryGroup: '602' },
  { code: '6022', name: 'State Commercial Banks', division: 'H', majorGroup: '60', industryGroup: '602' },
  { code: '6141', name: 'Personal Credit Institutions', division: 'H', majorGroup: '61', industryGroup: '614' },
  { code: '6211', name: 'Security Brokers, Dealers, and Flotation Companies', division: 'H', majorGroup: '62', industryGroup: '621' },
  { code: '6282', name: 'Investment Advice', division: 'H', majorGroup: '62', industryGroup: '628' },
  { code: '6311', name: 'Life Insurance', division: 'H', majorGroup: '63', industryGroup: '631' },
  { code: '6324', name: 'Hospital and Medical Service Plans', division: 'H', majorGroup: '63', industryGroup: '632' },
  { code: '6331', name: 'Fire, Marine, and Casualty Insurance', division: 'H', majorGroup: '63', industryGroup: '633' },
  { code: '6411', name: 'Insurance Agents, Brokers, and Service', division: 'H', majorGroup: '64', industryGroup: '641' },
  { code: '6512', name: 'Operators of Nonresidential Buildings', division: 'H', majorGroup: '65', industryGroup: '651' },
  { code: '6531', name: 'Real Estate Agents and Managers', division: 'H', majorGroup: '65', industryGroup: '653' },
  { code: '6794', name: 'Patent Owners and Lessors', division: 'H', majorGroup: '67', industryGroup: '679' },
  { code: '6795', name: 'Mineral Royalty Traders', division: 'H', majorGroup: '67', industryGroup: '679' },
  { code: '7011', name: 'Hotels and Motels', division: 'I', majorGroup: '70', industryGroup: '701' },
  { code: '7310', name: 'Advertising', division: 'I', majorGroup: '73', industryGroup: '731' },
  { code: '7371', name: 'Computer Programming Services', division: 'I', majorGroup: '73', industryGroup: '737' },
  { code: '7372', name: 'Prepackaged Software', division: 'I', majorGroup: '73', industryGroup: '737' },
  { code: '7373', name: 'Computer Integrated Systems Design', division: 'I', majorGroup: '73', industryGroup: '737' },
  { code: '7374', name: 'Computer Processing and Data Preparation', division: 'I', majorGroup: '73', industryGroup: '737' },
  { code: '7375', name: 'Information Retrieval Services', division: 'I', majorGroup: '73', industryGroup: '737' },
  { code: '7379', name: 'Computer Related Services', division: 'I', majorGroup: '73', industryGroup: '737' },
  { code: '7812', name: 'Motion Picture and Video Tape Production', division: 'I', majorGroup: '78', industryGroup: '781' },
  { code: '7841', name: 'Video Tape Rental', division: 'I', majorGroup: '78', industryGroup: '784' },
  { code: '8000', name: 'Health Services', division: 'I', majorGroup: '80', industryGroup: '800' },
  { code: '8011', name: 'Offices and Clinics of Doctors of Medicine', division: 'I', majorGroup: '80', industryGroup: '801' },
  { code: '8060', name: 'Hospitals', division: 'I', majorGroup: '80', industryGroup: '806' },
  { code: '8200', name: 'Educational Services', division: 'I', majorGroup: '82', industryGroup: '820' },
  { code: '8700', name: 'Engineering, Accounting, Research, Management', division: 'I', majorGroup: '87', industryGroup: '870' },
  { code: '8731', name: 'Commercial Physical and Biological Research', division: 'I', majorGroup: '87', industryGroup: '873' },
  { code: '8734', name: 'Testing Laboratories', division: 'I', majorGroup: '87', industryGroup: '873' },
  { code: '9995', name: 'Non-Operating Establishments', division: 'K', majorGroup: '99', industryGroup: '999' },
]

function transformFormTypes(): void {
  console.log('Transforming SEC Form Types...')

  const records: StandardRecord[] = SEC_FORMS.map(form => ({
    ns: NS,
    type: 'FormType',
    id: toWikipediaStyleId(form.name),
    name: form.name,
    description: form.description,
    code: form.code,
    includedIn: getAggregationsForType('FormType'),
  }))

  writeStandardTSV(join(DATA_DIR, 'SEC.FormTypes.tsv'), records)
}

function transformFilingCategories(): void {
  console.log('Transforming SEC Filing Categories...')

  const records: StandardRecord[] = FILING_CATEGORIES.map(category => ({
    ns: NS,
    type: 'FilingCategory',
    id: toWikipediaStyleId(category.name),
    name: category.name,
    description: category.description,
    code: category.code,
    includedIn: getAggregationsForType('FilingCategory'),
  }))

  writeStandardTSV(join(DATA_DIR, 'SEC.FilingCategories.tsv'), records)
}

function transformFilerTypes(): void {
  console.log('Transforming SEC Filer Types...')

  const records: StandardRecord[] = FILER_TYPES.map(filer => ({
    ns: NS,
    type: 'FilerType',
    id: toWikipediaStyleId(filer.name),
    name: filer.name,
    description: filer.criteria,
    code: filer.code,
    includedIn: getAggregationsForType('FilerType'),
  }))

  writeStandardTSV(join(DATA_DIR, 'SEC.FilerTypes.tsv'), records)
}

function transformSICDivisions(): void {
  console.log('Transforming SIC Divisions...')

  const records: StandardRecord[] = SIC_DIVISIONS.map(division => ({
    ns: NS,
    type: 'SICDivision',
    id: toWikipediaStyleId(division.name),
    name: division.name,
    description: division.description,
    code: division.code,
    includedIn: getAggregationsForType('SICDivision'),
  }))

  writeStandardTSV(join(DATA_DIR, 'SEC.SICDivisions.tsv'), records)
}

function transformSICMajorGroups(): void {
  console.log('Transforming SIC Major Groups...')

  const records: StandardRecord[] = SIC_MAJOR_GROUPS.map(group => ({
    ns: NS,
    type: 'SICMajorGroup',
    id: toWikipediaStyleId(group.name),
    name: group.name,
    description: '',
    code: group.code,
    includedIn: getAggregationsForType('SICMajorGroup'),
  }))

  writeStandardTSV(join(DATA_DIR, 'SEC.SICMajorGroups.tsv'), records)

  // Write relationships between Major Groups and Divisions
  const relationships: Record<string, string>[] = SIC_MAJOR_GROUPS.map(group => ({
    fromNs: NS,
    fromType: 'SICMajorGroup',
    fromCode: group.code,
    toNs: NS,
    toType: 'SICDivision',
    toCode: group.division,
    relationshipType: 'child_of',
  }))

  writeTSV(
    join(REL_DIR, 'SEC.MajorGroup.Division.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

interface SICRow {
  code: string
  name: string
  description: string
  parent: string
  division: string
  major_group: string
  industry_group: string
}

function transformSICCodes(): void {
  console.log('Transforming SIC Codes from source file...')

  const sourceFile = join(SOURCE_DIR, 'sic_codes.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Warning: sic_codes.tsv not found, skipping SIC codes')
    return
  }

  const data = parseTSV<SICRow>(sourceFile)
  console.log(`Loaded ${data.length} SIC codes from source`)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'SICCode',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: cleanDescription(row.description || row.name),
      code: row.code,
      includedIn: getAggregationsForType('SICCode'),
    }))

  writeStandardTSV(join(DATA_DIR, 'SEC.SICCodes.tsv'), records)
  console.log(`Wrote ${records.length} SIC codes to SEC.SICCodes.tsv`)

  // Write relationships between SIC Codes and Major Groups
  const relationships: Record<string, string>[] = data
    .filter(row => row.code && row.major_group)
    .map(row => ({
      fromNs: NS,
      fromType: 'SICCode',
      fromCode: row.code,
      toNs: NS,
      toType: 'SICMajorGroup',
      toCode: row.major_group,
      relationshipType: 'child_of',
    }))

  if (relationships.length > 0) {
    writeTSV(
      join(REL_DIR, 'SEC.SICCode.MajorGroup.tsv'),
      relationships,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
    )
    console.log(`Wrote ${relationships.length} SIC Code -> Major Group relationships`)
  }
}

function transformFormCategoryRelationships(): void {
  console.log('Creating Form-Category relationships...')

  const relationships: Record<string, string>[] = SEC_FORMS.map(form => ({
    fromNs: NS,
    fromType: 'FormType',
    fromCode: form.code,
    toNs: NS,
    toType: 'FilingCategory',
    toCode: form.category,
    relationshipType: 'member_of',
  }))

  writeTSV(
    join(REL_DIR, 'SEC.FormType.FilingCategory.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

export async function transformSEC(): Promise<void> {
  console.log('=== SEC Transformation ===')
  ensureOutputDirs()

  transformFormTypes()
  transformFilingCategories()
  transformFilerTypes()
  transformSICDivisions()
  transformSICMajorGroups()
  transformSICCodes()
  transformFormCategoryRelationships()

  console.log('=== SEC Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformSEC()
}
