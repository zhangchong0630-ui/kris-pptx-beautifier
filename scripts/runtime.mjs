import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

export function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) throw new Error(`Unexpected argument: ${key}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      args[key.slice(2)] = true;
    } else {
      args[key.slice(2)] = value;
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
  return process.env.CODEX_RUNTIME_NODE_MODULES || path.join(
    os.homedir(),
    ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules",
  );
}

export async function loadArtifactTool() {
  try {
    return await import("@oai/artifact-tool");
  } catch {
    const packageDir = path.join(runtimeNodeModules(), "@oai/artifact-tool");
    const candidates = [
      path.join(packageDir, "dist/node/artifact_tool.mjs"),
      path.join(packageDir, "dist/artifact_tool.mjs"),
    ];
    for (const candidate of candidates) {
      try {
        return await import(pathToFileURL(candidate).href);
      } catch {
        // Try the next known runtime entry point.
      }
    }
    throw new Error("Unable to load @oai/artifact-tool. Initialize an Artifact Tool workspace first.");
  }
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
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
  const executablePath = candidates.find((candidate) => fs.existsSync(candidate));
  if (executablePath) return chromium.launch({ ...options, executablePath });
  return chromium.launch(options);
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
