#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs, requireArg } from "./runtime.mjs";

const args = parseArgs(process.argv.slice(2));
const intakePath = path.resolve(requireArg(args, "intake"));
const decisionPath = typeof args.decision === "string" ? path.resolve(args.decision) : null;
const findings = [];

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

const result = { ok: findings.length === 0, intake: intakePath, decision: decisionPath, findings };
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (findings.length) process.exitCode = 1;
