#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs, requireArg } from "./runtime.mjs";

const args = parseArgs(process.argv.slice(2));
const intakePath = path.resolve(requireArg(args, "intake"));
const decisionPath = typeof args.decision === "string" ? path.resolve(args.decision) : null;
const assetsPath = typeof args.assets === "string" ? path.resolve(args.assets) : null;
const findings = [];

function hasReason(value, minimum = 20) {
  return typeof value === "string" && value.trim().length >= minimum;
}

async function validateLocalAsset(assetPath, field, message) {
  if (typeof assetPath !== "string" || !path.isAbsolute(assetPath)) {
    findings.push({ contract: "assets", field, message });
    return;
  }
  try {
    await fs.access(assetPath);
  } catch {
    findings.push({ contract: "assets", field, message: `${message}; file does not exist` });
  }
}

const intake = JSON.parse(await fs.readFile(intakePath, "utf8"));
const allowed = {
  outputMode: ["standalone-selected", "replace-in-copy", "full-rebuild"],
  colorPolicy: ["source-strict", "brand-refine", "new-palette"],
  copyPolicy: ["locked", "light-edit", "rewrite"],
  visualDirection: ["brand-polish", "data-rational", "modern-tech", "minimal-editorial", "AI-recommend"],
  approvalMode: ["recommend-and-confirm", "AI-direct", "preview-first"],
  editability: ["editable-first", "mixed-approved"],
};

for (const [key, values] of Object.entries(allowed)) {
  if (!values.includes(intake[key])) findings.push({ contract: "intake", field: key, message: `Expected one of: ${values.join(", ")}` });
}

if (intake.outputMode !== "full-rebuild") {
  if (!Array.isArray(intake.selectedSlides) || !intake.selectedSlides.length) {
    findings.push({ contract: "intake", field: "selectedSlides", message: "Selected output requires at least one 1-based slide number" });
  } else if (intake.selectedSlides.some((value) => !Number.isInteger(value) || value < 1)) {
    findings.push({ contract: "intake", field: "selectedSlides", message: "Slide numbers must be positive integers" });
  }
}

if (intake.colorPolicy === "new-palette" && intake.paletteApproval !== "approved") {
  findings.push({ contract: "intake", field: "paletteApproval", message: "new-palette requires explicit approval" });
}

if (["light-edit", "rewrite"].includes(intake.copyPolicy) && intake.copyApproval !== "approved") {
  findings.push({ contract: "intake", field: "copyApproval", message: `${intake.copyPolicy} requires explicit approval` });
}

if (decisionPath) {
  const decision = JSON.parse(await fs.readFile(decisionPath, "utf8"));
  if (typeof decision.primarySystem !== "string" || !decision.primarySystem.trim()) {
    findings.push({ contract: "design", field: "primarySystem", message: "A primary design system is required" });
  }
  if (typeof decision.reason !== "string" || decision.reason.trim().length < 20) {
    findings.push({ contract: "design", field: "reason", message: "Record a specific design-system rationale" });
  }
  if (!Array.isArray(decision.slides) || !decision.slides.length) {
    findings.push({ contract: "design", field: "slides", message: "Map every output slide to a logic and pattern" });
  }
  const status = decision.approvalStatus;
  if (intake.approvalMode !== "AI-direct" && status !== "approved") {
    findings.push({ contract: "design", field: "approvalStatus", message: `${intake.approvalMode} requires user approval before authoring` });
  }
}

if (assetsPath) {
  const assets = JSON.parse(await fs.readFile(assetsPath, "utf8"));
  const iconModes = ["preserve-only", "library-match", "native-symbols", "none"];
  const imageModes = ["source-only", "verified-library", "ai-generate", "mixed-approved", "none"];
  const userChoices = ["recommended", "alternative", "custom"];
  const iconActions = ["preserve", "add", "replace", "remove", "none"];
  const imageActions = ["preserve", "search", "generate", "replace", "remove", "none"];

  if (assets.approvalStatus !== "approved") {
    findings.push({ contract: "assets", field: "approvalStatus", message: "Visual asset plan requires explicit user approval before authoring" });
  }

  const iconDecision = assets.iconDecision ?? {};
  if (!iconModes.includes(iconDecision.mode)) {
    findings.push({ contract: "assets", field: "iconDecision.mode", message: `Expected one of: ${iconModes.join(", ")}` });
  }
  if (!hasReason(iconDecision.reason)) {
    findings.push({ contract: "assets", field: "iconDecision.reason", message: "Record a specific icon-strategy rationale" });
  }
  if (!userChoices.includes(iconDecision.userChoice)) {
    findings.push({ contract: "assets", field: "iconDecision.userChoice", message: `Expected one of: ${userChoices.join(", ")}` });
  }
  if (iconDecision.mode === "library-match" && (typeof iconDecision.library !== "string" || !iconDecision.library.trim())) {
    findings.push({ contract: "assets", field: "iconDecision.library", message: "library-match requires one approved icon library" });
  }

  const imageDecision = assets.imageDecision ?? {};
  if (!imageModes.includes(imageDecision.mode)) {
    findings.push({ contract: "assets", field: "imageDecision.mode", message: `Expected one of: ${imageModes.join(", ")}` });
  }
  if (!hasReason(imageDecision.reason)) {
    findings.push({ contract: "assets", field: "imageDecision.reason", message: "Record a specific image-strategy rationale" });
  }
  if (!userChoices.includes(imageDecision.userChoice)) {
    findings.push({ contract: "assets", field: "imageDecision.userChoice", message: `Expected one of: ${userChoices.join(", ")}` });
  }

  if (!Array.isArray(assets.slides) || !assets.slides.length) {
    findings.push({ contract: "assets", field: "slides", message: "Record icon and image actions for every output slide" });
  } else {
    const seenSlides = new Set();
    let generatedImages = 0;

    for (const [index, slide] of assets.slides.entries()) {
      const prefix = `slides[${index}]`;
      if (!Number.isInteger(slide.sourceSlide) || slide.sourceSlide < 1) {
        findings.push({ contract: "assets", field: `${prefix}.sourceSlide`, message: "sourceSlide must be a positive 1-based integer" });
      } else if (seenSlides.has(slide.sourceSlide)) {
        findings.push({ contract: "assets", field: `${prefix}.sourceSlide`, message: "Each source slide must appear once" });
      } else {
        seenSlides.add(slide.sourceSlide);
      }

      const icon = slide.icon ?? {};
      if (!iconActions.includes(icon.action)) {
        findings.push({ contract: "assets", field: `${prefix}.icon.action`, message: `Expected one of: ${iconActions.join(", ")}` });
      }
      if (!hasReason(icon.reason, 12)) {
        findings.push({ contract: "assets", field: `${prefix}.icon.reason`, message: "Explain why this slide does or does not need an icon" });
      }
      if (["add", "replace"].includes(icon.action)) {
        if (typeof icon.semanticRole !== "string" || !icon.semanticRole.trim()) {
          findings.push({ contract: "assets", field: `${prefix}.icon.semanticRole`, message: "New icons require a semantic role from the element-logic map" });
        }
        if (typeof icon.asset !== "string" || !icon.asset.trim()) {
          findings.push({ contract: "assets", field: `${prefix}.icon.asset`, message: "New icons require an approved asset name" });
        }
      }
      if (iconDecision.mode === "preserve-only" && ["add", "replace"].includes(icon.action)) {
        findings.push({ contract: "assets", field: `${prefix}.icon.action`, message: "preserve-only cannot add or replace icons" });
      }
      if (iconDecision.mode === "none" && icon.action !== "none") {
        findings.push({ contract: "assets", field: `${prefix}.icon.action`, message: "Icon mode none requires action none on every slide" });
      }

      const image = slide.image ?? {};
      if (!imageActions.includes(image.action)) {
        findings.push({ contract: "assets", field: `${prefix}.image.action`, message: `Expected one of: ${imageActions.join(", ")}` });
      }
      if (!hasReason(image.reason, 12)) {
        findings.push({ contract: "assets", field: `${prefix}.image.reason`, message: "Explain why this slide does or does not need an image" });
      }
      if (imageDecision.mode === "source-only" && ["search", "generate", "replace"].includes(image.action)) {
        findings.push({ contract: "assets", field: `${prefix}.image.action`, message: "source-only cannot search, generate, or replace images" });
      }
      if (imageDecision.mode === "verified-library" && image.action === "generate") {
        findings.push({ contract: "assets", field: `${prefix}.image.action`, message: "verified-library cannot generate images" });
      }
      if (imageDecision.mode === "none" && image.action !== "none") {
        findings.push({ contract: "assets", field: `${prefix}.image.action`, message: "Image mode none requires action none on every slide" });
      }

      if (image.action === "generate") {
        generatedImages += 1;
        if (image.candidateApprovalStatus !== "approved") {
          findings.push({ contract: "assets", field: `${prefix}.image.candidateApprovalStatus`, message: "Generated-image candidate requires explicit user approval" });
        }
        await validateLocalAsset(image.selectedAsset, `${prefix}.image.selectedAsset`, "Generated image requires an approved absolute local asset path");
      }

      if (["search", "replace"].includes(image.action)) {
        await validateLocalAsset(image.selectedAsset, `${prefix}.image.selectedAsset`, "External image requires an absolute local asset path");
        if (typeof image.sourceUrl !== "string" || !image.sourceUrl.trim()) {
          findings.push({ contract: "assets", field: `${prefix}.image.sourceUrl`, message: "External image requires provenance" });
        }
        if (typeof image.licenseOrPermission !== "string" || !image.licenseOrPermission.trim()) {
          findings.push({ contract: "assets", field: `${prefix}.image.licenseOrPermission`, message: "External image requires license or permission details" });
        }
      }
    }

    if (intake.outputMode !== "full-rebuild" && Array.isArray(intake.selectedSlides)) {
      const expectedSlides = new Set(intake.selectedSlides);
      for (const slideNumber of expectedSlides) {
        if (!seenSlides.has(slideNumber)) findings.push({ contract: "assets", field: "slides", message: `Missing visual asset decision for selected slide ${slideNumber}` });
      }
      for (const slideNumber of seenSlides) {
        if (!expectedSlides.has(slideNumber)) findings.push({ contract: "assets", field: "slides", message: `Visual asset plan includes unselected slide ${slideNumber}` });
      }
    }

    if (generatedImages > 0) {
      if (imageDecision.generationAllowed !== true) {
        findings.push({ contract: "assets", field: "imageDecision.generationAllowed", message: "Generated images require explicit generation approval" });
      }
      if (imageDecision.candidateApprovalStatus !== "approved") {
        findings.push({ contract: "assets", field: "imageDecision.candidateApprovalStatus", message: "All generated-image candidates must be approved before authoring" });
      }
    }
  }
}

const result = { ok: findings.length === 0, intake: intakePath, decision: decisionPath, assets: assetsPath, findings };
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (findings.length) process.exitCode = 1;
