---
name: kris-pptx-beautifier
description: >-
  Rebuild an existing PowerPoint deck within its original brand through an HTML-first workflow:
  establish color, copy, output, and visual-direction choices with the user; inspect and decompose
  the source PPTX; lock business content and map each page's element logic; select a suitable
  frontend design system; separately plan icons and images with AI recommendations and user
  approval; rebuild selected or all slides as fixed 1920x1080 HTML; export editable PowerPoint
  objects with strict alignment fidelity; optionally use OfficeCLI for native object inspection
  and secondary QA; and verify the final PPTX visually. Use for
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
- Analyze icon needs and image needs separately for every selected slide, including a justified recommendation to use none.
- Do not add, replace, search for, or generate visual assets before the user approves the visual-asset plan.
- Never use image generation to create logos, evidence, screenshots, charts, data, or interface icons.
- Use a 12-column grid and 8px spacing system unless the source template provides a stronger grid.
- Never hand-center text over a separate shape when a single editable shape-with-text can preserve alignment.
- Render and inspect every final slide before delivery.
- Treat OfficeCLI as an optional secondary native-PPTX inspection and QA layer. It must not
  replace the HTML-first design route or override the content lock and logic map.
- Never run a full OfficeCLI round-trip rewrite after HTML export. Use native OfficeCLI edits
  only for a small, user-approved repair, and rerun the complete QA afterward.

## Environment Prerequisites

Required to run this skill's scripts:

- Node.js ≥ 18.
- `playwright`, `@oai/artifact-tool`, `jszip`, and `pngjs` resolvable by
  `scripts/runtime.mjs`.
- A Chrome/Edge browser, or `PPTX_BEAUTIFIER_BROWSER` pointing to one, or
  Playwright's bundled Chromium (`npx playwright install chromium`).

`scripts/runtime.mjs` resolves runtime packages in this order: a local
`node_modules` next to the scripts, then `$PPTX_BEAUTIFIER_NODE_MODULES`, then
`$CODEX_RUNTIME_NODE_MODULES`, then
`~/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`.
To run outside a Codex runtime, install the dependencies once:

```bash
npm init -y
npm install playwright @oai/artifact-tool jszip pngjs
npx playwright install chromium
```

## Required Companion Skill

The `presentations` skill is RECOMMENDED for its Artifact Tool workspace setup, QA, and
delivery rules, but is NOT required to run this skill's scripts. If it is unavailable,
skip its initialization and its `mark_artifact_operation_started.mjs` step; the scripts
below resolve their own dependencies and continue. If `@oai/artifact-tool` itself cannot
be loaded, stop and report the blocker.

If the approved visual-asset plan includes AI-generated images, load the installed `imagegen` skill before creating those assets. Never invoke image generation before the user approves both the image strategy and its intended slide roles.

OfficeCLI is optional. When the `officecli` binary is available, read
`references/officecli-integration.md` and use `scripts/officecli-bridge.mjs` for secondary
source/final inspection. Do not install or copy OfficeCLI source or its skill into this skill.
If the binary is unavailable, continue with the existing Artifact Tool workflow.

## Workspace

Define:

```bash
BEAUTIFIER_SKILL=<absolute path to this skill>
PRESENTATIONS_SKILL=<absolute path to the active presentations skill, if installed>
TMP_DIR=<absolute task directory>
SOURCE_PPTX=<absolute source path>
FINAL_PPTX=<absolute output copy path>
SELECTED_SLIDES=<1-based list such as 3,5-7; use all pages for a full rebuild>
STYLE_MODE=brand-rebuild
OFFICECLI_BIN=<optional absolute path to officecli, or leave unset>
DECK_URL=http://127.0.0.1:8123/deck.html
```

Copy `assets/deck-template.html` to `$TMP_DIR/deck.html`. Keep intermediate inspection, HTML, ledgers, previews, and QA under `$TMP_DIR`; write only the final PPTX to `$FINAL_PPTX`.

If the `presentations` skill is installed, follow its Artifact Tool workspace
initialization (`load_workspace_dependencies`, `RUNTIME_*` variables, and
`mark_artifact_operation_started.mjs` before the first create/edit). Otherwise skip it —
`scripts/runtime.mjs` resolves the runtime packages itself.

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

If OfficeCLI is installed, run its optional inspection bridge after the Artifact Tool
inspection. Use its outline, stable IDs, text, stats, issues, and HTML output as secondary
object-level evidence; the rendered source slides and the extracted inspection bundle remain
the visual and content authority.

```bash
node "$BEAUTIFIER_SKILL/scripts/officecli-bridge.mjs" \
  --mode inspect \
  --pptx "$SOURCE_PPTX" \
  --out "$TMP_DIR/officecli/source"
```

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

### 4. Run the Visual Asset Gate

Read `references/visual-asset-planning.md`. After the content lock, element-logic map, and design-system recommendation are complete, analyze both visual dimensions for every selected slide:

- icon strategy: preserve, use no icon, use simple native symbols, or semantically match one consistent icon library;
- image strategy: preserve source imagery, use no image, use verified external assets, or generate supporting imagery with AI.

Present one recommended option and at most one materially different alternative for each dimension. Explain what communication problem each asset would solve, which slides would use it, and the cost to brand fidelity, editability, and runtime. Treat `no icon` and `no image` as valid recommendations. Pause for explicit user selection; do not bundle the icon and image choices into one answer.

Save the approved result as `$TMP_DIR/visual-asset-plan.json`. When AI image generation is approved, generate candidates only after plan approval, present the candidates for user review, and record the selected local asset plus `candidateApprovalStatus: approved` before slide authoring. Do not generate icons with an image model.

Validate the completed gate:

```bash
node "$BEAUTIFIER_SKILL/scripts/validate-project-contracts.mjs" \
  --intake "$TMP_DIR/intake-contract.json" \
  --decision "$TMP_DIR/design-system-decision.json" \
  --assets "$TMP_DIR/visual-asset-plan.json"
```

### 5. Bind the Brand and Plan

Create `$TMP_DIR/style-contract.json` from source evidence and the approved color policy using `references/source-style-modes.md`. This contract binds colors, fonts, master behavior, radius, shadows, gradients, backgrounds, icon treatment, and image treatment.

Write `$TMP_DIR/design-brief.txt` with the communication job, audience, visual direction, token treatment, and one row per slide: source page, narrative job, source logic, chosen component pattern, approved icon action, approved image action, preserved assets, and intentional deviations.

### 6. Author Fixed-Stage HTML

Read `references/html-authoring.md`, `references/alignment-and-fidelity.md`, and `references/extraction-and-export.md`, then build `$TMP_DIR/deck.html`.

- Use one static `<section class="slide" data-pptx-slide>` per output page.
- Mark every exportable leaf with `data-pptx="text|shape|image|raster"`.
- Put `data-source-id` on every locked item.
- Use literal static slide content; do not generate core content from JavaScript arrays.
- Keep controls outside the slide DOM.
- Use source images when they remain appropriate. Do not fabricate logos, evidence, screenshots, or data.
- Follow `visual-asset-plan.json` exactly. Add `data-asset-id` to every approved non-source icon or image and keep the selected asset local to `$TMP_DIR`.
- Use one icon family across the rebuilt pages unless the source itself contains protected icon families. Do not add icons merely to fill space.
- Use `data-pptx="raster"` only for the smallest unsupported region.
- Use CSS Grid/Flex and shared tokens for repeated layouts. Mark repeated groups with `data-layout-group`, `data-layout-item`, and `data-layout-check`.
- Use `data-pptx="shape-text"` for filled labels and headers that require exact internal alignment.
- Use `data-pptx-valign` or Flexbox alignment instead of guessed text offsets.

### 7. Validate Before Export

Serve `$TMP_DIR` over HTTP (do NOT use `file://`; the scripts rely on
`document.fonts.ready` and network requests):

```bash
python3 -m http.server 8123 -d "$TMP_DIR" &
```

Then run:

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

### 8. Export Editable PPTX

Use this skill's own DOM-to-PPTX exporter. It measures the final 1920x1080 browser DOM, reads computed styles, and creates editable Artifact Tool text, shapes, and images. It does not invoke either reference project.

The exporter defaults to 1280x720 (the standard 16:9 PPTX EMU size at 96 dpi). For
`replace-in-copy` merges the replacement EMU size MUST equal the source page EMU
size, so read the source size from `$TMP_DIR/source-inspection/source-summary.json`
(`widthEmu`/`heightEmu`) and pass it explicitly:

```bash
node "$BEAUTIFIER_SKILL/scripts/export-html-to-pptx.mjs" \
  --url "$DECK_URL" \
  --out "$TMP_DIR/replacement.pptx" \
  --qa-dir "$TMP_DIR/html-export-qa" \
  --pptx-width <source width in px> \
  --pptx-height <source height in px>

node "$BEAUTIFIER_SKILL/scripts/compare-export-layout.mjs" \
  --qa-dir "$TMP_DIR/html-export-qa" \
  --tolerance 1
```

(EMU = px * 9525; 1280x720 px = 12192000x6858000 EMU.)

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

### 9. Final QA

Read `references/quality-gates.md`. Render and inspect every final slide. Run the presentations overflow checker. Re-import the final PPTX and inspect for missing objects, changed text, broken notes, export damage, and unexpected rasterization.

For partial work, run:

```bash
node "$BEAUTIFIER_SKILL/scripts/verify-partial-pptx.mjs" \
  --source "$SOURCE_PPTX" \
  --final "$FINAL_PPTX" \
  --slides "$SELECTED_SLIDES" \
  --out "$TMP_DIR/partial-qa"
```

When OfficeCLI is available, run the optional native QA bridge and inspect its `validate`,
`issues`, `stats`, and HTML outputs. If it reports a real issue, either fix it through the
existing export workflow or record a small, explicitly approved native repair and rerun all
final QA. Never silently discard a failed OfficeCLI check.

```bash
node "$BEAUTIFIER_SKILL/scripts/officecli-bridge.mjs" \
  --mode qa \
  --pptx "$FINAL_PPTX" \
  --out "$TMP_DIR/officecli/final"
```

Compare every selected final slide with its source, content lock, logic invariant, and HTML render. Apply `references/alignment-and-fidelity.md`: inspect HTML/PPT geometry, repeated edges and gaps, shape-text internal alignment, rendered output at full size, and critical regions at 200%. Visual differences are expected; semantic differences require explicit permission.

### 10. Deliver

Return the final PPTX copy and briefly state that:

- 同品牌重构 was applied;
- state which design system supplied composition grammar while source page logic remained unchanged;
- state the approved copy and color policies;
- state the approved icon and image strategies, including which slides received new assets;
- state whether the output is standalone or merged, and whether unselected pages were preserved;
- any generated images, external assets, rasterized regions, or approved wording changes are disclosed.

Use the presentations skill's exact output citation format.

## Failure Rules

- If the source cannot be inspected or rendered, stop and report the blocker.
- If locked content cannot fit legibly, change the layout; split or rewrite only with permission.
- If a component pattern changes the source relationship, reject that pattern.
- If the visual-asset plan is not approved, stop before asset acquisition, image generation, or HTML authoring.
- If a proposed icon or image has no clear semantic or communicative role, omit it.
- If generated-image candidates are not approved, keep the source image or use no image; never silently select a candidate.
- If HTML and PPTX renders diverge materially, simplify the DOM or rasterize only the smallest unsupported region with a recorded reason.
- If a font is unavailable, use an approved substitute and verify wrapping again.
- If the optional OfficeCLI bridge is unavailable, disclose that it was skipped; this is not
  a workflow failure.
- If OfficeCLI reports a failure, investigate and disclose it. Do not use a full native rewrite
  to hide an HTML/export discrepancy.

## Attribution

The workflow was informed by the MIT-licensed `JimLiu/baoyu-design`, `zarazhangrui/frontend-slides`, and `atharva9167j/dom-to-pptx` projects. See `references/approach-notes.md`.
The optional native inspection layer was informed by the Apache-2.0-licensed
`iOfficeAI/OfficeCLI` project. No OfficeCLI source code, runtime package, or skill is copied
into or installed by this workflow. See `references/approach-notes.md` and
`references/officecli-integration.md`.
