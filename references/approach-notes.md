# Approach Notes

## Reference Project

The workflow was informed by:

- Project: `JimLiu/baoyu-design`
- Repository: https://github.com/JimLiu/baoyu-design
- License: MIT
- Reviewed commit: `026d4ea012bdd5cada72ac8cc13f21ba4edf2245`

- Project: `zarazhangrui/frontend-slides`
- Repository: https://github.com/zarazhangrui/frontend-slides
- License: MIT
- Reviewed commit: `9906a34d640d2111f724544cbc50f7f130569ae1`

- Project: `atharva9167j/dom-to-pptx`
- Repository: https://github.com/atharva9167j/dom-to-pptx
- License: MIT
- Reviewed commit: `e103460915f0241f31c65d8e869e778dd38a49f4`

- Project: `iOfficeAI/OfficeCLI`
- Repository: https://github.com/iOfficeAI/OfficeCLI
- License: Apache-2.0
- Reviewed as an optional native-PPTX inspection and QA reference.

Useful ideas retained at the workflow level:

- author slides as browser-reviewable HTML;
- measure final browser layout rather than guessing coordinates;
- export editable text, shapes, and images where possible;
- use selective rasterization for unsupported regions;
- validate slide size, notes, and navigation after export.
- author a fixed 1920x1080 browser stage and scale it as one unit;
- provide a compact extraction view for text, images, notes, and reading order;
- use computed DOM coordinates and styles for high-fidelity editable PPTX export.
- use stable native object IDs, structured issue reports, and a CLI-driven validation pass as a
  secondary diagnostic layer.

## Deliberate Differences

- Start from an arbitrary existing PPTX instead of only decks authored in the design system.
- Build a source inspection bundle before design work.
- Lock source content with stable IDs and machine-check equality.
- Use `@oai/artifact-tool` for native PowerPoint generation and QA.
- Treat slide count and order as preserved by default.
- Keep rasterization explicit and auditable.
- Add a machine-checked element logic map before selecting component patterns.
- Preserve source relationships and forbid invented navigation or application chrome.
- Implement DOM measurement and editable export in our own Artifact Tool exporter.
- Keep OfficeCLI optional and use it only for native inspection, validation, and explicitly
  approved small repairs; do not run two competing full-deck layout engines.

No source code from the reference projects is copied into this skill. The OfficeCLI binary,
runtime package, and separate `officecli-pptx` skill are not installed or bundled here. The
integration is a local bridge around the upstream CLI when a user has it available.
