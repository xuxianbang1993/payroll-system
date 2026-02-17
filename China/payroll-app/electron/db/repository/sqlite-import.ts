import type Database from "better-sqlite3";

import type { ImportBackupResult } from "./contracts.js";
import { normalizeBackupPayload } from "./backup-normalizer.js";
import { ensureCompanies } from "./sqlite-shared.js";

interface SqliteImportActionsOptions {
  db: Database.Database;
}

interface SqliteImportActions {
  importBackup: (payload: unknown) => ImportBackupResult;
}

export function createSqliteImportActions(
  options: SqliteImportActionsOptions,
): SqliteImportActions {
  const { db } = options;

  const importBackup = (payload: unknown): ImportBackupResult => {
    const normalized = normalizeBackupPayload(payload);

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
      ).run("orgName", normalized.data.orgName);

      db.prepare(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = CURRENT_TIMESTAMP`,
      ).run("social", JSON.stringify(normalized.data.social));

      const companyIds = ensureCompanies(db, normalized.data.companies);

      const insertEmployee = db.prepare(`
        INSERT INTO employees (
          id,
          name,
          id_number,
          company_id,
          department,
          position,
          employee_type,
          base_salary,
          subsidy,
          has_social,
          has_local_pension,
          fund_amount,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);

      for (const employee of normalized.data.employees) {
        insertEmployee.run(
          employee.id,
          employee.name,
          employee.idCard,
          companyIds.get(employee.companyShort) ?? null,
          employee.dept,
          employee.position,
          employee.type,
          employee.baseSalary,
          employee.subsidy,
          employee.hasSocial ? 1 : 0,
          employee.hasLocalPension ? 1 : 0,
          employee.fundAmount,
        );
      }

      const employeeIds = new Set(normalized.data.employees.map((employee) => employee.id));

      const insertInput = db.prepare(`
        INSERT INTO payroll_inputs (id, employee_id, payroll_month, payload, created_at, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);

      for (const row of normalized.data.payrollInputs) {
        if (!employeeIds.has(row.employeeId)) {
          continue;
        }
        insertInput.run(row.id, row.employeeId, row.payrollMonth, JSON.stringify(row.payload));
      }

      const insertResult = db.prepare(`
        INSERT INTO payroll_results (id, employee_id, payroll_month, payload, created_at, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);

      for (const row of normalized.data.payrollResults) {
        if (!employeeIds.has(row.employeeId)) {
          continue;
        }
        insertResult.run(row.id, row.employeeId, row.payrollMonth, JSON.stringify(row.payload));
      }
    });

    run();

    return {
      sourceFormat: normalized.sourceFormat,
      importedCompanies: normalized.data.companies.length,
      importedEmployees: normalized.data.employees.length,
      importedPayrollInputs: normalized.data.payrollInputs.length,
      importedPayrollResults: normalized.data.payrollResults.length,
    };
  };

  return {
    importBackup,
  };
}
