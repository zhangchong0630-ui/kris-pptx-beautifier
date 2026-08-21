#!/usr/bin/env node

// blueprint-to-html.mjs — 把「内容蓝图」(blueprint JSON) 渲染成给人看的可视化 HTML。
// 用途：内容编排阶段（确认点 A）的人工审阅界面。蓝图是机器可读的中间产物，
// 本脚本负责把它翻译成"扫一眼就能确认逻辑"的人类视图，避免直接暴露 JSON。
//
// 用法：
//   node scripts/blueprint-to-html.mjs --blueprint blueprint.json --out blueprint.html
//
// 蓝图 JSON 格式（blueprint/v1）：
//   {
//     "deck": "演示标题",
//     "pages": [{
//       "page": 27, "sourceTitle": "原标题", "conclusion": "结论标题",
//       "takeaway": "顶部承诺条（可选）",
//       "groups": [{
//         "type": "hierarchy|parallel|process|timeline|comparison|emphasis|evidence|editorial",
//         "label": "分组名",
//         "subordinate": true,            // 次要关系 → 压缩为条状
//         "items": [{ "text": "...", "detail": "...", "level": 1 }]
//       }],
//       "imageSlots": [{ "role": "...", "note": "..." }],   // 可选
//       "notes": ["..."]
//     }]
//   }

import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs, requireArg } from "./runtime.mjs";

const args = parseArgs(process.argv.slice(2));
const blueprintPath = path.resolve(requireArg(args, "blueprint"));
const outPath = path.resolve(requireArg(args, "out"));

const blueprint = JSON.parse(await fs.readFile(blueprintPath, "utf8"));

const TYPE_META = {
  parallel: { label: "并行", color: "#0f9d58", bg: "#e6f4ea" },
  hierarchy: { label: "层级", color: "#1a73e8", bg: "#e8f0fe" },
  process: { label: "流程", color: "#7b1fa2", bg: "#f3e8fd" },
  timeline: { label: "时间线", color: "#00897b", bg: "#e0f2f1" },
  comparison: { label: "对比", color: "#ef6c00", bg: "#fff3e0" },
  emphasis: { label: "强调", color: "#d84315", bg: "#fbe9e7" },
  evidence: { label: "证据", color: "#c62828", bg: "#fdecea" },
  editorial: { label: "论述", color: "#546e7a", bg: "#eceff1" },
};
const DEFAULT_META = { label: "关系", color: "#455a64", bg: "#eceff1" };

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function badge(type) {
  const meta = TYPE_META[type] ?? DEFAULT_META;
  return `<span class="badge" style="color:${meta.color};background:${meta.bg};border-color:${meta.color}33">${meta.label} · ${esc(type)}</span>`;
}

function renderItems(type, items) {
  const meta = TYPE_META[type] ?? DEFAULT_META;
  if (type === "hierarchy") {
    const byLevel = new Map();
    for (const it of items) {
      const lv = it.level ?? 1;
      if (!byLevel.has(lv)) byLevel.set(lv, []);
      byLevel.get(lv).push(it);
    }
    const rows = [...byLevel.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([lv, its]) => {
        const chips = its
          .map((it) => `<span class="node" style="border-color:${meta.color}66">${esc(it.text)}</span>`)
          .join("");
        return `<div class="hier-row lv${lv}"><span class="hier-tag">L${lv}</span>${chips}</div>`;
      })
      .join("");
    return `<div class="hier">${rows}</div>`;
  }
  if (type === "process") {
    const steps = items
      .map((it, i) => {
        const arrow = i < items.length - 1 ? `<span class="arrow">→</span>` : "";
        return `<div class="step"><div class="step-no" style="background:${meta.color}">${i + 1}</div><div class="step-body"><div class="step-title">${esc(it.text)}</div>${it.detail ? `<div class="step-detail">${esc(it.detail)}</div>` : ""}</div>${arrow}</div>`;
      })
      .join("");
    return `<div class="flow">${steps}</div>`;
  }
  // parallel / comparison / emphasis / evidence / editorial / timeline: 卡片网格
  const cards = items
    .map(
      (it) =>
        `<div class="card" style="border-color:${meta.color}44"><div class="card-title">${esc(it.text)}</div>${it.detail ? `<div class="card-detail">${esc(it.detail)}</div>` : ""}</div>`,
    )
    .join("");
  return `<div class="grid">${cards}</div>`;
}

function renderGroup(group, idx) {
  const subordinate = group.subordinate ? ` subordinate` : "";
  return `
  <div class="group${subordinate}">
    <div class="group-head">${badge(group.type)}<span class="group-label">${esc(group.label)}</span></div>
    ${renderItems(group.type, group.items ?? [])}
  </div>`;
}

function renderImageSlots(slots) {
  if (!slots?.length) return "";
  return slots
    .map(
      (s) =>
        `<div class="img-slot"><span class="img-role">🖼 ${esc(s.role)}</span>${s.note ? `<span class="img-note">${esc(s.note)}</span>` : ""}</div>`,
    )
    .join("");
}

function renderPage(page) {
  const groups = (page.groups ?? []).map(renderGroup).join("");
  const slots = renderImageSlots(page.imageSlots);
  const notes = (page.notes ?? [])
    .map((n) => `<li>${esc(n)}</li>`)
    .join("");
  return `
  <section class="page">
    <header class="page-head">
      <span class="page-no">P${page.page}</span>
      <span class="source-title" title="源页原标题">源：${esc(page.sourceTitle ?? "")}</span>
    </header>
    <div class="conclusion">${esc(page.conclusion ?? "")}</div>
    ${page.takeaway ? `<div class="takeaway">${esc(page.takeaway)}</div>` : ""}
    ${groups}
    ${slots}
    ${notes ? `<ul class="notes">${notes}</ul>` : ""}
  </section>`;
}

const legend = Object.entries(TYPE_META)
  .map(([key, m]) => badge(key))
  .join("");

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>内容蓝图 · ${esc(blueprint.deck ?? "")}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif; background: #f4f5f7; color: #1f2328; padding: 32px 24px 64px; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
  .sub { font-size: 13px; color: #57606a; margin-bottom: 20px; }
  .legend { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
  .badge { display: inline-block; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 999px; border: 1px solid; white-space: nowrap; }
  .page { background: #fff; border: 1px solid #d8dee4; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,.06); padding: 20px 22px; margin-bottom: 28px; }
  .page-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .page-no { font-size: 12px; font-weight: 700; color: #fff; background: #24292f; border-radius: 6px; padding: 2px 8px; }
  .source-title { font-size: 12px; color: #8b949e; }
  .conclusion { font-size: 26px; font-weight: 800; letter-spacing: .5px; margin-bottom: 10px; }
  .takeaway { font-size: 13px; color: #d84315; background: #fbe9e7; border-left: 4px solid #d84315; padding: 6px 12px; border-radius: 4px; margin-bottom: 14px; }
  .group { margin-top: 12px; }
  .group.subordinate { background: #f6f8fa; border-radius: 10px; padding: 10px 12px; }
  .group-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .group-label { font-size: 14px; font-weight: 600; color: #24292f; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
  .card { border: 1.5px solid; border-radius: 10px; padding: 10px 12px; background: #fff; }
  .card-title { font-size: 15px; font-weight: 700; }
  .card-detail { font-size: 12.5px; color: #57606a; margin-top: 4px; line-height: 1.5; }
  .hier-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 6px 0; }
  .hier-row.lv2 { padding-left: 34px; }
  .hier-tag { font-size: 10px; color: #8b949e; font-weight: 700; }
  .node { border: 1.5px solid; border-radius: 8px; padding: 6px 14px; font-size: 14px; font-weight: 600; background: #fff; }
  .flow { display: flex; align-items: stretch; gap: 4px; flex-wrap: wrap; }
  .step { display: flex; align-items: flex-start; gap: 8px; background: #fff; border: 1.5px solid #e3e6ea; border-radius: 10px; padding: 10px 12px; flex: 1 1 200px; }
  .step-no { color: #fff; width: 22px; height: 22px; border-radius: 50%; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex: none; }
  .step-title { font-size: 14px; font-weight: 700; }
  .step-detail { font-size: 12.5px; color: #57606a; margin-top: 3px; line-height: 1.5; }
  .arrow { align-self: center; font-size: 20px; color: #8b949e; padding: 0 2px; }
  .img-slot { border: 2px dashed #c9d1d9; border-radius: 10px; padding: 12px; margin-top: 12px; display: flex; align-items: center; gap: 12px; background: #fafbfc; }
  .img-role { font-size: 13px; font-weight: 600; color: #57606a; }
  .img-note { font-size: 12px; color: #8b949e; }
  .notes { margin-top: 12px; padding-left: 18px; }
  .notes li { font-size: 12px; color: #8b949e; line-height: 1.7; }
  .cta { position: fixed; bottom: 18px; right: 24px; background: #24292f; color: #fff; font-size: 13px; padding: 10px 16px; border-radius: 999px; box-shadow: 0 4px 12px rgba(0,0,0,.25); }
</style>
</head>
<body>
  <h1>内容蓝图 · ${esc(blueprint.deck ?? "")}</h1>
  <div class="sub">确认点 A：请审阅每页的「结论标题 / 分组 / 关系类型 / 条目」。逻辑确认后，布局将由此推导，不再沿用源页骨架。</div>
  <div class="legend">${legend}</div>
  ${(blueprint.pages ?? []).map(renderPage).join("\n")}
  <div class="cta">✅ 逻辑没问题 → 进入阶段二（布局分配）</div>
</body>
</html>
`;

await fs.writeFile(outPath, html, "utf8");
process.stdout.write(JSON.stringify({ ok: true, out: outPath, bytes: Buffer.byteLength(html) }) + "\n");
