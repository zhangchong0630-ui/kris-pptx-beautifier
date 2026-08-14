#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { launchBrowser, loadRuntimePackage, parseArgs, requireArg } from "./runtime.mjs";

const args = parseArgs(process.argv.slice(2));
const url = requireArg(args, "url");
const contractPath = path.resolve(requireArg(args, "contract"));
const contract = JSON.parse(await fs.readFile(contractPath, "utf8"));

if (contract.mode !== "brand-rebuild") {
  throw new Error("Style contract mode must be brand-rebuild");
}

function normalizeHex(value) {
  const text = String(value).trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(text)) return `#${[...text.slice(1)].map((char) => char + char).join("")}`;
  if (/^#[0-9a-f]{6}$/.test(text)) return text;
  const match = text.match(/rgba?\((\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)(?:[, /]+(\d+(?:\.\d+)?))?\)/);
  if (!match || Number(match[4] ?? 1) === 0) return null;
  return `#${[match[1], match[2], match[3]].map((channel) => Math.round(Number(channel)).toString(16).padStart(2, "0")).join("")}`;
}

const allowedColors = new Set((contract.allowedColors ?? []).map(normalizeHex).filter(Boolean));
const allowedFonts = new Set((contract.allowedFonts ?? []).map((font) => String(font).trim().toLowerCase()));
const exceptions = new Set((contract.exceptions ?? []).map((item) => item.id));
const { chromium } = loadRuntimePackage("playwright");
const browser = await launchBrowser(chromium, { headless: true });
const violations = [];

try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts?.ready);
  const slideCount = await page.locator("[data-pptx-slide]").count();
  if (slideCount === 0) {
    violations.push({ slide: 0, id: null, rule: "deck", value: "No [data-pptx-slide] elements found" });
  }

  for (let slideIndex = 0; slideIndex < slideCount; slideIndex += 1) {
    await page.evaluate((index) => {
      if (typeof window.__pptxShowSlide === "function") window.__pptxShowSlide(index);
      else document.querySelectorAll("[data-pptx-slide]").forEach((slide, i) => {
        slide.style.display = i === index ? "block" : "none";
      });
    }, slideIndex);
    const items = await page.locator("[data-pptx-slide]").nth(slideIndex).locator("[data-pptx]").evaluateAll((elements) => elements.map((element, index) => {
      const style = getComputedStyle(element);
      const colors = [];
      if (element.dataset.pptx === "text") colors.push(style.color);
      colors.push(style.backgroundColor);
      for (const side of ["Top", "Right", "Bottom", "Left"]) {
        if (style[`border${side}Style`] !== "none" && parseFloat(style[`border${side}Width`]) > 0) {
          colors.push(style[`border${side}Color`]);
        }
      }
      return {
        id: element.dataset.sourceId || element.id || `${element.dataset.pptx}-${index + 1}`,
        kind: element.dataset.pptx,
        colors,
        fontFamily: style.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
        borderRadius: Math.max(parseFloat(style.borderTopLeftRadius) || 0, parseFloat(style.borderTopRightRadius) || 0, parseFloat(style.borderBottomLeftRadius) || 0, parseFloat(style.borderBottomRightRadius) || 0),
        boxShadow: style.boxShadow,
        backgroundImage: style.backgroundImage,
      };
    }));

    for (const item of items) {
      if (exceptions.has(item.id)) continue;
      for (const rawColor of item.colors) {
        const color = normalizeHex(rawColor);
        if (color && allowedColors.size && !allowedColors.has(color)) violations.push({ slide: slideIndex + 1, id: item.id, rule: "color", value: color });
      }
      if ((item.kind === "text" || item.kind === "shape-text") && allowedFonts.size && !allowedFonts.has(item.fontFamily.toLowerCase())) {
        violations.push({ slide: slideIndex + 1, id: item.id, rule: "font", value: item.fontFamily });
      }
      if (Number.isFinite(contract.maxBorderRadiusPx) && item.borderRadius > contract.maxBorderRadiusPx + 0.1) {
        violations.push({ slide: slideIndex + 1, id: item.id, rule: "border-radius", value: item.borderRadius });
      }
      if (contract.allowShadows === false && item.boxShadow !== "none") {
        violations.push({ slide: slideIndex + 1, id: item.id, rule: "shadow", value: item.boxShadow });
      }
      if (contract.allowGradients === false && item.backgroundImage !== "none") {
        violations.push({ slide: slideIndex + 1, id: item.id, rule: "gradient", value: item.backgroundImage });
      }
    }
  }
} finally {
  await browser.close();
}

const result = { ok: violations.length === 0, mode: contract.mode, contract: contractPath, violations };
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (violations.length) process.exitCode = 1;
