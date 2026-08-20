# Same-Brand Rebuild

This skill currently supports one source-style mode: `brand-rebuild` / 同品牌重构.

## Boundary

- Preserve brand colors, fonts, logo treatment, master furniture, business content, factual meaning, slide count, and slide order.
- Rebuild slide-local composition only after the source element logic is mapped.
- Preserve hierarchy, sequence, parallel groups, comparisons, cycles, cause-and-effect links, and evidence relationships.
- A component pattern may clarify an existing relationship; it may not invent a new relationship.
- Do not add navigation, sidebars, breadcrumbs, tabs, page-number rails, app chrome, or section shells unless equivalent furniture exists in the source.
- Do not turn every paragraph into a card. Component grammar is a layout aid, not a visual skin.

## Style Contract

Apply the approved `colorPolicy` from `intake-contract.json`:

- `source-strict`: use only evidenced source colors.
- `brand-refine`: preserve primary brand colors; allow derived neutral and tint
  steps for contrast and hierarchy.
- `new-palette`: require explicit approval and record old-to-new token mapping.

Create `style-contract.json` from inspected source evidence:

```json
{
  "version": 1,
  "mode": "brand-rebuild",
  "colorPolicy": "brand-refine",
  "sourcePptx": "/absolute/path/source.pptx",
  "selectedSlides": [2, 4, 5, 6],
  "allowedColors": ["#17212b", "#ffffff", "#1f6f78", "#e4572e"],
  "allowedFonts": ["Arial", "PingFang SC"],
  "maxBorderRadiusPx": 8,
  "allowShadows": false,
  "allowGradients": false,
  "preserveMaster": true,
  "preserveSourceBackground": false,
  "exceptions": []
}
```

Derive every value from the source PPTX, a supplied brand guide, or explicit user instruction. Keep exceptions specific and auditable. Preserve the source background when it is part of the brand system; otherwise a brand-compatible background may be rebuilt.

## Font Strategy

During intake, confirm where the rebuilt deck will be opened, and choose a CJK-capable
font stack accordingly. The exporter resolves CJK text to the first CJK-capable font in the
stack (see `pickTypeface` in `scripts/export-html-to-pptx.mjs`); a stack whose first font is
Latin-only (e.g. `Arial`) will render CJK correctly in the browser but export the wrong
typeface unless a CJK font is also listed.

| Delivery target | Recommended font stack |
|---|---|
| macOS only | `"PingFang SC", "Arial"` |
| Windows only | `"Microsoft YaHei", "Arial"` |
| Cross-platform | `"Source Han Sans SC", "Noto Sans SC", "Arial"` |

Prefer an open, redistributable font (Source Han Sans / Noto Sans SC) for cross-platform
delivery so the typeface survives on machines that lack the OS-specific font.

For Chinese decks, apply the type scale, line-height, punctuation, and CJK–Latin
spacing rules in `references/cjk-typography.md` alongside this font strategy.

## Allowed

- New composition within the same slide.
- Lists or tables reorganized into a clearer rendering of the same relationship.
- Chart-type changes when values, labels, and meaning remain exact.
- Verified image replacement when evidence is not altered.
- New slide-local shapes using approved source tokens.

## Disallowed

- Changing claims, data, reading logic, or relationship type.
- Replacing a cycle with a linear sequence, a hierarchy with independent cards, or evidence with decoration.
- Importing another brand aesthetic or mixing multiple frontend design systems.
- Adding page furniture that the source did not contain.
- Changing logo treatment, brand fonts, or brand colors without approval.
