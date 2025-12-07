import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'

// Namespaces for each source
export const NAMESPACES = {
  ONET: 'onet.org.ai',
  APQC: 'apqc.org.ai',
  GS1: 'gs1.org.ai',
  NAICS: 'naics.org.ai',
  BLS: 'standards.org.ai',
  NAPCS: 'standards.org.ai',
  UNSPSC: 'standards.org.ai',
  AdvanceCTE: 'standards.org.ai',
  ISO: 'iso.org.ai',
  UN: 'un.org.ai',
  IANA: 'iana.org.ai',
  EDIFACT: 'un.org.ai',
  W3C: 'w3.org.ai',
  W3C_ALT: 'w3c.org.ai',  // Alternative W3C namespace used in some files
  FHIR: 'fhir.org.ai',
  X12: 'x12.org.ai',
  EANCOM: 'eancom.org.ai',
  Peppol: 'peppol.org.ai',
  ICD: 'icd.org.ai',
  SNOMED: 'snomed.org.ai',
  LOINC: 'loinc.org.ai',
  ISO20022: 'iso20022.org.ai',
  LEI: 'lei.org.ai',
  ISIN: 'isin.org.ai',
  MCC: 'mcc.org.ai',
  SWIFT: 'swift.org.ai',
  SEC: 'us.org.ai',
  SBA: 'us.org.ai',
  USPTO: 'us.org.ai',
  USITC: 'us.org.ai',
} as const

// Standard output columns
export interface StandardRecord {
  ns: string
  type: string
  id: string
  name: string
  description: string
  code: string
}

// Relationship record
export interface RelationshipRecord {
  fromNs: string
  fromType: string
  fromId: string
  toNs: string
  toType: string
  toId: string
  relationshipType?: string
}

// Symbol to word mappings for ID generation
const SYMBOL_MAPPINGS: Record<string, string> = {
  '%': 'Percent',
  '#': 'Hash',
  '@': 'At',
  '&': 'And',
  '+': 'Plus',
  '*': 'Star',
  '<': 'Less_Than',
  '>': 'Greater_Than',
  '=': 'Equals',
  '!': 'Not',
  '?': 'Question',
  '$': 'Dollar',
  '€': 'Euro',
  '£': 'Pound',
  '¥': 'Yen',
}

/**
 * Convert a string to Wikipedia-style name (Title_Case_With_Underscores)
 * Examples:
 *   "chief executives" -> "Chief_Executives"
 *   "software-developer" -> "Software_Developer"
 *   "IT Manager" -> "IT_Manager"
 *   "%" -> "Percent"
 */
export function toWikipediaStyleId(str: string): string {
  if (!str) return ''

  // Check for exact symbol matches first
  if (SYMBOL_MAPPINGS[str.trim()]) {
    return SYMBOL_MAPPINGS[str.trim()]
  }

  // Replace known symbols with words
  let processed = str.trim()
  for (const [symbol, word] of Object.entries(SYMBOL_MAPPINGS)) {
    processed = processed.replace(new RegExp(`\\${symbol}`, 'g'), ` ${word} `)
  }

  return processed
    // Replace multiple spaces, dashes, slashes with single space
    .replace(/[\s\-\/]+/g, ' ')
    // Remove special characters except apostrophes and parentheses
    .replace(/[^\w\s'()]/g, '')
    // Split into words
    .split(/\s+/)
    // Capitalize each word (preserve acronyms that are already uppercase)
    .map(word => {
      if (word.length === 0) return ''
      // If it's already all uppercase and short (likely acronym), keep it
      if (word === word.toUpperCase() && word.length <= 4) return word
      // Otherwise, capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    // Join with underscores
    .join('_')
    // Clean up any double underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_|_$/g, '')
}

/**
 * Parse a TSV file into an array of objects
 */
export function parseTSV<T = Record<string, string>>(filePath: string): T[] {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())

  if (lines.length === 0) return []

  const headers = lines[0].split('\t').map(h => h.trim())
  const records: T[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t')
    const record: Record<string, string> = {}

    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = (values[j] || '').trim()
    }

    records.push(record as T)
  }

  return records
}

/**
 * Parse a CSV file into an array of objects
 */
export function parseCSV<T = Record<string, string>>(filePath: string): T[] {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())

  if (lines.length === 0) return []

  // Simple CSV parsing (doesn't handle quoted commas perfectly)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseCSVLine(lines[0])
  const records: T[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const record: Record<string, string> = {}

    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = (values[j] || '').trim()
    }

    records.push(record as T)
  }

  return records
}

/**
 * Write records to a TSV file
 */
export function writeTSV(filePath: string, records: Record<string, string | undefined>[], headers?: string[]): void {
  if (records.length === 0) {
    console.log(`Skipping ${filePath} - no records`)
    return
  }

  // Ensure directory exists
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  // Use provided headers or infer from first record
  const cols = headers || Object.keys(records[0])

  const lines = [
    cols.join('\t'),
    ...records.map(record =>
      cols.map(col => escapeForTSV(record[col] || '')).join('\t')
    )
  ]

  writeFileSync(filePath, lines.join('\n'), 'utf-8')
  console.log(`Wrote ${records.length} records to ${filePath}`)
}

/**
 * Write standard records (with ns, type, id, name, description, code)
 */
export function writeStandardTSV(filePath: string, records: StandardRecord[]): void {
  writeTSV(filePath, records, ['ns', 'type', 'id', 'name', 'description', 'code'])
}

/**
 * Write relationship records
 */
export function writeRelationshipTSV(filePath: string, records: RelationshipRecord[]): void {
  writeTSV(filePath, records as unknown as Record<string, string>[], [
    'fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType'
  ])
}

/**
 * Escape a value for TSV (replace tabs and newlines)
 */
function escapeForTSV(value: string): string {
  return value
    .replace(/\t/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
}

/**
 * Clean and normalize description text
 */
export function cleanDescription(text: string | undefined): string {
  if (!text) return ''
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\t\n\r]/g, ' ')
    .trim()
}

/**
 * Get the source directory path
 */
export function getSourcePath(source: string): string {
  return join(process.cwd(), '.source', source)
}

/**
 * Get the data output directory path
 */
export function getDataPath(): string {
  return join(process.cwd(), '.data')
}

/**
 * Get the relationships output directory path
 */
export function getRelationshipsPath(): string {
  return join(process.cwd(), '.data', 'relationships')
}

/**
 * Ensure output directories exist
 */
export function ensureOutputDirs(): void {
  const dataPath = getDataPath()
  const relPath = getRelationshipsPath()

  if (!existsSync(dataPath)) {
    mkdirSync(dataPath, { recursive: true })
  }
  if (!existsSync(relPath)) {
    mkdirSync(relPath, { recursive: true })
  }
}
