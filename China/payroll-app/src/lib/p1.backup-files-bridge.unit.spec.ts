import { afterEach, describe, expect, it, vi } from "vitest";

import { openBackupJsonFile, saveBackupJsonFile } from "@/lib/p1-backup-files";

describe("P1 backup files preload bridge", () => {
  const original = window.payrollFiles;

  afterEach(() => {
    if (original) {
      window.payrollFiles = original;
    } else {
      delete window.payrollFiles;
    }
  });

  it("returns null-safe values when file bridge is unavailable", async () => {
    delete window.payrollFiles;

    await expect(saveBackupJsonFile({ orgName: "Acme", payload: { hello: "world" } })).resolves.toBeNull();
    await expect(openBackupJsonFile()).resolves.toBeNull();
  });

  it("invokes save/open channels and returns typed payloads", async () => {
    const saveBackupJson = vi.fn().mockResolvedValue({
      canceled: false,
      filePath: "/tmp/acme-backup.json",
      bytesWritten: 128,
    });
    const openBackupJson = vi.fn().mockResolvedValue({
      canceled: false,
      filePath: "/tmp/acme-backup.json",
      payload: {
        orgName: "Acme",
        employees: [],
      },
    });

    window.payrollFiles = {
      saveBackupJson,
      openBackupJson,
    };

    const saveResult = await saveBackupJsonFile({
      orgName: "Acme",
      payload: { orgName: "Acme", employees: [] },
    });
    const openResult = await openBackupJsonFile();

    expect(saveResult?.canceled).toBe(false);
    expect(saveResult?.filePath).toBe("/tmp/acme-backup.json");
    expect(openResult?.canceled).toBe(false);
    expect(openResult?.filePath).toBe("/tmp/acme-backup.json");
    expect((openResult?.payload as { orgName?: string })?.orgName).toBe("Acme");

    expect(saveBackupJson).toHaveBeenCalledTimes(1);
    expect(openBackupJson).toHaveBeenCalledTimes(1);
  });
});
