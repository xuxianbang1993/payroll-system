import type Database from "better-sqlite3";

import type { AppEnv } from "./config.js";

const BUSINESS_TABLES = [
  "payroll_results",
  "payroll_inputs",
  "employees",
  "companies",
  "settings",
] as const;

export interface ResetDatabaseOptions {
  appEnv: AppEnv;
  db: Database.Database;
}

export interface ResetDatabaseResult {
  clearedTables: string[];
}

export class ResetNotAllowedError extends Error {
  constructor(message = "resetDatabase is only allowed when APP_ENV=test") {
    super(message);
    this.name = "ResetNotAllowedError";
  }
}

function getExistingBusinessTables(db: Database.Database): string[] {
  const tableRows = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all() as Array<{ name: string }>;
  const tableSet = new Set(tableRows.map((row) => row.name));

  return BUSINESS_TABLES.filter((table) => tableSet.has(table));
}

export function resetDatabase(options: ResetDatabaseOptions): ResetDatabaseResult {
  if (options.appEnv !== "test") {
    throw new ResetNotAllowedError();
  }

  const tablesToClear = getExistingBusinessTables(options.db);
  const run = options.db.transaction(() => {
    for (const tableName of tablesToClear) {
      options.db.prepare(`DELETE FROM ${tableName}`).run();
    }
  });

  run();

  return {
    clearedTables: [...tablesToClear],
  };
}
