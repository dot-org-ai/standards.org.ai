/**
 * W3C Credentials & Identity Transformation Script
 * Transforms W3C Verifiable Credentials, DID, and WebAuthn data into standard TSV format
 */

import { join } from 'path'
import {
  StandardRecord,
  RelationshipRecord,
  writeStandardTSV,
  writeRelationshipTSV,
  toWikipediaStyleId,
  cleanDescription,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
} from './utils'

const NS = 'w3c.org.ai'
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

/**
 * Transform Verifiable Credentials Data Model types
 * Source: https://www.w3.org/TR/vc-data-model/
 */
function transformVCDataModel(): void {
  console.log('Transforming Verifiable Credentials Data Model...')

  // Core VC Types
  const vcTypes: StandardRecord[] = [
    {
      ns: NS,
      type: 'VCType',
      id: 'VerifiableCredential',
      name: 'VerifiableCredential',
      description: 'A credential that has been cryptographically signed by its issuer',
      code: 'VC',
    },
    {
      ns: NS,
      type: 'VCType',
      id: 'VerifiablePresentation',
      name: 'VerifiablePresentation',
      description: 'A presentation of one or more verifiable credentials that has been cryptographically signed',
      code: 'VP',
    },
  ]

  // Proof Types
  const proofTypes: StandardRecord[] = [
    {
      ns: NS,
      type: 'ProofType',
      id: 'JsonWebSignature2020',
      name: 'JsonWebSignature2020',
      description: 'JSON Web Signature proof format based on JWS',
      code: 'JWS2020',
    },
    {
      ns: NS,
      type: 'ProofType',
      id: 'Ed25519Signature2020',
      name: 'Ed25519Signature2020',
      description: 'Ed25519 signature suite for Linked Data proofs',
      code: 'Ed25519-2020',
    },
    {
      ns: NS,
      type: 'ProofType',
      id: 'EcdsaSecp256k1Signature2019',
      name: 'EcdsaSecp256k1Signature2019',
      description: 'ECDSA secp256k1 signature suite for Linked Data proofs',
      code: 'ECDSA-2019',
    },
    {
      ns: NS,
      type: 'ProofType',
      id: 'RsaSignature2018',
      name: 'RsaSignature2018',
      description: 'RSA signature suite for Linked Data proofs',
      code: 'RSA-2018',
    },
    {
      ns: NS,
      type: 'ProofType',
      id: 'BbsBlsSignature2020',
      name: 'BbsBlsSignature2020',
      description: 'BBS+ signature suite enabling selective disclosure',
      code: 'BBS-2020',
    },
  ]

  // Credential Status Types
  const statusTypes: StandardRecord[] = [
    {
      ns: NS,
      type: 'StatusType',
      id: 'RevocationList2020',
      name: 'RevocationList2020',
      description: 'Bitstring-based credential revocation list',
      code: 'RL2020',
    },
    {
      ns: NS,
      type: 'StatusType',
      id: 'StatusList2021',
      name: 'StatusList2021',
      description: 'Privacy-preserving status list for credentials',
      code: 'SL2021',
    },
  ]

  // VC Vocabulary Terms
  const vcVocab: StandardRecord[] = [
    {
      ns: NS,
      type: 'VCProperty',
      id: 'Issuer',
      name: 'issuer',
      description: 'The entity that issued the credential',
      code: 'issuer',
    },
    {
      ns: NS,
      type: 'VCProperty',
      id: 'Holder',
      name: 'holder',
      description: 'The entity that holds the credential',
      code: 'holder',
    },
    {
      ns: NS,
      type: 'VCProperty',
      id: 'Subject',
      name: 'credentialSubject',
      description: 'The entity about which claims are made',
      code: 'credentialSubject',
    },
    {
      ns: NS,
      type: 'VCProperty',
      id: 'IssuanceDate',
      name: 'issuanceDate',
      description: 'Date and time when the credential becomes valid',
      code: 'issuanceDate',
    },
    {
      ns: NS,
      type: 'VCProperty',
      id: 'ExpirationDate',
      name: 'expirationDate',
      description: 'Date and time when the credential ceases to be valid',
      code: 'expirationDate',
    },
    {
      ns: NS,
      type: 'VCProperty',
      id: 'CredentialStatus',
      name: 'credentialStatus',
      description: 'Information used to determine the current status of a credential',
      code: 'credentialStatus',
    },
    {
      ns: NS,
      type: 'VCProperty',
      id: 'Proof',
      name: 'proof',
      description: 'Cryptographic proof that makes the credential tamper-evident',
      code: 'proof',
    },
  ]

  writeStandardTSV(join(DATA_DIR, 'W3C.VCTypes.tsv'), vcTypes)
  writeStandardTSV(join(DATA_DIR, 'W3C.ProofTypes.tsv'), proofTypes)
  writeStandardTSV(join(DATA_DIR, 'W3C.StatusTypes.tsv'), statusTypes)
  writeStandardTSV(join(DATA_DIR, 'W3C.VCProperties.tsv'), vcVocab)
}

/**
 * Transform DID Core specification types
 * Source: https://www.w3.org/TR/did-core/
 */
function transformDIDCore(): void {
  console.log('Transforming DID Core specification...')

  // DID Document Properties
  const didProperties: StandardRecord[] = [
    {
      ns: NS,
      type: 'DIDProperty',
      id: 'Id',
      name: 'id',
      description: 'The DID subject that the DID document is about',
      code: 'id',
    },
    {
      ns: NS,
      type: 'DIDProperty',
      id: 'Controller',
      name: 'controller',
      description: 'One or more entities that are authorized to make changes to the DID document',
      code: 'controller',
    },
    {
      ns: NS,
      type: 'DIDProperty',
      id: 'AlsoKnownAs',
      name: 'alsoKnownAs',
      description: 'One or more URIs that are also known to refer to the DID subject',
      code: 'alsoKnownAs',
    },
    {
      ns: NS,
      type: 'DIDProperty',
      id: 'VerificationMethod',
      name: 'verificationMethod',
      description: 'Cryptographic public keys or verification methods for authentication',
      code: 'verificationMethod',
    },
    {
      ns: NS,
      type: 'DIDProperty',
      id: 'Authentication',
      name: 'authentication',
      description: 'Verification methods for authentication purposes',
      code: 'authentication',
    },
    {
      ns: NS,
      type: 'DIDProperty',
      id: 'AssertionMethod',
      name: 'assertionMethod',
      description: 'Verification methods for issuing verifiable credentials',
      code: 'assertionMethod',
    },
    {
      ns: NS,
      type: 'DIDProperty',
      id: 'KeyAgreement',
      name: 'keyAgreement',
      description: 'Verification methods for key agreement protocols',
      code: 'keyAgreement',
    },
    {
      ns: NS,
      type: 'DIDProperty',
      id: 'CapabilityInvocation',
      name: 'capabilityInvocation',
      description: 'Verification methods for invoking cryptographic capabilities',
      code: 'capabilityInvocation',
    },
    {
      ns: NS,
      type: 'DIDProperty',
      id: 'CapabilityDelegation',
      name: 'capabilityDelegation',
      description: 'Verification methods for delegating cryptographic capabilities',
      code: 'capabilityDelegation',
    },
    {
      ns: NS,
      type: 'DIDProperty',
      id: 'Service',
      name: 'service',
      description: 'Service endpoints for interacting with the DID subject',
      code: 'service',
    },
  ]

  // DID Service Types
  const serviceTypes: StandardRecord[] = [
    {
      ns: NS,
      type: 'DIDServiceType',
      id: 'LinkedDomains',
      name: 'LinkedDomains',
      description: 'Service for linking DIDs to web domains',
      code: 'LinkedDomains',
    },
    {
      ns: NS,
      type: 'DIDServiceType',
      id: 'DIDCommMessaging',
      name: 'DIDCommMessaging',
      description: 'Service endpoint for DIDComm encrypted messaging',
      code: 'DIDCommMessaging',
    },
    {
      ns: NS,
      type: 'DIDServiceType',
      id: 'CredentialRegistry',
      name: 'CredentialRegistry',
      description: 'Service for accessing a credential registry',
      code: 'CredentialRegistry',
    },
    {
      ns: NS,
      type: 'DIDServiceType',
      id: 'VerifiableCredentialService',
      name: 'VerifiableCredentialService',
      description: 'Service for issuing or verifying credentials',
      code: 'VCService',
    },
    {
      ns: NS,
      type: 'DIDServiceType',
      id: 'MessagingService',
      name: 'MessagingService',
      description: 'Generic messaging service endpoint',
      code: 'MessagingService',
    },
  ]

  // DID Verification Method Types
  const verificationMethods: StandardRecord[] = [
    {
      ns: NS,
      type: 'VerificationMethodType',
      id: 'JsonWebKey2020',
      name: 'JsonWebKey2020',
      description: 'JWK-based verification method',
      code: 'JWK2020',
    },
    {
      ns: NS,
      type: 'VerificationMethodType',
      id: 'Ed25519VerificationKey2020',
      name: 'Ed25519VerificationKey2020',
      description: 'Ed25519 public key verification method',
      code: 'Ed25519-2020',
    },
    {
      ns: NS,
      type: 'VerificationMethodType',
      id: 'EcdsaSecp256k1VerificationKey2019',
      name: 'EcdsaSecp256k1VerificationKey2019',
      description: 'ECDSA secp256k1 public key verification method',
      code: 'ECDSA-2019',
    },
    {
      ns: NS,
      type: 'VerificationMethodType',
      id: 'RsaVerificationKey2018',
      name: 'RsaVerificationKey2018',
      description: 'RSA public key verification method',
      code: 'RSA-2018',
    },
    {
      ns: NS,
      type: 'VerificationMethodType',
      id: 'X25519KeyAgreementKey2019',
      name: 'X25519KeyAgreementKey2019',
      description: 'X25519 key agreement verification method',
      code: 'X25519-2019',
    },
    {
      ns: NS,
      type: 'VerificationMethodType',
      id: 'Bls12381G2Key2020',
      name: 'Bls12381G2Key2020',
      description: 'BLS12-381 G2 public key verification method',
      code: 'BLS12381-2020',
    },
  ]

  writeStandardTSV(join(DATA_DIR, 'W3C.DIDProperties.tsv'), didProperties)
  writeStandardTSV(join(DATA_DIR, 'W3C.DIDServiceTypes.tsv'), serviceTypes)
  writeStandardTSV(join(DATA_DIR, 'W3C.VerificationMethodTypes.tsv'), verificationMethods)
}

/**
 * Transform DID Method Registry
 * Source: https://w3c.github.io/did-spec-registries/
 */
function transformDIDMethods(): void {
  console.log('Transforming DID Methods...')

  const didMethods: StandardRecord[] = [
    {
      ns: NS,
      type: 'DIDMethod',
      id: 'Did_Web',
      name: 'did:web',
      description: 'DID method that uses web domains for decentralized identifiers',
      code: 'web',
    },
    {
      ns: NS,
      type: 'DIDMethod',
      id: 'Did_Key',
      name: 'did:key',
      description: 'DID method that encodes public keys directly in the DID',
      code: 'key',
    },
    {
      ns: NS,
      type: 'DIDMethod',
      id: 'Did_Ethr',
      name: 'did:ethr',
      description: 'DID method for Ethereum addresses and smart contracts',
      code: 'ethr',
    },
    {
      ns: NS,
      type: 'DIDMethod',
      id: 'Did_Ion',
      name: 'did:ion',
      description: 'DID method built on Bitcoin using Sidetree protocol',
      code: 'ion',
    },
    {
      ns: NS,
      type: 'DIDMethod',
      id: 'Did_Peer',
      name: 'did:peer',
      description: 'DID method for peer-to-peer relationships without a blockchain',
      code: 'peer',
    },
    {
      ns: NS,
      type: 'DIDMethod',
      id: 'Did_Sov',
      name: 'did:sov',
      description: 'DID method for Sovrin Network',
      code: 'sov',
    },
    {
      ns: NS,
      type: 'DIDMethod',
      id: 'Did_Pkh',
      name: 'did:pkh',
      description: 'DID method for blockchain account addresses',
      code: 'pkh',
    },
    {
      ns: NS,
      type: 'DIDMethod',
      id: 'Did_Jwk',
      name: 'did:jwk',
      description: 'DID method that transforms a JWK into a DID',
      code: 'jwk',
    },
    {
      ns: NS,
      type: 'DIDMethod',
      id: 'Did_Tz',
      name: 'did:tz',
      description: 'DID method for Tezos blockchain',
      code: 'tz',
    },
    {
      ns: NS,
      type: 'DIDMethod',
      id: 'Did_Ebsi',
      name: 'did:ebsi',
      description: 'DID method for European Blockchain Services Infrastructure',
      code: 'ebsi',
    },
  ]

  writeStandardTSV(join(DATA_DIR, 'W3C.DIDMethods.tsv'), didMethods)
}

/**
 * Transform WebAuthn specification types
 * Source: https://www.w3.org/TR/webauthn-2/
 */
function transformWebAuthn(): void {
  console.log('Transforming WebAuthn specification...')

  // WebAuthn Authenticator Types
  const authenticatorTypes: StandardRecord[] = [
    {
      ns: NS,
      type: 'AuthenticatorType',
      id: 'Platform',
      name: 'platform',
      description: 'Platform authenticator embedded in the client device',
      code: 'platform',
    },
    {
      ns: NS,
      type: 'AuthenticatorType',
      id: 'Cross_Platform',
      name: 'cross-platform',
      description: 'Roaming authenticator that can be used across multiple devices',
      code: 'cross-platform',
    },
  ]

  // WebAuthn Ceremonies
  const ceremonies: StandardRecord[] = [
    {
      ns: NS,
      type: 'WebAuthnCeremony',
      id: 'Registration',
      name: 'Registration',
      description: 'Ceremony for creating and registering a new credential',
      code: 'registration',
    },
    {
      ns: NS,
      type: 'WebAuthnCeremony',
      id: 'Authentication',
      name: 'Authentication',
      description: 'Ceremony for authenticating using an existing credential',
      code: 'authentication',
    },
  ]

  // WebAuthn Extensions
  const extensions: StandardRecord[] = [
    {
      ns: NS,
      type: 'WebAuthnExtension',
      id: 'Appid',
      name: 'appid',
      description: 'Extension for backward compatibility with U2F AppID',
      code: 'appid',
    },
    {
      ns: NS,
      type: 'WebAuthnExtension',
      id: 'Appidexclude',
      name: 'appidExclude',
      description: 'Extension for excluding credentials based on U2F AppID',
      code: 'appidExclude',
    },
    {
      ns: NS,
      type: 'WebAuthnExtension',
      id: 'Credprops',
      name: 'credProps',
      description: 'Extension for retrieving credential properties',
      code: 'credProps',
    },
    {
      ns: NS,
      type: 'WebAuthnExtension',
      id: 'Largeblob',
      name: 'largeBlob',
      description: 'Extension for storing and retrieving large blob data',
      code: 'largeBlob',
    },
    {
      ns: NS,
      type: 'WebAuthnExtension',
      id: 'Credprotect',
      name: 'credProtect',
      description: 'Extension for credential protection policy',
      code: 'credProtect',
    },
    {
      ns: NS,
      type: 'WebAuthnExtension',
      id: 'Hmac_Secret',
      name: 'hmac-secret',
      description: 'Extension for generating HMAC secrets',
      code: 'hmac-secret',
    },
    {
      ns: NS,
      type: 'WebAuthnExtension',
      id: 'Minpinlength',
      name: 'minPinLength',
      description: 'Extension for minimum PIN length requirement',
      code: 'minPinLength',
    },
    {
      ns: NS,
      type: 'WebAuthnExtension',
      id: 'Prf',
      name: 'prf',
      description: 'Extension for pseudo-random function evaluation',
      code: 'prf',
    },
  ]

  // WebAuthn Attestation Types
  const attestationTypes: StandardRecord[] = [
    {
      ns: NS,
      type: 'AttestationType',
      id: 'Basic',
      name: 'Basic',
      description: 'Basic attestation with authenticator signing key',
      code: 'basic',
    },
    {
      ns: NS,
      type: 'AttestationType',
      id: 'Self',
      name: 'Self',
      description: 'Self attestation using credential private key',
      code: 'self',
    },
    {
      ns: NS,
      type: 'AttestationType',
      id: 'Attca',
      name: 'AttCA',
      description: 'Attestation using Attestation CA',
      code: 'attca',
    },
    {
      ns: NS,
      type: 'AttestationType',
      id: 'Ecdaa',
      name: 'ECDAA',
      description: 'Elliptic Curve based Direct Anonymous Attestation',
      code: 'ecdaa',
    },
    {
      ns: NS,
      type: 'AttestationType',
      id: 'None',
      name: 'None',
      description: 'No attestation statement provided',
      code: 'none',
    },
  ]

  writeStandardTSV(join(DATA_DIR, 'W3C.AuthenticatorTypes.tsv'), authenticatorTypes)
  writeStandardTSV(join(DATA_DIR, 'W3C.WebAuthnCeremonies.tsv'), ceremonies)
  writeStandardTSV(join(DATA_DIR, 'W3C.WebAuthnExtensions.tsv'), extensions)
  writeStandardTSV(join(DATA_DIR, 'W3C.AttestationTypes.tsv'), attestationTypes)
}

/**
 * Create relationships between related entities
 */
function createRelationships(): void {
  console.log('Creating relationships...')

  const relationships: RelationshipRecord[] = [
    // VC Types use Proof Types
    {
      fromNs: NS,
      fromType: 'VCType',
      fromId: 'VerifiableCredential',
      toNs: NS,
      toType: 'ProofType',
      toId: 'JsonWebSignature2020',
      relationshipType: 'can_use',
    },
    {
      fromNs: NS,
      fromType: 'VCType',
      fromId: 'VerifiableCredential',
      toNs: NS,
      toType: 'ProofType',
      toId: 'Ed25519Signature2020',
      relationshipType: 'can_use',
    },
    // DID Methods support Verification Method Types
    {
      fromNs: NS,
      fromType: 'DIDMethod',
      fromId: 'Did_Key',
      toNs: NS,
      toType: 'VerificationMethodType',
      toId: 'Ed25519VerificationKey2020',
      relationshipType: 'supports',
    },
    {
      fromNs: NS,
      fromType: 'DIDMethod',
      fromId: 'Did_Jwk',
      toNs: NS,
      toType: 'VerificationMethodType',
      toId: 'JsonWebKey2020',
      relationshipType: 'supports',
    },
  ]

  writeRelationshipTSV(join(REL_DIR, 'W3C.Credentials.relationships.tsv'), relationships)
}

export async function transformW3CCredentials(): Promise<void> {
  console.log('=== W3C Credentials & Identity Transformation ===\n')
  ensureOutputDirs()

  transformVCDataModel()
  transformDIDCore()
  transformDIDMethods()
  transformWebAuthn()
  createRelationships()

  console.log('\n=== W3C Credentials Transformation Complete ===')
}

// Run if called directly
if (import.meta.main) {
  transformW3CCredentials().catch(console.error)
}
