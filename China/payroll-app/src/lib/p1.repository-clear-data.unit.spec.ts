import { afterEach, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../electron/db/client";
import { createSqliteRepositoryAdapter } from "../../electron/db/repository/sqlite-adapter";
import type { EmployeeRecord, RepositorySettings } from "../../electron/db/repository/contracts";
import { createTestDbSandbox } from "../../electron/db/test-db";

describe("P1 repository clear data", () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    while (cleanups.length > 0) {
      const cleanup = cleanups.pop();
      cleanup?.();
    }
  });

  it("clears business tables and restores defaults", () => {
    const sandbox = createTestDbSandbox("p1-clear-data-");
    const client = createDatabaseClient({
      appEnv: "test",
      readSource: "sqlite",
      writeMode: "sqlite",
      dbPath: sandbox.dbPath,
    });

    cleanups.push(() => client.close());
    cleanups.push(() => sandbox.cleanup());

    const repository = createSqliteRepositoryAdapter({
      db: client.db,
      dbPath: client.config.dbPath,
      schemaVersion: client.schemaVersion,
    });

    const settings: RepositorySettings = {
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
    const employees: EmployeeRecord[] = [
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
        subsidy: 500,
        hasSocial: true,
        hasLocalPension: true,
        fundAmount: 300,
      },
    ];

    repository.saveSettings(settings);
    repository.replaceEmployees(employees);

    client.db.prepare(
      "INSERT INTO payroll_inputs (id, employee_id, payroll_month, payload) VALUES (?, ?, ?, ?)",
    ).run("input-1", 1, "2026-02", "{\"tax\":100}");
    client.db.prepare(
      "INSERT INTO payroll_results (id, employee_id, payroll_month, payload) VALUES (?, ?, ?, ?)",
    ).run("result-1", 1, "2026-02", "{\"netPay\":9999}");

    expect(repository.listEmployees()).toHaveLength(1);
    expect(repository.getStorageInfo().payrollInputCount).toBe(1);
    expect(repository.getStorageInfo().payrollResultCount).toBe(1);

    const cleared = repository.clearData();

    expect(cleared.clearedTables).toContain("settings");
    expect(cleared.clearedTables).toContain("employees");

    const resetSettings = repository.getSettings();
    const resetStorage = repository.getStorageInfo();

    expect(resetSettings.orgName).toBe("公司名称");
    expect(resetSettings.companies).toHaveLength(0);
    expect(resetSettings.social.compPension).toBe(16);
    expect(repository.listEmployees()).toHaveLength(0);
    expect(resetStorage.employeeCount).toBe(0);
    expect(resetStorage.companyCount).toBe(0);
    expect(resetStorage.payrollInputCount).toBe(0);
    expect(resetStorage.payrollResultCount).toBe(0);
  });
});
