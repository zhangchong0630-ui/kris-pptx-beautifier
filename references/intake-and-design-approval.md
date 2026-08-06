# Intake and Design Approval

## Purpose

Do not begin slide authoring until the user has set the project boundary. Ask in
short rounds so the user is not forced through a long questionnaire.

## Round 1: Required Before Inspection

Ask these questions in one compact message. Offer the recommended option first,
but allow the user to answer `AI decide` for any item.

1. **Output scope and delivery**
   - Selected pages as a standalone PPTX.
   - Replace selected pages in a copy of the source deck.
   - Rebuild the complete deck.
   - Confirm the 1-based page numbers.
2. **Color policy**
   - `source-strict`: keep source colors exactly; improve hierarchy and usage only.
   - `brand-refine` (recommended): keep the main brand colors while correcting
     contrast, neutral colors, tint steps, and excessive saturation.
   - `new-palette`: propose a new palette after source analysis; requires approval.
3. **Copy policy**
   - `locked`: preserve every visible word, number, punctuation mark, and order.
   - `light-edit` (recommended): improve titles, parallel wording, punctuation,
     and repetition without changing facts or claims.
   - `rewrite`: condense and restructure copy; show a change ledger for approval.
4. **Visual direction**
   - `brand-polish`: restrained corporate finish; clearer hierarchy, disciplined
     spacing, and refined typography. Example: bank proposal or executive report.
   - `data-rational`: data-first, compact, and analytical. Example: operating
     report, comparison matrix, KPI review, or technical assessment.
   - `modern-tech`: higher contrast and stronger technical atmosphere. Example:
     architecture, platform capability, monitoring, or digital transformation.
   - `minimal-editorial`: fewer containers, more whitespace, stronger statements
     and imagery. Example: strategy narrative, keynote, or product proposition.
   - `AI recommend after inspection` (recommended when the source is mixed).
5. **Design approval mode**
   - `recommend-and-confirm` (recommended): inspect first, then pause with one
     recommended system and one materially different alternative.
   - `AI-direct`: record the decision and continue without another approval.
   - `preview-first`: prepare one representative HTML page for approval before
     authoring the remaining pages.

Ask only when not already known:

- Audience and presentation setting: executive review, customer proposal,
  internal report, training, roadshow, or large-screen display.
- Assets that must remain untouched: logo, screenshots, charts, photographs,
  compliance text, footnotes, page furniture, or speaker notes.
- Editability requirement: fully editable by default; disclose every rasterized
  chart or complex region.

If the user explicitly says to use defaults, use:

```json
{
  "outputMode": "standalone-selected",
  "colorPolicy": "brand-refine",
  "copyPolicy": "locked",
  "visualDirection": "AI-recommend",
  "approvalMode": "recommend-and-confirm",
  "editability": "editable-first"
}
```

Store the resolved answers in `$TMP_DIR/intake-contract.json`. Do not silently
infer a different output mode, copy policy, or color policy later.

## Round 2: Design Decision After Inspection

After the content lock and element-logic map are complete, present a concise
decision summary before HTML authoring when approval mode is not `AI-direct`:

- Source page logic and communication job.
- Recommended primary design system and why it fits.
- Optional specialist library for charts or node diagrams.
- Component pattern per slide.
- Expected visual intensity and density.
- Intentional departures from the source.
- Export or editability risks.

Offer only one recommended direction and at most one meaningfully different
alternative. Do not offer several cosmetic variants of the same card layout.
Save the result in `$TMP_DIR/design-system-decision.json`.

## Round 3: Visual Asset Decision

Read `visual-asset-planning.md` after the design-system recommendation. AI must
analyze icon and image needs separately, present one recommendation and at most
one meaningful alternative for each dimension, and pause for explicit user
selection. If AI image generation is approved, pause again after candidate
generation so the user can select the final image. Save the approved result in
`$TMP_DIR/visual-asset-plan.json`. HTML authoring cannot begin while this gate is
pending.

## Required Decision Record

```json
{
  "version": 1,
  "primarySystem": "carbon",
  "specialistLibraries": ["echarts"],
  "reason": "Dense technical and quantitative content needs a strict grid and restrained visual hierarchy.",
  "approvalMode": "recommend-and-confirm",
  "approvalStatus": "approved",
  "slides": [
    {
      "sourceSlide": 4,
      "logic": "comparison",
      "pattern": "comparison matrix",
      "referenceComponents": ["structured grid", "data table"],
      "density": "medium"
    }
  ]
}
```

The design system supplies composition grammar and tokens. It never overrides
the source logic, authentic assets, brand contract, or presentation readability.
