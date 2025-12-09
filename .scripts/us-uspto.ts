/**
 * USPTO Standards Transformation Script
 * Transforms USPTO classification data into standard TSV format
 *
 * Data sources:
 * - CPC: https://www.uspto.gov/web/patents/classification/cpc.html
 * - CPC Bulk Data: https://bulkdata.uspto.gov/
 * - USPC: https://www.uspto.gov/web/patents/classification/
 * - Nice: https://www.uspto.gov/trademarks/trademark-updates-and-announcements/nice-agreement-current-edition
 * - Locarno: https://www.wipo.int/classifications/locarno/
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import {
  NAMESPACES,
  StandardRecord,
  RelationshipRecord,
  parseCSV,
  parseTSV,
  writeStandardTSV,
  writeRelationshipTSV,
  writeTSV,
  toWikipediaStyleId,
  cleanDescription,
  getSourcePath,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
} from './utils'

const NS = NAMESPACES.USPTO
const SOURCE_DIR = getSourcePath('USPTO')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// CPC Section definitions (A-H, Y)
const CPC_SECTIONS = [
  { code: 'A', name: 'Human Necessities' },
  { code: 'B', name: 'Performing Operations; Transporting' },
  { code: 'C', name: 'Chemistry; Metallurgy' },
  { code: 'D', name: 'Textiles; Paper' },
  { code: 'E', name: 'Fixed Constructions' },
  { code: 'F', name: 'Mechanical Engineering; Lighting; Heating; Weapons; Blasting' },
  { code: 'G', name: 'Physics' },
  { code: 'H', name: 'Electricity' },
  { code: 'Y', name: 'General Tagging of New Technological Developments' },
]

// Nice Classification (1-45)
const NICE_CLASSES = [
  // Goods (1-34)
  { code: '1', name: 'Chemicals', type: 'goods', description: 'Chemicals for use in industry, science and photography, as well as in agriculture, horticulture and forestry' },
  { code: '2', name: 'Paints', type: 'goods', description: 'Paints, varnishes, lacquers; preservatives against rust and against deterioration of wood' },
  { code: '3', name: 'Cosmetics and cleaning preparations', type: 'goods', description: 'Non-medicated cosmetics and toiletry preparations; non-medicated dentifrices' },
  { code: '4', name: 'Lubricants and fuels', type: 'goods', description: 'Industrial oils and greases, wax; lubricants; dust absorbing, wetting and binding compositions' },
  { code: '5', name: 'Pharmaceuticals', type: 'goods', description: 'Pharmaceuticals, medical and veterinary preparations; sanitary preparations for medical purposes' },
  { code: '6', name: 'Common metals and their alloys', type: 'goods', description: 'Common metals and their alloys, ores; metal materials for building and construction' },
  { code: '7', name: 'Machinery', type: 'goods', description: 'Machines, machine tools, power-operated tools; motors and engines' },
  { code: '8', name: 'Hand tools', type: 'goods', description: 'Hand tools and implements, hand-operated; cutlery; side arms' },
  { code: '9', name: 'Scientific and electric apparatus', type: 'goods', description: 'Scientific, research, navigation, surveying, photographic, cinematographic, audiovisual, optical apparatus' },
  { code: '10', name: 'Medical apparatus', type: 'goods', description: 'Surgical, medical, dental and veterinary apparatus and instruments' },
  { code: '11', name: 'Environmental control apparatus', type: 'goods', description: 'Apparatus and installations for lighting, heating, cooling, steam generating, cooking, drying, ventilating' },
  { code: '12', name: 'Vehicles', type: 'goods', description: 'Vehicles; apparatus for locomotion by land, air or water' },
  { code: '13', name: 'Firearms', type: 'goods', description: 'Firearms; ammunition and projectiles; explosives; fireworks' },
  { code: '14', name: 'Jewelry', type: 'goods', description: 'Precious metals and their alloys; jewellery, precious and semi-precious stones; horological and chronometric instruments' },
  { code: '15', name: 'Musical instruments', type: 'goods', description: 'Musical instruments; music stands and stands for musical instruments; conductors\' batons' },
  { code: '16', name: 'Paper goods and printed matter', type: 'goods', description: 'Paper and cardboard; printed matter; bookbinding material; photographs' },
  { code: '17', name: 'Rubber goods', type: 'goods', description: 'Unprocessed and semi-processed rubber, gutta-percha, gum, asbestos, mica and substitutes' },
  { code: '18', name: 'Leather goods', type: 'goods', description: 'Leather and imitations of leather; animal skins and hides; luggage and carrying bags' },
  { code: '19', name: 'Non-metallic building materials', type: 'goods', description: 'Materials, not of metal, for building and construction' },
  { code: '20', name: 'Furniture and articles not otherwise classified', type: 'goods', description: 'Furniture, mirrors, picture frames; containers, not of metal, for storage or transport' },
  { code: '21', name: 'Housewares and glass', type: 'goods', description: 'Household or kitchen utensils and containers; cookware and tableware' },
  { code: '22', name: 'Cordage and fibers', type: 'goods', description: 'Ropes and string; nets; tents and tarpaulins; awnings of textile or synthetic materials' },
  { code: '23', name: 'Yarns and threads', type: 'goods', description: 'Yarns and threads for textile use' },
  { code: '24', name: 'Fabrics', type: 'goods', description: 'Textiles and substitutes for textiles; household linen; curtains of textile or plastic' },
  { code: '25', name: 'Clothing', type: 'goods', description: 'Clothing, footwear, headwear' },
  { code: '26', name: 'Fancy goods', type: 'goods', description: 'Lace, braid and embroidery, and haberdashery ribbons and bows; buttons, hooks and eyes, pins and needles' },
  { code: '27', name: 'Floor coverings', type: 'goods', description: 'Carpets, rugs, mats and matting, linoleum and other materials for covering existing floors; wall hangings, not of textile' },
  { code: '28', name: 'Toys and sporting goods', type: 'goods', description: 'Games, toys and playthings; video game apparatus; gymnastic and sporting articles' },
  { code: '29', name: 'Meats and processed foods', type: 'goods', description: 'Meat, fish, poultry and game; meat extracts; preserved, frozen, dried and cooked fruits and vegetables' },
  { code: '30', name: 'Staple foods', type: 'goods', description: 'Coffee, tea, cocoa and substitutes therefor; rice, pasta and noodles; tapioca and sago' },
  { code: '31', name: 'Natural agricultural products', type: 'goods', description: 'Raw and unprocessed agricultural, aquacultural, horticultural and forestry products' },
  { code: '32', name: 'Light beverages', type: 'goods', description: 'Beers; non-alcoholic beverages; mineral and aerated waters; fruit beverages and fruit juices' },
  { code: '33', name: 'Alcoholic beverages', type: 'goods', description: 'Alcoholic beverages except beers; alcoholic preparations for making beverages' },
  { code: '34', name: 'Smokers\' articles', type: 'goods', description: 'Tobacco and tobacco substitutes; cigarettes and cigars; electronic cigarettes and oral vaporizers for smokers' },
  // Services (35-45)
  { code: '35', name: 'Advertising and business', type: 'services', description: 'Advertising; business management, organization and administration; office functions' },
  { code: '36', name: 'Insurance and financial', type: 'services', description: 'Financial, monetary and banking services; insurance services; real estate affairs' },
  { code: '37', name: 'Building construction and repair', type: 'services', description: 'Construction services; installation and repair services; mining extraction, oil and gas drilling' },
  { code: '38', name: 'Telecommunication', type: 'services', description: 'Telecommunications services' },
  { code: '39', name: 'Transportation and storage', type: 'services', description: 'Transport; packaging and storage of goods; travel arrangement' },
  { code: '40', name: 'Treatment of materials', type: 'services', description: 'Treatment of materials; recycling of waste and trash; air purification and treatment of water' },
  { code: '41', name: 'Education and entertainment', type: 'services', description: 'Education; providing of training; entertainment; sporting and cultural activities' },
  { code: '42', name: 'Computer and scientific', type: 'services', description: 'Scientific and technological services and research and design relating thereto; industrial analysis' },
  { code: '43', name: 'Hotels and restaurants', type: 'services', description: 'Services for providing food and drink; temporary accommodation' },
  { code: '44', name: 'Medical, beauty and agricultural', type: 'services', description: 'Medical services; veterinary services; hygienic and beauty care for human beings or animals' },
  { code: '45', name: 'Personal and legal', type: 'services', description: 'Legal services; security services for the physical protection of tangible property and individuals' },
]

// Locarno Classification (Classes 1-32)
const LOCARNO_CLASSES = [
  { code: '01', name: 'Foodstuffs' },
  { code: '02', name: 'Articles of clothing and haberdashery' },
  { code: '03', name: 'Travel goods, cases, parasols and personal belongings, not elsewhere specified' },
  { code: '04', name: 'Brushware' },
  { code: '05', name: 'Textile piece goods, artificial and natural sheet material' },
  { code: '06', name: 'Furnishing' },
  { code: '07', name: 'Household goods, not elsewhere specified' },
  { code: '08', name: 'Tools and hardware' },
  { code: '09', name: 'Packages and containers for the transport or handling of goods' },
  { code: '10', name: 'Clocks and watches and other measuring instruments, checking and signalling instruments' },
  { code: '11', name: 'Articles of adornment' },
  { code: '12', name: 'Means of transport or hoisting' },
  { code: '13', name: 'Equipment for production, distribution or transformation of electricity' },
  { code: '14', name: 'Recording, communication or information retrieval equipment' },
  { code: '15', name: 'Machines, not elsewhere specified' },
  { code: '16', name: 'Photographic, cinematographic and optical apparatus' },
  { code: '17', name: 'Musical instruments' },
  { code: '18', name: 'Printing and office machinery' },
  { code: '19', name: 'Stationery and office equipment, artists\' and teaching materials' },
  { code: '20', name: 'Sales and advertising equipment, signs' },
  { code: '21', name: 'Games, toys, tents and sports goods' },
  { code: '22', name: 'Arms, pyrotechnic articles, articles for hunting, fishing and pest killing' },
  { code: '23', name: 'Fluid distribution equipment, sanitary, heating, ventilation and air-conditioning equipment, solid fuel' },
  { code: '24', name: 'Medical and laboratory equipment' },
  { code: '25', name: 'Building units and construction elements' },
  { code: '26', name: 'Lighting apparatus' },
  { code: '27', name: 'Tobacco and smokers\' supplies' },
  { code: '28', name: 'Pharmaceutical and cosmetic products, toilet articles and apparatus' },
  { code: '29', name: 'Devices and equipment against fire hazards, for accident prevention and for rescue' },
  { code: '30', name: 'Care and handling of animals' },
  { code: '31', name: 'Foods' },
  { code: '32', name: 'Graphic symbols and logos, surface patterns, ornamentation' },
]

interface CPCRecord {
  section: string
  class: string
  subclass: string
  mainGroup: string
  subgroup: string
  title: string
  level: number
}

interface USPCRecord {
  class: string
  subclass: string
  title: string
  cpcEquivalent?: string
}

interface CPCSectionSourceRow {
  code: string
  name: string
  description: string
  parent: string
}

/**
 * Transform CPC Sections
 */
function transformCPCSections(): void {
  console.log('Transforming CPC Sections from source file...')

  const sourceFile = join(SOURCE_DIR, 'cpc_sections.tsv')
  if (existsSync(sourceFile)) {
    const data = parseTSV<CPCSectionSourceRow>(sourceFile)
    console.log(`Loaded ${data.length} CPC sections from source`)

    const records: StandardRecord[] = data
      .filter(row => row.code && row.name)
      .map(row => ({
        ns: NS,
        type: 'CPCSection',
        id: toWikipediaStyleId(row.name),
        name: row.name,
        description: cleanDescription(row.description || ''),
        code: row.code,
      }))

    writeStandardTSV(join(DATA_DIR, 'USPTO.CPCSections.tsv'), records)
    console.log(`Wrote ${records.length} CPC sections to USPTO.CPCSections.tsv`)
  } else {
    console.log('Warning: cpc_sections.tsv not found, using hardcoded data')
    const records: StandardRecord[] = CPC_SECTIONS.map(section => ({
      ns: NS,
      type: 'CPCSection',
      id: toWikipediaStyleId(section.name),
      name: section.name,
      description: '',
      code: section.code,
    }))

    writeStandardTSV(join(DATA_DIR, 'USPTO.CPCSections.tsv'), records)
    console.log(`Wrote ${records.length} CPC sections (hardcoded fallback)`)
  }
}

/**
 * Transform CPC Classes
 * Note: This is a sample implementation. In production, you would read from
 * the CPC bulk data XML files available at https://bulkdata.uspto.gov/
 */
function transformCPCClasses(): void {
  console.log('Transforming CPC Classes...')

  // Sample CPC classes - in production, parse from CPC bulk data
  const sampleClasses = [
    { code: 'A01', name: 'Agriculture; Forestry; Animal Husbandry; Hunting; Trapping; Fishing', section: 'A' },
    { code: 'A21', name: 'Baking; Edible doughs', section: 'A' },
    { code: 'A23', name: 'Foods or foodstuffs; Treatment thereof, not covered by other classes', section: 'A' },
    { code: 'B01', name: 'Physical or chemical processes or apparatus in general', section: 'B' },
    { code: 'B65', name: 'Conveying; Packing; Storing; Handling thin or filamentary material', section: 'B' },
    { code: 'C07', name: 'Organic chemistry', section: 'C' },
    { code: 'G06', name: 'Computing; Calculating or Counting', section: 'G' },
    { code: 'H01', name: 'Basic electric elements', section: 'H' },
    { code: 'H04', name: 'Electric communication technique', section: 'H' },
  ]

  const records: StandardRecord[] = sampleClasses.map(cls => ({
    ns: NS,
    type: 'CPCClass',
    id: toWikipediaStyleId(cls.name),
    name: cls.name,
    description: '',
    code: cls.code,
  }))

  writeStandardTSV(join(DATA_DIR, 'USPTO.CPC.Classes.tsv'), records)

  // Create relationships to sections
  const relationships: Record<string, string>[] = sampleClasses.map(cls => ({
    fromNs: NS,
    fromType: 'CPCClass',
    fromCode: cls.code,
    toNs: NS,
    toType: 'CPCSection',
    toCode: cls.section,
    relationshipType: 'part_of',
  }))

  writeTSV(
    join(REL_DIR, 'USPTO.CPC.Class.Section.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

/**
 * Transform CPC Subclasses
 * Note: This is a sample implementation
 */
function transformCPCSubclasses(): void {
  console.log('Transforming CPC Subclasses...')

  // Sample CPC subclasses - in production, parse from CPC bulk data
  const sampleSubclasses = [
    { code: 'A01B', name: 'Soil working in agriculture or forestry; parts, details, or accessories of agricultural machines', class: 'A01' },
    { code: 'A01C', name: 'Planting; Sowing; Fertilising', class: 'A01' },
    { code: 'G06F', name: 'Electric digital data processing', class: 'G06' },
    { code: 'G06Q', name: 'Data processing systems or methods, specially adapted for administrative, commercial, financial purposes', class: 'G06' },
    { code: 'H04L', name: 'Transmission of digital information, e.g. telegraphic communication', class: 'H04' },
    { code: 'H04W', name: 'Wireless communication networks', class: 'H04' },
  ]

  const records: StandardRecord[] = sampleSubclasses.map(sub => ({
    ns: NS,
    type: 'CPCSubclass',
    id: toWikipediaStyleId(sub.name),
    name: sub.name,
    description: '',
    code: sub.code,
  }))

  writeStandardTSV(join(DATA_DIR, 'USPTO.CPC.Subclasses.tsv'), records)

  // Create relationships to classes
  const relationships: Record<string, string>[] = sampleSubclasses.map(sub => ({
    fromNs: NS,
    fromType: 'CPCSubclass',
    fromCode: sub.code,
    toNs: NS,
    toType: 'CPCClass',
    toCode: sub.class,
    relationshipType: 'part_of',
  }))

  writeTSV(
    join(REL_DIR, 'USPTO.CPC.Subclass.Class.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

/**
 * Transform CPC Groups
 * Note: This is a sample implementation with a few examples
 * In production, you would parse ~250,000 groups from CPC bulk data
 */
function transformCPCGroups(): void {
  console.log('Transforming CPC Groups...')

  // Sample CPC groups - in production, parse from CPC bulk data
  const sampleGroups = [
    { code: 'G06F3/00', name: 'Input arrangements for transferring data', subclass: 'G06F', isMainGroup: true, parent: null },
    { code: 'G06F3/01', name: 'Input arrangements or combined input and output arrangements for interaction between user and computer', subclass: 'G06F', isMainGroup: false, parent: 'G06F3/00' },
    { code: 'G06F3/048', name: 'Interaction techniques based on graphical user interfaces', subclass: 'G06F', isMainGroup: false, parent: 'G06F3/01' },
    { code: 'H04L63/00', name: 'Network architectures or network communication protocols for network security', subclass: 'H04L', isMainGroup: true, parent: null },
    { code: 'H04L63/04', name: 'Network security protocols', subclass: 'H04L', isMainGroup: false, parent: 'H04L63/00' },
  ]

  const records: StandardRecord[] = sampleGroups.map(group => ({
    ns: NS,
    type: 'CPCGroup',
    id: toWikipediaStyleId(`${group.code} ${group.name}`),
    name: group.name,
    description: group.isMainGroup ? 'Main Group' : 'Subgroup',
    code: group.code,
  }))

  writeStandardTSV(join(DATA_DIR, 'USPTO.CPC.Groups.tsv'), records)

  // Create relationships to subclasses
  const subclassRelationships: Record<string, string>[] = sampleGroups.map(group => ({
    fromNs: NS,
    fromType: 'CPCGroup',
    fromCode: group.code,
    toNs: NS,
    toType: 'CPCSubclass',
    toCode: group.subclass,
    relationshipType: 'part_of',
  }))

  writeTSV(
    join(REL_DIR, 'USPTO.CPC.Group.Subclass.tsv'),
    subclassRelationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )

  // Create parent-child relationships for groups
  const parentRelationships: Record<string, string>[] = sampleGroups
    .filter(group => group.parent)
    .map(group => ({
      fromNs: NS,
      fromType: 'CPCGroup',
      fromCode: group.code,
      toNs: NS,
      toType: 'CPCGroup',
      toCode: group.parent!,
      relationshipType: 'child_of',
    }))

  writeTSV(
    join(REL_DIR, 'USPTO.CPC.Group.Group.tsv'),
    parentRelationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

/**
 * Transform Legacy USPC Classes
 * Note: USPC is no longer maintained but kept for historical reference
 */
function transformUSPCClasses(): void {
  console.log('Transforming USPC Classes...')

  // Sample USPC classes
  const sampleClasses = [
    { code: '705', name: 'Data processing: financial, business practice, management, or cost/price determination', cpcEquivalent: 'G06Q' },
    { code: '709', name: 'Electrical computers and digital processing systems: multicomputer data transferring', cpcEquivalent: 'G06F,H04L' },
    { code: '455', name: 'Telecommunications', cpcEquivalent: 'H04B,H04W' },
  ]

  const records: StandardRecord[] = sampleClasses.map(cls => ({
    ns: NS,
    type: 'USPCClass',
    id: toWikipediaStyleId(cls.name),
    name: cls.name,
    description: `Legacy USPC class. Replaced by CPC: ${cls.cpcEquivalent}`,
    code: cls.code,
  }))

  writeStandardTSV(join(DATA_DIR, 'USPTO.USPC.Classes.tsv'), records)
}

/**
 * Transform USPC Subclasses
 */
function transformUSPCSubclasses(): void {
  console.log('Transforming USPC Subclasses...')

  // Sample USPC subclasses
  const sampleSubclasses = [
    { code: '705/1', name: 'Finance (e.g., banking, investment or credit)', class: '705', cpcEquivalent: 'G06Q40/00' },
    { code: '705/7', name: 'Automated electrical financial or business practice or management arrangement', class: '705', cpcEquivalent: 'G06Q10/00,G06Q20/00' },
  ]

  const records: StandardRecord[] = sampleSubclasses.map(sub => ({
    ns: NS,
    type: 'USPCSubclass',
    id: toWikipediaStyleId(sub.name),
    name: sub.name,
    description: `Legacy USPC subclass. Replaced by CPC: ${sub.cpcEquivalent}`,
    code: sub.code,
  }))

  writeStandardTSV(join(DATA_DIR, 'USPTO.USPC.Subclasses.tsv'), records)

  // Create relationships to classes
  const relationships: Record<string, string>[] = sampleSubclasses.map(sub => ({
    fromNs: NS,
    fromType: 'USPCSubclass',
    fromCode: sub.code,
    toNs: NS,
    toType: 'USPCClass',
    toCode: sub.class,
    relationshipType: 'part_of',
  }))

  writeTSV(
    join(REL_DIR, 'USPTO.USPC.Subclass.Class.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

interface NiceClassSourceRow {
  code: string
  name: string
  description: string
  parent: string
  type: string
}

/**
 * Transform Nice Classification
 */
function transformNiceClasses(): void {
  console.log('Transforming Nice Classification from source file...')

  const sourceFile = join(SOURCE_DIR, 'nice_classification.tsv')
  if (existsSync(sourceFile)) {
    const data = parseTSV<NiceClassSourceRow>(sourceFile)
    console.log(`Loaded ${data.length} Nice classes from source`)

    const records: StandardRecord[] = data
      .filter(row => row.code && row.name)
      .map(row => ({
        ns: NS,
        type: 'NiceClass',
        id: toWikipediaStyleId(row.name),
        name: row.name,
        description: cleanDescription(row.description || ''),
        code: row.code,
      }))

    writeStandardTSV(join(DATA_DIR, 'USPTO.NiceClasses.tsv'), records)
    console.log(`Wrote ${records.length} Nice classes to USPTO.NiceClasses.tsv`)
  } else {
    console.log('Warning: nice_classification.tsv not found, using hardcoded data')
    const records: StandardRecord[] = NICE_CLASSES.map(cls => ({
      ns: NS,
      type: 'NiceClass',
      id: toWikipediaStyleId(cls.name),
      name: cls.name,
      description: cls.description,
      code: cls.code,
    }))

    writeStandardTSV(join(DATA_DIR, 'USPTO.NiceClasses.tsv'), records)
    console.log(`Wrote ${records.length} Nice classes (hardcoded fallback)`)
  }
}

/**
 * Transform US Trademark Classes (legacy, mapped to Nice)
 */
function transformUSTrademarkClasses(): void {
  console.log('Transforming US Trademark Classes...')

  // Sample US trademark classes mapped to Nice
  const sampleClasses = [
    { code: '001', name: 'Raw or Partly Prepared Organic Chemicals', niceEquivalent: '1', description: 'Chemicals used in industry, science, photography' },
    { code: '100', name: 'Miscellaneous', niceEquivalent: '35,36,37,38,39,40,41,42,43,44,45', description: 'Various services now classified under Nice classes 35-45' },
  ]

  const records: StandardRecord[] = sampleClasses.map(cls => ({
    ns: NS,
    type: 'USTrademarkClass',
    id: toWikipediaStyleId(cls.name),
    name: cls.name,
    description: cls.description,
    code: cls.code,
  }))

  writeStandardTSV(join(DATA_DIR, 'USPTO.USTrademark.Classes.tsv'), records)
}

interface LocarnoClassSourceRow {
  code: string
  name: string
  description: string
  parent: string
}

/**
 * Transform Locarno Classification
 */
function transformLocarnoClasses(): void {
  console.log('Transforming Locarno Classes from source file...')

  const sourceFile = join(SOURCE_DIR, 'locarno_classification.tsv')
  if (existsSync(sourceFile)) {
    const data = parseTSV<LocarnoClassSourceRow>(sourceFile)
    console.log(`Loaded ${data.length} Locarno classes from source`)

    const records: StandardRecord[] = data
      .filter(row => row.code && row.name)
      .map(row => ({
        ns: NS,
        type: 'LocarnoClass',
        id: toWikipediaStyleId(row.name),
        name: row.name,
        description: cleanDescription(row.description || row.name),
        code: row.code,
      }))

    writeStandardTSV(join(DATA_DIR, 'USPTO.LocarnoClasses.tsv'), records)
    console.log(`Wrote ${records.length} Locarno classes to USPTO.LocarnoClasses.tsv`)
  } else {
    console.log('Warning: locarno_classification.tsv not found, using hardcoded data')
    const records: StandardRecord[] = LOCARNO_CLASSES.map(cls => ({
      ns: NS,
      type: 'LocarnoClass',
      id: toWikipediaStyleId(cls.name),
      name: cls.name,
      description: '',
      code: cls.code,
    }))

    writeStandardTSV(join(DATA_DIR, 'USPTO.LocarnoClasses.tsv'), records)
    console.log(`Wrote ${records.length} Locarno classes (hardcoded fallback)`)
  }
}

/**
 * Transform Locarno Subclasses
 */
function transformLocarnoSubclasses(): void {
  console.log('Transforming Locarno Subclasses...')

  // Sample Locarno subclasses
  const sampleSubclasses = [
    { code: '01-01', name: 'Biscuits, pastries', class: '01', products: 'Bakery products, confectionery' },
    { code: '01-02', name: 'Chocolate products, confectionery, ices', class: '01', products: 'Candies, chocolates, ice cream' },
    { code: '09-01', name: 'Containers for transport by truck, train or ship', class: '09', products: 'Shipping containers, cargo boxes' },
    { code: '14-01', name: 'Apparatus for recording and reproducing sounds and images', class: '14', products: 'Audio and video equipment' },
  ]

  const records: StandardRecord[] = sampleSubclasses.map(sub => ({
    ns: NS,
    type: 'LocarnoSubclass',
    id: toWikipediaStyleId(sub.name),
    name: sub.name,
    description: sub.products,
    code: sub.code,
  }))

  writeStandardTSV(join(DATA_DIR, 'USPTO.Locarno.Subclasses.tsv'), records)

  // Create relationships to classes
  const relationships: Record<string, string>[] = sampleSubclasses.map(sub => ({
    fromNs: NS,
    fromType: 'LocarnoSubclass',
    fromCode: sub.code,
    toNs: NS,
    toType: 'LocarnoClass',
    toCode: sub.class,
    relationshipType: 'part_of',
  }))

  writeTSV(
    join(REL_DIR, 'USPTO.Locarno.Subclass.Class.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

/**
 * Main transformation function
 */
export async function transformUSPTO(): Promise<void> {
  console.log('=== USPTO Transformation ===')
  ensureOutputDirs()

  // CPC Classifications
  transformCPCSections()
  transformCPCClasses()
  transformCPCSubclasses()
  transformCPCGroups()

  // Legacy USPC
  transformUSPCClasses()
  transformUSPCSubclasses()

  // Trademark Classifications
  transformNiceClasses()
  transformUSTrademarkClasses()

  // Design Patent Classifications
  transformLocarnoClasses()
  transformLocarnoSubclasses()

  console.log('=== USPTO Transformation Complete ===\n')
  console.log('Note: This is a sample implementation with representative data.')
  console.log('For production use, download and parse the complete CPC bulk data from:')
  console.log('  - https://bulkdata.uspto.gov/')
  console.log('  - https://www.uspto.gov/web/patents/classification/cpc.html')
  console.log('  - https://www.wipo.int/classifications/nice/en/')
  console.log('  - https://www.wipo.int/classifications/locarno/en/')
}

// Run if called directly
if (import.meta.main) {
  transformUSPTO()
}
