# Frontend Design Routing

## Selection Rule

Choose one primary design system for the selected slide set. A specialist
visualization library may be added only for a chart or node diagram. Do not mix
the visible skins of multiple complete systems.

Repository popularity indicates maintenance maturity, not suitability. Inspect
the source logic first, then choose by communication job, density, brand fit,
exportability, and editability.

## Curated Systems

| System | Best fit for PPT reconstruction | Avoid when | Source |
| --- | --- | --- | --- |
| Ant Design | Enterprise proposals, tables, descriptions, steps, timelines, status and comparison pages | The page needs editorial storytelling or very low density | https://github.com/ant-design/ant-design |
| Carbon Design System | Financial, technical, industrial and data-dense pages needing a rigorous grid, type scale and spacing discipline | The source brand is soft, expressive, or consumer-oriented | https://github.com/carbon-design-system/carbon |
| Fluent UI | Microsoft or Office-adjacent documents, restrained business communication, familiar productivity aesthetics | The source brand is visually distant from Microsoft conventions | https://github.com/microsoft/fluentui |
| shadcn/ui | Modern product proposals, clean comparison pages, controlled whitespace and simple modular content | Dense decks where repeated cards would dominate the narrative | https://github.com/shadcn-ui/ui |
| Mantine | Balanced modern layouts, mixed content types, flexible theming and polished general-purpose components | Strongly regulated brand systems that need stricter visual discipline | https://github.com/mantinedev/mantine |
| Material UI | Broad component coverage and clear hierarchy when a Material-like visual language is acceptable | Its recognizable visual identity would overpower the source brand | https://github.com/mui/material-ui |

Specialists:

| Library | Use for | Export rule | Source |
| --- | --- | --- | --- |
| Apache ECharts | Quantitative charts, distributions, time series, maps and dashboards | Prefer native PPT shapes for simple charts; otherwise rasterize only the chart region and disclose it | https://github.com/apache/echarts |
| React Flow / xyflow | Node graphs, architecture and dependency flows | Use as a reasoning/layout reference; export simple nodes and connectors natively, rasterize only complex regions | https://github.com/xyflow/xyflow |

## Logic-to-System Routing

| Dominant source logic | Recommended starting point | Typical patterns |
| --- | --- | --- |
| Dense matrix, specification or capability list | Ant Design or Carbon | Table, descriptions, grouped list, comparison matrix |
| Ordered process or chronology | Ant Design | Steps, timeline, phased roadmap |
| KPI, operations, monitoring or quantitative status | Carbon + optional ECharts | Metric hierarchy, compact grid, native chart or bounded chart image |
| Architecture, dependencies or cause-effect | Carbon or Fluent + optional React Flow | Layered architecture, node-link flow, swimlane |
| Product or service proposition | shadcn/ui or Mantine | Strong headline, feature comparison, evidence block, restrained modules |
| Executive strategy or narrative | Mantine or a custom editorial system | Statement-led composition, fewer containers, evidence-led image |
| Office ecosystem or familiar business workflow | Fluent UI | Structured sections, process, responsibilities, status |
| Authentic screenshot or product evidence | Source brand first; library is secondary | Large evidence frame, numbered annotations, restrained caption |

## Slide Composition Rules

- A library is a reference, not an instruction to import its navigation, buttons,
  forms, tabs, sidebars, or application chrome into a slide.
- Translate components into presentation-native composition. Prefer one canvas
  hierarchy over a dashboard of decorative cards.
- Use source colors and typography according to `intake-contract.json` and
  `style-contract.json`; do not copy a library's default palette.
- Use a 12-column slide grid and an 8px base spacing system unless the source
  template provides a stronger grid.
- Derive repeated positions from CSS Grid/Flex and shared tokens. Do not hand
  tune each repeated card independently.
- Keep adjacent slides visually related but vary silhouettes when the content
  logic changes.
- Record the chosen system, rejected alternatives, and slide mappings in
  `design-system-decision.json`.

## Selection Check

Reject a design-system choice when any answer is no:

1. Does it make the source relationship easier to read?
2. Can it retain the approved brand and color policy?
3. Can its important elements export cleanly to editable PPT objects?
4. Does it avoid unnecessary application metaphors?
5. Does it improve hierarchy, spacing, and typography beyond a basic card grid?
