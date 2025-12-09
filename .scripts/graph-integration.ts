/**
 * Universal Graph Integration Script
 * Creates graph.org.ai - the universal entry point for all standards data
 *
 * This script:
 * 1. Combines all canonical and superset data into a unified graph
 * 2. Creates routing metadata for type → domain resolution
 * 3. Generates master index files for fast lookups
 */

import { join } from 'path'
import { readdirSync, existsSync } from 'fs'
import {
  parseTSV,
  writeTSV,
  writeStandardTSV,
  getDataPath,
  ensureOutputDirs,
  type StandardRecord,
} from './utils'

const DATA_DIR = getDataPath()
const GRAPH_NS = 'graph.org.ai'

interface GraphRecord extends StandardRecord {
  canonicalUrl: string
  supersetUrl?: string
}

interface TypeIndex {
  type: string
  canonicalDomain: string
  supersetDomain?: string
  count: number
  aggregations: string[]
}

interface DomainIndex {
  domain: string
  types: string[]
  recordCount: number
  isCanonical: boolean
  isSuperset: boolean
  isAggregation: boolean
}

/**
 * Parse .ns-types.tsv to get type-to-domain mappings
 */
function loadTypeConfig(): Map<string, { canonical: string; superset?: string; aggregations: string[] }> {
  const configFile = join(process.cwd(), '.ns-types.tsv')
  if (!existsSync(configFile)) {
    console.log('Warning: .ns-types.tsv not found')
    return new Map()
  }

  const typeConfig = new Map<string, { canonical: string; superset?: string; aggregations: string[] }>()

  interface TypeConfigRow {
    type: string
    canonical_domain: string
    superset_domain: string
    aggregation_domains: string
  }

  const data = parseTSV<TypeConfigRow>(configFile)
  for (const row of data) {
    if (row.type && !row.type.startsWith('#')) {
      typeConfig.set(row.type, {
        canonical: row.canonical_domain || '',
        superset: row.superset_domain && row.superset_domain !== '-' ? row.superset_domain : undefined,
        aggregations: row.aggregation_domains ? row.aggregation_domains.split('|') : [],
      })
    }
  }

  return typeConfig
}

/**
 * Load all data files from .data directory
 */
function loadAllData(): StandardRecord[] {
  const allRecords: StandardRecord[] = []

  const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.tsv') && !f.startsWith('Graph.'))

  for (const file of files) {
    try {
      const records = parseTSV<StandardRecord>(join(DATA_DIR, file))
      allRecords.push(...records)
      console.log(`Loaded ${records.length} records from ${file}`)
    } catch (e) {
      console.log(`Error loading ${file}:`, e)
    }
  }

  return allRecords
}

/**
 * Build type index - summary of all types and their domains
 */
function buildTypeIndex(records: StandardRecord[], typeConfig: Map<string, { canonical: string; superset?: string; aggregations: string[] }>): TypeIndex[] {
  const typeStats = new Map<string, { count: number; domains: Set<string> }>()

  for (const record of records) {
    const key = record.type
    if (!typeStats.has(key)) {
      typeStats.set(key, { count: 0, domains: new Set() })
    }
    const stat = typeStats.get(key)!
    stat.count++
    stat.domains.add(record.ns)
  }

  const typeIndex: TypeIndex[] = []
  for (const [type, stat] of typeStats) {
    const config = typeConfig.get(type)
    typeIndex.push({
      type,
      canonicalDomain: config?.canonical || Array.from(stat.domains)[0] || '',
      supersetDomain: config?.superset,
      count: stat.count,
      aggregations: config?.aggregations || [],
    })
  }

  return typeIndex.sort((a, b) => b.count - a.count)
}

/**
 * Build domain index - summary of all domains and their content
 */
function buildDomainIndex(records: StandardRecord[]): DomainIndex[] {
  const domainStats = new Map<string, { types: Set<string>; count: number }>()

  for (const record of records) {
    if (!domainStats.has(record.ns)) {
      domainStats.set(record.ns, { types: new Set(), count: 0 })
    }
    const stat = domainStats.get(record.ns)!
    stat.types.add(record.type)
    stat.count++
  }

  // Determine domain classification
  const supersetDomains = new Set(['process.org.ai', 'industries.org.ai', 'occupations.org.ai', 'products.org.ai', 'services.org.ai', 'skills.org.ai', 'tasks.org.ai'])
  const aggregationDomains = new Set(['business.org.ai', 'manufacturing.org.ai', 'healthcare.org.ai', 'finance.org.ai', 'retail.org.ai', 'tech.org.ai', 'logistics.org.ai', 'education.org.ai'])

  const domainIndex: DomainIndex[] = []
  for (const [domain, stat] of domainStats) {
    domainIndex.push({
      domain,
      types: Array.from(stat.types).sort(),
      recordCount: stat.count,
      isCanonical: !supersetDomains.has(domain) && !aggregationDomains.has(domain),
      isSuperset: supersetDomains.has(domain),
      isAggregation: aggregationDomains.has(domain),
    })
  }

  return domainIndex.sort((a, b) => b.recordCount - a.recordCount)
}

/**
 * Create unified graph records with canonical URLs
 */
function createGraphRecords(records: StandardRecord[], typeConfig: Map<string, { canonical: string; superset?: string; aggregations: string[] }>): GraphRecord[] {
  return records.map(record => {
    const config = typeConfig.get(record.type)
    const canonicalDomain = config?.canonical || record.ns

    return {
      ...record,
      canonicalUrl: `https://${canonicalDomain}/${record.type}/${record.id}`,
      supersetUrl: config?.superset ? `https://${config.superset}/${record.type}/${record.id}` : undefined,
    }
  })
}

/**
 * Generate routing configuration for graph.org.ai
 */
function generateRoutingConfig(typeIndex: TypeIndex[]): Record<string, string>[] {
  return typeIndex.map(t => ({
    type: t.type,
    canonicalDomain: t.canonicalDomain,
    supersetDomain: t.supersetDomain || '',
    pattern: `graph.org.ai/${t.type}/:id`,
    canonicalRoute: `${t.canonicalDomain}/${t.type}/:id`,
    supersetRoute: t.supersetDomain ? `${t.supersetDomain}/${t.type}/:id` : '',
  }))
}

export async function buildUniversalGraph(): Promise<void> {
  console.log('=== Universal Graph Integration (graph.org.ai) ===')
  ensureOutputDirs()

  // Load configuration
  const typeConfig = loadTypeConfig()
  console.log(`Loaded ${typeConfig.size} type configurations`)

  // Load all data
  const allRecords = loadAllData()
  console.log(`\nTotal records loaded: ${allRecords.length}`)

  // Build indexes
  const typeIndex = buildTypeIndex(allRecords, typeConfig)
  const domainIndex = buildDomainIndex(allRecords)

  // Write type index
  writeTSV(
    join(DATA_DIR, 'Graph.Types.tsv'),
    typeIndex.map(t => ({
      type: t.type,
      canonicalDomain: t.canonicalDomain,
      supersetDomain: t.supersetDomain || '',
      count: String(t.count),
      aggregations: t.aggregations.join('|'),
    })),
    ['type', 'canonicalDomain', 'supersetDomain', 'count', 'aggregations']
  )
  console.log(`\nWrote ${typeIndex.length} type index entries`)

  // Write domain index
  writeTSV(
    join(DATA_DIR, 'Graph.Domains.tsv'),
    domainIndex.map(d => ({
      domain: d.domain,
      types: d.types.join('|'),
      recordCount: String(d.recordCount),
      isCanonical: String(d.isCanonical),
      isSuperset: String(d.isSuperset),
      isAggregation: String(d.isAggregation),
    })),
    ['domain', 'types', 'recordCount', 'isCanonical', 'isSuperset', 'isAggregation']
  )
  console.log(`Wrote ${domainIndex.length} domain index entries`)

  // Write routing configuration
  const routingConfig = generateRoutingConfig(typeIndex)
  writeTSV(
    join(DATA_DIR, 'Graph.Routing.tsv'),
    routingConfig,
    ['type', 'canonicalDomain', 'supersetDomain', 'pattern', 'canonicalRoute', 'supersetRoute']
  )
  console.log(`Wrote ${routingConfig.length} routing configurations`)

  // Summary stats
  console.log('\n=== Graph Summary ===')
  console.log(`Total records: ${allRecords.length.toLocaleString()}`)
  console.log(`Total types: ${typeIndex.length}`)
  console.log(`Total domains: ${domainIndex.length}`)
  console.log(`Canonical domains: ${domainIndex.filter(d => d.isCanonical).length}`)
  console.log(`Superset domains: ${domainIndex.filter(d => d.isSuperset).length}`)

  // Top types by count
  console.log('\nTop 10 types by record count:')
  for (const t of typeIndex.slice(0, 10)) {
    console.log(`  ${t.type}: ${t.count.toLocaleString()} (${t.canonicalDomain})`)
  }

  console.log('\n=== Universal Graph Integration Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  buildUniversalGraph()
}
