#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { launchBrowser, loadRuntimePackage, normalizeText, parseArgs, requireArg } from "./runtime.mjs";

const args = parseArgs(process.argv.slice(2));
const url = requireArg(args, "url");
const lockPath = path.resolve(requireArg(args, "lock"));
const lock = JSON.parse(await fs.readFile(lockPath, "utf8"));
if (!Array.isArray(lock.slides)) {
  throw new Error(`Lock file ${lockPath} must contain a "slides" array`);
}
for (const slideLock of lock.slides) {
  if (!Number.isInteger(slideLock.htmlSlide)) {
    throw new Error(`Lock entry in ${lockPath} must have an integer "htmlSlide"`);
  }
}
const { chromium } = loadRuntimePackage("playwright");
const browser = await launchBrowser(chromium, { headless: true });
const errors = [];

function escapeAttributeValue(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(url, { waitUntil: "networkidle" });
  const htmlSlideCount = await page.locator("[data-pptx-slide]").count();
  if (lock.slideCountPolicy === "preserve" && htmlSlideCount !== lock.slides.length) {
    errors.push(`Slide count mismatch: HTML=${htmlSlideCount}, lock=${lock.slides.length}`);
  }

  for (const slideLock of lock.slides) {
    const slideIndex = Number(slideLock.htmlSlide) - 1;
    await page.evaluate((index) => {
      if (typeof window.__pptxShowSlide === "function") window.__pptxShowSlide(index);
      else document.querySelectorAll("[data-pptx-slide]").forEach((candidate, i) => {
        candidate.style.display = i === index ? "block" : "none";
      });
    }, slideIndex);
    const slide = page.locator("[data-pptx-slide]").nth(slideIndex);
    if (await slide.count() === 0) {
      errors.push(`Missing HTML slide ${slideLock.htmlSlide}`);
      continue;
    }
    for (const item of slideLock.items ?? []) {
      if (item.policy === "allow-delete") continue;
      const matches = slide.locator(`[data-source-id="${escapeAttributeValue(item.sourceId)}"]`);
      const count = await matches.count();
      if (count !== 1) {
        errors.push(`Slide ${slideLock.htmlSlide}: ${item.sourceId} appears ${count} times`);
        continue;
      }
      if (item.policy === "preserve") {
        const actual = normalizeText(await matches.first().innerText());
        const expected = normalizeText(item.text);
        if (actual !== expected) {
          errors.push(`Slide ${slideLock.htmlSlide}: ${item.sourceId} changed from ${JSON.stringify(expected)} to ${JSON.stringify(actual)}`);
        }
      }
    }
  }
} finally {
  await browser.close();
}

const result = { ok: errors.length === 0, errors };
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (errors.length) process.exitCode = 1;
