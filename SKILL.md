---
name: kris-pptx-beautifier
description: >-
  把一份现有 PPT 重新拆解、重构、设计、排版，并导出为对齐的可编辑 PPTX。
  HTML-first：固定 1920×1080 舞台逐页重排成可编辑的 PowerPoint 文字/形状/图片，
  一次跑完不打断用户。用于 美化PPT、改PPT样式、重新排版PPT、PPT重构、PPT换设计。
---

# Kris PPTX Beautifier

输入一份 PPT，一条主线跑到底：**拆解 → 重构 → 设计 → 布局 → 校验 → 导出对齐的可编辑 PPTX**。
不打断用户、不做多轮确认、不产出需要人工审阅的中间文件。

## 核心原则

1. **内容重构优先于样式**。先把每页文字拆成最小信息单元，判断单元间关系，再据此定布局。布局必须体现关系，禁止照搬源页骨架。
2. **文案 B 模式**：保留事实、数字、名称、单位、引用；标题讲结论；精简冗余；允许重组条目。
3. **HTML-first**：每页一个 `<section data-pptx-slide>`（1920×1080），叶子元素用 `data-pptx="text|shape|shape-text|image|raster"` 标记，导出为可编辑 PPTX。能用原生形状/文字就不用 raster。
4. **对齐**：导出前必须跑 `check-html-deck.mjs`（字体 ≥30px、不裁剪、不重叠、不越界），全绿才导出。
5. **字体**：CJK 用 Noto Sans SC（`assets/fonts/`）；字体栈 Latin 必须在最前（`Arial, "Noto Sans SC", ...`），否则 CJK 行高撑爆拉丁盒子。
6. 绝不覆盖源 PPTX；结果写到新文件。

## 关系 → 布局速查

拆解后先给每组定关系，再选布局（详见 `references/relationship-visual-map.md`）：

| 关系 | 布局 |
| --- | --- |
| 并行 / 分类 | 等宽卡片矩阵（图标 + 标签 + 短说明） |
| 串行 / 流程 / 步骤 | 箭头连接的步骤链 |
| 层级 / 组织 | hub-and-spoke 组织树（中心节点 + 连接线） |
| 对比 / 取舍 | 左右两栏或表格 |
| 数据 / KPI | 大数字或原生图表（条形/环形） |
| 时间线 / 里程碑 | 横向节点线 |
| 证据 / 截图 | 分栏：大图 + 编号标注 |
| 结论 / 金句 | 大字陈述 + 左侧竖线 |

## 一次跑通的流程

### 1. 拆解

```bash
node "$SKILL/scripts/inspect-pptx.mjs" \
  --pptx "$SOURCE_PPTX" \
  --slides "$SELECTED_SLIDES" \
  --out "$TMP_DIR/source-inspection"
```

读 `extracted-slides.json`（每页文字/图/阅读顺序）。`--slides` 可省略表示全量；`SELECTED_SLIDES` 形如 `3,5-7`。

### 2. 重构（内容）

每页产出：**结论标题** + 若干分组，每组标注**关系类型** + 精简后的条目。
标题按 `references/copywriting-rules.md`（讲结论、无 AI 套话、无占位符）。

### 3. 设计 + 布局

- 主题：优先沿用源品牌色；无品牌要求时用干净商务风（藏蓝主色 + 单一点缀色）。
- 构图与原型见 `references/design-grammar.md`；导出安全组件见 `references/visual-recipes.md`。
- 图标用 `references/icon-kit.md` 的 glyph（◆●▲■✓ 等），全 deck 统一一套。

### 4. 写 HTML

以 `assets/deck-template.html` 为骨架（复制到 `$TMP_DIR/deck.html`，连 `assets/fonts/` 一起拷到 `$TMP_DIR/fonts/`），逐页替换：

- 每页一个 `data-pptx-slide`，`data-label` 命名。
- 所有叶子加 `data-pptx` 标记；重复布局用 `data-layout-group` + `data-layout-item` + `data-layout-check`。
- 居中填充标签用 `data-pptx="shape-text"`（Flexbox 居中 + `line-height:1`）。
- 中文排版遵循 `references/cjk-typography.md`；渐变只用 2+ 色 `linear-gradient`；阴影只靠 blur（sm/md/lg）。

### 5. 校验（对齐）

```bash
python3 -m http.server 8123 -d "$TMP_DIR" &
node "$SKILL/scripts/check-html-deck.mjs" --url http://127.0.0.1:8123/deck.html --min-font 30
```

修掉所有越界/裁剪/重叠/未标记/非 1920×1080 问题后再导出。

### 6. 导出

```bash
node "$SKILL/scripts/export-html-to-pptx.mjs" \
  --url http://127.0.0.1:8123/deck.html \
  --out "$FINAL_PPTX"
```

默认输出 1280×720（16:9）。渲染导出器 QA 目录里的每页 PNG，肉眼确认无错位后交付。

## 脚本速查

| 脚本 | 用途 |
| --- | --- |
| `inspect-pptx.mjs` | 拆解源 PPTX（文字/图/结构） |
| `check-html-deck.mjs` | 对齐校验（字体/裁剪/重叠/越界） |
| `export-html-to-pptx.mjs` | DOM → 可编辑 PPTX |
| `validate-export-ledger.mjs` | 检查意外栅格化 |
| `inspect-pptx.mjs`（对最终 PPTX） | 交付前复核文字未丢 |

## 必读参考（其余按需查阅）

- `references/copywriting-rules.md` — 标题讲结论，禁 AI 套话
- `references/relationship-visual-map.md` — 关系 → 视觉结构
- `references/design-grammar.md` — 构图家族 + 布局原型
- `references/visual-recipes.md` — 导出安全组件配方
- `references/cjk-typography.md` — 中文字号/行高/标点/字体栈

其余 `references/`（intake、officecli、quality-gates、visual-audit、element-logic、frontend-routing、html-authoring、alignment-and-fidelity、extraction-and-export、content-lock、source-style-modes、visual-asset-planning、approach-notes）为可选深度资料，默认不读。

## 失败规则

- 源 PPTX 无法解析/渲染 → 停下报告，不硬做。
- 内容放不下 → 改布局；确实要删内容才动文字，并在交付说明里披露。
- 某布局改变了原关系 → 换布局，不迁就。
- HTML 与 PPTX 渲染差异大 → 简化 DOM，或只栅格化最小不可导区域并说明。
- 字体不可用 → `document.fonts.check("16px 'Noto Sans SC'")` 验证，按 cjk-typography 回退并重查换行。

## Attribution

工作流参考了 MIT 许可的 `JimLiu/baoyu-design`、`zarazhangrui/frontend-slides`、`atharva9167j/dom-to-pptx`。见 `references/approach-notes.md`。
