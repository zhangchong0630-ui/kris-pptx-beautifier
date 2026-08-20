# Relationship → Visual Structure Map

Every locked content relationship must be rendered as a **visual structure**,
not as a grid of boxes. This map drives the composition-family choice in
`design-grammar.md`. It is source-agnostic: the "relationship" comes from the
element-logic map in `brand-rebuild`, and from the outline structure in the
future `topic-to-deck` mode.

For each relationship, the table gives the family, the required structure, what
is forbidden, and the export-safe recipe.

| Relationship (`logicInvariant`) | Family | Must render as | Forbidden | Recipe |
| --- | --- | --- | --- | --- |
| 有序流程 / 阶段 / 步骤 | `process` | Step nodes joined by **visible arrows/connectors** | A bare row of unconnected boxes | `visual-recipes.md` §3 timeline, §4 progress steps |
| 时间线 / 里程碑 / 路线图 | `timeline` | A **horizontal node line** with milestone markers | A 2-row cell table without a line | `visual-recipes.md` §3 timeline |
| 层级 / 组织 / 归属 | `matrix` + connectors | A **hub-and-spoke**: central node + connector lines to role/child cards | A row of equal cards with no center or links | `visual-recipes.md` §3 swimlane |
| 并行能力 / 规格 / 分类 | `matrix` | Equal peer cells with **icons** + label + short body | One paragraph per box, no icon, unequal widths | `visual-recipes.md` §3 comparison matrix |
| 对比 / 取舍 / 前后 | `comparison` | Two aligned columns or a real padded table | A single list restating both sides | `visual-recipes.md` §3 comparison matrix |
| 数据 / 量化 / KPI | `chart-led` or `metric-spotlight` | A **native chart** (bar/ring/progress) or a **huge number** | A bullet list of numbers; a grid of text pills | `visual-recipes.md` §4 native charts |
| 循环 / 闭环 | `matrix` | Nodes arranged **around a ring** | A left-to-right arrow row | `visual-recipes.md` §4 donut/ring |
| 因果 / 依赖 | `process` | A **flow** with directed connectors and cause→effect labels | A symmetric grid that hides the direction | `visual-recipes.md` §3 swimlane |
| 证据 / 截图 / 实拍 | `split` | **Split-screen**: large evidence + numbered annotation | A tiny thumbnail with a caption | `visual-recipes.md` §5 image treatment |
| 论述 / 金句 / 结论 | `editorial` | **Type-led**: large statement + left rule | A bordered card wall | `visual-recipes.md` §3 callout |
| 大段说明 / 纪要 / 纯文字 | `editorial` | Single-column, generous line height, numbered headings | A 2×2 card grid | `cjk-typography.md` line-height rules |

## Reconstruction Rules

1. **Render the relationship, not the container.** A timeline is a line with
   nodes; a process is steps with arrows; an org is a hub with spokes. If the
   relationship's structure is not visible at a glance, the reconstruction
   failed even when every text box is aligned.
2. **Connectors are native shapes.** Draw arrows, lines, and spokes with
   `data-pptx="shape" data-pptx-geometry="line"` (and dots as ellipses). Never
   rasterize a connector; it is a basic shape.
3. **One relationship per slide.** If a slide holds two relationships, split it
   or choose the dominant one. A mixed process+comparison on one canvas buries
   both.
4. **Keep the reading order.** The visual structure must preserve the source's
   reading order and `logicInvariant`. Rearranging nodes is allowed only when it
   clarifies the same relationship.

## Before/After Check

After authoring a slide, ask: "If I remove every color, do I still see the
relationship from the geometry alone?" A process shows direction, a timeline
shows progression, an org shows hierarchy, a comparison shows two sides. If the
answer is no, the geometry is wrong — change the layout, not the color.
