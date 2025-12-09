/**
 * Healthcare HL7 FHIR Standards Transformation Script
 * Transforms FHIR R4/R5 data into standard TSV format
 *
 * Data sources:
 * - FHIR R4 Specification: https://www.hl7.org/fhir/R4/
 * - FHIR R5 Specification: https://www.hl7.org/fhir/R5/
 * - FHIR Definitions (JSON): https://hl7.org/fhir/downloads.html
 */

import { join } from 'path'
import {
  NAMESPACES,
  StandardRecord,
  RelationshipRecord,
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
  getAggregationsForType,
} from './utils'

const NS = NAMESPACES.FHIR
const SOURCE_DIR = getSourcePath('Healthcare/FHIR')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// FHIR Resource TSV interface
interface FHIRResourceRow {
  resource_name: string
  category: string
  description: string
}

// FHIR DataType TSV interface
interface FHIRDataTypeRow {
  datatype_name: string
  category: string
  description: string
}

/**
 * Transform FHIR Resources from TSV file
 */
function transformResources(): void {
  console.log('Transforming FHIR Resources...')

  try {
    const data = parseTSV<FHIRResourceRow>(join(SOURCE_DIR, 'resources.tsv'))

    const records: StandardRecord[] = data
      .filter(row => row.resource_name)
      .map(row => ({
        ns: NS,
        type: 'Resource',
        id: toWikipediaStyleId(row.resource_name),
        name: row.resource_name,
        description: cleanDescription(row.description || ''),
        code: row.resource_name,
        includedIn: getAggregationsForType('Resource'),
      }))

    writeStandardTSV(join(DATA_DIR, 'FHIR.Resources.tsv'), records)
    console.log(`  Processed ${records.length} FHIR resources`)
  } catch (e) {
    console.error('Error transforming Resources:', e)
  }
}

/**
 * Transform FHIR Data Types from TSV file
 */
function transformDataTypes(): void {
  console.log('Transforming FHIR Data Types...')

  try {
    const data = parseTSV<FHIRDataTypeRow>(join(SOURCE_DIR, 'datatypes.tsv'))

    const records: StandardRecord[] = data
      .filter(row => row.datatype_name)
      .map(row => ({
        ns: NS,
        type: 'DataType',
        id: toWikipediaStyleId(row.datatype_name),
        name: row.datatype_name,
        description: cleanDescription(row.description || ''),
        code: row.datatype_name,
        includedIn: getAggregationsForType('DataType'),
      }))

    writeStandardTSV(join(DATA_DIR, 'FHIR.DataTypes.tsv'), records)
    console.log(`  Processed ${records.length} FHIR data types`)
  } catch (e) {
    console.error('Error transforming Data Types:', e)
  }
}

/**
 * Main transformation function
 */
export async function transformHealthcareFHIR(): Promise<void> {
  console.log('=== Healthcare HL7 FHIR Standards Transformation ===\n')
  ensureOutputDirs()

  transformResources()
  transformDataTypes()

  console.log('\n=== FHIR Transformation Complete ===')
}

// Run if called directly
if (import.meta.main) {
  transformHealthcareFHIR().catch(console.error)
}
