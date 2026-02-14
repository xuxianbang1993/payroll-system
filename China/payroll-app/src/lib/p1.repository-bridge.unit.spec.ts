import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearRepositoryData,
  exportRepositoryBackup,
  importRepositoryBackup,
  listRepositoryEmployees,
  loadRepositorySettings,
  loadRepositoryStorageInfo,
  replaceRepositoryEmployees,
  saveRepositorySettings,
} from "@/lib/p1-repository";

const socialConfig = {
  compPension: 16,
  compLocalPension: 1,
  compUnemploy: 0.8,
  compMedical: 5,
  compInjury: 0.4,
  compMaternity: 0.5,
  workerPension: 8,
  workerUnemploy: 0.2,
  workerMedical: 2,
  pensionBase: 4775,
  unemploymentBase: 3000,
  medicalBase: 6727,
  injuryBase: 3000,
  maternityBase: 6727,
};

const employee = {
  id: 1,
  name: "Alice",
  idCard: "",
  companyShort: "AC",
  company: "Acme",
  dept: "",
  position: "",
  type: "管理" as const,
  baseSalary: 10000,
  subsidy: 0,
  hasSocial: true,
  hasLocalPension: true,
  fundAmount: 0,
};

describe("P1 repository preload bridge", () => {
  const original = window.payrollRepository;

  afterEach(() => {
    if (original) {
      window.payrollRepository = original;
    } else {
      delete window.payrollRepository;
    }
  });

  it("returns null-safe values when repository bridge is unavailable", async () => {
    delete window.payrollRepository;

    await expect(loadRepositorySettings()).resolves.toBeNull();
    await expect(listRepositoryEmployees()).resolves.toEqual([]);
    await expect(loadRepositoryStorageInfo()).resolves.toBeNull();
    await expect(exportRepositoryBackup()).resolves.toBeNull();
    await expect(saveRepositorySettings({ orgName: "A", social: socialConfig, companies: [] })).resolves.toBeNull();
    await expect(replaceRepositoryEmployees([])).resolves.toBeNull();
    await expect(importRepositoryBackup({})).resolves.toBeNull();
    await expect(clearRepositoryData()).resolves.toBeNull();
  });

  it("invokes each repository channel and returns typed payloads", async () => {
    const getSettings = vi.fn().mockResolvedValue({ orgName: "Acme", social: socialConfig, companies: [] });
    const saveSettings = vi.fn().mockResolvedValue({ orgName: "Acme 2", social: socialConfig, companies: [] });
    const listEmployees = vi.fn().mockResolvedValue([employee]);
    const replaceEmployees = vi.fn().mockResolvedValue({ count: 1 });
    const exportBackup = vi.fn().mockResolvedValue({ version: 2, data: { employees: [] } });
    const importBackup = vi.fn().mockResolvedValue({ sourceFormat: "legacy", importedEmployees: 1 });
    const getStorageInfo = vi.fn().mockResolvedValue({ dbPath: "/tmp/payroll.sqlite", employeeCount: 1 });
    const clearData = vi.fn().mockResolvedValue({ clearedTables: ["settings"] });

    window.payrollRepository = {
      getSettings,
      saveSettings,
      listEmployees,
      replaceEmployees,
      exportBackup,
      importBackup,
      getStorageInfo,
      clearData,
    };

    const settings = await loadRepositorySettings();
    const saved = await saveRepositorySettings({ orgName: "Acme 2", social: socialConfig, companies: [] });
    const employees = await listRepositoryEmployees();
    const replaceResult = await replaceRepositoryEmployees([employee]);
    const backup = await exportRepositoryBackup();
    const importResult = await importRepositoryBackup({ orgName: "Legacy" });
    const clearResult = await clearRepositoryData();
    const storage = await loadRepositoryStorageInfo();

    expect(settings?.orgName).toBe("Acme");
    expect(saved?.orgName).toBe("Acme 2");
    expect(Array.isArray(employees)).toBe(true);
    expect(replaceResult?.count).toBe(1);
    expect(backup?.version).toBe(2);
    expect(importResult?.sourceFormat).toBe("legacy");
    expect(clearResult?.clearedTables).toContain("settings");
    expect(storage?.dbPath).toBe("/tmp/payroll.sqlite");

    expect(getSettings).toHaveBeenCalledTimes(1);
    expect(saveSettings).toHaveBeenCalledTimes(1);
    expect(listEmployees).toHaveBeenCalledTimes(1);
    expect(replaceEmployees).toHaveBeenCalledTimes(1);
    expect(exportBackup).toHaveBeenCalledTimes(1);
    expect(importBackup).toHaveBeenCalledTimes(1);
    expect(clearData).toHaveBeenCalledTimes(1);
    expect(getStorageInfo).toHaveBeenCalledTimes(1);
  });
});
