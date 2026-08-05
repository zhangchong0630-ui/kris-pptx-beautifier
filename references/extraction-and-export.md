# Extraction and HTML-to-PPTX Export

The projects below are architectural references only. Do not install, invoke, import, or copy their skills or runtime packages.

## Extraction

`scripts/inspect-pptx.mjs` produces two complementary views:

- `inspection.ndjson`: detailed objects, coordinates, layouts, masters, tables, charts, images, and notes.
- `extracted-slides.json`: compact title, text, image, table, chart, notes, and reading-order data for semantic analysis.

The compact output adopts the useful simplicity of `zarazhangrui/frontend-slides/scripts/extract-pptx.py`, while the implementation remains ours and uses Artifact Tool. Never infer page logic from extracted text alone; compare coordinates, rendered slides, and object groupings.

## Fixed HTML Stage

- Author every HTML slide at exactly 1920x1080.
- Scale the whole fixed stage for browser viewing; do not reflow slide contents by viewport.
- Enter export mode before measurement so DOM coordinates remain on the 1920x1080 authoring canvas.
- Keep presentation controls outside the slide DOM.

## Our Exporter

`scripts/export-html-to-pptx.mjs` is the only HTML-to-PPTX route. It follows the coordinate-scraper idea studied in `dom-to-pptx`, but uses our own implementation and Artifact Tool:

1. Load the HTML in Playwright at 1920x1080.
2. Measure each marked DOM element with `getBoundingClientRect()`.
3. Read computed typography, padding, Flexbox alignment, fills, borders, radii, shadows, opacity, object-fit, and optional rich-text runs.
4. Map supported regions to native editable PowerPoint objects.
5. Rasterize only explicitly marked unsupported regions.
6. Render the exported PPTX and compare it with the HTML.

```bash
node "$BEAUTIFIER_SKILL/scripts/export-html-to-pptx.mjs" \
  --url "$DECK_URL" \
  --out "$TMP_DIR/replacement.pptx" \
  --qa-dir "$TMP_DIR/html-export-qa"
```

Use `data-pptx-rich` on a text leaf when inline child spans need distinct bold, italic, underline, color, font, or link treatment. Unsupported CSS must be simplified or marked on the smallest parent with `data-pptx="raster"`.

Use `data-pptx="shape-text"` for filled labels whose text alignment must remain
bound to the shape. The exporter saves a 1920x1080 HTML screenshot and an
HTML-geometry ledger for every slide alongside the PPT render and layout JSON.

After export, run:

```bash
node "$BEAUTIFIER_SKILL/scripts/compare-export-layout.mjs" \
  --qa-dir "$TMP_DIR/html-export-qa" \
  --tolerance 1
```

Fix every missing element, geometry mismatch, text-anchor mismatch, and inset
mismatch before visual review.

## Output Routing

The exporter creates a replacement deck containing only selected slides. Follow
`intake-contract.json`: deliver it directly for standalone output, or merge it
into an untouched source copy with `merge-partial-pptx.mjs`. When merging,
verify all unselected pages and notes are unchanged.
