# W3C HTML/DOM/SVG Standards Transformation Script

## Overview

The `w3c-html.ts` script transforms W3C web standards data (HTML, DOM, SVG) into a standardized TSV format for the standards.org.ai platform. This includes comprehensive coverage of HTML elements, attributes, events, DOM interfaces, and SVG elements.

## Generated Files

The script generates the following TSV files in the `.data/` directory:

### HTML Standards
- **W3C.HTMLElements.tsv** - 120 HTML5 elements with descriptions
- **W3C.HTMLAttributes.tsv** - 73 HTML attributes (global and element-specific)
- **W3C.HTMLEvents.tsv** - 81 HTML/DOM events with interfaces and behavior

### DOM Standards
- **W3C.DOMInterfaces.tsv** - 134 DOM interfaces and their descriptions
- **W3C.DOMInterface.Inheritance.tsv** - 105 inheritance relationships between interfaces

### SVG Standards
- **W3C.SVGElements.tsv** - 62 SVG elements across all categories
- **W3C.SVGAttributes.tsv** - 79 SVG attributes and their applicable elements

## Data Structure

All records follow the standard TSV format:

```
ns          type            id                  name                description                                 code
w3.org.ai   HTMLElement     Div                 <div>               Generic container for flow content          div
w3.org.ai   DOMInterface    Eventtarget         EventTarget         Object that can receive events...
w3.org.ai   SVGElement      Circle              <circle>            Circle shape                                circle
```

### Columns

- **ns**: Namespace (w3.org.ai)
- **type**: Record type (HTMLElement, HTMLAttribute, HTMLEvent, DOMInterface, SVGElement, SVGAttribute)
- **id**: Wikipedia-style ID (Title_Case_With_Underscores)
- **name**: Display name (e.g., `<div>`, `EventTarget`)
- **description**: Human-readable description
- **code**: Element tag name, interface name, or parent interface

## HTML Elements Coverage

The script includes comprehensive coverage of HTML5 elements organized by category:

### Document Metadata
- `<html>`, `<head>`, `<title>`, `<base>`, `<link>`, `<meta>`, `<style>`

### Content Sectioning
- `<article>`, `<section>`, `<nav>`, `<aside>`, `<header>`, `<footer>`, `<main>`, `<h1-h6>`

### Text Content
- `<p>`, `<div>`, `<blockquote>`, `<ul>`, `<ol>`, `<li>`, `<dl>`, `<dt>`, `<dd>`, `<figure>`, `<figcaption>`, `<pre>`, `<hr>`

### Inline Text Semantics
- `<a>`, `<span>`, `<strong>`, `<em>`, `<code>`, `<mark>`, `<small>`, `<sub>`, `<sup>`, `<time>`, `<abbr>`, etc.

### Media Elements
- `<img>`, `<picture>`, `<video>`, `<audio>`, `<source>`, `<track>`, `<canvas>`, `<svg>`

### Form Elements
- `<form>`, `<input>`, `<button>`, `<select>`, `<textarea>`, `<label>`, `<fieldset>`, `<datalist>`, `<output>`, `<progress>`, `<meter>`

### Tables
- `<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<tr>`, `<th>`, `<td>`, `<caption>`, `<colgroup>`, `<col>`

### Interactive Elements
- `<details>`, `<summary>`, `<dialog>`

### Web Components
- `<template>`, `<slot>`

### Deprecated Elements
- Also includes deprecated elements marked appropriately (e.g., `<font>`, `<center>`, `<frame>`)

## HTML Attributes Coverage

### Global Attributes
- `id`, `class`, `style`, `title`, `lang`, `dir`, `hidden`, `tabindex`, `contenteditable`, `draggable`, `data-*`

### ARIA Attributes
- `role`, `aria-label`, `aria-hidden`, `aria-live`, `aria-describedby`, `aria-labelledby`

### Media Attributes
- `src`, `alt`, `width`, `height`, `controls`, `autoplay`, `loop`, `muted`, `poster`, `preload`

### Form Attributes
- `name`, `value`, `placeholder`, `required`, `disabled`, `readonly`, `checked`, `type`, `pattern`, `min`, `max`, `step`

### Link Attributes
- `href`, `target`, `rel`, `download`, `hreflang`

### Other Specialized Attributes
- Element-specific attributes for tables, forms, media, etc.

## HTML Events Coverage

### Mouse Events
- `click`, `dblclick`, `mousedown`, `mouseup`, `mousemove`, `mouseenter`, `mouseleave`, `contextmenu`

### Keyboard Events
- `keydown`, `keyup`, `keypress`

### Form Events
- `submit`, `reset`, `change`, `input`, `invalid`, `select`

### Focus Events
- `focus`, `blur`, `focusin`, `focusout`

### Drag Events
- `drag`, `dragstart`, `dragend`, `dragenter`, `dragleave`, `dragover`, `drop`

### Media Events
- `play`, `pause`, `playing`, `ended`, `timeupdate`, `volumechange`, `canplay`, `loadeddata`

### Touch Events
- `touchstart`, `touchend`, `touchmove`, `touchcancel`

### Pointer Events
- `pointerdown`, `pointerup`, `pointermove`, `pointerenter`, `pointerleave`

### Animation/Transition Events
- `animationstart`, `animationend`, `animationiteration`, `transitionstart`, `transitionend`

### Other Events
- `load`, `unload`, `error`, `resize`, `scroll`, `wheel`, `hashchange`, `popstate`, `storage`

## DOM Interfaces Coverage

### Core Interfaces
- `EventTarget`, `Node`, `Element`, `Document`, `HTMLElement`, `SVGElement`

### Document Interfaces
- `DocumentFragment`, `DocumentType`, `DOMImplementation`

### Element Interfaces
- `Attr`, `CharacterData`, `Text`, `Comment`, `CDATASection`, `ProcessingInstruction`

### Collection Interfaces
- `HTMLCollection`, `NodeList`, `DOMTokenList`, `NamedNodeMap`

### Event Interfaces
- `Event`, `UIEvent`, `MouseEvent`, `KeyboardEvent`, `FocusEvent`, `InputEvent`, `DragEvent`, `TouchEvent`, `PointerEvent`, `ClipboardEvent`, `AnimationEvent`, `TransitionEvent`, etc.

### Specific HTML Element Interfaces
- `HTMLAnchorElement`, `HTMLButtonElement`, `HTMLCanvasElement`, `HTMLFormElement`, `HTMLImageElement`, `HTMLInputElement`, `HTMLMediaElement`, `HTMLVideoElement`, `HTMLAudioElement`, etc. (50+ interfaces)

### Other Interfaces
- `Window`, `Navigator`, `Location`, `History`, `Storage`, `XMLHttpRequest`, `FormData`, `Blob`, `File`, `URL`, `WebSocket`, `MutationObserver`, `IntersectionObserver`, `ResizeObserver`, etc.

### Interface Inheritance
The script also generates inheritance relationships, tracking which interfaces extend others (e.g., `HTMLElement` extends `Element` extends `Node` extends `EventTarget`).

## SVG Elements Coverage

### Container Elements
- `<svg>`, `<g>`, `<defs>`, `<symbol>`, `<use>`, `<marker>`, `<pattern>`, `<mask>`, `<clipPath>`

### Shape Elements
- `<rect>`, `<circle>`, `<ellipse>`, `<line>`, `<polyline>`, `<polygon>`, `<path>`

### Text Elements
- `<text>`, `<tspan>`, `<textPath>`

### Gradient Elements
- `<linearGradient>`, `<radialGradient>`, `<stop>`

### Filter Elements
- `<filter>`, `<feBlend>`, `<feColorMatrix>`, `<feGaussianBlur>`, `<feDropShadow>`, `<feMerge>`, `<feTurbulence>`, etc. (20+ filter primitives)

### Animation Elements
- `<animate>`, `<animateMotion>`, `<animateTransform>`, `<set>`

## SVG Attributes Coverage

### Core Attributes
- `id`, `class`, `style`, `lang`, `tabindex`

### Presentation Attributes
- `fill`, `fill-opacity`, `stroke`, `stroke-width`, `stroke-opacity`, `stroke-linecap`, `opacity`, `transform`, etc.

### Geometric Attributes
- `x`, `y`, `width`, `height`, `cx`, `cy`, `r`, `rx`, `ry`, `d`, `points`

### Gradient/Filter Attributes
- `gradientUnits`, `gradientTransform`, `spreadMethod`, `offset`, `stop-color`, `filter`, `in`, `in2`, `result`

### Animation Attributes
- `attributeName`, `from`, `to`, `by`, `dur`, `begin`, `end`, `repeatCount`

## Data Sources

This script uses curated data compiled from multiple authoritative sources:

### Primary Sources
1. **W3C HTML Living Standard** - https://html.spec.whatwg.org/
2. **W3C DOM Standard** - https://dom.spec.whatwg.org/
3. **W3C SVG 2 Specification** - https://www.w3.org/TR/SVG2/
4. **MDN Web Docs** - https://developer.mozilla.org/en-US/docs/Web/

### Potential Future Data Sources
For enhanced automation and real-time updates, consider:
- **@mdn/browser-compat-data** npm package - Comprehensive browser compatibility data
- **web-platform-tests** - Test suite data for web standards
- **WebIDL specifications** - Interface definitions from W3C specs
- **Can I Use** data - Browser support information

## Usage

Run the transformation script:

```bash
# Using bun
bun run .scripts/w3c-html.ts

# Or via npm script
bun run generate:w3c-html
```

## Output Statistics

- **120** HTML Elements (including deprecated)
- **73** HTML Attributes (global and element-specific)
- **81** HTML Events (with interfaces and bubbling info)
- **134** DOM Interfaces
- **105** Interface inheritance relationships
- **62** SVG Elements
- **79** SVG Attributes

**Total: 549 records + 105 relationships**

## Future Enhancements

Potential improvements for this script:

1. **Automated Data Fetching**
   - Fetch from MDN Browser Compat Data API
   - Parse W3C spec HTML directly
   - Use WebIDL parsers for interface definitions

2. **Additional Data Types**
   - CSS Properties (see w3c-css.ts)
   - Web APIs (Fetch, WebRTC, WebGL, etc.)
   - Web Workers APIs
   - Service Worker APIs
   - WebAssembly interfaces

3. **Enhanced Metadata**
   - Browser compatibility data
   - Deprecation warnings with alternatives
   - Experimental feature flags
   - Version introduced/removed
   - Usage examples

4. **Relationship Mapping**
   - Element-to-interface mappings
   - Attribute-to-element relationships
   - Event-to-interface relationships
   - Method/property-to-interface relationships

## Related Scripts

- `w3c-css.ts` - CSS properties and values
- `w3c-semantic.ts` - Semantic web standards (RDF, OWL, etc.)
- `w3c-accessibility.ts` - ARIA and accessibility standards

## License

This data is compiled from W3C and WHATWG specifications, which are available under open licenses:
- W3C Software and Document License
- WHATWG Living Standards License
- MDN content is available under CC-BY-SA 2.5

## Namespace

All records use the namespace: **w3.org.ai**
