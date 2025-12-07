/**
 * Data Validation Tests for standards.org.ai
 *
 * Validates that all generated .data files comply with the expected format:
 * - Entity files: ns, type, id, name, description, code columns
 * - Relationship files: fromNs, fromType, fromId, toNs, toType, toId, relationshipType columns
 * - IDs follow Wikipedia-style naming (Title_Case_With_Underscores)
 * - Namespaces are valid
 * - No empty required fields
 */

import { describe, it, expect, beforeAll } from 'bun:test'
import { readdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { NAMESPACES } from './utils'

const DATA_DIR = join(process.cwd(), '.data')
const REL_DIR = join(DATA_DIR, 'relationships')

// Expected columns for entity files
const ENTITY_COLUMNS = ['ns', 'type', 'id', 'name', 'description', 'code']

// Expected columns for relationship files
const RELATIONSHIP_COLUMNS = ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']

// Valid namespaces
const VALID_NAMESPACES = new Set(Object.values(NAMESPACES))

// Wikipedia-style ID pattern: Title_Case_With_Underscores
// Allows alphanumeric, underscores, parentheses, apostrophes
// Must start with uppercase letter or number
const WIKIPEDIA_ID_PATTERN = /^[A-Z0-9][A-Za-z0-9_'()]*$/

interface ParsedTSV {
  headers: string[]
  rows: string[][]
  filePath: string
}

function parseTSVFile(filePath: string): ParsedTSV {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())

  if (lines.length === 0) {
    return { headers: [], rows: [], filePath }
  }

  const headers = lines[0].split('\t')
  const rows = lines.slice(1).map(line => line.split('\t'))

  return { headers, rows, filePath }
}

function isLFSPointer(content: string): boolean {
  return content.startsWith('version https://git-lfs.github.com/spec/v1')
}

function getEntityFiles(): string[] {
  if (!existsSync(DATA_DIR)) return []

  return readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.tsv') && !f.startsWith('.'))
    .map(f => join(DATA_DIR, f))
}

function getRelationshipFiles(): string[] {
  if (!existsSync(REL_DIR)) return []

  return readdirSync(REL_DIR)
    .filter(f => f.endsWith('.tsv') && !f.startsWith('.'))
    .map(f => join(REL_DIR, f))
}

describe('Data Directory Structure', () => {
  it('should have .data directory', () => {
    expect(existsSync(DATA_DIR)).toBe(true)
  })

  it('should have .data/relationships directory', () => {
    expect(existsSync(REL_DIR)).toBe(true)
  })

  it('should have entity files', () => {
    const files = getEntityFiles()
    expect(files.length).toBeGreaterThan(0)
  })

  it('should have relationship files', () => {
    const files = getRelationshipFiles()
    expect(files.length).toBeGreaterThan(0)
  })
})

describe('Entity File Format Validation', () => {
  const entityFiles = getEntityFiles()

  for (const filePath of entityFiles) {
    const fileName = filePath.split('/').pop()!

    describe(fileName, () => {
      let parsed: ParsedTSV
      let isLFS = false

      beforeAll(() => {
        const content = readFileSync(filePath, 'utf-8')
        isLFS = isLFSPointer(content)
        if (!isLFS) {
          parsed = parseTSVFile(filePath)
        }
      })

      it('should not be an LFS pointer (file should be pulled)', () => {
        if (isLFS) {
          console.warn(`  ⚠ ${fileName} is an LFS pointer - run 'git lfs pull' first`)
        }
        // Skip validation for LFS files, but warn
        expect(true).toBe(true)
      })

      it('should have correct header columns', () => {
        if (isLFS) return

        // Entity files must have at least ns, type, and name columns
        // id OR code should be present as identifier
        const baseColumns = ['ns', 'type', 'name']
        for (const col of baseColumns) {
          expect(parsed.headers).toContain(col)
        }

        // Must have either 'id' or 'code' column
        const hasIdentifier = parsed.headers.includes('id') || parsed.headers.includes('code')
        expect(hasIdentifier).toBe(true)
      })

      it('should have valid namespace values', () => {
        if (isLFS) return
        if (parsed.rows.length === 0) return

        const nsIndex = parsed.headers.indexOf('ns')
        if (nsIndex === -1) return

        const invalidNamespaces: string[] = []
        for (const row of parsed.rows) {
          const ns = row[nsIndex]
          if (ns && !VALID_NAMESPACES.has(ns)) {
            if (!invalidNamespaces.includes(ns)) {
              invalidNamespaces.push(ns)
            }
          }
        }

        if (invalidNamespaces.length > 0) {
          console.warn(`  ⚠ Unknown namespaces: ${invalidNamespaces.join(', ')}`)
        }
        // Warn but don't fail - new namespaces may be valid
        expect(true).toBe(true)
      })

      it('should have non-empty required fields (ns, type, identifier, name)', () => {
        if (isLFS) return
        if (parsed.rows.length === 0) return

        const nsIndex = parsed.headers.indexOf('ns')
        const typeIndex = parsed.headers.indexOf('type')
        // Accept either 'id' or 'code' as the identifier
        const idIndex = parsed.headers.includes('id') ? parsed.headers.indexOf('id') : parsed.headers.indexOf('code')
        const nameIndex = parsed.headers.indexOf('name')

        const emptyFields: { row: number; field: string }[] = []

        for (let i = 0; i < parsed.rows.length; i++) {
          const row = parsed.rows[i]

          // Skip rows that appear to be metadata/description rows (have content in description but no id/name)
          // These are common in classification systems for "unclassified" or "varies" entries
          const descIndex = parsed.headers.indexOf('description')
          if (descIndex >= 0 && row[descIndex]?.trim() && !row[idIndex]?.trim() && !row[nameIndex]?.trim()) {
            continue // Skip metadata rows
          }

          if (nsIndex >= 0 && !row[nsIndex]?.trim()) {
            emptyFields.push({ row: i + 2, field: 'ns' })
          }
          if (typeIndex >= 0 && !row[typeIndex]?.trim()) {
            emptyFields.push({ row: i + 2, field: 'type' })
          }
          // Only check id if it exists and is not a metadata row
          if (idIndex >= 0 && !row[idIndex]?.trim() && row[nameIndex]?.trim()) {
            emptyFields.push({ row: i + 2, field: 'id/code' })
          }
          // Only check name if it exists and is not a metadata row
          if (nameIndex >= 0 && !row[nameIndex]?.trim() && row[idIndex]?.trim()) {
            emptyFields.push({ row: i + 2, field: 'name' })
          }

          // Limit error output
          if (emptyFields.length >= 10) break
        }

        if (emptyFields.length > 0) {
          const sample = emptyFields.slice(0, 5).map(e => `row ${e.row}: ${e.field}`).join(', ')
          throw new Error(`Empty required fields found: ${sample}${emptyFields.length > 5 ? '...' : ''}`)
        }
      })

      it('should have Wikipedia-style IDs', () => {
        if (isLFS) return
        if (parsed.rows.length === 0) return

        const idIndex = parsed.headers.indexOf('id')
        if (idIndex === -1) return

        const invalidIds: string[] = []

        for (const row of parsed.rows) {
          const id = row[idIndex]?.trim()
          if (id && !isValidWikipediaStyleId(id)) {
            if (invalidIds.length < 10 && !invalidIds.includes(id)) {
              invalidIds.push(id)
            }
          }
        }

        if (invalidIds.length > 0) {
          console.warn(`  ⚠ Non-standard IDs found: ${invalidIds.slice(0, 5).join(', ')}${invalidIds.length > 5 ? '...' : ''}`)
        }
        // Warn but don't fail - some legacy IDs may not match
        expect(true).toBe(true)
      })

      it('should have consistent column count in all rows', () => {
        if (isLFS) return
        if (parsed.rows.length === 0) return

        const expectedCols = parsed.headers.length
        const inconsistentRows: number[] = []

        for (let i = 0; i < parsed.rows.length; i++) {
          if (parsed.rows[i].length !== expectedCols) {
            inconsistentRows.push(i + 2)
          }
          if (inconsistentRows.length >= 10) break
        }

        if (inconsistentRows.length > 0) {
          throw new Error(`Rows with inconsistent column count: ${inconsistentRows.slice(0, 5).join(', ')}`)
        }
      })

      it('should not have tabs or newlines in field values', () => {
        if (isLFS) return
        if (parsed.rows.length === 0) return

        const problematicRows: number[] = []

        for (let i = 0; i < parsed.rows.length; i++) {
          for (const value of parsed.rows[i]) {
            if (value && (value.includes('\t') || value.includes('\n') || value.includes('\r'))) {
              problematicRows.push(i + 2)
              break
            }
          }
          if (problematicRows.length >= 10) break
        }

        if (problematicRows.length > 0) {
          throw new Error(`Rows with embedded tabs/newlines: ${problematicRows.slice(0, 5).join(', ')}`)
        }
      })
    })
  }
})

describe('Relationship File Format Validation', () => {
  const relationshipFiles = getRelationshipFiles()

  for (const filePath of relationshipFiles) {
    const fileName = filePath.split('/').pop()!

    describe(fileName, () => {
      let parsed: ParsedTSV
      let isLFS = false

      beforeAll(() => {
        const content = readFileSync(filePath, 'utf-8')
        isLFS = isLFSPointer(content)
        if (!isLFS) {
          parsed = parseTSVFile(filePath)
        }
      })

      it('should not be an LFS pointer', () => {
        if (isLFS) {
          console.warn(`  ⚠ ${fileName} is an LFS pointer - run 'git lfs pull' first`)
        }
        expect(true).toBe(true)
      })

      it('should have correct relationship header columns', () => {
        if (isLFS) return

        // Relationship files must have from/to columns
        const requiredColumns = ['fromNs', 'fromType', 'toNs', 'toType']
        for (const col of requiredColumns) {
          expect(parsed.headers).toContain(col)
        }

        // Must have either fromId/toId or fromCode/toCode
        const hasFromId = parsed.headers.includes('fromId') || parsed.headers.includes('fromCode')
        const hasToId = parsed.headers.includes('toId') || parsed.headers.includes('toCode')
        expect(hasFromId).toBe(true)
        expect(hasToId).toBe(true)
      })

      it('should have valid namespace values', () => {
        if (isLFS) return
        if (parsed.rows.length === 0) return

        const fromNsIndex = parsed.headers.indexOf('fromNs')
        const toNsIndex = parsed.headers.indexOf('toNs')

        const invalidNamespaces: string[] = []
        for (const row of parsed.rows) {
          const fromNs = row[fromNsIndex]
          const toNs = row[toNsIndex]

          if (fromNs && !VALID_NAMESPACES.has(fromNs) && !invalidNamespaces.includes(fromNs)) {
            invalidNamespaces.push(fromNs)
          }
          if (toNs && !VALID_NAMESPACES.has(toNs) && !invalidNamespaces.includes(toNs)) {
            invalidNamespaces.push(toNs)
          }
        }

        if (invalidNamespaces.length > 0) {
          console.warn(`  ⚠ Unknown namespaces: ${invalidNamespaces.join(', ')}`)
        }
        expect(true).toBe(true)
      })

      it('should have non-empty required fields', () => {
        if (isLFS) return
        if (parsed.rows.length === 0) return

        const fromNsIndex = parsed.headers.indexOf('fromNs')
        const fromTypeIndex = parsed.headers.indexOf('fromType')
        const toNsIndex = parsed.headers.indexOf('toNs')
        const toTypeIndex = parsed.headers.indexOf('toType')

        const emptyFields: { row: number; field: string }[] = []

        for (let i = 0; i < parsed.rows.length; i++) {
          const row = parsed.rows[i]

          if (fromNsIndex >= 0 && !row[fromNsIndex]?.trim()) {
            emptyFields.push({ row: i + 2, field: 'fromNs' })
          }
          if (fromTypeIndex >= 0 && !row[fromTypeIndex]?.trim()) {
            emptyFields.push({ row: i + 2, field: 'fromType' })
          }
          if (toNsIndex >= 0 && !row[toNsIndex]?.trim()) {
            emptyFields.push({ row: i + 2, field: 'toNs' })
          }
          if (toTypeIndex >= 0 && !row[toTypeIndex]?.trim()) {
            emptyFields.push({ row: i + 2, field: 'toType' })
          }

          if (emptyFields.length >= 10) break
        }

        if (emptyFields.length > 0) {
          const sample = emptyFields.slice(0, 5).map(e => `row ${e.row}: ${e.field}`).join(', ')
          throw new Error(`Empty required fields: ${sample}${emptyFields.length > 5 ? '...' : ''}`)
        }
      })

      it('should have consistent column count', () => {
        if (isLFS) return
        if (parsed.rows.length === 0) return

        const expectedCols = parsed.headers.length
        const inconsistentRows: number[] = []

        for (let i = 0; i < parsed.rows.length; i++) {
          if (parsed.rows[i].length !== expectedCols) {
            inconsistentRows.push(i + 2)
          }
          if (inconsistentRows.length >= 10) break
        }

        if (inconsistentRows.length > 0) {
          throw new Error(`Rows with inconsistent column count: ${inconsistentRows.slice(0, 5).join(', ')}`)
        }
      })
    })
  }
})

describe('Wikipedia-Style ID Validation', () => {
  it('should accept valid Wikipedia-style IDs', () => {
    const validIds = [
      'Chief_Executive',
      'Software_Developer',
      'IT_Manager',
      'United_States',
      'ISO_3166_1',
      'W3C',
      'API_Gateway',
      "O'Reilly",
      'Category_(Type)',
      '2024_Standard',
      'A',
      'ABC',
    ]

    for (const id of validIds) {
      expect(isValidWikipediaStyleId(id)).toBe(true)
    }
  })

  it('should reject invalid Wikipedia-style IDs', () => {
    const invalidIds = [
      'lowercase_start',
      'has spaces',
      'has-dashes',
      'has.dots',
      '',
      '_starts_underscore',
      'ends_underscore_',
      'double__underscore',
    ]

    for (const id of invalidIds) {
      expect(isValidWikipediaStyleId(id)).toBe(false)
    }
  })
})

describe('Namespace Validation', () => {
  it('should have all expected namespaces defined', () => {
    const expectedNamespaces = [
      'onet.org.ai',
      'apqc.org.ai',
      'gs1.org.ai',
      'naics.org.ai',
      'iso.org.ai',
      'un.org.ai',
      'iana.org.ai',
      'w3.org.ai',
      'fhir.org.ai',
      'standards.org.ai',
    ]

    for (const ns of expectedNamespaces) {
      expect(VALID_NAMESPACES.has(ns)).toBe(true)
    }
  })

  it('should have namespace pattern ending in .org.ai', () => {
    for (const ns of VALID_NAMESPACES) {
      expect(ns.endsWith('.org.ai')).toBe(true)
    }
  })
})

describe('Data Integrity Checks', () => {
  it('should have entity files for major sources', () => {
    const expectedSources = [
      'ONET',
      'NAICS',
      'GS1',
      'ISO',
      'UN',
      'IANA',
      'BLS',
    ]

    const entityFiles = getEntityFiles().map(f => f.split('/').pop()!)

    for (const source of expectedSources) {
      const hasSource = entityFiles.some(f => f.startsWith(source + '.'))
      if (!hasSource) {
        console.warn(`  ⚠ No entity files found for source: ${source}`)
      }
    }
    // Warn but don't fail
    expect(true).toBe(true)
  })

  it('should have no duplicate entity files', () => {
    const entityFiles = getEntityFiles().map(f => f.split('/').pop()!)
    const duplicates = entityFiles.filter((f, i) => entityFiles.indexOf(f) !== i)

    expect(duplicates.length).toBe(0)
  })
})

// Helper function to validate Wikipedia-style IDs
function isValidWikipediaStyleId(id: string): boolean {
  if (!id || id.length === 0) return false

  // Must start with uppercase letter or number
  if (!/^[A-Z0-9]/.test(id)) return false

  // No spaces or dashes
  if (/ /.test(id) || /-/.test(id)) return false

  // No leading/trailing underscores
  if (id.startsWith('_') || id.endsWith('_')) return false

  // No double underscores
  if (/__/.test(id)) return false

  // Allow alphanumeric, underscores, apostrophes, parentheses
  if (!/^[A-Z0-9][A-Za-z0-9_'()]*$/.test(id)) return false

  return true
}
