#!/usr/bin/env node

import { launchBrowser, loadRuntimePackage, parseArgs, requireArg } from "./runtime.mjs";

const args = parseArgs(process.argv.slice(2));
const url = requireArg(args, "url");
const minimumBodyPx = Number(args["min-font"] ?? 30);
const { chromium } = loadRuntimePackage("playwright");
const browser = await launchBrowser(chromium, { headless: true });
const findings = [];

try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts?.ready);
  await page.evaluate(() => window.__pptxSetExportMode?.(true));
  const slideCount = await page.locator("[data-pptx-slide]").count();

  for (let index = 0; index < slideCount; index += 1) {
    await page.evaluate((slideIndex) => {
      if (typeof window.__pptxShowSlide === "function") window.__pptxShowSlide(slideIndex);
      else document.querySelectorAll("[data-pptx-slide]").forEach((slide, i) => {
        slide.style.display = i === slideIndex ? "block" : "none";
      });
    }, index);

    const slideFindings = await page.locator("[data-pptx-slide]").nth(index).evaluate((slide, minFont) => {
      const problems = [];
      const root = slide.getBoundingClientRect();
      if (Math.round(root.width) !== 1920 || Math.round(root.height) !== 1080) {
        problems.push(`Slide stage must be exactly 1920x1080, got ${Math.round(root.width)}x${Math.round(root.height)}`);
      }
      const marked = [...slide.querySelectorAll("[data-pptx]")];
      const rects = [];

      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
      };

      for (const element of marked) {
        if (!visible(element)) continue;
        const kind = element.dataset.pptx;
        const rect = element.getBoundingClientRect();
        const id = element.dataset.sourceId || element.id || `${kind}:${marked.indexOf(element) + 1}`;
        if (rect.left < root.left - 0.5 || rect.top < root.top - 0.5 || rect.right > root.right + 0.5 || rect.bottom > root.bottom + 0.5) {
          problems.push(`${id} exceeds slide bounds`);
        }
        if (kind === "text" || kind === "shape-text") {
          const style = getComputedStyle(element);
          const fontSize = parseFloat(style.fontSize);
          if (fontSize < minFont && !element.hasAttribute("data-allow-small-text")) {
            problems.push(`${id} uses ${fontSize}px text below ${minFont}px`);
          }
          if (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1) {
            problems.push(`${id} clips or scrolls its text`);
          }
          rects.push({ id, rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }, allow: element.hasAttribute("data-allow-overlap") });
        }
        if (kind !== "raster" && getComputedStyle(element).transform !== "none") {
          problems.push(`${id} uses a CSS transform but is not rasterized`);
        }
      }

      const leafText = [...slide.querySelectorAll("*")].filter((element) => {
        if (!visible(element) || element.children.length) return false;
        return (element.textContent || "").trim().length > 0;
      });
      for (const element of leafText) {
        if (!element.closest("[data-pptx]")) problems.push(`Visible text is unmarked: ${(element.textContent || "").trim().slice(0, 60)}`);
      }
      for (const element of slide.querySelectorAll("img,svg,canvas")) {
        if (visible(element) && !element.closest("[data-pptx]")) problems.push(`Visible ${element.tagName.toLowerCase()} is unmarked`);
      }

      const near = (values, tolerance = 1) => Math.max(...values) - Math.min(...values) <= tolerance;
      const cluster = (items, key, tolerance = 2) => {
        const groups = [];
        for (const item of [...items].sort((a, b) => a[key] - b[key])) {
          const group = groups.find((candidate) => Math.abs(candidate[0][key] - item[key]) <= tolerance);
          if (group) group.push(item);
          else groups.push([item]);
        }
        return groups;
      };

      for (const group of slide.querySelectorAll("[data-layout-group]")) {
        if (!visible(group)) continue;
        const name = group.dataset.layoutGroup || "unnamed-layout-group";
        const checks = String(group.dataset.layoutCheck || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
        const items = [...group.querySelectorAll(":scope > [data-layout-item]")]
          .filter(visible)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              left: rect.left,
              right: rect.right,
              top: rect.top,
              bottom: rect.bottom,
              width: rect.width,
              height: rect.height,
              centerX: rect.left + rect.width / 2,
              centerY: rect.top + rect.height / 2,
            };
          });
        if (items.length < 2) {
          problems.push(`${name} needs at least two visible data-layout-item children`);
          continue;
        }
        const checkEqual = (token, key) => {
          if (checks.includes(token) && !near(items.map((item) => item[key]))) problems.push(`${name} fails ${token}`);
        };
        checkEqual("equal-width", "width");
        checkEqual("equal-height", "height");
        checkEqual("align-left", "left");
        checkEqual("align-right", "right");
        checkEqual("align-top", "top");
        checkEqual("align-bottom", "bottom");

        if (checks.includes("equal-x-gap")) {
          const gaps = cluster(items, "top").flatMap((row) => {
            const ordered = [...row].sort((a, b) => a.left - b.left);
            return ordered.slice(1).map((item, index) => item.left - ordered[index].right);
          });
          if (gaps.length > 1 && !near(gaps)) problems.push(`${name} fails equal-x-gap`);
        }
        if (checks.includes("equal-y-gap")) {
          const gaps = cluster(items, "left").flatMap((column) => {
            const ordered = [...column].sort((a, b) => a.top - b.top);
            return ordered.slice(1).map((item, index) => item.top - ordered[index].bottom);
          });
          if (gaps.length > 1 && !near(gaps)) problems.push(`${name} fails equal-y-gap`);
        }
      }

      for (let a = 0; a < rects.length; a += 1) {
        for (let b = a + 1; b < rects.length; b += 1) {
          if (rects[a].allow || rects[b].allow) continue;
          const width = Math.min(rects[a].rect.right, rects[b].rect.right) - Math.max(rects[a].rect.left, rects[b].rect.left);
          const height = Math.min(rects[a].rect.bottom, rects[b].rect.bottom) - Math.max(rects[a].rect.top, rects[b].rect.top);
          if (width > 2 && height > 2) problems.push(`Text overlap: ${rects[a].id} with ${rects[b].id}`);
        }
      }
      return problems;
    }, minimumBodyPx);

    findings.push(...slideFindings.map((message) => ({ slide: index + 1, message })));
  }
} finally {
  await browser.close();
}

const result = { ok: findings.length === 0, findings };
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (findings.length) process.exitCode = 1;
