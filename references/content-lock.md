# Content Lock

Create `content-lock.json` after inspecting the source deck. It is the contract between the source PPTX and the redesigned HTML.

```json
{
  "version": 1,
  "sourcePptx": "/absolute/path/source.pptx",
  "slideCountPolicy": "preserve",
  "slideOrderPolicy": "preserve",
  "slides": [
    {
      "sourceSlide": 1,
      "htmlSlide": 1,
      "items": [
        {
          "sourceId": "s01-title",
          "kind": "text",
          "text": "2026 Sales Review",
          "policy": "preserve"
        },
        {
          "sourceId": "s01-subtitle",
          "kind": "text",
          "text": "Draft for leadership review",
          "policy": "allow-rewrite",
          "approvedReason": "User requested copy tightening"
        }
      ]
    }
  ]
}
```

## Rules

- Use `preserve` unless the user explicitly authorizes wording changes.
- Keep numbers, units, dates, names, formulas, footnotes, and citations as separate items when practical.
- Use stable IDs such as `s03-kpi-revenue`; never identify content by position alone.
- Add the same ID to the matching HTML leaf as `data-source-id="s03-kpi-revenue"`.
- Use `allow-rewrite` only for approved editorial changes. The validator checks presence but not equality for those items.
- Record deleted items with `policy: "allow-delete"` and an `approvedReason`; omit them from HTML only after approval.
- Preserve speaker notes separately in the HTML notes array, including `[Sources]` blocks.

## Partial Restyle Example

When only source pages 3 and 7 are selected, the HTML deck contains two slides:

```json
{
  "version": 1,
  "sourcePptx": "/absolute/path/source.pptx",
  "selectedSlides": [3, 7],
  "slideCountPolicy": "selected-only",
  "slideOrderPolicy": "source-order",
  "slides": [
    { "sourceSlide": 3, "htmlSlide": 1, "items": [] },
    { "sourceSlide": 7, "htmlSlide": 2, "items": [] }
  ]
}
```

Keep `selectedSlides` sorted and unique. The HTML slide number is sequential within the selected subset; it is not the source page number.
