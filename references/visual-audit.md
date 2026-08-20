# Visual Audit

The alignment QA in `quality-gates.md` catches errors (overlap, clipping,
off-contract colors). This audit catches **design failures** — a deck that is
error-free but looks plain. Run it on every rebuilt slide before delivery, and
treat a failed item the same as a failed layout check.

## The Core Question

For each slide, ask: **"If I removed every color, do I still see the slide's
point and its structure from geometry alone?"** A slide whose answer is no is
"aligned but not designed".

## Checklist

1. **One focus.** Exactly one dominant element per slide — a large statement, a
   large number, a chart, or a contrast. If none stands out, the slide is a
   content dump.
2. **Conclusion title.** The title states the claim, not the category. See
   `copywriting-rules.md`.
3. **Visible hierarchy.** The dominant element is ≥2× the size of supporting
   copy. No slide where title, body, and caption sit within a few pixels.
4. **Restraint.** At most one or two accent-emphasized elements per slide.
   Neutrals carry the page.
5. **Family implemented.** The slide's geometry matches its declared composition
   family (`design-grammar.md`): a `timeline` has a node line, a `process` has
   connectors, a `metric-spotlight` has a huge number. A "title + card wall" is
   not a family.
6. **Relationship rendered.** The locked relationship is visible from geometry:
   process shows direction, org shows hierarchy, comparison shows two sides.
   See `relationship-visual-map.md`.
7. **Rhythm.** No three consecutive slides use the same composition family;
   card grids (`matrix`) occupy ≤⅓ of content slides.
8. **Whitespace.** Content coverage ≤~70% of the canvas; no slide touches all
   four margins.
9. **Motif consistent.** The one deck-wide decorative device appears on every
   slide and never changes.
10. **Icons one treatment.** One glyph family, one size range, one weight, one
    color policy (`icon-kit.md`). No mixed icon families.
11. **Colors in token.** Every color is within `style-contract.json`
    `allowedColors` (already enforced by `validate-style-contract.mjs`).
12. **Contrast.** Text on an accent or dark surface passes ~4.5:1; body text is
    `--ink` on a light surface, not a low-contrast gray.
13. **CJK rules.** Line height, punctuation, and CJK–Latin spacing follow
    `cjk-typography.md`.

## Reject Rules

Reject a slide when any of these is true:

1. No dominant element (one-focus failed).
2. The relationship's geometry is not visible without color (a bare box grid).
3. The composition family does not match the declared family.
4. Three consecutive slides share one silhouette.
5. A raster-only effect is used where an export-safe recipe or glyph would do.
6. Icons from more than one family appear.

## Automation Note

The geometric checks (one focus, family shape, whitespace coverage, rhythm,
motif recurrence) are candidates for a future `check-design.mjs`. Until then,
the author runs this list manually alongside `check-html-deck.mjs`, and records
"visual audit passed" in the delivery report.
