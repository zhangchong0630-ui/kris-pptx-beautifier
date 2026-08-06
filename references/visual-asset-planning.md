# Visual Asset Planning

## Purpose

Decide icons and images as two independent dimensions after source inspection and before HTML authoring. AI analyzes the communication need, recommends a restrained plan, and pauses for explicit user selection. A slide may need an icon but no image, an image but no icon, both, or neither.

## Decision Sequence

1. Read the content lock, element-logic map, source renders, design-system decision, and protected-assets list.
2. For every selected slide, identify the communication job and whether an icon or image materially improves comprehension, hierarchy, evidence, or emotional tone.
3. Present one recommended option and at most one materially different alternative for icons.
4. Present one recommended option and at most one materially different alternative for images.
5. Explain affected slides, semantic purpose, brand fit, editability, provenance, and expected runtime.
6. Pause for the user's two selections. Do not infer approval from silence and do not combine both dimensions into one bundled choice.
7. Record the approved plan before acquiring assets or authoring slides.
8. If AI image generation is approved, generate candidates and pause again for candidate selection. Record the selected file before authoring.

Always consider and explicitly state when `none` is the strongest recommendation. More visual assets do not automatically improve a slide.

## Icon Dimension

Offer the most relevant options from:

- `preserve-only`: retain source icons; do not introduce new icon semantics.
- `library-match`: map semantic roles to one approved icon family. Prefer the source family when identifiable; otherwise choose one consistent library such as Lucide, Material Symbols, or Phosphor according to brand geometry and exportability.
- `native-symbols`: use simple editable PowerPoint shapes, numerals, or typographic symbols when they communicate better than a library icon.
- `none`: use hierarchy, typography, spacing, or color instead of icons.

Rules:

- Never generate icons with an image model.
- Never mix icon families merely because individual icons look attractive.
- Match icons to semantic roles from the element-logic map, not to nearby keywords alone.
- Do not add icons to evidence, compliance text, financial data, or screenshots unless the source already establishes that visual language.
- Keep one treatment contract: outline or filled, size range, stroke weight, corner character, and color policy.
- Use local assets with known provenance; do not hotlink remote icons in the final HTML.
- Prefer native symbols for simple checks, steps, arrows, and status marks when editability matters. Otherwise export the icon as a movable image object and disclose that its internal paths are not editable.

## Image Dimension

Offer the most relevant options from:

- `source-only`: preserve authentic source screenshots, photographs, diagrams, and product images.
- `verified-library`: use approved company assets or externally verified stock/editorial assets with recorded provenance.
- `ai-generate`: create supporting illustration or atmospheric imagery after explicit approval.
- `mixed-approved`: use a page-specific combination of preserved, verified, and generated assets.
- `none`: rely on native layout, typography, shapes, tables, or charts.

Rules:

- Never generate or fabricate logos, product UI, screenshots, customer evidence, charts, measurements, compliance artifacts, or factual diagrams.
- Use AI generation only for illustrative, conceptual, decorative, or mood-setting roles where factual fidelity is not implied.
- When available, provide the source slide render, protected brand assets, palette, and composition brief as multimodal references to the image-generation tool.
- Define subject, function, composition, crop, aspect ratio, palette, lighting, realism, and forbidden content before generation.
- Generate the smallest useful candidate set. Present labeled previews and require user selection.
- Store selected images locally under `$TMP_DIR`; record the generation method, prompt direction, and selected file.
- Treat every generated image as a PowerPoint image object: movable and resizable, but not internally editable.

## Recommendation Format

Use this compact structure before asking for approval:

```text
Icon recommendation
- Recommended: library-match / Lucide outline
- Why: pages 4 and 6 contain parallel capability groups that benefit from faster scanning
- Scope: add four semantic icons; no icons on data or evidence pages
- Alternative: none; use numbered headings only

Image recommendation
- Recommended: source-only
- Why: the deck contains authentic product screenshots and no narrative page needs illustrative imagery
- Scope: preserve pages 3 and 7; crop only
- Alternative: ai-generate; one conceptual cover image, approximately 3-5 additional minutes plus approval
```

The user may choose the recommendation, the alternative, or a custom combination. Record the exact choice.

## Required Contract

Save `$TMP_DIR/visual-asset-plan.json`:

```json
{
  "version": 1,
  "approvalStatus": "approved",
  "iconDecision": {
    "mode": "library-match",
    "library": "lucide",
    "reason": "Parallel service capabilities need consistent semantic anchors for faster scanning.",
    "userChoice": "recommended",
    "treatment": {
      "style": "outline",
      "sizeRangePx": [32, 40],
      "colorPolicy": "brand-accent"
    }
  },
  "imageDecision": {
    "mode": "source-only",
    "reason": "Authentic source screenshots already provide the required visual evidence.",
    "userChoice": "recommended",
    "generationAllowed": false,
    "candidateApprovalStatus": "not-required"
  },
  "slides": [
    {
      "sourceSlide": 4,
      "icon": {
        "action": "add",
        "semanticRole": "security",
        "asset": "shield-check",
        "reason": "Distinguishes the security capability from adjacent service capabilities."
      },
      "image": {
        "action": "none",
        "reason": "The page is a compact capability comparison and gains no clarity from imagery."
      }
    }
  ]
}
```

For an approved generated image, use `image.action: "generate"` and add:

```json
{
  "purpose": "Conceptual cover image showing secure enterprise messaging",
  "selectedAsset": "/absolute/task/path/assets/cover-generated.png",
  "candidateApprovalStatus": "approved",
  "reason": "The cover needs one non-factual visual anchor while preserving the brand palette."
}
```

For verified external assets, use `image.action: "search"` or `"replace"` and record `selectedAsset`, `sourceUrl`, and `licenseOrPermission`.

## Approval Boundary

Do not proceed to HTML authoring until:

- `approvalStatus` is `approved`;
- both decisions include a specific reason and user choice;
- every selected slide has an icon action and image action;
- generated-image candidates have explicit approval and a selected local file;
- external assets have provenance and permission recorded.
