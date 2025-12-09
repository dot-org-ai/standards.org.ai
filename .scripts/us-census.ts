import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import {
  NAMESPACES,
  parseTSV,
  parseCSV,
  writeStandardTSV,
  writeTSV,
  writeRelationshipTSV,
  toWikipediaStyleId,
  cleanDescription,
  getSourcePath,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
  getAggregationsForType,
  type StandardRecord,
  type RelationshipRecord,
} from './utils'

const NS = NAMESPACES.Census
const SOURCE_DIR = getSourcePath('Census')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// US States and territories with FIPS codes
const STATES = [
  { fips: '01', name: 'Alabama', abbreviation: 'AL', region: '3', division: '6' },
  { fips: '02', name: 'Alaska', abbreviation: 'AK', region: '4', division: '9' },
  { fips: '04', name: 'Arizona', abbreviation: 'AZ', region: '4', division: '8' },
  { fips: '05', name: 'Arkansas', abbreviation: 'AR', region: '3', division: '7' },
  { fips: '06', name: 'California', abbreviation: 'CA', region: '4', division: '9' },
  { fips: '08', name: 'Colorado', abbreviation: 'CO', region: '4', division: '8' },
  { fips: '09', name: 'Connecticut', abbreviation: 'CT', region: '1', division: '1' },
  { fips: '10', name: 'Delaware', abbreviation: 'DE', region: '3', division: '5' },
  { fips: '11', name: 'District of Columbia', abbreviation: 'DC', region: '3', division: '5' },
  { fips: '12', name: 'Florida', abbreviation: 'FL', region: '3', division: '5' },
  { fips: '13', name: 'Georgia', abbreviation: 'GA', region: '3', division: '5' },
  { fips: '15', name: 'Hawaii', abbreviation: 'HI', region: '4', division: '9' },
  { fips: '16', name: 'Idaho', abbreviation: 'ID', region: '4', division: '8' },
  { fips: '17', name: 'Illinois', abbreviation: 'IL', region: '2', division: '3' },
  { fips: '18', name: 'Indiana', abbreviation: 'IN', region: '2', division: '3' },
  { fips: '19', name: 'Iowa', abbreviation: 'IA', region: '2', division: '4' },
  { fips: '20', name: 'Kansas', abbreviation: 'KS', region: '2', division: '4' },
  { fips: '21', name: 'Kentucky', abbreviation: 'KY', region: '3', division: '6' },
  { fips: '22', name: 'Louisiana', abbreviation: 'LA', region: '3', division: '7' },
  { fips: '23', name: 'Maine', abbreviation: 'ME', region: '1', division: '1' },
  { fips: '24', name: 'Maryland', abbreviation: 'MD', region: '3', division: '5' },
  { fips: '25', name: 'Massachusetts', abbreviation: 'MA', region: '1', division: '1' },
  { fips: '26', name: 'Michigan', abbreviation: 'MI', region: '2', division: '3' },
  { fips: '27', name: 'Minnesota', abbreviation: 'MN', region: '2', division: '4' },
  { fips: '28', name: 'Mississippi', abbreviation: 'MS', region: '3', division: '6' },
  { fips: '29', name: 'Missouri', abbreviation: 'MO', region: '2', division: '4' },
  { fips: '30', name: 'Montana', abbreviation: 'MT', region: '4', division: '8' },
  { fips: '31', name: 'Nebraska', abbreviation: 'NE', region: '2', division: '4' },
  { fips: '32', name: 'Nevada', abbreviation: 'NV', region: '4', division: '8' },
  { fips: '33', name: 'New Hampshire', abbreviation: 'NH', region: '1', division: '1' },
  { fips: '34', name: 'New Jersey', abbreviation: 'NJ', region: '1', division: '2' },
  { fips: '35', name: 'New Mexico', abbreviation: 'NM', region: '4', division: '8' },
  { fips: '36', name: 'New York', abbreviation: 'NY', region: '1', division: '2' },
  { fips: '37', name: 'North Carolina', abbreviation: 'NC', region: '3', division: '5' },
  { fips: '38', name: 'North Dakota', abbreviation: 'ND', region: '2', division: '4' },
  { fips: '39', name: 'Ohio', abbreviation: 'OH', region: '2', division: '3' },
  { fips: '40', name: 'Oklahoma', abbreviation: 'OK', region: '3', division: '7' },
  { fips: '41', name: 'Oregon', abbreviation: 'OR', region: '4', division: '9' },
  { fips: '42', name: 'Pennsylvania', abbreviation: 'PA', region: '1', division: '2' },
  { fips: '44', name: 'Rhode Island', abbreviation: 'RI', region: '1', division: '1' },
  { fips: '45', name: 'South Carolina', abbreviation: 'SC', region: '3', division: '5' },
  { fips: '46', name: 'South Dakota', abbreviation: 'SD', region: '2', division: '4' },
  { fips: '47', name: 'Tennessee', abbreviation: 'TN', region: '3', division: '6' },
  { fips: '48', name: 'Texas', abbreviation: 'TX', region: '3', division: '7' },
  { fips: '49', name: 'Utah', abbreviation: 'UT', region: '4', division: '8' },
  { fips: '50', name: 'Vermont', abbreviation: 'VT', region: '1', division: '1' },
  { fips: '51', name: 'Virginia', abbreviation: 'VA', region: '3', division: '5' },
  { fips: '53', name: 'Washington', abbreviation: 'WA', region: '4', division: '9' },
  { fips: '54', name: 'West Virginia', abbreviation: 'WV', region: '3', division: '5' },
  { fips: '55', name: 'Wisconsin', abbreviation: 'WI', region: '2', division: '3' },
  { fips: '56', name: 'Wyoming', abbreviation: 'WY', region: '4', division: '8' },
  { fips: '60', name: 'American Samoa', abbreviation: 'AS', region: '9', division: '0' },
  { fips: '66', name: 'Guam', abbreviation: 'GU', region: '9', division: '0' },
  { fips: '69', name: 'Northern Mariana Islands', abbreviation: 'MP', region: '9', division: '0' },
  { fips: '72', name: 'Puerto Rico', abbreviation: 'PR', region: '9', division: '0' },
  { fips: '78', name: 'U.S. Virgin Islands', abbreviation: 'VI', region: '9', division: '0' },
]

// Census Regions
const REGIONS = [
  { code: '1', name: 'Northeast', divisions: ['1', '2'] },
  { code: '2', name: 'Midwest', divisions: ['3', '4'] },
  { code: '3', name: 'South', divisions: ['5', '6', '7'] },
  { code: '4', name: 'West', divisions: ['8', '9'] },
]

// Census Divisions
const DIVISIONS = [
  { code: '1', name: 'New England', region: '1' },
  { code: '2', name: 'Middle Atlantic', region: '1' },
  { code: '3', name: 'East North Central', region: '2' },
  { code: '4', name: 'West North Central', region: '2' },
  { code: '5', name: 'South Atlantic', region: '3' },
  { code: '6', name: 'East South Central', region: '3' },
  { code: '7', name: 'West South Central', region: '3' },
  { code: '8', name: 'Mountain', region: '4' },
  { code: '9', name: 'Pacific', region: '4' },
]

interface StateRow {
  code: string
  name: string
  description: string
  abbreviation: string
  statens: string
}

function transformStates(): void {
  console.log('Transforming Census States from source file...')

  const sourceFile = join(SOURCE_DIR, 'fips_state_codes.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Warning: fips_state_codes.tsv not found, skipping states')
    return
  }

  const data = parseTSV<StateRow>(sourceFile)
  console.log(`Loaded ${data.length} states from source`)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'State',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: cleanDescription(`${row.name} (${row.abbreviation}) - FIPS ${row.code}`),
      code: row.code,
      includedIn: getAggregationsForType('State'),
    }))

  writeStandardTSV(join(DATA_DIR, 'Census.States.tsv'), records)
  console.log(`Wrote ${records.length} states to Census.States.tsv`)
}

function transformRegions(): void {
  console.log('Transforming Census Regions...')

  const records: StandardRecord[] = REGIONS.map(region => {
    const states = STATES.filter(s => s.region === region.code).map(s => s.name).join(', ')
    return {
      ns: NS,
      type: 'Region',
      id: toWikipediaStyleId(region.name),
      name: region.name,
      description: `Census Region ${region.code}: ${region.name}`,
      code: region.code,
      includedIn: getAggregationsForType('Region'),
    }
  })

  writeStandardTSV(join(DATA_DIR, 'Census.Regions.tsv'), records)
}

function transformDivisions(): void {
  console.log('Transforming Census Divisions...')

  const records: StandardRecord[] = DIVISIONS.map(division => {
    const states = STATES.filter(s => s.division === division.code).map(s => s.name).join(', ')
    return {
      ns: NS,
      type: 'Division',
      id: toWikipediaStyleId(division.name),
      name: division.name,
      description: `Census Division ${division.code}: ${division.name}`,
      code: division.code,
      includedIn: getAggregationsForType('Division'),
    }
  })

  writeStandardTSV(join(DATA_DIR, 'Census.Divisions.tsv'), records)

  // Create division-region relationships
  const relationships: RelationshipRecord[] = DIVISIONS.map(division => ({
    fromNs: NS,
    fromType: 'Division',
    fromId: toWikipediaStyleId(division.name),
    toNs: NS,
    toType: 'Region',
    toId: toWikipediaStyleId(REGIONS.find(r => r.code === division.region)?.name || ''),
    relationshipType: 'in_region',
  }))

  writeRelationshipTSV(join(REL_DIR, 'Census.Division.Region.tsv'), relationships)
}

interface CountyRow {
  code: string
  name: string
  description: string
  parent: string
  state: string
}

function transformCounties(): void {
  console.log('Transforming Census Counties from source file...')

  const sourceFile = join(SOURCE_DIR, 'fips_county_codes.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Warning: fips_county_codes.tsv not found, skipping counties')
    return
  }

  const data = parseTSV<CountyRow>(sourceFile)
  console.log(`Loaded ${data.length} counties from source`)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name && row.state !== 'NA')
    .map(row => ({
      ns: NS,
      type: 'County',
      id: toWikipediaStyleId(`${row.name}_${row.state}`),
      name: row.name,
      description: cleanDescription(`${row.name}, ${row.state} - FIPS ${row.code}`),
      code: row.code,
      includedIn: getAggregationsForType('County'),
    }))

  writeStandardTSV(join(DATA_DIR, 'Census.Counties.tsv'), records)
  console.log(`Wrote ${records.length} counties to Census.Counties.tsv`)

  // Create county-state relationships
  const relationships: RelationshipRecord[] = data
    .filter(row => row.code && row.state && row.state !== 'NA')
    .map(row => ({
      fromNs: NS,
      fromType: 'County',
      fromId: toWikipediaStyleId(`${row.name}_${row.state}`),
      toNs: NS,
      toType: 'State',
      toId: toWikipediaStyleId(row.state),
      relationshipType: 'in_state',
    }))

  writeRelationshipTSV(join(REL_DIR, 'Census.County.State.tsv'), relationships)
  console.log(`Wrote ${relationships.length} county -> state relationships`)
}

function transformPlaces(): void {
  console.log('Transforming Census Places...')

  // TODO: This would read from Census place data files
  console.log('Place data requires source files from Census.gov')
  console.log('Expected file: .source/Census/Places.tsv')
  console.log('Format: fips, name, state, type, population')

  const sourceFile = join(SOURCE_DIR, 'Places.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Skipping places - file not found')
    return
  }

  interface PlaceRow {
    fips: string
    name: string
    state: string
    type: string
    population: string
  }

  const data = parseTSV<PlaceRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.fips && row.name)
    .map(row => ({
      ns: NS,
      type: 'Place',
      id: toWikipediaStyleId(`${row.name}_${row.state}`),
      name: row.name,
      description: `${row.name}, ${row.state} - ${row.type} (Pop: ${row.population})`,
      code: row.fips,
      includedIn: getAggregationsForType('Place'),
    }))

  writeStandardTSV(join(DATA_DIR, 'Census.Places.tsv'), records)
}

interface CBSARow {
  'CBSA Code': string
  'Metropolitan Division Code': string
  'CSA Code': string
  'CBSA Title': string
  'Metropolitan/Micropolitan Statistical Area': string
  'Metropolitan Division Title': string
  'CSA Title': string
  'County/County Equivalent': string
  'State Name': string
  'FIPS State Code': string
  'FIPS County Code': string
  'Central/Outlying County': string
}

function transformCBSA(): void {
  console.log('Transforming Census CBSA (Core Based Statistical Areas) from source file...')

  const sourceFile = join(SOURCE_DIR, 'cbsa_delineation_2023.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Warning: cbsa_delineation_2023.tsv not found, skipping CBSA')
    return
  }

  // Custom parsing for CBSA file which has headers on row 3
  let content = readFileSync(sourceFile, 'utf-8')

  // Remove BOM if present
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.substring(1)
  }

  const lines = content.split('\n').filter(line => line.trim())

  // Headers are on line 3 (index 2)
  if (lines.length < 4) {
    console.log('Warning: cbsa_delineation_2023.tsv has insufficient data')
    return
  }

  const headers = lines[2].split('\t').map(h => h.trim())
  const data: CBSARow[] = []

  // Start from line 4 (index 3)
  for (let i = 3; i < lines.length; i++) {
    const values = lines[i].split('\t')
    const record: any = {}

    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = (values[j] || '').trim()
    }

    data.push(record as CBSARow)
  }

  console.log(`Loaded ${data.length} CBSA delineation records from source`)

  // Group by CBSA Code to get unique CBSAs
  const cbsaMap = new Map<string, CBSARow>()
  for (const row of data) {
    const code = row['CBSA Code']
    // Skip invalid entries
    if (code && code.match(/^\d+$/) && !cbsaMap.has(code)) {
      cbsaMap.set(code, row)
    }
  }

  const records: StandardRecord[] = Array.from(cbsaMap.values())
    .filter(row => row['CBSA Code'] && row['CBSA Title'])
    .map(row => ({
      ns: NS,
      type: 'CBSA',
      id: toWikipediaStyleId(row['CBSA Title']),
      name: row['CBSA Title'],
      description: cleanDescription(`${row['Metropolitan/Micropolitan Statistical Area']}: ${row['CBSA Title']}`),
      code: row['CBSA Code'],
      includedIn: getAggregationsForType('CBSA'),
    }))

  writeStandardTSV(join(DATA_DIR, 'Census.CBSAs.tsv'), records)
  console.log(`Wrote ${records.length} unique CBSAs to Census.CBSAs.tsv`)
}

function transformCSA(): void {
  console.log('Transforming Census CSA (Combined Statistical Areas)...')

  // TODO: This would read from Census CSA delineation files
  console.log('CSA data requires source files from Census.gov')
  console.log('Expected file: .source/Census/CSA.tsv')
  console.log('Format: code, name, cbsas')

  const sourceFile = join(SOURCE_DIR, 'CSA.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Skipping CSA - file not found')
    return
  }

  interface CSARow {
    code: string
    name: string
    cbsas: string
  }

  const data = parseTSV<CSARow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'CSA',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: `Combined Statistical Area: ${row.name}`,
      code: row.code,
      includedIn: getAggregationsForType('CSA'),
    }))

  writeStandardTSV(join(DATA_DIR, 'Census.CSA.tsv'), records)
}

function transformMSA(): void {
  console.log('Transforming Census MSA (Metropolitan Statistical Areas - Legacy)...')

  // TODO: This would create MSA to CBSA mappings
  console.log('MSA data requires source files from Census.gov')
  console.log('Expected file: .source/Census/MSA.tsv')
  console.log('Format: code, name, cbsa')

  const sourceFile = join(SOURCE_DIR, 'MSA.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Skipping MSA - file not found')
    return
  }

  interface MSARow {
    code: string
    name: string
    cbsa: string
  }

  const data = parseTSV<MSARow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'MSA',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: `Legacy Metropolitan Statistical Area: ${row.name} (now CBSA ${row.cbsa})`,
      code: row.code,
      includedIn: getAggregationsForType('MSA'),
    }))

  writeStandardTSV(join(DATA_DIR, 'Census.MSA.tsv'), records)

  // Create MSA to CBSA relationships
  const relationships: RelationshipRecord[] = data
    .filter(row => row.code && row.cbsa)
    .map(row => ({
      fromNs: NS,
      fromType: 'MSA',
      fromId: toWikipediaStyleId(row.name),
      toNs: NS,
      toType: 'CBSA',
      toId: row.cbsa,
      relationshipType: 'replaced_by',
    }))

  writeRelationshipTSV(join(REL_DIR, 'Census.MSA.CBSA.tsv'), relationships)
}

function transformCBP(): void {
  console.log('Transforming County Business Patterns...')

  // TODO: This would read from Census CBP data files
  console.log('CBP data requires source files from Census.gov')
  console.log('Expected file: .source/Census/CBP.tsv')
  console.log('Format: naics, establishments, employment, payroll')

  const sourceFile = join(SOURCE_DIR, 'CBP.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Skipping CBP - file not found')
    return
  }

  interface CBPRow {
    naics: string
    establishments: string
    employment: string
    payroll: string
  }

  const data = parseTSV<CBPRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.naics)
    .map(row => ({
      ns: NS,
      type: 'CBPIndustry',
      id: toWikipediaStyleId(`NAICS_${row.naics}`),
      name: `County Business Patterns - NAICS ${row.naics}`,
      description: `Establishments: ${row.establishments}, Employment: ${row.employment}, Payroll: ${row.payroll}`,
      code: row.naics,
      includedIn: getAggregationsForType('CBPIndustry'),
    }))

  writeStandardTSV(join(DATA_DIR, 'Census.CBP.tsv'), records)

  // Create CBP to NAICS relationships
  const relationships: RelationshipRecord[] = data
    .filter(row => row.naics)
    .map(row => ({
      fromNs: NS,
      fromType: 'CBPIndustry',
      fromId: toWikipediaStyleId(`NAICS_${row.naics}`),
      toNs: NAMESPACES.NAICS,
      toType: 'Industry',
      toId: row.naics,
      relationshipType: 'based_on',
    }))

  writeRelationshipTSV(join(REL_DIR, 'Census.CBP.NAICS.tsv'), relationships)
}

export async function transformCensus(): Promise<void> {
  console.log('=== US Census Bureau Transformation ===')
  ensureOutputDirs()

  // Transform geographic entities
  transformStates()
  transformRegions()
  transformDivisions()
  transformCounties()
  transformPlaces()

  // Transform metropolitan areas
  transformCBSA()
  transformCSA()
  transformMSA()

  // Transform business patterns
  transformCBP()

  console.log('=== US Census Bureau Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformCensus()
}
