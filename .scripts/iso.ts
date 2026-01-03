/**
 * ISO Standards Transformation Script
 * Transforms ISO data (countries, currencies, languages) into standard TSV format
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import {
  NAMESPACES,
  StandardRecord,
  RelationshipRecord,
  parseCSV,
  writeStandardTSV,
  writeRelationshipTSV,
  toWikipediaStyleId,
  cleanDescription,
  getSourcePath,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
  getAggregationsForType,
} from './utils'

const NS = NAMESPACES.ISO
const SOURCE_DIR = getSourcePath('ISO')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

interface CountryRecord {
  'ISO3166-1-Alpha-2': string
  'ISO3166-1-Alpha-3': string
  'ISO3166-1-numeric': string
  'official_name_en': string
  'CLDR display name': string
  'Capital': string
  'Continent': string
  'Region Name': string
  'Sub-region Name': string
  'M49': string
  'Region Code': string
  'Sub-region Code': string
  'ISO4217-currency_alphabetic_code': string
  'ISO4217-currency_name': string
  'Languages': string
  'TLD': string
  'wikidata_id': string
}

interface CurrencyRecord {
  Entity: string
  Currency: string
  AlphabeticCode: string
  NumericCode: string
  MinorUnit: string
  WithdrawalDate: string
}

interface LanguageRecord {
  'alpha3-b': string
  'alpha3-t': string
  'alpha2': string
  English: string
  French: string
}

function transformCountries(): void {
  console.log('Transforming ISO Countries...')

  const sourceFile = join(SOURCE_DIR, 'ISO.CountryCodes.csv')
  const records = parseCSV<CountryRecord>(sourceFile)

  const countries: StandardRecord[] = []
  const countryRegions: RelationshipRecord[] = []
  const countryCurrencies: RelationshipRecord[] = []

  for (const record of records) {
    const alpha2 = record['ISO3166-1-Alpha-2']
    const alpha3 = record['ISO3166-1-Alpha-3']
    if (!alpha2 && !alpha3) continue

    const name = record['CLDR display name'] || record['official_name_en'] || ''
    if (!name) continue

    const id = toWikipediaStyleId(name)
    const description = record['official_name_en'] || ''

    countries.push({
      ns: NS,
      type: 'Country',
      id,
      name,
      description: cleanDescription(description !== name ? description : ''),
      code: alpha2 || alpha3,
      includedIn: getAggregationsForType('Country'),
    })

    // Relationship to region
    if (record['Region Name']) {
      countryRegions.push({
        fromNs: NS,
        fromType: 'Country',
        fromId: id,
        toNs: NAMESPACES.UN,
        toType: 'Region',
        toId: toWikipediaStyleId(record['Region Name']),
        relationshipType: 'locatedIn',
      })
    }

    // Relationship to sub-region
    if (record['Sub-region Name']) {
      countryRegions.push({
        fromNs: NS,
        fromType: 'Country',
        fromId: id,
        toNs: NAMESPACES.UN,
        toType: 'SubRegion',
        toId: toWikipediaStyleId(record['Sub-region Name']),
        relationshipType: 'locatedIn',
      })
    }

    // Relationship to currency
    if (record['ISO4217-currency_alphabetic_code']) {
      countryCurrencies.push({
        fromNs: NS,
        fromType: 'Country',
        fromId: id,
        toNs: NS,
        toType: 'Currency',
        toId: record['ISO4217-currency_alphabetic_code'],
        relationshipType: 'usesCurrency',
      })
    }
  }

  writeStandardTSV(join(DATA_DIR, 'ISO.Countries.tsv'), countries)
  writeRelationshipTSV(join(REL_DIR, 'Country.Region.tsv'), countryRegions)
  writeRelationshipTSV(join(REL_DIR, 'Country.Currency.tsv'), countryCurrencies)
}

function transformCurrencies(): void {
  console.log('Transforming ISO Currencies...')

  const sourceFile = join(SOURCE_DIR, 'ISO.CurrencyCodes.csv')
  const records = parseCSV<CurrencyRecord>(sourceFile)

  // Deduplicate currencies (same currency used by multiple countries)
  const currencyMap = new Map<string, StandardRecord>()

  for (const record of records) {
    const code = record.AlphabeticCode
    if (!code || currencyMap.has(code)) continue

    const name = record.Currency
    if (!name) continue

    // Skip withdrawn currencies
    if (record.WithdrawalDate) continue

    currencyMap.set(code, {
      ns: NS,
      type: 'Currency',
      id: code,
      name,
      description: `Minor unit: ${record.MinorUnit || 'N/A'}`,
      code,
      includedIn: getAggregationsForType('Currency'),
    })
  }

  const currencies = Array.from(currencyMap.values())
  writeStandardTSV(join(DATA_DIR, 'ISO.Currencies.tsv'), currencies)
}

function transformLanguages(): void {
  console.log('Transforming ISO Languages...')

  const sourceFile = join(SOURCE_DIR, 'ISO.LanguageCodes.csv')
  const records = parseCSV<LanguageRecord>(sourceFile)

  const languages: StandardRecord[] = []

  for (const record of records) {
    const alpha3 = record['alpha3-b'] || record['alpha3-t']
    if (!alpha3) continue

    const name = record.English
    if (!name) continue

    const id = toWikipediaStyleId(name)
    const code = record.alpha2 || alpha3

    languages.push({
      ns: NS,
      type: 'Language',
      id,
      name,
      description: record.French !== name ? record.French : '',
      code,
      includedIn: getAggregationsForType('Language'),
    })
  }

  writeStandardTSV(join(DATA_DIR, 'ISO.Languages.tsv'), languages)
}

function transformCountryLanguageRelationships(): void {
  console.log('Transforming Country-Language relationships...')

  // Load country data to get Languages field
  const countryFile = join(SOURCE_DIR, 'ISO.CountryCodes.csv')
  const countryRecords = parseCSV<CountryRecord>(countryFile)

  // Load language data to build a mapping from alpha2 code to language ID
  const languageFile = join(SOURCE_DIR, 'ISO.LanguageCodes.csv')
  const languageRecords = parseCSV<LanguageRecord>(languageFile)

  // Build map: alpha2 language code -> language ID
  const languageCodeToId = new Map<string, string>()
  for (const record of languageRecords) {
    const alpha2 = record.alpha2
    const name = record.English
    if (alpha2 && name) {
      languageCodeToId.set(alpha2, toWikipediaStyleId(name))
    }
  }

  const countryLanguages: RelationshipRecord[] = []

  for (const record of countryRecords) {
    const countryName = record['CLDR display name'] || record['official_name_en']
    if (!countryName) continue

    const countryId = toWikipediaStyleId(countryName)
    const languagesField = record.Languages
    if (!languagesField) continue

    // Parse the Languages field - it can contain:
    // - Single language: "en-US"
    // - Multiple languages: "de-CH,fr-CH,it-CH,rm"
    // - Language codes may have locale suffix (e.g., "en-US") or be standalone (e.g., "rm")
    const languageCodes = languagesField.split(',').map(s => s.trim())

    for (const langCode of languageCodes) {
      if (!langCode) continue

      // Extract the base language code (before any locale suffix like "-CH")
      const baseLangCode = langCode.includes('-')
        ? langCode.split('-')[0]
        : langCode

      // Look up the language ID from our mapping
      const languageId = languageCodeToId.get(baseLangCode)
      if (!languageId) {
        console.warn(`  Warning: Language code "${baseLangCode}" from country "${countryName}" not found in ISO language codes`)
        continue
      }

      countryLanguages.push({
        fromNs: NS,
        fromType: 'Country',
        fromId: countryId,
        toNs: NS,
        toType: 'Language',
        toId: languageId,
        relationshipType: 'official_language',
      })
    }
  }

  writeRelationshipTSV(join(REL_DIR, 'Country.Language.tsv'), countryLanguages)
  console.log(`  Created ${countryLanguages.length} Country-Language relationships`)
}

export async function transformISO(): Promise<void> {
  console.log('=== ISO Standards Transformation ===\n')
  ensureOutputDirs()

  transformCountries()
  transformCurrencies()
  transformLanguages()
  transformCountryLanguageRelationships()

  console.log('\n=== ISO Transformation Complete ===')
}

// Run if called directly
if (import.meta.main) {
  transformISO().catch(console.error)
}
