import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

function parseValue(raw) {
  if (raw === "true") return true;
  if (raw === "false") return false;
  return raw;
}

export function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (!raw.startsWith("--")) throw new Error(`Unexpected argument: ${raw}`);
    const equalsIndex = raw.indexOf("=");
    if (equalsIndex >= 0) {
      const key = raw.slice(2, equalsIndex);
      if (!key) throw new Error(`Unexpected argument: ${raw}`);
      args[key] = parseValue(raw.slice(equalsIndex + 1));
      continue;
    }
    const key = raw.slice(2);
    if (!key) throw new Error(`Unexpected argument: ${raw}`);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = parseValue(value);
      index += 1;
    }
  }
  return args;
}

export function requireArg(args, name) {
  const value = args[name];
  if (typeof value !== "string" || !value) throw new Error(`Missing --${name}`);
  return value;
}

export function runtimeNodeModules() {
  return (
    process.env.PPTX_BEAUTIFIER_NODE_MODULES
    || process.env.CODEX_RUNTIME_NODE_MODULES
    || path.join(os.homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules")
  );
}

export async function loadArtifactTool() {
  const failures = [];
  try {
    return await import("@oai/artifact-tool");
  } catch (error) {
    failures.push(error);
  }
  const packageDir = path.join(runtimeNodeModules(), "@oai/artifact-tool");
  const candidates = [
    path.join(packageDir, "dist/node/artifact_tool.mjs"),
    path.join(packageDir, "dist/artifact_tool.mjs"),
  ];
  for (const candidate of candidates) {
    try {
      return await import(pathToFileURL(candidate).href);
    } catch (error) {
      failures.push(error);
    }
  }
  const details = failures.map((error) => error.message).join(" | ");
  throw new Error(
    `Unable to load @oai/artifact-tool. Install it (npm i @oai/artifact-tool) or set PPTX_BEAUTIFIER_NODE_MODULES / CODEX_RUNTIME_NODE_MODULES to a directory containing it. Tried: ${details}`,
  );
}

export function loadRuntimePackage(name) {
  try {
    return require(name);
  } catch {
    return require(path.join(runtimeNodeModules(), name));
  }
}

export async function launchBrowser(chromium, options = {}) {
  const candidates = [
    process.env.PPTX_BEAUTIFIER_BROWSER,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
  const executablePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (executablePath) return chromium.launch({ ...options, executablePath });
  if (process.env.PPTX_BEAUTIFIER_BROWSER) {
    throw new Error(`PPTX_BEAUTIFIER_BROWSER is set to ${process.env.PPTX_BEAUTIFIER_BROWSER}, but that file does not exist`);
  }
  try {
    return await chromium.launch(options);
  } catch (error) {
    throw new Error(
      `No system browser found and Playwright's bundled Chromium is unavailable. Run "npx playwright install chromium" or set PPTX_BEAUTIFIER_BROWSER to a Chrome/Edge executable. Original error: ${error.message}`,
    );
  }
}

export function normalizeText(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

export async function writeBlob(filePath, blob, fs) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}
