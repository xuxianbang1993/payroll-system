import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { resolveRendererIndexPath } from "../../electron/app-paths";

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "payroll-app-paths-"));
  tempDirs.push(dir);
  return dir;
}

function touchFile(filePath: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, "<html></html>", "utf8");
}

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tempDirs.length = 0;
});

describe("P1 electron app paths", () => {
  it("resolves ../dist/index.html for legacy dist-electron/main.js layout", () => {
    const root = createTempDir();
    const moduleDir = path.join(root, "dist-electron");
    mkdirSync(moduleDir, { recursive: true });
    const rendererIndex = path.join(root, "dist", "index.html");
    touchFile(rendererIndex);

    expect(resolveRendererIndexPath(moduleDir, { cwd: root })).toBe(rendererIndex);
  });

  it("falls back to ../../dist/index.html for dist-electron/electron/main.js layout", () => {
    const root = createTempDir();
    const moduleDir = path.join(root, "dist-electron", "electron");
    mkdirSync(moduleDir, { recursive: true });
    const rendererIndex = path.join(root, "dist", "index.html");
    touchFile(rendererIndex);

    expect(resolveRendererIndexPath(moduleDir, { cwd: root })).toBe(rendererIndex);
  });

  it("throws a clear error when renderer index file cannot be found", () => {
    const root = createTempDir();
    const moduleDir = path.join(root, "dist-electron", "electron");
    mkdirSync(moduleDir, { recursive: true });

    expect(() => resolveRendererIndexPath(moduleDir, { cwd: root })).toThrow(
      "Cannot resolve renderer index path",
    );
  });
});
