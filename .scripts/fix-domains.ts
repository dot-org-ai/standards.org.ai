#!/usr/bin/env bun
/**
 * Fix Namespace Domains
 *
 * Updates canonical URLs in MDX files to use owned domains.
 * Run with --dry-run to preview changes without modifying files.
 */

import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'

// Domain replacements: old domain -> new domain prefix
const DOMAIN_FIXES: Record<string, string> = {
  // EDI Standards -> standards.org.ai
  'x12.org.ai': 'standards.org.ai/X12',
  'eancom.org.ai': 'standards.org.ai/EANCOM',
  'peppol.org.ai': 'standards.org.ai/Peppol',

  // Ecommerce Standards -> standards.org.ai
  'eclass.org.ai': 'standards.org.ai/ECLASS',
  'etim.org.ai': 'standards.org.ai/ETIM',

  // Education Standards -> standards.org.ai
  'isced.org.ai': 'standards.org.ai/ISCED',
  'ceds.org.ai': 'standards.org.ai/CEDS',
  'case.org.ai': 'standards.org.ai/CASE',
  'cte.org.ai': 'standards.org.ai/CTE',

  // Healthcare Standards -> standards.org.ai
  'fhir.org.ai': 'standards.org.ai/FHIR',
  'icd.org.ai': 'standards.org.ai/ICD',
  'snomed.org.ai': 'standards.org.ai/SNOMED',
  'loinc.org.ai': 'standards.org.ai/LOINC',
  'rxnorm.org.ai': 'standards.org.ai/RxNorm',
  'ndc.org.ai': 'standards.org.ai/NDC',
  'npi.org.ai': 'standards.org.ai/NPI',
  'cpt.org.ai': 'standards.org.ai/CPT',
  'hcpcs.org.ai': 'us.org.ai/CMS/HCPCS',

  // Finance Standards -> standards.org.ai
  'iso20022.org.ai': 'standards.org.ai/ISO20022',
  'lei.org.ai': 'standards.org.ai/LEI',
  'isin.org.ai': 'standards.org.ai/ISIN',
  'mcc.org.ai': 'standards.org.ai/MCC',
  'swift.org.ai': 'standards.org.ai/SWIFT',
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

async function fixDomains(dryRun: boolean = false) {
  const rootDir = process.cwd()
  const mdxFiles = await getAllMdxFiles(rootDir)

  let totalFixed = 0
  const changes: { file: string; old: string; new: string }[] = []

  for (const file of mdxFiles) {
    let content = await readFile(file, 'utf-8')
    let modified = false
    const relativePath = file.replace(rootDir + '/', '')

    for (const [oldDomain, newPrefix] of Object.entries(DOMAIN_FIXES)) {
      const oldPattern = `https://${oldDomain}/`
      const newPattern = `https://${newPrefix}/`

      if (content.includes(oldPattern)) {
        const oldUrl = content.match(new RegExp(`canonical:\\s*(https://${oldDomain.replace('.', '\\.')}[^\\s]*)`))?.[1]
        content = content.replace(new RegExp(oldPattern, 'g'), newPattern)
        const newUrl = content.match(/canonical:\s*(https:\/\/[^\s]*)/)?.[1]

        changes.push({
          file: relativePath,
          old: oldUrl || oldPattern,
          new: newUrl || newPattern
        })
        modified = true
      }
    }

    if (modified) {
      totalFixed++
      if (!dryRun) {
        await writeFile(file, content)
      }
    }
  }

  // Report
  console.log(`\n=== DOMAIN FIX ${dryRun ? 'PREVIEW' : 'COMPLETE'} ===\n`)

  if (changes.length > 0) {
    console.log('Changes:')
    for (const change of changes) {
      console.log(`\n  ${change.file}`)
      console.log(`    - ${change.old}`)
      console.log(`    + ${change.new}`)
    }
  }

  console.log(`\n${dryRun ? 'Would fix' : 'Fixed'}: ${totalFixed} files`)
  console.log(`Total changes: ${changes.length}`)

  if (dryRun && changes.length > 0) {
    console.log('\nRun without --dry-run to apply changes.')
  }
}

// Parse args
const dryRun = process.argv.includes('--dry-run')
fixDomains(dryRun).catch(console.error)
