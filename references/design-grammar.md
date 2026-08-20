# Design Grammar

This is the layer that turns an "aligned" deck into a "designed" deck. It
applies to every rebuild and every future deck, whether the color and font
tokens come from a source brand (`brand-rebuild`) or from a theme pack
(`topic-to-deck`).

A deck is "aligned but not designed" when every page is a title over a grid of
bordered cards. The rules below prevent that. They are the art direction that
sits above the export-safe recipes in `visual-recipes.md` and the type rules in
`cjk-typography.md`.

## Design Principles

1. **One focus per slide.** Every slide leads with exactly one dominant element —
   a large statement, a large number, a chart, or a side-by-side contrast. If a
   slide has no dominant element, it is a content dump, not a slide.
2. **The title states the conclusion.** A title is a claim, not a label. See
   `copywriting-rules.md`.
3. **Hierarchy must be visible.** The dominant element is at least twice the
   size of supporting copy; use the CJK type scale in `cjk-typography.md`.
4. **Restraint.** One accent emphasis per slide, at most two. Neutrals carry the
   page; the accent marks the point.
5. **Rhythm.** Consecutive slides must not reuse the same silhouette. Vary the
   composition family while keeping the visual language constant.
6. **One motif.** Choose one recurring decorative device and repeat it deck-wide
   (see Motif below).

## The Three Questions

Before composing any slide, answer these, then let the answers drive the layout:

- **Whitespace — how much?** Editorial/minimal styles keep content under ~60% of
  the canvas. Data-dense styles may reach ~75%. Never fill the page edge to edge.
- **Contrast — how strong?** A statement deck uses extreme type contrast (a huge
  title next to small body). A research deck uses soft, low contrast. Pick one
  and stay consistent.
- **Motif — what decorative language?** One signature device per deck (a corner
  mark, a hairline frame, a gradient band, a dotted grid). It must recur.

## Composition Families

Nine families. Every slide must visibly implement exactly one of them. "Title +
card wall" is not a family.

| Family | Definition | Use when | Geometry requirement |
| --- | --- | --- | --- |
| `hero` | Statement-led cover or section opener | Cover, section divider | Large title occupies 40%+ of the canvas |
| `split` | Text and visual side by side (~55/45) | Evidence, screenshot, feature highlight | A clear vertical divide; not a narrow caption |
| `metric-spotlight` | One huge number as the focus | KPI, key metric | Number at 96–160px, label small beside/below |
| `chart-led` | Chart is 60% of the canvas + a conclusion title | Data argument | The chart, not the text, is the largest element |
| `timeline` | Horizontal node line + milestone cards | Chronology, roadmap, phases | A visible node line connects the milestones |
| `matrix` | Equal-width grid of peers with icons | Parallel capabilities, specs, categories | Shared edges/gaps; one cell per peer |
| `comparison` | Side-by-side contrast or a table | Trade-off, before/after, vs | Two aligned columns or a real table |
| `process` | Flow with visible connectors (arrows) | Steps, cause-effect, pipeline | Arrows/connectors link the steps; not a bare row of boxes |
| `editorial` | Single-column, type-led layout | Long-form explanation, meeting minutes | No card grid; hierarchy from type and spacing alone |

Pick the family from the content relationship, not from habit. The mapping is in
`relationship-visual-map.md`.

## Layout Archetypes

Named layouts the family is realized with. Each has an export-safe recipe in
`visual-recipes.md`.

| Layout | Family | Structure |
| --- | --- | --- |
| cover | hero | Large title + eyebrow + one metric or image |
| key-stat | metric-spotlight | Huge number + unit + one-line explanation |
| two-col / three-col | matrix | Equal peer cards with icon + label + body |
| split-screen | split | Text block left, visual right (or vice versa) |
| quote-callout | editorial | Large quote + left rule + attribution |
| timeline | timeline | Horizontal line + milestone nodes + labels |
| process-flow | process | Step cards joined by arrows |
| org-hub | matrix / process | Central node + spokes to role cards |
| cycle | matrix | Nodes arranged around a ring |
| chart-focus | chart-led | Native bar/ring/progress + conclusion |
| data-table | comparison | Padded table, header strip, zebra rows |
| icon-grid | matrix | 2×2 / 2×3 icon tiles (see `icon-kit.md`) |
| agenda | editorial | Large numbered list |
| closing | hero | One memory point or call to action |

## Rhythm Rules

- No three consecutive slides may use the same composition family.
- Card grids (`matrix`) may occupy at most one third of the content slides.
- Adjacent slides may repeat tokens and motif, but never the same silhouette.
- A process/timeline/org relationship must render its connectors; a bare row of
  boxes is a failed reconstruction (see `relationship-visual-map.md`).

## Binding Constraint

Compose only from the active tokens (source brand in `brand-rebuild`, theme pack
in `topic-to-deck`) and the recipes in `visual-recipes.md`. Do not write
free-form CSS that invents colors, fonts, or effects outside the contract. An
unsupported effect (radial gradient, blur, clip-path, transform) goes under
`data-pptx="raster"` on the smallest region and is disclosed — it is never the
default way to make a slide look good.

## Motif

Choose exactly one decorative device and repeat it across the deck:

- a gradient band along one edge (export-safe `linear-gradient`);
- a corner mark made of two native shapes;
- a hairline frame inset from the page edge;
- a dotted or dashed grid of small native shapes;
- a recurring accent rule under every title.

The motif is drawn from native shapes only, so it stays editable. It is the same
device on every page — do not rotate motifs per slide.

## Whitespace

Keep content coverage at or below ~70% of the canvas. A slide that touches all
four margins reads as crowded. Use the 8px spacing scale and a consistent page
margin (`--page-x`) from `visual-recipes.md`.

## Modes

The grammar above is mode-agnostic:

- `brand-rebuild` (current): tokens are derived from the source brand; the
  grammar governs how the locked content is recomposed.
- `topic-to-deck` (future): content is generated and outlined from a topic or
  Markdown, then divided into pages; tokens come from a theme pack. The same
  grammar governs page composition.
