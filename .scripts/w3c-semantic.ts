/**
 * W3C Semantic Web Standards Transformation Script
 * Transforms W3C RDF vocabularies into standard TSV format
 *
 * Covers: RDF, RDFS, OWL, SPARQL, JSON-LD, SKOS, DCAT, PROV, FOAF, Dublin Core, SHACL, VoID
 */

import {
  NAMESPACES,
  StandardRecord,
  RelationshipRecord,
  writeStandardTSV,
  writeRelationshipTSV,
  toWikipediaStyleId,
  cleanDescription,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
  getAggregationsForType,
} from './utils'

const NS = NAMESPACES.W3C
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// W3C Vocabulary URLs
const VOCABULARIES = {
  RDF: 'https://www.w3.org/1999/02/22-rdf-syntax-ns#',
  RDFS: 'https://www.w3.org/2000/01/rdf-schema#',
  OWL: 'https://www.w3.org/2002/07/owl#',
  SKOS: 'https://www.w3.org/2004/02/skos/core#',
  DCAT: 'https://www.w3.org/ns/dcat#',
  PROV: 'https://www.w3.org/ns/prov#',
  FOAF: 'http://xmlns.com/foaf/0.1/',
  DC_ELEMENTS: 'http://purl.org/dc/elements/1.1/',
  DC_TERMS: 'http://purl.org/dc/terms/',
  SHACL: 'https://www.w3.org/ns/shacl#',
  VOID: 'http://rdfs.org/ns/void#',
}

/**
 * Fetch RDF/Turtle vocabulary from URL
 */
async function fetchVocabulary(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/turtle, application/rdf+xml, application/xml, text/plain',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.text()
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error)
    throw error
  }
}

/**
 * Simple RDF/Turtle parser for extracting classes and properties
 * This is a basic parser focused on W3C vocabulary structure
 */
function parseRDFVocabulary(content: string, baseUri: string): {
  classes: Array<{ uri: string; label: string; comment: string; type: string }>
  properties: Array<{ uri: string; label: string; comment: string; type: string; domain?: string; range?: string }>
  individuals: Array<{ uri: string; label: string; comment: string; type: string }>
} {
  const classes: Array<{ uri: string; label: string; comment: string; type: string }> = []
  const properties: Array<{ uri: string; label: string; comment: string; type: string; domain?: string; range?: string }> = []
  const individuals: Array<{ uri: string; label: string; comment: string; type: string }> = []

  // Normalize content - handle both Turtle and RDF/XML
  const lines = content.split('\n')

  // Current subject being processed
  let currentSubject = ''
  let currentType = ''
  let currentLabel = ''
  let currentComment = ''
  let currentDomain = ''
  let currentRange = ''

  // Regex patterns for Turtle/N3 format
  const subjectPattern = /^([a-zA-Z0-9_:]+)\s+$/
  const typePattern = /\s+(?:a|rdf:type)\s+(?:owl:Class|rdfs:Class|owl:ObjectProperty|owl:DatatypeProperty|rdf:Property|owl:NamedIndividual|skos:ConceptScheme|skos:Concept)/
  const labelPattern = /\s+(?:rdfs:label|skos:prefLabel)\s+"([^"]+)"/
  const commentPattern = /\s+(?:rdfs:comment|skos:definition|dcterms?:description)\s+"([^"]+)"/
  const domainPattern = /\s+rdfs:domain\s+([a-zA-Z0-9_:]+)/
  const rangePattern = /\s+rdfs:range\s+([a-zA-Z0-9_:]+)/

  // Extract namespace prefix
  const nsMatch = baseUri.match(/^(.+[#\/])/)
  const nsPrefix = nsMatch ? nsMatch[1] : baseUri

  // Process line by line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (!line || line.startsWith('@') || line.startsWith('#')) continue

    // Try to extract from RDF/XML format
    if (content.includes('<?xml') || content.includes('rdf:RDF')) {
      extractFromXML(content, classes, properties, individuals, nsPrefix)
      break
    }

    // Check if this is a new subject (Turtle format)
    if (line.match(/^[a-zA-Z0-9_:]+\s*$/)) {
      // Save previous subject if exists
      saveCurrentSubject()
      currentSubject = line.replace(/\s+$/, '')
      currentType = ''
      currentLabel = ''
      currentComment = ''
      currentDomain = ''
      currentRange = ''
    }

    // Check for type
    if (line.includes('rdf:type') || line.match(/\sa\s/)) {
      if (line.includes('owl:Class') || line.includes('rdfs:Class')) {
        currentType = 'Class'
      } else if (line.includes('owl:ObjectProperty') || line.includes('owl:DatatypeProperty') || line.includes('rdf:Property')) {
        currentType = 'Property'
      } else if (line.includes('owl:NamedIndividual') || line.includes('skos:Concept')) {
        currentType = 'Individual'
      }
    }

    // Extract label
    const labelMatch = line.match(/(?:rdfs:label|skos:prefLabel)\s+"([^"]+)"/)
    if (labelMatch) {
      currentLabel = labelMatch[1]
    }

    // Extract comment
    const commentMatch = line.match(/(?:rdfs:comment|skos:definition|dcterms?:description)\s+"([^"]+)"/)
    if (commentMatch) {
      currentComment = commentMatch[1]
    }

    // Extract domain
    const domainMatch = line.match(/rdfs:domain\s+([a-zA-Z0-9_:]+)/)
    if (domainMatch) {
      currentDomain = domainMatch[1]
    }

    // Extract range
    const rangeMatch = line.match(/rdfs:range\s+([a-zA-Z0-9_:]+)/)
    if (rangeMatch) {
      currentRange = rangeMatch[1]
    }

    // Check if we're at the end of a definition
    if (line.includes('.') && currentSubject) {
      saveCurrentSubject()
    }
  }

  // Save last subject
  saveCurrentSubject()

  function saveCurrentSubject() {
    if (!currentSubject || !currentType) return

    const uri = currentSubject.startsWith('http') ? currentSubject :
                 currentSubject.includes(':') ? currentSubject.split(':')[1] :
                 currentSubject

    const item = {
      uri,
      label: currentLabel || uri,
      comment: currentComment,
      type: currentType,
    }

    if (currentType === 'Class') {
      classes.push(item)
    } else if (currentType === 'Property') {
      properties.push({
        ...item,
        domain: currentDomain,
        range: currentRange,
      })
    } else if (currentType === 'Individual') {
      individuals.push(item)
    }
  }

  return { classes, properties, individuals }
}

/**
 * Extract vocabulary items from RDF/XML format
 */
function extractFromXML(
  content: string,
  classes: Array<{ uri: string; label: string; comment: string; type: string }>,
  properties: Array<{ uri: string; label: string; comment: string; type: string; domain?: string; range?: string }>,
  individuals: Array<{ uri: string; label: string; comment: string; type: string }>,
  nsPrefix: string
): void {
  // Very basic XML parsing - looking for common patterns
  const classPattern = /<(?:owl:Class|rdfs:Class)[^>]*(?:rdf:about|rdf:ID)="([^"]+)"[^>]*>([\s\S]*?)<\/(?:owl:Class|rdfs:Class)>/g
  const propPattern = /<(?:owl:ObjectProperty|owl:DatatypeProperty|rdf:Property)[^>]*(?:rdf:about|rdf:ID)="([^"]+)"[^>]*>([\s\S]*?)<\/(?:owl:ObjectProperty|owl:DatatypeProperty|rdf:Property)>/g

  let match

  // Extract classes
  while ((match = classPattern.exec(content)) !== null) {
    const uri = match[1].replace(nsPrefix, '')
    const body = match[2]
    const labelMatch = body.match(/<rdfs:label[^>]*>([^<]+)<\/rdfs:label>/)
    const commentMatch = body.match(/<rdfs:comment[^>]*>([^<]+)<\/rdfs:comment>/)

    classes.push({
      uri,
      label: labelMatch ? labelMatch[1] : uri,
      comment: commentMatch ? commentMatch[1] : '',
      type: 'Class',
    })
  }

  // Extract properties
  while ((match = propPattern.exec(content)) !== null) {
    const uri = match[1].replace(nsPrefix, '')
    const body = match[2]
    const labelMatch = body.match(/<rdfs:label[^>]*>([^<]+)<\/rdfs:label>/)
    const commentMatch = body.match(/<rdfs:comment[^>]*>([^<]+)<\/rdfs:comment>/)
    const domainMatch = body.match(/<rdfs:domain[^>]*rdf:resource="[^#]*#([^"]+)"/)
    const rangeMatch = body.match(/<rdfs:range[^>]*rdf:resource="[^#]*#([^"]+)"/)

    properties.push({
      uri,
      label: labelMatch ? labelMatch[1] : uri,
      comment: commentMatch ? commentMatch[1] : '',
      type: 'Property',
      domain: domainMatch ? domainMatch[1] : undefined,
      range: rangeMatch ? rangeMatch[1] : undefined,
    })
  }
}

/**
 * Transform RDF vocabulary
 */
async function transformRDF(): Promise<void> {
  console.log('Transforming RDF vocabulary...')

  try {
    const content = await fetchVocabulary(VOCABULARIES.RDF)
    const { classes, properties } = parseRDFVocabulary(content, VOCABULARIES.RDF)

    const records: StandardRecord[] = []

    // Add classes
    for (const cls of classes) {
      records.push({
        ns: NS,
        type: 'RDF_Class',
        id: toWikipediaStyleId(cls.label || cls.uri),
        name: cls.label || cls.uri,
        description: cleanDescription(cls.comment),
        code: cls.uri,
      })
    }

    // Add properties
    for (const prop of properties) {
      records.push({
        ns: NS,
        type: 'RDF_Property',
        id: toWikipediaStyleId(prop.label || prop.uri),
        name: prop.label || prop.uri,
        description: cleanDescription(prop.comment),
        code: prop.uri,
      })
    }

    if (records.length > 0) {
      writeStandardTSV(`${DATA_DIR}/W3C.RDF.tsv`, records)
    }
  } catch (error) {
    console.error('Failed to transform RDF:', error)
  }
}

/**
 * Transform RDFS vocabulary
 */
async function transformRDFS(): Promise<void> {
  console.log('Transforming RDFS vocabulary...')

  try {
    const content = await fetchVocabulary(VOCABULARIES.RDFS)
    const { classes, properties } = parseRDFVocabulary(content, VOCABULARIES.RDFS)

    const records: StandardRecord[] = []

    // Add classes
    for (const cls of classes) {
      records.push({
        ns: NS,
        type: 'RDFS_Class',
        id: toWikipediaStyleId(cls.label || cls.uri),
        name: cls.label || cls.uri,
        description: cleanDescription(cls.comment),
        code: cls.uri,
      })
    }

    // Add properties
    for (const prop of properties) {
      records.push({
        ns: NS,
        type: 'RDFS_Property',
        id: toWikipediaStyleId(prop.label || prop.uri),
        name: prop.label || prop.uri,
        description: cleanDescription(prop.comment),
        code: prop.uri,
      })
    }

    if (records.length > 0) {
      writeStandardTSV(`${DATA_DIR}/W3C.RDFS.tsv`, records)
    }
  } catch (error) {
    console.error('Failed to transform RDFS:', error)
  }
}

/**
 * Transform OWL vocabulary
 */
async function transformOWL(): Promise<void> {
  console.log('Transforming OWL vocabulary...')

  try {
    const content = await fetchVocabulary(VOCABULARIES.OWL)
    const { classes, properties } = parseRDFVocabulary(content, VOCABULARIES.OWL)

    const records: StandardRecord[] = []
    const relationships: RelationshipRecord[] = []

    // Add classes
    for (const cls of classes) {
      records.push({
        ns: NS,
        type: 'OWL_Class',
        id: toWikipediaStyleId(cls.label || cls.uri),
        name: cls.label || cls.uri,
        description: cleanDescription(cls.comment),
        code: cls.uri,
      })
    }

    // Add properties
    for (const prop of properties) {
      const propId = toWikipediaStyleId(prop.label || prop.uri)

      records.push({
        ns: NS,
        type: 'OWL_Property',
        id: propId,
        name: prop.label || prop.uri,
        description: cleanDescription(prop.comment),
        code: prop.uri,
      })

      // Add domain relationship
      if (prop.domain) {
        const domainId = toWikipediaStyleId(prop.domain)
        relationships.push({
          fromNs: NS,
          fromType: 'OWL_Property',
          fromId: propId,
          toNs: NS,
          toType: 'OWL_Class',
          toId: domainId,
          relationshipType: 'hasDomain',
        })
      }

      // Add range relationship
      if (prop.range) {
        const rangeId = toWikipediaStyleId(prop.range)
        relationships.push({
          fromNs: NS,
          fromType: 'OWL_Property',
          fromId: propId,
          toNs: NS,
          toType: 'OWL_Class',
          toId: rangeId,
          relationshipType: 'hasRange',
        })
      }
    }

    if (records.length > 0) {
      writeStandardTSV(`${DATA_DIR}/W3C.OWL.tsv`, records)
    }

    if (relationships.length > 0) {
      writeRelationshipTSV(`${REL_DIR}/OWL.Property.Class.tsv`, relationships)
    }
  } catch (error) {
    console.error('Failed to transform OWL:', error)
  }
}

/**
 * Transform SKOS vocabulary
 */
async function transformSKOS(): Promise<void> {
  console.log('Transforming SKOS vocabulary...')

  try {
    const content = await fetchVocabulary(VOCABULARIES.SKOS)
    const { classes, properties } = parseRDFVocabulary(content, VOCABULARIES.SKOS)

    const records: StandardRecord[] = []

    // Add classes
    for (const cls of classes) {
      records.push({
        ns: NS,
        type: 'SKOS_Class',
        id: toWikipediaStyleId(cls.label || cls.uri),
        name: cls.label || cls.uri,
        description: cleanDescription(cls.comment),
        code: cls.uri,
      })
    }

    // Add properties
    for (const prop of properties) {
      records.push({
        ns: NS,
        type: 'SKOS_Property',
        id: toWikipediaStyleId(prop.label || prop.uri),
        name: prop.label || prop.uri,
        description: cleanDescription(prop.comment),
        code: prop.uri,
      })
    }

    if (records.length > 0) {
      writeStandardTSV(`${DATA_DIR}/W3C.SKOS.tsv`, records)
    }
  } catch (error) {
    console.error('Failed to transform SKOS:', error)
  }
}

/**
 * Transform DCAT vocabulary
 */
async function transformDCAT(): Promise<void> {
  console.log('Transforming DCAT vocabulary...')

  try {
    const content = await fetchVocabulary(VOCABULARIES.DCAT)
    const { classes, properties } = parseRDFVocabulary(content, VOCABULARIES.DCAT)

    const records: StandardRecord[] = []

    // Add classes
    for (const cls of classes) {
      records.push({
        ns: NS,
        type: 'DCAT_Class',
        id: toWikipediaStyleId(cls.label || cls.uri),
        name: cls.label || cls.uri,
        description: cleanDescription(cls.comment),
        code: cls.uri,
      })
    }

    // Add properties
    for (const prop of properties) {
      records.push({
        ns: NS,
        type: 'DCAT_Property',
        id: toWikipediaStyleId(prop.label || prop.uri),
        name: prop.label || prop.uri,
        description: cleanDescription(prop.comment),
        code: prop.uri,
      })
    }

    if (records.length > 0) {
      writeStandardTSV(`${DATA_DIR}/W3C.DCAT.tsv`, records)
    }
  } catch (error) {
    console.error('Failed to transform DCAT:', error)
  }
}

/**
 * Transform PROV vocabulary
 */
async function transformPROV(): Promise<void> {
  console.log('Transforming PROV vocabulary...')

  try {
    const content = await fetchVocabulary(VOCABULARIES.PROV)
    const { classes, properties } = parseRDFVocabulary(content, VOCABULARIES.PROV)

    const records: StandardRecord[] = []

    // Add classes
    for (const cls of classes) {
      records.push({
        ns: NS,
        type: 'PROV_Class',
        id: toWikipediaStyleId(cls.label || cls.uri),
        name: cls.label || cls.uri,
        description: cleanDescription(cls.comment),
        code: cls.uri,
      })
    }

    // Add properties
    for (const prop of properties) {
      records.push({
        ns: NS,
        type: 'PROV_Property',
        id: toWikipediaStyleId(prop.label || prop.uri),
        name: prop.label || prop.uri,
        description: cleanDescription(prop.comment),
        code: prop.uri,
      })
    }

    if (records.length > 0) {
      writeStandardTSV(`${DATA_DIR}/W3C.PROV.tsv`, records)
    }
  } catch (error) {
    console.error('Failed to transform PROV:', error)
  }
}

/**
 * Transform FOAF vocabulary
 */
async function transformFOAF(): Promise<void> {
  console.log('Transforming FOAF vocabulary...')

  try {
    const content = await fetchVocabulary(VOCABULARIES.FOAF)
    const { classes, properties } = parseRDFVocabulary(content, VOCABULARIES.FOAF)

    const records: StandardRecord[] = []

    // Add classes
    for (const cls of classes) {
      records.push({
        ns: NS,
        type: 'FOAF_Class',
        id: toWikipediaStyleId(cls.label || cls.uri),
        name: cls.label || cls.uri,
        description: cleanDescription(cls.comment),
        code: cls.uri,
      })
    }

    // Add properties
    for (const prop of properties) {
      records.push({
        ns: NS,
        type: 'FOAF_Property',
        id: toWikipediaStyleId(prop.label || prop.uri),
        name: prop.label || prop.uri,
        description: cleanDescription(prop.comment),
        code: prop.uri,
      })
    }

    if (records.length > 0) {
      writeStandardTSV(`${DATA_DIR}/W3C.FOAF.tsv`, records)
    }
  } catch (error) {
    console.error('Failed to transform FOAF:', error)
  }
}

/**
 * Transform Dublin Core Elements
 */
async function transformDublinCore(): Promise<void> {
  console.log('Transforming Dublin Core vocabulary...')

  try {
    // Fetch both DC Elements and DC Terms
    const elementsContent = await fetchVocabulary(VOCABULARIES.DC_ELEMENTS)
    const termsContent = await fetchVocabulary(VOCABULARIES.DC_TERMS)

    const elements = parseRDFVocabulary(elementsContent, VOCABULARIES.DC_ELEMENTS)
    const terms = parseRDFVocabulary(termsContent, VOCABULARIES.DC_TERMS)

    const records: StandardRecord[] = []

    // Add elements
    for (const cls of elements.classes) {
      records.push({
        ns: NS,
        type: 'DC_Element',
        id: toWikipediaStyleId(cls.label || cls.uri),
        name: cls.label || cls.uri,
        description: cleanDescription(cls.comment),
        code: cls.uri,
      })
    }

    for (const prop of elements.properties) {
      records.push({
        ns: NS,
        type: 'DC_Element',
        id: toWikipediaStyleId(prop.label || prop.uri),
        name: prop.label || prop.uri,
        description: cleanDescription(prop.comment),
        code: prop.uri,
      })
    }

    // Add terms
    for (const cls of terms.classes) {
      records.push({
        ns: NS,
        type: 'DC_Term',
        id: toWikipediaStyleId(cls.label || cls.uri),
        name: cls.label || cls.uri,
        description: cleanDescription(cls.comment),
        code: cls.uri,
      })
    }

    for (const prop of terms.properties) {
      records.push({
        ns: NS,
        type: 'DC_Term',
        id: toWikipediaStyleId(prop.label || prop.uri),
        name: prop.label || prop.uri,
        description: cleanDescription(prop.comment),
        code: prop.uri,
      })
    }

    if (records.length > 0) {
      writeStandardTSV(`${DATA_DIR}/W3C.DublinCore.tsv`, records)
    }
  } catch (error) {
    console.error('Failed to transform Dublin Core:', error)
  }
}

/**
 * Transform SHACL vocabulary
 */
async function transformSHACL(): Promise<void> {
  console.log('Transforming SHACL vocabulary...')

  try {
    const content = await fetchVocabulary(VOCABULARIES.SHACL)
    const { classes, properties } = parseRDFVocabulary(content, VOCABULARIES.SHACL)

    const records: StandardRecord[] = []

    // Add classes
    for (const cls of classes) {
      records.push({
        ns: NS,
        type: 'SHACL_Class',
        id: toWikipediaStyleId(cls.label || cls.uri),
        name: cls.label || cls.uri,
        description: cleanDescription(cls.comment),
        code: cls.uri,
      })
    }

    // Add properties
    for (const prop of properties) {
      records.push({
        ns: NS,
        type: 'SHACL_Property',
        id: toWikipediaStyleId(prop.label || prop.uri),
        name: prop.label || prop.uri,
        description: cleanDescription(prop.comment),
        code: prop.uri,
      })
    }

    if (records.length > 0) {
      writeStandardTSV(`${DATA_DIR}/W3C.SHACL.tsv`, records)
    }
  } catch (error) {
    console.error('Failed to transform SHACL:', error)
  }
}

/**
 * Transform VoID vocabulary
 */
async function transformVoID(): Promise<void> {
  console.log('Transforming VoID vocabulary...')

  try {
    const content = await fetchVocabulary(VOCABULARIES.VOID)
    const { classes, properties } = parseRDFVocabulary(content, VOCABULARIES.VOID)

    const records: StandardRecord[] = []

    // Add classes
    for (const cls of classes) {
      records.push({
        ns: NS,
        type: 'VoID_Class',
        id: toWikipediaStyleId(cls.label || cls.uri),
        name: cls.label || cls.uri,
        description: cleanDescription(cls.comment),
        code: cls.uri,
      })
    }

    // Add properties
    for (const prop of properties) {
      records.push({
        ns: NS,
        type: 'VoID_Property',
        id: toWikipediaStyleId(prop.label || prop.uri),
        name: prop.label || prop.uri,
        description: cleanDescription(prop.comment),
        code: prop.uri,
      })
    }

    if (records.length > 0) {
      writeStandardTSV(`${DATA_DIR}/W3C.VoID.tsv`, records)
    }
  } catch (error) {
    console.error('Failed to transform VoID:', error)
  }
}

/**
 * Transform SPARQL keywords and functions
 */
function transformSPARQL(): void {
  console.log('Transforming SPARQL keywords...')

  const records: StandardRecord[] = []

  // SPARQL Keywords
  const keywords = [
    { name: 'SELECT', description: 'Identifies the variables to return' },
    { name: 'CONSTRUCT', description: 'Returns an RDF graph' },
    { name: 'ASK', description: 'Returns a boolean' },
    { name: 'DESCRIBE', description: 'Returns an RDF graph describing resources' },
    { name: 'WHERE', description: 'Specifies the graph pattern to match' },
    { name: 'FROM', description: 'Specifies the dataset to query' },
    { name: 'OPTIONAL', description: 'Includes optional graph patterns' },
    { name: 'FILTER', description: 'Filters results based on constraints' },
    { name: 'UNION', description: 'Combines results from multiple graph patterns' },
    { name: 'GRAPH', description: 'Specifies a named graph' },
    { name: 'DISTINCT', description: 'Removes duplicate results' },
    { name: 'REDUCED', description: 'Permits duplicate elimination' },
    { name: 'ORDER BY', description: 'Orders the results' },
    { name: 'LIMIT', description: 'Limits the number of results' },
    { name: 'OFFSET', description: 'Skips a number of results' },
    { name: 'PREFIX', description: 'Defines a namespace prefix' },
    { name: 'BASE', description: 'Defines a base URI' },
  ]

  for (const kw of keywords) {
    records.push({
      ns: NS,
      type: 'SPARQL_Keyword',
      id: toWikipediaStyleId(kw.name),
      name: kw.name,
      description: kw.description,
      code: kw.name,
    })
  }

  // SPARQL Functions
  const functions = [
    { name: 'BOUND', description: 'Tests whether a variable is bound' },
    { name: 'IF', description: 'Conditional expression' },
    { name: 'COALESCE', description: 'Returns the first non-error argument' },
    { name: 'EXISTS', description: 'Tests whether a pattern has a solution' },
    { name: 'NOT EXISTS', description: 'Tests whether a pattern has no solution' },
    { name: 'sameTerm', description: 'Tests whether two terms are the same' },
    { name: 'isIRI', description: 'Tests whether a term is an IRI' },
    { name: 'isBlank', description: 'Tests whether a term is a blank node' },
    { name: 'isLiteral', description: 'Tests whether a term is a literal' },
    { name: 'isNumeric', description: 'Tests whether a term is numeric' },
    { name: 'STR', description: 'Returns the string representation' },
    { name: 'LANG', description: 'Returns the language tag' },
    { name: 'DATATYPE', description: 'Returns the datatype' },
    { name: 'IRI', description: 'Constructs an IRI' },
    { name: 'BNODE', description: 'Creates a blank node' },
    { name: 'STRDT', description: 'Constructs a typed literal' },
    { name: 'STRLANG', description: 'Constructs a language-tagged literal' },
    { name: 'UUID', description: 'Generates a UUID' },
    { name: 'STRUUID', description: 'Generates a UUID string' },
  ]

  for (const fn of functions) {
    records.push({
      ns: NS,
      type: 'SPARQL_Function',
      id: toWikipediaStyleId(fn.name),
      name: fn.name,
      description: fn.description,
      code: fn.name,
    })
  }

  // SPARQL Aggregates
  const aggregates = [
    { name: 'COUNT', description: 'Counts the number of values' },
    { name: 'SUM', description: 'Sums numeric values' },
    { name: 'MIN', description: 'Returns the minimum value' },
    { name: 'MAX', description: 'Returns the maximum value' },
    { name: 'AVG', description: 'Returns the average value' },
    { name: 'SAMPLE', description: 'Returns an arbitrary value' },
    { name: 'GROUP_CONCAT', description: 'Concatenates values into a string' },
  ]

  for (const agg of aggregates) {
    records.push({
      ns: NS,
      type: 'SPARQL_Aggregate',
      id: toWikipediaStyleId(agg.name),
      name: agg.name,
      description: agg.description,
      code: agg.name,
    })
  }

  if (records.length > 0) {
    writeStandardTSV(`${DATA_DIR}/W3C.SPARQL.tsv`, records)
  }
}

/**
 * Transform JSON-LD keywords
 */
function transformJSONLD(): void {
  console.log('Transforming JSON-LD keywords...')

  const records: StandardRecord[] = []

  const keywords = [
    { name: '@context', description: 'Defines the context for JSON-LD documents' },
    { name: '@id', description: 'Specifies the identifier for a node' },
    { name: '@type', description: 'Specifies the type of a node' },
    { name: '@value', description: 'Specifies the value of a literal' },
    { name: '@language', description: 'Specifies the language of a string' },
    { name: '@graph', description: 'Contains a graph of nodes' },
    { name: '@list', description: 'Represents an ordered list' },
    { name: '@set', description: 'Represents an unordered set' },
    { name: '@reverse', description: 'Specifies a reverse property' },
    { name: '@base', description: 'Defines the base IRI' },
    { name: '@vocab', description: 'Defines the default vocabulary' },
    { name: '@container', description: 'Specifies how values are contained' },
    { name: '@index', description: 'Provides an index for a value' },
    { name: '@nest', description: 'Nests properties' },
    { name: '@prefix', description: 'Defines namespace prefixes' },
    { name: '@propagate', description: 'Controls context propagation' },
    { name: '@protected', description: 'Prevents term redefinition' },
    { name: '@version', description: 'Specifies the JSON-LD version' },
  ]

  for (const kw of keywords) {
    records.push({
      ns: NS,
      type: 'JSONLD_Keyword',
      id: toWikipediaStyleId(kw.name),
      name: kw.name,
      description: kw.description,
      code: kw.name,
    })
  }

  if (records.length > 0) {
    writeStandardTSV(`${DATA_DIR}/W3C.JSONLD.tsv`, records)
  }
}

/**
 * Main transformation function
 */
export async function transformW3CSemantic(): Promise<void> {
  console.log('=== W3C Semantic Web Standards Transformation ===\n')
  ensureOutputDirs()

  // Transform RDF-based vocabularies (these require HTTP fetching)
  await transformRDF()
  await transformRDFS()
  await transformOWL()
  await transformSKOS()
  await transformDCAT()
  await transformPROV()
  await transformFOAF()
  await transformDublinCore()
  await transformSHACL()
  await transformVoID()

  // Transform static vocabularies
  transformSPARQL()
  transformJSONLD()

  console.log('\n=== W3C Semantic Web Transformation Complete ===')
}

// Run if called directly
if (import.meta.main) {
  transformW3CSemantic().catch(console.error)
}
