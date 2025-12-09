/**
 * W3C HTML Standards Transformation Script
 * Transforms W3C HTML, CSS, DOM, and SVG data into standard TSV format
 * Data sources: MDN Browser Compat Data, W3C specs, and curated datasets
 */

import { join } from 'path'
import {
  NAMESPACES,
  StandardRecord,
  RelationshipRecord,
  writeStandardTSV,
  writeRelationshipTSV,
  toWikipediaStyleId,
  cleanDescription,
  getSourcePath,
  getDataPath,
  getRelationshipsPath,
  ensureOutputDirs,
  getAggregationsForType,
} from './utils'

// Use W3C namespace from NAMESPACES
const NS = NAMESPACES.W3C
const SOURCE_DIR = getSourcePath('W3C')
const DATA_DIR = getDataPath()
const REL_DIR = getRelationshipsPath()

// HTML Element data structure
interface HTMLElement {
  tag: string
  category: string
  description: string
  deprecated?: boolean
  experimental?: boolean
}

// HTML Attribute data structure
interface HTMLAttribute {
  name: string
  elements: string[] // Which elements can use this attribute
  type?: string
  description?: string
  global?: boolean
}

// HTML Event data structure
interface HTMLEvent {
  name: string
  interface?: string
  bubbles?: boolean
  cancelable?: boolean
  description?: string
}

// DOM Interface data structure
interface DOMInterface {
  name: string
  inherits?: string
  description?: string
  experimental?: boolean
}

// DOM Method/Property data structure
interface DOMMember {
  interface: string
  name: string
  type: 'method' | 'property'
  returnType?: string
  parameters?: string
  description?: string
}

// SVG Element data structure
interface SVGElement {
  tag: string
  category: string
  description: string
  deprecated?: boolean
}

// SVG Attribute data structure
interface SVGAttribute {
  name: string
  elements: string[]
  description?: string
}

// SVG Filter data structure
interface SVGFilter {
  name: string
  description: string
  category?: string
}

/**
 * Transform HTML Elements
 */
function transformHTMLElements(): void {
  console.log('Transforming HTML Elements...')

  // Comprehensive HTML5 element list
  const htmlElements: HTMLElement[] = [
    // Document metadata
    { tag: 'html', category: 'document', description: 'Root element of an HTML document' },
    { tag: 'head', category: 'document', description: 'Contains metadata and links to scripts and stylesheets' },
    { tag: 'title', category: 'document', description: 'Defines the document title shown in browser title bar' },
    { tag: 'base', category: 'document', description: 'Specifies base URL for all relative URLs in document' },
    { tag: 'link', category: 'document', description: 'Links to external resources like stylesheets' },
    { tag: 'meta', category: 'document', description: 'Represents metadata that cannot be represented by other elements' },
    { tag: 'style', category: 'document', description: 'Contains style information for the document' },

    // Sectioning root
    { tag: 'body', category: 'sectioning', description: 'Represents the content of an HTML document' },

    // Content sectioning
    { tag: 'article', category: 'sectioning', description: 'Self-contained composition in a document' },
    { tag: 'section', category: 'sectioning', description: 'Generic standalone section of a document' },
    { tag: 'nav', category: 'sectioning', description: 'Section providing navigation links' },
    { tag: 'aside', category: 'sectioning', description: 'Content indirectly related to main content' },
    { tag: 'h1', category: 'sectioning', description: 'Section heading level 1 (highest)' },
    { tag: 'h2', category: 'sectioning', description: 'Section heading level 2' },
    { tag: 'h3', category: 'sectioning', description: 'Section heading level 3' },
    { tag: 'h4', category: 'sectioning', description: 'Section heading level 4' },
    { tag: 'h5', category: 'sectioning', description: 'Section heading level 5' },
    { tag: 'h6', category: 'sectioning', description: 'Section heading level 6 (lowest)' },
    { tag: 'header', category: 'sectioning', description: 'Introductory content or navigational aids' },
    { tag: 'footer', category: 'sectioning', description: 'Footer for nearest sectioning content' },
    { tag: 'address', category: 'sectioning', description: 'Contact information for author or owner' },

    // Text content
    { tag: 'p', category: 'text', description: 'Paragraph of text' },
    { tag: 'hr', category: 'text', description: 'Thematic break between paragraph-level elements' },
    { tag: 'pre', category: 'text', description: 'Preformatted text with preserved whitespace' },
    { tag: 'blockquote', category: 'text', description: 'Extended quotation from another source' },
    { tag: 'ol', category: 'text', description: 'Ordered list of items' },
    { tag: 'ul', category: 'text', description: 'Unordered list of items' },
    { tag: 'li', category: 'text', description: 'List item within ordered or unordered list' },
    { tag: 'dl', category: 'text', description: 'Description list of term-description pairs' },
    { tag: 'dt', category: 'text', description: 'Term in description list' },
    { tag: 'dd', category: 'text', description: 'Description or definition in description list' },
    { tag: 'figure', category: 'text', description: 'Self-contained content with optional caption' },
    { tag: 'figcaption', category: 'text', description: 'Caption for parent figure element' },
    { tag: 'main', category: 'text', description: 'Dominant content of document body' },
    { tag: 'div', category: 'text', description: 'Generic container for flow content' },

    // Inline text semantics
    { tag: 'a', category: 'inline', description: 'Hyperlink to another resource' },
    { tag: 'em', category: 'inline', description: 'Text with stress emphasis' },
    { tag: 'strong', category: 'inline', description: 'Text with strong importance' },
    { tag: 'small', category: 'inline', description: 'Side comments and small print' },
    { tag: 'cite', category: 'inline', description: 'Reference to cited creative work' },
    { tag: 'q', category: 'inline', description: 'Short inline quotation' },
    { tag: 'dfn', category: 'inline', description: 'Term being defined' },
    { tag: 'abbr', category: 'inline', description: 'Abbreviation or acronym' },
    { tag: 'time', category: 'inline', description: 'Time or date' },
    { tag: 'code', category: 'inline', description: 'Fragment of computer code' },
    { tag: 'var', category: 'inline', description: 'Variable in mathematical expression or programming' },
    { tag: 'samp', category: 'inline', description: 'Sample output from computer program' },
    { tag: 'kbd', category: 'inline', description: 'Keyboard input or user input' },
    { tag: 'sub', category: 'inline', description: 'Subscript text' },
    { tag: 'sup', category: 'inline', description: 'Superscript text' },
    { tag: 'i', category: 'inline', description: 'Text in alternate voice or mood' },
    { tag: 'b', category: 'inline', description: 'Text to draw attention to' },
    { tag: 'u', category: 'inline', description: 'Non-textual annotation (unarticulated)' },
    { tag: 'mark', category: 'inline', description: 'Marked or highlighted text for reference' },
    { tag: 'ruby', category: 'inline', description: 'Ruby annotation for East Asian typography' },
    { tag: 'rt', category: 'inline', description: 'Ruby text component' },
    { tag: 'rp', category: 'inline', description: 'Ruby fallback parenthesis' },
    { tag: 'bdi', category: 'inline', description: 'Isolates bidirectional text' },
    { tag: 'bdo', category: 'inline', description: 'Overrides text directionality' },
    { tag: 'span', category: 'inline', description: 'Generic inline container' },
    { tag: 'br', category: 'inline', description: 'Line break' },
    { tag: 'wbr', category: 'inline', description: 'Word break opportunity' },

    // Image and multimedia
    { tag: 'img', category: 'media', description: 'Embeds an image in the document' },
    { tag: 'picture', category: 'media', description: 'Container for multiple image sources' },
    { tag: 'source', category: 'media', description: 'Media resource for picture, audio, or video' },
    { tag: 'audio', category: 'media', description: 'Embeds sound content' },
    { tag: 'video', category: 'media', description: 'Embeds video content' },
    { tag: 'track', category: 'media', description: 'Text tracks for media elements' },
    { tag: 'map', category: 'media', description: 'Image map with clickable areas' },
    { tag: 'area', category: 'media', description: 'Clickable area in image map' },

    // Embedded content
    { tag: 'iframe', category: 'embedded', description: 'Nested browsing context (inline frame)' },
    { tag: 'embed', category: 'embedded', description: 'Embeds external content' },
    { tag: 'object', category: 'embedded', description: 'External resource container' },
    { tag: 'param', category: 'embedded', description: 'Parameters for object element' },
    { tag: 'canvas', category: 'embedded', description: 'Scriptable graphics container' },
    { tag: 'svg', category: 'embedded', description: 'Scalable Vector Graphics container' },
    { tag: 'math', category: 'embedded', description: 'MathML mathematical markup' },

    // Scripting
    { tag: 'script', category: 'scripting', description: 'Executable code or data' },
    { tag: 'noscript', category: 'scripting', description: 'Content for non-script browsers' },

    // Tables
    { tag: 'table', category: 'table', description: 'Tabular data' },
    { tag: 'caption', category: 'table', description: 'Table caption or title' },
    { tag: 'colgroup', category: 'table', description: 'Group of columns' },
    { tag: 'col', category: 'table', description: 'Column in table' },
    { tag: 'thead', category: 'table', description: 'Table header rows' },
    { tag: 'tbody', category: 'table', description: 'Table body rows' },
    { tag: 'tfoot', category: 'table', description: 'Table footer rows' },
    { tag: 'tr', category: 'table', description: 'Table row' },
    { tag: 'th', category: 'table', description: 'Table header cell' },
    { tag: 'td', category: 'table', description: 'Table data cell' },

    // Forms
    { tag: 'form', category: 'form', description: 'User input form' },
    { tag: 'label', category: 'form', description: 'Label for form control' },
    { tag: 'input', category: 'form', description: 'Interactive control for user input' },
    { tag: 'button', category: 'form', description: 'Clickable button' },
    { tag: 'select', category: 'form', description: 'Control for selecting from options' },
    { tag: 'datalist', category: 'form', description: 'Set of option elements for input' },
    { tag: 'optgroup', category: 'form', description: 'Group of options within select' },
    { tag: 'option', category: 'form', description: 'Item in select, datalist, or optgroup' },
    { tag: 'textarea', category: 'form', description: 'Multi-line text input control' },
    { tag: 'output', category: 'form', description: 'Result of calculation or user action' },
    { tag: 'progress', category: 'form', description: 'Progress indicator' },
    { tag: 'meter', category: 'form', description: 'Scalar measurement within known range' },
    { tag: 'fieldset', category: 'form', description: 'Group of form controls' },
    { tag: 'legend', category: 'form', description: 'Caption for fieldset' },

    // Interactive elements
    { tag: 'details', category: 'interactive', description: 'Disclosure widget with details' },
    { tag: 'summary', category: 'interactive', description: 'Summary or caption for details element' },
    { tag: 'dialog', category: 'interactive', description: 'Dialog box or modal window' },

    // Web Components
    { tag: 'template', category: 'webcomponents', description: 'HTML fragment not rendered on page load' },
    { tag: 'slot', category: 'webcomponents', description: 'Placeholder in web component' },

    // Deprecated elements (kept for reference)
    { tag: 'acronym', category: 'inline', description: 'Acronym (use abbr instead)', deprecated: true },
    { tag: 'applet', category: 'embedded', description: 'Java applet (use object instead)', deprecated: true },
    { tag: 'basefont', category: 'text', description: 'Base font (use CSS instead)', deprecated: true },
    { tag: 'big', category: 'inline', description: 'Bigger text (use CSS instead)', deprecated: true },
    { tag: 'center', category: 'text', description: 'Centered text (use CSS instead)', deprecated: true },
    { tag: 'dir', category: 'text', description: 'Directory list (use ul instead)', deprecated: true },
    { tag: 'font', category: 'inline', description: 'Font styling (use CSS instead)', deprecated: true },
    { tag: 'frame', category: 'embedded', description: 'Frame in frameset', deprecated: true },
    { tag: 'frameset', category: 'embedded', description: 'Frame container', deprecated: true },
    { tag: 'noframes', category: 'embedded', description: 'No frames fallback', deprecated: true },
    { tag: 'strike', category: 'inline', description: 'Strikethrough (use del or s instead)', deprecated: true },
    { tag: 'tt', category: 'inline', description: 'Teletype text (use code instead)', deprecated: true },
  ]

  const records: StandardRecord[] = htmlElements.map(el => ({
    ns: NS,
    type: 'HTMLElement',
    id: toWikipediaStyleId(el.tag),
    name: `<${el.tag}>`,
    description: cleanDescription(`${el.description}${el.deprecated ? ' (Deprecated)' : ''}${el.experimental ? ' (Experimental)' : ''}`),
    code: el.tag,
    includedIn: getAggregationsForType('Element'),
  }))

  writeStandardTSV(join(DATA_DIR, 'W3C.HTMLElements.tsv'), records)
}

/**
 * Transform HTML Attributes
 */
function transformHTMLAttributes(): void {
  console.log('Transforming HTML Attributes...')

  const htmlAttributes: HTMLAttribute[] = [
    // Global attributes
    { name: 'id', elements: ['*'], type: 'string', description: 'Unique identifier for element', global: true },
    { name: 'class', elements: ['*'], type: 'string', description: 'Space-separated list of classes', global: true },
    { name: 'style', elements: ['*'], type: 'string', description: 'Inline CSS styling', global: true },
    { name: 'title', elements: ['*'], type: 'string', description: 'Advisory information about element', global: true },
    { name: 'lang', elements: ['*'], type: 'string', description: 'Language of element content', global: true },
    { name: 'dir', elements: ['*'], type: 'enum', description: 'Text directionality (ltr, rtl, auto)', global: true },
    { name: 'hidden', elements: ['*'], type: 'boolean', description: 'Element is not yet or no longer relevant', global: true },
    { name: 'tabindex', elements: ['*'], type: 'number', description: 'Tab order of element', global: true },
    { name: 'accesskey', elements: ['*'], type: 'string', description: 'Keyboard shortcut to activate element', global: true },
    { name: 'contenteditable', elements: ['*'], type: 'boolean', description: 'Element content is editable', global: true },
    { name: 'draggable', elements: ['*'], type: 'boolean', description: 'Element is draggable', global: true },
    { name: 'spellcheck', elements: ['*'], type: 'boolean', description: 'Enable spell checking', global: true },
    { name: 'translate', elements: ['*'], type: 'boolean', description: 'Content should be translated', global: true },
    { name: 'data-*', elements: ['*'], type: 'string', description: 'Custom data attributes', global: true },

    // ARIA attributes
    { name: 'role', elements: ['*'], type: 'string', description: 'ARIA role for accessibility', global: true },
    { name: 'aria-label', elements: ['*'], type: 'string', description: 'Accessible label', global: true },
    { name: 'aria-hidden', elements: ['*'], type: 'boolean', description: 'Hide from accessibility tree', global: true },
    { name: 'aria-live', elements: ['*'], type: 'enum', description: 'Live region announcement (polite, assertive)', global: true },
    { name: 'aria-describedby', elements: ['*'], type: 'string', description: 'References describing elements', global: true },
    { name: 'aria-labelledby', elements: ['*'], type: 'string', description: 'References labeling elements', global: true },

    // Link attributes
    { name: 'href', elements: ['a', 'area', 'base', 'link'], type: 'url', description: 'URL of linked resource' },
    { name: 'target', elements: ['a', 'area', 'base', 'form'], type: 'string', description: 'Browsing context for link' },
    { name: 'rel', elements: ['a', 'area', 'link', 'form'], type: 'string', description: 'Relationship to linked resource' },
    { name: 'download', elements: ['a', 'area'], type: 'string', description: 'Download link with filename' },
    { name: 'hreflang', elements: ['a', 'area', 'link'], type: 'string', description: 'Language of linked resource' },
    { name: 'type', elements: ['a', 'link', 'button', 'input', 'embed', 'object', 'script', 'source', 'style'], type: 'string', description: 'MIME type of resource' },

    // Media attributes
    { name: 'src', elements: ['audio', 'embed', 'iframe', 'img', 'input', 'script', 'source', 'track', 'video'], type: 'url', description: 'URL of embedded resource' },
    { name: 'alt', elements: ['area', 'img', 'input'], type: 'string', description: 'Alternative text' },
    { name: 'width', elements: ['canvas', 'embed', 'iframe', 'img', 'input', 'object', 'video'], type: 'number', description: 'Width in pixels' },
    { name: 'height', elements: ['canvas', 'embed', 'iframe', 'img', 'input', 'object', 'video'], type: 'number', description: 'Height in pixels' },
    { name: 'controls', elements: ['audio', 'video'], type: 'boolean', description: 'Show playback controls' },
    { name: 'autoplay', elements: ['audio', 'video'], type: 'boolean', description: 'Automatically start playback' },
    { name: 'loop', elements: ['audio', 'video'], type: 'boolean', description: 'Loop playback' },
    { name: 'muted', elements: ['audio', 'video'], type: 'boolean', description: 'Mute audio by default' },
    { name: 'poster', elements: ['video'], type: 'url', description: 'Poster frame image URL' },
    { name: 'preload', elements: ['audio', 'video'], type: 'enum', description: 'Preloading hint (none, metadata, auto)' },

    // Form attributes
    { name: 'action', elements: ['form'], type: 'url', description: 'URL to submit form to' },
    { name: 'method', elements: ['form'], type: 'enum', description: 'HTTP method (GET, POST)' },
    { name: 'enctype', elements: ['form'], type: 'string', description: 'Form data encoding type' },
    { name: 'accept-charset', elements: ['form'], type: 'string', description: 'Character encodings for form submission' },
    { name: 'autocomplete', elements: ['form', 'input', 'select', 'textarea'], type: 'string', description: 'Autocomplete hint' },
    { name: 'novalidate', elements: ['form'], type: 'boolean', description: 'Skip form validation' },

    // Input attributes
    { name: 'name', elements: ['button', 'fieldset', 'form', 'input', 'output', 'select', 'textarea', 'map', 'object', 'param'], type: 'string', description: 'Name of control or object' },
    { name: 'value', elements: ['button', 'input', 'option', 'param'], type: 'string', description: 'Value of control' },
    { name: 'placeholder', elements: ['input', 'textarea'], type: 'string', description: 'Placeholder text' },
    { name: 'required', elements: ['input', 'select', 'textarea'], type: 'boolean', description: 'Required field' },
    { name: 'readonly', elements: ['input', 'textarea'], type: 'boolean', description: 'Read-only field' },
    { name: 'disabled', elements: ['button', 'fieldset', 'input', 'optgroup', 'option', 'select', 'textarea'], type: 'boolean', description: 'Disabled control' },
    { name: 'checked', elements: ['input'], type: 'boolean', description: 'Checked state for checkbox or radio' },
    { name: 'multiple', elements: ['input', 'select'], type: 'boolean', description: 'Allow multiple values' },
    { name: 'min', elements: ['input', 'meter'], type: 'number', description: 'Minimum value' },
    { name: 'max', elements: ['input', 'meter'], type: 'number', description: 'Maximum value' },
    { name: 'step', elements: ['input'], type: 'number', description: 'Stepping interval' },
    { name: 'pattern', elements: ['input'], type: 'string', description: 'Regex pattern for validation' },
    { name: 'maxlength', elements: ['input', 'textarea'], type: 'number', description: 'Maximum length of value' },
    { name: 'minlength', elements: ['input', 'textarea'], type: 'number', description: 'Minimum length of value' },
    { name: 'size', elements: ['input', 'select'], type: 'number', description: 'Size of control' },
    { name: 'for', elements: ['label', 'output'], type: 'string', description: 'Associates label with control' },
    { name: 'form', elements: ['button', 'fieldset', 'input', 'label', 'meter', 'object', 'output', 'select', 'textarea'], type: 'string', description: 'Associates with form by ID' },

    // Table attributes
    { name: 'colspan', elements: ['td', 'th'], type: 'number', description: 'Number of columns cell spans' },
    { name: 'rowspan', elements: ['td', 'th'], type: 'number', description: 'Number of rows cell spans' },
    { name: 'headers', elements: ['td', 'th'], type: 'string', description: 'IDs of header cells' },
    { name: 'scope', elements: ['th'], type: 'enum', description: 'Scope of header (row, col, rowgroup, colgroup)' },

    // Other attributes
    { name: 'charset', elements: ['meta', 'script'], type: 'string', description: 'Character encoding' },
    { name: 'content', elements: ['meta'], type: 'string', description: 'Meta value' },
    { name: 'http-equiv', elements: ['meta'], type: 'string', description: 'HTTP header name' },
    { name: 'async', elements: ['script'], type: 'boolean', description: 'Execute script asynchronously' },
    { name: 'defer', elements: ['script'], type: 'boolean', description: 'Defer script execution' },
    { name: 'open', elements: ['details', 'dialog'], type: 'boolean', description: 'Open state' },
    { name: 'loading', elements: ['img', 'iframe'], type: 'enum', description: 'Loading behavior (lazy, eager)' },
    { name: 'decoding', elements: ['img'], type: 'enum', description: 'Image decoding hint (sync, async, auto)' },
    { name: 'datetime', elements: ['time', 'ins', 'del'], type: 'string', description: 'Machine-readable date/time' },
    { name: 'cite', elements: ['blockquote', 'del', 'ins', 'q'], type: 'url', description: 'URL of citation source' },
  ]

  const records: StandardRecord[] = htmlAttributes.map(attr => ({
    ns: NS,
    type: 'HTMLAttribute',
    id: toWikipediaStyleId(attr.name),
    name: attr.name,
    description: cleanDescription(`${attr.description}${attr.global ? ' (Global attribute)' : ''}`),
    code: attr.elements.join(','),
  }))

  writeStandardTSV(join(DATA_DIR, 'W3C.HTMLAttributes.tsv'), records)
}

/**
 * Transform HTML Events
 */
function transformHTMLEvents(): void {
  console.log('Transforming HTML Events...')

  const htmlEvents: HTMLEvent[] = [
    // Window events
    { name: 'load', interface: 'UIEvent', bubbles: false, description: 'Resource and dependent resources finished loading' },
    { name: 'unload', interface: 'UIEvent', bubbles: false, description: 'Document or resource is being unloaded' },
    { name: 'beforeunload', interface: 'BeforeUnloadEvent', bubbles: false, description: 'Window is about to be unloaded' },
    { name: 'error', interface: 'ErrorEvent', bubbles: false, description: 'Resource failed to load or script error' },
    { name: 'resize', interface: 'UIEvent', bubbles: false, description: 'Document view has been resized' },
    { name: 'scroll', interface: 'UIEvent', bubbles: false, description: 'Document view or element has been scrolled' },

    // Focus events
    { name: 'focus', interface: 'FocusEvent', bubbles: false, description: 'Element has received focus' },
    { name: 'blur', interface: 'FocusEvent', bubbles: false, description: 'Element has lost focus' },
    { name: 'focusin', interface: 'FocusEvent', bubbles: true, description: 'Element is about to receive focus' },
    { name: 'focusout', interface: 'FocusEvent', bubbles: true, description: 'Element is about to lose focus' },

    // Mouse events
    { name: 'click', interface: 'MouseEvent', bubbles: true, cancelable: true, description: 'Pointing device button clicked' },
    { name: 'dblclick', interface: 'MouseEvent', bubbles: true, cancelable: true, description: 'Pointing device button double-clicked' },
    { name: 'mousedown', interface: 'MouseEvent', bubbles: true, cancelable: true, description: 'Pointing device button pressed' },
    { name: 'mouseup', interface: 'MouseEvent', bubbles: true, cancelable: true, description: 'Pointing device button released' },
    { name: 'mousemove', interface: 'MouseEvent', bubbles: true, cancelable: true, description: 'Pointing device moved over element' },
    { name: 'mouseenter', interface: 'MouseEvent', bubbles: false, description: 'Pointing device enters element' },
    { name: 'mouseleave', interface: 'MouseEvent', bubbles: false, description: 'Pointing device leaves element' },
    { name: 'mouseover', interface: 'MouseEvent', bubbles: true, description: 'Pointing device enters element or descendant' },
    { name: 'mouseout', interface: 'MouseEvent', bubbles: true, description: 'Pointing device leaves element or descendant' },
    { name: 'contextmenu', interface: 'MouseEvent', bubbles: true, cancelable: true, description: 'Right mouse button clicked' },

    // Keyboard events
    { name: 'keydown', interface: 'KeyboardEvent', bubbles: true, cancelable: true, description: 'Key is pressed' },
    { name: 'keyup', interface: 'KeyboardEvent', bubbles: true, cancelable: true, description: 'Key is released' },
    { name: 'keypress', interface: 'KeyboardEvent', bubbles: true, cancelable: true, description: 'Key press produces character (deprecated)' },

    // Form events
    { name: 'submit', interface: 'SubmitEvent', bubbles: true, cancelable: true, description: 'Form is being submitted' },
    { name: 'reset', interface: 'Event', bubbles: true, cancelable: true, description: 'Form is being reset' },
    { name: 'change', interface: 'Event', bubbles: true, description: 'Value of element has changed' },
    { name: 'input', interface: 'InputEvent', bubbles: true, description: 'Value of element is changing' },
    { name: 'invalid', interface: 'Event', bubbles: false, cancelable: true, description: 'Submittable element is invalid' },
    { name: 'select', interface: 'UIEvent', bubbles: true, description: 'Text has been selected' },

    // Drag events
    { name: 'drag', interface: 'DragEvent', bubbles: true, cancelable: true, description: 'Element is being dragged' },
    { name: 'dragstart', interface: 'DragEvent', bubbles: true, cancelable: true, description: 'Drag operation is starting' },
    { name: 'dragend', interface: 'DragEvent', bubbles: true, description: 'Drag operation is ending' },
    { name: 'dragenter', interface: 'DragEvent', bubbles: true, cancelable: true, description: 'Dragged element enters drop target' },
    { name: 'dragleave', interface: 'DragEvent', bubbles: true, description: 'Dragged element leaves drop target' },
    { name: 'dragover', interface: 'DragEvent', bubbles: true, cancelable: true, description: 'Dragged element is over drop target' },
    { name: 'drop', interface: 'DragEvent', bubbles: true, cancelable: true, description: 'Element is dropped on drop target' },

    // Clipboard events
    { name: 'copy', interface: 'ClipboardEvent', bubbles: true, cancelable: true, description: 'User initiated copy' },
    { name: 'cut', interface: 'ClipboardEvent', bubbles: true, cancelable: true, description: 'User initiated cut' },
    { name: 'paste', interface: 'ClipboardEvent', bubbles: true, cancelable: true, description: 'User initiated paste' },

    // Media events
    { name: 'play', interface: 'Event', bubbles: false, description: 'Playback has begun' },
    { name: 'pause', interface: 'Event', bubbles: false, description: 'Playback has been paused' },
    { name: 'playing', interface: 'Event', bubbles: false, description: 'Playback is ready to start after buffering' },
    { name: 'ended', interface: 'Event', bubbles: false, description: 'Playback has stopped at end of media' },
    { name: 'timeupdate', interface: 'Event', bubbles: false, description: 'Current playback position has changed' },
    { name: 'durationchange', interface: 'Event', bubbles: false, description: 'Duration attribute has been updated' },
    { name: 'volumechange', interface: 'Event', bubbles: false, description: 'Volume has changed' },
    { name: 'seeking', interface: 'Event', bubbles: false, description: 'Seek operation began' },
    { name: 'seeked', interface: 'Event', bubbles: false, description: 'Seek operation completed' },
    { name: 'canplay', interface: 'Event', bubbles: false, description: 'Media can be played' },
    { name: 'canplaythrough', interface: 'Event', bubbles: false, description: 'Media can be played to end without buffering' },
    { name: 'loadstart', interface: 'ProgressEvent', bubbles: false, description: 'Loading of media has begun' },
    { name: 'loadeddata', interface: 'Event', bubbles: false, description: 'First frame of media has loaded' },
    { name: 'loadedmetadata', interface: 'Event', bubbles: false, description: 'Metadata has been loaded' },
    { name: 'progress', interface: 'ProgressEvent', bubbles: false, description: 'Media is loading' },
    { name: 'stalled', interface: 'Event', bubbles: false, description: 'Media loading has stalled' },
    { name: 'suspend', interface: 'Event', bubbles: false, description: 'Media loading has been suspended' },
    { name: 'waiting', interface: 'Event', bubbles: false, description: 'Playback stopped due to buffering' },

    // Touch events
    { name: 'touchstart', interface: 'TouchEvent', bubbles: true, cancelable: true, description: 'Touch point placed on surface' },
    { name: 'touchend', interface: 'TouchEvent', bubbles: true, cancelable: true, description: 'Touch point removed from surface' },
    { name: 'touchmove', interface: 'TouchEvent', bubbles: true, cancelable: true, description: 'Touch point moved along surface' },
    { name: 'touchcancel', interface: 'TouchEvent', bubbles: true, description: 'Touch point disrupted' },

    // Pointer events
    { name: 'pointerdown', interface: 'PointerEvent', bubbles: true, cancelable: true, description: 'Pointer becomes active' },
    { name: 'pointerup', interface: 'PointerEvent', bubbles: true, cancelable: true, description: 'Pointer is no longer active' },
    { name: 'pointermove', interface: 'PointerEvent', bubbles: true, cancelable: true, description: 'Pointer changes coordinates' },
    { name: 'pointerenter', interface: 'PointerEvent', bubbles: false, description: 'Pointer enters element' },
    { name: 'pointerleave', interface: 'PointerEvent', bubbles: false, description: 'Pointer leaves element' },
    { name: 'pointerover', interface: 'PointerEvent', bubbles: true, description: 'Pointer moves into hit test boundaries' },
    { name: 'pointerout', interface: 'PointerEvent', bubbles: true, description: 'Pointer moves out of hit test boundaries' },
    { name: 'pointercancel', interface: 'PointerEvent', bubbles: true, description: 'Pointer is unlikely to produce more events' },

    // Animation events
    { name: 'animationstart', interface: 'AnimationEvent', bubbles: true, description: 'CSS animation has started' },
    { name: 'animationend', interface: 'AnimationEvent', bubbles: true, description: 'CSS animation has completed' },
    { name: 'animationiteration', interface: 'AnimationEvent', bubbles: true, description: 'CSS animation iteration has completed' },

    // Transition events
    { name: 'transitionstart', interface: 'TransitionEvent', bubbles: true, description: 'CSS transition has started' },
    { name: 'transitionend', interface: 'TransitionEvent', bubbles: true, description: 'CSS transition has completed' },
    { name: 'transitioncancel', interface: 'TransitionEvent', bubbles: true, description: 'CSS transition has been cancelled' },

    // Other events
    { name: 'wheel', interface: 'WheelEvent', bubbles: true, cancelable: true, description: 'Mouse wheel or similar device rotated' },
    { name: 'hashchange', interface: 'HashChangeEvent', bubbles: true, description: 'Fragment identifier of URL has changed' },
    { name: 'popstate', interface: 'PopStateEvent', bubbles: true, description: 'Active history entry has changed' },
    { name: 'online', interface: 'Event', bubbles: false, description: 'Browser has gained network access' },
    { name: 'offline', interface: 'Event', bubbles: false, description: 'Browser has lost network access' },
    { name: 'storage', interface: 'StorageEvent', bubbles: false, description: 'Storage area has been modified' },
  ]

  const records: StandardRecord[] = htmlEvents.map(event => ({
    ns: NS,
    type: 'HTMLEvent',
    id: toWikipediaStyleId(event.name),
    name: event.name,
    description: cleanDescription(`${event.description} (Interface: ${event.interface || 'Event'}, Bubbles: ${event.bubbles !== false})`),
    code: event.interface || 'Event',
  }))

  writeStandardTSV(join(DATA_DIR, 'W3C.HTMLEvents.tsv'), records)
}

/**
 * Transform DOM Interfaces
 */
function transformDOMInterfaces(): void {
  console.log('Transforming DOM Interfaces...')

  const domInterfaces: DOMInterface[] = [
    // Core interfaces
    { name: 'EventTarget', description: 'Object that can receive events and may have listeners' },
    { name: 'Node', inherits: 'EventTarget', description: 'Base class for DOM tree nodes' },
    { name: 'Document', inherits: 'Node', description: 'Entry point into the web page content (DOM tree)' },
    { name: 'Element', inherits: 'Node', description: 'Base class for all DOM elements' },
    { name: 'HTMLElement', inherits: 'Element', description: 'Base interface for HTML elements' },
    { name: 'SVGElement', inherits: 'Element', description: 'Base interface for SVG elements' },

    // Document interfaces
    { name: 'DocumentFragment', inherits: 'Node', description: 'Minimal document object with no parent' },
    { name: 'DocumentType', inherits: 'Node', description: 'Node containing doctype information' },
    { name: 'DOMImplementation', description: 'Provides methods independent of any document instance' },

    // Element interfaces
    { name: 'Attr', inherits: 'Node', description: 'Attribute of an Element object' },
    { name: 'CharacterData', inherits: 'Node', description: 'Abstract interface for character data nodes' },
    { name: 'Text', inherits: 'CharacterData', description: 'Textual content of Element or Attr' },
    { name: 'Comment', inherits: 'CharacterData', description: 'Comment node' },
    { name: 'CDATASection', inherits: 'Text', description: 'CDATA section in XML' },
    { name: 'ProcessingInstruction', inherits: 'CharacterData', description: 'Processing instruction' },

    // Collection interfaces
    { name: 'HTMLCollection', description: 'Generic collection of elements' },
    { name: 'NodeList', description: 'Collection of nodes' },
    { name: 'DOMTokenList', description: 'Set of space-separated tokens' },
    { name: 'NamedNodeMap', description: 'Collection of Attr objects' },
    { name: 'DOMStringList', description: 'List of DOMString values' },

    // Range and Selection
    { name: 'Range', description: 'Fragment of document that can contain nodes and text' },
    { name: 'Selection', description: 'Range of text selected by user or cursor position' },

    // Event interfaces
    { name: 'Event', description: 'Represents an event which takes place in the DOM' },
    { name: 'UIEvent', inherits: 'Event', description: 'Simple user interface events' },
    { name: 'MouseEvent', inherits: 'UIEvent', description: 'Events from pointing device interaction' },
    { name: 'KeyboardEvent', inherits: 'UIEvent', description: 'Keyboard interaction events' },
    { name: 'FocusEvent', inherits: 'UIEvent', description: 'Events related to focus' },
    { name: 'InputEvent', inherits: 'UIEvent', description: 'Events notifying of editable content changes' },
    { name: 'WheelEvent', inherits: 'MouseEvent', description: 'Events from rotating mouse wheel' },
    { name: 'DragEvent', inherits: 'MouseEvent', description: 'Drag and drop interaction events' },
    { name: 'TouchEvent', inherits: 'UIEvent', description: 'Events from touch-sensitive surface' },
    { name: 'PointerEvent', inherits: 'MouseEvent', description: 'Events from pointing device' },
    { name: 'ClipboardEvent', inherits: 'Event', description: 'Events providing clipboard information' },
    { name: 'AnimationEvent', inherits: 'Event', description: 'Events sent for CSS Animations' },
    { name: 'TransitionEvent', inherits: 'Event', description: 'Events sent for CSS Transitions' },
    { name: 'ProgressEvent', inherits: 'Event', description: 'Events measuring progress of operation' },
    { name: 'CustomEvent', inherits: 'Event', description: 'Events with custom application-defined data' },
    { name: 'ErrorEvent', inherits: 'Event', description: 'Events providing error information' },
    { name: 'HashChangeEvent', inherits: 'Event', description: 'Events for URL hash changes' },
    { name: 'PopStateEvent', inherits: 'Event', description: 'Events for history navigation' },
    { name: 'StorageEvent', inherits: 'Event', description: 'Events for storage area changes' },
    { name: 'SubmitEvent', inherits: 'Event', description: 'Events for form submission' },
    { name: 'BeforeUnloadEvent', inherits: 'Event', description: 'Events before window unload' },

    // Specific HTML element interfaces
    { name: 'HTMLAnchorElement', inherits: 'HTMLElement', description: 'HTML anchor element' },
    { name: 'HTMLAreaElement', inherits: 'HTMLElement', description: 'HTML area element' },
    { name: 'HTMLAudioElement', inherits: 'HTMLMediaElement', description: 'HTML audio element' },
    { name: 'HTMLBRElement', inherits: 'HTMLElement', description: 'HTML line break element' },
    { name: 'HTMLBaseElement', inherits: 'HTMLElement', description: 'HTML base element' },
    { name: 'HTMLBodyElement', inherits: 'HTMLElement', description: 'HTML body element' },
    { name: 'HTMLButtonElement', inherits: 'HTMLElement', description: 'HTML button element' },
    { name: 'HTMLCanvasElement', inherits: 'HTMLElement', description: 'HTML canvas element' },
    { name: 'HTMLDListElement', inherits: 'HTMLElement', description: 'HTML description list element' },
    { name: 'HTMLDataElement', inherits: 'HTMLElement', description: 'HTML data element' },
    { name: 'HTMLDataListElement', inherits: 'HTMLElement', description: 'HTML datalist element' },
    { name: 'HTMLDetailsElement', inherits: 'HTMLElement', description: 'HTML details element' },
    { name: 'HTMLDialogElement', inherits: 'HTMLElement', description: 'HTML dialog element' },
    { name: 'HTMLDivElement', inherits: 'HTMLElement', description: 'HTML div element' },
    { name: 'HTMLEmbedElement', inherits: 'HTMLElement', description: 'HTML embed element' },
    { name: 'HTMLFieldSetElement', inherits: 'HTMLElement', description: 'HTML fieldset element' },
    { name: 'HTMLFormElement', inherits: 'HTMLElement', description: 'HTML form element' },
    { name: 'HTMLHRElement', inherits: 'HTMLElement', description: 'HTML horizontal rule element' },
    { name: 'HTMLHeadElement', inherits: 'HTMLElement', description: 'HTML head element' },
    { name: 'HTMLHeadingElement', inherits: 'HTMLElement', description: 'HTML heading elements (h1-h6)' },
    { name: 'HTMLHtmlElement', inherits: 'HTMLElement', description: 'HTML root element' },
    { name: 'HTMLIFrameElement', inherits: 'HTMLElement', description: 'HTML iframe element' },
    { name: 'HTMLImageElement', inherits: 'HTMLElement', description: 'HTML image element' },
    { name: 'HTMLInputElement', inherits: 'HTMLElement', description: 'HTML input element' },
    { name: 'HTMLLIElement', inherits: 'HTMLElement', description: 'HTML list item element' },
    { name: 'HTMLLabelElement', inherits: 'HTMLElement', description: 'HTML label element' },
    { name: 'HTMLLegendElement', inherits: 'HTMLElement', description: 'HTML legend element' },
    { name: 'HTMLLinkElement', inherits: 'HTMLElement', description: 'HTML link element' },
    { name: 'HTMLMapElement', inherits: 'HTMLElement', description: 'HTML map element' },
    { name: 'HTMLMediaElement', inherits: 'HTMLElement', description: 'Base interface for audio and video' },
    { name: 'HTMLMetaElement', inherits: 'HTMLElement', description: 'HTML meta element' },
    { name: 'HTMLMeterElement', inherits: 'HTMLElement', description: 'HTML meter element' },
    { name: 'HTMLModElement', inherits: 'HTMLElement', description: 'HTML modification elements (ins, del)' },
    { name: 'HTMLOListElement', inherits: 'HTMLElement', description: 'HTML ordered list element' },
    { name: 'HTMLObjectElement', inherits: 'HTMLElement', description: 'HTML object element' },
    { name: 'HTMLOptGroupElement', inherits: 'HTMLElement', description: 'HTML optgroup element' },
    { name: 'HTMLOptionElement', inherits: 'HTMLElement', description: 'HTML option element' },
    { name: 'HTMLOutputElement', inherits: 'HTMLElement', description: 'HTML output element' },
    { name: 'HTMLParagraphElement', inherits: 'HTMLElement', description: 'HTML paragraph element' },
    { name: 'HTMLPictureElement', inherits: 'HTMLElement', description: 'HTML picture element' },
    { name: 'HTMLPreElement', inherits: 'HTMLElement', description: 'HTML preformatted text element' },
    { name: 'HTMLProgressElement', inherits: 'HTMLElement', description: 'HTML progress element' },
    { name: 'HTMLQuoteElement', inherits: 'HTMLElement', description: 'HTML quote elements (blockquote, q)' },
    { name: 'HTMLScriptElement', inherits: 'HTMLElement', description: 'HTML script element' },
    { name: 'HTMLSelectElement', inherits: 'HTMLElement', description: 'HTML select element' },
    { name: 'HTMLSlotElement', inherits: 'HTMLElement', description: 'HTML slot element' },
    { name: 'HTMLSourceElement', inherits: 'HTMLElement', description: 'HTML source element' },
    { name: 'HTMLSpanElement', inherits: 'HTMLElement', description: 'HTML span element' },
    { name: 'HTMLStyleElement', inherits: 'HTMLElement', description: 'HTML style element' },
    { name: 'HTMLTableCaptionElement', inherits: 'HTMLElement', description: 'HTML table caption element' },
    { name: 'HTMLTableCellElement', inherits: 'HTMLElement', description: 'HTML table cell elements (td, th)' },
    { name: 'HTMLTableColElement', inherits: 'HTMLElement', description: 'HTML table column elements (col, colgroup)' },
    { name: 'HTMLTableElement', inherits: 'HTMLElement', description: 'HTML table element' },
    { name: 'HTMLTableRowElement', inherits: 'HTMLElement', description: 'HTML table row element' },
    { name: 'HTMLTableSectionElement', inherits: 'HTMLElement', description: 'HTML table section elements (thead, tbody, tfoot)' },
    { name: 'HTMLTemplateElement', inherits: 'HTMLElement', description: 'HTML template element' },
    { name: 'HTMLTextAreaElement', inherits: 'HTMLElement', description: 'HTML textarea element' },
    { name: 'HTMLTimeElement', inherits: 'HTMLElement', description: 'HTML time element' },
    { name: 'HTMLTitleElement', inherits: 'HTMLElement', description: 'HTML title element' },
    { name: 'HTMLTrackElement', inherits: 'HTMLElement', description: 'HTML track element' },
    { name: 'HTMLUListElement', inherits: 'HTMLElement', description: 'HTML unordered list element' },
    { name: 'HTMLVideoElement', inherits: 'HTMLMediaElement', description: 'HTML video element' },

    // Other interfaces
    { name: 'Window', inherits: 'EventTarget', description: 'Window containing a DOM document' },
    { name: 'Navigator', description: 'State and identity of user agent' },
    { name: 'Location', description: 'Location (URL) of object it is linked to' },
    { name: 'History', description: 'Session history manipulation' },
    { name: 'Screen', description: 'Information about screen' },
    { name: 'Console', description: 'Access to browser debugging console' },
    { name: 'Storage', description: 'Access to storage object (localStorage, sessionStorage)' },
    { name: 'MutationObserver', description: 'Observes changes to DOM tree' },
    { name: 'IntersectionObserver', description: 'Observes changes in intersection of target element' },
    { name: 'ResizeObserver', description: 'Observes changes to Element content or border box' },
    { name: 'PerformanceObserver', description: 'Observes performance measurement events' },
    { name: 'XMLHttpRequest', inherits: 'EventTarget', description: 'AJAX requests to interact with servers' },
    { name: 'FormData', description: 'Construct set of key/value pairs representing form fields' },
    { name: 'Blob', description: 'File-like object of immutable raw data' },
    { name: 'File', inherits: 'Blob', description: 'Information about files and access to their content' },
    { name: 'FileList', description: 'List of File objects' },
    { name: 'FileReader', inherits: 'EventTarget', description: 'Read contents of files stored on user computer' },
    { name: 'URL', description: 'Object representing object URL' },
    { name: 'URLSearchParams', description: 'Collection of key/value pairs for query string' },
    { name: 'AbortController', description: 'Abort one or more Web requests' },
    { name: 'AbortSignal', inherits: 'EventTarget', description: 'Signal object for abort operations' },
    { name: 'DOMParser', description: 'Parse XML or HTML source into DOM Document' },
    { name: 'XMLSerializer', description: 'Serialize DOM tree into XML string' },
    { name: 'WebSocket', inherits: 'EventTarget', description: 'WebSocket connection to server' },
    { name: 'Worker', inherits: 'EventTarget', description: 'Background task execution' },
    { name: 'SharedWorker', inherits: 'EventTarget', description: 'Shared background task execution' },
    { name: 'MessagePort', inherits: 'EventTarget', description: 'End of message channel' },
    { name: 'MessageChannel', description: 'Two-way communication channel' },
    { name: 'BroadcastChannel', inherits: 'EventTarget', description: 'Communication between browsing contexts' },
  ]

  const records: StandardRecord[] = domInterfaces.map(iface => ({
    ns: NS,
    type: 'DOMInterface',
    id: toWikipediaStyleId(iface.name),
    name: iface.name,
    description: cleanDescription(`${iface.description}${iface.inherits ? ` (extends ${iface.inherits})` : ''}`),
    code: iface.inherits || '',
  }))

  writeStandardTSV(join(DATA_DIR, 'W3C.DOMInterfaces.tsv'), records)

  // Create inheritance relationships
  const relationships: RelationshipRecord[] = domInterfaces
    .filter(iface => iface.inherits)
    .map(iface => ({
      fromNs: NS,
      fromType: 'DOMInterface',
      fromId: toWikipediaStyleId(iface.name),
      toNs: NS,
      toType: 'DOMInterface',
      toId: toWikipediaStyleId(iface.inherits!),
      relationshipType: 'extends',
    }))

  if (relationships.length > 0) {
    writeRelationshipTSV(join(REL_DIR, 'W3C.DOMInterface.Inheritance.tsv'), relationships)
  }
}

/**
 * Transform SVG Elements
 */
function transformSVGElements(): void {
  console.log('Transforming SVG Elements...')

  const svgElements: SVGElement[] = [
    // Container elements
    { tag: 'svg', category: 'container', description: 'Container and root element for SVG graphics' },
    { tag: 'g', category: 'container', description: 'Groups SVG elements together' },
    { tag: 'defs', category: 'container', description: 'Container for referenced elements' },
    { tag: 'symbol', category: 'container', description: 'Defines graphical template object' },
    { tag: 'use', category: 'container', description: 'References another element for reuse' },
    { tag: 'marker', category: 'container', description: 'Defines graphics for drawing on path' },
    { tag: 'pattern', category: 'container', description: 'Defines graphics used to fill or stroke object' },
    { tag: 'mask', category: 'container', description: 'Defines alpha mask for compositing' },
    { tag: 'clipPath', category: 'container', description: 'Defines clipping path' },
    { tag: 'switch', category: 'container', description: 'Renders first child that matches conditions' },
    { tag: 'a', category: 'container', description: 'Creates hyperlink in SVG' },

    // Shape elements
    { tag: 'rect', category: 'shape', description: 'Rectangle shape' },
    { tag: 'circle', category: 'shape', description: 'Circle shape' },
    { tag: 'ellipse', category: 'shape', description: 'Ellipse shape' },
    { tag: 'line', category: 'shape', description: 'Straight line shape' },
    { tag: 'polyline', category: 'shape', description: 'Connected straight line segments' },
    { tag: 'polygon', category: 'shape', description: 'Closed shape of connected straight lines' },
    { tag: 'path', category: 'shape', description: 'Generic shape defined by path commands' },

    // Text elements
    { tag: 'text', category: 'text', description: 'Graphics element containing text' },
    { tag: 'tspan', category: 'text', description: 'Sub-text within text element' },
    { tag: 'textPath', category: 'text', description: 'Text rendered along path' },

    // Gradient elements
    { tag: 'linearGradient', category: 'gradient', description: 'Linear gradient paint server' },
    { tag: 'radialGradient', category: 'gradient', description: 'Radial gradient paint server' },
    { tag: 'stop', category: 'gradient', description: 'Color stop in gradient' },

    // Filter elements
    { tag: 'filter', category: 'filter', description: 'Container for filter effects' },
    { tag: 'feBlend', category: 'filter', description: 'Blends two input images' },
    { tag: 'feColorMatrix', category: 'filter', description: 'Applies color transformation matrix' },
    { tag: 'feComponentTransfer', category: 'filter', description: 'Performs component-wise color remapping' },
    { tag: 'feComposite', category: 'filter', description: 'Combines two input images' },
    { tag: 'feConvolveMatrix', category: 'filter', description: 'Applies matrix convolution filter' },
    { tag: 'feDiffuseLighting', category: 'filter', description: 'Lights image using alpha channel as bump map' },
    { tag: 'feDisplacementMap', category: 'filter', description: 'Displaces pixels in input image' },
    { tag: 'feDropShadow', category: 'filter', description: 'Creates drop shadow effect' },
    { tag: 'feFlood', category: 'filter', description: 'Fills filter subregion with color' },
    { tag: 'feFuncA', category: 'filter', description: 'Alpha component transfer function' },
    { tag: 'feFuncB', category: 'filter', description: 'Blue component transfer function' },
    { tag: 'feFuncG', category: 'filter', description: 'Green component transfer function' },
    { tag: 'feFuncR', category: 'filter', description: 'Red component transfer function' },
    { tag: 'feGaussianBlur', category: 'filter', description: 'Applies Gaussian blur' },
    { tag: 'feImage', category: 'filter', description: 'Fetches image data from external source' },
    { tag: 'feMerge', category: 'filter', description: 'Composites multiple inputs together' },
    { tag: 'feMergeNode', category: 'filter', description: 'Input for feMerge' },
    { tag: 'feMorphology', category: 'filter', description: 'Erodes or dilates input image' },
    { tag: 'feOffset', category: 'filter', description: 'Offsets input image' },
    { tag: 'fePointLight', category: 'filter', description: 'Defines point light source' },
    { tag: 'feSpecularLighting', category: 'filter', description: 'Lights source using alpha as bump map' },
    { tag: 'feSpotLight', category: 'filter', description: 'Defines spot light source' },
    { tag: 'feTile', category: 'filter', description: 'Fills target with tiled pattern' },
    { tag: 'feTurbulence', category: 'filter', description: 'Creates turbulence effect using Perlin noise' },

    // Animation elements
    { tag: 'animate', category: 'animation', description: 'Animates attribute or property over time' },
    { tag: 'animateMotion', category: 'animation', description: 'Animates element along path' },
    { tag: 'animateTransform', category: 'animation', description: 'Animates transformation attribute' },
    { tag: 'set', category: 'animation', description: 'Sets value of attribute for duration' },
    { tag: 'mpath', category: 'animation', description: 'Provides motion path for animateMotion' },

    // Descriptive elements
    { tag: 'title', category: 'descriptive', description: 'Title description for container or graphics element' },
    { tag: 'desc', category: 'descriptive', description: 'Text description for container or graphics element' },
    { tag: 'metadata', category: 'descriptive', description: 'Metadata for SVG content' },

    // Other elements
    { tag: 'image', category: 'graphics', description: 'References raster image file' },
    { tag: 'foreignObject', category: 'graphics', description: 'Contains elements from different XML namespace' },
    { tag: 'script', category: 'scripting', description: 'Script in SVG document' },
    { tag: 'style', category: 'styling', description: 'Style sheet in SVG document' },
    { tag: 'view', category: 'other', description: 'Defines view of SVG document' },
  ]

  const records: StandardRecord[] = svgElements.map(el => ({
    ns: NS,
    type: 'SVGElement',
    id: toWikipediaStyleId(el.tag),
    name: `<${el.tag}>`,
    description: cleanDescription(`${el.description}${el.deprecated ? ' (Deprecated)' : ''}`),
    code: el.tag,
  }))

  writeStandardTSV(join(DATA_DIR, 'W3C.SVGElements.tsv'), records)
}

/**
 * Transform SVG Attributes
 */
function transformSVGAttributes(): void {
  console.log('Transforming SVG Attributes...')

  const svgAttributes: SVGAttribute[] = [
    // Core attributes
    { name: 'id', elements: ['*'], description: 'Unique identifier' },
    { name: 'class', elements: ['*'], description: 'Space-separated list of classes' },
    { name: 'style', elements: ['*'], description: 'Inline CSS styling' },
    { name: 'lang', elements: ['*'], description: 'Language of element content' },
    { name: 'tabindex', elements: ['*'], description: 'Tab order of element' },

    // Presentation attributes
    { name: 'fill', elements: ['*'], description: 'Fill color or paint server' },
    { name: 'fill-opacity', elements: ['*'], description: 'Opacity of fill' },
    { name: 'fill-rule', elements: ['*'], description: 'Algorithm for determining inside of shape' },
    { name: 'stroke', elements: ['*'], description: 'Stroke color or paint server' },
    { name: 'stroke-width', elements: ['*'], description: 'Width of stroke' },
    { name: 'stroke-opacity', elements: ['*'], description: 'Opacity of stroke' },
    { name: 'stroke-linecap', elements: ['*'], description: 'Shape at end of open subpaths' },
    { name: 'stroke-linejoin', elements: ['*'], description: 'Shape at corners of paths' },
    { name: 'stroke-miterlimit', elements: ['*'], description: 'Limit on miter join ratio' },
    { name: 'stroke-dasharray', elements: ['*'], description: 'Pattern of dashes and gaps' },
    { name: 'stroke-dashoffset', elements: ['*'], description: 'Offset for dash pattern' },
    { name: 'opacity', elements: ['*'], description: 'Overall opacity' },
    { name: 'visibility', elements: ['*'], description: 'Visibility of element' },
    { name: 'display', elements: ['*'], description: 'Display behavior' },
    { name: 'transform', elements: ['*'], description: 'Transformation applied to element' },
    { name: 'color', elements: ['*'], description: 'Color for currentColor keyword' },

    // Geometric attributes
    { name: 'x', elements: ['rect', 'image', 'foreignObject', 'use', 'svg'], description: 'X coordinate' },
    { name: 'y', elements: ['rect', 'image', 'foreignObject', 'use', 'svg'], description: 'Y coordinate' },
    { name: 'width', elements: ['rect', 'image', 'foreignObject', 'use', 'svg'], description: 'Width dimension' },
    { name: 'height', elements: ['rect', 'image', 'foreignObject', 'use', 'svg'], description: 'Height dimension' },
    { name: 'cx', elements: ['circle', 'ellipse'], description: 'Center X coordinate' },
    { name: 'cy', elements: ['circle', 'ellipse'], description: 'Center Y coordinate' },
    { name: 'r', elements: ['circle'], description: 'Radius' },
    { name: 'rx', elements: ['ellipse', 'rect'], description: 'X radius or corner radius' },
    { name: 'ry', elements: ['ellipse', 'rect'], description: 'Y radius or corner radius' },
    { name: 'x1', elements: ['line'], description: 'Starting X coordinate' },
    { name: 'y1', elements: ['line'], description: 'Starting Y coordinate' },
    { name: 'x2', elements: ['line'], description: 'Ending X coordinate' },
    { name: 'y2', elements: ['line'], description: 'Ending Y coordinate' },
    { name: 'points', elements: ['polyline', 'polygon'], description: 'List of points' },
    { name: 'd', elements: ['path'], description: 'Path definition' },

    // Text attributes
    { name: 'text-anchor', elements: ['text', 'tspan', 'textPath'], description: 'Text alignment (start, middle, end)' },
    { name: 'font-family', elements: ['text', 'tspan', 'textPath'], description: 'Font family' },
    { name: 'font-size', elements: ['text', 'tspan', 'textPath'], description: 'Font size' },
    { name: 'font-weight', elements: ['text', 'tspan', 'textPath'], description: 'Font weight' },
    { name: 'font-style', elements: ['text', 'tspan', 'textPath'], description: 'Font style (normal, italic, oblique)' },
    { name: 'text-decoration', elements: ['text', 'tspan', 'textPath'], description: 'Text decoration' },
    { name: 'letter-spacing', elements: ['text', 'tspan', 'textPath'], description: 'Space between characters' },
    { name: 'word-spacing', elements: ['text', 'tspan', 'textPath'], description: 'Space between words' },

    // Link attributes
    { name: 'href', elements: ['a', 'use', 'image', 'script'], description: 'URL of linked resource' },
    { name: 'target', elements: ['a'], description: 'Browsing context for link' },

    // Gradient attributes
    { name: 'gradientUnits', elements: ['linearGradient', 'radialGradient'], description: 'Coordinate system for gradient' },
    { name: 'gradientTransform', elements: ['linearGradient', 'radialGradient'], description: 'Transform for gradient' },
    { name: 'spreadMethod', elements: ['linearGradient', 'radialGradient'], description: 'How gradient extends beyond bounds' },
    { name: 'offset', elements: ['stop'], description: 'Position of gradient stop' },
    { name: 'stop-color', elements: ['stop'], description: 'Color of gradient stop' },
    { name: 'stop-opacity', elements: ['stop'], description: 'Opacity of gradient stop' },

    // Filter attributes
    { name: 'filter', elements: ['*'], description: 'Reference to filter element' },
    { name: 'filterUnits', elements: ['filter'], description: 'Coordinate system for filter' },
    { name: 'primitiveUnits', elements: ['filter'], description: 'Coordinate system for filter primitives' },
    { name: 'in', elements: ['feBlend', 'feColorMatrix', 'feComposite'], description: 'Input for filter primitive' },
    { name: 'in2', elements: ['feBlend', 'feComposite', 'feDisplacementMap'], description: 'Second input for filter primitive' },
    { name: 'result', elements: ['feBlend', 'feColorMatrix', 'feComposite'], description: 'Name for filter primitive result' },
    { name: 'mode', elements: ['feBlend'], description: 'Blend mode' },
    { name: 'type', elements: ['feColorMatrix', 'feTurbulence'], description: 'Type of operation' },
    { name: 'values', elements: ['feColorMatrix'], description: 'Matrix values' },
    { name: 'stdDeviation', elements: ['feGaussianBlur'], description: 'Standard deviation for blur' },

    // Animation attributes
    { name: 'attributeName', elements: ['animate', 'animateTransform', 'set'], description: 'Name of attribute to animate' },
    { name: 'from', elements: ['animate', 'animateMotion', 'animateTransform'], description: 'Starting value' },
    { name: 'to', elements: ['animate', 'animateMotion', 'animateTransform', 'set'], description: 'Ending value' },
    { name: 'by', elements: ['animate', 'animateMotion', 'animateTransform'], description: 'Relative offset value' },
    { name: 'dur', elements: ['animate', 'animateMotion', 'animateTransform', 'set'], description: 'Duration of animation' },
    { name: 'begin', elements: ['animate', 'animateMotion', 'animateTransform', 'set'], description: 'Begin time for animation' },
    { name: 'end', elements: ['animate', 'animateMotion', 'animateTransform', 'set'], description: 'End time for animation' },
    { name: 'repeatCount', elements: ['animate', 'animateMotion', 'animateTransform'], description: 'Number of times to repeat' },
    { name: 'repeatDur', elements: ['animate', 'animateMotion', 'animateTransform'], description: 'Total duration of repeats' },

    // Viewport attributes
    { name: 'viewBox', elements: ['svg', 'symbol', 'marker', 'pattern', 'view'], description: 'Viewport bounds' },
    { name: 'preserveAspectRatio', elements: ['svg', 'symbol', 'marker', 'pattern', 'view'], description: 'Aspect ratio preservation' },

    // Other attributes
    { name: 'clip-path', elements: ['*'], description: 'Reference to clipping path' },
    { name: 'mask', elements: ['*'], description: 'Reference to mask' },
    { name: 'marker-start', elements: ['path', 'line', 'polyline', 'polygon'], description: 'Marker at start of path' },
    { name: 'marker-mid', elements: ['path', 'line', 'polyline', 'polygon'], description: 'Marker at mid points of path' },
    { name: 'marker-end', elements: ['path', 'line', 'polyline', 'polygon'], description: 'Marker at end of path' },
    { name: 'pathLength', elements: ['path', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'rect'], description: 'Total length of path' },
  ]

  const records: StandardRecord[] = svgAttributes.map(attr => ({
    ns: NS,
    type: 'SVGAttribute',
    id: toWikipediaStyleId(attr.name),
    name: attr.name,
    description: cleanDescription(attr.description || ''),
    code: attr.elements.join(','),
  }))

  writeStandardTSV(join(DATA_DIR, 'W3C.SVGAttributes.tsv'), records)
}

/**
 * Main transformation function
 */
export async function transformW3CHTML(): Promise<void> {
  console.log('=== W3C HTML/DOM/SVG Standards Transformation ===\n')
  ensureOutputDirs()

  transformHTMLElements()
  transformHTMLAttributes()
  transformHTMLEvents()
  transformDOMInterfaces()
  transformSVGElements()
  transformSVGAttributes()

  console.log('\n=== W3C Transformation Complete ===')
}

// Run if called directly
if (import.meta.main) {
  transformW3CHTML().catch(console.error)
}
