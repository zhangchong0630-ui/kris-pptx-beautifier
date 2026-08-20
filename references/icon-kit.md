# Icon Kit

Icons are one of the fastest ways to make a deck look designed, but a true SVG
icon (Lucide, Material Symbols) exports as a raster image and loses
editability. This kit gives the export-safe path: **typographic glyph icons**
and **native shape marks** that stay editable.

Use these in `visual-asset-planning.md` step as the `library-match` →
`native-symbols` choice, instead of rasterizing an icon family.

## Tier 1 — Typographic Glyph Icons (editable text)

A glyph rendered as a `shape-text` or `text` leaf exports as editable text, not
an image. Use one glyph family and one treatment across the deck.

```html
<div class="icon" data-pptx="shape-text">✓</div>
```

```css
.icon { width: 72px; height: 72px; background: #e8f1fb; color: #0063b1;
  border-radius: 36px; font-size: 36px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; line-height: 1; }
```

Curated glyphs (render in Arial and the bundled Noto Sans SC):

| Glyph | Code | Meaning / role |
| --- | --- | --- |
| ✓ | `✓` | done, included, pass, check |
| ✕ | `✕` | excluded, fail, remove |
| → | `→` | direction, next, leads to |
| ● | `●` | status dot, bullet, active |
| ○ | `○` | inactive, outline state |
| ◆ | `◆` | marker, feature |
| ▲ | `▲` | up, growth, priority |
| ▼ | `▼` | down, decline |
| ■ | `■` | block, node, key item |
| ★ | `★` | highlight, rating, key |
| ↗ | `↗` | growth, external, up-right |
| · | `·` | separator, small bullet |
| ①②③④ | `①…` | numbered step badges (or use `shape-text` numerals) |
| ➜ | `➜` | call to action arrow |

## Tier 2 — Native Shape Marks (editable geometry)

Structural marks drawn from basic shapes — no glyph, fully editable geometry.

| Mark | Build | Snippet |
| --- | --- | --- |
| Status dot | ellipse | `<div data-pptx="shape" style="width:24px;height:24px;border-radius:12px;background:#1f6f78;"></div>` |
| Connector line | line | `<div data-pptx="shape" data-pptx-geometry="line" style="width:200px;height:3px;background:#d6dce2;"></div>` |
| Number badge | shape-text circle | `<div data-pptx="shape-text" style="width:64px;height:64px;border-radius:32px;background:#1f6f78;color:#fff;font-size:32px;">1</div>` |
| Progress bar | rect track + rect fill | `visual-recipes.md` §4 horizontal bar |
| Ring segment | ellipse + ellipse hole | `visual-recipes.md` §4 donut/ring |
| Accent rule | thin rect | `<div data-pptx="shape" style="width:120px;height:8px;background:#e4572e;"></div>` |

## Treatment Rules

One icon contract for the whole deck, recorded in `visual-asset-plan.json`:

- **One family**: all glyph icons (✓→●…) or all shape marks, not a mix.
- **One size range**: e.g. 36px glyphs in 72px circles; do not mix 24px and 48px.
- **One weight**: outline glyphs stay outline (○ ◆), filled stay filled (● ▲).
- **One color policy**: all icons in the accent, or all in a neutral; never
  per-icon colors.
- **One placement**: icon above the label, or left of it — pick one and keep it.

## When to Rasterize

Rasterize only when a real multi-color pictogram is required and cannot be
expressed as a glyph or shape (e.g. a brand logo, a detailed product icon).
Put it under `data-pptx="raster"` on the smallest region, record it in the
export ledger, and disclose it — the same rule as any other rasterized region.

## Wiring

In the visual-asset gate, offer the icon choices as:

- `preserve-only` — keep source icons;
- `native-symbols` — use this kit (glyph or shape marks) for new icons;
- `library-match` — a real icon family only when the user accepts rasterized
  icons (disclose);
- `none` — hierarchy and spacing carry the page instead.
