# Quality Gates

## Source Fidelity

- Source and output slide count/order match the content lock unless explicitly changed.
- Every `preserve` item exists once on the mapped HTML slide with identical normalized text.
- Numbers, units, dates, names, formulas, footnotes, citations, and notes remain correct.
- Logos, product images, charts, and evidence are authentic and correctly attributed.

## HTML

- Every slide's authored DOM box is exactly 1920x1080 before browser scaling.
- Browser responsiveness scales the fixed stage as a whole and never reflows slide content.
- Every visible text/image/SVG/canvas region is inside an export-marked element.
- No marked element crosses slide bounds.
- No text element clips or scrolls.
- No unintended text-to-text overlap exists.
- Every declared layout group passes equal-edge, equal-size, and equal-gap checks.
- Filled labels and headers use one shape-with-text object when internal alignment matters.
- Unsupported CSS is isolated into the smallest reasonable `raster` region.
- Every slide is understandable at 100% view and readable from presentation distance.

## PPTX

- Render every final slide and inspect individually.
- Compare the final montage with the HTML preview for rhythm and consistency.
- Compare captured HTML geometry with exported PPT layout JSON; verify position, size, centers, text anchors, and insets.
- Confirm text wrapping, image crops, colors, borders, shadows, and z-order.
- Inspect repeated headers, color strips, table cells, cards, and annotation columns at 200%.
- Confirm body text is not below the agreed minimum.
- Confirm speaker notes and `[Sources]` blocks are present.
- Run the presentations overflow checker and fix every unintended issue.
- Re-import the final PPTX and inspect text/image/shape counts for obvious export loss.

## Partial Restyle

- Final slide count equals source slide count.
- Selected page numbers are unique, in range, and replaced in their original positions.
- Every unselected page has the same rendered hash as the source page.
- Every unselected page has identical speaker-note text.
- Selected pages keep their locked content and approved notes.
- The design system applied to selected pages is coherent with the requested direction; unselected pages are not silently restyled to match.

## Source Style

- `style-contract.json` records evidence-derived colors and fonts, not an invented palette.
- HTML passes `validate-style-contract.mjs` with no unexplained exception.
- `brand-rebuild` pages are visibly recomposed while retaining brand colors, fonts, logo treatment, and master furniture.
- Every slide satisfies its `logicInvariant`; hierarchy, sequence, parallel, comparison, cycle, cause-effect, and evidence relationships remain unchanged.
- No navigation, side rail, page number, app chrome, or other page furniture was invented.
- Ant Design patterns organize existing relationships; they do not impose default Ant styling or application metaphors.
- Final merge ledger records the selected source-style mode.

## Visual Assets

- `visual-asset-plan.json` records separate approved icon and image decisions.
- Every selected slide has an explicit icon action and image action, including `none` where appropriate.
- Every new icon has a clear semantic role, uses the approved family and treatment, and is traceable through `data-asset-id`.
- No AI-generated icon, fabricated logo, screenshot, chart, evidence, data, or factual diagram exists.
- Every generated image matches an approved non-factual role and the exact user-selected candidate.
- Every searched or replaced external image has provenance and permission recorded.
- Generated and external images are disclosed in the final delivery report.

## Editability Report

Before delivery, record which regions were rasterized. A normal photograph exported as a PowerPoint image is still editable. A chart or compound region captured under `data-pptx="raster"` is not internally editable and must be disclosed.

Compare the PPTX render produced by our Artifact Tool exporter with the HTML render before merging.
Overflow success alone does not satisfy refined visual QA.

## Optional OfficeCLI QA

When OfficeCLI is available, run the bridge in `qa` mode and review `validate`, `issues`,
`stats`, and HTML output. Use stable object IDs for any targeted diagnosis. The absence of
OfficeCLI is not a failure, but a failed command must be investigated or disclosed. Any approved
native repair must be recorded and followed by a complete rerun of the quality gates.
