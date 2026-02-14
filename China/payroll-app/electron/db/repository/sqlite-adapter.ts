import type Database from "better-sqlite3";

import type { RepositoryAdapter } from "./contracts.js";
import { createSqliteBackupActions } from "./sqlite-backup.js";
import { createSqliteEmployeesActions } from "./sqlite-employees.js";
import { createSqliteSettingsActions } from "./sqlite-settings.js";

interface CreateSqliteRepositoryAdapterOptions {
  db: Database.Database;
  dbPath: string;
  schemaVersion: number;
}

export function createSqliteRepositoryAdapter(
  options: CreateSqliteRepositoryAdapterOptions,
): RepositoryAdapter {
  const settingsActions = createSqliteSettingsActions(options.db);
  const employeeActions = createSqliteEmployeesActions(options.db);
  const backupActions = createSqliteBackupActions({
    db: options.db,
    dbPath: options.dbPath,
    schemaVersion: options.schemaVersion,
    getSettings: settingsActions.getSettings,
    listEmployees: employeeActions.listEmployees,
  });

  return {
    getSettings: settingsActions.getSettings,
    saveSettings: settingsActions.saveSettings,
    listEmployees: employeeActions.listEmployees,
    replaceEmployees: employeeActions.replaceEmployees,
    exportBackup: backupActions.exportBackup,
    importBackup: backupActions.importBackup,
    clearData: backupActions.clearData,
    getStorageInfo: backupActions.getStorageInfo,
  };
}
