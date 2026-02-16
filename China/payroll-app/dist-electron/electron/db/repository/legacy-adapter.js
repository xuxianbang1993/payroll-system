import { createDefaultSettings, normalizeEmployees, normalizeRepositorySettings, } from "./defaults.js";
import { buildBackupExport, normalizeBackupPayload } from "./backup-normalizer.js";
const LEGACY_STATE_KEY = "legacy.repository.state.v1";
const CLEAR_TABLES = [
    "payroll_results",
    "payroll_inputs",
    "employees",
    "companies",
    "settings",
];
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
        const state = readState(options.store);
        return {
            orgName: state.orgName,
            social: state.social,
            companies: state.companies,
        };
    };
    const saveSettings = (settingsInput) => {
        const state = readState(options.store);
        const settings = normalizeRepositorySettings(settingsInput);
        writeState(options.store, {
            ...state,
            orgName: settings.orgName,
            social: settings.social,
            companies: settings.companies,
        });
    };
    const listEmployees = () => {
        const state = readState(options.store);
        return normalizeEmployees(state.employees);
    };
    const replaceEmployees = (employeesInput) => {
        const state = readState(options.store);
        const employees = normalizeEmployees(employeesInput);
        const companiesByShort = new Map(state.companies.map((company) => [company.short, company.full]));
        for (const employee of employees) {
            if (employee.companyShort === "") {
                continue;
            }
            if (!companiesByShort.has(employee.companyShort)) {
                companiesByShort.set(employee.companyShort, employee.company || employee.companyShort);
            }
        }
        writeState(options.store, {
            ...state,
            companies: [...companiesByShort.entries()].map(([short, full]) => ({ short, full })),
            employees,
            payrollInputs: [],
            payrollResults: [],
        });
        return {
            count: employees.length,
        };
    };
    const exportBackup = () => {
        const state = readState(options.store);
        return buildBackupExport(state);
    };
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
            orgName: defaults.orgName,
            social: defaults.social,
            companies: [],
            employees: [],
            payrollInputs: [],
            payrollResults: [],
        });
        return {
            clearedTables: [...CLEAR_TABLES],
        };
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
        replaceEmployees,
        exportBackup,
        importBackup,
        clearData,
        getStorageInfo,
    };
}
//# sourceMappingURL=legacy-adapter.js.map