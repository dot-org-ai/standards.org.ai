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
  type StandardRecord,
} from './utils'

// EDI Namespaces
const NS_X12 = 'x12.org.ai'
const NS_EANCOM = 'eancom.org.ai'
const NS_PEPPOL = 'peppol.org.ai'

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
  functionalGroup: string
  purpose: string
}

interface X12SegmentRow {
  segmentID: string
  segmentName: string
  description: string
  purpose: string
  maxUse: string
}

interface X12ElementRow {
  elementID: string
  elementName: string
  description: string
  dataType: string
  minLength: string
  maxLength: string
}

interface X12CodeRow {
  elementID: string
  codeValue: string
  codeName: string
  description: string
}

// EANCOM Interfaces
interface EANCOMMessageRow {
  messageCode: string
  messageName: string
  description: string
  version: string
  edifactType: string
}

interface EANCOMSegmentRow {
  segmentTag: string
  segmentName: string
  description: string
  status: string
  maxOccurrences: string
}

interface EANCOMDataElementRow {
  elementID: string
  elementName: string
  description: string
  format: string
  status: string
}

// Peppol Interfaces
interface PeppolDocumentRow {
  documentID: string
  documentName: string
  description: string
  ublVersion: string
  peppolBIS: string
  customizationID: string
}

interface PeppolBusinessProcessRow {
  bisCode: string
  bisName: string
  description: string
  version: string
  profileID: string
}

interface PeppolPartyRow {
  identifierScheme: string
  partyID: string
  partyName: string
  countryCode: string
  schemeAgencyID: string
}

interface PeppolCodelistRow {
  codelistID: string
  codelistName: string
  description: string
  agencyID: string
  version: string
}

// X12 Transformation Functions
function transformX12TransactionSets(): void {
  console.log('Transforming X12 Transaction Sets...')
  const sourceFile = join(SOURCE_DIR_X12, 'X12.TransactionSets.tsv')

  if (!existsSync(sourceFile)) {
    console.log('X12.TransactionSets.tsv not found, skipping...')
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
    }))

  writeStandardTSV(join(DATA_DIR, 'X12.TransactionSets.tsv'), records)
}

function transformX12Segments(): void {
  console.log('Transforming X12 Segments...')
  const sourceFile = join(SOURCE_DIR_X12, 'X12.Segments.tsv')

  if (!existsSync(sourceFile)) {
    console.log('X12.Segments.tsv not found, skipping...')
    return
  }

  const data = parseTSV<X12SegmentRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.segmentID && row.segmentName)
    .map(row => ({
      ns: NS_X12,
      type: 'Segment',
      id: toWikipediaStyleId(row.segmentID),
      name: `${row.segmentID} - ${row.segmentName}`,
      description: cleanDescription(`${row.description} Purpose: ${row.purpose || ''}`),
      code: row.segmentID,
    }))

  writeStandardTSV(join(DATA_DIR, 'X12.Segments.tsv'), records)
}

function transformX12Elements(): void {
  console.log('Transforming X12 Data Elements...')
  const sourceFile = join(SOURCE_DIR_X12, 'X12.Elements.tsv')

  if (!existsSync(sourceFile)) {
    console.log('X12.Elements.tsv not found, skipping...')
    return
  }

  const data = parseTSV<X12ElementRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.elementID && row.elementName)
    .map(row => ({
      ns: NS_X12,
      type: 'Element',
      id: toWikipediaStyleId(`${row.elementID}_${row.elementName}`),
      name: `${row.elementID} - ${row.elementName}`,
      description: cleanDescription(`${row.description} Type: ${row.dataType}, Length: ${row.minLength}-${row.maxLength}`),
      code: row.elementID,
    }))

  writeStandardTSV(join(DATA_DIR, 'X12.Elements.tsv'), records)
}

function transformX12Codes(): void {
  console.log('Transforming X12 Code Lists...')
  const sourceFile = join(SOURCE_DIR_X12, 'X12.Codes.tsv')

  if (!existsSync(sourceFile)) {
    console.log('X12.Codes.tsv not found, skipping...')
    return
  }

  const data = parseTSV<X12CodeRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.elementID && row.codeValue)
    .map(row => ({
      ns: NS_X12,
      type: 'Code',
      id: toWikipediaStyleId(`${row.elementID}_${row.codeValue}_${row.codeName}`),
      name: `${row.codeValue} - ${row.codeName}`,
      description: cleanDescription(row.description),
      code: `${row.elementID}:${row.codeValue}`,
    }))

  writeStandardTSV(join(DATA_DIR, 'X12.Codes.tsv'), records)

  // Write relationships between codes and elements
  const relationships: Record<string, string>[] = data
    .filter(row => row.elementID && row.codeValue)
    .map(row => ({
      fromNs: NS_X12,
      fromType: 'Code',
      fromCode: `${row.elementID}:${row.codeValue}`,
      toNs: NS_X12,
      toType: 'Element',
      toCode: row.elementID,
      relationshipType: 'code_for_element',
    }))

  writeTSV(
    join(REL_DIR, 'X12.Code.Element.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

// EANCOM Transformation Functions
function transformEANCOMMessages(): void {
  console.log('Transforming EANCOM Messages...')
  const sourceFile = join(SOURCE_DIR_EANCOM, 'EANCOM.Messages.tsv')

  if (!existsSync(sourceFile)) {
    console.log('EANCOM.Messages.tsv not found, skipping...')
    return
  }

  const data = parseTSV<EANCOMMessageRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.messageCode && row.messageName)
    .map(row => ({
      ns: NS_EANCOM,
      type: 'Message',
      id: toWikipediaStyleId(`${row.messageCode}_${row.messageName}`),
      name: `${row.messageCode} - ${row.messageName}`,
      description: cleanDescription(`${row.description} Version: ${row.version}, EDIFACT Type: ${row.edifactType}`),
      code: row.messageCode,
    }))

  writeStandardTSV(join(DATA_DIR, 'EANCOM.Messages.tsv'), records)
}

function transformEANCOMSegments(): void {
  console.log('Transforming EANCOM Segments...')
  const sourceFile = join(SOURCE_DIR_EANCOM, 'EANCOM.Segments.tsv')

  if (!existsSync(sourceFile)) {
    console.log('EANCOM.Segments.tsv not found, skipping...')
    return
  }

  const data = parseTSV<EANCOMSegmentRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.segmentTag && row.segmentName)
    .map(row => ({
      ns: NS_EANCOM,
      type: 'Segment',
      id: toWikipediaStyleId(row.segmentTag),
      name: `${row.segmentTag} - ${row.segmentName}`,
      description: cleanDescription(`${row.description} Status: ${row.status}, Max Occurrences: ${row.maxOccurrences}`),
      code: row.segmentTag,
    }))

  writeStandardTSV(join(DATA_DIR, 'EANCOM.Segments.tsv'), records)
}

function transformEANCOMDataElements(): void {
  console.log('Transforming EANCOM Data Elements...')
  const sourceFile = join(SOURCE_DIR_EANCOM, 'EANCOM.DataElements.tsv')

  if (!existsSync(sourceFile)) {
    console.log('EANCOM.DataElements.tsv not found, skipping...')
    return
  }

  const data = parseTSV<EANCOMDataElementRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.elementID && row.elementName)
    .map(row => ({
      ns: NS_EANCOM,
      type: 'DataElement',
      id: toWikipediaStyleId(`${row.elementID}_${row.elementName}`),
      name: `${row.elementID} - ${row.elementName}`,
      description: cleanDescription(`${row.description} Format: ${row.format}, Status: ${row.status}`),
      code: row.elementID,
    }))

  writeStandardTSV(join(DATA_DIR, 'EANCOM.DataElements.tsv'), records)
}

// Peppol Transformation Functions
function transformPeppolDocuments(): void {
  console.log('Transforming Peppol Documents...')
  const sourceFile = join(SOURCE_DIR_PEPPOL, 'Peppol.Documents.tsv')

  if (!existsSync(sourceFile)) {
    console.log('Peppol.Documents.tsv not found, skipping...')
    return
  }

  const data = parseTSV<PeppolDocumentRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.documentID && row.documentName)
    .map(row => ({
      ns: NS_PEPPOL,
      type: 'Document',
      id: toWikipediaStyleId(row.documentName),
      name: row.documentName,
      description: cleanDescription(`${row.description} UBL: ${row.ublVersion}, BIS: ${row.peppolBIS}`),
      code: row.documentID,
    }))

  writeStandardTSV(join(DATA_DIR, 'Peppol.Documents.tsv'), records)
}

function transformPeppolBusinessProcesses(): void {
  console.log('Transforming Peppol Business Processes...')
  const sourceFile = join(SOURCE_DIR_PEPPOL, 'Peppol.BusinessProcesses.tsv')

  if (!existsSync(sourceFile)) {
    console.log('Peppol.BusinessProcesses.tsv not found, skipping...')
    return
  }

  const data = parseTSV<PeppolBusinessProcessRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.bisCode && row.bisName)
    .map(row => ({
      ns: NS_PEPPOL,
      type: 'BusinessProcess',
      id: toWikipediaStyleId(row.bisName),
      name: `${row.bisCode} - ${row.bisName}`,
      description: cleanDescription(`${row.description} Version: ${row.version}`),
      code: row.bisCode,
    }))

  writeStandardTSV(join(DATA_DIR, 'Peppol.BusinessProcesses.tsv'), records)

  // Write relationships between documents and business processes
  const relationships: Record<string, string>[] = []

  // This would need actual relationship data from source files
  // Placeholder for structure demonstration

  if (relationships.length > 0) {
    writeTSV(
      join(REL_DIR, 'Peppol.Document.BusinessProcess.tsv'),
      relationships,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
    )
  }
}

function transformPeppolParties(): void {
  console.log('Transforming Peppol Parties...')
  const sourceFile = join(SOURCE_DIR_PEPPOL, 'Peppol.Parties.tsv')

  if (!existsSync(sourceFile)) {
    console.log('Peppol.Parties.tsv not found, skipping...')
    return
  }

  const data = parseTSV<PeppolPartyRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.identifierScheme && row.partyID)
    .map(row => ({
      ns: NS_PEPPOL,
      type: 'Party',
      id: toWikipediaStyleId(`${row.identifierScheme}_${row.partyID}`),
      name: row.partyName || row.partyID,
      description: cleanDescription(`Scheme: ${row.identifierScheme}, Country: ${row.countryCode}, Agency: ${row.schemeAgencyID}`),
      code: `${row.identifierScheme}:${row.partyID}`,
    }))

  writeStandardTSV(join(DATA_DIR, 'Peppol.Parties.tsv'), records)
}

function transformPeppolCodelists(): void {
  console.log('Transforming Peppol Codelists...')
  const sourceFile = join(SOURCE_DIR_PEPPOL, 'Peppol.Codelists.tsv')

  if (!existsSync(sourceFile)) {
    console.log('Peppol.Codelists.tsv not found, skipping...')
    return
  }

  const data = parseTSV<PeppolCodelistRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.codelistID && row.codelistName)
    .map(row => ({
      ns: NS_PEPPOL,
      type: 'Codelist',
      id: toWikipediaStyleId(row.codelistName),
      name: row.codelistName,
      description: cleanDescription(`${row.description} Agency: ${row.agencyID}, Version: ${row.version}`),
      code: row.codelistID,
    }))

  writeStandardTSV(join(DATA_DIR, 'Peppol.Codelists.tsv'), records)
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
  transformX12Codes()

  // EANCOM Transformations
  console.log('\n--- EANCOM Standards ---')
  transformEANCOMMessages()
  transformEANCOMSegments()
  transformEANCOMDataElements()

  // Peppol Transformations
  console.log('\n--- Peppol Standards ---')
  transformPeppolDocuments()
  transformPeppolBusinessProcesses()
  transformPeppolParties()
  transformPeppolCodelists()

  console.log('\n=== EDI Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformEDI()
}
