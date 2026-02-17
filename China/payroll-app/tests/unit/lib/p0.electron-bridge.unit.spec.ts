import { afterEach, describe, expect, it, vi } from "vitest";

import { loadExternalUiState, saveExternalUiState } from "@/lib/electron-store";

describe("P0 electron store bridge", () => {
  const original = window.payrollStore;

  afterEach(() => {
    if (original) {
      window.payrollStore = original;
    } else {
      delete window.payrollStore;
    }
  });

  it("returns null when preload bridge is unavailable", async () => {
    delete window.payrollStore;
    const result = await loadExternalUiState();
    expect(result).toBeNull();
  });

  it("reads ui state from preload bridge", async () => {
    const get = vi.fn().mockResolvedValue({ language: "zh-HK", selectedMonth: "2026-02" });
    window.payrollStore = {
      get,
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
    };

    const result = await loadExternalUiState();
    expect(get).toHaveBeenCalledWith("ui-state");
    expect(result).toEqual({ language: "zh-HK", selectedMonth: "2026-02" });
  });

  it("writes ui state to preload bridge", async () => {
    const set = vi.fn().mockResolvedValue(true);
    window.payrollStore = {
      get: vi.fn(),
      set,
      delete: vi.fn(),
      clear: vi.fn(),
    };

    await saveExternalUiState({ language: "en", selectedMonth: "2026-03" });
    expect(set).toHaveBeenCalledWith("ui-state", { language: "en", selectedMonth: "2026-03" });
  });
});
