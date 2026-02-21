import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createSqliteRepositoryAdapter } from "../../../electron/db/repository/sqlite-adapter";

function setupTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const root = process.cwd();
  const m1 = readFileSync(join(root, "electron/db/migrations/0001_init.sql"), "utf8");
  const m2 = readFileSync(join(root, "electron/db/migrations/0002_employee_id_integer.sql"), "utf8");
  const m3 = readFileSync(join(root, "electron/db/migrations/0003_payroll_unique_index.sql"), "utf8");
  db.exec(m1);
  db.exec(m2);
  db.exec(m3);

  db.prepare(
    `INSERT INTO employees (
      id, name, id_number, company_id, department, position, employee_type,
      base_salary, subsidy, has_social, has_local_pension, fund_amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    1,
    "张三",
    "310101199001011234",
    null,
    "技术部",
    "工程师",
    "management",
    10000,
    500,
    1,
    1,
    2000,
  );

  db.prepare(
    `INSERT INTO employees (
      id, name, id_number, company_id, department, position, employee_type,
      base_salary, subsidy, has_social, has_local_pension, fund_amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    2,
    "李四",
    "310101199001011235",
    null,
    "销售部",
    "销售",
    "sales",
    9000,
    300,
    1,
    0,
    1500,
  );

  return db;
}

describe("P2.3 sqlite payroll repository", () => {
  const dbs: Database.Database[] = [];

  afterEach(() => {
    while (dbs.length > 0) {
      dbs.pop()?.close();
    }
  });

  it("savePayrollInput inserts on first save", () => {
    const db = setupTestDb();
    dbs.push(db);

    const repo = createSqliteRepositoryAdapter({ db, dbPath: ":memory:", schemaVersion: 2 });

    const saved = repo.savePayrollInput(1, "2026-02", { perfSalary: 1000, tax: 50 });

    expect(saved.employeeId).toBe(1);
    expect(saved.payrollMonth).toBe("2026-02");
    expect(saved.payload).toEqual({ perfSalary: 1000, tax: 50 });

    const count = db.prepare("SELECT COUNT(1) AS c FROM payroll_inputs").get() as { c: number };
    expect(count.c).toBe(1);
  });

  it("savePayrollInput updates existing record for same employee and month", () => {
    const db = setupTestDb();
    dbs.push(db);

    const repo = createSqliteRepositoryAdapter({ db, dbPath: ":memory:", schemaVersion: 2 });

    const first = repo.savePayrollInput(1, "2026-02", { perfSalary: 1000, tax: 50 });
    const second = repo.savePayrollInput(1, "2026-02", { perfSalary: 2000, tax: 75 });

    expect(second.id).toBe(first.id);
    expect(second.payload).toEqual({ perfSalary: 2000, tax: 75 });

    const count = db.prepare("SELECT COUNT(1) AS c FROM payroll_inputs").get() as { c: number };
    expect(count.c).toBe(1);
  });

  it("listPayrollInputs returns records of the target month ordered by employee_id", () => {
    const db = setupTestDb();
    dbs.push(db);

    const repo = createSqliteRepositoryAdapter({ db, dbPath: ":memory:", schemaVersion: 2 });

    repo.savePayrollInput(2, "2026-02", { bonus: 300 });
    repo.savePayrollInput(1, "2026-02", { bonus: 100 });
    repo.savePayrollInput(1, "2026-03", { bonus: 500 });

    const rows = repo.listPayrollInputs("2026-02");

    expect(rows).toHaveLength(2);
    expect(rows[0]?.employeeId).toBe(1);
    expect(rows[1]?.employeeId).toBe(2);
    expect(rows.map((row) => row.payload)).toEqual([{ bonus: 100 }, { bonus: 300 }]);
  });

  it("listPayrollInputs returns empty array for empty month", () => {
    const db = setupTestDb();
    dbs.push(db);

    const repo = createSqliteRepositoryAdapter({ db, dbPath: ":memory:", schemaVersion: 2 });

    expect(repo.listPayrollInputs("2030-01")).toEqual([]);
  });

  it("savePayrollResult inserts on first save", () => {
    const db = setupTestDb();
    dbs.push(db);

    const repo = createSqliteRepositoryAdapter({ db, dbPath: ":memory:", schemaVersion: 2 });

    const saved = repo.savePayrollResult(1, "2026-02", { netPay: 8888.88, tax: 66.66 });

    expect(saved.employeeId).toBe(1);
    expect(saved.payrollMonth).toBe("2026-02");
    expect(saved.payload).toEqual({ netPay: 8888.88, tax: 66.66 });

    const count = db.prepare("SELECT COUNT(1) AS c FROM payroll_results").get() as { c: number };
    expect(count.c).toBe(1);
  });

  it("savePayrollResult updates existing record for same employee and month", () => {
    const db = setupTestDb();
    dbs.push(db);

    const repo = createSqliteRepositoryAdapter({ db, dbPath: ":memory:", schemaVersion: 2 });

    const first = repo.savePayrollResult(1, "2026-02", { netPay: 8888.88 });
    const second = repo.savePayrollResult(1, "2026-02", { netPay: 7777.77 });

    expect(second.id).toBe(first.id);
    expect(second.payload).toEqual({ netPay: 7777.77 });

    const count = db.prepare("SELECT COUNT(1) AS c FROM payroll_results").get() as { c: number };
    expect(count.c).toBe(1);
  });

  it("listPayrollResults returns records of the target month", () => {
    const db = setupTestDb();
    dbs.push(db);

    const repo = createSqliteRepositoryAdapter({ db, dbPath: ":memory:", schemaVersion: 2 });

    repo.savePayrollResult(2, "2026-02", { netPay: 6500 });
    repo.savePayrollResult(1, "2026-02", { netPay: 7500 });
    repo.savePayrollResult(1, "2026-03", { netPay: 8200 });

    const rows = repo.listPayrollResults("2026-02");

    expect(rows).toHaveLength(2);
    expect(rows[0]?.employeeId).toBe(1);
    expect(rows[1]?.employeeId).toBe(2);
    expect(rows.map((row) => row.payload)).toEqual([{ netPay: 7500 }, { netPay: 6500 }]);
  });

  it("deletePayrollByMonth deletes both inputs and results for target month", () => {
    const db = setupTestDb();
    dbs.push(db);

    const repo = createSqliteRepositoryAdapter({ db, dbPath: ":memory:", schemaVersion: 2 });

    repo.savePayrollInput(1, "2026-02", { tax: 10 });
    repo.savePayrollInput(2, "2026-02", { tax: 20 });
    repo.savePayrollInput(1, "2026-03", { tax: 30 });

    repo.savePayrollResult(1, "2026-02", { netPay: 9000 });
    repo.savePayrollResult(2, "2026-02", { netPay: 8000 });
    repo.savePayrollResult(1, "2026-03", { netPay: 7000 });

    const deleted = repo.deletePayrollByMonth("2026-02");

    expect(deleted).toEqual({ deletedInputs: 2, deletedResults: 2 });
    expect(repo.listPayrollInputs("2026-02")).toEqual([]);
    expect(repo.listPayrollResults("2026-02")).toEqual([]);
    expect(repo.listPayrollInputs("2026-03")).toHaveLength(1);
    expect(repo.listPayrollResults("2026-03")).toHaveLength(1);
  });

  it("deletePayrollByMonth returns zero counts when no rows exist", () => {
    const db = setupTestDb();
    dbs.push(db);

    const repo = createSqliteRepositoryAdapter({ db, dbPath: ":memory:", schemaVersion: 2 });

    expect(repo.deletePayrollByMonth("2030-01")).toEqual({ deletedInputs: 0, deletedResults: 0 });
  });

  it("throws when employee_id does not exist due to foreign key constraint", () => {
    const db = setupTestDb();
    dbs.push(db);

    const repo = createSqliteRepositoryAdapter({ db, dbPath: ":memory:", schemaVersion: 2 });

    expect(() => repo.savePayrollInput(999, "2026-02", { tax: 10 })).toThrow();
    expect(() => repo.savePayrollResult(999, "2026-02", { netPay: 100 })).toThrow();
  });
});
