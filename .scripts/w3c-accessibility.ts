/**
 * W3C Accessibility Standards Transformation Script
 * Fetches and transforms WCAG and ARIA data into standard TSV format
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import {
  NAMESPACES,
  StandardRecord,
  RelationshipRecord,
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
} from './utils'

const NS = NAMESPACES.W3C
const SOURCE_DIR = getSourcePath('W3C')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// WCAG JSON Structure
interface WCAGPrinciple {
  id: string
  num: string
  handle: string
  title: string
  guidelines: WCAGGuideline[]
}

interface WCAGGuideline {
  id: string
  num: string
  handle: string
  title: string
  successcriteria: WCAGSuccessCriterion[]
}

interface WCAGSuccessCriterion {
  id: string
  num: string
  handle: string
  title: string
  level: string
  content: string
  techniques?: {
    sufficient?: Array<{ id: string; title: string } | { situations: Array<{ title: string; techniques: Array<{ id: string; title: string }> }> }>
    advisory?: Array<{ id: string; title: string }>
    failure?: Array<{ id: string; title: string }>
  }
}

interface WCAGData {
  principles: WCAGPrinciple[]
}

// ARIA Data Structures (parsed from HTML spec)
interface ARIARole {
  name: string
  type: string
  description: string
  requiredStates?: string[]
  supportedStates?: string[]
  superclassRoles?: string[]
}

interface ARIAAttribute {
  name: string
  type: 'state' | 'property'
  valueType: string
  defaultValue?: string
  description: string
}

// Technique types extracted from IDs
const TECHNIQUE_TYPES: Record<string, string> = {
  'ARIA': 'ARIA Technique',
  'C': 'CSS Technique',
  'F': 'Common Failure',
  'FLASH': 'Flash Technique',
  'G': 'General Technique',
  'H': 'HTML Technique',
  'PDF': 'PDF Technique',
  'SCR': 'Client-side Scripting',
  'SL': 'Silverlight Technique',
  'SM': 'SMIL Technique',
  'SVR': 'Server-side Technique',
  'T': 'Plain Text Technique',
}

/**
 * Fetch JSON data from a URL with caching
 */
async function fetchJSON<T>(url: string, cacheFile: string): Promise<T> {
  const cachePath = join(SOURCE_DIR, cacheFile)

  // Check cache first
  if (existsSync(cachePath)) {
    console.log(`Using cached data: ${cacheFile}`)
    const content = readFileSync(cachePath, 'utf-8')
    return JSON.parse(content)
  }

  console.log(`Fetching: ${url}`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
  }

  const data = await response.json()

  // Cache the response
  if (!existsSync(SOURCE_DIR)) {
    mkdirSync(SOURCE_DIR, { recursive: true })
  }
  writeFileSync(cachePath, JSON.stringify(data, null, 2), 'utf-8')

  return data
}

/**
 * Extract technique type from ID
 */
function getTechniqueType(id: string): string {
  const match = id.match(/^([A-Z]+)\d+/)
  if (match) {
    const prefix = match[1]
    return TECHNIQUE_TYPES[prefix] || 'Other'
  }
  return 'Other'
}

/**
 * Extract technology from technique ID
 */
function getTechniqueTechnology(id: string): string {
  const match = id.match(/^([A-Z]+)\d+/)
  if (match) {
    const prefix = match[1]
    switch (prefix) {
      case 'ARIA': return 'ARIA'
      case 'C': return 'CSS'
      case 'F': return 'General'
      case 'FLASH': return 'Flash'
      case 'G': return 'General'
      case 'H': return 'HTML'
      case 'PDF': return 'PDF'
      case 'SCR': return 'JavaScript'
      case 'SL': return 'Silverlight'
      case 'SM': return 'SMIL'
      case 'SVR': return 'Server-side'
      case 'T': return 'Text'
      default: return 'Other'
    }
  }
  return 'Other'
}

/**
 * Clean HTML content to plain text
 */
function cleanHTMLContent(html: string): string {
  if (!html) return ''

  return html
    // Remove HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Transform WCAG Principles
 */
function transformWCAGPrinciples(data: WCAGData): void {
  console.log('Transforming WCAG Principles...')

  const records: StandardRecord[] = data.principles.map(principle => ({
    ns: NS,
    type: 'WCAG.Principle',
    id: toWikipediaStyleId(principle.title),
    name: principle.title,
    description: cleanDescription(`Principle ${principle.num}: ${principle.title}`),
    code: principle.num,
    includedIn: getAggregationsForType('Guideline'),
  }))

  writeStandardTSV(join(DATA_DIR, 'W3C.WCAG.Principles.tsv'), records)
}

/**
 * Transform WCAG Guidelines
 */
function transformWCAGGuidelines(data: WCAGData): void {
  console.log('Transforming WCAG Guidelines...')

  const records: StandardRecord[] = []
  const relationships: RelationshipRecord[] = []

  for (const principle of data.principles) {
    for (const guideline of principle.guidelines) {
      records.push({
        ns: NS,
        type: 'WCAG.Guideline',
        id: toWikipediaStyleId(guideline.title),
        name: guideline.title,
        description: cleanDescription(`Guideline ${guideline.num}: ${guideline.title}`),
        code: guideline.num,
        includedIn: getAggregationsForType('Guideline'),
      })

      // Relationship to principle
      relationships.push({
        fromNs: NS,
        fromType: 'WCAG.Guideline',
        fromId: toWikipediaStyleId(guideline.title),
        toNs: NS,
        toType: 'WCAG.Principle',
        toId: toWikipediaStyleId(principle.title),
        relationshipType: 'partOf',
      })
    }
  }

  writeStandardTSV(join(DATA_DIR, 'W3C.WCAG.Guidelines.tsv'), records)
  writeRelationshipTSV(join(REL_DIR, 'WCAG.Guideline.Principle.tsv'), relationships)
}

/**
 * Transform WCAG Success Criteria
 */
function transformWCAGSuccessCriteria(data: WCAGData): void {
  console.log('Transforming WCAG Success Criteria...')

  const records: StandardRecord[] = []
  const relationships: RelationshipRecord[] = []

  for (const principle of data.principles) {
    for (const guideline of principle.guidelines) {
      for (const criterion of guideline.successcriteria) {
        const description = cleanHTMLContent(criterion.content)

        records.push({
          ns: NS,
          type: 'WCAG.SuccessCriterion',
          id: toWikipediaStyleId(criterion.title),
          name: criterion.title,
          description: cleanDescription(description),
          code: criterion.num,
          includedIn: getAggregationsForType('Guideline'),
        })

        // Relationship to guideline
        relationships.push({
          fromNs: NS,
          fromType: 'WCAG.SuccessCriterion',
          fromId: toWikipediaStyleId(criterion.title),
          toNs: NS,
          toType: 'WCAG.Guideline',
          toId: toWikipediaStyleId(guideline.title),
          relationshipType: 'partOf',
        })
      }
    }
  }

  writeStandardTSV(join(DATA_DIR, 'W3C.WCAG.SuccessCriteria.tsv'), records)
  writeRelationshipTSV(join(REL_DIR, 'WCAG.SuccessCriterion.Guideline.tsv'), relationships)

  // Write additional metadata with levels
  const criteriaWithLevels: Record<string, string>[] = []
  for (const principle of data.principles) {
    for (const guideline of principle.guidelines) {
      for (const criterion of guideline.successcriteria) {
        criteriaWithLevels.push({
          ns: NS,
          type: 'WCAG.SuccessCriterion',
          id: toWikipediaStyleId(criterion.title),
          code: criterion.num,
          name: criterion.title,
          level: criterion.level,
          guidelineCode: guideline.num,
          principleCode: principle.num,
        })
      }
    }
  }

  writeTSV(
    join(DATA_DIR, 'W3C.WCAG.SuccessCriteria.Levels.tsv'),
    criteriaWithLevels,
    ['ns', 'type', 'id', 'code', 'name', 'level', 'guidelineCode', 'principleCode']
  )
}

/**
 * Transform WCAG Techniques
 */
function transformWCAGTechniques(data: WCAGData): void {
  console.log('Transforming WCAG Techniques...')

  const techniquesMap = new Map<string, { id: string; title: string }>()
  const relationships: Record<string, string>[] = []

  // Extract all techniques from success criteria
  for (const principle of data.principles) {
    for (const guideline of principle.guidelines) {
      for (const criterion of guideline.successcriteria) {
        if (!criterion.techniques) continue

        const criterionId = toWikipediaStyleId(criterion.title)

        // Process sufficient techniques
        if (criterion.techniques.sufficient) {
          for (const item of criterion.techniques.sufficient) {
            // Handle direct techniques
            if ('id' in item && item.id) {
              techniquesMap.set(item.id, { id: item.id, title: item.title || '' })
              relationships.push({
                fromNs: NS,
                fromType: 'WCAG.Technique',
                fromId: item.id,
                toNs: NS,
                toType: 'WCAG.SuccessCriterion',
                toId: criterionId,
                relationshipType: 'sufficientFor',
                techniqueCategory: 'Sufficient',
              })
            }

            // Handle situational techniques
            if ('situations' in item && item.situations) {
              for (const situation of item.situations) {
                if (situation.techniques) {
                  for (const tech of situation.techniques) {
                    if (tech.id) {
                      techniquesMap.set(tech.id, { id: tech.id, title: tech.title || '' })
                      relationships.push({
                        fromNs: NS,
                        fromType: 'WCAG.Technique',
                        fromId: tech.id,
                        toNs: NS,
                        toType: 'WCAG.SuccessCriterion',
                        toId: criterionId,
                        relationshipType: 'sufficientFor',
                        techniqueCategory: 'Sufficient',
                        situation: situation.title || '',
                      })
                    }
                  }
                }
              }
            }
          }
        }

        // Process advisory techniques
        if (criterion.techniques.advisory) {
          for (const tech of criterion.techniques.advisory) {
            if (tech.id) {
              techniquesMap.set(tech.id, { id: tech.id, title: tech.title || '' })
              relationships.push({
                fromNs: NS,
                fromType: 'WCAG.Technique',
                fromId: tech.id,
                toNs: NS,
                toType: 'WCAG.SuccessCriterion',
                toId: criterionId,
                relationshipType: 'advisoryFor',
                techniqueCategory: 'Advisory',
              })
            }
          }
        }

        // Process failure techniques
        if (criterion.techniques.failure) {
          for (const tech of criterion.techniques.failure) {
            if (tech.id) {
              techniquesMap.set(tech.id, { id: tech.id, title: tech.title || '' })
              relationships.push({
                fromNs: NS,
                fromType: 'WCAG.Technique',
                fromId: tech.id,
                toNs: NS,
                toType: 'WCAG.SuccessCriterion',
                toId: criterionId,
                relationshipType: 'failureFor',
                techniqueCategory: 'Failure',
              })
            }
          }
        }
      }
    }
  }

  // Write unique techniques
  const records: StandardRecord[] = Array.from(techniquesMap.values()).map(tech => ({
    ns: NS,
    type: 'WCAG.Technique',
    id: tech.id,
    name: tech.title || tech.id,
    description: cleanDescription(tech.title || ''),
    code: tech.id,
    includedIn: getAggregationsForType('Guideline'),
  }))

  writeStandardTSV(join(DATA_DIR, 'W3C.WCAG.Techniques.tsv'), records)

  // Write technique metadata
  const techniqueMetadata: Record<string, string>[] = Array.from(techniquesMap.values()).map(tech => ({
    ns: NS,
    type: 'WCAG.Technique',
    id: tech.id,
    name: tech.title || tech.id,
    techniqueType: getTechniqueType(tech.id),
    technology: getTechniqueTechnology(tech.id),
  }))

  writeTSV(
    join(DATA_DIR, 'W3C.WCAG.Techniques.Metadata.tsv'),
    techniqueMetadata,
    ['ns', 'type', 'id', 'name', 'techniqueType', 'technology']
  )

  // Write relationships
  writeTSV(
    join(REL_DIR, 'WCAG.Technique.SuccessCriterion.tsv'),
    relationships,
    ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType', 'techniqueCategory', 'situation']
  )
}

/**
 * Parse ARIA roles from specification data
 * Note: This is a simplified version. A full implementation would parse the actual spec HTML
 */
function transformARIARoles(): void {
  console.log('Transforming ARIA Roles...')

  // Define ARIA roles based on WAI-ARIA 1.2 specification
  // This is a subset - in production, this would be parsed from the spec or a comprehensive data source
  const ariaRoles: ARIARole[] = [
    {
      name: 'alert',
      type: 'Live Region',
      description: 'A type of live region with important, and usually time-sensitive, information.',
      superclassRoles: ['region'],
      supportedStates: ['aria-expanded'],
    },
    {
      name: 'alertdialog',
      type: 'Window',
      description: 'A type of dialog that contains an alert message, where initial focus goes to an element within the dialog.',
      superclassRoles: ['alert', 'dialog'],
      requiredStates: ['aria-label', 'aria-labelledby'],
    },
    {
      name: 'application',
      type: 'Landmark',
      description: 'A structure containing one or more focusable elements requiring user input, such as keyboard or gesture events.',
      superclassRoles: ['structure'],
      supportedStates: ['aria-activedescendant', 'aria-disabled', 'aria-errormessage', 'aria-expanded', 'aria-haspopup', 'aria-invalid'],
    },
    {
      name: 'article',
      type: 'Structure',
      description: 'A section of a page that consists of a composition that forms an independent part of a document, page, or site.',
      superclassRoles: ['document'],
      supportedStates: ['aria-posinset', 'aria-setsize'],
    },
    {
      name: 'banner',
      type: 'Landmark',
      description: 'A region that contains mostly site-oriented content, rather than page-specific content.',
      superclassRoles: ['landmark'],
    },
    {
      name: 'button',
      type: 'Widget',
      description: 'An input that allows for user-triggered actions when clicked or pressed.',
      superclassRoles: ['command'],
      supportedStates: ['aria-disabled', 'aria-expanded', 'aria-haspopup', 'aria-pressed'],
    },
    {
      name: 'checkbox',
      type: 'Widget',
      description: 'A checkable input that has three possible values: true, false, or mixed.',
      superclassRoles: ['input'],
      requiredStates: ['aria-checked'],
      supportedStates: ['aria-readonly'],
    },
    {
      name: 'complementary',
      type: 'Landmark',
      description: 'A supporting section of the document, designed to be complementary to the main content.',
      superclassRoles: ['landmark'],
    },
    {
      name: 'contentinfo',
      type: 'Landmark',
      description: 'A large perceivable region that contains information about the parent document.',
      superclassRoles: ['landmark'],
    },
    {
      name: 'dialog',
      type: 'Window',
      description: 'A dialog is a descendant window of the primary window of a web application.',
      superclassRoles: ['window'],
      requiredStates: ['aria-label', 'aria-labelledby'],
    },
    {
      name: 'document',
      type: 'Structure',
      description: 'An element containing content that assistive technology users may want to browse in a reading mode.',
      superclassRoles: ['structure'],
    },
    {
      name: 'feed',
      type: 'Structure',
      description: 'A scrollable list of articles where scrolling may cause articles to be added or removed from either end of the list.',
      superclassRoles: ['list'],
    },
    {
      name: 'form',
      type: 'Landmark',
      description: 'A landmark region that contains a collection of items and objects that, as a whole, combine to create a form.',
      superclassRoles: ['landmark'],
    },
    {
      name: 'grid',
      type: 'Widget',
      description: 'A composite widget containing a collection of one or more rows with one or more cells.',
      superclassRoles: ['composite', 'table'],
      supportedStates: ['aria-level', 'aria-multiselectable', 'aria-readonly'],
    },
    {
      name: 'gridcell',
      type: 'Widget',
      description: 'A cell in a grid or treegrid.',
      superclassRoles: ['cell', 'widget'],
      supportedStates: ['aria-readonly', 'aria-required', 'aria-selected'],
    },
    {
      name: 'group',
      type: 'Structure',
      description: 'A set of user interface objects which are not intended to be included in a page summary or table of contents.',
      superclassRoles: ['section'],
    },
    {
      name: 'heading',
      type: 'Structure',
      description: 'A heading for a section of the page.',
      superclassRoles: ['sectionhead'],
      requiredStates: ['aria-level'],
    },
    {
      name: 'img',
      type: 'Structure',
      description: 'A container for a collection of elements that form an image.',
      superclassRoles: ['section'],
      requiredStates: ['aria-label', 'aria-labelledby'],
    },
    {
      name: 'link',
      type: 'Widget',
      description: 'An interactive reference to an internal or external resource.',
      superclassRoles: ['command'],
      supportedStates: ['aria-disabled', 'aria-expanded', 'aria-haspopup'],
    },
    {
      name: 'list',
      type: 'Structure',
      description: 'A section containing listitem elements.',
      superclassRoles: ['section'],
    },
    {
      name: 'listbox',
      type: 'Widget',
      description: 'A widget that allows the user to select one or more items from a list of choices.',
      superclassRoles: ['select'],
      supportedStates: ['aria-multiselectable', 'aria-readonly', 'aria-required', 'aria-orientation'],
    },
    {
      name: 'listitem',
      type: 'Structure',
      description: 'A single item in a list or directory.',
      superclassRoles: ['section'],
      supportedStates: ['aria-level', 'aria-posinset', 'aria-setsize'],
    },
    {
      name: 'main',
      type: 'Landmark',
      description: 'The main content of a document.',
      superclassRoles: ['landmark'],
    },
    {
      name: 'menu',
      type: 'Widget',
      description: 'A type of widget that offers a list of choices to the user.',
      superclassRoles: ['select'],
      supportedStates: ['aria-orientation'],
    },
    {
      name: 'menubar',
      type: 'Widget',
      description: 'A presentation of menu that usually remains visible and is usually presented horizontally.',
      superclassRoles: ['menu'],
    },
    {
      name: 'menuitem',
      type: 'Widget',
      description: 'An option in a set of choices contained by a menu or menubar.',
      superclassRoles: ['command'],
      supportedStates: ['aria-disabled', 'aria-expanded', 'aria-haspopup', 'aria-posinset', 'aria-setsize'],
    },
    {
      name: 'menuitemcheckbox',
      type: 'Widget',
      description: 'A menuitem with a checkable state whose possible values are true, false, or mixed.',
      superclassRoles: ['checkbox', 'menuitem'],
      requiredStates: ['aria-checked'],
    },
    {
      name: 'menuitemradio',
      type: 'Widget',
      description: 'A checkable menuitem in a set of elements with the same role, only one of which can be checked at a time.',
      superclassRoles: ['menuitemcheckbox', 'radio'],
      requiredStates: ['aria-checked'],
    },
    {
      name: 'navigation',
      type: 'Landmark',
      description: 'A collection of navigational elements (usually links) for navigating the document or related documents.',
      superclassRoles: ['landmark'],
    },
    {
      name: 'progressbar',
      type: 'Widget',
      description: 'An element that displays the progress status for tasks that take a long time.',
      superclassRoles: ['range'],
      supportedStates: ['aria-valuemax', 'aria-valuemin', 'aria-valuenow', 'aria-valuetext'],
    },
    {
      name: 'radio',
      type: 'Widget',
      description: 'A checkable input in a group of elements with the same role, only one of which can be checked at a time.',
      superclassRoles: ['input'],
      requiredStates: ['aria-checked'],
      supportedStates: ['aria-posinset', 'aria-setsize'],
    },
    {
      name: 'radiogroup',
      type: 'Widget',
      description: 'A group of radio buttons.',
      superclassRoles: ['select'],
      supportedStates: ['aria-readonly', 'aria-required', 'aria-orientation'],
    },
    {
      name: 'region',
      type: 'Landmark',
      description: 'A perceivable section containing content that is relevant to a specific, author-specified purpose.',
      superclassRoles: ['landmark'],
    },
    {
      name: 'search',
      type: 'Landmark',
      description: 'A landmark region that contains a collection of items and objects that, as a whole, combine to create a search facility.',
      superclassRoles: ['landmark'],
    },
    {
      name: 'separator',
      type: 'Structure',
      description: 'A divider that separates and distinguishes sections of content or groups of menuitems.',
      superclassRoles: ['structure'],
      supportedStates: ['aria-orientation', 'aria-valuemax', 'aria-valuemin', 'aria-valuenow', 'aria-valuetext'],
    },
    {
      name: 'slider',
      type: 'Widget',
      description: 'An input where the user selects a value from within a given range.',
      superclassRoles: ['input', 'range'],
      requiredStates: ['aria-valuemax', 'aria-valuemin', 'aria-valuenow'],
      supportedStates: ['aria-readonly', 'aria-orientation'],
    },
    {
      name: 'spinbutton',
      type: 'Widget',
      description: 'A form of range that expects the user to select from among discrete choices.',
      superclassRoles: ['composite', 'input', 'range'],
      requiredStates: ['aria-valuemax', 'aria-valuemin', 'aria-valuenow'],
      supportedStates: ['aria-readonly', 'aria-required', 'aria-valuetext'],
    },
    {
      name: 'status',
      type: 'Live Region',
      description: 'A type of live region whose content is advisory information for the user but is not important enough to justify an alert.',
      superclassRoles: ['section'],
    },
    {
      name: 'tab',
      type: 'Widget',
      description: 'A grouping label providing a mechanism for selecting the tab content that is to be rendered to the user.',
      superclassRoles: ['sectionhead', 'widget'],
      supportedStates: ['aria-disabled', 'aria-expanded', 'aria-haspopup', 'aria-posinset', 'aria-selected', 'aria-setsize'],
    },
    {
      name: 'table',
      type: 'Structure',
      description: 'A section containing data arranged in rows and columns.',
      superclassRoles: ['section'],
      supportedStates: ['aria-colcount', 'aria-rowcount'],
    },
    {
      name: 'tablist',
      type: 'Widget',
      description: 'A list of tab elements, which are references to tabpanel elements.',
      superclassRoles: ['composite'],
      supportedStates: ['aria-level', 'aria-multiselectable', 'aria-orientation'],
    },
    {
      name: 'tabpanel',
      type: 'Widget',
      description: 'A container for the resources associated with a tab.',
      superclassRoles: ['section'],
    },
    {
      name: 'textbox',
      type: 'Widget',
      description: 'An input that allows free-form text as its value.',
      superclassRoles: ['input'],
      supportedStates: ['aria-activedescendant', 'aria-autocomplete', 'aria-multiline', 'aria-placeholder', 'aria-readonly', 'aria-required'],
    },
    {
      name: 'timer',
      type: 'Live Region',
      description: 'A type of live region containing a numerical counter which indicates an amount of elapsed time or remaining time.',
      superclassRoles: ['status'],
    },
    {
      name: 'toolbar',
      type: 'Structure',
      description: 'A collection of commonly used function buttons or controls represented in compact visual form.',
      superclassRoles: ['group'],
      supportedStates: ['aria-orientation'],
    },
    {
      name: 'tooltip',
      type: 'Structure',
      description: 'A contextual popup that displays a description for an element.',
      superclassRoles: ['section'],
    },
    {
      name: 'tree',
      type: 'Widget',
      description: 'A widget that allows the user to select one or more items from a hierarchically organized collection.',
      superclassRoles: ['select'],
      supportedStates: ['aria-multiselectable', 'aria-required', 'aria-orientation'],
    },
    {
      name: 'treegrid',
      type: 'Widget',
      description: 'A grid whose rows can be expanded and collapsed in the same manner as for a tree.',
      superclassRoles: ['grid', 'tree'],
    },
    {
      name: 'treeitem',
      type: 'Widget',
      description: 'An option item of a tree.',
      superclassRoles: ['listitem', 'option'],
      supportedStates: ['aria-checked', 'aria-expanded', 'aria-haspopup', 'aria-level', 'aria-posinset', 'aria-selected', 'aria-setsize'],
    },
  ]

  const records: StandardRecord[] = ariaRoles.map(role => ({
    ns: NS,
    type: 'ARIA.Role',
    id: toWikipediaStyleId(role.name),
    name: role.name,
    description: cleanDescription(role.description),
    code: role.name,
    includedIn: getAggregationsForType('Property'),
  }))

  writeStandardTSV(join(DATA_DIR, 'W3C.ARIA.Roles.tsv'), records)

  // Write role metadata
  const roleMetadata: Record<string, string>[] = ariaRoles.map(role => ({
    ns: NS,
    type: 'ARIA.Role',
    id: toWikipediaStyleId(role.name),
    name: role.name,
    roleType: role.type,
    requiredStates: (role.requiredStates || []).join(', '),
    supportedStates: (role.supportedStates || []).join(', '),
    superclassRoles: (role.superclassRoles || []).join(', '),
  }))

  writeTSV(
    join(DATA_DIR, 'W3C.ARIA.Roles.Metadata.tsv'),
    roleMetadata,
    ['ns', 'type', 'id', 'name', 'roleType', 'requiredStates', 'supportedStates', 'superclassRoles']
  )
}

/**
 * Transform ARIA States and Properties
 */
function transformARIAAttributes(): void {
  console.log('Transforming ARIA States and Properties...')

  // Define ARIA attributes based on WAI-ARIA 1.2 specification
  const ariaAttributes: ARIAAttribute[] = [
    // States
    {
      name: 'aria-busy',
      type: 'state',
      valueType: 'true/false',
      defaultValue: 'false',
      description: 'Indicates an element is being modified and that assistive technologies may want to wait until the modifications are complete.',
    },
    {
      name: 'aria-checked',
      type: 'state',
      valueType: 'tristate',
      defaultValue: 'undefined',
      description: 'Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.',
    },
    {
      name: 'aria-disabled',
      type: 'state',
      valueType: 'true/false',
      defaultValue: 'false',
      description: 'Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.',
    },
    {
      name: 'aria-expanded',
      type: 'state',
      valueType: 'true/false/undefined',
      defaultValue: 'undefined',
      description: 'Indicates whether a grouping element owned or controlled by this element is expanded or collapsed.',
    },
    {
      name: 'aria-grabbed',
      type: 'state',
      valueType: 'true/false/undefined',
      defaultValue: 'undefined',
      description: 'Indicates an element\'s "grabbed" state in a drag-and-drop operation.',
    },
    {
      name: 'aria-hidden',
      type: 'state',
      valueType: 'true/false/undefined',
      defaultValue: 'undefined',
      description: 'Indicates whether the element is exposed to an accessibility API.',
    },
    {
      name: 'aria-invalid',
      type: 'state',
      valueType: 'grammar/false/spelling/true',
      defaultValue: 'false',
      description: 'Indicates the entered value does not conform to the format expected by the application.',
    },
    {
      name: 'aria-pressed',
      type: 'state',
      valueType: 'tristate',
      defaultValue: 'undefined',
      description: 'Indicates the current "pressed" state of toggle buttons.',
    },
    {
      name: 'aria-selected',
      type: 'state',
      valueType: 'true/false/undefined',
      defaultValue: 'undefined',
      description: 'Indicates the current "selected" state of various widgets.',
    },

    // Properties
    {
      name: 'aria-activedescendant',
      type: 'property',
      valueType: 'ID reference',
      description: 'Identifies the currently active element when DOM focus is on a composite widget.',
    },
    {
      name: 'aria-atomic',
      type: 'property',
      valueType: 'true/false',
      defaultValue: 'false',
      description: 'Indicates whether assistive technologies will present all, or only parts of, the changed region.',
    },
    {
      name: 'aria-autocomplete',
      type: 'property',
      valueType: 'inline/list/both/none',
      defaultValue: 'none',
      description: 'Indicates whether inputting text could trigger display of one or more predictions of the user\'s intended value.',
    },
    {
      name: 'aria-colcount',
      type: 'property',
      valueType: 'integer',
      description: 'Defines the total number of columns in a table, grid, or treegrid.',
    },
    {
      name: 'aria-colindex',
      type: 'property',
      valueType: 'integer',
      description: 'Defines an element\'s column index or position with respect to the total number of columns.',
    },
    {
      name: 'aria-colspan',
      type: 'property',
      valueType: 'integer',
      description: 'Defines the number of columns spanned by a cell or gridcell.',
    },
    {
      name: 'aria-controls',
      type: 'property',
      valueType: 'ID reference list',
      description: 'Identifies the element (or elements) whose contents or presence are controlled by the current element.',
    },
    {
      name: 'aria-current',
      type: 'property',
      valueType: 'page/step/location/date/time/true/false',
      defaultValue: 'false',
      description: 'Indicates the element that represents the current item within a container or set of related elements.',
    },
    {
      name: 'aria-describedby',
      type: 'property',
      valueType: 'ID reference list',
      description: 'Identifies the element (or elements) that describes the object.',
    },
    {
      name: 'aria-details',
      type: 'property',
      valueType: 'ID reference',
      description: 'Identifies the element that provides a detailed, extended description for the object.',
    },
    {
      name: 'aria-dropeffect',
      type: 'property',
      valueType: 'copy/execute/link/move/none/popup',
      defaultValue: 'none',
      description: 'Indicates what functions can be performed when a dragged object is released on the drop target.',
    },
    {
      name: 'aria-errormessage',
      type: 'property',
      valueType: 'ID reference',
      description: 'Identifies the element that provides an error message for the object.',
    },
    {
      name: 'aria-flowto',
      type: 'property',
      valueType: 'ID reference list',
      description: 'Identifies the next element (or elements) in an alternate reading order of content.',
    },
    {
      name: 'aria-haspopup',
      type: 'property',
      valueType: 'false/true/menu/listbox/tree/grid/dialog',
      defaultValue: 'false',
      description: 'Indicates the availability and type of interactive popup element that can be triggered by an element.',
    },
    {
      name: 'aria-keyshortcuts',
      type: 'property',
      valueType: 'string',
      description: 'Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element.',
    },
    {
      name: 'aria-label',
      type: 'property',
      valueType: 'string',
      description: 'Defines a string value that labels the current element.',
    },
    {
      name: 'aria-labelledby',
      type: 'property',
      valueType: 'ID reference list',
      description: 'Identifies the element (or elements) that labels the current element.',
    },
    {
      name: 'aria-level',
      type: 'property',
      valueType: 'integer',
      description: 'Defines the hierarchical level of an element within a structure.',
    },
    {
      name: 'aria-live',
      type: 'property',
      valueType: 'assertive/off/polite',
      defaultValue: 'off',
      description: 'Indicates that an element will be updated, and describes the types of updates the user agents will receive.',
    },
    {
      name: 'aria-modal',
      type: 'property',
      valueType: 'true/false',
      defaultValue: 'false',
      description: 'Indicates whether an element is modal when displayed.',
    },
    {
      name: 'aria-multiline',
      type: 'property',
      valueType: 'true/false',
      defaultValue: 'false',
      description: 'Indicates whether a text box accepts multiple lines of input or only a single line.',
    },
    {
      name: 'aria-multiselectable',
      type: 'property',
      valueType: 'true/false',
      defaultValue: 'false',
      description: 'Indicates that the user may select more than one item from the current selectable descendants.',
    },
    {
      name: 'aria-orientation',
      type: 'property',
      valueType: 'horizontal/undefined/vertical',
      defaultValue: 'undefined',
      description: 'Indicates whether the element\'s orientation is horizontal, vertical, or unknown/ambiguous.',
    },
    {
      name: 'aria-owns',
      type: 'property',
      valueType: 'ID reference list',
      description: 'Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship.',
    },
    {
      name: 'aria-placeholder',
      type: 'property',
      valueType: 'string',
      description: 'Defines a short hint intended to aid the user with data entry when the control has no value.',
    },
    {
      name: 'aria-posinset',
      type: 'property',
      valueType: 'integer',
      description: 'Defines an element\'s number or position in the current set of listitems or treeitems.',
    },
    {
      name: 'aria-readonly',
      type: 'property',
      valueType: 'true/false',
      defaultValue: 'false',
      description: 'Indicates that the element is not editable, but is otherwise operable.',
    },
    {
      name: 'aria-relevant',
      type: 'property',
      valueType: 'additions/all/removals/text',
      defaultValue: 'additions text',
      description: 'Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.',
    },
    {
      name: 'aria-required',
      type: 'property',
      valueType: 'true/false',
      defaultValue: 'false',
      description: 'Indicates that user input is required on the element before a form may be submitted.',
    },
    {
      name: 'aria-roledescription',
      type: 'property',
      valueType: 'string',
      description: 'Defines a human-readable, author-localized description for the role of an element.',
    },
    {
      name: 'aria-rowcount',
      type: 'property',
      valueType: 'integer',
      description: 'Defines the total number of rows in a table, grid, or treegrid.',
    },
    {
      name: 'aria-rowindex',
      type: 'property',
      valueType: 'integer',
      description: 'Defines an element\'s row index or position with respect to the total number of rows.',
    },
    {
      name: 'aria-rowspan',
      type: 'property',
      valueType: 'integer',
      description: 'Defines the number of rows spanned by a cell or gridcell.',
    },
    {
      name: 'aria-setsize',
      type: 'property',
      valueType: 'integer',
      description: 'Defines the number of items in the current set of listitems or treeitems.',
    },
    {
      name: 'aria-sort',
      type: 'property',
      valueType: 'ascending/descending/none/other',
      defaultValue: 'none',
      description: 'Indicates if items in a table or grid are sorted in ascending or descending order.',
    },
    {
      name: 'aria-valuemax',
      type: 'property',
      valueType: 'number',
      description: 'Defines the maximum allowed value for a range widget.',
    },
    {
      name: 'aria-valuemin',
      type: 'property',
      valueType: 'number',
      description: 'Defines the minimum allowed value for a range widget.',
    },
    {
      name: 'aria-valuenow',
      type: 'property',
      valueType: 'number',
      description: 'Defines the current value for a range widget.',
    },
    {
      name: 'aria-valuetext',
      type: 'property',
      valueType: 'string',
      description: 'Defines the human readable text alternative of aria-valuenow for a range widget.',
    },
  ]

  // Separate into states and properties
  const states = ariaAttributes.filter(attr => attr.type === 'state')
  const properties = ariaAttributes.filter(attr => attr.type === 'property')

  // Write ARIA States
  const stateRecords: StandardRecord[] = states.map(state => ({
    ns: NS,
    type: 'ARIA.State',
    id: toWikipediaStyleId(state.name),
    name: state.name,
    description: cleanDescription(state.description),
    code: state.name,
    includedIn: getAggregationsForType('Property'),
  }))

  writeStandardTSV(join(DATA_DIR, 'W3C.ARIA.States.tsv'), stateRecords)

  const stateMetadata: Record<string, string>[] = states.map(state => ({
    ns: NS,
    type: 'ARIA.State',
    id: toWikipediaStyleId(state.name),
    name: state.name,
    valueType: state.valueType,
    defaultValue: state.defaultValue || '',
  }))

  writeTSV(
    join(DATA_DIR, 'W3C.ARIA.States.Metadata.tsv'),
    stateMetadata,
    ['ns', 'type', 'id', 'name', 'valueType', 'defaultValue']
  )

  // Write ARIA Properties
  const propertyRecords: StandardRecord[] = properties.map(prop => ({
    ns: NS,
    type: 'ARIA.Property',
    id: toWikipediaStyleId(prop.name),
    name: prop.name,
    description: cleanDescription(prop.description),
    code: prop.name,
    includedIn: getAggregationsForType('Property'),
  }))

  writeStandardTSV(join(DATA_DIR, 'W3C.ARIA.Properties.tsv'), propertyRecords)

  const propertyMetadata: Record<string, string>[] = properties.map(prop => ({
    ns: NS,
    type: 'ARIA.Property',
    id: toWikipediaStyleId(prop.name),
    name: prop.name,
    valueType: prop.valueType,
    defaultValue: prop.defaultValue || '',
  }))

  writeTSV(
    join(DATA_DIR, 'W3C.ARIA.Properties.Metadata.tsv'),
    propertyMetadata,
    ['ns', 'type', 'id', 'name', 'valueType', 'defaultValue']
  )
}

/**
 * Main transformation function
 */
export async function transformW3CAccessibility(): Promise<void> {
  console.log('=== W3C Accessibility Standards Transformation ===\n')
  ensureOutputDirs()

  try {
    // Fetch WCAG data
    const wcagData = await fetchJSON<WCAGData>(
      'https://www.w3.org/WAI/WCAG22/wcag.json',
      'wcag.json'
    )

    // Transform WCAG data
    transformWCAGPrinciples(wcagData)
    transformWCAGGuidelines(wcagData)
    transformWCAGSuccessCriteria(wcagData)
    transformWCAGTechniques(wcagData)

    // Transform ARIA data (using embedded definitions)
    transformARIARoles()
    transformARIAAttributes()

    console.log('\n=== W3C Accessibility Transformation Complete ===')
  } catch (error) {
    console.error('Error transforming W3C Accessibility data:', error)
    throw error
  }
}

// Run if called directly
if (import.meta.main) {
  transformW3CAccessibility().catch(console.error)
}
