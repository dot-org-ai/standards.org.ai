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
  getAggregationsForType,
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

interface TaskData {
  oNETSOCCode: string
  taskID: string
  task: string
  taskType: string
  incumbents: string
  date: string
  domainSource: string
}

interface ReportedTitle {
  oNETSOCCode: string
  reportedJobTitle: string
}

interface ToolData {
  oNETSOCCode: string
  example: string
  commodityCode: string
  commodityTitle: string
}

interface DWAData {
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

interface WorkContextData {
  oNETSOCCode: string
  elementID: string
  elementName: string
  scaleID: string
  category: string
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

interface EducationData {
  oNETSOCCode: string
  elementID: string
  elementName: string
  scaleID: string
  category: string
  dataValue: string
  n: string
  standardError: string
  lowerCIBound: string
  upperCIBound: string
  recommendSuppress: string
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
    includedIn: getAggregationsForType('Occupation'),
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
    includedIn: getAggregationsForType('Skill'),
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
    includedIn: getAggregationsForType('Knowledge'),
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
    includedIn: getAggregationsForType('Ability'),
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

function transformTasks(): void {
  console.log('Transforming ONET Tasks...')
  const data = parseTSV<TaskData>(join(SOURCE_DIR, 'ONET.TaskStatements.tsv'))

  const records: StandardRecord[] = data
    .filter(row => row.taskID && row.task)
    .map(row => ({
      ns: NS,
      type: 'Task',
      id: row.taskID,
      name: row.task.substring(0, 100) + (row.task.length > 100 ? '...' : ''),
      description: cleanDescription(row.task),
      code: row.taskID,
    }))

  writeStandardTSV(join(DATA_DIR, 'ONET.Tasks.tsv'), records)

  // Write occupation-task relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.taskID && row.oNETSOCCode)
    .map(row => ({
      fromNs: NS,
      fromType: 'Occupation',
      fromCode: row.oNETSOCCode,
      toNs: NS,
      toType: 'Task',
      toCode: row.taskID,
      relationshipType: 'performs_task',
      taskType: row.taskType || '',
    }))

  writeTSV(
    join(REL_DIR, 'ONET.Occupation.Task.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType', 'taskType']
  )
}

function transformReportedTitles(): void {
  console.log('Transforming ONET Reported Titles...')
  const data = parseTSV<ReportedTitle>(join(SOURCE_DIR, 'ONET.SampleOfReportedTitles.tsv'))

  const records: StandardRecord[] = data
    .filter(row => row.reportedJobTitle)
    .map(row => ({
      ns: NS,
      type: 'ReportedTitle',
      id: toWikipediaStyleId(row.reportedJobTitle),
      name: row.reportedJobTitle,
      description: '',
      code: row.oNETSOCCode,
    }))

  writeStandardTSV(join(DATA_DIR, 'ONET.ReportedTitles.tsv'), records)
}

function transformTools(): void {
  console.log('Transforming ONET Tools...')
  const data = parseTSV<ToolData>(join(SOURCE_DIR, 'ONET.ToolsUsed.tsv'))

  // Get unique tools
  const toolsMap = new Map<string, ToolData>()
  for (const row of data) {
    if (row.example && !toolsMap.has(row.example)) {
      toolsMap.set(row.example, row)
    }
  }

  const records: StandardRecord[] = Array.from(toolsMap.values()).map(t => ({
    ns: NS,
    type: 'Tool',
    id: toWikipediaStyleId(t.example),
    name: t.example,
    description: t.commodityTitle || '',
    code: t.commodityCode,
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.Tools.tsv'), records)

  // Write occupation-tool relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.example && row.oNETSOCCode)
    .map(row => ({
      fromNs: NS,
      fromType: 'Occupation',
      fromCode: row.oNETSOCCode,
      toNs: NS,
      toType: 'Tool',
      toId: toWikipediaStyleId(row.example),
      relationshipType: 'uses_tool',
    }))

  writeTSV(
    join(REL_DIR, 'ONET.Occupation.Tool.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toId', 'relationshipType']
  )
}

function transformDWA(): void {
  console.log('Transforming ONET Detailed Work Activities...')

  // Read DWA reference to get DWA definitions
  interface DWAReference {
    elementID: string
    iWAID: string
    dWAID: string
    dWATitle: string
  }
  const dwaRef = parseTSV<DWAReference>(join(SOURCE_DIR, 'ONET.DWAReference.tsv'))

  // Get unique DWAs
  const dwaMap = new Map<string, { id: string; name: string }>()
  for (const row of dwaRef) {
    if (row.dWAID && row.dWATitle && !dwaMap.has(row.dWAID)) {
      dwaMap.set(row.dWAID, {
        id: row.dWAID,
        name: row.dWATitle,
      })
    }
  }

  const records: StandardRecord[] = Array.from(dwaMap.values()).map(dwa => ({
    ns: NS,
    type: 'DWA',
    id: toWikipediaStyleId(dwa.name),
    name: dwa.name,
    description: '',
    code: dwa.id,
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.DWA.tsv'), records)
}

function transformIWA(): void {
  console.log('Transforming ONET Intermediate Work Activities...')

  // Read IWA reference to get IWA definitions
  interface IWAReference {
    elementID: string
    iWAID: string
    iWATitle: string
  }
  const iwaRef = parseTSV<IWAReference>(join(SOURCE_DIR, 'ONET.IWAReference.tsv'))

  // Get unique IWAs
  const iwaMap = new Map<string, { id: string; name: string }>()
  for (const row of iwaRef) {
    if (row.iWAID && row.iWATitle && !iwaMap.has(row.iWAID)) {
      iwaMap.set(row.iWAID, {
        id: row.iWAID,
        name: row.iWATitle,
      })
    }
  }

  const records: StandardRecord[] = Array.from(iwaMap.values()).map(iwa => ({
    ns: NS,
    type: 'IWA',
    id: toWikipediaStyleId(iwa.name),
    name: iwa.name,
    description: '',
    code: iwa.id,
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.IWA.tsv'), records)
}

function transformWorkContext(): void {
  console.log('Transforming ONET Work Context...')
  const data = parseTSV<WorkContextData>(join(SOURCE_DIR, 'ONET.WorkContext.tsv'))

  // Get unique work context elements
  const contextMap = new Map<string, { id: string; name: string; category: string }>()
  const categorySet = new Set<string>()

  for (const row of data) {
    if (!contextMap.has(row.elementID)) {
      contextMap.set(row.elementID, {
        id: row.elementID,
        name: row.elementName,
        category: row.category,
      })
    }
    if (row.category) {
      categorySet.add(row.category)
    }
  }

  const records: StandardRecord[] = Array.from(contextMap.values()).map(ctx => ({
    ns: NS,
    type: 'WorkContext',
    id: toWikipediaStyleId(ctx.name),
    name: ctx.name,
    description: `Category: ${ctx.category}`,
    code: ctx.id,
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.WorkContext.tsv'), records)

  // Write work context categories
  const categoryRecords: StandardRecord[] = Array.from(categorySet).map(cat => ({
    ns: NS,
    type: 'WorkContextCategory',
    id: toWikipediaStyleId(cat),
    name: cat,
    description: '',
    code: cat.toLowerCase().replace(/\s+/g, '-'),
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.WorkContextCategories.tsv'), categoryRecords)

  // Write occupation-work context relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.scaleID === 'CX')
    .map(row => ({
      fromNs: NS,
      fromType: 'Occupation',
      fromCode: row.oNETSOCCode,
      toNs: NS,
      toType: 'WorkContext',
      toCode: row.elementID,
      relationshipType: 'has_context',
      context: row.dataValue,
    }))

  writeTSV(
    join(REL_DIR, 'ONET.Occupation.WorkContext.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType', 'context']
  )
}

function transformEducation(): void {
  console.log('Transforming ONET Education...')
  const data = parseTSV<EducationData>(join(SOURCE_DIR, 'ONET.EducationTrainingAndExperience.tsv'))

  // Get unique education/training elements
  const eduMap = new Map<string, { id: string; name: string }>()
  for (const row of data) {
    if (row.elementID && row.elementName && !eduMap.has(row.elementID)) {
      eduMap.set(row.elementID, {
        id: row.elementID,
        name: row.elementName,
      })
    }
  }

  const records: StandardRecord[] = Array.from(eduMap.values()).map(edu => ({
    ns: NS,
    type: 'Education',
    id: toWikipediaStyleId(edu.name),
    name: edu.name,
    description: '',
    code: edu.id,
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.Education.tsv'), records)

  // Write occupation-education relationships
  const relationships: Record<string, string>[] = data
    .filter(row => row.elementID && row.oNETSOCCode && row.scaleID === 'RL')
    .map(row => ({
      fromNs: NS,
      fromType: 'Occupation',
      fromCode: row.oNETSOCCode,
      toNs: NS,
      toType: 'Education',
      toCode: row.elementID,
      relationshipType: 'requires_education',
      category: row.category || '',
      value: row.dataValue || '',
    }))

  writeTSV(
    join(REL_DIR, 'ONET.Occupation.Education.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType', 'category', 'value']
  )
}

function transformScales(): void {
  console.log('Transforming ONET Scales...')

  // Define common ONET scales
  const scales = [
    { id: 'IM', name: 'Importance', description: 'How important is this element to the occupation?' },
    { id: 'LV', name: 'Level', description: 'What level of this element is needed to perform this occupation?' },
    { id: 'EX', name: 'Extent', description: 'To what extent does this element apply to the occupation?' },
    { id: 'RL', name: 'Relevance', description: 'How relevant is this element to the occupation?' },
    { id: 'CX', name: 'Context', description: 'Work context frequency or importance' },
    { id: 'OI', name: 'Occupational Interest', description: 'Occupational interest profile' },
  ]

  const records: StandardRecord[] = scales.map(scale => ({
    ns: NS,
    type: 'Scale',
    id: scale.id,
    name: scale.name,
    description: cleanDescription(scale.description),
    code: scale.id,
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.Scales.tsv'), records)
}

function transformRIASEC(): void {
  console.log('Transforming ONET RIASEC...')

  // RIASEC personality types
  const riasec = [
    { code: 'R', name: 'Realistic', description: 'Practical, physical, hands-on, tool-oriented' },
    { code: 'I', name: 'Investigative', description: 'Analytical, intellectual, scientific, explorative' },
    { code: 'A', name: 'Artistic', description: 'Creative, original, independent, chaotic' },
    { code: 'S', name: 'Social', description: 'Cooperative, supporting, helping, healing/nurturing' },
    { code: 'E', name: 'Enterprising', description: 'Competitive, leadership, persuasive, status-oriented' },
    { code: 'C', name: 'Conventional', description: 'Detail-oriented, organized, clerical' },
  ]

  const records: StandardRecord[] = riasec.map(type => ({
    ns: NS,
    type: 'RIASEC',
    id: type.name,
    name: type.name,
    description: cleanDescription(type.description),
    code: type.code,
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.RIASEC.tsv'), records)
}

function transformTaskCategories(): void {
  console.log('Transforming ONET Task Categories...')
  const data = parseTSV<TaskData>(join(SOURCE_DIR, 'ONET.TaskStatements.tsv'))

  // Get unique task types
  const categorySet = new Set<string>()
  for (const row of data) {
    if (row.taskType) {
      categorySet.add(row.taskType)
    }
  }

  const records: StandardRecord[] = Array.from(categorySet).map(cat => ({
    ns: NS,
    type: 'TaskCategory',
    id: toWikipediaStyleId(cat),
    name: cat,
    description: '',
    code: cat.toLowerCase().replace(/\s+/g, '-'),
  }))

  writeStandardTSV(join(DATA_DIR, 'ONET.TaskCategories.tsv'), records)
}

function transformEmergingTasks(): void {
  console.log('Transforming ONET Emerging Tasks...')

  try {
    const data = parseTSV<TaskData>(join(SOURCE_DIR, 'ONET.EmergingTasks.tsv'))

    const records: StandardRecord[] = data
      .filter(row => row.taskID && row.task)
      .map(row => ({
        ns: NS,
        type: 'EmergingTask',
        id: row.taskID,
        name: row.task.substring(0, 100) + (row.task.length > 100 ? '...' : ''),
        description: cleanDescription(row.task),
        code: row.taskID,
      }))

    writeStandardTSV(join(DATA_DIR, 'ONET.EmergingTasks.tsv'), records)

    // Write occupation-emerging task relationships
    const relationships: Record<string, string>[] = data
      .filter(row => row.taskID && row.oNETSOCCode)
      .map(row => ({
        fromNs: NS,
        fromType: 'Occupation',
        fromCode: row.oNETSOCCode,
        toNs: NS,
        toType: 'EmergingTask',
        toCode: row.taskID,
        relationshipType: 'has_emerging_task',
      }))

    writeTSV(
      join(REL_DIR, 'ONET.Occupation.EmergingTask.tsv'),
      relationships,
      ['fromNs', 'fromType', 'fromCode', 'toNs', 'toType', 'toCode', 'relationshipType']
    )
  } catch (e) {
    console.log('Emerging tasks file not found, skipping...')
  }
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
  transformTasks()
  transformReportedTitles()
  transformTools()
  transformDWA()
  transformIWA()
  transformWorkContext()
  transformEducation()
  transformScales()
  transformRIASEC()
  transformTaskCategories()
  transformEmergingTasks()

  console.log('=== ONET Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformONET()
}
