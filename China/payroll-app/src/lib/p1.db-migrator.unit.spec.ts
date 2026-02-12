import Database from "better-sqlite3";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  getSchemaVersion,
  resolveDefaultMigrationsDir,
  runMigrations,
} from "../../electron/db/migrator";

function createTempWorkspace(): string {
  return mkdtempSync(path.join(tmpdir(), "payroll-migrator-test-"));
}

function writeMigration(dir: string, name: string, sql: string): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, name), sql, "utf8");
}

describe("P1 db migrator", () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    while (tempRoots.length > 0) {
      const root = tempRoots.pop();
      if (root) {
        rmSync(root, { recursive: true, force: true });
      }
    }
  });

  it("applies pending sql files in lexical order and records schema version", () => {
    const root = createTempWorkspace();
    tempRoots.push(root);
    const dbPath = path.join(root, "test.sqlite");
    const migrationDir = path.join(root, "migrations");

    writeMigration(
      migrationDir,
      "0002_second.sql",
      "CREATE TABLE second_table (id INTEGER PRIMARY KEY, label TEXT NOT NULL);",
    );
    writeMigration(
      migrationDir,
      "0001_first.sql",
      "CREATE TABLE first_table (id INTEGER PRIMARY KEY, name TEXT NOT NULL);",
    );

    const db = new Database(dbPath);
    const firstRun = runMigrations(db, migrationDir);
    const secondRun = runMigrations(db, migrationDir);
    const firstExists = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'first_table'")
      .get();
    const secondExists = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'second_table'")
      .get();
    const schemaVersion = getSchemaVersion(db);
    db.close();

    expect(firstRun.applied).toEqual(["0001_first.sql", "0002_second.sql"]);
    expect(secondRun.applied).toEqual([]);
    expect(firstExists).toBeDefined();
    expect(secondExists).toBeDefined();
    expect(schemaVersion).toBe(2);
  });

  it("does not mark a failed migration as applied", () => {
    const root = createTempWorkspace();
    tempRoots.push(root);
    const dbPath = path.join(root, "test.sqlite");
    const migrationDir = path.join(root, "migrations");

    writeMigration(
      migrationDir,
      "0001_ok.sql",
      "CREATE TABLE stable_table (id INTEGER PRIMARY KEY, name TEXT NOT NULL);",
    );
    writeMigration(
      migrationDir,
      "0002_bad.sql",
      "CREATE TABL broken_table (id INTEGER PRIMARY KEY);",
    );

    const db = new Database(dbPath);
    expect(() => runMigrations(db, migrationDir)).toThrow();

    const applied = db
      .prepare("SELECT name FROM schema_migrations ORDER BY name")
      .all() as Array<{ name: string }>;
    const schemaVersion = getSchemaVersion(db);
    db.close();

    expect(applied.map((row) => row.name)).toEqual(["0001_ok.sql"]);
    expect(schemaVersion).toBe(1);
  });

  it("resolves default migrations directory from project source tree", () => {
    const current = process.cwd();
    process.chdir(path.resolve(current, ".."));

    try {
      const resolved = resolveDefaultMigrationsDir();
      expect(resolved.endsWith(path.join("electron", "db", "migrations"))).toBe(true);
    } finally {
      process.chdir(current);
    }
  });
});
