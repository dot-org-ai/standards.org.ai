# W3C Accessibility Standards Transformation

This script fetches and transforms W3C Web Accessibility Initiative (WAI) standards data into standardized TSV format.

## Overview

The `w3c-accessibility.ts` script processes two main accessibility standards:

1. **WCAG (Web Content Accessibility Guidelines)** - Success criteria and techniques for web accessibility
2. **ARIA (Accessible Rich Internet Applications)** - Roles, states, and properties for accessible web applications

## Data Sources

### WCAG Data
- **Primary Source**: https://www.w3.org/WAI/WCAG22/wcag.json
- **Version**: WCAG 2.2 (includes 2.0, 2.1, and 2.2 guidelines)
- **Format**: JSON

### ARIA Data
- **Primary Source**: Embedded definitions based on WAI-ARIA 1.2 specification
- **Reference**: https://www.w3.org/TR/wai-aria-1.2/
- **Note**: ARIA roles, states, and properties are currently hard-coded based on the specification. Future versions could parse directly from the spec HTML or use a machine-readable data source.

## Generated Files

### WCAG Output Files

#### `.data/W3C.WCAG.Principles.tsv`
The four main WCAG principles:
1. Perceivable
2. Operable
3. Understandable
4. Robust

**Columns**: `ns`, `type`, `id`, `name`, `description`, `code`

#### `.data/W3C.WCAG.Guidelines.tsv`
13 guidelines organized under the principles (e.g., "Text Alternatives", "Time-based Media").

**Columns**: `ns`, `type`, `id`, `name`, `description`, `code`

#### `.data/W3C.WCAG.SuccessCriteria.tsv`
87 success criteria with full descriptions.

**Columns**: `ns`, `type`, `id`, `name`, `description`, `code`

#### `.data/W3C.WCAG.SuccessCriteria.Levels.tsv`
Extended metadata for success criteria including conformance levels.

**Columns**: `ns`, `type`, `id`, `code`, `name`, `level`, `guidelineCode`, `principleCode`
- `level`: A, AA, or AAA conformance level

#### `.data/W3C.WCAG.Techniques.tsv`
244 unique techniques for meeting success criteria.

**Columns**: `ns`, `type`, `id`, `name`, `description`, `code`

#### `.data/W3C.WCAG.Techniques.Metadata.tsv`
Extended metadata for techniques including type and technology.

**Columns**: `ns`, `type`, `id`, `name`, `techniqueType`, `technology`

**Technique Types**:
- ARIA Technique
- CSS Technique
- Common Failure
- General Technique
- HTML Technique
- PDF Technique
- Client-side Scripting
- And others...

**Technologies**:
- ARIA, CSS, HTML, JavaScript, PDF, General, etc.

### ARIA Output Files

#### `.data/W3C.ARIA.Roles.tsv`
49 ARIA roles (e.g., button, dialog, navigation, menu).

**Columns**: `ns`, `type`, `id`, `name`, `description`, `code`

#### `.data/W3C.ARIA.Roles.Metadata.tsv`
Extended metadata for roles including type, required/supported states, and inheritance.

**Columns**: `ns`, `type`, `id`, `name`, `roleType`, `requiredStates`, `supportedStates`, `superclassRoles`

**Role Types**:
- Widget (interactive controls)
- Landmark (page navigation)
- Structure (document structure)
- Window (overlay/modal)
- Live Region (dynamic content)

#### `.data/W3C.ARIA.States.tsv`
9 ARIA states (e.g., aria-busy, aria-checked, aria-disabled).

**Columns**: `ns`, `type`, `id`, `name`, `description`, `code`

#### `.data/W3C.ARIA.States.Metadata.tsv`
Extended metadata for states including value type and defaults.

**Columns**: `ns`, `type`, `id`, `name`, `valueType`, `defaultValue`

#### `.data/W3C.ARIA.Properties.tsv`
39 ARIA properties (e.g., aria-label, aria-labelledby, aria-describedby).

**Columns**: `ns`, `type`, `id`, `name`, `description`, `code`

#### `.data/W3C.ARIA.Properties.Metadata.tsv`
Extended metadata for properties including value type and defaults.

**Columns**: `ns`, `type`, `id`, `name`, `valueType`, `defaultValue`

### Relationship Files

#### `.data/relationships/WCAG.Guideline.Principle.tsv`
Links each guideline to its parent principle.

**Columns**: `fromNs`, `fromType`, `fromId`, `toNs`, `toType`, `toId`, `relationshipType`

#### `.data/relationships/WCAG.SuccessCriterion.Guideline.tsv`
Links each success criterion to its parent guideline.

**Columns**: `fromNs`, `fromType`, `fromId`, `toNs`, `toType`, `toId`, `relationshipType`

#### `.data/relationships/WCAG.Technique.SuccessCriterion.tsv`
Links techniques to success criteria with category and situation context.

**Columns**: `fromNs`, `fromType`, `fromId`, `toNs`, `toType`, `toId`, `relationshipType`, `techniqueCategory`, `situation`

**Relationship Types**:
- `sufficient_for` - Technique is sufficient to meet the criterion
- `advisory_for` - Technique provides advisory guidance
- `failure_for` - Technique is a common failure pattern to avoid

**Technique Categories**:
- Sufficient
- Advisory
- Failure

## Usage

### Run the transformation:
```bash
bun run .scripts/w3c-accessibility.ts
```

Or using npm scripts:
```bash
npm run generate:w3c-accessibility
```

### Import in other scripts:
```typescript
import { transformW3CAccessibility } from './.scripts/w3c-accessibility'

await transformW3CAccessibility()
```

## Features

### Caching
- WCAG JSON data is cached in `.source/W3C/wcag.json` after first fetch
- Subsequent runs use cached data for faster processing
- Delete cache file to force re-fetch

### Data Transformation
- HTML content in descriptions is cleaned to plain text
- Technique IDs are parsed to extract type and technology
- Duplicate techniques across success criteria are deduplicated
- Hierarchical relationships are preserved

### Standards Compliance
- Uses official W3C WAI data sources
- Follows WCAG 2.2 specification
- Based on WAI-ARIA 1.2 specification

## Statistics

Current data volume:
- 4 WCAG Principles
- 13 WCAG Guidelines
- 87 WCAG Success Criteria
- 244 WCAG Techniques
- 49 ARIA Roles
- 9 ARIA States
- 39 ARIA Properties
- 321 Technique-to-Criterion relationships

## Future Enhancements

Potential improvements for future versions:

1. **Dynamic ARIA Parsing**: Parse ARIA spec HTML directly instead of using embedded definitions
2. **MDN Browser Compatibility**: Integrate @mdn/browser-compat-data for ARIA support information
3. **ARIA Practices**: Include examples from aria-practices repository
4. **Technique Details**: Fetch full technique documentation from W3C URLs
5. **WCAG Glossary**: Include accessibility term definitions
6. **Understanding Documents**: Link to "Understanding" documentation for each criterion
7. **Examples**: Include code examples for techniques
8. **Test Rules**: Include ACT (Accessibility Conformance Testing) rules

## Related Standards

This script complements other W3C transformation scripts:
- `w3c-semantic.ts` - Semantic Web standards (RDF, OWL, SKOS, etc.)
- `w3c-css.ts` - CSS properties, selectors, functions, etc.

## References

- [WCAG 2.2 Overview](https://www.w3.org/WAI/WCAG22/quickref/)
- [WAI-ARIA 1.2 Specification](https://www.w3.org/TR/wai-aria-1.2/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/)
- [Techniques for WCAG 2.2](https://www.w3.org/WAI/WCAG22/Techniques/)
