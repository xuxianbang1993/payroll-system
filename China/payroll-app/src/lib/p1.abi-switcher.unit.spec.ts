import { describe, expect, it } from "vitest";

// @ts-ignore scripts module is runtime-only for ABI switching
import { getRebuildCommand, parseAbiTarget, shouldRebuild } from "../../scripts/abi-switcher-core.mjs";

describe("P1 ABI switcher core", () => {
  it("parses valid abi targets", () => {
    expect(parseAbiTarget("node")).toBe("node");
    expect(parseAbiTarget("electron")).toBe("electron");
  });

  it("throws for invalid abi target", () => {
    expect(() => parseAbiTarget("foo")).toThrow("Invalid ABI target");
  });

  it("skips rebuild when marker matches and binary exists", () => {
    expect(
      shouldRebuild({
        target: "node",
        markerTarget: "node",
        binaryExists: true,
      }),
    ).toBe(false);
  });

  it("rebuilds when marker mismatches", () => {
    expect(
      shouldRebuild({
        target: "electron",
        markerTarget: "node",
        binaryExists: true,
      }),
    ).toBe(true);
  });

  it("rebuilds when binary is missing", () => {
    expect(
      shouldRebuild({
        target: "electron",
        markerTarget: "electron",
        binaryExists: false,
      }),
    ).toBe(true);
  });

  it("resolves rebuild command for both runtimes", () => {
    expect(getRebuildCommand("node")).toEqual({
      command: "npm",
      args: ["rebuild", "better-sqlite3"],
    });

    expect(getRebuildCommand("electron")).toEqual({
      command: "npx",
      args: ["@electron/rebuild", "-f", "-w", "better-sqlite3"],
    });
  });
});
