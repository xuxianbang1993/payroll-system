import { createDefaultSettings, normalizeEmployees, normalizeRepositorySettings, } from "./defaults.js";
import { buildBackupExport, normalizeBackupPayload } from "./backup-normalizer.js";
const LEGACY_STATE_KEY = "legacy.repository.state.v1";
const CLEAR_TABLES = ["payroll_results", "payroll_inputs", "employees", "companies", "settings"];
function readState(store) {
    const defaults = createDefaultSettings();
    const state = store.get(LEGACY_STATE_KEY);
    const normalized = normalizeBackupPayload(state ?? {
        orgName: defaults.orgName,
        social: defaults.social,
        companies: defaults.companies,
        employees: [],
        payrollInputs: [],
        payrollResults: [],
    });
    return normalized.data;
}
function writeState(store, state) {
    store.set(LEGACY_STATE_KEY, state);
}
export function createLegacyRepositoryAdapter(options) {
    const getSettings = () => {
        const { orgName, social, companies } = readState(options.store);
        return { orgName, social, companies };
    };
    const saveSettings = (settingsInput) => {
        const state = readState(options.store);
        const { orgName, social, companies } = normalizeRepositorySettings(settingsInput);
        writeState(options.store, { ...state, orgName, social, companies });
    };
    const listEmployees = () => normalizeEmployees(readState(options.store).employees);
    const replaceEmployees = (employeesInput) => {
        const state = readState(options.store);
        const employees = normalizeEmployees(employeesInput);
        const companiesByShort = new Map(state.companies.map((c) => [c.short, c.full]));
        for (const e of employees) {
            if (e.companyShort !== "" && !companiesByShort.has(e.companyShort)) {
                companiesByShort.set(e.companyShort, e.company || e.companyShort);
            }
        }
        writeState(options.store, {
            ...state,
            companies: [...companiesByShort.entries()].map(([short, full]) => ({ short, full })),
            employees,
            payrollInputs: [],
            payrollResults: [],
        });
        return { count: employees.length };
    };
    const addEmployee = (input) => {
        const state = readState(options.store);
        const employees = normalizeEmployees(state.employees);
        const maxId = employees.reduce((max, e) => Math.max(max, e.id), 0);
        const newEmployee = { ...input, id: maxId + 1 };
        const normalized = normalizeEmployees([...employees, newEmployee]);
        writeState(options.store, { ...state, employees: normalized });
        return normalized.find((e) => e.id === newEmployee.id);
    };
    const updateEmployee = (employee) => {
        const state = readState(options.store);
        const exists = state.employees.some((e) => e.id === employee.id);
        if (!exists) {
            throw new Error(`Employee not found: id=${employee.id}`);
        }
        const updated = normalizeEmployees(state.employees.map((e) => (e.id === employee.id ? employee : e)));
        writeState(options.store, { ...state, employees: updated });
        return updated.find((e) => e.id === employee.id);
    };
    const deleteEmployee = (id) => {
        const state = readState(options.store);
        const exists = state.employees.some((e) => e.id === id);
        if (!exists) {
            throw new Error(`Employee not found: id=${id}`);
        }
        const deletedInputs = state.payrollInputs.filter((p) => p.employeeId === id).length;
        const deletedResults = state.payrollResults.filter((p) => p.employeeId === id).length;
        writeState(options.store, {
            ...state,
            employees: state.employees.filter((e) => e.id !== id),
            payrollInputs: state.payrollInputs.filter((p) => p.employeeId !== id),
            payrollResults: state.payrollResults.filter((p) => p.employeeId !== id),
        });
        return { deletedPayrollInputs: deletedInputs, deletedPayrollResults: deletedResults };
    };
    const exportBackup = () => buildBackupExport(readState(options.store));
    const importBackup = (payload) => {
        const normalized = normalizeBackupPayload(payload);
        writeState(options.store, normalized.data);
        return {
            sourceFormat: normalized.sourceFormat,
            importedCompanies: normalized.data.companies.length,
            importedEmployees: normalized.data.employees.length,
            importedPayrollInputs: normalized.data.payrollInputs.length,
            importedPayrollResults: normalized.data.payrollResults.length,
        };
    };
    const clearData = () => {
        const defaults = createDefaultSettings();
        writeState(options.store, {
            orgName: defaults.orgName, social: defaults.social,
            companies: [], employees: [], payrollInputs: [], payrollResults: [],
        });
        return { clearedTables: [...CLEAR_TABLES] };
    };
    const getStorageInfo = () => {
        const state = readState(options.store);
        return {
            dbPath: options.dbPath,
            schemaVersion: options.schemaVersion,
            fileSizeBytes: 0,
            employeeCount: state.employees.length,
            companyCount: state.companies.length,
            payrollInputCount: state.payrollInputs.length,
            payrollResultCount: state.payrollResults.length,
        };
    };
    return {
        getSettings,
        saveSettings,
        listEmployees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        replaceEmployees,
        exportBackup,
        importBackup,
        clearData,
        getStorageInfo,
    };
}
//# sourceMappingURL=legacy-adapter.js.map