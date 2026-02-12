import { afterEach, describe, expect, it } from "vitest";
import { existsSync } from "node:fs";

import { createDatabaseClient } from "../../electron/db/client";
import { resetDatabase, ResetNotAllowedError } from "../../electron/db/reset";
import { createTestDbSandbox } from "../../electron/db/test-db";

describe("P1 db reset and sandbox", () => {
  const cleanups: Array<() => void> = [];

  afterEach(() => {
    while (cleanups.length > 0) {
      const cleanup = cleanups.pop();
      if (cleanup) {
        cleanup();
      }
    }
  });

  it("creates isolated test db sandbox with cleanup", () => {
    const sandbox = createTestDbSandbox();
    cleanups.push(sandbox.cleanup);

    expect(sandbox.dbPath.endsWith(".sqlite")).toBe(true);
    expect(existsSync(sandbox.dbPath)).toBe(false);
  });

  it("resets business tables in test mode but keeps migration metadata", () => {
    const sandbox = createTestDbSandbox();
    cleanups.push(sandbox.cleanup);

    const client = createDatabaseClient({
      appEnv: "test",
      readSource: "legacy",
      writeMode: "legacy",
      dbPath: sandbox.dbPath,
    });

    client.db
      .prepare("INSERT INTO settings (key, value) VALUES (?, ?)")
      .run("orgName", "Acme");
    client.db
      .prepare("INSERT INTO companies (id, short, full) VALUES (?, ?, ?)")
      .run("c1", "AC", "Acme Co.");
    client.db
      .prepare(
        `INSERT INTO employees (
          id, name, company_id, employee_type, base_salary, subsidy, has_social, has_local_pension, fund_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(1, "Alice", "c1", "管理", 10000, 500, 1, 1, 800);

    const migrationCountBefore = client.db
      .prepare("SELECT COUNT(1) as c FROM schema_migrations")
      .get() as { c: number };
    expect(migrationCountBefore.c).toBeGreaterThan(0);

    const result = resetDatabase({
      appEnv: "test",
      db: client.db,
    });

    const settingsCount = client.db
      .prepare("SELECT COUNT(1) as c FROM settings")
      .get() as { c: number };
    const companiesCount = client.db
      .prepare("SELECT COUNT(1) as c FROM companies")
      .get() as { c: number };
    const employeesCount = client.db
      .prepare("SELECT COUNT(1) as c FROM employees")
      .get() as { c: number };
    const migrationCountAfter = client.db
      .prepare("SELECT COUNT(1) as c FROM schema_migrations")
      .get() as { c: number };

    client.close();

    expect(result.clearedTables).toContain("settings");
    expect(result.clearedTables).toContain("companies");
    expect(result.clearedTables).toContain("employees");
    expect(settingsCount.c).toBe(0);
    expect(companiesCount.c).toBe(0);
    expect(employeesCount.c).toBe(0);
    expect(migrationCountAfter.c).toBe(migrationCountBefore.c);
  });

  it("rejects reset outside test mode", () => {
    const sandbox = createTestDbSandbox();
    cleanups.push(sandbox.cleanup);

    const client = createDatabaseClient({
      appEnv: "prod",
      readSource: "legacy",
      writeMode: "legacy",
      dbPath: sandbox.dbPath,
    });

    client.db
      .prepare("INSERT INTO settings (key, value) VALUES (?, ?)")
      .run("orgName", "Acme");

    expect(() =>
      resetDatabase({
        appEnv: "prod",
        db: client.db,
      }),
    ).toThrow(ResetNotAllowedError);

    const settingsCount = client.db
      .prepare("SELECT COUNT(1) as c FROM settings")
      .get() as { c: number };
    client.close();

    expect(settingsCount.c).toBe(1);
  });
});
