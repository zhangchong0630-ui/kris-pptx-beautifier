#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { launchBrowser, loadArtifactTool, loadRuntimePackage, parseArgs, requireArg, writeBlob } from "./runtime.mjs";

const args = parseArgs(process.argv.slice(2));
const url = requireArg(args, "url");
const outputPptx = path.resolve(requireArg(args, "out"));
const qaDir = path.resolve(args["qa-dir"] || `${outputPptx}.qa`);
const { chromium } = loadRuntimePackage("playwright");
const { Presentation, PresentationFile } = await loadArtifactTool();

function parseCssColor(value, opacity = 1) {
  if (!value || value === "transparent") return "none";
  const match = value.match(/rgba?\((\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)[, ]+(\d+(?:\.\d+)?)(?:[, /]+(\d+(?:\.\d+)?))?\)/i);
  if (!match) return value;
  const alpha = Math.max(0, Math.min(1, Number(match[4] ?? 1) * opacity));
  if (alpha <= 0.001) return "none";
  const hex = [match[1], match[2], match[3]]
    .map((channel) => Math.round(Number(channel)).toString(16).padStart(2, "0"))
    .join("");
  return alpha >= 0.995 ? `#${hex}` : `#${hex}/${Math.round(alpha * 100)}`;
}

function splitCssArgs(value) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === "(") depth += 1;
    else if (value[index] === ")") depth -= 1;
    else if (value[index] === "," && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(value.slice(start).trim());
  return parts;
}

function parseFill(backgroundImage, backgroundColor, opacity = 1) {
  const match = String(backgroundImage || "").match(/^linear-gradient\((.*)\)$/i);
  if (!match) return parseCssColor(backgroundColor, opacity);
  const parts = splitCssArgs(match[1]);
  let angleDeg = 180;
  if (/^-?\d+(?:\.\d+)?deg$/i.test(parts[0])) angleDeg = Number(parts.shift().replace(/deg/i, ""));
  const stops = parts.map((part, index) => {
    const colorMatch = part.match(/(rgba?\([^)]*\)|#[0-9a-f]{3,8})/i);
    if (!colorMatch) return null;
    const remainder = part.slice((colorMatch.index ?? 0) + colorMatch[0].length);
    const offsetMatch = remainder.match(/(-?\d+(?:\.\d+)?)%/);
    const offset = offsetMatch ? Number(offsetMatch[1]) : (parts.length === 1 ? 0 : index * 100 / (parts.length - 1));
    return { offset: Math.max(0, Math.min(100000, Math.round(offset * 1000))), color: parseCssColor(colorMatch[1], opacity) };
  }).filter((stop) => stop?.color && stop.color !== "none");
  if (stops.length < 2) return parseCssColor(backgroundColor, opacity);
  return { type: "gradient", gradientKind: "linear", angleDeg, stops };
}

function shadowToken(value) {
  if (!value || value === "none") return "shadow-none";
  const cleaned = value.replace(/\binset\b/gi, "");
  const lengths = cleaned.match(/-?\d+(?:\.\d+)?(?:px|pt|rem|em)/g) ?? [];
  const blur = lengths.length >= 3 ? Math.abs(parseFloat(lengths[2])) : 0;
  if (blur <= 4) return "shadow-sm";
  if (blur <= 12) return "shadow-md";
  return "shadow-lg";
}

function position(rect, scaleX = 1, scaleY = 1) {
  return {
    left: Math.max(0, rect.left * scaleX),
    top: Math.max(0, rect.top * scaleY),
    width: Math.max(0.1, rect.width * scaleX),
    height: Math.max(0.1, rect.height * scaleY),
  };
}

function textAlignment(item) {
  const explicit = item.textAlignment;
  if (["left", "center", "right", "justify"].includes(explicit)) return explicit;
  if (["center", "right", "justify"].includes(item.style.textAlign)) return item.style.textAlign;
  if (item.style.display.includes("flex")) {
    if (item.style.justifyContent === "center") return "center";
    if (["flex-end", "end"].includes(item.style.justifyContent)) return "right";
  }
  return "left";
}

function textVerticalAlignment(item) {
  if (["top", "middle", "bottom"].includes(item.verticalAlignment)) return item.verticalAlignment;
  if (item.style.display.includes("flex")) {
    if (item.style.alignItems === "center") return "middle";
    if (["flex-end", "end"].includes(item.style.alignItems)) return "bottom";
  }
  return "top";
}

function textInsets(item, scale) {
  return {
    top: item.style.paddingTop * scale,
    right: item.style.paddingRight * scale,
    bottom: item.style.paddingBottom * scale,
    left: item.style.paddingLeft * scale,
  };
}

function textLineSpacing(item) {
  const text = item.text?.trim() || "";
  const isCenteredSingleLineShape = item.kind === "shape-text"
    && text.length > 0
    && !/[\r\n]/.test(text)
    && textAlignment(item) === "center"
    && textVerticalAlignment(item) === "middle";
  return isCenteredSingleLineShape ? 1 : item.style.lineHeight / item.style.fontSize;
}

function applyText(shape, item, fontScale) {
  shape.text = item.richRuns?.length
    ? item.richRuns.map((run) => ({
      run: run.text,
      textStyle: {
        fontSize: `${run.style.fontSize * fontScale}px`,
        typeface: run.style.fontFamily || item.style.fontFamily || "Arial",
        bold: run.style.fontWeight >= 600,
        italic: run.style.fontStyle === "italic",
        underline: run.style.textDecorationLine.includes("underline") ? "sng" : undefined,
        color: parseCssColor(run.style.color, run.style.opacity),
      },
      link: run.link ? { uri: run.link, isExternal: true } : undefined,
    }))
    : item.text;
  if (typeof shape.text !== "object" || shape.text === null) {
    throw new Error(`artifact-tool shape.text getter returned ${typeof shape.text}; expected a mutable text frame object`);
  }
  shape.text.style = {
    fontSize: item.style.fontSize * fontScale,
    typeface: item.style.fontFamily || "Arial",
    bold: item.style.fontWeight >= 600,
    italic: item.style.fontStyle === "italic",
    underline: item.style.textDecorationLine.includes("underline") ? "sng" : undefined,
    color: parseCssColor(item.style.color, item.style.opacity),
    alignment: textAlignment(item),
    verticalAlignment: textVerticalAlignment(item),
    lineSpacing: textLineSpacing(item),
    autoFit: "none",
    wrap: "square",
    insets: textInsets(item, fontScale),
  };
}

await fs.mkdir(path.dirname(outputPptx), { recursive: true });
await fs.mkdir(qaDir, { recursive: true });
const browser = await launchBrowser(chromium, { headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts?.ready);
  await page.evaluate(() => window.__pptxSetExportMode?.(true));

  const metadata = await page.evaluate(() => {
    const first = document.querySelector("[data-pptx-slide]");
    if (!first) throw new Error("No [data-pptx-slide] elements found");
    const rect = first.getBoundingClientRect();
    let notes = [];
    const node = document.querySelector("#speaker-notes[type='application/json']");
    if (node?.textContent?.trim()) notes = JSON.parse(node.textContent);
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      slideCount: document.querySelectorAll("[data-pptx-slide]").length,
      notes,
    };
  });

  if (metadata.width !== 1920 || metadata.height !== 1080) {
    throw new Error(`HTML slide stage must be exactly 1920x1080, got ${metadata.width}x${metadata.height}`);
  }
  if (metadata.notes.length > 0 && metadata.notes.length !== metadata.slideCount) {
    throw new Error(`#speaker-notes array length ${metadata.notes.length} does not match slide count ${metadata.slideCount}`);
  }

  const pptxWidth = Number(args["pptx-width"] ?? 1280);
  const pptxHeight = Number(args["pptx-height"] ?? 720);
  if (!Number.isFinite(pptxWidth) || !Number.isFinite(pptxHeight) || pptxWidth <= 0 || pptxHeight <= 0) {
    throw new Error("--pptx-width and --pptx-height must be positive numbers");
  }
  if (Math.abs(metadata.width / metadata.height - pptxWidth / pptxHeight) > 0.0001) {
    throw new Error(`HTML stage aspect ratio does not match PPTX size ${pptxWidth}x${pptxHeight}`);
  }
  const scaleX = pptxWidth / metadata.width;
  const scaleY = pptxHeight / metadata.height;
  const fontScale = Math.min(scaleX, scaleY);

  const presentation = Presentation.create({ slideSize: { width: pptxWidth, height: pptxHeight } });
  const exportLedger = [];

  for (let slideIndex = 0; slideIndex < metadata.slideCount; slideIndex += 1) {
    await page.evaluate((index) => {
      if (typeof window.__pptxShowSlide === "function") window.__pptxShowSlide(index);
      else document.querySelectorAll("[data-pptx-slide]").forEach((slide, i) => {
        slide.style.display = i === index ? "block" : "none";
      });
    }, slideIndex);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

    const captured = await page.locator("[data-pptx-slide]").nth(slideIndex).evaluate((slide, currentSlideIndex) => {
      const root = slide.getBoundingClientRect();
      const rootStyle = getComputedStyle(slide);
      const items = [...slide.querySelectorAll("[data-pptx]")].map((element, index) => {
        element.dataset.exportId = `s${String(currentSlideIndex + 1).padStart(2, "0")}-e${String(index + 1).padStart(3, "0")}`;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        const richRuns = [];
        if (element.dataset.pptx === "text" && element.hasAttribute("data-pptx-rich")) {
          const appendText = (text, owner) => {
            if (!text) return;
            const ownerStyle = getComputedStyle(owner);
            const link = owner.closest?.("a[href]")?.href || null;
            richRuns.push({
              text,
              link,
              style: {
                color: ownerStyle.color,
                fontFamily: ownerStyle.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
                fontSize: parseFloat(ownerStyle.fontSize) || 20,
                fontWeight: Number.parseInt(ownerStyle.fontWeight, 10) || (ownerStyle.fontWeight === "bold" ? 700 : 400),
                fontStyle: ownerStyle.fontStyle,
                textDecorationLine: ownerStyle.textDecorationLine,
                opacity: Number(ownerStyle.opacity || 1),
              },
            });
          };
          const walk = (node) => {
            if (node.nodeType === Node.TEXT_NODE) appendText(node.nodeValue, node.parentElement || element);
            else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") appendText("\n", node.parentElement || element);
            else for (const child of node.childNodes) walk(child);
          };
          walk(element);
        }
        return {
          exportId: element.dataset.exportId,
          sourceId: element.dataset.sourceId || null,
          kind: element.dataset.pptx,
          geometry: element.dataset.pptxGeometry || null,
          verticalAlignment: element.dataset.pptxValign || null,
          textAlignment: element.dataset.pptxAlign || null,
          tagName: element.tagName.toLowerCase(),
          text: ["text", "shape-text"].includes(element.dataset.pptx) ? element.innerText : "",
          src: element.tagName === "IMG" ? element.currentSrc || element.src : null,
          alt: element.getAttribute("alt") || element.dataset.alt || "",
          richRuns,
          rect: { left: rect.left - root.left, top: rect.top - root.top, width: rect.width, height: rect.height },
          style: {
            backgroundColor: style.backgroundColor,
            backgroundImage: style.backgroundImage,
            borderColor: style.borderTopColor,
            borderStyle: style.borderTopStyle,
            borderWidth: parseFloat(style.borderTopWidth) || 0,
            borderRadius: parseFloat(style.borderTopLeftRadius) || 0,
            boxShadow: style.boxShadow,
            color: style.color,
            fontFamily: style.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
            fontSize: parseFloat(style.fontSize) || 20,
            fontWeight: Number.parseInt(style.fontWeight, 10) || (style.fontWeight === "bold" ? 700 : 400),
            fontStyle: style.fontStyle,
            textDecorationLine: style.textDecorationLine,
            textAlign: style.textAlign,
            display: style.display,
            alignItems: style.alignItems,
            justifyContent: style.justifyContent,
            lineHeight: parseFloat(style.lineHeight) || (parseFloat(style.fontSize) || 20) * 1.2,
            paddingTop: parseFloat(style.paddingTop) || 0,
            paddingRight: parseFloat(style.paddingRight) || 0,
            paddingBottom: parseFloat(style.paddingBottom) || 0,
            paddingLeft: parseFloat(style.paddingLeft) || 0,
            opacity: Number(style.opacity || 1),
            objectFit: style.objectFit,
          },
        };
      });
      return { backgroundColor: rootStyle.backgroundColor, backgroundImage: rootStyle.backgroundImage, items };
    }, slideIndex);

    const slide = presentation.slides.add();
    slide.background.fill = parseFill(captured.backgroundImage, captured.backgroundColor);
    const rasterized = [];

    for (const item of captured.items) {
      if (item.kind === "shape") {
        const radius = item.style.borderRadius;
        const geometry = item.geometry || (radius >= Math.min(item.rect.width, item.rect.height) / 2 ? "ellipse" : radius > 0 ? "roundRect" : "rect");
        const shape = slide.shapes.add({
          geometry,
          name: item.sourceId || item.exportId,
          position: position(item.rect, scaleX, scaleY),
          fill: parseFill(item.style.backgroundImage, item.style.backgroundColor, item.style.opacity),
          line: item.style.borderStyle === "none" || item.style.borderWidth === 0
            ? { style: "solid", fill: "none", width: 0 }
            : { style: "solid", fill: parseCssColor(item.style.borderColor, item.style.opacity), width: item.style.borderWidth * fontScale },
          borderRadius: ["rect", "roundRect", "textbox"].includes(geometry) && radius ? radius * fontScale : undefined,
          shadow: shadowToken(item.style.boxShadow),
        });
        if (geometry === "line") shape.fill = "none";
      } else if (item.kind === "shape-text") {
        const radius = item.style.borderRadius;
        const geometry = item.geometry || (radius >= Math.min(item.rect.width, item.rect.height) / 2 ? "ellipse" : radius > 0 ? "roundRect" : "rect");
        const shape = slide.shapes.add({
          geometry,
          name: item.sourceId || item.exportId,
          position: position(item.rect, scaleX, scaleY),
          fill: parseFill(item.style.backgroundImage, item.style.backgroundColor, item.style.opacity),
          line: item.style.borderStyle === "none" || item.style.borderWidth === 0
            ? { style: "solid", fill: "none", width: 0 }
            : { style: "solid", fill: parseCssColor(item.style.borderColor, item.style.opacity), width: item.style.borderWidth * fontScale },
          borderRadius: ["rect", "roundRect", "textbox"].includes(geometry) && radius ? radius * fontScale : undefined,
          shadow: shadowToken(item.style.boxShadow),
        });
        applyText(shape, item, fontScale);
      } else if (item.kind === "text") {
        const shape = slide.shapes.add({
          geometry: "textbox",
          name: item.sourceId || item.exportId,
          position: position(item.rect, scaleX, scaleY),
          fill: "none",
          line: { style: "solid", fill: "none", width: 0 },
        });
        applyText(shape, item, fontScale);
      } else if (item.kind === "image") {
        let added = false;
        let rasterizeReason = "no src";
        if (item.src) {
          try {
            const absoluteSrc = new URL(item.src, page.url()).href;
            const response = await page.request.get(absoluteSrc);
            if (!response.ok()) {
              rasterizeReason = `HTTP ${response.status()}`;
            } else {
              const contentType = response.headers()["content-type"]?.split(";")[0] || "image/png";
              if (!contentType.startsWith("image/")) {
                rasterizeReason = `unexpected content-type ${contentType}`;
              } else {
                const bytes = await response.body();
                slide.images.add({
                  blob: bytes,
                  contentType,
                  alt: item.alt || item.sourceId || "Slide image",
                  fit: item.style.objectFit === "contain" ? "contain" : "cover",
                  position: position(item.rect, scaleX, scaleY),
                  geometry: item.style.borderRadius > 0 ? "roundRect" : "rect",
                  borderRadius: item.style.borderRadius ? item.style.borderRadius * fontScale : undefined,
                });
                added = true;
              }
            }
          } catch (error) {
            rasterizeReason = error.message;
          }
        }
        if (!added) {
          const png = await page.locator(`[data-export-id="${item.exportId}"]`).screenshot({ type: "png", omitBackground: true });
          slide.images.add({ blob: png, contentType: "image/png", alt: item.alt || "Slide image", fit: "contain", position: position(item.rect, scaleX, scaleY) });
          rasterized.push({ id: item.sourceId || item.exportId, reason: rasterizeReason });
        }
      } else if (item.kind === "raster") {
        const png = await page.locator(`[data-export-id="${item.exportId}"]`).screenshot({ type: "png", omitBackground: true });
        slide.images.add({ blob: png, contentType: "image/png", alt: item.alt || item.sourceId || "Rasterized slide region", fit: "contain", position: position(item.rect, scaleX, scaleY) });
        rasterized.push({ id: item.sourceId || item.exportId, reason: "data-pptx=raster" });
      } else {
        throw new Error(`Unsupported data-pptx kind: ${item.kind}`);
      }
    }

    const notes = metadata.notes[slideIndex];
    if (typeof notes === "string" && notes.trim()) {
      slide.speakerNotes.textFrame.setText(notes);
      slide.speakerNotes.setVisible(true);
    }
    const stem = `slide-${String(slideIndex + 1).padStart(2, "0")}`;
    await fs.writeFile(path.join(qaDir, `${stem}.html-layout.json`), `${JSON.stringify({
      slide: slideIndex + 1,
      scale: { x: scaleX, y: scaleY },
      items: captured.items.map((item) => ({
        name: item.sourceId || item.exportId,
        kind: item.kind,
        bbox: [item.rect.left * scaleX, item.rect.top * scaleY, item.rect.width * scaleX, item.rect.height * scaleY],
        textStyle: ["text", "shape-text"].includes(item.kind) ? {
          alignment: textAlignment(item),
          verticalAlignment: textVerticalAlignment(item),
          insets: textInsets(item, fontScale),
        } : null,
      })),
    }, null, 2)}\n`);
    await fs.writeFile(path.join(qaDir, `${stem}.html.png`), await page.locator("[data-pptx-slide]").nth(slideIndex).screenshot({ type: "png" }));
    exportLedger.push({ slide: slideIndex + 1, elements: captured.items.length, rasterized });
  }

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(outputPptx);

  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(path.join(qaDir, `${stem}.png`), await presentation.export({ slide, format: "png", scale: 1 }), fs);
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(qaDir, `${stem}.layout.json`), await layout.text());
  }
  await writeBlob(path.join(qaDir, "montage.webp"), await presentation.export({ format: "webp", montage: true, scale: 1 }), fs);
  await fs.writeFile(path.join(qaDir, "export-ledger.json"), `${JSON.stringify(exportLedger, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ ok: true, file: outputPptx, slides: metadata.slideCount, htmlStage: `${metadata.width}x${metadata.height}`, pptxStage: `${pptxWidth}x${pptxHeight}`, qaDir, exportLedger })}\n`);
} finally {
  await browser.close();
}
