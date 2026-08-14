#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { loadArtifactTool, loadRuntimePackage, parseArgs, requireArg, writeBlob } from "./runtime.mjs";
import { parseSlideSelection } from "./slide-selection.mjs";

const { PNG } = loadRuntimePackage("pngjs");
const PIXEL_DIFF_THRESHOLD = 0.01;
const CHANNEL_DIFF_THRESHOLD = 32;

function pixelDiffFraction(sourceBuffer, finalBuffer) {
  const a = PNG.sync.read(sourceBuffer);
  const b = PNG.sync.read(finalBuffer);
  if (a.width !== b.width || a.height !== b.height) return 1;
  const total = a.width * a.height;
  if (total === 0) return 0;
  let changed = 0;
  for (let index = 0; index < a.data.length; index += 4) {
    const dr = Math.abs(a.data[index] - b.data[index]);
    const dg = Math.abs(a.data[index + 1] - b.data[index + 1]);
    const db = Math.abs(a.data[index + 2] - b.data[index + 2]);
    if (dr + dg + db > CHANNEL_DIFF_THRESHOLD) changed += 1;
  }
  return changed / total;
}

const args = parseArgs(process.argv.slice(2));
const sourcePath = path.resolve(requireArg(args, "source"));
const finalPath = path.resolve(requireArg(args, "final"));
const outputDir = path.resolve(requireArg(args, "out"));
const { FileBlob, PresentationFile } = await loadArtifactTool();

const source = await PresentationFile.importPptx(await FileBlob.load(sourcePath));
const final = await PresentationFile.importPptx(await FileBlob.load(finalPath));
const selectedSlides = parseSlideSelection(requireArg(args, "slides"), source.slides.items.length);
const selectedSet = new Set(selectedSlides);
const allowSelectedNoteChanges = args["allow-selected-note-changes"] === true;
const errors = [];
const warnings = [];
const slides = [];

await fs.mkdir(path.join(outputDir, "source"), { recursive: true });
await fs.mkdir(path.join(outputDir, "final"), { recursive: true });

if (source.slides.items.length !== final.slides.items.length) {
  errors.push(`Slide count changed from ${source.slides.items.length} to ${final.slides.items.length}`);
}

const count = Math.min(source.slides.items.length, final.slides.items.length);
for (let index = 0; index < count; index += 1) {
  const page = index + 1;
  const sourcePng = await source.export({ slide: source.slides.items[index], format: "png", scale: 1 });
  const finalPng = await final.export({ slide: final.slides.items[index], format: "png", scale: 1 });
  const sourceBytes = Buffer.from(await sourcePng.arrayBuffer());
  const finalBytes = Buffer.from(await finalPng.arrayBuffer());
  const selected = selectedSet.has(page);
  const pixelDiff = pixelDiffFraction(sourceBytes, finalBytes);
  const visuallyEqual = pixelDiff <= PIXEL_DIFF_THRESHOLD;

  await writeBlob(path.join(outputDir, "source", `slide-${String(page).padStart(2, "0")}.png`), sourcePng, fs);
  await writeBlob(path.join(outputDir, "final", `slide-${String(page).padStart(2, "0")}.png`), finalPng, fs);

  const sourceNotes = source.slides.items[index].speakerNotes.toSnapshot()?.text ?? "";
  const finalNotes = final.slides.items[index].speakerNotes.toSnapshot()?.text ?? "";
  if (!selected && !visuallyEqual) errors.push(`Unselected slide ${page} changed visually`);
  if (!selected && sourceNotes !== finalNotes) errors.push(`Unselected slide ${page} speaker notes changed`);
  if (selected && sourceNotes && !finalNotes.includes(sourceNotes) && !allowSelectedNoteChanges) {
    errors.push(`Selected slide ${page} no longer contains its original speaker notes`);
  }
  if (selected && visuallyEqual) warnings.push(`Selected slide ${page} appears visually unchanged`);
  slides.push({ page, selected, visuallyEqual, pixelDiff: Number(pixelDiff.toFixed(6)), notesEqual: sourceNotes === finalNotes });
}

const result = { ok: errors.length === 0, source: sourcePath, final: finalPath, selectedSlides, errors, warnings, slides };
await fs.writeFile(path.join(outputDir, "partial-verification.json"), `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (errors.length) process.exitCode = 1;
