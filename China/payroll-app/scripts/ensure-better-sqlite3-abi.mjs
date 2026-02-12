import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { getRebuildCommand, parseAbiTarget, shouldRebuild } from "./abi-switcher-core.mjs";

function run() {
  const target = parseAbiTarget(process.argv[2]);
  const cwd = process.cwd();
  const binaryPath = path.join(
    cwd,
    "node_modules",
    "better-sqlite3",
    "build",
    "Release",
    "better_sqlite3.node",
  );
  const markerPath = path.join(cwd, "node_modules", ".cache", "better-sqlite3-abi-target");
  const markerTarget = existsSync(markerPath) ? readFileSync(markerPath, "utf8").trim() : undefined;

  if (
    !shouldRebuild({
      target,
      markerTarget,
      binaryExists: existsSync(binaryPath),
    })
  ) {
    console.info(`[abi] better-sqlite3 already prepared for ${target}`);
    return;
  }

  const rebuild = getRebuildCommand(target);
  console.info(`[abi] rebuilding better-sqlite3 for ${target} ...`);
  const result = spawnSync(rebuild.command, rebuild.args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  if (!existsSync(binaryPath)) {
    throw new Error(`Rebuild finished but binary not found: ${binaryPath}`);
  }

  mkdirSync(path.dirname(markerPath), { recursive: true });
  writeFileSync(markerPath, `${target}\n`, "utf8");
  console.info(`[abi] switched better-sqlite3 ABI to ${target}`);
}

run();
