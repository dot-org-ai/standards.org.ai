# US Government Standards

This directory contains MDX layouts and data for United States government standards and programs.

## Directory Structure

### US/SBA - Small Business Administration

Standards and certifications from the U.S. Small Business Administration.

**MDX Layouts:**
- `[SizeStandard].mdx` - Size standards by NAICS code (revenue or employee thresholds)
- `[IndustryFootnote].mdx` - Footnotes that modify size standards
- `[ExceptionCode].mdx` - Exception codes for size standards
- `[BusinessType].mdx` - Business types (Small, SDB, WOSB, HUBZone, SDVOSB, 8(a))
- `[ContractType].mdx` - Federal contract set-aside types

**Canonical URLs:**
All SBA content uses `us.org.ai/SBA/...` as the canonical domain.

**Data Script:**
`.scripts/us-sba.ts` - Transforms SBA data into TSV format

**Data Sources:**
- Size Standards Table: https://www.sba.gov/document/support-table-size-standards
- 13 CFR 121.201: https://www.ecfr.gov/current/title-13/chapter-I/part-121
- SBA Size Standards Tool: https://www.sba.gov/size-standards/

## Business Types

The SBA recognizes several business certification types:

1. **Small Business (SB)** - Meets size standards for industry
2. **Small Disadvantaged Business (SDB)** - 51%+ owned by disadvantaged individuals
3. **Women-Owned Small Business (WOSB)** - 51%+ owned by women
4. **Economically Disadvantaged WOSB (EDWOSB)** - WOSB that is economically disadvantaged
5. **HUBZone** - Located in Historically Underutilized Business Zone
6. **Service-Disabled Veteran-Owned (SDVOSB)** - 51%+ owned by service-disabled veterans
7. **Veteran-Owned Small Business (VOSB)** - 51%+ owned by veterans
8. **8(a) Program** - Business development program for disadvantaged businesses

## Contract Set-Asides

Federal contracts can be set aside for specific business types:

- **Small Business Set-Aside** - Limited to small businesses
- **8(a) Set-Aside** - Limited to 8(a) participants
- **HUBZone Set-Aside** - Limited to HUBZone businesses
- **SDVOSB Set-Aside** - Limited to service-disabled veteran-owned businesses
- **WOSB Set-Aside** - Limited to women-owned businesses
- **EDWOSB Set-Aside** - Limited to economically disadvantaged women-owned businesses
- **8(a) Sole Source** - Non-competitive award to 8(a) participant

## Size Standards

SBA size standards determine whether a business qualifies as "small" for a given industry. Standards are based on either:

1. **Revenue** - Average annual receipts (e.g., $16.5 million, $41.5 million)
2. **Employees** - Number of employees (e.g., 500, 1,000, 1,500)

Size standards are mapped to 6-digit NAICS codes and may include:
- **Footnotes** - Special conditions or modifications
- **Exceptions** - Industry-specific rules

## Usage

### Running the Transformation

```bash
cd /Users/nathanclevenger/projects/standards.org.ai
bun run .scripts/us-sba.ts
```

### Generated Files

**Data Files (.data/):**
- `SBA.SizeStandards.tsv` - Size standard records
- `SBA.SizeStandardsExtended.tsv` - Extended data with all fields
- `SBA.IndustryFootnotes.tsv` - Footnote records
- `SBA.IndustryFootnotesExtended.tsv` - Extended footnote data
- `SBA.ExceptionCodes.tsv` - Exception code records
- `SBA.ExceptionCodesExtended.tsv` - Extended exception data
- `SBA.BusinessTypes.tsv` - Business type records
- `SBA.BusinessTypesExtended.tsv` - Extended business type data
- `SBA.ContractTypes.tsv` - Contract type records
- `SBA.ContractTypesExtended.tsv` - Extended contract type data

**Relationship Files (.data/relationships/):**
- `SBA.SizeStandard.NAICS.tsv` - Links size standards to NAICS codes
- `SBA.ContractType.BusinessType.tsv` - Links contract types to business types

## Schema

All records follow the standard schema:

```typescript
interface StandardRecord {
  ns: string          // Namespace (us.org.ai)
  type: string        // Record type (SizeStandard, BusinessType, etc.)
  id: string          // Wikipedia-style identifier
  name: string        // Human-readable name
  description: string // Description text
  code: string        // Original code value
}
```

Extended records include additional type-specific fields.

## Cross-References

SBA standards cross-reference with:
- **NAICS** - Size standards map to NAICS industry codes
- **Contract Vehicles** - Set-asides apply to specific business types
- **Federal Regulations** - 13 CFR Part 121 governs size standards

## Notes

- Size standards are updated periodically by the SBA
- Some industries have special size standards with footnotes
- HUBZone areas are determined by census tract
- 8(a) program is a 9-year business development program
- Veteran status must be verified through VA or SBA
