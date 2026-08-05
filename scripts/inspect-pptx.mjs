#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { loadArtifactTool, loadRuntimePackage, parseArgs, requireArg, writeBlob } from "./runtime.mjs";
import { parseSlideSelection } from "./slide-selection.mjs";

const args = parseArgs(process.argv.slice(2));
const sourcePptx = path.resolve(requireArg(args, "pptx"));
const outputDir = path.resolve(requireArg(args, "out"));

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(path.join(outputDir, "slides"), { recursive: true });
await fs.mkdir(path.join(outputDir, "layouts"), { recursive: true });
await fs.mkdir(path.join(outputDir, "media"), { recursive: true });

const { FileBlob, PresentationFile } = await loadArtifactTool();
const presentation = await PresentationFile.importPptx(await FileBlob.load(sourcePptx));
const selectedSlides = args.slides
  ? parseSlideSelection(args.slides, presentation.slides.items.length)
  : presentation.slides.items.map((_, index) => index + 1);
const selectedSet = new Set(selectedSlides);
const slideSummaries = [];

for (const [index, slide] of presentation.slides.items.entries()) {
  const slideNumber = index + 1;
  slideSummaries.push({ slideNumber, id: slide.id ?? null, selected: selectedSet.has(slideNumber) });
  if (!selectedSet.has(slideNumber)) continue;
  const number = String(index + 1).padStart(2, "0");
  const png = await presentation.export({ slide, format: "png", scale: 1 });
  await writeBlob(path.join(outputDir, "slides", `slide-${number}.png`), png, fs);

  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(path.join(outputDir, "layouts", `slide-${number}.json`), await layout.text());
}

const montage = await presentation.export({ format: "webp", montage: true, scale: 1 });
await writeBlob(path.join(outputDir, "montage.webp"), montage, fs);

const inspection = await presentation.inspect({
  kind: "slide,textbox,shape,image,table,chart,notes,layout",
  maxChars: 2_000_000,
});
await fs.writeFile(path.join(outputDir, "inspection.ndjson"), inspection.ndjson, "utf8");

const inspectionRows = inspection.ndjson
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const extractedSlides = new Map(selectedSlides.map((slideNumber) => [slideNumber, {
  number: slideNumber,
  slideId: null,
  detectedTitle: "",
  text: [],
  images: [],
  tables: [],
  charts: [],
  notes: "",
  readingOrder: [],
}]));

for (const row of inspectionRows) {
  const slide = extractedSlides.get(row.slide);
  if (!slide) continue;
  if (row.kind === "slide") {
    slide.slideId = row.id ?? null;
    slide.detectedTitle = row.title ?? "";
  } else if (row.kind === "textbox") {
    slide.text.push({ id: row.id, name: row.name ?? "", text: row.text ?? "", bbox: row.bbox ?? null });
  } else if (row.kind === "image") {
    slide.images.push({ id: row.id, name: row.name ?? "", bbox: row.bbox ?? null });
  } else if (row.kind === "table") {
    slide.tables.push(row);
  } else if (row.kind === "chart") {
    slide.charts.push(row);
  } else if (row.kind === "notes") {
    slide.notes = row.text ?? "";
  }
}

for (const slide of extractedSlides.values()) {
  slide.readingOrder = [...slide.text]
    .filter((item) => Array.isArray(item.bbox))
    .sort((a, b) => a.bbox[1] - b.bbox[1] || a.bbox[0] - b.bbox[0])
    .map((item) => item.id);
}
await fs.writeFile(
  path.join(outputDir, "extracted-slides.json"),
  `${JSON.stringify([...extractedSlides.values()], null, 2)}\n`,
  "utf8",
);

const JSZip = loadRuntimePackage("jszip");
const pptxBytes = await fs.readFile(sourcePptx);
const zip = await JSZip.loadAsync(pptxBytes);
const mediaFiles = [];
for (const [entryName, entry] of Object.entries(zip.files)) {
  if (!entryName.startsWith("ppt/media/") || entry.dir) continue;
  const target = path.join(outputDir, "media", path.basename(entryName));
  await fs.writeFile(target, await entry.async("nodebuffer"));
  mediaFiles.push(path.basename(target));
}

const summary = {
  sourcePptx,
  slideCount: presentation.slides.items.length,
  selectedSlides,
  slides: slideSummaries,
  compactExtraction: "extracted-slides.json",
  extractedMedia: mediaFiles.sort(),
};
await fs.writeFile(path.join(outputDir, "source-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ ok: true, ...summary })}\n`);
