# SBA Quick Start Guide

## Quick Setup

### 1. Add Source Data

Place your SBA size standards data in `.source/SBA/SizeStandards.tsv`:

```bash
cd /Users/nathanclevenger/projects/standards.org.ai/.source/SBA
# Add your SizeStandards.tsv file here
```

**Required columns:**
- `NAICSCode` - 6-digit NAICS code
- `NAICSTitle` - Industry name
- `SizeStandard` - "$XX million" or "XXX employees"
- `SizeType` - Auto-detected (optional)
- `Footnotes` - Optional footnote codes

### 2. Run Transformation

```bash
cd /Users/nathanclevenger/projects/standards.org.ai
bun run .scripts/us-sba.ts
```

### 3. Generated Files

**Data files in `.data/`:**
- `SBA.SizeStandards.tsv` - Size standard records
- `SBA.BusinessTypes.tsv` - 8 default business types
- `SBA.ContractTypes.tsv` - 8 default contract set-asides

**Relationships in `.data/relationships/`:**
- `SBA.SizeStandard.NAICS.tsv` - Links to NAICS codes
- `SBA.ContractType.BusinessType.tsv` - Contract eligibility

## MDX Layouts

All layouts are in `/US/SBA/` and use canonical URLs at `us.org.ai/SBA/...`

### Available Layouts

1. **[SizeStandard].mdx** - Size standards by NAICS code
2. **[IndustryFootnote].mdx** - Footnotes modifying standards
3. **[ExceptionCode].mdx** - Exception codes
4. **[BusinessType].mdx** - Business certifications (SB, WOSB, 8(a), etc.)
5. **[ContractType].mdx** - Federal contract set-asides

## Example Data

See `.source/SBA/SizeStandards.example.tsv` for a sample file format.

## Default Business Types

The script includes these business types by default (no source file needed):

| Code | Name |
|------|------|
| SB | Small Business |
| SDB | Small Disadvantaged Business |
| WOSB | Women-Owned Small Business |
| EDWOSB | Economically Disadvantaged Women-Owned Small Business |
| HUBZONE | Historically Underutilized Business Zone |
| SDVOSB | Service-Disabled Veteran-Owned Small Business |
| VOSB | Veteran-Owned Small Business |
| 8A | 8(a) Business Development Program |

## Default Contract Types

The script includes these set-asides by default:

| Code | Name | Applicable To |
|------|------|---------------|
| SB_SET_ASIDE | Small Business Set-Aside | SB |
| 8A_SET_ASIDE | 8(a) Set-Aside | 8A |
| HUBZONE_SET_ASIDE | HUBZone Set-Aside | HUBZONE |
| SDVOSB_SET_ASIDE | SDVOSB Set-Aside | SDVOSB |
| WOSB_SET_ASIDE | WOSB Set-Aside | WOSB, EDWOSB |
| EDWOSB_SET_ASIDE | EDWOSB Set-Aside | EDWOSB |
| VOSB_SET_ASIDE | VOSB Set-Aside | VOSB, SDVOSB |
| SOLE_SOURCE_8A | 8(a) Sole Source | 8A |

## Data Sources

1. **Official SBA Size Standards Table**
   - https://www.sba.gov/document/support-table-size-standards
   - Excel/PDF table with all current standards

2. **13 CFR 121.201 Regulations**
   - https://www.ecfr.gov/current/title-13/chapter-I/part-121
   - Official size standard regulations

3. **SBA Size Standards Tool**
   - https://www.sba.gov/size-standards/
   - Interactive lookup tool

## Size Standard Format

The script auto-detects whether a standard is revenue-based or employee-based:

**Revenue Examples:**
```
$1 million
$16.5 million
$41.5 million
```

**Employee Examples:**
```
500 employees
1,000 employees
1500
```

## Troubleshooting

### Script says "file not found"

```bash
# Make sure your source file is in the right place
ls -la .source/SBA/SizeStandards.tsv
```

### Want to override default business types?

Create `.source/SBA/BusinessTypes.tsv` with your custom data.

### Want to override default contract types?

Create `.source/SBA/ContractTypes.tsv` with your custom data.

### Check generated output

```bash
# View generated data
head -20 .data/SBA.SizeStandards.tsv
head -20 .data/SBA.BusinessTypes.tsv

# View relationships
head -20 .data/relationships/SBA.SizeStandard.NAICS.tsv
```

## Need Help?

See the full documentation:
- `/US/SBA/README.md` - Complete documentation
- `.source/SBA/README.md` - Data source documentation
- `/US/README.md` - US standards overview
