# Optional OfficeCLI Integration

`iOfficeAI/OfficeCLI` is an optional native-PPTX companion to this skill. It is useful for
object-level inspection, stable ID lookup, native validation, and small approved repairs. It is
not the design engine for this workflow and it is not a replacement for the HTML-first exporter.

Official project: <https://github.com/iOfficeAI/OfficeCLI>

## When to Use It

Use OfficeCLI when the binary is already installed or the user explicitly asks to install it.
Feature-detect it first:

```bash
command -v officecli
officecli --version
```

If it is unavailable, continue with Artifact Tool inspection, the local HTML preview, and the
existing PPTX QA scripts. Do not make the skill fail only because this optional layer is absent.

## Recommended Role

| Stage | OfficeCLI use | Authority |
| --- | --- | --- |
| Source inspection | `view outline`, `view annotated`, `view stats`, `view issues`, `view html`, plus `get`/`query` when stable IDs are useful | Rendered source slides, extraction bundle, and content lock remain authoritative |
| Design | No OfficeCLI authoring | Element logic map, style contract, and approved design system |
| HTML export | No full native round-trip | This skill's DOM measurement and Artifact Tool exporter |
| Final QA | `validate`, `view issues`, `view stats`, `view html`, and targeted `query` | Rendered final PPTX, geometry comparison, and presentations overflow checks |
| Small repair | Explicit `set`, `add`, `move`, `remove`, or `batch` operation after user approval | The approved repair scope and a complete rerun of final QA |

Use stable `@id=` or `@name=` addresses when targeting native objects. Do not rely on positional
indexes when a stable address is available. If interactive selection is needed, `watch`, `get
file selected`, and `mark` can be used to record a proposal before applying it.

## Bridge Script

The local bridge writes deterministic command outputs and a manifest under the task temporary
directory. It never edits the PPTX:

```bash
node "$BEAUTIFIER_SKILL/scripts/officecli-bridge.mjs" \
  --mode inspect \
  --pptx "$SOURCE_PPTX" \
  --out "$TMP_DIR/officecli/source"

node "$BEAUTIFIER_SKILL/scripts/officecli-bridge.mjs" \
  --mode qa \
  --pptx "$FINAL_PPTX" \
  --out "$TMP_DIR/officecli/final"
```

Use `--officecli /absolute/path/to/officecli` or `OFFICECLI_BIN` when the binary is not on
`PATH`. A failed command is recorded and the bridge exits nonzero so the failure cannot be
silently overlooked.

## Repair Guardrails

- Do not run a complete OfficeCLI rewrite after the HTML export; two layout authorities create
  avoidable geometry drift.
- Prefer fixing the HTML/exporter when the problem is shared across slides.
- Use a native repair only when the issue is isolated, the user approved the exact scope, and the
  repair will not change locked content, source relationships, notes, or the approved style.
- Preserve the original final copy before a native repair and record the command and target IDs in
  the delivery QA notes.
- Rerun rendering, overflow checks, re-import inspection, and the OfficeCLI QA bridge after repair.

## What This Does Not Copy

This integration references the open-source project's command concepts and workflow ideas only.
It does not copy OfficeCLI source code, its runtime binary, or its separate `officecli-pptx` skill
into this repository. OfficeCLI is Apache-2.0 licensed; consult the upstream repository for its
current license and distribution terms.
