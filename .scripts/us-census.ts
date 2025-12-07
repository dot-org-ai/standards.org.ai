import { join } from 'path'
import { existsSync } from 'fs'
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
  type StandardRecord,
  type RelationshipRecord,
} from './utils'

const NS = 'us.org.ai'
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

function transformStates(): void {
  console.log('Transforming Census States...')

  const records: StandardRecord[] = STATES.map(state => ({
    ns: NS,
    type: 'State',
    id: toWikipediaStyleId(state.name),
    name: state.name,
    description: `${state.name} (${state.abbreviation}) - FIPS ${state.fips}`,
    code: state.fips,
  }))

  writeStandardTSV(join(DATA_DIR, 'Census.States.tsv'), records)

  // Create state-region relationships
  const regionRelationships: RelationshipRecord[] = STATES.map(state => ({
    fromNs: NS,
    fromType: 'State',
    fromId: toWikipediaStyleId(state.name),
    toNs: NS,
    toType: 'Region',
    toId: toWikipediaStyleId(REGIONS.find(r => r.code === state.region)?.name || ''),
    relationshipType: 'in_region',
  }))

  writeRelationshipTSV(join(REL_DIR, 'Census.State.Region.tsv'), regionRelationships)

  // Create state-division relationships
  const divisionRelationships: RelationshipRecord[] = STATES.map(state => ({
    fromNs: NS,
    fromType: 'State',
    fromId: toWikipediaStyleId(state.name),
    toNs: NS,
    toType: 'Division',
    toId: toWikipediaStyleId(DIVISIONS.find(d => d.code === state.division)?.name || ''),
    relationshipType: 'in_division',
  }))

  writeRelationshipTSV(join(REL_DIR, 'Census.State.Division.tsv'), divisionRelationships)
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

function transformCounties(): void {
  console.log('Transforming Census Counties...')

  // TODO: This would read from Census county FIPS data files
  // For now, we'll create placeholder structure
  console.log('County data requires source files from Census.gov')
  console.log('Expected file: .source/Census/Counties.tsv')
  console.log('Format: fips, name, state, stateFips, classCode')

  const sourceFile = join(SOURCE_DIR, 'Counties.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Skipping counties - file not found')
    return
  }

  interface CountyRow {
    fips: string
    name: string
    state: string
    stateFips: string
    classCode: string
  }

  const data = parseTSV<CountyRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.fips && row.name)
    .map(row => ({
      ns: NS,
      type: 'County',
      id: toWikipediaStyleId(`${row.name}_${row.state}`),
      name: row.name,
      description: `${row.name}, ${row.state} - FIPS ${row.fips}`,
      code: row.fips,
    }))

  writeStandardTSV(join(DATA_DIR, 'Census.Counties.tsv'), records)

  // Create county-state relationships
  const relationships: RelationshipRecord[] = data
    .filter(row => row.fips && row.stateFips)
    .map(row => {
      const state = STATES.find(s => s.fips === row.stateFips)
      return {
        fromNs: NS,
        fromType: 'County',
        fromId: toWikipediaStyleId(`${row.name}_${row.state}`),
        toNs: NS,
        toType: 'State',
        toId: toWikipediaStyleId(state?.name || ''),
        relationshipType: 'in_state',
      }
    })

  writeRelationshipTSV(join(REL_DIR, 'Census.County.State.tsv'), relationships)
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
    }))

  writeStandardTSV(join(DATA_DIR, 'Census.Places.tsv'), records)
}

function transformCBSA(): void {
  console.log('Transforming Census CBSA (Core Based Statistical Areas)...')

  // TODO: This would read from Census CBSA delineation files
  console.log('CBSA data requires source files from Census.gov')
  console.log('Expected file: .source/Census/CBSA.tsv')
  console.log('Format: code, name, type, counties, principalCity')

  const sourceFile = join(SOURCE_DIR, 'CBSA.tsv')
  if (!existsSync(sourceFile)) {
    console.log('Skipping CBSA - file not found')
    return
  }

  interface CBSARow {
    code: string
    name: string
    type: string
    counties: string
    principalCity: string
  }

  const data = parseTSV<CBSARow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'CBSA',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: `${row.type}: ${row.name} (Principal City: ${row.principalCity})`,
      code: row.code,
    }))

  writeStandardTSV(join(DATA_DIR, 'Census.CBSA.tsv'), records)
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
