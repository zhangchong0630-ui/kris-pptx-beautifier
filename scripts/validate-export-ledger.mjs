#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs, requireArg } from "./runtime.mjs";

const args = parseArgs(process.argv.slice(2));
const ledgerPath = path.resolve(requireArg(args, "ledger"));
const maxRasterizedRatio = Number(args["max-rasterized-ratio"] ?? 0.1);
if (!Number.isFinite(maxRasterizedRatio) || maxRasterizedRatio < 0 || maxRasterizedRatio > 1) {
  throw new Error("--max-rasterized-ratio must be a number between 0 and 1");
}

const ledger = JSON.parse(await fs.readFile(ledgerPath, "utf8"));
if (!Array.isArray(ledger)) {
  throw new Error(`Export ledger ${ledgerPath} must be a JSON array`);
}

const findings = [];
let totalElements = 0;
let totalRasterized = 0;

for (const slide of ledger) {
  const slideNumber = slide.slide;
  const slideElements = slide.elements ?? 0;
  const rasterized = slide.rasterized ?? [];
  totalElements += slideElements;
  totalRasterized += rasterized.length;
  for (const entry of rasterized) {
    const id = typeof entry === "string" ? entry : entry.id;
    const reason = typeof entry === "string" ? entry : entry.reason;
    if (/HTTP 404|unexpected content-type|net::ERR|ECONNREFUSED/i.test(String(reason))) {
      findings.push({ slide: slideNumber, id, reason, message: "rasterized for an unexpected reason" });
    }
  }
}

const ratio = totalElements > 0 ? totalRasterized / totalElements : 0;
if (ratio > maxRasterizedRatio) {
  findings.push({
    slide: null,
    id: null,
    reason: null,
    message: `rasterized ${totalRasterized}/${totalElements} elements (${(ratio * 100).toFixed(1)}%) exceeds ${(maxRasterizedRatio * 100).toFixed(0)}% threshold`,
  });
}

const result = {
  ok: findings.length === 0,
  ledger: ledgerPath,
  totalElements,
  totalRasterized,
  ratio: Number(ratio.toFixed(4)),
  findings,
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (findings.length) process.exitCode = 1;
