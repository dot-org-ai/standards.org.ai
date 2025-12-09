import { join } from 'path'
import {
  NAMESPACES,
  parseTSV,
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

const NS = NAMESPACES.W3C
const SOURCE_DIR = getSourcePath('W3C')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// Interface definitions for source data
interface CSSPropertyRow {
  name: string
  syntax: string
  initial: string
  inherited: string
  animatable: string
  specification: string
}

interface CSSSelectorRow {
  pattern: string
  type: string
  specificity: string
  description: string
}

interface CSSFunctionRow {
  name: string
  parameters: string
  returnType: string
  description: string
}

interface CSSAtRuleRow {
  name: string
  syntax: string
  description: string
}

interface CSSDataTypeRow {
  name: string
  syntax: string
  description: string
}

interface CSSUnitRow {
  name: string
  type: string
  relativeTo: string
  description: string
}

/**
 * Transform CSS Properties
 * Properties define how elements are styled (color, width, etc.)
 */
function transformCSSProperties(): void {
  console.log('Transforming W3C CSS Properties...')
  const data = parseTSV<CSSPropertyRow>(join(SOURCE_DIR, 'W3C.CSS.Properties.tsv'))

  const records: StandardRecord[] = data
    .filter(row => row.name)
    .map(row => ({
      ns: NS,
      type: 'CSSProperty',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: cleanDescription(
        `${row.specification}. Syntax: ${row.syntax}. Initial: ${row.initial}. Inherited: ${row.inherited}. Animatable: ${row.animatable}.`
      ),
      code: row.name,
    }))

  writeStandardTSV(join(DATA_DIR, 'W3C.CSS.Properties.tsv'), records)

  // Create extended property data with additional fields
  const extendedRecords = data
    .filter(row => row.name)
    .map(row => ({
      ns: NS,
      type: 'CSSProperty',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      code: row.name,
      syntax: row.syntax,
      initial: row.initial,
      inherited: row.inherited,
      animatable: row.animatable,
      specification: row.specification,
    }))

  writeTSV(
    join(DATA_DIR, 'W3C.CSS.Properties.Extended.tsv'),
    extendedRecords,
    ['ns', 'type', 'id', 'name', 'code', 'syntax', 'initial', 'inherited', 'animatable', 'specification']
  )
}

/**
 * Transform CSS Selectors
 * Selectors define which elements to style
 */
function transformCSSSelectors(): void {
  console.log('Transforming W3C CSS Selectors...')
  const data = parseTSV<CSSSelectorRow>(join(SOURCE_DIR, 'W3C.CSS.Selectors.tsv'))

  const records: StandardRecord[] = data
    .filter(row => row.pattern)
    .map(row => ({
      ns: NS,
      type: 'CSSSelector',
      id: toWikipediaStyleId(row.type || row.pattern),
      name: row.pattern,
      description: cleanDescription(
        `${row.description || row.type}. Type: ${row.type}. Specificity: ${row.specificity}.`
      ),
      code: row.pattern,
    }))

  writeStandardTSV(join(DATA_DIR, 'W3C.CSS.Selectors.tsv'), records)

  // Create extended selector data
  const extendedRecords = data
    .filter(row => row.pattern)
    .map(row => ({
      ns: NS,
      type: 'CSSSelector',
      id: toWikipediaStyleId(row.type || row.pattern),
      name: row.pattern,
      code: row.pattern,
      selectorType: row.type,
      specificity: row.specificity,
      description: row.description || '',
    }))

  writeTSV(
    join(DATA_DIR, 'W3C.CSS.Selectors.Extended.tsv'),
    extendedRecords,
    ['ns', 'type', 'id', 'name', 'code', 'selectorType', 'specificity', 'description']
  )
}

/**
 * Transform CSS Functions
 * Functions perform calculations and transformations
 */
function transformCSSFunctions(): void {
  console.log('Transforming W3C CSS Functions...')
  const data = parseTSV<CSSFunctionRow>(join(SOURCE_DIR, 'W3C.CSS.Functions.tsv'))

  const records: StandardRecord[] = data
    .filter(row => row.name)
    .map(row => ({
      ns: NS,
      type: 'CSSFunction',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: cleanDescription(
        `${row.description}. Parameters: ${row.parameters}. Returns: ${row.returnType}.`
      ),
      code: row.name,
    }))

  writeStandardTSV(join(DATA_DIR, 'W3C.CSS.Functions.tsv'), records)

  // Create extended function data
  const extendedRecords = data
    .filter(row => row.name)
    .map(row => ({
      ns: NS,
      type: 'CSSFunction',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      code: row.name,
      parameters: row.parameters,
      returnType: row.returnType,
      description: row.description || '',
    }))

  writeTSV(
    join(DATA_DIR, 'W3C.CSS.Functions.Extended.tsv'),
    extendedRecords,
    ['ns', 'type', 'id', 'name', 'code', 'parameters', 'returnType', 'description']
  )
}

/**
 * Transform CSS At-Rules
 * At-rules provide special instructions (media queries, keyframes, etc.)
 */
function transformCSSAtRules(): void {
  console.log('Transforming W3C CSS At-Rules...')
  const data = parseTSV<CSSAtRuleRow>(join(SOURCE_DIR, 'W3C.CSS.AtRules.tsv'))

  const records: StandardRecord[] = data
    .filter(row => row.name)
    .map(row => ({
      ns: NS,
      type: 'CSSAtRule',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: cleanDescription(`${row.description}. Syntax: ${row.syntax}.`),
      code: row.name,
    }))

  writeStandardTSV(join(DATA_DIR, 'W3C.CSS.AtRules.tsv'), records)

  // Create extended at-rule data
  const extendedRecords = data
    .filter(row => row.name)
    .map(row => ({
      ns: NS,
      type: 'CSSAtRule',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      code: row.name,
      syntax: row.syntax,
      description: row.description || '',
    }))

  writeTSV(
    join(DATA_DIR, 'W3C.CSS.AtRules.Extended.tsv'),
    extendedRecords,
    ['ns', 'type', 'id', 'name', 'code', 'syntax', 'description']
  )
}

/**
 * Transform CSS Data Types
 * Data types define value types (length, color, etc.)
 */
function transformCSSDataTypes(): void {
  console.log('Transforming W3C CSS Data Types...')
  const data = parseTSV<CSSDataTypeRow>(join(SOURCE_DIR, 'W3C.CSS.DataTypes.tsv'))

  const records: StandardRecord[] = data
    .filter(row => row.name)
    .map(row => ({
      ns: NS,
      type: 'CSSDataType',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: cleanDescription(`${row.description}. Syntax: ${row.syntax}.`),
      code: row.name,
    }))

  writeStandardTSV(join(DATA_DIR, 'W3C.CSS.DataTypes.tsv'), records)

  // Create extended data type records
  const extendedRecords = data
    .filter(row => row.name)
    .map(row => ({
      ns: NS,
      type: 'CSSDataType',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      code: row.name,
      syntax: row.syntax,
      description: row.description || '',
    }))

  writeTSV(
    join(DATA_DIR, 'W3C.CSS.DataTypes.Extended.tsv'),
    extendedRecords,
    ['ns', 'type', 'id', 'name', 'code', 'syntax', 'description']
  )
}

/**
 * Transform CSS Units
 * Units define measurement types (px, em, %, etc.)
 */
function transformCSSUnits(): void {
  console.log('Transforming W3C CSS Units...')
  const data = parseTSV<CSSUnitRow>(join(SOURCE_DIR, 'W3C.CSS.Units.tsv'))

  const records: StandardRecord[] = data
    .filter(row => row.name)
    .map(row => ({
      ns: NS,
      type: 'CSSUnit',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: cleanDescription(
        `${row.description}. Type: ${row.type}.${row.relativeTo ? ` Relative to: ${row.relativeTo}.` : ''}`
      ),
      code: row.name,
    }))

  writeStandardTSV(join(DATA_DIR, 'W3C.CSS.Units.tsv'), records)

  // Create extended unit data
  const extendedRecords = data
    .filter(row => row.name)
    .map(row => ({
      ns: NS,
      type: 'CSSUnit',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      code: row.name,
      unitType: row.type,
      relativeTo: row.relativeTo || '',
      description: row.description || '',
    }))

  writeTSV(
    join(DATA_DIR, 'W3C.CSS.Units.Extended.tsv'),
    extendedRecords,
    ['ns', 'type', 'id', 'name', 'code', 'unitType', 'relativeTo', 'description']
  )

  // Create relationships: Units to Data Types
  const unitTypeRelationships: Record<string, string>[] = []

  for (const row of data) {
    if (row.name && row.type) {
      let dataType = ''

      // Map unit types to CSS data types
      if (row.type === 'absolute' || row.type === 'relative') {
        dataType = '<length>'
      } else if (row.type === 'angle') {
        dataType = '<angle>'
      } else if (row.type === 'time') {
        dataType = '<time>'
      } else if (row.type === 'frequency') {
        dataType = '<frequency>'
      } else if (row.type === 'resolution') {
        dataType = '<resolution>'
      } else if (row.type === 'grid') {
        dataType = '<flex>'
      }

      if (dataType) {
        unitTypeRelationships.push({
          fromNs: NS,
          fromType: 'CSSUnit',
          fromCode: row.name,
          toNs: NS,
          toType: 'CSSDataType',
          toCode: dataType,
          relationshipType: 'unit_of',
        })
      }
    }
  }

  if (unitTypeRelationships.length > 0) {
    writeTSV(
      join(REL_DIR, 'W3C.CSS.Unit.DataType.tsv'),
      unitTypeRelationships,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
    )
  }
}

/**
 * Create relationships between CSS entities
 */
function createCSSRelationships(): void {
  console.log('Creating CSS relationships...')

  // Properties that accept specific data types
  const propertyDataTypeMap: Record<string, string[]> = {
    'color': ['<color>'],
    'width': ['<length>', '<percentage>'],
    'height': ['<length>', '<percentage>'],
    'margin': ['<length>', '<percentage>'],
    'padding': ['<length>', '<percentage>'],
    'font-size': ['<length>', '<percentage>'],
    'opacity': ['<alpha-value>', '<number>'],
    'z-index': ['<integer>'],
    'transform': ['<angle>'],
    'background-color': ['<color>'],
  }

  const relationships: Record<string, string>[] = []

  for (const [property, dataTypes] of Object.entries(propertyDataTypeMap)) {
    for (const dataType of dataTypes) {
      relationships.push({
        fromNs: NS,
        fromType: 'CSSProperty',
        fromCode: property,
        toNs: NS,
        toType: 'CSSDataType',
        toCode: dataType,
        relationshipType: 'accepts_type',
      })
    }
  }

  if (relationships.length > 0) {
    writeTSV(
      join(REL_DIR, 'W3C.CSS.Property.DataType.tsv'),
      relationships,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
    )
  }
}

/**
 * Main transformation function
 * Orchestrates all CSS data transformations
 */
export async function transformW3CCSS(): Promise<void> {
  console.log('=== W3C CSS Transformation ===')
  ensureOutputDirs()

  transformCSSProperties()
  transformCSSSelectors()
  transformCSSFunctions()
  transformCSSAtRules()
  transformCSSDataTypes()
  transformCSSUnits()
  createCSSRelationships()

  console.log('=== W3C CSS Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformW3CCSS()
}
