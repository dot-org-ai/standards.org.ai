# W3C HTML/DOM/SVG Quick Start Guide

## Running the Script

### Individual Execution
```bash
# Run just the W3C HTML script
bun run .scripts/w3c-html.ts

# Or via npm script
bun run generate:w3c-html
```

### Via Generate Pipeline
```bash
# Run all W3C scripts
bun run generate w3c

# Run everything
bun run generate
```

## Generated Files

### Location
All files are written to `/Users/nathanclevenger/projects/standards.org.ai/.data/`

### Output Files
```
.data/
├── W3C.HTMLElements.tsv          # 120 HTML elements
├── W3C.HTMLAttributes.tsv        # 73 HTML attributes
├── W3C.HTMLEvents.tsv            # 81 DOM events
├── W3C.DOMInterfaces.tsv         # 134 DOM interfaces
├── W3C.SVGElements.tsv           # 62 SVG elements
└── W3C.SVGAttributes.tsv         # 79 SVG attributes

.data/relationships/
└── W3C.DOMInterface.Inheritance.tsv  # 105 interface inheritance relationships
```

## Quick Examples

### Query HTML Elements
```bash
# Find all form elements
grep "form" .data/W3C.HTMLElements.tsv

# Find all deprecated elements
grep "Deprecated" .data/W3C.HTMLElements.tsv

# Count elements by category (in description)
grep "sectioning" .data/W3C.HTMLElements.tsv | wc -l
```

### Query HTML Attributes
```bash
# Find all global attributes
grep "Global attribute" .data/W3C.HTMLAttributes.tsv

# Find ARIA attributes
grep "aria-" .data/W3C.HTMLAttributes.tsv

# Find attributes that work on input elements
grep "input" .data/W3C.HTMLAttributes.tsv
```

### Query Events
```bash
# Find all bubbling events
grep "Bubbles: true" .data/W3C.HTMLEvents.tsv

# Find keyboard events
grep "KeyboardEvent" .data/W3C.HTMLEvents.tsv

# Find all mouse events
grep "MouseEvent" .data/W3C.HTMLEvents.tsv
```

### Query DOM Interfaces
```bash
# Find all Event interfaces
grep "Event$" .data/W3C.DOMInterfaces.tsv

# Find interfaces that extend Node
grep "extends Node" .data/W3C.DOMInterfaces.tsv

# See inheritance chain for HTMLElement
grep -E "(Htmlelement|Element|Node|Eventtarget)" .data/relationships/W3C.DOMInterface.Inheritance.tsv
```

### Query SVG Elements
```bash
# Find all shape elements
grep "shape" .data/W3C.SVGElements.tsv

# Find filter effects
grep "filter" .data/W3C.SVGElements.tsv

# Find gradient elements
grep "gradient" .data/W3C.SVGElements.tsv
```

## Data Format

### TSV Schema
```
ns          type            id              name            description                     code
w3.org.ai   HTMLElement     Div             <div>           Generic container...            div
w3.org.ai   HTMLAttribute   Href            href            URL of linked resource          a,area,base,link
w3.org.ai   HTMLEvent       Click           click           Pointing device button...       MouseEvent
w3.org.ai   DOMInterface    Node            Node            Base class for DOM...           EventTarget
w3.org.ai   SVGElement      Circle          <circle>        Circle shape                    circle
w3.org.ai   SVGAttribute    Fill            fill            Fill color or paint...          *
```

### Column Descriptions
- **ns**: Namespace (always `w3.org.ai`)
- **type**: Record type (HTMLElement, HTMLAttribute, HTMLEvent, DOMInterface, SVGElement, SVGAttribute)
- **id**: Wikipedia-style ID (Title_Case_With_Underscores)
- **name**: Display name (e.g., `<div>`, `EventTarget`, `click`)
- **description**: Human-readable description
- **code**: Tag name, parent interface, event interface, or applicable elements

## Statistics

```
HTML Elements:      120 records (8.5 KB)
HTML Attributes:    73 records (5.9 KB)
HTML Events:        81 records (9.4 KB)
DOM Interfaces:     134 records (14 KB)
DOM Relationships:  105 relationships
SVG Elements:       62 records (5.0 KB)
SVG Attributes:     79 records (6.2 KB)
─────────────────────────────────────
Total:              654 records (7 files)
```

## Sample Queries

### Find All Interactive Elements
```bash
grep -E "(Button|Input|Select|Textarea|Details|Dialog)" .data/W3C.HTMLElements.tsv
```

### Find All Media Elements
```bash
grep -E "(Video|Audio|Img|Canvas|Svg|Picture)" .data/W3C.HTMLElements.tsv
```

### Find All Events That Don't Bubble
```bash
grep "Bubbles: false" .data/W3C.HTMLEvents.tsv
```

### Find All SVG Shapes
```bash
grep "category.*shape" .data/W3C.SVGElements.tsv
```

### Find Interface Inheritance Chain
```bash
# Find what HTMLElement extends
grep "Htmlelement" .data/relationships/W3C.DOMInterface.Inheritance.tsv

# Find everything that extends Node
grep "toId.*Node" .data/relationships/W3C.DOMInterface.Inheritance.tsv
```

## Integration Examples

### TypeScript Type Generation
```typescript
import { parseTSV } from './.scripts/utils'

// Load HTML elements
const elements = parseTSV('.data/W3C.HTMLElements.tsv')

// Generate type
const elementTypes = elements
  .map(el => `'${el.code}'`)
  .join(' | ')

console.log(`type HTMLTag = ${elementTypes}`)
```

### React Component Validator
```typescript
// Load valid attributes for an element
const attributes = parseTSV('.data/W3C.HTMLAttributes.tsv')
const validAttrs = attributes
  .filter(attr => attr.code.includes('input') || attr.code === '*')
  .map(attr => attr.name)
```

### Documentation Generator
```typescript
// Generate element reference
const elements = parseTSV('.data/W3C.HTMLElements.tsv')
elements.forEach(el => {
  console.log(`## ${el.name}`)
  console.log(el.description)
  console.log()
})
```

## Common Use Cases

### 1. Build HTML Validator
Load elements and attributes to validate document structure

### 2. Generate API Documentation
Create interactive references from structured data

### 3. Build Autocomplete
Use element/attribute data for IDE autocomplete

### 4. Accessibility Checker
Use ARIA attributes and events for a11y validation

### 5. Learning Platform
Create interactive tutorials using categorized elements

### 6. Code Generator
Generate TypeScript types, React components, or validators

## Troubleshooting

### Script Won't Run
```bash
# Check if bun is installed
bun --version

# Reinstall dependencies
bun install
```

### Files Not Generated
```bash
# Check permissions
ls -la .data/

# Create directory manually
mkdir -p .data/relationships/

# Run with verbose output
bun run .scripts/w3c-html.ts
```

### Data Looks Wrong
```bash
# Verify file headers
head -1 .data/W3C.HTMLElements.tsv

# Should show:
# ns	type	id	name	description	code

# Check record count
wc -l .data/W3C.HTMLElements.tsv
# Should show: 121 (including header)
```

## Next Steps

1. **Extend Coverage**: Add more HTML5 APIs (WebGL, WebRTC, etc.)
2. **Automate Updates**: Fetch from @mdn/browser-compat-data
3. **Add Metadata**: Include browser support, deprecation dates
4. **Create Relationships**: Link attributes to elements, events to interfaces
5. **Build Tools**: Create validators, generators, documentation tools

## Resources

- **W3C HTML Spec**: https://html.spec.whatwg.org/
- **W3C DOM Spec**: https://dom.spec.whatwg.org/
- **W3C SVG Spec**: https://www.w3.org/TR/SVG2/
- **MDN Web Docs**: https://developer.mozilla.org/en-US/docs/Web/
- **Script Documentation**: See `README.w3c-html.md`
- **Full Summary**: See `W3C-HTML-SUMMARY.md`

## Support

For issues or questions:
1. Check the README files in `.scripts/`
2. Review the script source code
3. Verify data format matches schema
4. Check console output for errors

## License

Data compiled from W3C specifications under open licenses:
- W3C Software and Document License
- WHATWG Living Standards License
- MDN content under CC-BY-SA 2.5
