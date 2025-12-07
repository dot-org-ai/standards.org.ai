# SBA (Small Business Administration) Standards

MDX layouts and TypeScript transformation script for SBA standards.

## Overview

The Small Business Administration (SBA) sets size standards that determine whether a business qualifies as "small" for federal contracting and assistance programs. These standards vary by industry (NAICS code) and are based on either revenue thresholds or employee counts.

## MDX Layouts

All layouts use canonical URLs at `us.org.ai/SBA/...`

### [SizeStandard].mdx

Size standards by NAICS code - the core determination of whether a business is "small" in a given industry.

**Schema Fields:**
- `naicsCode` - The 6-digit NAICS industry code
- `naicsTitle` - Industry name
- `sizeStandard` - Threshold value (e.g., "$16.5 million" or "500 employees")
- `sizeType` - Type of standard (Revenue or Employees)
- `footnotes` - Optional footnote codes that modify the standard

**Components:**
- `<SizeStandardHeader>` - Page header with NAICS code and title
- `<NAICSIndustryLink>` - Link to the NAICS industry page
- `<FootnotesList>` - Display applicable footnotes
- `<BusinessTypesBySizeStandard>` - Business certifications applicable
- `<ContractTypesByIndustry>` - Contract set-asides for this industry
- `<ExceptionCodesByIndustry>` - Special exceptions

### [IndustryFootnote].mdx

Footnotes that modify or clarify size standards.

**Schema Fields:**
- `code` - Footnote identifier (e.g., "1", "18")
- `text` - Full text of the footnote
- `applicableIndustries` - NAICS codes affected

**Components:**
- `<FootnoteHeader>` - Footnote identifier
- `<IndustriesByFootnote>` - Industries affected by this footnote
- `<SizeStandardsByFootnote>` - Size standards using this footnote
- `<RelatedFootnotes>` - Similar or related footnotes

### [ExceptionCode].mdx

Exception codes for special size standard cases.

**Schema Fields:**
- `code` - Exception identifier
- `description` - What the exception means
- `industries` - Applicable NAICS codes

**Components:**
- `<ExceptionCodeHeader>` - Exception identifier
- `<IndustriesByException>` - Industries using this exception
- `<ExceptionImpactDetails>` - How the exception affects standards
- `<RelatedExceptions>` - Similar exceptions

### [BusinessType].mdx

Business certification types (Small, SDB, WOSB, HUBZone, SDVOSB, 8(a), etc.)

**Schema Fields:**
- `code` - Business type code (e.g., "SB", "WOSB", "8A")
- `name` - Full name
- `description` - What this certification represents
- `eligibilityCriteria` - Requirements to qualify
- `certificationRequired` - Certification process

**Components:**
- `<BusinessTypeHeader>` - Business type name and code
- `<ContractTypesByBusinessType>` - Applicable set-asides
- `<SizeStandardsByBusinessType>` - Industries and size standards
- `<BusinessTypeApplicationProcess>` - How to apply
- `<BusinessTypeResources>` - Benefits and resources

**Standard Business Types:**
- **SB** - Small Business
- **SDB** - Small Disadvantaged Business
- **WOSB** - Women-Owned Small Business
- **EDWOSB** - Economically Disadvantaged Women-Owned Small Business
- **HUBZONE** - Historically Underutilized Business Zone
- **SDVOSB** - Service-Disabled Veteran-Owned Small Business
- **VOSB** - Veteran-Owned Small Business
- **8A** - 8(a) Business Development Program

### [ContractType].mdx

Federal contract set-aside types.

**Schema Fields:**
- `code` - Set-aside code
- `name` - Full name
- `description` - Purpose and use
- `threshold` - Dollar thresholds (if applicable)
- `applicableBusinessTypes` - Which business types can use

**Components:**
- `<ContractTypeHeader>` - Contract type name and code
- `<BusinessTypesByContractType>` - Eligible business types
- `<ContractTypeEligibility>` - Detailed requirements
- `<SetAsideProcedures>` - How to use this set-aside
- `<RelatedRegulations>` - Governing regulations
- `<IndustriesByContractType>` - Industries commonly using

**Standard Contract Types:**
- **SB_SET_ASIDE** - Small Business Set-Aside
- **8A_SET_ASIDE** - 8(a) Set-Aside
- **HUBZONE_SET_ASIDE** - HUBZone Set-Aside
- **SDVOSB_SET_ASIDE** - SDVOSB Set-Aside
- **WOSB_SET_ASIDE** - WOSB Set-Aside
- **EDWOSB_SET_ASIDE** - EDWOSB Set-Aside
- **VOSB_SET_ASIDE** - VOSB Set-Aside
- **SOLE_SOURCE_8A** - 8(a) Sole Source

## TypeScript Data Script

### .scripts/us-sba.ts

Transforms SBA source data into TSV format for the standards.org.ai platform.

**Main Function:** `transformSBA()`

**Transformation Functions:**
1. `transformSizeStandards()` - Process size standards by NAICS code
2. `transformFootnotes()` - Process industry footnotes
3. `transformExceptions()` - Process exception codes
4. `transformBusinessTypes()` - Process business certifications
5. `transformContractTypes()` - Process contract set-asides

**Helper Functions:**
- `parseSizeType()` - Determine if standard is Revenue or Employees
- `cleanSizeStandard()` - Normalize size standard text

**Output Files:**

Standard TSV files (`.data/`):
- `SBA.SizeStandards.tsv`
- `SBA.IndustryFootnotes.tsv`
- `SBA.ExceptionCodes.tsv`
- `SBA.BusinessTypes.tsv`
- `SBA.ContractTypes.tsv`

Extended TSV files with all fields:
- `SBA.SizeStandardsExtended.tsv`
- `SBA.IndustryFootnotesExtended.tsv`
- `SBA.ExceptionCodesExtended.tsv`
- `SBA.BusinessTypesExtended.tsv`
- `SBA.ContractTypesExtended.tsv`

Relationship files (`.data/relationships/`):
- `SBA.SizeStandard.NAICS.tsv` - Links to NAICS codes
- `SBA.ContractType.BusinessType.tsv` - Links contract types to business types

## Source Data

Source files should be placed in `.source/SBA/`:

### Required Files

**SizeStandards.tsv** - Size standards by NAICS code

```tsv
NAICSCode	NAICSTitle	SizeStandard	SizeType	Footnotes
111110	Soybean Farming	$1 million	Revenue
221111	Hydroelectric Power Generation	500 employees	Employees	1
511210	Software Publishers	$47 million	Revenue	18
```

### Optional Files

**IndustryFootnotes.tsv** - Footnotes that modify standards

```tsv
FootnoteCode	FootnoteText	ApplicableIndustries
1	Electric power generation size standards apply to all facilities	221111,221112,221113
18	Special provisions for software and IT services	511210,541511,541512
```

**ExceptionCodes.tsv** - Exception codes

```tsv
ExceptionCode	Description	ApplicableIndustries
EX001	Alternative size standard for joint ventures	Multiple
```

**BusinessTypes.tsv** - Business certifications (optional, defaults provided)

**ContractTypes.tsv** - Contract set-asides (optional, defaults provided)

## Data Sources

1. **SBA Size Standards Table**
   - URL: https://www.sba.gov/document/support-table-size-standards
   - Official Excel/PDF table of all size standards

2. **13 CFR 121.201**
   - URL: https://www.ecfr.gov/current/title-13/chapter-I/part-121/subject-group-ECFR2cc27999c01d007
   - Small Business Size Regulations

3. **SBA Size Standards Tool**
   - URL: https://www.sba.gov/size-standards/
   - Interactive size standards lookup

## Running the Transformation

```bash
# From project root
cd /Users/nathanclevenger/projects/standards.org.ai

# Run the transformation
bun run .scripts/us-sba.ts
```

## Integration with NAICS

Size standards are mapped to NAICS codes through relationships:

```typescript
{
  fromNs: 'us.org.ai',
  fromType: 'SizeStandard',
  fromId: 'Soybean_Farming',
  toNs: 'naics.org.ai',
  toType: 'Industry',
  toId: '111110',
  relationshipType: 'applies_to_naics'
}
```

This allows cross-referencing between SBA size standards and NAICS industry classifications.

## Example: Size Standard Types

**Revenue-Based:**
- "$1 million" → Type: Revenue
- "$16.5 million" → Type: Revenue
- "$41.5 million" → Type: Revenue

**Employee-Based:**
- "500 employees" → Type: Employees
- "1,000 employees" → Type: Employees
- "1,500" → Type: Employees (implied)

**The script auto-detects the type** based on keywords like "million", "$", "employee", or numeric-only values.

## Notes

- Size standards are updated periodically by the SBA
- Some industries have special size standards requiring footnotes
- HUBZone eligibility also depends on geographic location
- 8(a) program is a 9-year business development program
- Multiple certifications may be held simultaneously
- Set-asides have specific thresholds and procedures
- Sole source awards have dollar limits
