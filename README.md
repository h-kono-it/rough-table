# rough-table

A vanilla JS library that renders hand-drawn style borders on HTML tables using [Rough.js](https://roughjs.com/). Just add a class — no configuration required.

## How it works

Most "sketch style" table libraries render everything — including cell text — onto a canvas or SVG. rough-table takes a different approach:

- The **original `<table>` element is kept in the DOM as-is**, so text, links, and semantic structure are fully intact.
- Only the **borders are drawn as an SVG overlay**, positioned behind the table with `pointer-events: none`.

This means screen readers, search engines, and keyboard navigation all work exactly as they would with a plain HTML table — the hand-drawn look is purely cosmetic.

## Demo

![rough-table demo](https://raw.githubusercontent.com/h-kono-it/rough-table/main/examples/demo.png)

## Install

```bash
npm install rough-table
```

Or via CDN (no build step needed):

```html
<script src="https://unpkg.com/roughjs@latest/bundled/rough.js"></script>
<script src="https://unpkg.com/rough-table/rough-table.min.js"></script>
```

## Usage

### A. Add a class to the `<table>` directly

```html
<table class="rough-table">
  <thead>
    <tr><th>Item</th><th>Status</th></tr>
  </thead>
  <tbody>
    <tr><td>Design</td><td>Done</td></tr>
    <tr><td>Implementation</td><td>In progress</td></tr>
  </tbody>
</table>
```

### B. Wrap with an outer element (for Markdown parsers)

Useful when you can't add a class to the `<table>` itself (e.g. blog CMS, Markdown parsers).

```html
<div class="rough-table-outer" data-mode="solid" data-border="rows">

| Item | Status |
|------|--------|
| Design | Done |
| Implementation | In progress |

</div>
```

Options are read from the outer element; the inner `<table>` requires no modification.

## Options

Set via `data-*` attributes on the `<table>` (pattern A) or the outer element (pattern B).

| Attribute | Description | Default |
|---|---|---|
| `data-mode` | Drawing mode: `cell` or `solid` | `cell` |
| `data-border` | Border pattern (see below) | `full` |
| `data-roughness` | How rough the lines look | `1.5` |
| `data-stroke` | Line color | `#444` |
| `data-stroke-width` | Line width | `2` |
| `data-bowing` | Line bowing amount | `1` |

### `data-mode`

| Value | Description |
|---|---|
| `cell` (default) | Draws borders cell by cell — like stamping each cell individually |
| `solid` | Draws the outer frame first, then adds inner grid lines — closer to how you'd draw a table by hand |

### `data-border`

| Value | Description |
|---|---|
| `full` (default) | All borders |
| `outer` | Outer frame only |
| `inner` | Inner grid lines only (no outer frame) |
| `rows` | Top/bottom frame + horizontal dividers only (no vertical lines) |

## Examples

```html
<!-- Solid, rows only — clean and natural -->
<table class="rough-table" data-mode="solid" data-border="rows">

<!-- Outer frame only -->
<table class="rough-table" data-mode="solid" data-border="outer">

<!-- Red, rougher lines -->
<table class="rough-table" data-stroke="#c0392b" data-roughness="3">
```

## Manual initialization

If you add tables dynamically after page load:

```js
// Re-scan for all .rough-table and .rough-table-outer elements
RoughTable.init();

// Apply to a specific selector
RoughTable.init('.my-custom-class');

// Apply to a single element
RoughTable.draw(document.querySelector('table'));
```

## Requirements

- [Rough.js](https://roughjs.com/) v4 or later must be loaded before this library.
- Modern browser with `ResizeObserver` support (tables redraw automatically on resize).

## License

MIT
