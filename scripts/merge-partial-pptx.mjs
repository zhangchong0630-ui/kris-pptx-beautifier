#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { loadArtifactTool, parseArgs, requireArg } from "./runtime.mjs";
import { parseSlideSelection } from "./slide-selection.mjs";

const args = parseArgs(process.argv.slice(2));
const sourcePath = path.resolve(requireArg(args, "source"));
const replacementPath = path.resolve(requireArg(args, "replacement"));
const outputPath = path.resolve(requireArg(args, "out"));
const ledgerPath = args.ledger ? path.resolve(args.ledger) : null;
const styleMode = args["style-mode"] || "brand-rebuild";
if (styleMode !== "brand-rebuild") {
  throw new Error("--style-mode must be brand-rebuild");
}

const { FileBlob, Presentation, PresentationFile } = await loadArtifactTool();
const source = await PresentationFile.importPptx(await FileBlob.load(sourcePath));
const replacement = await PresentationFile.importPptx(await FileBlob.load(replacementPath));
const selectedSlides = parseSlideSelection(requireArg(args, "slides"), source.slides.items.length);

if (replacement.slides.items.length !== selectedSlides.length) {
  throw new Error(`Replacement deck has ${replacement.slides.items.length} slides, but ${selectedSlides.length} source pages were selected`);
}

const sourceProto = structuredClone(source.toProto());
const replacementProto = replacement.toProto();
const usedImageIds = new Set((sourceProto.images ?? []).map((image) => image.id));
const usedChartIds = new Set((sourceProto.charts ?? []).map((chart) => chart.id));
const ledger = [];

function collectReferenceIds(node, key, found = new Set()) {
  if (!node || typeof node !== "object") return found;
  if (node[key] && typeof node[key] === "object" && typeof node[key].id === "string") found.add(node[key].id);
  for (const value of Object.values(node)) collectReferenceIds(value, key, found);
  return found;
}

function replaceExactStrings(node, mapping) {
  if (!node || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === "string" && mapping.has(value)) node[key] = mapping.get(value);
    else replaceExactStrings(value, mapping);
  }
}

function uniqueResourceId(oldId, page, used) {
  const extension = path.posix.extname(oldId) || ".bin";
  const directory = path.posix.dirname(oldId);
  let candidate;
  do {
    candidate = `${directory}/pbx-p${page}-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}${extension}`;
  } while (used.has(candidate));
  used.add(candidate);
  return candidate;
}

function mergeReferencedResources(slideProto, referenceKey, sourceListName, usedIds, targetPage) {
  const mapping = new Map();
  const replacementList = replacementProto[sourceListName] ?? [];
  for (const oldId of collectReferenceIds(slideProto, referenceKey)) {
    const resource = replacementList.find((item) => item.id === oldId);
    if (!resource) throw new Error(`Missing ${sourceListName} resource for ${oldId}`);
    const newId = uniqueResourceId(oldId, targetPage, usedIds);
    const cloned = structuredClone(resource);
    cloned.id = newId;
    sourceProto[sourceListName] ??= [];
    sourceProto[sourceListName].push(cloned);
    mapping.set(oldId, newId);
  }
  replaceExactStrings(slideProto, mapping);
  return [...mapping.entries()].map(([from, to]) => ({ from, to }));
}

for (const [replacementIndex, targetPage] of selectedSlides.entries()) {
  const targetIndex = targetPage - 1;
  const original = sourceProto.slides[targetIndex];
  const incoming = structuredClone(replacementProto.slides[replacementIndex]);
  if (original.widthEmu !== incoming.widthEmu || original.heightEmu !== incoming.heightEmu) {
    throw new Error(`Replacement slide ${replacementIndex + 1} size does not match source page ${targetPage}`);
  }
  const images = mergeReferencedResources(incoming, "imageReference", "images", usedImageIds, targetPage);
  const charts = mergeReferencedResources(incoming, "chartReference", "charts", usedChartIds, targetPage);

  incoming.id = `pbx-${targetPage}-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
  incoming.index = targetIndex;
  incoming.creationId = `{${crypto.randomUUID().toUpperCase()}}`;
  incoming.useLayoutId = original.useLayoutId;
  incoming.showMasterShapes = original.showMasterShapes;
  sourceProto.slides[targetIndex] = incoming;
  ledger.push({ targetPage, replacementSlide: replacementIndex + 1, images, charts });
}

const merged = Presentation.load(sourceProto);
const output = await PresentationFile.exportPptx(merged);
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await output.save(outputPath);

const result = {
  ok: true,
  source: sourcePath,
  replacement: replacementPath,
  output: outputPath,
  slideCount: sourceProto.slides.length,
  selectedSlides,
  styleMode,
  replacements: ledger,
};
if (ledgerPath) {
  await fs.mkdir(path.dirname(ledgerPath), { recursive: true });
  await fs.writeFile(ledgerPath, `${JSON.stringify(result, null, 2)}\n`);
}
process.stdout.write(`${JSON.stringify(result)}\n`);
