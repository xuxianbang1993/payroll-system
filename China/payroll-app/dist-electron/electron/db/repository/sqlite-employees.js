import { normalizeEmployees } from "./defaults.js";
import { asEmployeeType, ensureCompanies } from "./sqlite-shared.js";
function ensureSingleCompany(db, companyShort, companyFull) {
    if (companyShort.trim() === "")
        return null;
    const ids = ensureCompanies(db, [{ short: companyShort, full: companyFull || companyShort }]);
    return ids.get(companyShort) ?? null;
}
function rowToRecord(row) {
    return {
        id: row.id,
        name: row.name,
        idCard: row.id_number ?? "",
        companyShort: row.company_short ?? "",
        company: row.company_full ?? row.company_short ?? "",
        dept: row.department ?? "",
        position: row.position ?? "",
        type: asEmployeeType(row.employee_type),
        baseSalary: row.base_salary,
        subsidy: row.subsidy,
        hasSocial: row.has_social === 1,
        hasLocalPension: row.has_local_pension === 1,
        fundAmount: row.fund_amount,
    };
}
export function createSqliteEmployeesActions(db) {
    const SELECT_EMPLOYEE = `
    SELECT
      e.id, e.name, e.id_number, e.department, e.position, e.employee_type,
      e.base_salary, e.subsidy, e.has_social, e.has_local_pension, e.fund_amount,
      c.short AS company_short, c.full AS company_full
    FROM employees e
    LEFT JOIN companies c ON c.id = e.company_id`;
    const listEmployees = () => {
        const rows = db.prepare(`${SELECT_EMPLOYEE} ORDER BY e.id ASC`).all();
        return normalizeEmployees(rows.map((row) => rowToRecord(row)));
    };
    const addEmployee = (input) => {
        return db.transaction(() => {
            const companyId = ensureSingleCompany(db, input.companyShort, input.company);
            const nextId = db.prepare("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM employees").get().next_id;
            db.prepare(`
        INSERT INTO employees (
          id, name, id_number, company_id, department, position, employee_type,
          base_salary, subsidy, has_social, has_local_pension, fund_amount,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(nextId, input.name, input.idCard, companyId, input.dept, input.position, input.type, input.baseSalary, input.subsidy, input.hasSocial ? 1 : 0, input.hasLocalPension ? 1 : 0, input.fundAmount);
            const row = db.prepare(`${SELECT_EMPLOYEE} WHERE e.id = ?`).get(nextId);
            return rowToRecord(row);
        })();
    };
    const updateEmployee = (employee) => {
        return db.transaction(() => {
            const companyId = ensureSingleCompany(db, employee.companyShort, employee.company);
            const changes = db.prepare(`
        UPDATE employees SET
          name = ?, id_number = ?, company_id = ?, department = ?, position = ?,
          employee_type = ?, base_salary = ?, subsidy = ?, has_social = ?,
          has_local_pension = ?, fund_amount = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(employee.name, employee.idCard, companyId, employee.dept, employee.position, employee.type, employee.baseSalary, employee.subsidy, employee.hasSocial ? 1 : 0, employee.hasLocalPension ? 1 : 0, employee.fundAmount, employee.id);
            if (changes.changes === 0) {
                throw new Error(`Employee not found: id=${employee.id}`);
            }
            const row = db.prepare(`${SELECT_EMPLOYEE} WHERE e.id = ?`).get(employee.id);
            return rowToRecord(row);
        })();
    };
    const deleteEmployee = (id) => {
        return db.transaction(() => {
            const deletedInputs = db.prepare("DELETE FROM payroll_inputs WHERE employee_id = ?").run(id);
            const deletedResults = db.prepare("DELETE FROM payroll_results WHERE employee_id = ?").run(id);
            const deleted = db.prepare("DELETE FROM employees WHERE id = ?").run(id);
            if (deleted.changes === 0) {
                throw new Error(`Employee not found: id=${id}`);
            }
            return {
                deletedPayrollInputs: deletedInputs.changes,
                deletedPayrollResults: deletedResults.changes,
            };
        })();
    };
    const replaceEmployees = (employeesInput) => {
        const employees = normalizeEmployees(employeesInput);
        const run = db.transaction(() => {
            const derivedCompanies = [];
            const dedupe = new Set();
            for (const employee of employees) {
                if (employee.companyShort === "" || dedupe.has(employee.companyShort))
                    continue;
                dedupe.add(employee.companyShort);
                derivedCompanies.push({ short: employee.companyShort, full: employee.company || employee.companyShort });
            }
            const companyIds = ensureCompanies(db, derivedCompanies);
            db.prepare("DELETE FROM payroll_results").run();
            db.prepare("DELETE FROM payroll_inputs").run();
            db.prepare("DELETE FROM employees").run();
            const insert = db.prepare(`
        INSERT INTO employees (
          id, name, id_number, company_id, department, position, employee_type,
          base_salary, subsidy, has_social, has_local_pension, fund_amount,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
            for (const employee of employees) {
                insert.run(employee.id, employee.name, employee.idCard, companyIds.get(employee.companyShort) ?? null, employee.dept, employee.position, employee.type, employee.baseSalary, employee.subsidy, employee.hasSocial ? 1 : 0, employee.hasLocalPension ? 1 : 0, employee.fundAmount);
            }
        });
        run();
        return { count: employees.length };
    };
    return { listEmployees, addEmployee, updateEmployee, deleteEmployee, replaceEmployees };
}
//# sourceMappingURL=sqlite-employees.js.map