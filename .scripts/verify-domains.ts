#!/usr/bin/env bun
/**
 * Verify Namespace Domains
 *
 * Scans all MDX files for canonical URLs and verifies we own all domains.
 * Reports any domains that need to be changed to us.org.ai or standards.org.ai.
 */

import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

// Domains we own
const OWNED_DOMAINS = new Set([
  'standards.org.ai',
  'us.org.ai',
  // UN/International
  'un.org.ai',
  // Industry standards orgs
  'gs1.org.ai',
  'onet.org.ai',
  'naics.org.ai',
  'iso.org.ai',
  'iana.org.ai',
  // W3C
  'w3.org.ai',
  // Specific standards we own
  'schema.org.ai',
  'apqc.org.ai',
  // Add more owned domains here as needed
])

// Domains we DON'T own - should be changed to us.org.ai or standards.org.ai
const KNOWN_UNOWNED: Record<string, string> = {
  // US Government agencies - use us.org.ai
  'bls.org.ai': 'us.org.ai/BLS',
  'napcs.org.ai': 'us.org.ai/NAPCS',
  'sba.org.ai': 'us.org.ai/SBA',
  'sec.org.ai': 'us.org.ai/SEC',
  'fda.org.ai': 'us.org.ai/FDA',
  'epa.org.ai': 'us.org.ai/EPA',
  'census.org.ai': 'us.org.ai/Census',
  'usitc.org.ai': 'us.org.ai/USITC',
  'gsa.org.ai': 'us.org.ai/GSA',
  'sam.org.ai': 'us.org.ai/SAM',
  'irs.org.ai': 'us.org.ai/IRS',
  'dot.org.ai': 'us.org.ai/DOT',
  'fmcsa.org.ai': 'us.org.ai/FMCSA',
  'uspto.org.ai': 'us.org.ai/USPTO',
  'ftc.org.ai': 'us.org.ai/FTC',
  'osha.org.ai': 'us.org.ai/OSHA',
  'eeoc.org.ai': 'us.org.ai/EEOC',
  'cbp.org.ai': 'us.org.ai/CBP',
  'cms.org.ai': 'us.org.ai/CMS',
  'ffiec.org.ai': 'us.org.ai/FFIEC',
  'fdic.org.ai': 'us.org.ai/FDIC',
  'bis.org.ai': 'us.org.ai/BIS',
  'omb.org.ai': 'us.org.ai/OMB',
  'cfpb.org.ai': 'us.org.ai/CFPB',
  'fcc.org.ai': 'us.org.ai/FCC',
  'atf.org.ai': 'us.org.ai/ATF',
  'dea.org.ai': 'us.org.ai/DEA',
  'ttb.org.ai': 'us.org.ai/TTB',
  'nrc.org.ai': 'us.org.ai/NRC',
  'usda.org.ai': 'us.org.ai/USDA',
  // Industry standards - check ownership
  'x12.org.ai': 'standards.org.ai', // or acquire?
  'eancom.org.ai': 'standards.org.ai',
  'peppol.org.ai': 'standards.org.ai',
  'eclass.org.ai': 'standards.org.ai',
  'etim.org.ai': 'standards.org.ai',
  'isced.org.ai': 'standards.org.ai',
  'ceds.org.ai': 'standards.org.ai',
  'case.org.ai': 'standards.org.ai',
  'fhir.org.ai': 'standards.org.ai', // or hl7.org.ai?
  'hl7.org.ai': 'standards.org.ai',
  'snomed.org.ai': 'standards.org.ai',
  'loinc.org.ai': 'standards.org.ai',
  'icd.org.ai': 'standards.org.ai',
  'rxnorm.org.ai': 'standards.org.ai',
  'ndc.org.ai': 'standards.org.ai',
  'npi.org.ai': 'standards.org.ai',
  'cpt.org.ai': 'standards.org.ai',
  'lei.org.ai': 'standards.org.ai',
  'isin.org.ai': 'standards.org.ai',
  'mcc.org.ai': 'standards.org.ai',
  'swift.org.ai': 'standards.org.ai',
  'iso20022.org.ai': 'standards.org.ai',
  // Missing from initial list
  'cte.org.ai': 'standards.org.ai',
  'hcpcs.org.ai': 'us.org.ai/CMS', // HCPCS is CMS/Medicare
}

interface DomainUsage {
  domain: string
  files: string[]
  exampleUrl: string
  owned: boolean
  suggestion?: string
}

async function getAllMdxFiles(dir: string): Promise<string[]> {
  const files: string[] = []

  async function walk(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name)
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
        files.push(fullPath)
      }
    }
  }

  await walk(dir)
  return files
}

function extractCanonicalDomain(content: string): { domain: string; url: string } | null {
  const match = content.match(/canonical:\s*(https?:\/\/([^\/\s]+)[^\s]*)/)
  if (match) {
    return {
      url: match[1],
      domain: match[2]
    }
  }
  return null
}

async function verifyDomains() {
  const rootDir = process.cwd()
  const mdxFiles = await getAllMdxFiles(rootDir)

  const domainMap = new Map<string, DomainUsage>()

  for (const file of mdxFiles) {
    const content = await readFile(file, 'utf-8')
    const result = extractCanonicalDomain(content)

    if (result) {
      const { domain, url } = result
      const relativePath = file.replace(rootDir + '/', '')

      if (!domainMap.has(domain)) {
        domainMap.set(domain, {
          domain,
          files: [],
          exampleUrl: url,
          owned: OWNED_DOMAINS.has(domain),
          suggestion: KNOWN_UNOWNED[domain]
        })
      }

      domainMap.get(domain)!.files.push(relativePath)
    }
  }

  // Sort by owned status, then by domain name
  const domains = Array.from(domainMap.values()).sort((a, b) => {
    if (a.owned !== b.owned) return a.owned ? 1 : -1
    return a.domain.localeCompare(b.domain)
  })

  // Report
  console.log('\n=== DOMAIN VERIFICATION REPORT ===\n')

  const unownedDomains = domains.filter(d => !d.owned)
  const ownedDomains = domains.filter(d => d.owned)

  if (unownedDomains.length > 0) {
    console.log('❌ UNOWNED DOMAINS (need to change or acquire):\n')
    for (const d of unownedDomains) {
      console.log(`  ${d.domain}`)
      console.log(`    Files: ${d.files.length}`)
      console.log(`    Example: ${d.exampleUrl}`)
      if (d.suggestion) {
        console.log(`    Suggestion: Use ${d.suggestion}`)
      }
      console.log()
    }
  }

  console.log('\n✅ OWNED DOMAINS:\n')
  for (const d of ownedDomains) {
    console.log(`  ${d.domain} (${d.files.length} files)`)
  }

  console.log('\n=== SUMMARY ===\n')
  console.log(`Total MDX files scanned: ${mdxFiles.length}`)
  console.log(`Unique domains found: ${domains.length}`)
  console.log(`Owned domains: ${ownedDomains.length}`)
  console.log(`Unowned domains: ${unownedDomains.length}`)

  if (unownedDomains.length > 0) {
    console.log('\n⚠️  ACTION REQUIRED: Update canonical URLs for unowned domains\n')

    // Generate fix commands
    console.log('To fix unowned domains, run:\n')
    for (const d of unownedDomains) {
      if (d.suggestion) {
        const oldPattern = `https://${d.domain}`
        const newPattern = `https://${d.suggestion}`
        console.log(`# Fix ${d.domain} -> ${d.suggestion}`)
        console.log(`# Affects ${d.files.length} files`)
        for (const file of d.files) {
          console.log(`#   ${file}`)
        }
        console.log()
      }
    }
  }

  return { owned: ownedDomains, unowned: unownedDomains }
}

// Run verification
verifyDomains().catch(console.error)
