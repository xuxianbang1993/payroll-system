import type { Employee, Settings } from "@/types/payroll";

export interface RepositoryPayrollPayload {
  id: string;
  employeeId: number;
  payrollMonth: string;
  payload: Record<string, unknown>;
}

export interface RepositoryBackupFile {
  version: number;
  source: string;
  exportedAt: string;
  data: {
    orgName: string;
    social: Settings["social"];
    companies: Settings["companies"];
    employees: Employee[];
    payrollInputs: RepositoryPayrollPayload[];
    payrollResults: RepositoryPayrollPayload[];
  };
}

export interface RepositoryImportResult {
  sourceFormat: "legacy" | "extended";
  importedCompanies: number;
  importedEmployees: number;
  importedPayrollInputs: number;
  importedPayrollResults: number;
}

export interface RepositoryReplaceEmployeesResult {
  count: number;
}

export interface RepositoryStorageInfo {
  dbPath: string;
  schemaVersion: number;
  fileSizeBytes: number;
  employeeCount: number;
  companyCount: number;
  payrollInputCount: number;
  payrollResultCount: number;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export async function loadRepositorySettings(): Promise<Settings | null> {
  if (!window.payrollRepository) {
    return null;
  }

  const result = await window.payrollRepository.getSettings();
  if (!asObject(result)) {
    return null;
  }

  return result as Settings;
}

export async function saveRepositorySettings(settings: Settings): Promise<Settings | null> {
  if (!window.payrollRepository) {
    return null;
  }

  const result = await window.payrollRepository.saveSettings(settings);
  if (!asObject(result)) {
    return null;
  }

  return result as Settings;
}

export async function listRepositoryEmployees(): Promise<Employee[]> {
  if (!window.payrollRepository) {
    return [];
  }

  const result = await window.payrollRepository.listEmployees();
  if (!Array.isArray(result)) {
    return [];
  }

  return result as Employee[];
}

export async function replaceRepositoryEmployees(
  employees: Employee[],
): Promise<RepositoryReplaceEmployeesResult | null> {
  if (!window.payrollRepository) {
    return null;
  }

  const result = await window.payrollRepository.replaceEmployees(employees);
  if (!asObject(result)) {
    return null;
  }

  return result as RepositoryReplaceEmployeesResult;
}

export async function exportRepositoryBackup(): Promise<RepositoryBackupFile | null> {
  if (!window.payrollRepository) {
    return null;
  }

  const result = await window.payrollRepository.exportBackup();
  if (!asObject(result)) {
    return null;
  }

  return result as RepositoryBackupFile;
}

export async function importRepositoryBackup(
  payload: unknown,
): Promise<RepositoryImportResult | null> {
  if (!window.payrollRepository) {
    return null;
  }

  const result = await window.payrollRepository.importBackup(payload);
  if (!asObject(result)) {
    return null;
  }

  return result as RepositoryImportResult;
}

export async function loadRepositoryStorageInfo(): Promise<RepositoryStorageInfo | null> {
  if (!window.payrollRepository) {
    return null;
  }

  const result = await window.payrollRepository.getStorageInfo();
  if (!asObject(result)) {
    return null;
  }

  return result as RepositoryStorageInfo;
}
