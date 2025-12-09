import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'

// Canonical namespaces for each source (authoritative domains)
export const NAMESPACES = {
  // US Government (canonical)
  ONET: 'onet.org.ai',
  BLS: 'us.org.ai',
  SEC: 'us.org.ai',
  SBA: 'us.org.ai',
  USPTO: 'us.org.ai',
  USITC: 'us.org.ai',
  Census: 'us.org.ai',
  GSA: 'us.org.ai',

  // Industry & Commerce (canonical)
  APQC: 'apqc.org.ai',
  GS1: 'gs1.org.ai',
  NAICS: 'naics.org.ai',
  NAPCS: 'napcs.org.ai',
  UNSPSC: 'un.org.ai',
  AdvanceCTE: 'education.org.ai',

  // International Standards (canonical)
  ISO: 'iso.org.ai',
  ISO3166: 'iso.org.ai',
  ISO4217: 'iso.org.ai',
  ISO639: 'iso.org.ai',
  UN: 'un.org.ai',
  LOCODE: 'un.org.ai',
  M49: 'un.org.ai',

  // Web & Internet (canonical)
  IANA: 'iana.org.ai',
  W3C: 'w3.org.ai',
  SchemaOrg: 'schema.org.ai',

  // Healthcare (canonical)
  FHIR: 'hl7.org.ai',
  HL7: 'hl7.org.ai',
  ICD: 'healthcare.org.ai',
  SNOMED: 'healthcare.org.ai',
  LOINC: 'healthcare.org.ai',
  RxNorm: 'healthcare.org.ai',
  NDC: 'healthcare.org.ai',
  NPI: 'healthcare.org.ai',
  CPT: 'healthcare.org.ai',
  HCPCS: 'healthcare.org.ai',

  // EDI (canonical)
  X12: 'x12.org.ai',
  EDIFACT: 'un.org.ai',
  EANCOM: 'gs1.org.ai',
  Peppol: 'edi.org.ai',

  // Finance (canonical)
  ISO20022: 'iso.org.ai',
  LEI: 'finance.org.ai',
  ISIN: 'finance.org.ai',
  MCC: 'finance.org.ai',
  SWIFT: 'finance.org.ai',

  // Education (canonical)
  ISCED: 'education.org.ai',
  CEDS: 'education.org.ai',
  CASE: 'education.org.ai',

  // Ecommerce (canonical)
  ECLASS: 'commerce.org.ai',
  ETIM: 'commerce.org.ai',
} as const

// Standard output columns
export interface StandardRecord {
  ns: string              // Canonical namespace (e.g., 'apqc.org.ai')
  type: string            // Type within namespace (e.g., 'Process')
  id: string              // Unique ID (e.g., 'Develop_And_Manage_Products')
  name: string            // Display name
  description: string     // Description text
  code: string            // Original code from source
  sameAs?: string         // Link to canonical source (for superset items)
  includedIn?: string     // Pipe-separated aggregation domains this belongs to
}

// Helper to build full $id URL
export function buildId(ns: string, type: string, id: string): string {
  return `https://${ns}/${type}/${id}`
}

// Helper to build sameAs URL for superset items
export function buildSameAs(canonicalNs: string, type: string, id: string): string {
  return `https://${canonicalNs}/${type}/${id}`
}

// Type-to-domain mappings for aggregation
export const TYPE_AGGREGATIONS: Record<string, string[]> = {
  // Process types
  Process: ['business.org.ai', 'manufacturing.org.ai', 'process.org.ai'],
  Category: ['business.org.ai', 'process.org.ai'],
  ProcessGroup: ['business.org.ai', 'process.org.ai'],
  Activity: ['business.org.ai', 'process.org.ai'],

  // Industry types
  Industry: ['business.org.ai', 'industries.org.ai'],
  Sector: ['business.org.ai', 'industries.org.ai'],

  // Occupation types (ONET)
  Occupation: ['business.org.ai', 'occupations.org.ai'],
  Skill: ['business.org.ai', 'skills.org.ai', 'education.org.ai'],
  Ability: ['business.org.ai', 'education.org.ai'],
  Knowledge: ['business.org.ai', 'education.org.ai'],
  WorkActivity: ['business.org.ai', 'occupations.org.ai'],
  WorkStyle: ['business.org.ai', 'occupations.org.ai'],
  WorkValue: ['business.org.ai', 'occupations.org.ai'],
  Interest: ['business.org.ai', 'education.org.ai'],
  Technology: ['business.org.ai', 'tech.org.ai'],
  JobZone: ['business.org.ai', 'education.org.ai'],
  AlternateTitle: ['business.org.ai', 'occupations.org.ai'],
  Task: ['business.org.ai', 'process.org.ai'],
  ReportedTitle: ['business.org.ai', 'occupations.org.ai'],
  Tool: ['business.org.ai', 'manufacturing.org.ai'],
  DWA: ['business.org.ai', 'occupations.org.ai'],
  IWA: ['business.org.ai', 'occupations.org.ai'],
  WorkContext: ['business.org.ai', 'occupations.org.ai'],
  WorkContextCategory: ['business.org.ai', 'occupations.org.ai'],
  Education: ['education.org.ai', 'business.org.ai'],
  Scale: ['business.org.ai'],
  RIASEC: ['education.org.ai', 'business.org.ai'],
  TaskCategory: ['business.org.ai', 'process.org.ai'],
  EmergingTask: ['business.org.ai', 'tech.org.ai'],

  // Product types
  Product: ['business.org.ai', 'products.org.ai', 'retail.org.ai'],
  Segment: ['business.org.ai', 'products.org.ai'],
  Family: ['business.org.ai', 'products.org.ai'],
  Class: ['business.org.ai', 'products.org.ai'],
  Commodity: ['business.org.ai', 'products.org.ai', 'retail.org.ai'],
  Brick: ['business.org.ai', 'products.org.ai'],
  Group: ['business.org.ai', 'products.org.ai'],
  Subclass: ['business.org.ai', 'products.org.ai'],
  Detail: ['business.org.ai', 'products.org.ai'],

  // Service types
  Service: ['business.org.ai', 'services.org.ai'],
  ServiceCategory: ['business.org.ai', 'services.org.ai'],
  SkillCategory: ['business.org.ai', 'skills.org.ai', 'education.org.ai'],
  ProcessCategory: ['business.org.ai', 'process.org.ai'],

  // APQC types
  Metric: ['business.org.ai', 'process.org.ai'],
  MetricCategory: ['business.org.ai', 'process.org.ai'],
  GlossaryTerm: ['business.org.ai'],

  // GS1 types
  Attribute: ['business.org.ai', 'products.org.ai'],
  Vocabulary: ['business.org.ai', 'logistics.org.ai'],
  LocationType: ['logistics.org.ai', 'business.org.ai'],
  BusinessStep: ['logistics.org.ai', 'business.org.ai'],
  Disposition: ['logistics.org.ai', 'business.org.ai'],
  IdentifierType: ['logistics.org.ai', 'business.org.ai'],
  GLNFunctionalType: ['logistics.org.ai', 'business.org.ai'],
  LocationRelationship: ['logistics.org.ai', 'business.org.ai'],
  Schema: ['tech.org.ai', 'business.org.ai'],
  EventType: ['logistics.org.ai', 'business.org.ai'],
  IdentifierStructure: ['logistics.org.ai', 'business.org.ai'],

  // Healthcare types
  Resource: ['healthcare.org.ai'],
  Code: ['healthcare.org.ai'],

  // Finance types
  Message: ['finance.org.ai'],
  Currency: ['finance.org.ai'],

  // Geography types
  Country: ['business.org.ai'],
  Region: ['business.org.ai'],
  SubRegion: ['business.org.ai'],
  Subdivision: ['business.org.ai'],
  Timezone: ['business.org.ai', 'tech.org.ai'],
  Zone: ['business.org.ai', 'tech.org.ai'],

  // Language/Education types
  Language: ['business.org.ai', 'education.org.ai'],
  CareerCluster: ['education.org.ai', 'business.org.ai'],
  SubCluster: ['education.org.ai', 'business.org.ai'],

  // Web/Tech types
  Type: ['web.org.ai', 'tech.org.ai'],
  Property: ['web.org.ai', 'tech.org.ai'],
  Element: ['web.org.ai', 'tech.org.ai'],
  Guideline: ['web.org.ai', 'tech.org.ai'],
  SuccessCriterion: ['web.org.ai', 'tech.org.ai'],
  Technique: ['web.org.ai', 'tech.org.ai'],
  Principle: ['web.org.ai', 'tech.org.ai'],
  Enumeration: ['web.org.ai', 'tech.org.ai'],
  EnumerationMember: ['web.org.ai', 'tech.org.ai'],

  // EDI/Logistics types
  TransactionSet: ['logistics.org.ai', 'edi.org.ai'],
  Location: ['logistics.org.ai', 'business.org.ai'],
  DataElement: ['logistics.org.ai', 'edi.org.ai'],
  Document: ['logistics.org.ai', 'edi.org.ai'],
  BusinessProcess: ['logistics.org.ai', 'business.org.ai'],
  ParticipantScheme: ['logistics.org.ai', 'business.org.ai'],
  Codelist: ['logistics.org.ai', 'business.org.ai'],
  EDIFACTMessage: ['logistics.org.ai', 'edi.org.ai'],
  EDIFACTCategory: ['logistics.org.ai', 'edi.org.ai'],
  SPSC: ['business.org.ai', 'products.org.ai'],
  StructureLevel: ['business.org.ai', 'products.org.ai'],

  // BLS types
  OESOccupation: ['business.org.ai', 'occupations.org.ai'],
  STEM: ['education.org.ai', 'tech.org.ai'],
}

// Get aggregation domains for a type
export function getAggregationsForType(type: string): string {
  const domains = TYPE_AGGREGATIONS[type] || ['business.org.ai']
  return domains.join('|')
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

/**
 * Convert a string to a URL-safe ID
 * - Replaces spaces with underscores
 * - Removes / and ? (URL reserved characters)
 * - Preserves original case (no capitalization changes)
 * - Preserves most other characters (parentheses, hyphens, etc.)
 *
 * Examples:
 *   "chief executives" -> "chief_executives"
 *   "software-developer" -> "software-developer"
 *   "IT Manager" -> "IT_Manager"
 *   "C++" -> "C++"
 *   "What is this?" -> "What_is_this"
 *   "path/to/thing" -> "path_to_thing"
 */
export function toWikipediaStyleId(str: string): string {
  if (!str) return ''

  return str
    .trim()
    // Replace spaces with underscores
    .replace(/\s+/g, '_')
    // Remove / and ? (URL reserved characters)
    .replace(/[\/\?]/g, '_')
    // Clean up any double underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_|_$/g, '')
}

/**
 * Parse a TSV file into an array of objects
 */
export function parseTSV<T = Record<string, string>>(filePath: string): T[] {
  let content = readFileSync(filePath, 'utf-8')

  // Remove BOM if present
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.substring(1)
  }

  // Split into lines, but handle quoted fields with embedded newlines
  const allLines: string[] = []
  let currentLine = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const nextChar = content[i + 1]

    if (char === '"') {
      inQuotes = !inQuotes
      currentLine += char
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentLine.trim()) {
        allLines.push(currentLine)
      }
      currentLine = ''
      // Skip \r\n combinations
      if (char === '\r' && nextChar === '\n') {
        i++
      }
    } else {
      currentLine += char
    }
  }

  // Add the last line if not empty
  if (currentLine.trim()) {
    allLines.push(currentLine)
  }

  if (allLines.length === 0) return []

  // Parse header row
  const headers = parseTSVLine(allLines[0]).map(h => {
    // Trim and remove surrounding quotes if present
    let header = h.trim()
    // Remove BOM character if present anywhere in the header (some files have it inside quotes)
    header = header.replace(/\uFEFF/g, '')
    // Remove outer quotes (both single and double)
    if ((header.startsWith('"') && header.endsWith('"')) ||
        (header.startsWith("'") && header.endsWith("'"))) {
      header = header.substring(1, header.length - 1)
    }
    // Remove any remaining quotes at the edges (for cases like """header""")
    while ((header.startsWith('"') && header.endsWith('"')) ||
           (header.startsWith("'") && header.endsWith("'"))) {
      header = header.substring(1, header.length - 1)
    }
    return header.trim()
  })

  const records: T[] = []

  for (let i = 1; i < allLines.length; i++) {
    const values = parseTSVLine(allLines[i])
    const record: Record<string, string> = {}

    for (let j = 0; j < headers.length; j++) {
      let value = values[j] || ''
      // Remove surrounding quotes if present
      value = value.trim()
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1)
        // Unescape any escaped quotes
        value = value.replace(/""/g, '"')
      }
      record[headers[j]] = value
    }

    records.push(record as T)
  }

  return records
}

/**
 * Parse a single TSV line, handling quoted fields
 */
function parseTSVLine(line: string): string[] {
  const fields: string[] = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      // Check for escaped quote ("")
      if (inQuotes && nextChar === '"') {
        currentField += '"'
        i++ // Skip the next quote
      } else {
        inQuotes = !inQuotes
        currentField += char
      }
    } else if (char === '\t' && !inQuotes) {
      fields.push(currentField)
      currentField = ''
    } else {
      currentField += char
    }
  }

  // Add the last field
  fields.push(currentField)

  return fields
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
 * Write standard records (with ns, type, id, name, description, code, sameAs, includedIn)
 */
export function writeStandardTSV(filePath: string, records: StandardRecord[]): void {
  // Convert records to include optional fields as empty strings
  const normalizedRecords = records.map(r => ({
    ns: r.ns,
    type: r.type,
    id: r.id,
    name: r.name,
    description: r.description,
    code: r.code,
    sameAs: r.sameAs || '',
    includedIn: r.includedIn || '',
  }))
  writeTSV(filePath, normalizedRecords, ['ns', 'type', 'id', 'name', 'description', 'code', 'sameAs', 'includedIn'])
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
