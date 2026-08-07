import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { parseArgs, requireArg } from "./runtime.mjs";

const execFileAsync = promisify(execFile);
const MAX_BUFFER = 64 * 1024 * 1024;

function safeLabel(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "command";
}

function resolveBinary(args) {
  return args.officecli || process.env.OFFICECLI_BIN || "officecli";
}

function commandPlan(mode, pptx) {
  if (mode === "inspect") {
    return [
      ["view", pptx, "outline"],
      ["view", pptx, "annotated"],
      ["view", pptx, "stats"],
      ["view", pptx, "issues"],
      ["view", pptx, "html"],
    ];
  }
  return [
    ["validate", pptx],
    ["view", pptx, "issues"],
    ["view", pptx, "stats"],
    ["view", pptx, "html"],
  ];
}

async function runCommand(binary, command, outDir, index) {
  const label = `${String(index + 1).padStart(2, "0")}-${safeLabel(command.join("-"))}`;
  const stdoutPath = path.join(outDir, `${label}.stdout.txt`);
  const stderrPath = path.join(outDir, `${label}.stderr.txt`);
  try {
    const result = await execFileAsync(binary, command, {
      maxBuffer: MAX_BUFFER,
      windowsHide: true,
    });
    await fs.writeFile(stdoutPath, result.stdout || "", "utf8");
    await fs.writeFile(stderrPath, result.stderr || "", "utf8");
    return {
      args: command,
      exitCode: 0,
      stdout: path.basename(stdoutPath),
      stderr: path.basename(stderrPath),
    };
  } catch (error) {
    await fs.writeFile(stdoutPath, error.stdout || "", "utf8");
    await fs.writeFile(stderrPath, error.stderr || error.message || "", "utf8");
    return {
      args: command,
      exitCode: typeof error.code === "number" ? error.code : 1,
      stdout: path.basename(stdoutPath),
      stderr: path.basename(stderrPath),
      error: error.message,
    };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = requireArg(args, "mode");
  const pptx = requireArg(args, "pptx");
  const outDir = requireArg(args, "out");
  if (!new Set(["inspect", "qa"]).has(mode)) {
    throw new Error(`Unsupported --mode: ${mode}. Use inspect or qa.`);
  }
  await fs.mkdir(outDir, { recursive: true });

  const binary = resolveBinary(args);
  let version = null;
  try {
    const result = await execFileAsync(binary, ["--version"], {
      maxBuffer: 1024 * 1024,
      windowsHide: true,
    });
    version = (result.stdout || result.stderr || "").trim();
  } catch (error) {
    throw new Error(
      `OfficeCLI is not available. Install it separately or set --officecli/OFFICECLI_BIN. ${error.message}`,
    );
  }

  const commands = commandPlan(mode, pptx);
  const results = [];
  for (let index = 0; index < commands.length; index += 1) {
    results.push(await runCommand(binary, commands[index], outDir, index));
  }

  const manifest = {
    binary,
    version,
    mode,
    pptx: path.resolve(pptx),
    generatedAt: new Date().toISOString(),
    commands: results,
    success: results.every((result) => result.exitCode === 0),
  };
  await fs.writeFile(
    path.join(outDir, "officecli-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
  if (!manifest.success) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
