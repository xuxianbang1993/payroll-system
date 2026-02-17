import { existsSync, statSync } from "node:fs";
import { buildBackupExport } from "./backup-normalizer.js";
import { createDefaultSettings } from "./defaults.js";
import { parseJsonRecord } from "./sqlite-shared.js";
import { createSqliteImportActions } from "./sqlite-import.js";
const CLEAR_TABLES = [
    "payroll_results",
    "payroll_inputs",
    "employees",
    "companies",
    "settings",
];
export function createSqliteBackupActions(options) {
    const { db } = options;
    const importActions = createSqliteImportActions({ db });
    const exportBackup = () => {
        const settings = options.getSettings();
        const employees = options.listEmployees();
        const payrollInputs = db.prepare("SELECT id, employee_id, payroll_month, payload FROM payroll_inputs ORDER BY id ASC").all();
        const payrollResults = db.prepare("SELECT id, employee_id, payroll_month, payload FROM payroll_results ORDER BY id ASC").all();
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
    const clearData = () => {
        const defaults = createDefaultSettings();
        const run = db.transaction(() => {
            db.prepare("DELETE FROM payroll_results").run();
            db.prepare("DELETE FROM payroll_inputs").run();
            db.prepare("DELETE FROM employees").run();
            db.prepare("DELETE FROM companies").run();
            db.prepare("DELETE FROM settings").run();
            db.prepare(`INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = CURRENT_TIMESTAMP`).run("orgName", defaults.orgName);
            db.prepare(`INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = CURRENT_TIMESTAMP`).run("social", JSON.stringify(defaults.social));
        });
        run();
        return {
            clearedTables: [...CLEAR_TABLES],
        };
    };
    const getStorageInfo = () => {
        const employeeCount = db.prepare("SELECT COUNT(1) AS c FROM employees").get();
        const companyCount = db.prepare("SELECT COUNT(1) AS c FROM companies").get();
        const payrollInputCount = db.prepare("SELECT COUNT(1) AS c FROM payroll_inputs").get();
        const payrollResultCount = db.prepare("SELECT COUNT(1) AS c FROM payroll_results").get();
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
//# sourceMappingURL=sqlite-backup.js.map