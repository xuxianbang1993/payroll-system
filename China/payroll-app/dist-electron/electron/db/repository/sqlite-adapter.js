import { createSqliteBackupActions } from "./sqlite-backup.js";
import { createSqliteEmployeesActions } from "./sqlite-employees.js";
import { createSqliteSettingsActions } from "./sqlite-settings.js";
export function createSqliteRepositoryAdapter(options) {
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
        addEmployee: employeeActions.addEmployee,
        updateEmployee: employeeActions.updateEmployee,
        deleteEmployee: employeeActions.deleteEmployee,
        replaceEmployees: employeeActions.replaceEmployees,
        exportBackup: backupActions.exportBackup,
        importBackup: backupActions.importBackup,
        clearData: backupActions.clearData,
        getStorageInfo: backupActions.getStorageInfo,
    };
}
//# sourceMappingURL=sqlite-adapter.js.map