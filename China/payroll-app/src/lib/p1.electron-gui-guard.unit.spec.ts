import { describe, expect, it } from "vitest";

// @ts-ignore scripts module is runtime-only for Electron GUI guard
import { evaluateElectronGuiPolicy } from "../../scripts/electron-gui-guard-core.mjs";

describe("P1 electron GUI guard", () => {
  it("allows non-mac runtimes", () => {
    expect(evaluateElectronGuiPolicy({ CODEX_CI: "1" }, "linux").allowed).toBe(true);
  });

  it("blocks macOS Codex by default", () => {
    const result = evaluateElectronGuiPolicy({ CODEX_CI: "1" }, "darwin");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("desktop terminal");
  });

  it("allows macOS Codex when override is enabled", () => {
    expect(
      evaluateElectronGuiPolicy(
        { CODEX_CI: "1", ALLOW_ELECTRON_GUI_IN_CODEX: "1" },
        "darwin",
      ).allowed,
    ).toBe(true);
  });

  it("allows regular macOS shells", () => {
    expect(evaluateElectronGuiPolicy({}, "darwin").allowed).toBe(true);
  });
});
