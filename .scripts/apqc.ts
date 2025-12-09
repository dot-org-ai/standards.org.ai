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

const NS = NAMESPACES.APQC
const SOURCE_DIR = getSourcePath('APQC')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

interface ProcessData {
  pcfId: string
  hierarchyId: string
  name: string
  elementDescription: string
  industry: string
  metricsAvailable: string
  differenceIndex: string
  changeDetails: string
}

interface MetricData {
  processElementID: string
  hierarchyID: string
  processElement: string
  metricCategory: string
  metricID: string
  metricName: string
  formula: string
  units: string
}

interface GlossaryData {
  processElementID: string
  processElement: string
  definition: string
}

function getProcessLevel(hierarchyId: string): string {
  if (!hierarchyId) return 'Unknown'
  const parts = hierarchyId.split('.')
  const levels = ['Category', 'ProcessGroup', 'Process', 'Activity', 'Task']
  return levels[Math.min(parts.length - 1, levels.length - 1)]
}

function getParentHierarchyId(hierarchyId: string): string | null {
  if (!hierarchyId) return null
  const parts = hierarchyId.split('.')
  if (parts.length <= 1) return null
  return parts.slice(0, -1).join('.')
}

function transformProcesses(): void {
  console.log('Transforming APQC Processes...')
  const data = parseTSV<ProcessData>(join(SOURCE_DIR, 'APQC.Processes.tsv'))

  // Create a map for hierarchy lookups
  const hierarchyMap = new Map<string, ProcessData>()
  for (const row of data) {
    hierarchyMap.set(row.hierarchyId, row)
  }

  const records: StandardRecord[] = data.map(row => ({
    ns: NS,
    type: getProcessLevel(row.hierarchyId),
    id: toWikipediaStyleId(row.name),
    name: row.name,
    description: cleanDescription(row.elementDescription),
    code: row.pcfId,
    includedIn: getAggregationsForType('Process'),
  }))

  writeStandardTSV(join(DATA_DIR, 'APQC.Processes.tsv'), records)

  // Write process hierarchy relationships
  const relationships: Record<string, string>[] = []
  for (const row of data) {
    const parentHierarchyId = getParentHierarchyId(row.hierarchyId)
    if (parentHierarchyId) {
      const parent = hierarchyMap.get(parentHierarchyId)
      if (parent) {
        relationships.push({
          fromNs: NS,
          fromType: getProcessLevel(row.hierarchyId),
          fromCode: row.pcfId,
          toNs: NS,
          toType: getProcessLevel(parentHierarchyId),
          toCode: parent.pcfId,
          relationshipType: 'child_of',
          hierarchyId: row.hierarchyId,
        })
      }
    }
  }

  writeTSV(
    join(REL_DIR, 'APQC.Process.Process.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType', 'hierarchyId']
  )
}

function transformIndustries(): void {
  console.log('Transforming APQC Industries...')
  const data = parseTSV<ProcessData>(join(SOURCE_DIR, 'APQC.Processes.tsv'))

  // Get unique industries
  const industriesSet = new Set<string>()
  for (const row of data) {
    if (row.industry && row.industry !== 'cross-industry') {
      industriesSet.add(row.industry)
    }
  }

  const records: StandardRecord[] = [
    // Add cross-industry as a special case
    {
      ns: NS,
      type: 'Industry',
      id: 'Cross_Industry',
      name: 'Cross-Industry',
      description: 'Processes applicable across all industries',
      code: 'cross-industry',
    },
    ...Array.from(industriesSet).map(industry => ({
      ns: NS,
      type: 'Industry',
      id: toWikipediaStyleId(industry),
      name: industry,
      description: `Industry-specific processes for ${industry}`,
      code: industry.toLowerCase().replace(/\s+/g, '-'),
    })),
  ]

  writeStandardTSV(join(DATA_DIR, 'APQC.Industries.tsv'), records)

  // Write process-industry relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.industry)
    .map(row => ({
      fromNs: NS,
      fromType: getProcessLevel(row.hierarchyId),
      fromCode: row.pcfId,
      toNs: NS,
      toType: 'Industry',
      toCode: row.industry.toLowerCase().replace(/\s+/g, '-'),
      relationshipType: 'applicable_to',
    }))

  writeTSV(
    join(REL_DIR, 'APQC.Process.Industry.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

function transformMetrics(): void {
  console.log('Transforming APQC Metrics...')
  const data = parseTSV<MetricData>(join(SOURCE_DIR, 'APQC.Metrics.tsv'))

  // Get unique metrics
  const metricsMap = new Map<string, MetricData>()
  for (const row of data) {
    if (row.metricID && !metricsMap.has(row.metricID)) {
      metricsMap.set(row.metricID, row)
    }
  }

  const records: StandardRecord[] = Array.from(metricsMap.values()).map(m => ({
    ns: NS,
    type: 'Metric',
    id: toWikipediaStyleId(m.metricName),
    name: m.metricName,
    description: `${m.formula ? `Formula: ${m.formula}` : ''} ${m.units ? `Units: ${m.units}` : ''}`.trim(),
    code: m.metricID,
  }))

  writeStandardTSV(join(DATA_DIR, 'APQC.Metrics.tsv'), records)

  // Get unique metric categories
  const categoriesSet = new Set<string>()
  for (const row of data) {
    if (row.metricCategory) {
      categoriesSet.add(row.metricCategory)
    }
  }

  const categoryRecords: StandardRecord[] = Array.from(categoriesSet).map(cat => ({
    ns: NS,
    type: 'MetricCategory',
    id: toWikipediaStyleId(cat),
    name: cat,
    description: '',
    code: cat.toLowerCase().replace(/\s+/g, '-'),
  }))

  writeStandardTSV(join(DATA_DIR, 'APQC.MetricCategories.tsv'), categoryRecords)

  // Write process-metric relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.metricID && row.processElementID)
    .map(row => ({
      fromNs: NS,
      fromType: 'Process',
      fromCode: row.processElementID,
      toNs: NS,
      toType: 'Metric',
      toCode: row.metricID,
      relationshipType: 'measured_by',
      category: row.metricCategory,
    }))

  writeTSV(
    join(REL_DIR, 'APQC.Process.Metric.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType', 'category']
  )
}

function transformGlossary(): void {
  console.log('Transforming APQC Glossary...')
  const data = parseTSV<GlossaryData>(join(SOURCE_DIR, 'APQC.GlossaryTerms.tsv'))

  const records: StandardRecord[] = data
    .filter(row => row.processElement && row.definition)
    .map(row => ({
      ns: NS,
      type: 'GlossaryTerm',
      id: toWikipediaStyleId(row.processElement),
      name: row.processElement,
      description: cleanDescription(row.definition),
      code: row.processElementID || '',
    }))

  writeStandardTSV(join(DATA_DIR, 'APQC.Glossary.tsv'), records)
}

export async function transformAPQC(): Promise<void> {
  console.log('=== APQC Transformation ===')
  ensureOutputDirs()

  transformProcesses()
  transformIndustries()
  transformMetrics()
  transformGlossary()

  console.log('=== APQC Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformAPQC()
}
