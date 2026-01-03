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
 * - w3.org.ai - W3C web standards (HTML, CSS, Semantic Web, Accessibility, Credentials, WoT)
 * - fhir.org.ai - HL7 FHIR healthcare interoperability standards
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
import { transformW3CHTML } from './w3c-html'
import { transformW3CCSS } from './w3c-css'
import { transformW3CSemantic } from './w3c-semantic'
import { transformW3CAccessibility } from './w3c-accessibility'
import { transformW3CCredentials } from './w3c-credentials'
import { transformW3CWoT } from './w3c-wot'
import { transformHealthcareFHIR } from './healthcare-fhir'
import { transformHealthcareDrugs } from './healthcare-drugs'
import { transformHealthcareTerminology } from './healthcare-terminology'
import { transformFinance } from './finance'
import { transformEducation } from './education'
import { transformCensus } from './us-census'
import { transformSEC } from './us-sec'
import { transformSBA } from './us-sba'
import { transformSICNAICSCrosswalk } from './sic-naics-crosswalk'
import { transformProductIndustryCrosswalk } from './product-industry-crosswalk'
import { transformProcessOccupationCrosswalk } from './process-occupation-crosswalk'
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
    { name: 'finance', fn: transformFinance, condition: runAll || sources.has('finance') },
    { name: 'education', fn: transformEducation, condition: runAll || sources.has('education') },
    { name: 'census', fn: transformCensus, condition: runAll || sources.has('census') || sources.has('us-census') },
    { name: 'sec', fn: transformSEC, condition: runAll || sources.has('sec') || sources.has('us-sec') },
    { name: 'sba', fn: transformSBA, condition: runAll || sources.has('sba') || sources.has('us-sba') },
    { name: 'sic-naics-crosswalk', fn: transformSICNAICSCrosswalk, condition: runAll || sources.has('sic-naics') || sources.has('crosswalk') },
    { name: 'product-industry-crosswalk', fn: transformProductIndustryCrosswalk, condition: runAll || sources.has('product-industry') || sources.has('crosswalk') },
    { name: 'process-occupation-crosswalk', fn: transformProcessOccupationCrosswalk, condition: runAll || sources.has('process-occupation') || sources.has('crosswalk') },
    { name: 'w3c-html', fn: transformW3CHTML, condition: runAll || sources.has('w3c') || sources.has('w3c-html') },
    { name: 'w3c-css', fn: transformW3CCSS, condition: runAll || sources.has('w3c') || sources.has('w3c-css') },
    { name: 'w3c-semantic', fn: transformW3CSemantic, condition: runAll || sources.has('w3c') || sources.has('w3c-semantic') },
    { name: 'w3c-accessibility', fn: transformW3CAccessibility, condition: runAll || sources.has('w3c') || sources.has('w3c-accessibility') },
    { name: 'w3c-credentials', fn: transformW3CCredentials, condition: runAll || sources.has('w3c') || sources.has('w3c-credentials') },
    { name: 'w3c-wot', fn: transformW3CWoT, condition: runAll || sources.has('w3c') || sources.has('w3c-wot') },
    { name: 'healthcare-fhir', fn: transformHealthcareFHIR, condition: runAll || sources.has('healthcare') || sources.has('fhir') || sources.has('healthcare-fhir') },
    { name: 'healthcare-drugs', fn: transformHealthcareDrugs, condition: runAll || sources.has('healthcare') || sources.has('healthcare-drugs') },
    { name: 'healthcare-terminology', fn: transformHealthcareTerminology, condition: runAll || sources.has('healthcare') || sources.has('healthcare-terminology') },
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
  onet              O*NET occupational data
  apqc              APQC process classification framework
  gs1               GS1 product/location standards (GPC, EPCIS, CBV, Digital Link)
  naics             NAICS industry classification
  napcs             NAPCS product classification
  unspsc            UNSPSC product/service codes
  bls               BLS employment statistics and industry data
  advancecte        AdvanceCTE career cluster crosswalks
  iso               ISO standards (countries, currencies, languages)
  un                UN standards (LOCODE, M49 regions, EDIFACT)
  iana              IANA timezone database
  finance           Financial standards (ISO 20022, LEI, ISIN, MCC, SWIFT)
  education         Education standards (ISCED, CEDS, CASE)
  census            US Census Bureau geographic and business standards
  us-census         Alias for census
  sec               SEC filing forms, SIC codes, and filer types
  us-sec            Alias for sec
  sba               SBA size standards, business types, and contract types
  us-sba            Alias for sba
  sic-naics         SIC to NAICS crosswalk relationships (Census Bureau)
  product-industry  Product-to-industry crosswalk (GS1/UNSPSC to NAICS)
  crosswalk         Alias for sic-naics and product-industry
  w3c               All W3C web standards (runs all w3c-* modules)
  w3c-html          W3C HTML elements and attributes
  w3c-css           W3C CSS properties and values
  w3c-semantic      W3C Semantic Web vocabularies (RDF, OWL, SKOS)
  w3c-accessibility W3C Web Accessibility standards (WCAG, ARIA, ATAG)
  w3c-credentials   W3C Verifiable Credentials and DID
  w3c-wot                W3C Web of Things (Thing Descriptions, protocols)
  healthcare             All Healthcare standards (runs all healthcare-* modules)
  healthcare-fhir        HL7 FHIR healthcare interoperability standards
  healthcare-drugs       Healthcare drug and provider standards (NDC, RxNorm, NPI, CPT, HCPCS)
  healthcare-terminology Healthcare terminology standards (ICD, SNOMED, LOINC)
  fhir                   Alias for healthcare-fhir

Examples:
  bun run .scripts/generate.ts                    # Transform all sources
  bun run .scripts/generate.ts onet naics         # Transform only ONET and NAICS
  bun run .scripts/generate.ts w3c                # Transform all W3C standards
  bun run .scripts/generate.ts w3c-html w3c-css   # Transform only W3C HTML and CSS
  bun run .scripts/generate.ts --all              # Transform all sources
`)
  process.exit(0)
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
