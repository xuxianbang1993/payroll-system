import type Database from "better-sqlite3";
import { existsSync, statSync } from "node:fs";

import type {
  BackupExportFile,
  ClearDataResult,
  EmployeeRecord,
  ImportBackupResult,
  RepositorySettings,
  RepositoryStorageInfo,
} from "./contracts.js";
import { buildBackupExport } from "./backup-normalizer.js";
import { createDefaultSettings } from "./defaults.js";
import { parseJsonRecord } from "./sqlite-shared.js";
import { createSqliteImportActions } from "./sqlite-import.js";

interface SqliteBackupActionsOptions {
  db: Database.Database;
  dbPath: string;
  schemaVersion: number;
  getSettings: () => RepositorySettings;
  listEmployees: () => EmployeeRecord[];
}

interface SqliteBackupActions {
  exportBackup: () => BackupExportFile;
  importBackup: (payload: unknown) => ImportBackupResult;
  clearData: () => ClearDataResult;
  getStorageInfo: () => RepositoryStorageInfo;
}

const CLEAR_TABLES = [
  "payroll_results",
  "payroll_inputs",
  "employees",
  "companies",
  "settings",
];

export function createSqliteBackupActions(
  options: SqliteBackupActionsOptions,
): SqliteBackupActions {
  const { db } = options;
  const importActions = createSqliteImportActions({ db });

  const exportBackup = () => {
    const settings = options.getSettings();
    const employees = options.listEmployees();

    const payrollInputs = db.prepare(
      "SELECT id, employee_id, payroll_month, payload FROM payroll_inputs ORDER BY id ASC",
    ).all() as Array<{
      id: string;
      employee_id: number;
      payroll_month: string;
      payload: string;
    }>;

    const payrollResults = db.prepare(
      "SELECT id, employee_id, payroll_month, payload FROM payroll_results ORDER BY id ASC",
    ).all() as Array<{
      id: string;
      employee_id: number;
      payroll_month: string;
      payload: string;
    }>;

    return buildBackupExport({
      orgName: settings.orgName,
      social: settings.social,
      companies: settings.companies,
      employees,
      payrollInputs: payrollInputs.map((row) => ({
        id: row.id,
        employeeId: row.employee_id,
        payrollMonth: row.payroll_month,
        payload: parseJsonRecord(row.payload),
      })),
      payrollResults: payrollResults.map((row) => ({
        id: row.id,
        employeeId: row.employee_id,
        payrollMonth: row.payroll_month,
        payload: parseJsonRecord(row.payload),
      })),
    });
  };

  const clearData = (): ClearDataResult => {
    const defaults = createDefaultSettings();
    const run = db.transaction(() => {
      db.prepare("DELETE FROM payroll_results").run();
      db.prepare("DELETE FROM payroll_inputs").run();
      db.prepare("DELETE FROM employees").run();
      db.prepare("DELETE FROM companies").run();
      db.prepare("DELETE FROM settings").run();

      db.prepare(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = CURRENT_TIMESTAMP`,
      ).run("orgName", defaults.orgName);

      db.prepare(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = CURRENT_TIMESTAMP`,
      ).run("social", JSON.stringify(defaults.social));
    });

    run();

    return {
      clearedTables: [...CLEAR_TABLES],
    };
  };

  const getStorageInfo = (): RepositoryStorageInfo => {
    const employeeCount = db.prepare("SELECT COUNT(1) AS c FROM employees").get() as { c: number };
    const companyCount = db.prepare("SELECT COUNT(1) AS c FROM companies").get() as { c: number };
    const payrollInputCount = db.prepare("SELECT COUNT(1) AS c FROM payroll_inputs").get() as { c: number };
    const payrollResultCount = db.prepare("SELECT COUNT(1) AS c FROM payroll_results").get() as { c: number };

    const fileSizeBytes = existsSync(options.dbPath) ? statSync(options.dbPath).size : 0;

    return {
      dbPath: options.dbPath,
      schemaVersion: options.schemaVersion,
      fileSizeBytes,
      employeeCount: employeeCount.c,
      companyCount: companyCount.c,
      payrollInputCount: payrollInputCount.c,
      payrollResultCount: payrollResultCount.c,
    };
  };

  return {
    exportBackup,
    importBackup: importActions.importBackup,
    clearData,
    getStorageInfo,
  };
}
