# Visual Recipes

Copy-paste composition recipes for the fixed 1920x1080 stage. Every recipe is
marked **export-safe** (translates to editable PowerPoint text, shapes, and
images) or **raster-only** (must be isolated under `data-pptx="raster"` and
disclosed). Prefer export-safe recipes whenever the same communication job can
be met without rasterizing.

The exporter's native vocabulary is deliberately small. It reads computed DOM
layout and supports:

- solid fills and a simple **linear-gradient** (2+ stops, `deg` angle, hex or
  `rgb(a)` colors, optional `%` offsets);
- solid borders (one uniform color/width for all four sides);
- rounded corners (radius < half the smaller side → `roundRect`; radius ≥ half
  → `ellipse`);
- simple shadows tokenized by **blur radius only** into `shadow-sm` (≤4px),
  `shadow-md` (≤12px), `shadow-lg` (>12px) — the shadow color and offset are
  not preserved, so use a neutral shadow and control only the blur;
- opacity;
- font family/size/weight/italic/underline/links/alignment/line-height;
- `object-fit` on images.

Everything else — radial gradients, `backdrop-filter`, text gradients,
`clip-path`, `mask`, blend modes, `transform`, pseudo-elements, nested
backgrounds, complex SVG/canvas — is **raster-only**.

## 1. Token Baseline

Define every visual decision as a CSS custom property so repeated elements stay
identical and the whole deck re-themes from one place. The starter template in
`assets/deck-template.html` already declares this scale; extend it per brand,
never per slide.

```css
:root {
  /* color — extend from style-contract.json allowedColors */
  --ink: #17212b;        --muted: #586574;      --paper: #f7f8fa;
  --accent: #e4572e;     --accent-soft: #fbe7df; --support: #1f6f78;
  --support-soft: #e3f0f1; --line: #d6dce2;
  /* spacing — 8px base */
  --space-1: 8px; --space-2: 16px; --space-3: 24px; --space-4: 32px;
  --space-6: 48px; --space-8: 64px;
  /* radius */
  --radius-sm: 6px; --radius-md: 12px; --radius-lg: 20px; --radius-pill: 999px;
  /* shadow — keep neutral, control blur only */
  --shadow-sm: 0 2px 4px rgba(0,0,0,.08);
  --shadow-md: 0 8px 16px rgba(0,0,0,.10);
  --shadow-lg: 0 16px 32px rgba(0,0,0,.14);
  /* type */
  --font-sans: Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
  --fs-cover: 120px; --fs-title: 80px; --fs-subhead: 44px;
  --fs-body: 32px; --fs-note: 24px; --fs-metric: 112px;
}
```

## 2. Surfaces

### Brand gradient hero (export-safe)

One accent-tinted gradient panel for cover and section dividers. Two stops is
enough; keep the two colors close in hue so the ramp stays subtle.

```html
<div class="hero" data-pptx="shape"></div>
```

```css
.hero {
  position: absolute; left: 0; top: 0; width: 1920px; height: 1080px;
  background: linear-gradient(135deg, #1f6f78 0%, #123a3e 100%);
}
```

> Use `135deg` for an editorial diagonal. The exporter normalizes the computed
> gradient, so hex or `rgb()` stops both work; do not use named colors.

### Tinted panel (export-safe)

A neutral fill plus a left accent bar reads as "grouped" without a heavy box.

```html
<div class="panel" data-pptx="shape"></div>
<div class="panel-accent" data-pptx="shape"></div>
```

```css
.panel {
  position: absolute; left: 108px; top: 0; width: 1704px; height: 640px;
  background: #ffffff; border: 1px solid #d6dce2; border-radius: 16px;
}
.panel-accent {
  position: absolute; left: 108px; top: 0; width: 12px; height: 640px;
  background: #e4572e; border-radius: 6px 0 0 6px;
}
```

### Section divider rule (export-safe)

A thin accent line carries hierarchy with almost no visual weight.

```css
.rule { position: absolute; width: 1035px; height: 6px; background: #e4572e; }
```

## 3. Components

### KPI card (export-safe)

Number, unit, and label as three leaves inside one card surface. Use
`shape-text` only for the centered filled strip, not for the whole card.

```html
<div class="card" data-pptx="shape"></div>
<p class="metric" data-pptx="text" data-source-id="kpi1-value">42%</p>
<p class="metric-label" data-pptx="text" data-source-id="kpi1-label">转化率提升</p>
```

```css
.card {
  position: absolute; width: 522px; height: 330px;
  background: #ffffff; border: 1px solid #d6dce2; border-radius: 16px;
  box-shadow: 0 8px 16px rgba(0,0,0,.10);
}
.metric { position: absolute; left: 40px; top: 96px; width: 442px; height: 110px;
  font-size: 112px; font-weight: 700; line-height: 1; color: #17212b; }
.metric-label { position: absolute; left: 40px; top: 224px; width: 442px; height: 40px;
  font-size: 30px; line-height: 40px; color: #586574; }
```

### Comparison matrix (export-safe)

Use CSS Grid for the cells so shared tokens produce equal widths and gaps.
Mark the group for the layout validator.

```html
<div class="compare" data-layout-group data-layout-check="equal-gap,equal-width">
  <div class="compare-cell" data-layout-item data-pptx="shape"></div>
  <div class="compare-cell" data-layout-item data-pptx="shape"></div>
  <div class="compare-cell" data-layout-item data-pptx="shape"></div>
</div>
```

```css
.compare { position: absolute; left: 108px; top: 300px; width: 1704px;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.compare-cell { height: 560px; background: #ffffff;
  border: 1px solid #d6dce2; border-radius: 16px; }
```

### Timeline (export-safe)

A horizontal line plus native `shape-text` milestone dots and labels. The dots
are filled circles (`border-radius` ≥ half → ellipse) so they stay editable.

```html
<div class="tl-line" data-pptx="shape"></div>
<div class="tl-dot" data-pptx="shape"></div>
<p class="tl-label" data-pptx="shape-text">阶段一</p>
```

```css
.tl-line { position: absolute; left: 240px; top: 520px; width: 1440px; height: 4px; background: #d6dce2; }
.tl-dot { position: absolute; left: 240px; top: 500px; width: 44px; height: 44px;
  background: #e4572e; border-radius: 22px; }
.tl-label { position: absolute; left: 190px; top: 560px; width: 144px; height: 48px;
  background: #fbe7df; color: #e4572e; border-radius: 999px; font-size: 28px;
  display: flex; align-items: center; justify-content: center; text-align: center;
  line-height: 1; padding: 0; }
```

### Architecture swimlane (export-safe)

Draw lanes as rounded panels and connections as thin `line` shapes. Use a
`data-pptx-geometry="line"` div with a small height for connectors.

```html
<div class="lane" data-pptx="shape"></div>
<div class="connector" data-pptx="shape" data-pptx-geometry="line"></div>
```

```css
.lane { position: absolute; width: 620px; height: 480px;
  background: #e3f0f1; border-radius: 16px; }
.connector { position: absolute; width: 240px; height: 3px; background: #586574; }
```

### Callout / quote (export-safe)

A large statement plus a left rule is more editorial than a heavy box.

```html
<div class="quote-rule" data-pptx="shape"></div>
<p class="quote" data-pptx="text" data-source-id="q1">一句话结论</p>
```

```css
.quote-rule { position: absolute; left: 108px; top: 0; width: 10px; height: 320px; background: #e4572e; }
.quote { position: absolute; left: 158px; top: 24px; width: 1400px; height: 280px;
  font-size: 56px; line-height: 1.5; font-weight: 700; color: #17212b; }
```

## 4. Native Charts (export-safe)

For values whose exact rendering matters less than editability, build the chart
from native shapes and text. When a chart must be pixel-perfect or uses
SVG/canvas, use ECharts and rasterize only the chart region.

### Horizontal bar

```html
<div class="bar-track" data-pptx="shape"></div>
<div class="bar-fill" data-pptx="shape"></div>
<p class="bar-value" data-pptx="text" data-source-id="bar1">68%</p>
```

```css
.bar-track { position: absolute; width: 1200px; height: 40px; background: #e3f0f1; border-radius: 20px; }
.bar-fill { position: absolute; width: 816px; height: 40px; background: #1f6f78; border-radius: 20px; }
.bar-value { position: absolute; width: 200px; height: 40px; font-size: 30px; font-weight: 700; color: #17212b; }
```

### Donut / ring

A ring with a centered `shape-text` number. The inner white circle is a
`ellipse` over the accent ring.

```html
<div class="ring" data-pptx="shape"></div>
<div class="ring-hole" data-pptx="shape"></div>
<p class="ring-value" data-pptx="shape-text">42%</p>
```

```css
.ring { position: absolute; width: 320px; height: 320px; background: #e4572e; border-radius: 160px; }
.ring-hole { position: absolute; left: 40px; top: 40px; width: 240px; height: 240px; background: #ffffff; border-radius: 120px; }
.ring-value { position: absolute; width: 240px; height: 240px; font-size: 64px; font-weight: 700;
  color: #17212b; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 1; }
```

### Progress steps

Numbered `shape-text` pills plus a connecting line.

```html
<div class="step-pill" data-pptx="shape-text">1</div>
<div class="step-line" data-pptx="shape" data-pptx-geometry="line"></div>
```

```css
.step-pill { position: absolute; width: 64px; height: 64px; background: #1f6f78; color: #ffffff;
  border-radius: 32px; font-size: 32px; font-weight: 700; line-height: 1;
  display: flex; align-items: center; justify-content: center; text-align: center; }
.step-line { position: absolute; width: 240px; height: 3px; background: #1f6f78; }
```

## 5. Image Treatment (export-safe)

Images export as movable PowerPoint pictures; crop and frame them with CSS.

```html
<img class="shot" data-pptx="image" src="assets/shot.png" alt="产品截图">
```

```css
.shot { position: absolute; width: 960px; height: 540px; object-fit: cover;
  border-radius: 16px; border: 1px solid #d6dce2; }
```

For a caption-safe overlay, put a semi-transparent native shape over the image
instead of using `backdrop-filter`:

```html
<div class="shot-scrim" data-pptx="shape"></div>
```

```css
.shot-scrim { position: absolute; width: 960px; height: 160px; background: rgba(23,33,43,.55); }
```

## 6. Raster-Only Effects

Use these sparingly and only under `data-pptx="raster"` on the smallest parent.
Every one of them costs editability and must appear in the export ledger and
the final disclosure:

- radial / conic gradients and gradients with named colors;
- `backdrop-filter` (glassmorphism) and `filter: blur()`;
- text gradients (`background-clip: text`) and `-webkit-text-stroke`;
- `clip-path` and `mask`;
- `mix-blend-mode` and complex composite shadows;
- `transform: rotate/scale/perspective` (the exporter does not read transforms);
- pseudo-element content (`::before` / `::after`) and nested background images.

A common mistake is adding glassmorphism to a header strip and losing the whole
strip to raster. Instead use a solid or simple linear-gradient fill, which is
visually close and stays editable.
