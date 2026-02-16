import type { Employee, Settings } from "@/types/payroll";
import { asObject } from "@/utils/type-guards";

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

export interface RepositoryReplaceEmployeesResult { count: number }
export interface RepositoryClearDataResult { clearedTables: string[] }
export interface RepositoryDeleteEmployeeResult {
  deletedPayrollInputs: number;
  deletedPayrollResults: number;
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

async function invokeRepo<T>(
  fn: (repo: NonNullable<Window["payrollRepository"]>) => Promise<unknown>,
  validate: (result: unknown) => boolean = (v) => asObject(v) !== null,
): Promise<T | null> {
  if (!window.payrollRepository) return null;
  const result = await fn(window.payrollRepository);
  return validate(result) ? (result as T) : null;
}

export function loadRepositorySettings(): Promise<Settings | null> {
  return invokeRepo<Settings>((r) => r.getSettings());
}

export function saveRepositorySettings(settings: Settings): Promise<Settings | null> {
  return invokeRepo<Settings>((r) => r.saveSettings(settings));
}

export async function listRepositoryEmployees(): Promise<Employee[]> {
  if (!window.payrollRepository) return [];
  const result = await window.payrollRepository.listEmployees();
  return Array.isArray(result) ? (result as Employee[]) : [];
}

export function addRepositoryEmployee(employee: Omit<Employee, "id">): Promise<Employee | null> {
  return invokeRepo<Employee>((r) => r.addEmployee(employee));
}

export function updateRepositoryEmployee(employee: Employee): Promise<Employee | null> {
  return invokeRepo<Employee>((r) => r.updateEmployee(employee));
}

export function deleteRepositoryEmployee(id: number): Promise<RepositoryDeleteEmployeeResult | null> {
  return invokeRepo<RepositoryDeleteEmployeeResult>((r) => r.deleteEmployee(id));
}

export function replaceRepositoryEmployees(employees: Employee[]): Promise<RepositoryReplaceEmployeesResult | null> {
  return invokeRepo<RepositoryReplaceEmployeesResult>((r) => r.replaceEmployees(employees));
}

export function exportRepositoryBackup(): Promise<RepositoryBackupFile | null> {
  return invokeRepo<RepositoryBackupFile>((r) => r.exportBackup());
}

export function importRepositoryBackup(payload: unknown): Promise<RepositoryImportResult | null> {
  return invokeRepo<RepositoryImportResult>((r) => r.importBackup(payload));
}

export function clearRepositoryData(): Promise<RepositoryClearDataResult | null> {
  return invokeRepo<RepositoryClearDataResult>((r) => r.clearData());
}

export function loadRepositoryStorageInfo(): Promise<RepositoryStorageInfo | null> {
  return invokeRepo<RepositoryStorageInfo>((r) => r.getStorageInfo());
}
