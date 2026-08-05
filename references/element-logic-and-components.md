# Element Logic and Component Reference

## Priority Order

1. Source content and relationship logic.
2. Source brand contract.
3. Frontend component pattern.
4. Decorative finish.

The component library is a grammar, not a template skin.

## Required Logic Map

Before authoring HTML, create `element-logic-map.json`:

```json
{
  "version": 1,
  "inventedChrome": false,
  "slides": [
    {
      "sourceSlide": 4,
      "logicInvariant": "Three response actions support, but do not replace, the fault-response matrix.",
      "componentPatterns": ["Steps", "Table"],
      "elements": [
        {
          "sourceId": "s04-response",
          "role": "action step",
          "relation": "sequence",
          "group": "response-flow",
          "preservation": "keep before fault matrix"
        }
      ]
    }
  ]
}
```

Allowed relations: `hierarchy`, `sequence`, `parallel`, `comparison`, `cycle`, `cause-effect`, `evidence`, `annotation`, and `independent`.

Run `scripts/validate-element-logic.mjs` before HTML authoring. A slide may change silhouette, but its `logicInvariant` must remain true in the final render.

## Design-System Selection

Read `frontend-design-routing.md` after the logic map is complete. Choose one
primary system by logic, audience, density, brand fit, exportability, and
editability. Use at most one specialist library for a chart or node diagram.

Do not choose by popularity alone and do not combine the visible skins of
multiple systems. Rebuild the selected patterns with approved source tokens in
export-safe HTML/CSS.

## Forbidden Inventions

- Layout/Sider/Menu/Breadcrumb/Tabs/Pagination without an equivalent source role.
- New page numbers, chapter rails, or persistent side navigation.
- App-like headers, toolbars, buttons, filters, or status controls.
- Decorative cards that imply grouping not present in the source.
- Linearizing a cycle or flattening a hierarchy for visual convenience.

## Visual Review Questions

- Can each source element be pointed to in the rebuild?
- Is each original relationship still visually obvious?
- Did any component introduce a new meaning or interaction metaphor?
- Would removing the component styling leave the same information logic?
- Is the page still recognizably part of the source brand?
- Does the selected system improve spacing, typography, and hierarchy beyond a basic card grid?
