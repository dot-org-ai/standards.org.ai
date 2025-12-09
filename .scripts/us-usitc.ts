/**
 * USITC (US International Trade Commission) Tariff Data Transformation
 *
 * This script processes Harmonized Tariff Schedule (HTS) data and Schedule B export codes.
 *
 * Data Sources:
 * - HTS Data: https://hts.usitc.gov/
 * - HTS API: https://hts.usitc.gov/api
 * - Schedule B: https://www.census.gov/foreign-trade/schedules/b/
 *
 * Expected Source Files (in .source/USITC/):
 * - HTS.Sections.tsv - HTS Sections (I-XXII)
 * - HTS.Chapters.tsv - HTS Chapters (01-99)
 * - HTS.Headings.tsv - HTS Headings (4-digit)
 * - HTS.Subheadings.tsv - HTS Subheadings (6-digit)
 * - HTS.Codes.tsv - Full HTS Codes (8-10 digit) with duty rates
 * - HTS.SpecialPrograms.tsv - Special tariff programs (optional, defaults provided)
 * - ScheduleB.Codes.tsv - Schedule B export codes
 *
 * Output Files (in .data/):
 * - USITC.HTS.Sections.tsv
 * - USITC.HTS.Chapters.tsv
 * - USITC.HTS.Headings.tsv
 * - USITC.HTS.Subheadings.tsv
 * - USITC.HTS.Codes.tsv (~18,000+ tariff lines)
 * - USITC.SpecialPrograms.tsv
 * - USITC.ScheduleB.tsv
 *
 * Relationships (in .data/relationships/):
 * - USITC.Chapter.Section.tsv
 * - USITC.Heading.Chapter.tsv
 * - USITC.Subheading.Heading.tsv
 * - USITC.Code.Subheading.tsv
 * - USITC.ScheduleB.HTS.tsv
 */

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

const NS = NAMESPACES.USITC
const SOURCE_DIR = getSourcePath('USITC')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// HTS Section (I-XXII)
interface HTSSectionRow {
  code: string        // e.g., "I", "II", "III"
  name: string        // Section name
  notes: string       // Section notes
}

// HTS Chapter (01-99)
interface HTSChapterRow {
  code: string        // e.g., "01", "02"
  name: string        // Chapter name
  section: string     // Section code (I-XXII)
  notes: string       // Chapter notes
}

// HTS Heading (4-digit)
interface HTSHeadingRow {
  code: string        // e.g., "0101", "0102"
  name: string        // Heading name
  chapter: string     // Chapter code
}

// HTS Subheading (6-digit, HS level)
interface HTSSubheadingRow {
  code: string        // e.g., "010110", "010120"
  name: string        // Subheading name
  heading: string     // Heading code (4-digit)
}

// Full HTS Code (8-10 digit)
interface HTSCodeRow {
  code: string              // e.g., "0101101000", "0101109000"
  name: string              // Full description
  subheading: string        // Subheading code (6-digit)
  unit: string              // Unit of quantity (e.g., "No.", "kg", "L")
  generalRate: string       // General duty rate (Column 1)
  specialRate: string       // Special program rates (A, A+, AU, BH, CA, CL, CO, D, E, IL, J, JO, K, L, MA, MX, OM, P, PA, PE, R, SG)
  column2Rate: string       // Column 2 rate
}

// Special tariff programs
interface SpecialProgramRow {
  code: string              // e.g., "A", "A+", "AU", "BH", "CA", "CL", "CO"
  name: string              // Program name
  description: string       // Description
  countries: string         // Eligible countries/regions
  eligibility: string       // Eligibility requirements
}

// Schedule B (Export classification)
interface ScheduleBRow {
  code: string              // 10-digit Schedule B code
  name: string              // Description
  htsEquivalent: string     // Equivalent HTS import code
  unit: string              // Unit of quantity
}

/**
 * Get parent code for HTS hierarchy
 */
function getHTSParent(code: string): string | null {
  if (!code) return null

  // Remove leading zeros for processing
  const cleanCode = code.replace(/^0+/, '')

  // 10-digit -> 8-digit (statistical suffix)
  if (code.length === 10) {
    return code.substring(0, 8)
  }
  // 8-digit -> 6-digit (subheading)
  if (code.length === 8) {
    return code.substring(0, 6)
  }
  // 6-digit -> 4-digit (heading)
  if (code.length === 6) {
    return code.substring(0, 4)
  }
  // 4-digit -> 2-digit (chapter)
  if (code.length === 4) {
    return code.substring(0, 2)
  }
  // Chapter has no parent (handled separately via section mapping)
  return null
}

/**
 * Get HTS level type based on code length
 */
function getHTSLevel(code: string): string {
  const length = code.length
  switch (length) {
    case 2:
      return 'Chapter'
    case 4:
      return 'Heading'
    case 6:
      return 'Subheading'
    case 8:
    case 10:
      return 'Code'
    default:
      return 'Unknown'
  }
}

/**
 * Transform HTS Sections (I-XXII)
 */
function transformHTSSections(): void {
  console.log('Transforming HTS Sections...')
  const sourceFile = join(SOURCE_DIR, 'HTS.Sections.tsv')

  if (!existsSync(sourceFile)) {
    console.log('HTS.Sections.tsv not found, skipping...')
    return
  }

  const data = parseTSV<HTSSectionRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'HTSSection',
      id: toWikipediaStyleId(`Section ${row.code} ${row.name}`),
      name: `Section ${row.code} - ${row.name}`,
      description: cleanDescription(row.notes || ''),
      code: row.code,
      includedIn: getAggregationsForType('HTSSection'),
    }))

  writeStandardTSV(join(DATA_DIR, 'USITC.HTS.Sections.tsv'), records)
}

interface HTSChapterSourceRow {
  code: string
  name: string
  description: string
  parent: string
}

/**
 * Transform HTS Chapters (01-99)
 */
function transformHTSChapters(): void {
  console.log('Transforming HTS Chapters from source file...')
  const sourceFile = join(SOURCE_DIR, 'hts_chapters.tsv')

  if (!existsSync(sourceFile)) {
    console.log('Warning: hts_chapters.tsv not found, skipping HTS chapters')
    return
  }

  const data = parseTSV<HTSChapterSourceRow>(sourceFile)
  console.log(`Loaded ${data.length} HTS chapters from source`)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'HTSChapter',
      id: toWikipediaStyleId(`Chapter ${row.code} ${row.name}`),
      name: `Chapter ${row.code} - ${row.name}`,
      description: cleanDescription(row.description || row.name),
      code: row.code,
      includedIn: getAggregationsForType('HTSChapter'),
    }))

  writeStandardTSV(join(DATA_DIR, 'USITC.HTS.Chapters.tsv'), records)
  console.log(`Wrote ${records.length} HTS chapters to USITC.HTSChapters.tsv`)
}

/**
 * Transform HTS Headings (4-digit)
 */
function transformHTSHeadings(): void {
  console.log('Transforming HTS Headings...')
  const sourceFile = join(SOURCE_DIR, 'HTS.Headings.tsv')

  if (!existsSync(sourceFile)) {
    console.log('HTS.Headings.tsv not found, skipping...')
    return
  }

  const data = parseTSV<HTSHeadingRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'HTSHeading',
      id: toWikipediaStyleId(`${row.code} ${row.name}`),
      name: row.name,
      description: cleanDescription(row.name),
      code: row.code,
      includedIn: getAggregationsForType('HTSHeading'),
    }))

  writeStandardTSV(join(DATA_DIR, 'USITC.HTS.Headings.tsv'), records)

  // Create heading -> chapter relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.code && row.chapter)
    .map(row => ({
      fromNs: NS,
      fromType: 'HTSHeading',
      fromCode: row.code,
      toNs: NS,
      toType: 'HTSChapter',
      toCode: row.chapter,
      relationshipType: 'child_of',
    }))

  writeTSV(
    join(REL_DIR, 'USITC.Heading.Chapter.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

/**
 * Transform HTS Subheadings (6-digit)
 */
function transformHTSSubheadings(): void {
  console.log('Transforming HTS Subheadings...')
  const sourceFile = join(SOURCE_DIR, 'HTS.Subheadings.tsv')

  if (!existsSync(sourceFile)) {
    console.log('HTS.Subheadings.tsv not found, skipping...')
    return
  }

  const data = parseTSV<HTSSubheadingRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'HTSSubheading',
      id: toWikipediaStyleId(`${row.code} ${row.name}`),
      name: row.name,
      description: cleanDescription(row.name),
      code: row.code,
      includedIn: getAggregationsForType('HTSSubheading'),
    }))

  writeStandardTSV(join(DATA_DIR, 'USITC.HTS.Subheadings.tsv'), records)

  // Create subheading -> heading relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.code && row.heading)
    .map(row => ({
      fromNs: NS,
      fromType: 'HTSSubheading',
      fromCode: row.code,
      toNs: NS,
      toType: 'HTSHeading',
      toCode: row.heading,
      relationshipType: 'child_of',
    }))

  writeTSV(
    join(REL_DIR, 'USITC.Subheading.Heading.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

/**
 * Transform Full HTS Codes (8-10 digit)
 * This is the main tariff line with duty rates
 */
function transformHTSCodes(): void {
  console.log('Transforming HTS Codes (full tariff lines)...')
  const sourceFile = join(SOURCE_DIR, 'HTS.Codes.tsv')

  if (!existsSync(sourceFile)) {
    console.log('HTS.Codes.tsv not found, skipping...')
    return
  }

  const data = parseTSV<HTSCodeRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'HTSCode',
      id: toWikipediaStyleId(`${row.code} ${row.name}`),
      name: row.name,
      description: cleanDescription(
        `${row.name}. Unit: ${row.unit}. General rate: ${row.generalRate}. Special: ${row.specialRate}. Column 2: ${row.column2Rate}`
      ),
      code: row.code,
      includedIn: getAggregationsForType('HTSCode'),
    }))

  writeStandardTSV(join(DATA_DIR, 'USITC.HTS.Codes.tsv'), records)

  // Create code -> subheading relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.code && row.subheading)
    .map(row => ({
      fromNs: NS,
      fromType: 'HTSCode',
      fromCode: row.code,
      toNs: NS,
      toType: 'HTSSubheading',
      toCode: row.subheading,
      relationshipType: 'child_of',
    }))

  writeTSV(
    join(REL_DIR, 'USITC.Code.Subheading.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

/**
 * Transform Special Tariff Programs
 * Includes GSP, USMCA/NAFTA, FTAs, etc.
 */
function transformSpecialPrograms(): void {
  console.log('Transforming Special Tariff Programs...')
  const sourceFile = join(SOURCE_DIR, 'HTS.SpecialPrograms.tsv')

  if (!existsSync(sourceFile)) {
    console.log('HTS.SpecialPrograms.tsv not found, creating default programs...')

    // Create default special program data
    const defaultPrograms: SpecialProgramRow[] = [
      {
        code: 'A',
        name: 'Generalized System of Preferences (GSP)',
        description: 'Preferential tariff treatment for developing countries',
        countries: 'Various developing countries',
        eligibility: 'Products must meet GSP eligibility criteria and rules of origin',
      },
      {
        code: 'A+',
        name: 'GSP - Least Developed Beneficiary Countries',
        description: 'Enhanced GSP benefits for least developed countries',
        countries: 'Least developed countries',
        eligibility: 'Products from least developed beneficiary countries',
      },
      {
        code: 'AU',
        name: 'US-Australia Free Trade Agreement',
        description: 'Free trade agreement between the United States and Australia',
        countries: 'Australia',
        eligibility: 'Products originating in Australia under AUSFTA',
      },
      {
        code: 'B',
        name: 'Automotive Products Trade Act',
        description: 'Special treatment for certain automotive products',
        countries: 'Canada',
        eligibility: 'Eligible automotive products from Canada',
      },
      {
        code: 'BH',
        name: 'US-Bahrain Free Trade Agreement',
        description: 'Free trade agreement between the United States and Bahrain',
        countries: 'Bahrain',
        eligibility: 'Products originating in Bahrain under BHFTA',
      },
      {
        code: 'CA',
        name: 'USMCA - Canada',
        description: 'United States-Mexico-Canada Agreement (formerly NAFTA)',
        countries: 'Canada',
        eligibility: 'Products originating in Canada under USMCA',
      },
      {
        code: 'CL',
        name: 'US-Chile Free Trade Agreement',
        description: 'Free trade agreement between the United States and Chile',
        countries: 'Chile',
        eligibility: 'Products originating in Chile under CLFTA',
      },
      {
        code: 'CO',
        name: 'Andean Trade Preference Act (ATPA)',
        description: 'Trade preferences for Andean countries',
        countries: 'Bolivia, Colombia, Ecuador, Peru',
        eligibility: 'Eligible products from ATPA countries',
      },
      {
        code: 'D',
        name: 'African Growth and Opportunity Act (AGOA)',
        description: 'Trade preferences for sub-Saharan African countries',
        countries: 'Sub-Saharan Africa',
        eligibility: 'Products from AGOA-eligible countries',
      },
      {
        code: 'E',
        name: 'Caribbean Basin Economic Recovery Act (CBERA)',
        description: 'Trade preferences for Caribbean Basin countries',
        countries: 'Caribbean Basin Initiative countries',
        eligibility: 'Products from CBI-eligible countries',
      },
      {
        code: 'IL',
        name: 'US-Israel Free Trade Agreement',
        description: 'Free trade agreement between the United States and Israel',
        countries: 'Israel',
        eligibility: 'Products originating in Israel under ILFTA',
      },
      {
        code: 'J',
        name: 'Andean Trade Promotion and Drug Eradication Act (ATPDEA)',
        description: 'Enhanced trade preferences for Andean countries',
        countries: 'Bolivia, Colombia, Ecuador, Peru',
        eligibility: 'Eligible products under ATPDEA',
      },
      {
        code: 'JO',
        name: 'US-Jordan Free Trade Agreement',
        description: 'Free trade agreement between the United States and Jordan',
        countries: 'Jordan',
        eligibility: 'Products originating in Jordan under JOFTA',
      },
      {
        code: 'K',
        name: 'US-Singapore Free Trade Agreement',
        description: 'Free trade agreement between the United States and Singapore',
        countries: 'Singapore',
        eligibility: 'Products originating in Singapore under SGFTA',
      },
      {
        code: 'L',
        name: 'Civil Aircraft Agreement',
        description: 'Duty-free treatment for civil aircraft and parts',
        countries: 'International',
        eligibility: 'Eligible civil aircraft, engines, and parts',
      },
      {
        code: 'MA',
        name: 'US-Morocco Free Trade Agreement',
        description: 'Free trade agreement between the United States and Morocco',
        countries: 'Morocco',
        eligibility: 'Products originating in Morocco under MAFTA',
      },
      {
        code: 'MX',
        name: 'USMCA - Mexico',
        description: 'United States-Mexico-Canada Agreement (formerly NAFTA)',
        countries: 'Mexico',
        eligibility: 'Products originating in Mexico under USMCA',
      },
      {
        code: 'OM',
        name: 'US-Oman Free Trade Agreement',
        description: 'Free trade agreement between the United States and Oman',
        countries: 'Oman',
        eligibility: 'Products originating in Oman under OMFTA',
      },
      {
        code: 'P',
        name: 'US-Peru Trade Promotion Agreement',
        description: 'Trade promotion agreement between the United States and Peru',
        countries: 'Peru',
        eligibility: 'Products originating in Peru under PTPA',
      },
      {
        code: 'PA',
        name: 'US-Panama Trade Promotion Agreement',
        description: 'Trade promotion agreement between the United States and Panama',
        countries: 'Panama',
        eligibility: 'Products originating in Panama under PATPA',
      },
      {
        code: 'PE',
        name: 'US-Peru Trade Promotion Agreement',
        description: 'Trade promotion agreement between the United States and Peru',
        countries: 'Peru',
        eligibility: 'Products originating in Peru under PTPA',
      },
      {
        code: 'R',
        name: 'US-Korea Free Trade Agreement',
        description: 'Free trade agreement between the United States and South Korea',
        countries: 'South Korea',
        eligibility: 'Products originating in Korea under KORUS',
      },
      {
        code: 'SG',
        name: 'US-Singapore Free Trade Agreement',
        description: 'Free trade agreement between the United States and Singapore',
        countries: 'Singapore',
        eligibility: 'Products originating in Singapore under SGFTA',
      },
    ]

    const records: StandardRecord[] = defaultPrograms.map(row => ({
      ns: NS,
      type: 'SpecialProgram',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: cleanDescription(`${row.description}. Countries: ${row.countries}. ${row.eligibility}`),
      code: row.code,
      includedIn: getAggregationsForType('SpecialProgram'),
    }))

    writeStandardTSV(join(DATA_DIR, 'USITC.SpecialPrograms.tsv'), records)
    return
  }

  const data = parseTSV<SpecialProgramRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'SpecialProgram',
      id: toWikipediaStyleId(row.name),
      name: row.name,
      description: cleanDescription(`${row.description}. Countries: ${row.countries}. ${row.eligibility}`),
      code: row.code,
      includedIn: getAggregationsForType('SpecialProgram'),
    }))

  writeStandardTSV(join(DATA_DIR, 'USITC.SpecialPrograms.tsv'), records)
}

/**
 * Transform Schedule B Export Codes
 */
function transformScheduleB(): void {
  console.log('Transforming Schedule B Export Codes...')
  const sourceFile = join(SOURCE_DIR, 'ScheduleB.Codes.tsv')

  if (!existsSync(sourceFile)) {
    console.log('ScheduleB.Codes.tsv not found, skipping...')
    return
  }

  const data = parseTSV<ScheduleBRow>(sourceFile)

  const records: StandardRecord[] = data
    .filter(row => row.code && row.name)
    .map(row => ({
      ns: NS,
      type: 'ScheduleB',
      id: toWikipediaStyleId(`${row.code} ${row.name}`),
      name: row.name,
      description: cleanDescription(`${row.name}. Unit: ${row.unit}. HTS Equivalent: ${row.htsEquivalent}`),
      code: row.code,
      includedIn: getAggregationsForType('ScheduleB'),
    }))

  writeStandardTSV(join(DATA_DIR, 'USITC.ScheduleB.tsv'), records)

  // Create Schedule B -> HTS relationships (where applicable)
  const relationships: Record<string, string>[] = data
    .filter(row => row.code && row.htsEquivalent)
    .map(row => ({
      fromNs: NS,
      fromType: 'ScheduleB',
      fromCode: row.code,
      toNs: NS,
      toType: 'HTSCode',
      toCode: row.htsEquivalent,
      relationshipType: 'equivalent_to',
    }))

  writeTSV(
    join(REL_DIR, 'USITC.ScheduleB.HTS.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

/**
 * Main transformation function
 */
export async function transformUSITC(): Promise<void> {
  console.log('=== USITC Transformation ===')
  ensureOutputDirs()

  transformHTSSections()
  transformHTSChapters()
  transformHTSHeadings()
  transformHTSSubheadings()
  transformHTSCodes()
  transformSpecialPrograms()
  transformScheduleB()

  console.log('=== USITC Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformUSITC()
}
