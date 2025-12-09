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

// Use NAMESPACES from utils for e-commerce standards
const ECLASS_NS = NAMESPACES.ECLASS
const ETIM_NS = NAMESPACES.ETIM
const SCHEMA_NS = NAMESPACES.SchemaOrg

const SOURCE_DIR = getSourcePath('Ecommerce')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()


/**
 * Transform eCl@ss classification data
 */
function transformEclass(): void {
  console.log('Transforming eCl@ss data...')
  const segmentsFile = join(SOURCE_DIR, 'ECLASS', 'Segments.tsv')
  const structureFile = join(SOURCE_DIR, 'ECLASS', 'Structure.tsv')

  // Transform Segments
  if (existsSync(segmentsFile)) {
    try {
      interface EclassSegmentRow {
        code: string
        name: string
        description: string
      }

      const segments = parseTSV<EclassSegmentRow>(segmentsFile)
      console.log(`Processing ${segments.length} eCl@ss segments...`)

      // Transform Segments
      const segmentRecords: StandardRecord[] = segments
        .filter(row => row.code && row.name)
        .map(row => ({
          ns: ECLASS_NS,
          type: 'Segment',
          id: toWikipediaStyleId(row.name),
          name: row.name,
          description: cleanDescription(row.description),
          code: row.code,
          includedIn: getAggregationsForType('Product'),
        }))

      if (segmentRecords.length > 0) {
        writeStandardTSV(join(DATA_DIR, 'Ecommerce.ECLASS.Segments.tsv'), segmentRecords)
        console.log(`Wrote ${segmentRecords.length} eCl@ss segments`)
      }
    } catch (e) {
      console.log('Error processing eCl@ss segments:', e)
    }
  } else {
    console.log('eCl@ss Segments.tsv not found, skipping...')
  }

  // Transform Structure (hierarchy information)
  if (existsSync(structureFile)) {
    try {
      interface EclassStructureRow {
        level: string
        name: string
        code_format: string
        description: string
        example: string
      }

      const structure = parseTSV<EclassStructureRow>(structureFile)
      console.log(`Processing ${structure.length} eCl@ss structure levels...`)

      const structureRecords: StandardRecord[] = structure
        .filter(row => row.level && row.name)
        .map(row => ({
          ns: ECLASS_NS,
          type: 'StructureLevel',
          id: toWikipediaStyleId(row.name),
          name: row.name,
          description: cleanDescription(row.description),
          code: row.level,
        }))

      if (structureRecords.length > 0) {
        writeStandardTSV(join(DATA_DIR, 'Ecommerce.ECLASS.Structure.tsv'), structureRecords)
        console.log(`Wrote ${structureRecords.length} eCl@ss structure levels`)
      }
    } catch (e) {
      console.log('Error processing eCl@ss structure:', e)
    }
  }

  console.log('eCl@ss transformation complete')
}

/**
 * Transform ETIM classification data
 */
function transformEtim(): void {
  console.log('Transforming ETIM data...')
  const groupsFile = join(SOURCE_DIR, 'ETIM', 'Groups.tsv')
  const classesFile = join(SOURCE_DIR, 'ETIM', 'Classes.tsv')

  // Transform Groups
  if (existsSync(groupsFile)) {
    try {
      interface EtimGroupRow {
        code: string
        name: string
        description: string
      }

      const groups = parseTSV<EtimGroupRow>(groupsFile)
      console.log(`Processing ${groups.length} ETIM groups...`)

      const groupRecords: StandardRecord[] = groups
        .filter(row => row.code)
        .map(row => ({
          ns: ETIM_NS,
          type: 'Group',
          id: toWikipediaStyleId(row.name),
          name: row.name,
          description: cleanDescription(row.description),
          code: row.code,
          includedIn: getAggregationsForType('Product'),
        }))

      if (groupRecords.length > 0) {
        writeStandardTSV(join(DATA_DIR, 'Ecommerce.ETIM.Groups.tsv'), groupRecords)
        console.log(`Wrote ${groupRecords.length} ETIM groups`)
      }
    } catch (e) {
      console.log('Error processing ETIM groups:', e)
    }
  }

  // Transform Classes
  if (existsSync(classesFile)) {
    try {
      interface EtimClassFileRow {
        group: string
        class_code: string
        class_name: string
        description: string
        example_products: string
      }

      const classes = parseTSV<EtimClassFileRow>(classesFile)
      console.log(`Processing ${classes.length} ETIM classes...`)

      const classRecords: StandardRecord[] = classes
        .filter(row => row.class_code)
        .map(row => ({
          ns: ETIM_NS,
          type: 'Class',
          id: toWikipediaStyleId(row.class_name),
          name: row.class_name,
          description: cleanDescription(row.description),
          code: row.class_code,
          includedIn: getAggregationsForType('Product'),
        }))

      if (classRecords.length > 0) {
        writeStandardTSV(join(DATA_DIR, 'Ecommerce.ETIM.Classes.tsv'), classRecords)
        console.log(`Wrote ${classRecords.length} ETIM classes`)
      }

      // Write Class-Group relationships
      const classGroupRels: Record<string, string>[] = classes
        .filter(row => row.class_code && row.group)
        .map(row => ({
          fromNs: ETIM_NS,
          fromType: 'Class',
          fromCode: row.class_code,
          toNs: ETIM_NS,
          toType: 'Group',
          toCode: row.group,
          relationshipType: 'child_of',
        }))

      if (classGroupRels.length > 0) {
        writeTSV(
          join(REL_DIR, 'Ecommerce.ETIM.Class.Group.tsv'),
          classGroupRels,
          ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
        )
        console.log(`Wrote ${classGroupRels.length} ETIM class-group relationships`)
      }
    } catch (e) {
      console.log('Error processing ETIM classes:', e)
    }
  }

  console.log('ETIM transformation complete')
}

/**
 * Transform Schema.org data
 */
function transformSchemaOrg(): void {
  console.log('Transforming Schema.org data...')
  const typesFile = join(SOURCE_DIR, 'SchemaOrg', 'Types.tsv')
  const propertiesFile = join(SOURCE_DIR, 'SchemaOrg', 'Properties.tsv')
  const enumerationsFile = join(SOURCE_DIR, 'SchemaOrg', 'Enumerations.tsv')
  const enumMembersFile = join(SOURCE_DIR, 'SchemaOrg', 'EnumerationMembers.tsv')

  // Transform Types
  if (existsSync(typesFile)) {
    try {
      interface SchemaTypeFileRow {
        id: string
        label: string
        parent: string
        comment: string | { '@language': string; '@value': string }
      }

      const types = parseTSV<SchemaTypeFileRow>(typesFile)
      console.log(`Processing ${types.length} Schema.org types...`)

      const typeRecords: StandardRecord[] = types
        .filter(row => row.id)
        .map(row => {
          // Handle both string and object formats for comment/label
          let name = typeof row.label === 'string' ? row.label : (row.label as any)?.['@value'] || row.id.replace('schema:', '')
          let description = typeof row.comment === 'string'
            ? row.comment
            : (row.comment as any)?.['@value'] || ''

          return {
            ns: SCHEMA_NS,
            type: 'Type',
            id: row.id.replace('schema:', ''),
            name: name,
            description: cleanDescription(description),
            code: row.id.replace('schema:', ''),
            includedIn: getAggregationsForType('Type'),
          }
        })

      if (typeRecords.length > 0) {
        writeStandardTSV(join(DATA_DIR, 'Ecommerce.SchemaOrg.Types.tsv'), typeRecords)
        console.log(`Wrote ${typeRecords.length} Schema.org types`)
      }

      // Write type hierarchy relationships
      const typeHierarchyRels: Record<string, string>[] = types
        .filter(row => row.parent && row.id)
        .map(row => ({
          fromNs: SCHEMA_NS,
          fromType: 'Type',
          fromCode: row.id.replace('schema:', ''),
          toNs: SCHEMA_NS,
          toType: 'Type',
          toCode: row.parent.replace('schema:', ''),
          relationshipType: 'subtype_of',
        }))

      if (typeHierarchyRels.length > 0) {
        writeTSV(
          join(REL_DIR, 'Ecommerce.SchemaOrg.Type.Type.tsv'),
          typeHierarchyRels,
          ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
        )
        console.log(`Wrote ${typeHierarchyRels.length} Schema.org type hierarchy relationships`)
      }
    } catch (e) {
      console.log('Error processing Schema.org types:', e)
    }
  }

  // Transform Properties
  if (existsSync(propertiesFile)) {
    try {
      interface SchemaPropertyFileRow {
        id: string
        label: string
        domain: string
        range: string
        comment: string
      }

      const properties = parseTSV<SchemaPropertyFileRow>(propertiesFile)
      console.log(`Processing ${properties.length} Schema.org properties...`)

      const propertyRecords: StandardRecord[] = properties
        .filter(row => row.id)
        .map(row => ({
          ns: SCHEMA_NS,
          type: 'Property',
          id: row.id.replace('schema:', ''),
          name: row.label || row.id.replace('schema:', ''),
          description: cleanDescription(row.comment),
          code: row.id.replace('schema:', ''),
          includedIn: getAggregationsForType('Property'),
        }))

      if (propertyRecords.length > 0) {
        writeStandardTSV(join(DATA_DIR, 'Ecommerce.SchemaOrg.Properties.tsv'), propertyRecords)
        console.log(`Wrote ${propertyRecords.length} Schema.org properties`)
      }

      // Write Type-Property relationships (domain)
      const typePropRels: Record<string, string>[] = []
      for (const row of properties) {
        if (row.domain && row.id) {
          const domains = row.domain.split(',').map(d => d.trim().replace('schema:', ''))
          for (const domain of domains) {
            if (domain) {
              typePropRels.push({
                fromNs: SCHEMA_NS,
                fromType: 'Type',
                fromCode: domain,
                toNs: SCHEMA_NS,
                toType: 'Property',
                toCode: row.id.replace('schema:', ''),
                relationshipType: 'has_property',
              })
            }
          }
        }
      }

      if (typePropRels.length > 0) {
        writeTSV(
          join(REL_DIR, 'Ecommerce.SchemaOrg.Type.Property.tsv'),
          typePropRels,
          ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
        )
        console.log(`Wrote ${typePropRels.length} Schema.org type-property relationships`)
      }
    } catch (e) {
      console.log('Error processing Schema.org properties:', e)
    }
  }

  // Transform Enumerations
  if (existsSync(enumerationsFile)) {
    try {
      interface SchemaEnumerationFileRow {
        id: string
        label: string
        comment: string
      }

      const enumerations = parseTSV<SchemaEnumerationFileRow>(enumerationsFile)
      console.log(`Processing ${enumerations.length} Schema.org enumerations...`)

      const enumRecords: StandardRecord[] = enumerations
        .filter(row => row.id)
        .map(row => ({
          ns: SCHEMA_NS,
          type: 'Enumeration',
          id: row.id,
          name: row.label || row.id,
          description: cleanDescription(row.comment),
          code: row.id,
        }))

      if (enumRecords.length > 0) {
        writeStandardTSV(join(DATA_DIR, 'Ecommerce.SchemaOrg.Enumerations.tsv'), enumRecords)
        console.log(`Wrote ${enumRecords.length} Schema.org enumerations`)
      }
    } catch (e) {
      console.log('Error processing Schema.org enumerations:', e)
    }
  }

  // Transform Enumeration Members
  if (existsSync(enumMembersFile)) {
    try {
      interface SchemaEnumMemberFileRow {
        enumeration: string
        id: string
        label: string
        comment: string
      }

      const members = parseTSV<SchemaEnumMemberFileRow>(enumMembersFile)
      console.log(`Processing ${members.length} Schema.org enumeration members...`)

      const memberRecords: StandardRecord[] = members
        .filter(row => row.id)
        .map(row => ({
          ns: SCHEMA_NS,
          type: 'EnumerationMember',
          id: row.id,
          name: row.label || row.id,
          description: cleanDescription(row.comment),
          code: row.id,
        }))

      if (memberRecords.length > 0) {
        writeStandardTSV(join(DATA_DIR, 'Ecommerce.SchemaOrg.EnumerationMembers.tsv'), memberRecords)
        console.log(`Wrote ${memberRecords.length} Schema.org enumeration members`)
      }

      // Write Enumeration-Member relationships
      const enumMemberRels: Record<string, string>[] = members
        .filter(row => row.enumeration && row.id)
        .map(row => ({
          fromNs: SCHEMA_NS,
          fromType: 'Enumeration',
          fromCode: row.enumeration,
          toNs: SCHEMA_NS,
          toType: 'EnumerationMember',
          toCode: row.id,
          relationshipType: 'has_member',
        }))

      if (enumMemberRels.length > 0) {
        writeTSV(
          join(REL_DIR, 'Ecommerce.SchemaOrg.Enumeration.Member.tsv'),
          enumMemberRels,
          ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
        )
        console.log(`Wrote ${enumMemberRels.length} Schema.org enumeration-member relationships`)
      }
    } catch (e) {
      console.log('Error processing Schema.org enumeration members:', e)
    }
  }

  console.log('Schema.org transformation complete')
}

/**
 * Main transformation function for all e-commerce standards
 */
export async function transformEcommerce(): Promise<void> {
  console.log('=== E-commerce Standards Transformation ===')
  ensureOutputDirs()

  transformEclass()
  transformEtim()
  transformSchemaOrg()

  console.log('=== E-commerce Standards Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformEcommerce()
}
