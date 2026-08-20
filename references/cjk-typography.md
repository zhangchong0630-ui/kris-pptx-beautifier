# CJK Typography

Chinese decks fail the "looks professional" test on typography, not on images
or color. These rules apply whenever the rebuilt deck contains Chinese, and are
read together with the font strategy in `source-style-modes.md`.

## Font Stack

Confirm the delivery target during intake and set the stack accordingly (see
`source-style-modes.md`). The exporter resolves CJK text to the first
CJK-capable font in the stack, so always list a CJK font; never lead a
Chinese deck with a Latin-only font.

```css
/* cross-platform */
--font-sans: "Source Han Sans SC", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
```

## Type Scale (1920x1080 stage)

These are recommended sizes at the fixed 1920x1080 canvas; they respect the
minimums in `html-authoring.md`. Do not scale type by viewport.

| Role | Recommended | Minimum | Weight | Line height |
| --- | --- | --- | --- | --- |
| 封面大标题 Cover title | 120–160px | 72px | 700 | 1.1–1.2 |
| 页标题 Slide title | 72–96px | 52px | 700 | 1.2–1.35 |
| 小节/副标题 Subhead | 44–56px | 36px | 600 | 1.25–1.4 |
| 正文 Body | 30–36px | 30px | 400 | 1.5–1.7 |
| 注释/图注/来源 Caption | 22–26px | — | 400 | 1.4–1.5 |
| 超大数字 Metric value | 96–144px | — | 700 | 1 |
| 数据标签 Metric label | 28–36px | — | 400–600 | 1 |

Keep a clear ≥2:1 size ratio between adjacent levels (title vs body) so the
hierarchy is visible from presentation distance. Body copy below 30px at
1920x1080 is usually too small when projected.

## Line Height and Alignment

- Chinese body uses 1.5–1.7 line height; titles use 1.2–1.35. Latin-only decks
  may use 1.4 body. Do not reuse a Latin line-height for dense Chinese copy.
- Left-align body copy. Do not justify Chinese paragraphs — justification
  creates rivers and uneven 字间距. Titles may be left- or center-aligned.
- Give each text leaf an explicit width and height; set `letter-spacing: 0`
  (the exporter does not translate letter-spacing, and PowerPoint re-justifies).
- Keep a slide title on one line when intended; set the width wide enough and
  shorten only with permission.

## Punctuation and Marks

- Use full-width CJK punctuation: `，。；：？！「」『』（）《》、`.
- Prefer corner quotes `「」` / `“”` for quoted text; never leave straight
  quotes `"…"` inside a Chinese sentence.
- Use the CJK enumeration comma `、` for lists, not `,`.
- Use the em dash `—` for ranges and paired `……` for ellipsis; avoid `-` and
  `...` in Chinese prose.
- Avoid 避头尾 violations: an opening quote/bracket must not end a line, and a
  closing quote or comma/period must not start a line. Break lines manually
  when the exporter's wrap would otherwise violate this.

## Mixed CJK–Latin Spacing

- Insert a narrow space between a Chinese character and an adjacent Latin word
  or number, e.g. `增长 42%` and `使用 PPTX 工作流`, not `增长42%` /
  `使用PPTX工作流`.
- Do not add the space inside a single Chinese-run token that must stay
  unbreakable, such as `iPhone15` or `Version2.0`.
- Numbers and units stay together: `42%`, `12.5 亿`, `3 项`. Add the space only
  at the CJK boundary, not inside a number.
- Use a consistent space width — a normal space is fine; do not mix hair spaces
  and full spaces in one deck.

## Metric and Data Emphasis

- Big numbers use a large weight-700 size with `line-height: 1` and tabular
  figures where the typeface supports them; label and unit sit as a separate,
  smaller leaf so the number stays visually dominant.
- Align the numeric baselines of peer KPI cards on one line; do not hand-offset
  different-length labels.
- Keep `%`, `¥`, `$`, `×`, `→`, `↑`, `↓` immediately against their number.

## Chinese-Labeled Shapes

For centered filled labels (badges, pills, index blocks) use `shape-text` with
`display:flex`, `align-items:center`, `justify-content:center`,
`text-align:center`, `line-height:1`, and zero padding. Never set `line-height`
equal to the shape height, and never fake centering by shifting a text box over
a shape — both drift in PowerPoint. See `visual-recipes.md` §3 for the pill and
dot patterns.
