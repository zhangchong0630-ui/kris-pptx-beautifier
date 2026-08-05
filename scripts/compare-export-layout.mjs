#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs, requireArg } from "./runtime.mjs";

const args = parseArgs(process.argv.slice(2));
const qaDir = path.resolve(requireArg(args, "qa-dir"));
const tolerance = Number(args.tolerance ?? 1);
if (!Number.isFinite(tolerance) || tolerance < 0) throw new Error("--tolerance must be a non-negative number");

const files = await fs.readdir(qaDir);
const htmlFiles = files.filter((file) => /^slide-\d+\.html-layout\.json$/.test(file)).sort();
if (!htmlFiles.length) throw new Error(`No slide-XX.html-layout.json files found in ${qaDir}`);

const findings = [];
const near = (a, b) => Math.abs(Number(a) - Number(b)) <= tolerance;

for (const htmlFile of htmlFiles) {
  const stem = htmlFile.replace(/\.html-layout\.json$/, "");
  const pptFile = `${stem}.layout.json`;
  if (!files.includes(pptFile)) {
    findings.push({ slide: stem, message: `Missing ${pptFile}` });
    continue;
  }
  const expected = JSON.parse(await fs.readFile(path.join(qaDir, htmlFile), "utf8"));
  const actual = JSON.parse(await fs.readFile(path.join(qaDir, pptFile), "utf8"));
  const byName = new Map((actual.elements || []).map((element) => [element.name, element]));
  const usedFallbackElements = new Set();

  for (const item of expected.items || []) {
    let element = byName.get(item.name);
    if (!element && ["image", "raster"].includes(item.kind)) {
      const candidates = (actual.elements || []).filter((candidate) => {
        if (usedFallbackElements.has(candidate)) return false;
        if (candidate.kind !== "image" || !Array.isArray(candidate.bbox)) return false;
        return item.bbox.every((value, index) => near(value, candidate.bbox[index]));
      });
      if (candidates.length === 1) {
        [element] = candidates;
        usedFallbackElements.add(element);
      }
    }
    if (!element) {
      findings.push({ slide: expected.slide, element: item.name, message: "Missing exported element" });
      continue;
    }
    const actualBox = element.bbox || [];
    const labels = ["left", "top", "width", "height"];
    for (let index = 0; index < 4; index += 1) {
      if (!near(item.bbox[index], actualBox[index])) {
        findings.push({
          slide: expected.slide,
          element: item.name,
          message: `${labels[index]} differs: HTML ${item.bbox[index]} vs PPT ${actualBox[index]}`,
        });
      }
    }

    if (item.textStyle) {
      const style = element.resolvedTextStyle || {};
      if (style.alignment && style.alignment !== item.textStyle.alignment) {
        findings.push({ slide: expected.slide, element: item.name, message: `alignment differs: HTML ${item.textStyle.alignment} vs PPT ${style.alignment}` });
      }
      if (style.verticalAlignment && style.verticalAlignment !== item.textStyle.verticalAlignment) {
        findings.push({ slide: expected.slide, element: item.name, message: `vertical alignment differs: HTML ${item.textStyle.verticalAlignment} vs PPT ${style.verticalAlignment}` });
      }
      const actualInsets = style.insets || {};
      for (const side of ["top", "right", "bottom", "left"]) {
        if (!near(item.textStyle.insets[side], actualInsets[side] ?? 0)) {
          findings.push({ slide: expected.slide, element: item.name, message: `${side} inset differs: HTML ${item.textStyle.insets[side]} vs PPT ${actualInsets[side] ?? 0}` });
        }
      }
    }
  }
}

const result = { ok: findings.length === 0, tolerance, slides: htmlFiles.length, findings };
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (findings.length) process.exitCode = 1;
