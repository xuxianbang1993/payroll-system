import { randomUUID } from "node:crypto";
import { parseJsonRecord } from "./sqlite-shared.js";
// ---------------------------------------------------------------------------
// CRIT-001 -- Month format validation (YYYY-MM)
// ---------------------------------------------------------------------------
const PAYROLL_MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
function assertValidPayrollMonth(month) {
    if (!PAYROLL_MONTH_RE.test(month)) {
        throw new Error(`Invalid payroll month "${month}". Expected format: YYYY-MM (e.g. "2026-02").`);
    }
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function rowToRecord(row) {
    return {
        id: String(row.id),
        employeeId: Number(row.employee_id),
        payrollMonth: String(row.payroll_month),
        payload: parseJsonRecord(String(row.payload)),
    };
}
function createTableStatements(db, table) {
    return {
        // CRIT-002 -- upsert via ON CONFLICT on the UNIQUE(employee_id, payroll_month) index
        upsertOne: db.prepare(`INSERT INTO ${table} (id, employee_id, payroll_month, payload, created_at, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(employee_id, payroll_month) DO UPDATE SET
         payload = excluded.payload,
         updated_at = CURRENT_TIMESTAMP`),
        selectByEmployeeMonth: db.prepare(`SELECT id, employee_id, payroll_month, payload
       FROM ${table}
       WHERE employee_id = ? AND payroll_month = ?
       ORDER BY created_at ASC
       LIMIT 1`),
        selectByMonth: db.prepare(`SELECT id, employee_id, payroll_month, payload
       FROM ${table}
       WHERE payroll_month = ?
       ORDER BY employee_id ASC`),
        deleteByMonth: db.prepare(`DELETE FROM ${table} WHERE payroll_month = ?`),
    };
}
// CRIT-002 -- Simplified from SELECT+INSERT/UPDATE to single upsert
function savePayrollPayload(db, statements, employeeId, month, payload) {
    return db.transaction(() => {
        const payloadJson = JSON.stringify(payload);
        statements.upsertOne.run(randomUUID(), employeeId, month, payloadJson);
        const row = statements.selectByEmployeeMonth.get(employeeId, month);
        if (!row) {
            throw new Error(`Failed to save payroll payload: employeeId=${employeeId}, month=${month}`);
        }
        return rowToRecord(row);
    })();
}
function listPayrollPayloads(statements, month) {
    const rows = statements.selectByMonth.all(month);
    return rows.map((row) => rowToRecord(row));
}
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function createSqlitePayrollActions(db) {
    const inputStatements = createTableStatements(db, "payroll_inputs");
    const resultStatements = createTableStatements(db, "payroll_results");
    const savePayrollInput = (employeeId, month, payload) => {
        assertValidPayrollMonth(month);
        return savePayrollPayload(db, inputStatements, employeeId, month, payload);
    };
    const listPayrollInputs = (month) => {
        assertValidPayrollMonth(month);
        return listPayrollPayloads(inputStatements, month);
    };
    const savePayrollResult = (employeeId, month, payload) => {
        assertValidPayrollMonth(month);
        return savePayrollPayload(db, resultStatements, employeeId, month, payload);
    };
    const listPayrollResults = (month) => {
        assertValidPayrollMonth(month);
        return listPayrollPayloads(resultStatements, month);
    };
    const deletePayrollByMonth = (month) => {
        assertValidPayrollMonth(month);
        return db.transaction(() => {
            const deletedInputs = inputStatements.deleteByMonth.run(month).changes;
            const deletedResults = resultStatements.deleteByMonth.run(month).changes;
            return { deletedInputs, deletedResults };
        })();
    };
    return {
        savePayrollInput,
        listPayrollInputs,
        savePayrollResult,
        listPayrollResults,
        deletePayrollByMonth,
    };
}
//# sourceMappingURL=sqlite-payroll.js.map