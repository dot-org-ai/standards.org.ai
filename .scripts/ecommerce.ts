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

// Add namespaces for e-commerce standards
const ECLASS_NS = 'eclass.org.ai'
const ETIM_NS = 'etim.org.ai'
const SCHEMA_NS = 'schema.org.ai'

const SOURCE_DIR = getSourcePath('Ecommerce')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// eCl@ss Interfaces
interface EclassRow {
  segmentCode?: string
  segmentName?: string
  segmentDescription?: string
  mainGroupCode?: string
  mainGroupName?: string
  mainGroupDescription?: string
  groupCode?: string
  groupName?: string
  groupDescription?: string
  subGroupCode?: string
  subGroupName?: string
  subGroupDescription?: string
  classCode?: string
  className?: string
  classDescription?: string
  propertyCode?: string
  propertyName?: string
  propertyDescription?: string
  propertyDataType?: string
  propertyUnit?: string
  valueCode?: string
  valueName?: string
  valueDescription?: string
  version?: string
}

// ETIM Interfaces
interface EtimClassRow {
  classCode: string
  className: string
  classDescription: string
  groupCode?: string
  groupName?: string
  version?: string
}

interface EtimFeatureRow {
  featureCode: string
  featureName: string
  featureDescription: string
  featureType?: string
  unit?: string
  version?: string
}

interface EtimValueRow {
  valueCode: string
  valueName: string
  valueDescription: string
  featureCode: string
  sortOrder?: number
  version?: string
}

interface EtimUnitRow {
  unitCode: string
  unitName: string
  unitDescription: string
  symbol?: string
  unitType?: string
  siUnit?: boolean
  version?: string
}

// Schema.org Interfaces
interface SchemaTypeRow {
  id: string
  name: string
  description: string
  parents?: string
  layer?: string
  version?: string
}

interface SchemaPropertyRow {
  id: string
  name: string
  description: string
  domainIncludes?: string
  rangeIncludes?: string
  inverseOf?: string
  subPropertyOf?: string
  version?: string
}

interface SchemaEnumerationRow {
  id: string
  name: string
  description: string
  parents?: string
  version?: string
}

interface SchemaEnumerationMemberRow {
  id: string
  name: string
  description: string
  enumeration: string
  version?: string
}

/**
 * Transform eCl@ss classification data
 */
function transformEclass(): void {
  console.log('Transforming eCl@ss data...')
  const sourceFile = join(SOURCE_DIR, 'ECLASS', 'eclass.tsv')

  if (!existsSync(sourceFile)) {
    console.log('eclass.tsv not found, skipping...')
    return
  }

  try {
    const data = parseTSV<EclassRow>(sourceFile)

    // Extract unique entities at each level
    const segmentsMap = new Map<string, EclassRow>()
    const mainGroupsMap = new Map<string, EclassRow>()
    const groupsMap = new Map<string, EclassRow>()
    const subGroupsMap = new Map<string, EclassRow>()
    const classesMap = new Map<string, EclassRow>()
    const propertiesMap = new Map<string, EclassRow>()
    const valuesMap = new Map<string, EclassRow>()

    for (const row of data) {
      if (row.segmentCode && !segmentsMap.has(row.segmentCode)) {
        segmentsMap.set(row.segmentCode, row)
      }
      if (row.mainGroupCode && !mainGroupsMap.has(row.mainGroupCode)) {
        mainGroupsMap.set(row.mainGroupCode, row)
      }
      if (row.groupCode && !groupsMap.has(row.groupCode)) {
        groupsMap.set(row.groupCode, row)
      }
      if (row.subGroupCode && !subGroupsMap.has(row.subGroupCode)) {
        subGroupsMap.set(row.subGroupCode, row)
      }
      if (row.classCode && !classesMap.has(row.classCode)) {
        classesMap.set(row.classCode, row)
      }
      if (row.propertyCode && !propertiesMap.has(row.propertyCode)) {
        propertiesMap.set(row.propertyCode, row)
      }
      if (row.valueCode && !valuesMap.has(row.valueCode)) {
        valuesMap.set(row.valueCode, row)
      }
    }

    // Write Segments
    if (segmentsMap.size > 0) {
      const records: StandardRecord[] = Array.from(segmentsMap.values()).map(row => ({
        ns: ECLASS_NS,
        type: 'Segment',
        id: toWikipediaStyleId(row.segmentName || ''),
        name: row.segmentName || '',
        description: cleanDescription(row.segmentDescription),
        code: row.segmentCode || '',
      }))
      writeStandardTSV(join(DATA_DIR, 'ECLASS.Segments.tsv'), records)
    }

    // Write Main Groups
    if (mainGroupsMap.size > 0) {
      const records: StandardRecord[] = Array.from(mainGroupsMap.values()).map(row => ({
        ns: ECLASS_NS,
        type: 'MainGroup',
        id: toWikipediaStyleId(row.mainGroupName || ''),
        name: row.mainGroupName || '',
        description: cleanDescription(row.mainGroupDescription),
        code: row.mainGroupCode || '',
      }))
      writeStandardTSV(join(DATA_DIR, 'ECLASS.MainGroups.tsv'), records)
    }

    // Write Groups
    if (groupsMap.size > 0) {
      const records: StandardRecord[] = Array.from(groupsMap.values()).map(row => ({
        ns: ECLASS_NS,
        type: 'Group',
        id: toWikipediaStyleId(row.groupName || ''),
        name: row.groupName || '',
        description: cleanDescription(row.groupDescription),
        code: row.groupCode || '',
      }))
      writeStandardTSV(join(DATA_DIR, 'ECLASS.Groups.tsv'), records)
    }

    // Write Sub-Groups
    if (subGroupsMap.size > 0) {
      const records: StandardRecord[] = Array.from(subGroupsMap.values()).map(row => ({
        ns: ECLASS_NS,
        type: 'SubGroup',
        id: toWikipediaStyleId(row.subGroupName || ''),
        name: row.subGroupName || '',
        description: cleanDescription(row.subGroupDescription),
        code: row.subGroupCode || '',
      }))
      writeStandardTSV(join(DATA_DIR, 'ECLASS.SubGroups.tsv'), records)
    }

    // Write Classes
    if (classesMap.size > 0) {
      const records: StandardRecord[] = Array.from(classesMap.values()).map(row => ({
        ns: ECLASS_NS,
        type: 'Class',
        id: toWikipediaStyleId(row.className || ''),
        name: row.className || '',
        description: cleanDescription(row.classDescription),
        code: row.classCode || '',
      }))
      writeStandardTSV(join(DATA_DIR, 'ECLASS.Classes.tsv'), records)
    }

    // Write Properties
    if (propertiesMap.size > 0) {
      const records: StandardRecord[] = Array.from(propertiesMap.values()).map(row => ({
        ns: ECLASS_NS,
        type: 'Property',
        id: toWikipediaStyleId(row.propertyName || ''),
        name: row.propertyName || '',
        description: cleanDescription(row.propertyDescription),
        code: row.propertyCode || '',
      }))
      writeStandardTSV(join(DATA_DIR, 'ECLASS.Properties.tsv'), records)
    }

    // Write Values
    if (valuesMap.size > 0) {
      const records: StandardRecord[] = Array.from(valuesMap.values()).map(row => ({
        ns: ECLASS_NS,
        type: 'Value',
        id: toWikipediaStyleId(row.valueName || ''),
        name: row.valueName || '',
        description: cleanDescription(row.valueDescription),
        code: row.valueCode || '',
      }))
      writeStandardTSV(join(DATA_DIR, 'ECLASS.Values.tsv'), records)
    }

    // Write hierarchy relationships
    const hierarchyRels: Record<string, string>[] = []

    // MainGroup -> Segment
    for (const row of mainGroupsMap.values()) {
      if (row.segmentCode && row.mainGroupCode) {
        hierarchyRels.push({
          fromNs: ECLASS_NS,
          fromType: 'MainGroup',
          fromCode: row.mainGroupCode,
          toNs: ECLASS_NS,
          toType: 'Segment',
          toCode: row.segmentCode,
          relationshipType: 'child_of',
        })
      }
    }

    // Group -> MainGroup
    for (const row of groupsMap.values()) {
      if (row.mainGroupCode && row.groupCode) {
        hierarchyRels.push({
          fromNs: ECLASS_NS,
          fromType: 'Group',
          fromCode: row.groupCode,
          toNs: ECLASS_NS,
          toType: 'MainGroup',
          toCode: row.mainGroupCode,
          relationshipType: 'child_of',
        })
      }
    }

    // SubGroup -> Group
    for (const row of subGroupsMap.values()) {
      if (row.groupCode && row.subGroupCode) {
        hierarchyRels.push({
          fromNs: ECLASS_NS,
          fromType: 'SubGroup',
          fromCode: row.subGroupCode,
          toNs: ECLASS_NS,
          toType: 'Group',
          toCode: row.groupCode,
          relationshipType: 'child_of',
        })
      }
    }

    // Class -> SubGroup
    for (const row of classesMap.values()) {
      if (row.subGroupCode && row.classCode) {
        hierarchyRels.push({
          fromNs: ECLASS_NS,
          fromType: 'Class',
          fromCode: row.classCode,
          toNs: ECLASS_NS,
          toType: 'SubGroup',
          toCode: row.subGroupCode,
          relationshipType: 'child_of',
        })
      }
    }

    if (hierarchyRels.length > 0) {
      writeTSV(
        join(REL_DIR, 'ECLASS.Hierarchy.tsv'),
        hierarchyRels,
        ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
      )
    }

    // Write Class-Property relationships
    const classPropertyRels: Record<string, string>[] = []
    const seenClassProp = new Set<string>()

    for (const row of data) {
      if (row.classCode && row.propertyCode) {
        const key = `${row.classCode}-${row.propertyCode}`
        if (!seenClassProp.has(key)) {
          seenClassProp.add(key)
          classPropertyRels.push({
            fromNs: ECLASS_NS,
            fromType: 'Class',
            fromCode: row.classCode,
            toNs: ECLASS_NS,
            toType: 'Property',
            toCode: row.propertyCode,
            relationshipType: 'has_property',
          })
        }
      }
    }

    if (classPropertyRels.length > 0) {
      writeTSV(
        join(REL_DIR, 'ECLASS.Class.Property.tsv'),
        classPropertyRels,
        ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
      )
    }

    // Write Property-Value relationships
    const propertyValueRels: Record<string, string>[] = []
    const seenPropValue = new Set<string>()

    for (const row of data) {
      if (row.propertyCode && row.valueCode) {
        const key = `${row.propertyCode}-${row.valueCode}`
        if (!seenPropValue.has(key)) {
          seenPropValue.add(key)
          propertyValueRels.push({
            fromNs: ECLASS_NS,
            fromType: 'Property',
            fromCode: row.propertyCode,
            toNs: ECLASS_NS,
            toType: 'Value',
            toCode: row.valueCode,
            relationshipType: 'has_value',
          })
        }
      }
    }

    if (propertyValueRels.length > 0) {
      writeTSV(
        join(REL_DIR, 'ECLASS.Property.Value.tsv'),
        propertyValueRels,
        ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
      )
    }

    console.log('eCl@ss transformation complete')
  } catch (e) {
    console.log('Error processing eCl@ss data:', e)
  }
}

/**
 * Transform ETIM classification data
 */
function transformEtim(): void {
  console.log('Transforming ETIM data...')
  const classFile = join(SOURCE_DIR, 'ETIM', 'etim.classes.tsv')

  if (!existsSync(classFile)) {
    console.log('etim.classes.tsv not found, skipping...')
    return
  }

  try {
    // Transform Classes
    const classes = parseTSV<EtimClassRow>(classFile)
    const classRecords: StandardRecord[] = classes
      .filter(row => row.classCode)
      .map(row => ({
        ns: ETIM_NS,
        type: 'Class',
        id: toWikipediaStyleId(row.className),
        name: row.className,
        description: cleanDescription(row.classDescription),
        code: row.classCode,
      }))

    if (classRecords.length > 0) {
      writeStandardTSV(join(DATA_DIR, 'ETIM.Classes.tsv'), classRecords)
    }

    // Transform Features
    const featureFile = join(SOURCE_DIR, 'ETIM', 'etim.features.tsv')
    if (existsSync(featureFile)) {
      const features = parseTSV<EtimFeatureRow>(featureFile)
      const featureRecords: StandardRecord[] = features
        .filter(row => row.featureCode)
        .map(row => ({
          ns: ETIM_NS,
          type: 'Feature',
          id: toWikipediaStyleId(row.featureName),
          name: row.featureName,
          description: cleanDescription(row.featureDescription),
          code: row.featureCode,
        }))

      if (featureRecords.length > 0) {
        writeStandardTSV(join(DATA_DIR, 'ETIM.Features.tsv'), featureRecords)
      }
    }

    // Transform Values
    const valueFile = join(SOURCE_DIR, 'ETIM', 'etim.values.tsv')
    if (existsSync(valueFile)) {
      const values = parseTSV<EtimValueRow>(valueFile)
      const valueRecords: StandardRecord[] = values
        .filter(row => row.valueCode)
        .map(row => ({
          ns: ETIM_NS,
          type: 'Value',
          id: toWikipediaStyleId(row.valueName),
          name: row.valueName,
          description: cleanDescription(row.valueDescription),
          code: row.valueCode,
        }))

      if (valueRecords.length > 0) {
        writeStandardTSV(join(DATA_DIR, 'ETIM.Values.tsv'), valueRecords)
      }

      // Write Feature-Value relationships
      const featureValueRels: Record<string, string>[] = values
        .filter(row => row.featureCode && row.valueCode)
        .map(row => ({
          fromNs: ETIM_NS,
          fromType: 'Feature',
          fromCode: row.featureCode,
          toNs: ETIM_NS,
          toType: 'Value',
          toCode: row.valueCode,
          relationshipType: 'has_value',
        }))

      if (featureValueRels.length > 0) {
        writeTSV(
          join(REL_DIR, 'ETIM.Feature.Value.tsv'),
          featureValueRels,
          ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
        )
      }
    }

    // Transform Units
    const unitFile = join(SOURCE_DIR, 'ETIM', 'etim.units.tsv')
    if (existsSync(unitFile)) {
      const units = parseTSV<EtimUnitRow>(unitFile)
      const unitRecords: StandardRecord[] = units
        .filter(row => row.unitCode)
        .map(row => ({
          ns: ETIM_NS,
          type: 'Unit',
          id: toWikipediaStyleId(row.unitName),
          name: row.unitName,
          description: cleanDescription(row.unitDescription),
          code: row.unitCode,
        }))

      if (unitRecords.length > 0) {
        writeStandardTSV(join(DATA_DIR, 'ETIM.Units.tsv'), unitRecords)
      }
    }

    console.log('ETIM transformation complete')
  } catch (e) {
    console.log('Error processing ETIM data:', e)
  }
}

/**
 * Transform Schema.org data
 */
function transformSchemaOrg(): void {
  console.log('Transforming Schema.org data...')
  const typeFile = join(SOURCE_DIR, 'SchemaOrg', 'schema.types.tsv')

  if (!existsSync(typeFile)) {
    console.log('schema.types.tsv not found, skipping...')
    return
  }

  try {
    // Transform Types
    const types = parseTSV<SchemaTypeRow>(typeFile)
    const typeRecords: StandardRecord[] = types
      .filter(row => row.id)
      .map(row => ({
        ns: SCHEMA_NS,
        type: 'Type',
        id: row.id,
        name: row.name,
        description: cleanDescription(row.description),
        code: row.id,
      }))

    if (typeRecords.length > 0) {
      writeStandardTSV(join(DATA_DIR, 'SchemaOrg.Types.tsv'), typeRecords)
    }

    // Write type hierarchy relationships
    const typeHierarchyRels: Record<string, string>[] = []
    for (const row of types) {
      if (row.parents && row.id) {
        const parents = row.parents.split(',').map(p => p.trim())
        for (const parent of parents) {
          if (parent) {
            typeHierarchyRels.push({
              fromNs: SCHEMA_NS,
              fromType: 'Type',
              fromCode: row.id,
              toNs: SCHEMA_NS,
              toType: 'Type',
              toCode: parent,
              relationshipType: 'subtype_of',
            })
          }
        }
      }
    }

    if (typeHierarchyRels.length > 0) {
      writeTSV(
        join(REL_DIR, 'SchemaOrg.Type.Type.tsv'),
        typeHierarchyRels,
        ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
      )
    }

    // Transform Properties
    const propertyFile = join(SOURCE_DIR, 'SchemaOrg', 'schema.properties.tsv')
    if (existsSync(propertyFile)) {
      const properties = parseTSV<SchemaPropertyRow>(propertyFile)
      const propertyRecords: StandardRecord[] = properties
        .filter(row => row.id)
        .map(row => ({
          ns: SCHEMA_NS,
          type: 'Property',
          id: row.id,
          name: row.name,
          description: cleanDescription(row.description),
          code: row.id,
        }))

      if (propertyRecords.length > 0) {
        writeStandardTSV(join(DATA_DIR, 'SchemaOrg.Properties.tsv'), propertyRecords)
      }

      // Write Type-Property relationships (domain)
      const typePropRels: Record<string, string>[] = []
      for (const row of properties) {
        if (row.domainIncludes && row.id) {
          const domains = row.domainIncludes.split(',').map(d => d.trim())
          for (const domain of domains) {
            if (domain) {
              typePropRels.push({
                fromNs: SCHEMA_NS,
                fromType: 'Type',
                fromCode: domain,
                toNs: SCHEMA_NS,
                toType: 'Property',
                toCode: row.id,
                relationshipType: 'has_property',
              })
            }
          }
        }
      }

      if (typePropRels.length > 0) {
        writeTSV(
          join(REL_DIR, 'SchemaOrg.Type.Property.tsv'),
          typePropRels,
          ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
        )
      }
    }

    // Transform Enumerations
    const enumFile = join(SOURCE_DIR, 'SchemaOrg', 'schema.enumerations.tsv')
    if (existsSync(enumFile)) {
      const enumerations = parseTSV<SchemaEnumerationRow>(enumFile)
      const enumRecords: StandardRecord[] = enumerations
        .filter(row => row.id)
        .map(row => ({
          ns: SCHEMA_NS,
          type: 'Enumeration',
          id: row.id,
          name: row.name,
          description: cleanDescription(row.description),
          code: row.id,
        }))

      if (enumRecords.length > 0) {
        writeStandardTSV(join(DATA_DIR, 'SchemaOrg.Enumerations.tsv'), enumRecords)
      }
    }

    // Transform Enumeration Members
    const memberFile = join(SOURCE_DIR, 'SchemaOrg', 'schema.enumeration_members.tsv')
    if (existsSync(memberFile)) {
      const members = parseTSV<SchemaEnumerationMemberRow>(memberFile)
      const memberRecords: StandardRecord[] = members
        .filter(row => row.id)
        .map(row => ({
          ns: SCHEMA_NS,
          type: 'EnumerationMember',
          id: row.id,
          name: row.name,
          description: cleanDescription(row.description),
          code: row.id,
        }))

      if (memberRecords.length > 0) {
        writeStandardTSV(join(DATA_DIR, 'SchemaOrg.EnumerationMembers.tsv'), memberRecords)
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
          join(REL_DIR, 'SchemaOrg.Enumeration.Member.tsv'),
          enumMemberRels,
          ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
        )
      }
    }

    console.log('Schema.org transformation complete')
  } catch (e) {
    console.log('Error processing Schema.org data:', e)
  }
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
