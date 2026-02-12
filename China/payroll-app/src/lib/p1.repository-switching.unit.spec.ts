import { describe, expect, it, vi } from "vitest";

import type {
  EmployeeRecord,
  ImportBackupResult,
  RepositoryAdapter,
  RepositorySettings,
} from "../../electron/db/repository/contracts";
import { normalizeBackupPayload } from "../../electron/db/repository/backup-normalizer";
import {
  createSwitchingRepository,
  DualWriteError,
} from "../../electron/db/repository/switching-repository";

const baseSettings: RepositorySettings = {
  orgName: "Acme",
  social: {
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
  },
  companies: [{ short: "AC", full: "Acme Co" }],
};

const baseEmployees: EmployeeRecord[] = [
  {
    id: 1,
    name: "Alice",
    idCard: "110101199001010011",
    companyShort: "AC",
    company: "Acme Co",
    dept: "HR",
    position: "Manager",
    type: "管理",
    baseSalary: 10000,
    subsidy: 1000,
    hasSocial: true,
    hasLocalPension: true,
    fundAmount: 500,
  },
];

const importResult: ImportBackupResult = {
  sourceFormat: "legacy",
  importedCompanies: 1,
  importedEmployees: 1,
  importedPayrollInputs: 0,
  importedPayrollResults: 0,
};

function createAdapter(overrides: Partial<RepositoryAdapter> = {}): RepositoryAdapter {
  return {
    getSettings: vi.fn().mockReturnValue(baseSettings),
    saveSettings: vi.fn(),
    listEmployees: vi.fn().mockReturnValue(baseEmployees),
    replaceEmployees: vi.fn().mockReturnValue({ count: baseEmployees.length }),
    exportBackup: vi.fn().mockReturnValue({
      version: 2,
      source: "payroll-system",
      exportedAt: "2026-02-12T00:00:00.000Z",
      data: {
        ...baseSettings,
        employees: baseEmployees,
        payrollInputs: [],
        payrollResults: [],
      },
    }),
    importBackup: vi.fn().mockReturnValue(importResult),
    getStorageInfo: vi.fn().mockReturnValue({
      dbPath: "/tmp/payroll.sqlite",
      schemaVersion: 2,
      fileSizeBytes: 1234,
      employeeCount: 1,
      companyCount: 1,
      payrollInputCount: 0,
      payrollResultCount: 0,
    }),
    ...overrides,
  };
}

describe("P1 repository switching", () => {
  it("switches read source between legacy and sqlite", () => {
    const legacy = createAdapter({ getSettings: vi.fn().mockReturnValue({ ...baseSettings, orgName: "Legacy" }) });
    const sqlite = createAdapter({ getSettings: vi.fn().mockReturnValue({ ...baseSettings, orgName: "SQLite" }) });

    const legacyRepo = createSwitchingRepository({
      context: {
        appEnv: "prod",
        readSource: "legacy",
        writeMode: "legacy",
      },
      legacy,
      sqlite,
    });

    const sqliteRepo = createSwitchingRepository({
      context: {
        appEnv: "prod",
        readSource: "sqlite",
        writeMode: "sqlite",
      },
      legacy,
      sqlite,
    });

    expect(legacyRepo.getSettings().orgName).toBe("Legacy");
    expect(sqliteRepo.getSettings().orgName).toBe("SQLite");
  });

  it("routes writes by WRITE_MODE legacy/sqlite/dual", () => {
    const legacy = createAdapter();
    const sqlite = createAdapter();

    createSwitchingRepository({
      context: { appEnv: "prod", readSource: "legacy", writeMode: "legacy" },
      legacy,
      sqlite,
    }).saveSettings(baseSettings);

    expect(legacy.saveSettings).toHaveBeenCalledTimes(1);
    expect(sqlite.saveSettings).toHaveBeenCalledTimes(0);

    createSwitchingRepository({
      context: { appEnv: "prod", readSource: "legacy", writeMode: "sqlite" },
      legacy,
      sqlite,
    }).saveSettings(baseSettings);

    expect(sqlite.saveSettings).toHaveBeenCalledTimes(1);

    createSwitchingRepository({
      context: { appEnv: "prod", readSource: "legacy", writeMode: "dual" },
      legacy,
      sqlite,
    }).saveSettings(baseSettings);

    expect(legacy.saveSettings).toHaveBeenCalledTimes(2);
    expect(sqlite.saveSettings).toHaveBeenCalledTimes(2);
  });

  it("throws DualWriteError and logs structured fields when dual write is inconsistent", () => {
    const legacy = createAdapter({
      saveSettings: vi.fn().mockImplementation(() => {
        throw new Error("legacy unavailable");
      }),
    });
    const sqlite = createAdapter();
    const logger = {
      warn: vi.fn(),
    };

    const repository = createSwitchingRepository({
      context: {
        appEnv: "prod",
        readSource: "sqlite",
        writeMode: "dual",
      },
      legacy,
      sqlite,
      logger,
    });

    expect(() => repository.saveSettings(baseSettings)).toThrow(DualWriteError);

    const dualError = (() => {
      try {
        repository.saveSettings(baseSettings);
      } catch (error) {
        return error;
      }
      return null;
    })();

    expect(dualError).toBeInstanceOf(DualWriteError);
    const casted = dualError as DualWriteError;
    expect(casted.mode).toBe("dual");
    expect(casted.operation).toBe("saveSettings");
    expect(casted.requestId).toMatch(/^req-/);

    expect(logger.warn).toHaveBeenCalled();
    const [message, meta] = logger.warn.mock.calls[0] as [string, Record<string, unknown>];
    expect(message).toContain("mode=dual");
    expect(message).toContain("op=saveSettings");
    expect(String(meta.requestId)).toMatch(/^req-/);
  });

  it("normalizes legacy backup payload to extended shape", () => {
    const normalized = normalizeBackupPayload({
      orgName: "Legacy Org",
      social: {
        compPension: 17,
      },
      companies: [{ short: "AC", full: "Acme Co" }],
      employees: [
        {
          id: "7",
          name: "Bob",
          type: "销售",
          companyShort: "AC",
          company: "Acme Co",
        },
      ],
    });

    expect(normalized.sourceFormat).toBe("legacy");
    expect(normalized.data.orgName).toBe("Legacy Org");
    expect(normalized.data.social.compPension).toBe(17);
    expect(normalized.data.payrollInputs).toEqual([]);
    expect(normalized.data.payrollResults).toEqual([]);
    expect(normalized.data.employees[0]?.id).toBe(7);
    expect(normalized.data.employees[0]?.type).toBe("销售");
  });
});
