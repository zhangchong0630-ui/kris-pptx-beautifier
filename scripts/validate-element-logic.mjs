#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs, requireArg } from "./runtime.mjs";

const args = parseArgs(process.argv.slice(2));
const lockPath = path.resolve(requireArg(args, "lock"));
const logicPath = path.resolve(requireArg(args, "logic"));
const lock = JSON.parse(await fs.readFile(lockPath, "utf8"));
const logic = JSON.parse(await fs.readFile(logicPath, "utf8"));
const allowedRelations = new Set([
  "hierarchy",
  "sequence",
  "parallel",
  "comparison",
  "cycle",
  "cause-effect",
  "evidence",
  "annotation",
  "independent",
]);
const findings = [];

if (logic.version !== 1) findings.push("Logic map version must be 1");
if (logic.inventedChrome !== false) findings.push("inventedChrome must be false");

for (const lockedSlide of lock.slides ?? []) {
  const mapped = (logic.slides ?? []).find((slide) => slide.sourceSlide === lockedSlide.sourceSlide);
  if (!mapped) {
    findings.push(`Missing logic map for source slide ${lockedSlide.sourceSlide}`);
    continue;
  }
  if (!String(mapped.logicInvariant ?? "").trim()) {
    findings.push(`Slide ${lockedSlide.sourceSlide} has no logicInvariant`);
  }
  const elements = mapped.elements ?? [];
  const ids = elements.map((item) => item.sourceId);
  for (const item of lockedSlide.items ?? []) {
    const count = ids.filter((id) => id === item.sourceId).length;
    if (count !== 1) findings.push(`Slide ${lockedSlide.sourceSlide}: ${item.sourceId} appears ${count} times in logic map`);
  }
  for (const element of elements) {
    if (!String(element.role ?? "").trim()) findings.push(`Slide ${lockedSlide.sourceSlide}: ${element.sourceId} has no role`);
    if (!allowedRelations.has(element.relation)) {
      findings.push(`Slide ${lockedSlide.sourceSlide}: ${element.sourceId} has invalid relation ${element.relation}`);
    }
    if (!String(element.preservation ?? "").trim()) {
      findings.push(`Slide ${lockedSlide.sourceSlide}: ${element.sourceId} has no preservation rule`);
    }
  }
  if (!Array.isArray(mapped.componentPatterns) || mapped.componentPatterns.length === 0) {
    findings.push(`Slide ${lockedSlide.sourceSlide} has no componentPatterns`);
  }
}

const result = { ok: findings.length === 0, lock: lockPath, logic: logicPath, findings };
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (findings.length) process.exitCode = 1;
