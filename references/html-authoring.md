# HTML Authoring Contract

## Structure

Use static, authored HTML:

```html
<section class="slide" data-pptx-slide data-label="Slide title">
  <div class="surface" data-pptx="shape"></div>
  <h2 data-pptx="text" data-source-id="s02-title">Slide title</h2>
  <img data-pptx="image" src="assets/photo.jpg" alt="...">
</section>
```

Author every slide at exactly 1920x1080. Scale the fixed stage as one unit for browser display; do not reflow slide contents by viewport. The exporter uses DOM order as PowerPoint z-order. Put background shapes first, then images, then text.

## Export Kinds

- `text`: native editable text box. Mark only leaf text elements; do not mark both a parent and child.
- `shape`: native rectangle, rounded rectangle, ellipse, or line. Use `data-pptx-geometry="ellipse|rect|roundRect|line"` when automatic geometry is ambiguous.
- `shape-text`: one native editable PowerPoint shape with fill, border, and text. Use for table headers, color strips, badges, banners, and other labels whose internal alignment must not drift.
- `image`: native image object. Use on `<img>` elements with resolvable HTTP or data URLs.
- `raster`: screenshot only this bounded region. Use for SVG, canvas, complex charts, filters, blends, unsupported gradients, or intricate masks.

## CSS Support

Our exporter reads computed DOM layout. It supports absolute position, width/height, solid and simple linear-gradient fills, solid borders, rounded corners, simple shadows, opacity, font family, font size, weight, italic, underline, links, alignment, line height, and object fit.

Do not rely on CSS transforms, blend modes, clipping paths, masks, text gradients, backdrop filters, pseudo-elements, or nested background effects for native elements. Mark the smallest affected parent as `raster`.

## Text

- Write each independently editable text block as a literal leaf element.
- Add `data-pptx-rich` when inline spans or links require distinct run-level formatting.
- Keep titles on one line when intended.
- Use at least 72px for deck titles, 52px for slide titles, 36px for subheads, and 30px for body copy on the 1920x1080 stage unless the source or user specifies otherwise.
- Use `letter-spacing: 0`.
- Set explicit width, height, and line height.
- Separate bullets into individual text leaves when different indentation or emphasis is needed.
- Do not place a fill or border on an element marked `text`; add a sibling `shape` behind it.
- Do not use a separate shape and manually offset text for a centered filled label. Use `shape-text`, Flexbox centering, and `data-pptx-valign="middle"`.
- Real CSS padding is exported as PowerPoint text insets. Do not simulate padding by shifting peer text boxes independently.

## Repeated Layouts

- Use a 12-column grid and 8px spacing tokens unless the source supplies a stronger grid.
- Build peer cards, table cells, KPI blocks, and annotation columns with CSS Grid/Flex.
- Mark repeated containers with `data-layout-group` and `data-layout-check`; mark direct repeated children with `data-layout-item`.
- Peer elements must share intentional edges, dimensions, gaps, and text anchors. Do not vertically center different-length body copy unless the approved design requires it.

## Images and Charts

- Keep original images or use verified assets.
- Follow `visual-asset-plan.json`; do not introduce an icon or image absent from the approved plan.
- Add `data-asset-id` to every approved non-source icon or image so it can be traced to the plan.
- Use one approved icon family and treatment across the rebuilt pages. Do not generate icons with an image model.
- Use simple native shapes for checks, steps, arrows, and status marks when they communicate clearly and editability matters.
- Keep approved library icons as local assets. Disclose when an icon is exported as an image rather than editable paths.
- Use generated images only for approved non-factual roles, and use the user-selected local candidate.
- Never generate logos, screenshots, charts, data, evidence, or factual diagrams.
- Use `object-fit: cover|contain` and explicit dimensions.
- Add meaningful `alt` text.
- Use native HTML/CSS for simple bars and metric visuals only when every component can be marked as a basic shape or text.
- Rasterize charts when exact rendering matters or when the chart uses SVG/canvas.

## Notes

Add one notes entry per slide:

```html
<script type="application/json" id="speaker-notes">
[
  "Presenter note\n\n[Sources]\n- https://example.com",
  ""
]
</script>
```

The array length must match the slide count. The preferred exporter may also read `data-pptx-notes`, but the JSON notes block remains required for the fallback and for validation.
