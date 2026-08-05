---
name: kris-pptx-beautifier
description: >-
  Rebuild an existing PowerPoint deck within its original brand through an HTML-first workflow:
  establish color, copy, output, and visual-direction choices with the user; inspect and decompose
  the source PPTX; lock business content and map each page's element logic; select a suitable
  frontend design system; rebuild selected or all slides as fixed 1920x1080 HTML; export editable
  PowerPoint objects with strict alignment fidelity; and verify the final PPTX visually. Use for
  美化PPT, 改PPT样式, 重新排版PPT, 同品牌重构, PPT转HTML再回写PPTX, or beautifying specified pages.
---

# Kris PPTX Beautifier

Rebuild an existing PPTX as reviewable HTML and return an editable PPTX copy. The current supported mode is `brand-rebuild` / 同品牌重构.

## Non-negotiable Defaults

- Preserve slide count, order, facts, text, numbers, names, units, citations, and speaker notes unless explicitly permitted otherwise.
- Preserve hierarchy, sequence, parallel groups, comparisons, cycles, cause-and-effect links, and evidence relationships.
- Preserve source brand colors, fonts, logo treatment, master furniture, and authentic screenshots.
- Never overwrite the source PPTX.
- Ask whether selected pages should be standalone or replaced in a source copy; never infer this silently.
- Redesign only requested 1-based page numbers; when merging, keep every unselected page and note unchanged.
- Author every HTML slide at exactly 1920x1080 and scale the fixed stage as a whole for browser viewing.
- Do not invent page numbers, side rails, navigation, app chrome, or section shells absent from the source.
- Use a 12-column grid and 8px spacing system unless the source template provides a stronger grid.
- Never hand-center text over a separate shape when a single editable shape-with-text can preserve alignment.
- Render and inspect every final slide before delivery.

## Required Companion Skill

Load the installed `presentations` skill before doing PPTX work. Follow its source handling, Artifact Tool setup, QA, and delivery rules. This skill adds the HTML-first same-brand rebuild route.

## Workspace

Define:

```bash
BEAUTIFIER_SKILL=<absolute path to this skill>
PRESENTATIONS_SKILL=<absolute path to the active presentations skill>
TMP_DIR=<absolute task directory>
SOURCE_PPTX=<absolute source path>
FINAL_PPTX=<absolute output copy path>
SELECTED_SLIDES=<1-based list such as 3,5-7; use all pages for a full rebuild>
STYLE_MODE=brand-rebuild
```

Copy `assets/deck-template.html` to `$TMP_DIR/deck.html`. Keep intermediate inspection, HTML, ledgers, previews, and QA under `$TMP_DIR`; write only the final PPTX to `$FINAL_PPTX`.

Initialize `$TMP_DIR` with the presentations skill's `container_tools/setup_artifact_tool_workspace.mjs`.

## Workflow

### 1. Run the Intake Gate

Read `references/intake-and-design-approval.md`. Before inspection, ask the user for:

- output mode and selected 1-based pages;
- color policy;
- copy policy;
- visual direction;
- design approval mode.

Ask for audience, presentation setting, protected assets, and editability only when they are not already clear. Offer concrete choices and examples; allow `AI decide`. Save the result as `$TMP_DIR/intake-contract.json`. Do not begin slide authoring until the required choices are resolved.

Validate it before inspection:

```bash
node "$BEAUTIFIER_SKILL/scripts/validate-project-contracts.mjs" \
  --intake "$TMP_DIR/intake-contract.json"
```

Read `references/source-style-modes.md`. A new composition is allowed only when the source relationship logic remains unchanged.

### 2. Inspect and Extract

```bash
node "$BEAUTIFIER_SKILL/scripts/inspect-pptx.mjs" \
  --pptx "$SOURCE_PPTX" \
  --slides "$SELECTED_SLIDES" \
  --out "$TMP_DIR/source-inspection"
```

Review the full montage and every selected source slide individually. Use:

- `inspection.ndjson` for detailed objects, coordinates, layouts, masters, tables, charts, images, and notes;
- `extracted-slides.json` for compact text, image, notes, and reading-order analysis;
- per-slide layout JSON and rendered slides as the visual authority;
- extracted media for authentic source assets.

Create `$TMP_DIR/content-lock.json` using `references/content-lock.md`. Give every preserved source item a stable `sourceId`. Copy source speaker notes to the corresponding HTML slide; append new `[Sources]` blocks rather than replacing notes.

### 3. Map Element Logic and Select a Design System

Read `references/element-logic-and-components.md` and `references/frontend-design-routing.md`. Create `$TMP_DIR/element-logic-map.json` before choosing layouts. For every locked element, record its role, relationship, group, and preservation rule. State one `logicInvariant` per slide.

```bash
node "$BEAUTIFIER_SKILL/scripts/validate-element-logic.mjs" \
  --lock "$TMP_DIR/content-lock.json" \
  --logic "$TMP_DIR/element-logic-map.json"
```

Choose one primary design system according to the dominant logic, audience, density, brand fit, and exportability. Use at most one specialist visualization library for charts or node diagrams. The library supplies composition grammar, not default styling or an application shell.

Create `$TMP_DIR/design-system-decision.json`. When the intake approval mode is `recommend-and-confirm` or `preview-first`, pause and discuss one recommended direction and at most one materially different alternative before HTML authoring.

Validate both contracts before authoring:

```bash
node "$BEAUTIFIER_SKILL/scripts/validate-project-contracts.mjs" \
  --intake "$TMP_DIR/intake-contract.json" \
  --decision "$TMP_DIR/design-system-decision.json"
```

### 4. Bind the Brand and Plan

Create `$TMP_DIR/style-contract.json` from source evidence and the approved color policy using `references/source-style-modes.md`. This contract binds colors, fonts, master behavior, radius, shadows, gradients, backgrounds, and image treatment.

Write `$TMP_DIR/design-brief.txt` with the communication job, audience, visual direction, token treatment, and one row per slide: source page, narrative job, source logic, chosen component pattern, preserved assets, and intentional deviations.

### 5. Author Fixed-Stage HTML

Read `references/html-authoring.md`, `references/alignment-and-fidelity.md`, and `references/extraction-and-export.md`, then build `$TMP_DIR/deck.html`.

- Use one static `<section class="slide" data-pptx-slide>` per output page.
- Mark every exportable leaf with `data-pptx="text|shape|image|raster"`.
- Put `data-source-id` on every locked item.
- Use literal static slide content; do not generate core content from JavaScript arrays.
- Keep controls outside the slide DOM.
- Use source images when they remain appropriate. Do not fabricate logos, evidence, screenshots, or data.
- Use `data-pptx="raster"` only for the smallest unsupported region.
- Use CSS Grid/Flex and shared tokens for repeated layouts. Mark repeated groups with `data-layout-group`, `data-layout-item`, and `data-layout-check`.
- Use `data-pptx="shape-text"` for filled labels and headers that require exact internal alignment.
- Use `data-pptx-valign` or Flexbox alignment instead of guessed text offsets.

### 6. Validate Before Export

Serve `$TMP_DIR` over HTTP and run:

```bash
node "$BEAUTIFIER_SKILL/scripts/validate-content.mjs" \
  --url "$DECK_URL" \
  --lock "$TMP_DIR/content-lock.json"

node "$BEAUTIFIER_SKILL/scripts/check-html-deck.mjs" \
  --url "$DECK_URL"

node "$BEAUTIFIER_SKILL/scripts/validate-style-contract.mjs" \
  --url "$DECK_URL" \
  --contract "$TMP_DIR/style-contract.json"
```

Fix every changed locked item, non-1920x1080 stage, out-of-bounds element, clipped text box, unmarked visible asset, unintended overlap, and off-contract style.
Also fix every failed equal-edge, equal-size, equal-gap, text-anchor, and internal-centering check. Overflow-only success is not sufficient.

### 7. Export Editable PPTX

Use this skill's own DOM-to-PPTX exporter. It measures the final 1920x1080 browser DOM, reads computed styles, and creates editable Artifact Tool text, shapes, and images. It does not invoke either reference project.

```bash
node "$BEAUTIFIER_SKILL/scripts/export-html-to-pptx.mjs" \
  --url "$DECK_URL" \
  --out "$TMP_DIR/replacement.pptx" \
  --qa-dir "$TMP_DIR/html-export-qa"

node "$BEAUTIFIER_SKILL/scripts/compare-export-layout.mjs" \
  --qa-dir "$TMP_DIR/html-export-qa" \
  --tolerance 1
```

Follow `intake-contract.json`:

- For `standalone-selected`, copy the replacement deck to `$FINAL_PPTX` without merging.
- For `replace-in-copy`, merge replacement slides into the source deck copy so its master/layout hierarchy remains intact.
- For a full rebuild, export the complete authored deck.

For `replace-in-copy`:

```bash
node "$BEAUTIFIER_SKILL/scripts/merge-partial-pptx.mjs" \
  --source "$SOURCE_PPTX" \
  --replacement "$TMP_DIR/replacement.pptx" \
  --slides "$SELECTED_SLIDES" \
  --style-mode brand-rebuild \
  --out "$FINAL_PPTX" \
  --ledger "$TMP_DIR/partial-merge-ledger.json"
```

The replacement slide count must equal the selected source page count.

### 8. Final QA

Read `references/quality-gates.md`. Render and inspect every final slide. Run the presentations overflow checker. Re-import the final PPTX and inspect for missing objects, changed text, broken notes, export damage, and unexpected rasterization.

For partial work, run:

```bash
node "$BEAUTIFIER_SKILL/scripts/verify-partial-pptx.mjs" \
  --source "$SOURCE_PPTX" \
  --final "$FINAL_PPTX" \
  --slides "$SELECTED_SLIDES" \
  --out "$TMP_DIR/partial-qa"
```

Compare every selected final slide with its source, content lock, logic invariant, and HTML render. Apply `references/alignment-and-fidelity.md`: inspect HTML/PPT geometry, repeated edges and gaps, shape-text internal alignment, rendered output at full size, and critical regions at 200%. Visual differences are expected; semantic differences require explicit permission.

### 9. Deliver

Return the final PPTX copy and briefly state that:

- 同品牌重构 was applied;
- state which design system supplied composition grammar while source page logic remained unchanged;
- state the approved copy and color policies;
- state whether the output is standalone or merged, and whether unselected pages were preserved;
- any rasterized regions or approved wording changes are disclosed.

Use the presentations skill's exact output citation format.

## Failure Rules

- If the source cannot be inspected or rendered, stop and report the blocker.
- If locked content cannot fit legibly, change the layout; split or rewrite only with permission.
- If a component pattern changes the source relationship, reject that pattern.
- If HTML and PPTX renders diverge materially, simplify the DOM or rasterize only the smallest unsupported region with a recorded reason.
- If a font is unavailable, use an approved substitute and verify wrapping again.

## Attribution

The workflow was informed by the MIT-licensed `JimLiu/baoyu-design`, `zarazhangrui/frontend-slides`, and `atharva9167j/dom-to-pptx` projects. See `references/approach-notes.md`.
