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
  type StandardRecord,
} from './utils'

const NS = NAMESPACES.AdvanceCTE
const SOURCE_DIR = getSourcePath('AdvanceCTE')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

interface FullCrosswalkRow {
  careerCluster: string
  subCluster: string
  sOCCode: string
  occupationTitle: string
  'cIPCode2020)': string
  'cIPTitle2020)': string
  '2DigitNAICS': string
  nAICSTitle: string
}

interface SOCCareerClusterRow {
  sOCCode: string
  occupationTitle: string
  careerCluster: string
  subCluster: string
}

interface CIPCareerClusterRow {
  'cIPCode2020)': string
  'cIPTitle2020)': string
  careerCluster: string
  subCluster: string
}

function transformCareerClusters(): void {
  console.log('Transforming AdvanceCTE Career Clusters...')

  try {
    const data = parseTSV<SOCCareerClusterRow>(join(SOURCE_DIR, 'AdvanceCTE.SOC-CareerClusters.SOC---CC---Sub-Clusters.tsv'))

    // Extract unique career clusters
    const clustersMap = new Map<string, string>()
    const subClustersMap = new Map<string, { name: string; parent: string }>()

    for (const row of data) {
      if (row.careerCluster && !clustersMap.has(row.careerCluster)) {
        clustersMap.set(row.careerCluster, row.careerCluster)
      }
      if (row.subCluster && row.careerCluster) {
        const key = `${row.careerCluster}|${row.subCluster}`
        if (!subClustersMap.has(key)) {
          subClustersMap.set(key, {
            name: row.subCluster,
            parent: row.careerCluster,
          })
        }
      }
    }

    // Write Career Clusters
    const clusterRecords: StandardRecord[] = Array.from(clustersMap.values()).map(cluster => ({
      ns: NS,
      type: 'CareerCluster',
      id: toWikipediaStyleId(cluster),
      name: cluster,
      description: '',
      code: cluster.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }))
    writeStandardTSV(join(DATA_DIR, 'AdvanceCTE.CareerClusters.tsv'), clusterRecords)

    // Write Sub-Clusters
    const subClusterRecords: StandardRecord[] = Array.from(subClustersMap.values()).map(sc => ({
      ns: NS,
      type: 'SubCluster',
      id: toWikipediaStyleId(sc.name),
      name: sc.name,
      description: `Part of ${sc.parent}`,
      code: sc.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }))
    writeStandardTSV(join(DATA_DIR, 'AdvanceCTE.SubClusters.tsv'), subClusterRecords)

    // Write SubCluster -> CareerCluster relationships
    const clusterHierarchy: Record<string, string>[] = Array.from(subClustersMap.entries()).map(([key, sc]) => ({
      fromNs: NS,
      fromType: 'SubCluster',
      fromId: toWikipediaStyleId(sc.name),
      toNs: NS,
      toType: 'CareerCluster',
      toId: toWikipediaStyleId(sc.parent),
      relationshipType: 'child_of',
    }))
    writeTSV(
      join(REL_DIR, 'AdvanceCTE.SubCluster.CareerCluster.tsv'),
      clusterHierarchy,
      ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']
    )
  } catch (e) {
    console.log('Error processing Career Clusters:', e)
  }
}

function transformSOCCareerClusterCrosswalk(): void {
  console.log('Transforming SOC-CareerCluster Crosswalk...')

  try {
    const data = parseTSV<SOCCareerClusterRow>(join(SOURCE_DIR, 'AdvanceCTE.SOC-CareerClusters.SOC---CC---Sub-Clusters.tsv'))

    // Write SOC -> CareerCluster relationships
    const socClusterRels: Record<string, string>[] = []
    const seenSOCCluster = new Set<string>()

    for (const row of data) {
      if (!row.sOCCode || !row.careerCluster) continue

      const key = `${row.sOCCode}|${row.careerCluster}`
      if (!seenSOCCluster.has(key)) {
        seenSOCCluster.add(key)
        socClusterRels.push({
          fromNs: NAMESPACES.ONET,
          fromType: 'Occupation',
          fromCode: row.sOCCode,
          toNs: NS,
          toType: 'CareerCluster',
          toId: toWikipediaStyleId(row.careerCluster),
          relationshipType: 'belongs_to',
        })
      }
    }

    writeTSV(
      join(REL_DIR, 'SOC.CareerCluster.tsv'),
      socClusterRels,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toId', 'relationshipType']
    )

    // Write SOC -> SubCluster relationships
    const socSubClusterRels: Record<string, string>[] = []
    const seenSOCSubCluster = new Set<string>()

    for (const row of data) {
      if (!row.sOCCode || !row.subCluster) continue

      const key = `${row.sOCCode}|${row.subCluster}`
      if (!seenSOCSubCluster.has(key)) {
        seenSOCSubCluster.add(key)
        socSubClusterRels.push({
          fromNs: NAMESPACES.ONET,
          fromType: 'Occupation',
          fromCode: row.sOCCode,
          toNs: NS,
          toType: 'SubCluster',
          toId: toWikipediaStyleId(row.subCluster),
          relationshipType: 'belongs_to',
        })
      }
    }

    writeTSV(
      join(REL_DIR, 'SOC.SubCluster.tsv'),
      socSubClusterRels,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toId', 'relationshipType']
    )
  } catch (e) {
    console.log('Error processing SOC-CareerCluster crosswalk:', e)
  }
}

function transformCIPCareerClusterCrosswalk(): void {
  console.log('Transforming CIP-CareerCluster Crosswalk...')

  try {
    const data = parseTSV<CIPCareerClusterRow>(join(SOURCE_DIR, 'AdvanceCTE.CIP-CareerClusters.CIP---CC---Sub-Clusters.tsv'))

    // Write CIP programs as standardized records
    const cipMap = new Map<string, CIPCareerClusterRow>()
    for (const row of data) {
      const cipCode = row['cIPCode2020)']
      if (cipCode && !cipMap.has(cipCode)) {
        cipMap.set(cipCode, row)
      }
    }

    const cipRecords: StandardRecord[] = Array.from(cipMap.values()).map(row => ({
      ns: NS,
      type: 'CIP',
      id: toWikipediaStyleId(row['cIPTitle2020)'] || ''),
      name: row['cIPTitle2020)'] || '',
      description: '',
      code: row['cIPCode2020)'],
    }))
    writeStandardTSV(join(DATA_DIR, 'AdvanceCTE.CIP.tsv'), cipRecords)

    // Write CIP -> CareerCluster relationships
    const cipClusterRels: Record<string, string>[] = []
    const seenCIPCluster = new Set<string>()

    for (const row of data) {
      const cipCode = row['cIPCode2020)']
      if (!cipCode || !row.careerCluster) continue

      const key = `${cipCode}|${row.careerCluster}`
      if (!seenCIPCluster.has(key)) {
        seenCIPCluster.add(key)
        cipClusterRels.push({
          fromNs: NS,
          fromType: 'CIP',
          fromCode: cipCode,
          toNs: NS,
          toType: 'CareerCluster',
          toId: toWikipediaStyleId(row.careerCluster),
          relationshipType: 'prepares_for',
        })
      }
    }

    writeTSV(
      join(REL_DIR, 'CIP.CareerCluster.tsv'),
      cipClusterRels,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toId', 'relationshipType']
    )

    // Write CIP -> SubCluster relationships
    const cipSubClusterRels: Record<string, string>[] = []
    const seenCIPSubCluster = new Set<string>()

    for (const row of data) {
      const cipCode = row['cIPCode2020)']
      if (!cipCode || !row.subCluster) continue

      const key = `${cipCode}|${row.subCluster}`
      if (!seenCIPSubCluster.has(key)) {
        seenCIPSubCluster.add(key)
        cipSubClusterRels.push({
          fromNs: NS,
          fromType: 'CIP',
          fromCode: cipCode,
          toNs: NS,
          toType: 'SubCluster',
          toId: toWikipediaStyleId(row.subCluster),
          relationshipType: 'prepares_for',
        })
      }
    }

    writeTSV(
      join(REL_DIR, 'CIP.SubCluster.tsv'),
      cipSubClusterRels,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toId', 'relationshipType']
    )
  } catch (e) {
    console.log('Error processing CIP-CareerCluster crosswalk:', e)
  }
}

function transformFullCrosswalk(): void {
  console.log('Transforming Full Crosswalk (SOC-CIP-CC-NAICS)...')

  try {
    const data = parseTSV<FullCrosswalkRow>(join(SOURCE_DIR, 'AdvanceCTE.FullCrosswalk.SOC---CIP---CC.tsv'))

    // Write SOC-CIP relationships
    const socCipRels: Record<string, string>[] = []
    const seenSOCCIP = new Set<string>()

    for (const row of data) {
      const cipCode = row['cIPCode2020)']
      if (!row.sOCCode || !cipCode) continue

      const key = `${row.sOCCode}|${cipCode}`
      if (!seenSOCCIP.has(key)) {
        seenSOCCIP.add(key)
        socCipRels.push({
          fromNs: NAMESPACES.ONET,
          fromType: 'Occupation',
          fromCode: row.sOCCode,
          toNs: NS,
          toType: 'CIP',
          toCode: cipCode,
          relationshipType: 'trained_by',
        })
      }
    }

    writeTSV(
      join(REL_DIR, 'SOC.CIP.tsv'),
      socCipRels,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
    )

    // Write SOC-NAICS relationships
    const socNaicsRels: Record<string, string>[] = []
    const seenSOCNAICS = new Set<string>()

    for (const row of data) {
      const naicsCode = row['2DigitNAICS']
      if (!row.sOCCode || !naicsCode) continue

      const key = `${row.sOCCode}|${naicsCode}`
      if (!seenSOCNAICS.has(key)) {
        seenSOCNAICS.add(key)
        socNaicsRels.push({
          fromNs: NAMESPACES.ONET,
          fromType: 'Occupation',
          fromCode: row.sOCCode,
          toNs: NAMESPACES.NAICS,
          toType: 'Sector',
          toCode: naicsCode,
          relationshipType: 'employed_in',
        })
      }
    }

    writeTSV(
      join(REL_DIR, 'SOC.NAICS.tsv'),
      socNaicsRels,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
    )

    // Write CareerCluster-NAICS relationships
    const ccNaicsRels: Record<string, string>[] = []
    const seenCCNAICS = new Set<string>()

    for (const row of data) {
      const naicsCode = row['2DigitNAICS']
      if (!row.careerCluster || !naicsCode) continue

      const key = `${row.careerCluster}|${naicsCode}`
      if (!seenCCNAICS.has(key)) {
        seenCCNAICS.add(key)
        ccNaicsRels.push({
          fromNs: NS,
          fromType: 'CareerCluster',
          fromId: toWikipediaStyleId(row.careerCluster),
          toNs: NAMESPACES.NAICS,
          toType: 'Sector',
          toCode: naicsCode,
          relationshipType: 'associated_with',
        })
      }
    }

    writeTSV(
      join(REL_DIR, 'CareerCluster.NAICS.tsv'),
      ccNaicsRels,
      ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toCode', 'relationshipType']
    )
  } catch (e) {
    console.log('Error processing Full Crosswalk:', e)
  }
}

export async function transformAdvanceCTE(): Promise<void> {
  console.log('=== AdvanceCTE Transformation ===')
  ensureOutputDirs()

  transformCareerClusters()
  transformSOCCareerClusterCrosswalk()
  transformCIPCareerClusterCrosswalk()
  transformFullCrosswalk()

  console.log('=== AdvanceCTE Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformAdvanceCTE()
}
