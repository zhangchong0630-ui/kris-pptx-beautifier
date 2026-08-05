# Alignment and Fidelity Contract

## Authoring Grid

- Author at 1920x1080 on a 12-column grid.
- Use an 8px base spacing scale. Prefer multiples of 8; use 4px only for optical
  corrections and record the exception in the design brief.
- Define page margins, title zone, content zone, columns, rows, and gaps as CSS
  custom properties. Repeated elements must use CSS Grid or Flexbox rather than
  unrelated absolute coordinates.
- Elements in one logical row share a common top or optical baseline. Elements
  in one logical column share a common left edge.
- Repeated cards must have equal width and consistent padding. Equal-height cards
  are required when they are presented as peers.

## Export-Safe Text

- Use `data-pptx="shape-text"` for a filled label, table header, badge, banner,
  or color strip whose text must remain centered inside the shape. This creates
  one PowerPoint shape instead of independent shape and text objects.
- Use `data-pptx-valign="top|middle|bottom"` when vertical alignment is
  intentional. Otherwise the exporter maps centered Flexbox alignment to
  PowerPoint middle alignment and defaults normal text to top.
- Use real CSS padding on editable text elements. The exporter maps computed
  padding to PowerPoint text insets.
- Use `display:flex; align-items:center` for vertically centered single-line
  labels. Add `justify-content:center` or `text-align:center` for horizontal
  centering.
- Set explicit line height, width, and height. Do not center text by guessing a
  top offset inside a separate rectangle.
- Avoid mixed font families in a repeated group. Browser and PowerPoint font
  metrics differ; use an installed source-approved font and verify wrapping.

## Declarative Layout Checks

Add `data-layout-group` and `data-layout-check` to repeated groups:

```html
<div class="feature-grid"
     data-layout-group="feature-cards"
     data-layout-check="equal-width,equal-height,equal-x-gap,equal-y-gap">
  <article data-layout-item>...</article>
  <article data-layout-item>...</article>
</div>
```

Supported checks:

- `equal-width`, `equal-height`
- `align-left`, `align-right`, `align-top`, `align-bottom`
- `equal-x-gap`, `equal-y-gap`

Checks use a 1px HTML tolerance by default. For grid gap checks, items are
clustered into visual rows or columns before differences are measured.

## Post-Export Gates

The final PPTX must pass all of these gates:

1. HTML stage bounds, clipping, overlap, and declarative alignment checks.
2. Geometry comparison between the captured HTML element ledger and exported
   PPT layout JSON. Position, size, center, alignment, and inset differences
   must be within the configured tolerance.
3. Rendered HTML and rendered PPT images reviewed side by side at full size.
4. A 200% inspection of repeated headers, color strips, table cells, peer cards,
   and annotation columns.
5. PowerPoint overflow test and re-import inspection.

Passing overflow alone is not sufficient. A deck fails refined QA when peer
elements have inconsistent edges, dimensions, gaps, text anchors, or optical
centers even when every object remains inside the slide.
