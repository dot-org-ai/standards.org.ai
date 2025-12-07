import { join } from 'path'
import {
  NAMESPACES,
  parseTSV,
  writeStandardTSV,
  writeRelationshipTSV,
  writeTSV,
  toWikipediaStyleId,
  cleanDescription,
  getSourcePath,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
  type StandardRecord,
  type RelationshipRecord,
} from './utils'

const NS = NAMESPACES.ONET
const SOURCE_DIR = getSourcePath('ONET')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

interface OccupationData {
  oNETSOCCode: string
  title: string
  description: string
}

interface SkillData {
  oNETSOCCode: string
  elementID: string
  elementName: string
  scaleID: string
  dataValue: string
  n: string
  standardError: string
  lowerCIBound: string
  upperCIBound: string
  recommendSuppress: string
  notRelevant: string
  date: string
  domainSource: string
}

interface AlternateTitle {
  oNETSOCCode: string
  alternateTitle: string
  shortTitle: string
  source: string
}

interface RelatedOccupation {
  oNETSOCCode: string
  relatedONETSOCCode: string
  relatednessScore: string
}

interface TechnologySkill {
  oNETSOCCode: string
  example: string
  commodityCode: string
  commodityTitle: string
  hotTechnology: string
  inDemand: string
}

interface JobZone {
  oNETSOCCode: string
  jobZone: string
  date: string
  domainSource: string
}

function transformOccupations(): void {
  console.log('Transforming ONET Occupations...')
  const data = parseTSV<OccupationData>(join(SOURCE_DIR, 'ONET.OccupationData.tsv'))

  const records: StandardRecord[] = data.map(row => ({
    ns: NS,
    type: 'Occupation',
    id: toWikipediaStyleId(row.title),
    name: row.title,
    description: cleanDescription(row.description),
    code: row.oNETSOCCode,
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.Occupations.tsv'), records)
}

function transformSkills(): void {
  console.log('Transforming ONET Skills...')
  const data = parseTSV<SkillData>(join(SOURCE_DIR, 'ONET.Skills.tsv'))

  // Get unique skills
  const skillsMap = new Map<string, { id: string; name: string }>()
  for (const row of data) {
    if (!skillsMap.has(row.elementID)) {
      skillsMap.set(row.elementID, {
        id: row.elementID,
        name: row.elementName,
      })
    }
  }

  const records: StandardRecord[] = Array.from(skillsMap.values()).map(skill => ({
    ns: NS,
    type: 'Skill',
    id: toWikipediaStyleId(skill.name),
    name: skill.name,
    description: '',
    code: skill.id,
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.Skills.tsv'), records)

  // Write occupation-skill relationships with ratings
  const relationships: Record<string, string>[] = data
    .filter(row => row.scaleID === 'IM') // Importance scale
    .map(row => ({
      fromNs: NS,
      fromType: 'Occupation',
      fromCode: row.oNETSOCCode,
      toNs: NS,
      toType: 'Skill',
      toCode: row.elementID,
      relationshipType: 'requires_skill',
      importance: row.dataValue,
    }))

  writeTSV(
    join(REL_DIR, 'ONET.Occupation.Skill.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType', 'importance']
  )
}

function transformKnowledge(): void {
  console.log('Transforming ONET Knowledge...')
  const data = parseTSV<SkillData>(join(SOURCE_DIR, 'ONET.Knowledge.tsv'))

  // Get unique knowledge areas
  const knowledgeMap = new Map<string, { id: string; name: string }>()
  for (const row of data) {
    if (!knowledgeMap.has(row.elementID)) {
      knowledgeMap.set(row.elementID, {
        id: row.elementID,
        name: row.elementName,
      })
    }
  }

  const records: StandardRecord[] = Array.from(knowledgeMap.values()).map(k => ({
    ns: NS,
    type: 'Knowledge',
    id: toWikipediaStyleId(k.name),
    name: k.name,
    description: '',
    code: k.id,
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.Knowledge.tsv'), records)

  // Write occupation-knowledge relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.scaleID === 'IM')
    .map(row => ({
      fromNs: NS,
      fromType: 'Occupation',
      fromCode: row.oNETSOCCode,
      toNs: NS,
      toType: 'Knowledge',
      toCode: row.elementID,
      relationshipType: 'requires_knowledge',
      importance: row.dataValue,
    }))

  writeTSV(
    join(REL_DIR, 'ONET.Occupation.Knowledge.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType', 'importance']
  )
}

function transformAbilities(): void {
  console.log('Transforming ONET Abilities...')
  const data = parseTSV<SkillData>(join(SOURCE_DIR, 'ONET.Abilities.tsv'))

  // Get unique abilities
  const abilitiesMap = new Map<string, { id: string; name: string }>()
  for (const row of data) {
    if (!abilitiesMap.has(row.elementID)) {
      abilitiesMap.set(row.elementID, {
        id: row.elementID,
        name: row.elementName,
      })
    }
  }

  const records: StandardRecord[] = Array.from(abilitiesMap.values()).map(a => ({
    ns: NS,
    type: 'Ability',
    id: toWikipediaStyleId(a.name),
    name: a.name,
    description: '',
    code: a.id,
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.Abilities.tsv'), records)

  // Write occupation-ability relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.scaleID === 'IM')
    .map(row => ({
      fromNs: NS,
      fromType: 'Occupation',
      fromCode: row.oNETSOCCode,
      toNs: NS,
      toType: 'Ability',
      toCode: row.elementID,
      relationshipType: 'requires_ability',
      importance: row.dataValue,
    }))

  writeTSV(
    join(REL_DIR, 'ONET.Occupation.Ability.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType', 'importance']
  )
}

function transformWorkActivities(): void {
  console.log('Transforming ONET Work Activities...')
  const data = parseTSV<SkillData>(join(SOURCE_DIR, 'ONET.WorkActivities.tsv'))

  // Get unique work activities
  const activitiesMap = new Map<string, { id: string; name: string }>()
  for (const row of data) {
    if (!activitiesMap.has(row.elementID)) {
      activitiesMap.set(row.elementID, {
        id: row.elementID,
        name: row.elementName,
      })
    }
  }

  const records: StandardRecord[] = Array.from(activitiesMap.values()).map(a => ({
    ns: NS,
    type: 'WorkActivity',
    id: toWikipediaStyleId(a.name),
    name: a.name,
    description: '',
    code: a.id,
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.WorkActivities.tsv'), records)

  // Write occupation-work activity relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.scaleID === 'IM')
    .map(row => ({
      fromNs: NS,
      fromType: 'Occupation',
      fromCode: row.oNETSOCCode,
      toNs: NS,
      toType: 'WorkActivity',
      toCode: row.elementID,
      relationshipType: 'involves_activity',
      importance: row.dataValue,
    }))

  writeTSV(
    join(REL_DIR, 'ONET.Occupation.WorkActivity.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType', 'importance']
  )
}

function transformWorkStyles(): void {
  console.log('Transforming ONET Work Styles...')
  const data = parseTSV<SkillData>(join(SOURCE_DIR, 'ONET.WorkStyles.tsv'))

  // Get unique work styles
  const stylesMap = new Map<string, { id: string; name: string }>()
  for (const row of data) {
    if (!stylesMap.has(row.elementID)) {
      stylesMap.set(row.elementID, {
        id: row.elementID,
        name: row.elementName,
      })
    }
  }

  const records: StandardRecord[] = Array.from(stylesMap.values()).map(s => ({
    ns: NS,
    type: 'WorkStyle',
    id: toWikipediaStyleId(s.name),
    name: s.name,
    description: '',
    code: s.id,
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.WorkStyles.tsv'), records)

  // Write occupation-work style relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.scaleID === 'IM')
    .map(row => ({
      fromNs: NS,
      fromType: 'Occupation',
      fromCode: row.oNETSOCCode,
      toNs: NS,
      toType: 'WorkStyle',
      toCode: row.elementID,
      relationshipType: 'requires_style',
      importance: row.dataValue,
    }))

  writeTSV(
    join(REL_DIR, 'ONET.Occupation.WorkStyle.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType', 'importance']
  )
}

function transformWorkValues(): void {
  console.log('Transforming ONET Work Values...')
  const data = parseTSV<SkillData>(join(SOURCE_DIR, 'ONET.WorkValues.tsv'))

  // Get unique work values
  const valuesMap = new Map<string, { id: string; name: string }>()
  for (const row of data) {
    if (!valuesMap.has(row.elementID)) {
      valuesMap.set(row.elementID, {
        id: row.elementID,
        name: row.elementName,
      })
    }
  }

  const records: StandardRecord[] = Array.from(valuesMap.values()).map(v => ({
    ns: NS,
    type: 'WorkValue',
    id: toWikipediaStyleId(v.name),
    name: v.name,
    description: '',
    code: v.id,
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.WorkValues.tsv'), records)

  // Write occupation-work value relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.scaleID === 'EX') // Extent scale for work values
    .map(row => ({
      fromNs: NS,
      fromType: 'Occupation',
      fromCode: row.oNETSOCCode,
      toNs: NS,
      toType: 'WorkValue',
      toCode: row.elementID,
      relationshipType: 'values',
      extent: row.dataValue,
    }))

  writeTSV(
    join(REL_DIR, 'ONET.Occupation.WorkValue.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType', 'extent']
  )
}

function transformInterests(): void {
  console.log('Transforming ONET Interests...')
  const data = parseTSV<SkillData>(join(SOURCE_DIR, 'ONET.Interests.tsv'))

  // Get unique interests (RIASEC)
  const interestsMap = new Map<string, { id: string; name: string }>()
  for (const row of data) {
    if (!interestsMap.has(row.elementID)) {
      interestsMap.set(row.elementID, {
        id: row.elementID,
        name: row.elementName,
      })
    }
  }

  const records: StandardRecord[] = Array.from(interestsMap.values()).map(i => ({
    ns: NS,
    type: 'Interest',
    id: toWikipediaStyleId(i.name),
    name: i.name,
    description: '',
    code: i.id,
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.Interests.tsv'), records)

  // Write occupation-interest relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.scaleID === 'OI') // Occupational Interest
    .map(row => ({
      fromNs: NS,
      fromType: 'Occupation',
      fromCode: row.oNETSOCCode,
      toNs: NS,
      toType: 'Interest',
      toCode: row.elementID,
      relationshipType: 'associated_interest',
      score: row.dataValue,
    }))

  writeTSV(
    join(REL_DIR, 'ONET.Occupation.Interest.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType', 'score']
  )
}

function transformTechnologySkills(): void {
  console.log('Transforming ONET Technology Skills...')
  const data = parseTSV<TechnologySkill>(join(SOURCE_DIR, 'ONET.TechnologySkills.tsv'))

  // Get unique technology examples by name
  const techMap = new Map<string, { name: string; commodityCode: string; commodityTitle: string }>()
  for (const row of data) {
    if (row.example && !techMap.has(row.example)) {
      techMap.set(row.example, {
        name: row.example,
        commodityCode: row.commodityCode,
        commodityTitle: row.commodityTitle,
      })
    }
  }

  const records: StandardRecord[] = Array.from(techMap.values()).map(t => ({
    ns: NS,
    type: 'Technology',
    id: toWikipediaStyleId(t.name),
    name: t.name,
    description: t.commodityTitle,
    code: t.commodityCode,
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.Technologies.tsv'), records)

  // Write occupation-technology relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.example)
    .map(row => ({
      fromNs: NS,
      fromType: 'Occupation',
      fromCode: row.oNETSOCCode,
      toNs: NS,
      toType: 'Technology',
      toId: toWikipediaStyleId(row.example),
      relationshipType: 'uses_technology',
      hotTechnology: row.hotTechnology,
      inDemand: row.inDemand,
    }))

  writeTSV(
    join(REL_DIR, 'ONET.Occupation.Technology.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toId', 'relationshipType', 'hotTechnology', 'inDemand']
  )
}

function transformJobZones(): void {
  console.log('Transforming ONET Job Zones...')
  const data = parseTSV<JobZone>(join(SOURCE_DIR, 'ONET.JobZones.tsv'))

  // Job Zone descriptions
  const jobZoneDescriptions: Record<string, string> = {
    '1': 'Little or No Preparation Needed',
    '2': 'Some Preparation Needed',
    '3': 'Medium Preparation Needed',
    '4': 'Considerable Preparation Needed',
    '5': 'Extensive Preparation Needed',
  }

  // Get unique job zones
  const zonesSet = new Set<string>()
  for (const row of data) {
    if (row.jobZone) {
      zonesSet.add(row.jobZone)
    }
  }

  const records: StandardRecord[] = Array.from(zonesSet).map(zone => ({
    ns: NS,
    type: 'JobZone',
    id: `Job_Zone_${zone}`,
    name: `Job Zone ${zone}`,
    description: jobZoneDescriptions[zone] || '',
    code: zone,
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.JobZones.tsv'), records)

  // Write occupation-job zone relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.jobZone)
    .map(row => ({
      fromNs: NS,
      fromType: 'Occupation',
      fromCode: row.oNETSOCCode,
      toNs: NS,
      toType: 'JobZone',
      toCode: row.jobZone,
      relationshipType: 'in_job_zone',
    }))

  writeTSV(
    join(REL_DIR, 'ONET.Occupation.JobZone.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
  )
}

function transformRelatedOccupations(): void {
  console.log('Transforming ONET Related Occupations...')
  const data = parseTSV<RelatedOccupation>(join(SOURCE_DIR, 'ONET.RelatedOccupations.tsv'))

  const relationships: Record<string, string>[] = data.map(row => ({
    fromNs: NS,
    fromType: 'Occupation',
    fromCode: row.oNETSOCCode,
    toNs: NS,
    toType: 'Occupation',
    toCode: row.relatedONETSOCCode,
    relationshipType: 'related_to',
    relatednessScore: row.relatednessScore,
  }))

  writeTSV(
    join(REL_DIR, 'ONET.Occupation.Occupation.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType', 'relatednessScore']
  )
}

function transformAlternateTitles(): void {
  console.log('Transforming ONET Alternate Titles...')
  const data = parseTSV<AlternateTitle>(join(SOURCE_DIR, 'ONET.AlternateTitles.tsv'))

  const records: StandardRecord[] = data
    .filter(row => row.alternateTitle)
    .map(row => ({
      ns: NS,
      type: 'AlternateTitle',
      id: toWikipediaStyleId(row.alternateTitle),
      name: row.alternateTitle,
      description: row.shortTitle || '',
      code: row.oNETSOCCode,
    }))

  writeStandardTSV(join(DATA_DIR, 'ONET.AlternateTitles.tsv'), records)
}

export async function transformONET(): Promise<void> {
  console.log('=== ONET Transformation ===')
  ensureOutputDirs()

  transformOccupations()
  transformSkills()
  transformKnowledge()
  transformAbilities()
  transformWorkActivities()
  transformWorkStyles()
  transformWorkValues()
  transformInterests()
  transformTechnologySkills()
  transformJobZones()
  transformRelatedOccupations()
  transformAlternateTitles()

  console.log('=== ONET Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformONET()
}
