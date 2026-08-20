# Visual Quality Examples

A concrete good/bad baseline for slide composition. Before delivering, check
each rebuilt slide against these patterns. The fixes are composition rules, not
a second style library: they apply on top of whatever design system
`design-system-decision.json` selected.

## 1. Overfilled slide → breathing room

- **Bad**: 14 text blocks, 3 tables, and 6 cards on one slide; every margin
  reduced to fit; body copy below 30px.
- **Why bad**: unreadable from presentation distance; no single point of focus.
- **Fix**: one message per slide. Prefer one statement-led composition; move
  supporting detail to a smaller caption or the speaker notes. Use the 8px
  spacing scale and keep consistent page margins (e.g. `--page-x: 108px`).

## 2. Card farm → grouped hierarchy

- **Bad**: every paragraph wrapped in its own bordered box, producing a wall of
  equal boxes.
- **Why bad**: equal-weight boxes bury the primary relationship; the deck reads
  as a dashboard, not an argument.
- **Fix**: one container per relationship group; use a tinted panel, an accent
  bar, or whitespace to group, not a border on every item. Reserve a real card
  for a peer set (KPI, comparison) where the boxes carry meaning.

```css
/* bad: box on every idea */
.idea { border: 1px solid #d6dce2; } /* ×N */

/* good: one group container, items as text leaves */
.group { background: #f7f8fa; border-radius: 16px; }
```

## 3. Color noise → restrained token palette

- **Bad**: 6+ hues, a different accent per slide, decorative colored text.
- **Why bad**: no visual system; nothing signals importance because everything
  competes.
- **Fix**: stay inside `style-contract.json` `allowedColors`. Use neutrals
  (`--ink`, `--muted`, `--paper`, `--line`) for most of the slide and reserve
  the accent for at most one or two emphasis points per slide. Tints
  (`--accent-soft`, `--support-soft`) for panels, never a new hue.

## 4. Flat type → visible scale

- **Bad**: title, body, and caption within a few pixels of each other; all
  weight 400.
- **Why bad**: no hierarchy; the eye cannot find the slide's point.
- **Fix**: use the CJK type scale in `cjk-typography.md`. One dominant title,
  one subhead only when needed, body ≥30px, captions clearly smaller and
  lighter.

## 5. Drifting edges → grid and shared tokens

- **Bad**: cards with 4 different widths, gaps of 18/22/26px, text baselines
  that do not line up.
- **Why bad**: instantly reads as sloppy even with a good palette.
- **Fix**: a 12-column grid and 8px spacing tokens; build repeats with CSS
  Grid/Flex; mark groups with `data-layout-group`/`data-layout-item`/
  `data-layout-check` and pass the equal-edge/size/gap validator. Same-length
  labels share one anchor; do not hand-tune each card.

## 6. Decoration overload → one emphasized surface

- **Bad**: glassmorphism header + gradient text + drop-shadow cards + clipped
  shapes on one slide.
- **Why bad**: these are raster-only effects, so the whole slide collapses into
  uneditable images, and visually it is noisy.
- **Fix**: at most one emphasized surface per slide. Use a solid or simple
  linear-gradient fill (export-safe) instead of `backdrop-filter`; keep shadows
  to `shadow-md` or lighter and only on the hero card. See `visual-recipes.md`
  §6 for the raster-only list.

## 7. Unspaced CJK–Latin → proper mixed spacing

- **Bad**: `本季度收入增长42%` and `使用PPTX工作流` run together.
- **Why bad**: cramped and harder to scan; a hallmark of machine-generated text.
- **Fix**: `本季度收入增长 42%` and `使用 PPTX 工作流`. Apply the full rules in
  `cjk-typography.md`.

## 8. Stretched image → intentional crop

- **Bad**: a screenshot squeezed to fit a box, aspect ratio visibly distorted.
- **Why bad**: looks broken and unprofessional; evidence is misrepresented.
- **Fix**: `object-fit: cover` with an explicit box, or `contain` with letterbox
  margins. Crop, never squash. Frame with a radius/border for a finished look.

## 9. Mixed icon families → one treatment

- **Bad**: a filled icon next to an outline icon next to a Material glyph.
- **Why bad**: inconsistent geometry breaks the visual system.
- **Fix**: one approved family and one treatment (outline or filled, one size
  range, one stroke weight, one color policy) per the approved
  `visual-asset-plan.json`. Prefer native shapes for simple checks and arrows.

## 10. Cramped table → padded, zebra, header strip

- **Bad**: a table with no padding, thin headers, and all-white rows.
- **Why bad**: data is hard to scan and looks unpolished.
- **Fix**: pad cells generously; a filled header strip (native `shape-text` for
  each header cell); a subtle zebra tint or row rules using the neutral tokens;
  align numbers right and text left.

## Self-Check

Reject a slide when any of these is true:

1. More than one message competes for attention.
2. Any body copy is below the CJK minimum for its role.
3. A color outside `allowedColors` appears without an approved exception.
4. A repeated element differs from its peers in edge, size, or gap.
5. A raster-only effect is used where an export-safe recipe would do.
6. A CJK–Latin boundary lacks spacing.
