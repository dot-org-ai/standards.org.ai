# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

standards.org.ai is a data pipeline for transforming and normalizing standards data from multiple authoritative sources (O*NET, GS1, NAICS, ISO, UN, BLS, APQC, etc.) into a consistent TSV format with standardized namespaces.

## Commands

```bash
# Install dependencies
bun install

# Run all transformations
bun run generate

# Run specific transformations
bun run generate:onet       # O*NET occupational data
bun run generate:naics      # NAICS industry classification
bun run generate:gs1        # GS1 product/location standards
bun run generate:iso        # ISO standards (countries, currencies, languages)
bun run generate:un         # UN standards (LOCODE, M49, EDIFACT)
bun run generate:bls        # BLS employment statistics
bun run generate:apqc       # APQC process classification
bun run generate:iana       # IANA timezone database
bun run generate:w3c        # All W3C web standards
bun run generate:finance    # Financial standards
bun run generate:education  # Education standards
bun run generate:edi        # EDI standards
bun run generate:sic-naics  # SIC to NAICS crosswalk (Census Bureau)

# Run validation tests
bun test
bun run validate           # Verbose validation output

# Run specific tests
bun test .scripts/validate.test.ts
bun test .scripts/utils.test.ts
```

## Architecture

### Directory Structure
```
.source/          # Raw source data (Excel, CSV, JSON from official sources)
.scripts/         # TypeScript transformation scripts (Bun runtime)
.data/            # Standardized TSV output files
.data/relationships/  # Relationship TSV files between entities
```

### Data Flow
Source data (`.source/[Standard]/`) → Transform scripts (`.scripts/[standard].ts`) → Standardized TSV (`.data/`)

### Output Schema

**Entity files** (`.data/[Source].[Type].tsv`):
| Column | Description |
|--------|-------------|
| ns | Namespace domain (e.g., `onet.org.ai`, `naics.org.ai`) |
| type | Entity type (e.g., `Occupation`, `Industry`, `Product`) |
| id | Wikipedia-style ID (e.g., `Software_Developers`) |
| name | Display name |
| description | Description text |
| code | Official code from source |
| sameAs | Link to canonical source (for superset items) |
| includedIn | Pipe-separated aggregation domains |

**Relationship files** (`.data/relationships/[From].[To].tsv`):
- fromNs, fromType, fromId, toNs, toType, toId, relationshipType

### Key Namespaces
Namespaces are defined in `.scripts/utils.ts`:NAMESPACES:
- `onet.org.ai` - O*NET occupations
- `naics.org.ai` - NAICS industries
- `gs1.org.ai` - GS1 products/logistics
- `iso.org.ai` - ISO standards
- `un.org.ai` - UN standards (LOCODE, M49, UNSPSC, EDIFACT)
- `us.org.ai` - US Government (BLS, SEC, SBA, Census)
- `apqc.org.ai` - APQC processes
- `w3.org.ai` - W3C web standards
- `healthcare.org.ai` - Healthcare standards
- `finance.org.ai` - Financial standards
- `education.org.ai` - Education standards

### Utility Functions (`.scripts/utils.ts`)
- `parseTSV()`, `parseCSV()` - Parse input files
- `writeTSV()`, `writeStandardTSV()`, `writeRelationshipTSV()` - Write output
- `toWikipediaStyleId()` - Convert names to URL-safe IDs (spaces→underscores, preserve case)
- `cleanDescription()` - Normalize description text
- `getAggregationsForType()` - Get aggregation domains for entity types
- `NAMESPACES` - Canonical namespace definitions
- `TYPE_AGGREGATIONS` - Type-to-domain mappings

### ID Convention
IDs use Wikipedia-style naming: `Title_Case_With_Underscores`
- Spaces → underscores
- Remove `/` and `?` (URL reserved)
- Preserve original case
- Examples: `Software_Developers`, `IT_Manager`, `C++`

## Adding New Data Sources

1. Create `.source/[Source]/` directory with raw data files
2. Create `.scripts/[source].ts` with `export async function transform[Source](): Promise<void>`
3. Import and add to `.scripts/generate.ts` task list
4. Add npm script to `package.json`: `"generate:[source]": "bun run .scripts/[source].ts"`
5. Follow output schema conventions (ns, type, id, name, description, code)
6. Add namespace to `NAMESPACES` in `utils.ts` if needed

## Validation

The validation test suite (`.scripts/validate.test.ts`) checks:
- Entity files have required columns (ns, type, id/code, name)
- Valid namespace values
- Wikipedia-style ID format
- Consistent column counts
- No embedded tabs/newlines
- Relationship files have proper from/to columns
