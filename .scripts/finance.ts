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
  type StandardRecord,
  type RelationshipRecord,
} from './utils'

const NS_ISO20022 = 'iso20022.org.ai'
const NS_LEI = 'lei.org.ai'
const NS_ISIN = 'isin.org.ai'
const NS_MCC = 'mcc.org.ai'
const NS_SWIFT = 'swift.org.ai'

const SOURCE_DIR = getSourcePath('Finance')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// ============================================================================
// ISO 20022 - Financial Services Messages
// ============================================================================

interface ISO20022MessageRow {
  code: string
  name: string
  businessArea: string
  definition: string
  messageSet: string
}

interface ISO20022BusinessAreaRow {
  code: string
  name: string
  description: string
}

interface ISO20022MessageDefinitionRow {
  code: string
  name: string
  description: string
  version: string
  businessArea: string
}

interface ISO20022DataTypeRow {
  code: string
  name: string
  description: string
  baseType: string
  pattern: string
  minLength: string
  maxLength: string
}

function transformISO20022(): void {
  console.log('Transforming ISO 20022...')

  // Transform Messages
  const messagesFile = join(SOURCE_DIR, 'ISO20022', 'Messages.tsv')
  if (existsSync(messagesFile)) {
    const messages = parseTSV<ISO20022MessageRow>(messagesFile)
    const messageRecords: StandardRecord[] = messages.map(msg => ({
      ns: NS_ISO20022,
      type: 'Message',
      id: toWikipediaStyleId(msg.name),
      name: msg.name,
      description: cleanDescription(msg.definition),
      code: msg.code,
    }))
    writeStandardTSV(join(DATA_DIR, 'Finance.ISO20022.Messages.tsv'), messageRecords)

    // Create relationships: Message -> BusinessArea
    const messageBusinessAreaRels: RelationshipRecord[] = messages
      .filter(msg => msg.businessArea)
      .map(msg => ({
        fromNs: NS_ISO20022,
        fromType: 'Message',
        fromId: toWikipediaStyleId(msg.name),
        toNs: NS_ISO20022,
        toType: 'BusinessArea',
        toId: toWikipediaStyleId(msg.businessArea),
        relationshipType: 'belongs_to',
      }))

    if (messageBusinessAreaRels.length > 0) {
      writeTSV(
        join(REL_DIR, 'Finance.ISO20022.Message.BusinessArea.tsv'),
        messageBusinessAreaRels as unknown as Record<string, string>[],
        ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']
      )
    }
  }

  // Transform Business Areas
  const businessAreasFile = join(SOURCE_DIR, 'ISO20022', 'BusinessAreas.tsv')
  if (existsSync(businessAreasFile)) {
    const businessAreas = parseTSV<ISO20022BusinessAreaRow>(businessAreasFile)
    const businessAreaRecords: StandardRecord[] = businessAreas.map(ba => ({
      ns: NS_ISO20022,
      type: 'BusinessArea',
      id: toWikipediaStyleId(ba.name),
      name: ba.name,
      description: cleanDescription(ba.description),
      code: ba.code,
    }))
    writeStandardTSV(join(DATA_DIR, 'Finance.ISO20022.BusinessAreas.tsv'), businessAreaRecords)
  }

  // Transform Message Definitions
  const messageDefsFile = join(SOURCE_DIR, 'ISO20022', 'MessageDefinitions.tsv')
  if (existsSync(messageDefsFile)) {
    const messageDefs = parseTSV<ISO20022MessageDefinitionRow>(messageDefsFile)
    const messageDefRecords: StandardRecord[] = messageDefs.map(md => ({
      ns: NS_ISO20022,
      type: 'MessageDefinition',
      id: toWikipediaStyleId(md.name),
      name: md.name,
      description: cleanDescription(md.description),
      code: md.code,
    }))
    writeStandardTSV(join(DATA_DIR, 'Finance.ISO20022.MessageDefinitions.tsv'), messageDefRecords)
  }

  // Transform Data Types
  const dataTypesFile = join(SOURCE_DIR, 'ISO20022', 'DataTypes.tsv')
  if (existsSync(dataTypesFile)) {
    const dataTypes = parseTSV<ISO20022DataTypeRow>(dataTypesFile)
    const dataTypeRecords: StandardRecord[] = dataTypes.map(dt => ({
      ns: NS_ISO20022,
      type: 'DataType',
      id: toWikipediaStyleId(dt.name),
      name: dt.name,
      description: cleanDescription(dt.description),
      code: dt.code,
    }))
    writeStandardTSV(join(DATA_DIR, 'Finance.ISO20022.DataTypes.tsv'), dataTypeRecords)
  }
}

// ============================================================================
// LEI - Legal Entity Identifier
// ============================================================================

interface LEIEntityRow {
  lei: string
  legalName: string
  entityStatus: string
  legalJurisdiction: string
  legalForm: string
  entityCategory: string
  registeredAddress: string
  headquartersAddress: string
  registrationAuthority: string
}

interface LEIRelationshipRow {
  id: string
  startNode: string
  endNode: string
  relationshipType: string
  relationshipStatus: string
  relationshipPeriod: string
  validationDocuments: string
}

interface LEIRegistrationAuthorityRow {
  code: string
  name: string
  country: string
  region: string
  website: string
}

function transformLEI(): void {
  console.log('Transforming LEI...')

  // Transform Entities
  const entitiesFile = join(SOURCE_DIR, 'LEI', 'Entities.tsv')
  if (existsSync(entitiesFile)) {
    const entities = parseTSV<LEIEntityRow>(entitiesFile)
    const entityRecords: StandardRecord[] = entities.map(entity => ({
      ns: NS_LEI,
      type: 'Entity',
      id: toWikipediaStyleId(entity.legalName),
      name: entity.legalName,
      description: cleanDescription(`${entity.entityCategory} - ${entity.legalJurisdiction}`),
      code: entity.lei,
    }))
    writeStandardTSV(join(DATA_DIR, 'Finance.LEI.Entities.tsv'), entityRecords)
  }

  // Transform Relationships
  const relationshipsFile = join(SOURCE_DIR, 'LEI', 'Relationships.tsv')
  if (existsSync(relationshipsFile)) {
    const relationships = parseTSV<LEIRelationshipRow>(relationshipsFile)
    const relationshipRecords: StandardRecord[] = relationships.map(rel => ({
      ns: NS_LEI,
      type: 'Relationship',
      id: rel.id,
      name: `${rel.relationshipType}: ${rel.startNode} -> ${rel.endNode}`,
      description: cleanDescription(`${rel.relationshipStatus} relationship`),
      code: rel.id,
    }))
    writeStandardTSV(join(DATA_DIR, 'Finance.LEI.Relationships.tsv'), relationshipRecords)

    // Create entity-to-entity relationships
    const entityRels: RelationshipRecord[] = relationships.map(rel => ({
      fromNs: NS_LEI,
      fromType: 'Entity',
      fromId: rel.startNode,
      toNs: NS_LEI,
      toType: 'Entity',
      toId: rel.endNode,
      relationshipType: rel.relationshipType,
    }))

    if (entityRels.length > 0) {
      writeTSV(
        join(REL_DIR, 'Finance.LEI.Entity.Entity.tsv'),
        entityRels as unknown as Record<string, string>[],
        ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']
      )
    }
  }

  // Transform Registration Authorities
  const registrationAuthoritiesFile = join(SOURCE_DIR, 'LEI', 'RegistrationAuthorities.tsv')
  if (existsSync(registrationAuthoritiesFile)) {
    const authorities = parseTSV<LEIRegistrationAuthorityRow>(registrationAuthoritiesFile)
    const authorityRecords: StandardRecord[] = authorities.map(auth => ({
      ns: NS_LEI,
      type: 'RegistrationAuthority',
      id: toWikipediaStyleId(auth.name),
      name: auth.name,
      description: cleanDescription(`${auth.country} - ${auth.region}`),
      code: auth.code,
    }))
    writeStandardTSV(join(DATA_DIR, 'Finance.LEI.RegistrationAuthorities.tsv'), authorityRecords)
  }
}

// ============================================================================
// ISIN - International Securities Identification Number
// ============================================================================

interface ISINSecurityRow {
  isin: string
  name: string
  issuer: string
  securityType: string
  currency: string
  countryOfIssue: string
  maturityDate: string
  couponRate: string
  faceValue: string
}

interface ISINIssuerRow {
  code: string
  name: string
  lei: string
  country: string
  sector: string
  website: string
}

function transformISIN(): void {
  console.log('Transforming ISIN...')

  // Transform Securities
  const securitiesFile = join(SOURCE_DIR, 'ISIN', 'Securities.tsv')
  if (existsSync(securitiesFile)) {
    const securities = parseTSV<ISINSecurityRow>(securitiesFile)
    const securityRecords: StandardRecord[] = securities.map(security => ({
      ns: NS_ISIN,
      type: 'Security',
      id: toWikipediaStyleId(security.name),
      name: security.name,
      description: cleanDescription(`${security.securityType} - ${security.countryOfIssue}`),
      code: security.isin,
    }))
    writeStandardTSV(join(DATA_DIR, 'Finance.ISIN.Securities.tsv'), securityRecords)

    // Create relationships: Security -> Issuer
    const securityIssuerRels: RelationshipRecord[] = securities
      .filter(security => security.issuer)
      .map(security => ({
        fromNs: NS_ISIN,
        fromType: 'Security',
        fromId: toWikipediaStyleId(security.name),
        toNs: NS_ISIN,
        toType: 'Issuer',
        toId: security.issuer,
        relationshipType: 'issued_by',
      }))

    if (securityIssuerRels.length > 0) {
      writeTSV(
        join(REL_DIR, 'Finance.ISIN.Security.Issuer.tsv'),
        securityIssuerRels as unknown as Record<string, string>[],
        ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']
      )
    }
  }

  // Transform Issuers
  const issuersFile = join(SOURCE_DIR, 'ISIN', 'Issuers.tsv')
  if (existsSync(issuersFile)) {
    const issuers = parseTSV<ISINIssuerRow>(issuersFile)
    const issuerRecords: StandardRecord[] = issuers.map(issuer => ({
      ns: NS_ISIN,
      type: 'Issuer',
      id: toWikipediaStyleId(issuer.name),
      name: issuer.name,
      description: cleanDescription(`${issuer.sector} - ${issuer.country}`),
      code: issuer.code,
    }))
    writeStandardTSV(join(DATA_DIR, 'Finance.ISIN.Issuers.tsv'), issuerRecords)

    // Create relationships: Issuer -> LEI
    const issuerLEIRels: RelationshipRecord[] = issuers
      .filter(issuer => issuer.lei)
      .map(issuer => ({
        fromNs: NS_ISIN,
        fromType: 'Issuer',
        fromId: toWikipediaStyleId(issuer.name),
        toNs: NS_LEI,
        toType: 'Entity',
        toId: issuer.lei,
        relationshipType: 'has_lei',
      }))

    if (issuerLEIRels.length > 0) {
      writeTSV(
        join(REL_DIR, 'Finance.ISIN.Issuer.LEI.tsv'),
        issuerLEIRels as unknown as Record<string, string>[],
        ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']
      )
    }
  }
}

// ============================================================================
// MCC - Merchant Category Codes
// ============================================================================

interface MCCCategoryRow {
  code: string
  name: string
  description: string
  range: string
}

interface MCCCodeRow {
  mcc: string
  name: string
  description: string
  category: string
  usedBy: string
  interchangeFee: string
}

function transformMCC(): void {
  console.log('Transforming MCC...')

  // Transform Categories
  const categoriesFile = join(SOURCE_DIR, 'MCC', 'Categories.tsv')
  if (existsSync(categoriesFile)) {
    const categories = parseTSV<MCCCategoryRow>(categoriesFile)
    const categoryRecords: StandardRecord[] = categories.map(cat => ({
      ns: NS_MCC,
      type: 'Category',
      id: toWikipediaStyleId(cat.name),
      name: cat.name,
      description: cleanDescription(cat.description),
      code: cat.code,
    }))
    writeStandardTSV(join(DATA_DIR, 'Finance.MCC.Categories.tsv'), categoryRecords)
  }

  // Transform Codes
  const codesFile = join(SOURCE_DIR, 'MCC', 'Codes.tsv')
  if (existsSync(codesFile)) {
    const codes = parseTSV<MCCCodeRow>(codesFile)
    const codeRecords: StandardRecord[] = codes.map(code => ({
      ns: NS_MCC,
      type: 'Code',
      id: toWikipediaStyleId(code.name),
      name: code.name,
      description: cleanDescription(code.description),
      code: code.mcc,
    }))
    writeStandardTSV(join(DATA_DIR, 'Finance.MCC.Codes.tsv'), codeRecords)

    // Create relationships: Code -> Category
    const codeCategoryRels: RelationshipRecord[] = codes
      .filter(code => code.category)
      .map(code => ({
        fromNs: NS_MCC,
        fromType: 'Code',
        fromId: toWikipediaStyleId(code.name),
        toNs: NS_MCC,
        toType: 'Category',
        toId: toWikipediaStyleId(code.category),
        relationshipType: 'belongs_to',
      }))

    if (codeCategoryRels.length > 0) {
      writeTSV(
        join(REL_DIR, 'Finance.MCC.Code.Category.tsv'),
        codeCategoryRels as unknown as Record<string, string>[],
        ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']
      )
    }
  }
}

// ============================================================================
// SWIFT - BIC/SWIFT Codes
// ============================================================================

interface SWIFTInstitutionRow {
  bic: string
  institutionName: string
  country: string
  city: string
  lei: string
  institutionType: string
}

interface SWIFTBranchRow {
  branchCode: string
  branchName: string
  institutionBIC: string
  address: string
  city: string
  country: string
}

function transformSWIFT(): void {
  console.log('Transforming SWIFT...')

  // Transform Institutions
  const institutionsFile = join(SOURCE_DIR, 'SWIFT', 'Institutions.tsv')
  if (existsSync(institutionsFile)) {
    const institutions = parseTSV<SWIFTInstitutionRow>(institutionsFile)
    const institutionRecords: StandardRecord[] = institutions.map(inst => ({
      ns: NS_SWIFT,
      type: 'Institution',
      id: toWikipediaStyleId(inst.institutionName),
      name: inst.institutionName,
      description: cleanDescription(`${inst.institutionType} - ${inst.city}, ${inst.country}`),
      code: inst.bic,
    }))
    writeStandardTSV(join(DATA_DIR, 'Finance.SWIFT.Institutions.tsv'), institutionRecords)

    // Create relationships: Institution -> LEI
    const institutionLEIRels: RelationshipRecord[] = institutions
      .filter(inst => inst.lei)
      .map(inst => ({
        fromNs: NS_SWIFT,
        fromType: 'Institution',
        fromId: toWikipediaStyleId(inst.institutionName),
        toNs: NS_LEI,
        toType: 'Entity',
        toId: inst.lei,
        relationshipType: 'has_lei',
      }))

    if (institutionLEIRels.length > 0) {
      writeTSV(
        join(REL_DIR, 'Finance.SWIFT.Institution.LEI.tsv'),
        institutionLEIRels as unknown as Record<string, string>[],
        ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']
      )
    }
  }

  // Transform Branches
  const branchesFile = join(SOURCE_DIR, 'SWIFT', 'Branches.tsv')
  if (existsSync(branchesFile)) {
    const branches = parseTSV<SWIFTBranchRow>(branchesFile)
    const branchRecords: StandardRecord[] = branches.map(branch => ({
      ns: NS_SWIFT,
      type: 'Branch',
      id: toWikipediaStyleId(branch.branchName),
      name: branch.branchName,
      description: cleanDescription(`${branch.city}, ${branch.country}`),
      code: branch.branchCode,
    }))
    writeStandardTSV(join(DATA_DIR, 'Finance.SWIFT.Branches.tsv'), branchRecords)

    // Create relationships: Branch -> Institution
    const branchInstitutionRels: RelationshipRecord[] = branches
      .filter(branch => branch.institutionBIC)
      .map(branch => ({
        fromNs: NS_SWIFT,
        fromType: 'Branch',
        fromId: toWikipediaStyleId(branch.branchName),
        toNs: NS_SWIFT,
        toType: 'Institution',
        toId: branch.institutionBIC,
        relationshipType: 'branch_of',
      }))

    if (branchInstitutionRels.length > 0) {
      writeTSV(
        join(REL_DIR, 'Finance.SWIFT.Branch.Institution.tsv'),
        branchInstitutionRels as unknown as Record<string, string>[],
        ['fromNs', 'fromType', 'fromId', 'toNs', 'toType', 'toId', 'relationshipType']
      )
    }
  }
}

// ============================================================================
// Main Transform Function
// ============================================================================

export async function transformFinance(): Promise<void> {
  console.log('=== Finance Standards Transformation ===')
  ensureOutputDirs()

  try {
    transformISO20022()
  } catch (e) {
    console.log('ISO 20022 transformation failed or skipped:', e)
  }

  try {
    transformLEI()
  } catch (e) {
    console.log('LEI transformation failed or skipped:', e)
  }

  try {
    transformISIN()
  } catch (e) {
    console.log('ISIN transformation failed or skipped:', e)
  }

  try {
    transformMCC()
  } catch (e) {
    console.log('MCC transformation failed or skipped:', e)
  }

  try {
    transformSWIFT()
  } catch (e) {
    console.log('SWIFT transformation failed or skipped:', e)
  }

  console.log('=== Finance Standards Transformation Complete ===\n')
}

// Run if called directly
if (import.meta.main) {
  transformFinance()
}
