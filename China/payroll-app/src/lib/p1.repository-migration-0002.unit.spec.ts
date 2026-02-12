import Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { resolveDefaultMigrationsDir, runMigrations } from "../../electron/db/migrator";

function createLegacySchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      short TEXT NOT NULL,
      full TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      id_number TEXT,
      company_id TEXT,
      department TEXT,
      position TEXT,
      employee_type TEXT NOT NULL,
      base_salary REAL NOT NULL DEFAULT 0,
      subsidy REAL NOT NULL DEFAULT 0,
      has_social INTEGER NOT NULL DEFAULT 0,
      has_local_pension INTEGER NOT NULL DEFAULT 0,
      fund_amount REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS payroll_inputs (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      payroll_month TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS payroll_results (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      payroll_month TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    INSERT INTO schema_migrations(name) VALUES('0001_init.sql');
  `);
}

describe("P1 migration 0002 employee id integer", () => {
  const cleanupDirs: string[] = [];

  afterEach(() => {
    while (cleanupDirs.length > 0) {
      const dir = cleanupDirs.pop();
      if (dir) {
        rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it("migrates employee and payroll foreign keys from TEXT ids to INTEGER ids", () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "p1-migration-0002-"));
    cleanupDirs.push(root);

    const dbPath = path.join(root, "legacy.sqlite");
    const db = new Database(dbPath);
    createLegacySchema(db);

    db.prepare("INSERT INTO companies (id, short, full) VALUES (?, ?, ?)").run("c1", "AC", "Acme Co");

    db.prepare(
      `INSERT INTO employees (
        id, name, id_number, company_id, department, position, employee_type,
        base_salary, subsidy, has_social, has_local_pension, fund_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run("101", "Numeric Employee", "ID101", "c1", "Ops", "Lead", "管理", 10000, 500, 1, 1, 300);

    db.prepare(
      `INSERT INTO employees (
        id, name, id_number, company_id, department, position, employee_type,
        base_salary, subsidy, has_social, has_local_pension, fund_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run("emp-alpha", "String Employee", "ID102", "c1", "Ops", "Analyst", "销售", 9000, 200, 0, 0, 100);

    db.prepare("INSERT INTO payroll_inputs (id, employee_id, payroll_month, payload) VALUES (?, ?, ?, ?)")
      .run("pi1", "101", "2026-02", "{}");
    db.prepare("INSERT INTO payroll_results (id, employee_id, payroll_month, payload) VALUES (?, ?, ?, ?)")
      .run("pr1", "emp-alpha", "2026-02", "{}");

    const result = runMigrations(db, resolveDefaultMigrationsDir());

    expect(result.applied).toContain("0002_employee_id_integer.sql");

    const employeeIdColumn = db.prepare("PRAGMA table_info(employees)").all() as Array<{
      name: string;
      type: string;
      pk: number;
    }>;
    const employeePk = employeeIdColumn.find((column) => column.name === "id");

    expect(employeePk?.type.toUpperCase()).toContain("INTEGER");
    expect(employeePk?.pk).toBe(1);

    const payrollInputEmployeeId = db.prepare("PRAGMA table_info(payroll_inputs)").all() as Array<{
      name: string;
      type: string;
    }>;
    const payrollResultEmployeeId = db.prepare("PRAGMA table_info(payroll_results)").all() as Array<{
      name: string;
      type: string;
    }>;

    expect(payrollInputEmployeeId.find((column) => column.name === "employee_id")?.type.toUpperCase()).toContain(
      "INTEGER",
    );
    expect(payrollResultEmployeeId.find((column) => column.name === "employee_id")?.type.toUpperCase()).toContain(
      "INTEGER",
    );

    const employees = db
      .prepare("SELECT id, name FROM employees ORDER BY name")
      .all() as Array<{ id: number; name: string }>;

    const numericEmployee = employees.find((row) => row.name === "Numeric Employee");
    const stringEmployee = employees.find((row) => row.name === "String Employee");

    expect(numericEmployee?.id).toBe(101);
    expect(stringEmployee?.id).toBeGreaterThan(101);

    const payrollInput = db
      .prepare("SELECT employee_id FROM payroll_inputs WHERE id = ?")
      .get("pi1") as { employee_id: number };
    const payrollResult = db
      .prepare("SELECT employee_id FROM payroll_results WHERE id = ?")
      .get("pr1") as { employee_id: number };

    expect(payrollInput.employee_id).toBe(101);
    expect(payrollResult.employee_id).toBe(stringEmployee?.id);

    const rerun = runMigrations(db, resolveDefaultMigrationsDir());
    expect(rerun.applied).toEqual([]);

    db.close();
  });
});
