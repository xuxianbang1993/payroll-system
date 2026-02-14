import type Store from "electron-store";

import type {
  ImportBackupResult,
  NormalizedBackupData,
  RepositoryAdapter,
  RepositorySettings,
} from "./contracts.js";
import {
  createDefaultSettings,
  normalizeEmployees,
  normalizeRepositorySettings,
} from "./defaults.js";
import { buildBackupExport, normalizeBackupPayload } from "./backup-normalizer.js";

const LEGACY_STATE_KEY = "legacy.repository.state.v1";
const CLEAR_TABLES = [
  "payroll_results",
  "payroll_inputs",
  "employees",
  "companies",
  "settings",
];

interface CreateLegacyRepositoryAdapterOptions {
  store: Store<Record<string, unknown>>;
  dbPath: string;
  schemaVersion: number;
}

function readState(
  store: Store<Record<string, unknown>>,
): NormalizedBackupData {
  const defaults = createDefaultSettings();
  const state = store.get(LEGACY_STATE_KEY);

  const normalized = normalizeBackupPayload(
    state ?? {
      orgName: defaults.orgName,
      social: defaults.social,
      companies: defaults.companies,
      employees: [],
      payrollInputs: [],
      payrollResults: [],
    },
  );

  return normalized.data;
}

function writeState(
  store: Store<Record<string, unknown>>,
  state: NormalizedBackupData,
): void {
  store.set(LEGACY_STATE_KEY, state as unknown as Record<string, unknown>);
}

export function createLegacyRepositoryAdapter(
  options: CreateLegacyRepositoryAdapterOptions,
): RepositoryAdapter {
  const getSettings = (): RepositorySettings => {
    const state = readState(options.store);

    return {
      orgName: state.orgName,
      social: state.social,
      companies: state.companies,
    };
  };

  const saveSettings = (settingsInput: RepositorySettings): void => {
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

  const replaceEmployees: RepositoryAdapter["replaceEmployees"] = (employeesInput) => {
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

  const importBackup = (payload: unknown): ImportBackupResult => {
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

  const clearData: RepositoryAdapter["clearData"] = () => {
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
