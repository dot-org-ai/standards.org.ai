#!/usr/bin/env bun

/**
 * Main generation script that transforms all source data into standardized TSV files.
 *
 * Output structure:
 * - .data/[Source].[Type].tsv - Entity data with columns: ns, type, id, name, description, code
 * - .data/relationships/[From].[To].tsv - Relationship data between entities
 *
 * Namespaces:
 * - gs1.org.ai - GS1 product/location standards (GPC, EPCIS, CBV, Digital Link)
 * - onet.org.ai - O*NET occupational data
 * - naics.org.ai - NAICS industry classification
 * - apqc.org.ai - APQC process classification
 * - iso.org.ai - ISO standards (countries, currencies, languages)
 * - un.org.ai - UN standards (LOCODE, M49 regions, EDIFACT)
 * - iana.org.ai - IANA timezone database
 * - standards.org.ai - All other standards (BLS, NAPCS, UNSPSC, AdvanceCTE)
 *
 * ID Format: Wikipedia_Style_Names (Title case with underscores)
 */

import { transformONET } from './onet'
import { transformAPQC } from './apqc'
import { transformGS1 } from './gs1'
import { transformNAICS } from './naics'
import { transformNAPCS } from './napcs'
import { transformUNSPSCData } from './unspsc'
import { transformBLS } from './bls'
import { transformAdvanceCTE } from './advancecte'
import { transformISO } from './iso'
import { transformUN } from './un'
import { transformIANA } from './iana'
import { ensureOutputDirs } from './utils'

async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║        Standards.org.ai Data Generation Pipeline               ║')
  console.log('╚════════════════════════════════════════════════════════════════╝')
  console.log('')

  const startTime = Date.now()

  // Ensure output directories exist
  ensureOutputDirs()

  // Parse command line arguments
  const args = process.argv.slice(2)
  const runAll = args.length === 0 || args.includes('--all')
  const sources = new Set(args.filter(arg => !arg.startsWith('--')))

  // Transform each source
  const tasks: Array<{ name: string; fn: () => Promise<void>; condition: boolean }> = [
    { name: 'onet', fn: transformONET, condition: runAll || sources.has('onet') },
    { name: 'apqc', fn: transformAPQC, condition: runAll || sources.has('apqc') },
    { name: 'gs1', fn: transformGS1, condition: runAll || sources.has('gs1') },
    { name: 'naics', fn: transformNAICS, condition: runAll || sources.has('naics') },
    { name: 'napcs', fn: transformNAPCS, condition: runAll || sources.has('napcs') },
    { name: 'unspsc', fn: transformUNSPSCData, condition: runAll || sources.has('unspsc') },
    { name: 'bls', fn: transformBLS, condition: runAll || sources.has('bls') },
    { name: 'advancecte', fn: transformAdvanceCTE, condition: runAll || sources.has('advancecte') },
    { name: 'iso', fn: transformISO, condition: runAll || sources.has('iso') },
    { name: 'un', fn: transformUN, condition: runAll || sources.has('un') },
    { name: 'iana', fn: transformIANA, condition: runAll || sources.has('iana') },
  ]

  let successCount = 0
  let errorCount = 0

  for (const task of tasks) {
    if (task.condition) {
      try {
        await task.fn()
        successCount++
      } catch (error) {
        console.error(`Error transforming ${task.name}:`, error)
        errorCount++
      }
    }
  }

  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)

  console.log('╔════════════════════════════════════════════════════════════════╗')
  console.log('║                    Generation Complete                         ║')
  console.log('╚════════════════════════════════════════════════════════════════╝')
  console.log(``)
  console.log(`  Successful transformations: ${successCount}`)
  console.log(`  Failed transformations: ${errorCount}`)
  console.log(`  Total time: ${duration}s`)
  console.log(``)
  console.log(`  Output directory: .data/`)
  console.log(`  Relationships: .data/relationships/`)
  console.log(``)

  if (errorCount > 0) {
    process.exit(1)
  }
}

// Print usage if --help is passed
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: bun run .scripts/generate.ts [options] [sources...]

Options:
  --all       Transform all sources (default if no sources specified)
  --help, -h  Show this help message

Sources:
  onet        O*NET occupational data
  apqc        APQC process classification framework
  gs1         GS1 product/location standards (GPC, EPCIS, CBV, Digital Link)
  naics       NAICS industry classification
  napcs       NAPCS product classification
  unspsc      UNSPSC product/service codes
  bls         BLS employment statistics and industry data
  advancecte  AdvanceCTE career cluster crosswalks
  iso         ISO standards (countries, currencies, languages)
  un          UN standards (LOCODE, M49 regions, EDIFACT)
  iana        IANA timezone database

Examples:
  bun run .scripts/generate.ts                    # Transform all sources
  bun run .scripts/generate.ts onet naics         # Transform only ONET and NAICS
  bun run .scripts/generate.ts --all              # Transform all sources
`)
  process.exit(0)
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
