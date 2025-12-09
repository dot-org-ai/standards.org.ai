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

// EDI Namespaces - proper namespace mapping
const NS_X12 = NAMESPACES.X12 // x12.org.ai
const NS_EDIFACT = NAMESPACES.EDIFACT // un.org.ai
const NS_EANCOM = NAMESPACES.EANCOM // gs1.org.ai
const NS_PEPPOL = NAMESPACES.Peppol // edi.org.ai

const SOURCE_DIR_X12 = getSourcePath('EDI/X12')
const SOURCE_DIR_EANCOM = getSourcePath('EDI/EANCOM')
const SOURCE_DIR_PEPPOL = getSourcePath('EDI/Peppol')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// X12 Interfaces
interface X12TransactionSetRow {
  code: string
  name: string
  description: string
  category: string
}

interface X12SegmentRow {
  code: string
  name: string
  description: string
}

interface X12ElementRow {
  code: string
  name: string
  dataType: string
  minLength: string
  maxLength: string
  description: string
}

// EANCOM Interfaces
interface EANCOMMessageRow {
  code: string
  name: string
  description: string
  category: string
}

interface EANCOMSegmentRow {
  code: string
  name: string
  description: string
}

interface EANCOMDataElementRow {
  code: string
  name: string
  dataType: string
  minLength: string
  maxLength: string
  description: string
}

// Peppol Interfaces
interface PeppolDocumentRow {
  code: string
  name: string
  description: string
  version: string
}

interface PeppolBusinessProcessRow {
  code: string
  name: string
  description: string
  profile: string
}

interface PeppolParticipantSchemeRow {
  icd: string
  schemeID: string
  schemeName: string
  issuingOrganization: string
  status: string
}

interface PeppolCodelistRow {
  codelistName: string
  code: string
  name: string
  description: string
  category: string
}

// X12 Transformation Functions
function transformX12TransactionSets(): void {
  console.log('Transforming X12 Transaction Sets...')
  const sourceFile = join(SOURCE_DIR_X12, 'TransactionSets.tsv')

  if (!existsSync(sourceFile)) {
    console.log('TransactionSets.tsv not found, skipping...')
    return
  }

  const data = parseTSV<X12TransactionSetRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS_X12,
      type: 'TransactionSet',
      id: toWikipediaStyleId(`${row.code}_${row.name}`),
      name: `${row.code} - ${row.name}`,
      description: cleanDescription(row.description),
      code: row.code,
      includedIn: getAggregationsForType('TransactionSet'),
    }))

  writeStandardTSV(join(DATA_DIR, 'EDI.X12.TransactionSets.tsv'), records)
  console.log(`Transformed ${records.length} X12 Transaction Sets`)
}

function transformX12Segments(): void {
  console.log('Transforming X12 Segments...')
  const sourceFile = join(SOURCE_DIR_X12, 'Segments.tsv')

  if (!existsSync(sourceFile)) {
    console.log('Segments.tsv not found, skipping...')
    return
  }

  const data = parseTSV<X12SegmentRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS_X12,
      type: 'Segment',
      id: toWikipediaStyleId(row.code),
      name: `${row.code} - ${row.name}`,
      description: cleanDescription(row.description),
      code: row.code,
      includedIn: getAggregationsForType('Segment'),
    }))

  writeStandardTSV(join(DATA_DIR, 'EDI.X12.Segments.tsv'), records)
  console.log(`Transformed ${records.length} X12 Segments`)
}

function transformX12Elements(): void {
  console.log('Transforming X12 Data Elements...')
  const sourceFile = join(SOURCE_DIR_X12, 'Elements.tsv')

  if (!existsSync(sourceFile)) {
    console.log('Elements.tsv not found, skipping...')
    return
  }

  const data = parseTSV<X12ElementRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS_X12,
      type: 'Element',
      id: toWikipediaStyleId(`${row.code}_${row.name}`),
      name: `${row.code} - ${row.name}`,
      description: cleanDescription(`${row.description} Type: ${row.dataType}, Length: ${row.minLength}-${row.maxLength}`),
      code: row.code,
      includedIn: getAggregationsForType('Element'),
    }))

  writeStandardTSV(join(DATA_DIR, 'EDI.X12.Elements.tsv'), records)
  console.log(`Transformed ${records.length} X12 Elements`)
}

// EANCOM Transformation Functions
function transformEANCOMMessages(): void {
  console.log('Transforming EANCOM Messages...')
  const sourceFile = join(SOURCE_DIR_EANCOM, 'Messages.tsv')

  if (!existsSync(sourceFile)) {
    console.log('Messages.tsv not found, skipping...')
    return
  }

  const data = parseTSV<EANCOMMessageRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS_EANCOM,
      type: 'Message',
      id: toWikipediaStyleId(`${row.code}_${row.name}`),
      name: `${row.code} - ${row.name}`,
      description: cleanDescription(row.description),
      code: row.code,
      includedIn: getAggregationsForType('Message'),
    }))

  writeStandardTSV(join(DATA_DIR, 'EDI.EANCOM.Messages.tsv'), records)
  console.log(`Transformed ${records.length} EANCOM Messages`)
}

function transformEANCOMSegments(): void {
  console.log('Transforming EANCOM Segments...')
  const sourceFile = join(SOURCE_DIR_EANCOM, 'Segments.tsv')

  if (!existsSync(sourceFile)) {
    console.log('Segments.tsv not found, skipping...')
    return
  }

  const data = parseTSV<EANCOMSegmentRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS_EANCOM,
      type: 'Segment',
      id: toWikipediaStyleId(row.code),
      name: `${row.code} - ${row.name}`,
      description: cleanDescription(row.description),
      code: row.code,
      includedIn: getAggregationsForType('Segment'),
    }))

  writeStandardTSV(join(DATA_DIR, 'EDI.EANCOM.Segments.tsv'), records)
  console.log(`Transformed ${records.length} EANCOM Segments`)
}

function transformEANCOMDataElements(): void {
  console.log('Transforming EANCOM Data Elements...')
  const sourceFile = join(SOURCE_DIR_EANCOM, 'DataElements.tsv')

  if (!existsSync(sourceFile)) {
    console.log('DataElements.tsv not found, skipping...')
    return
  }

  const data = parseTSV<EANCOMDataElementRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS_EANCOM,
      type: 'DataElement',
      id: toWikipediaStyleId(`${row.code}_${row.name}`),
      name: `${row.code} - ${row.name}`,
      description: cleanDescription(`${row.description} Type: ${row.dataType}, Length: ${row.minLength}-${row.maxLength}`),
      code: row.code,
      includedIn: getAggregationsForType('DataElement'),
    }))

  writeStandardTSV(join(DATA_DIR, 'EDI.EANCOM.DataElements.tsv'), records)
  console.log(`Transformed ${records.length} EANCOM Data Elements`)
}

// Peppol Transformation Functions
function transformPeppolDocuments(): void {
  console.log('Transforming Peppol Documents...')
  const sourceFile = join(SOURCE_DIR_PEPPOL, 'Documents.tsv')

  if (!existsSync(sourceFile)) {
    console.log('Documents.tsv not found, skipping...')
    return
  }

  const data = parseTSV<PeppolDocumentRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS_PEPPOL,
      type: 'Document',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: cleanDescription(`${row.description} Version: ${row.version}`),
      code: row.code,
      includedIn: getAggregationsForType('Document'),
    }))

  writeStandardTSV(join(DATA_DIR, 'EDI.Peppol.Documents.tsv'), records)
  console.log(`Transformed ${records.length} Peppol Documents`)
}

function transformPeppolBusinessProcesses(): void {
  console.log('Transforming Peppol Business Processes...')
  const sourceFile = join(SOURCE_DIR_PEPPOL, 'BusinessProcesses.tsv')

  if (!existsSync(sourceFile)) {
    console.log('BusinessProcesses.tsv not found, skipping...')
    return
  }

  const data = parseTSV<PeppolBusinessProcessRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS_PEPPOL,
      type: 'BusinessProcess',
      id: toWikipediaStyleId(row.name),
      name: `${row.code} - ${row.name}`,
      description: cleanDescription(`${row.description} Profile: ${row.profile}`),
      code: row.code,
      includedIn: getAggregationsForType('BusinessProcess'),
    }))

  writeStandardTSV(join(DATA_DIR, 'EDI.Peppol.BusinessProcesses.tsv'), records)
  console.log(`Transformed ${records.length} Peppol Business Processes`)
}

function transformPeppolParticipantSchemes(): void {
  console.log('Transforming Peppol Participant Schemes...')
  const sourceFile = join(SOURCE_DIR_PEPPOL, 'ParticipantSchemes.tsv')

  if (!existsSync(sourceFile)) {
    console.log('ParticipantSchemes.tsv not found, skipping...')
    return
  }

  const data = parseTSV<PeppolParticipantSchemeRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.icd && row.schemeID)
    .map(row => ({
      ns: NS_PEPPOL,
      type: 'ParticipantScheme',
      id: toWikipediaStyleId(`${row.icd}_${row.schemeID}`),
      name: `${row.schemeID} - ${row.schemeName}`,
      description: cleanDescription(`${row.schemeName} (${row.issuingOrganization}). Status: ${row.status}`),
      code: row.icd,
    }))

  writeStandardTSV(join(DATA_DIR, 'EDI.Peppol.ParticipantSchemes.tsv'), records)
  console.log(`Transformed ${records.length} Peppol Participant Schemes`)
}

function transformPeppolCodelists(): void {
  console.log('Transforming Peppol Codelists...')
  const sourceFile = join(SOURCE_DIR_PEPPOL, 'Codelists.tsv')

  if (!existsSync(sourceFile)) {
    console.log('Codelists.tsv not found, skipping...')
    return
  }

  const data = parseTSV<PeppolCodelistRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS_PEPPOL,
      type: 'Codelist',
      id: toWikipediaStyleId(`${row.codelistName}_${row.code}_${row.name}`),
      name: `${row.code} - ${row.name}`,
      description: cleanDescription(`${row.description} (${row.codelistName})`),
      code: row.code,
    }))

  writeStandardTSV(join(DATA_DIR, 'EDI.Peppol.Codelists.tsv'), records)
  console.log(`Transformed ${records.length} Peppol Codelist entries`)
}

// Main transformation function
export async function transformEDI(): Promise<void> {
  console.log('=== EDI/Supply Chain Standards Transformation ===')
  ensureOutputDirs()

  // X12 Transformations
  console.log('\n--- X12 Standards ---')
  transformX12TransactionSets()
  transformX12Segments()
  transformX12Elements()

  // EANCOM Transformations
  console.log('\n--- EANCOM Standards ---')
  transformEANCOMMessages()
  transformEANCOMSegments()
  transformEANCOMDataElements()

  // Peppol Transformations
  console.log('\n--- Peppol Standards ---')
  transformPeppolDocuments()
  transformPeppolBusinessProcesses()
  transformPeppolParticipantSchemes()
  transformPeppolCodelists()

  console.log('\n=== EDI Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformEDI()
}
