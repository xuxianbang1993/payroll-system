import { afterEach, describe, expect, it, vi } from "vitest";

import { loadDbRuntimeInfo, resetDbForTesting } from "@/lib/db-admin";

describe("P1 db admin bridge", () => {
  const original = window.payrollDbAdmin;

  afterEach(() => {
    if (original) {
      window.payrollDbAdmin = original;
    } else {
      delete window.payrollDbAdmin;
    }
  });

  it("returns null when db bridge is unavailable", async () => {
    delete window.payrollDbAdmin;
    const result = await loadDbRuntimeInfo();
    expect(result).toBeNull();
  });

  it("reads db runtime info from preload bridge", async () => {
    const getRuntimeInfo = vi.fn().mockResolvedValue({
      appEnv: "test",
      readSource: "legacy",
      writeMode: "legacy",
      dbPath: "/tmp/test.sqlite",
      schemaVersion: 1,
      pragmas: {
        journalMode: "wal",
        foreignKeys: 1,
      },
    });

    window.payrollDbAdmin = {
      getRuntimeInfo,
      reset: vi.fn(),
    };

    const result = await loadDbRuntimeInfo();

    expect(getRuntimeInfo).toHaveBeenCalledTimes(1);
    expect(result?.appEnv).toBe("test");
    expect(result?.schemaVersion).toBe(1);
  });

  it("calls reset via preload bridge", async () => {
    const reset = vi.fn().mockResolvedValue({
      clearedTables: ["settings", "companies"],
    });

    window.payrollDbAdmin = {
      getRuntimeInfo: vi.fn(),
      reset,
    };

    const result = await resetDbForTesting();

    expect(reset).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ clearedTables: ["settings", "companies"] });
  });
});
