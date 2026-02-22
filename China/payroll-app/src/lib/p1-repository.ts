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
export interface RepositoryDeletePayrollResult {
  deletedInputs: number;
  deletedResults: number;
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

export function saveRepositoryPayrollInput(
  employeeId: number,
  month: string,
  payload: Record<string, unknown>,
): Promise<RepositoryPayrollPayload | null> {
  return invokeRepo<RepositoryPayrollPayload>((r) =>
    r.savePayrollInput(employeeId, month, payload),
  );
}

export async function listRepositoryPayrollInputs(
  month: string,
): Promise<RepositoryPayrollPayload[]> {
  if (!window.payrollRepository) return [];
  const result = await window.payrollRepository.listPayrollInputs(month);
  return Array.isArray(result) ? (result as RepositoryPayrollPayload[]) : [];
}

export function saveRepositoryPayrollResult(
  employeeId: number,
  month: string,
  payload: Record<string, unknown>,
): Promise<RepositoryPayrollPayload | null> {
  return invokeRepo<RepositoryPayrollPayload>((r) =>
    r.savePayrollResult(employeeId, month, payload),
  );
}

export async function listRepositoryPayrollResults(
  month: string,
): Promise<RepositoryPayrollPayload[]> {
  if (!window.payrollRepository) return [];
  const result = await window.payrollRepository.listPayrollResults(month);
  return Array.isArray(result) ? (result as RepositoryPayrollPayload[]) : [];
}

export function deleteRepositoryPayrollByMonth(
  month: string,
): Promise<RepositoryDeletePayrollResult | null> {
  return invokeRepo<RepositoryDeletePayrollResult>((r) =>
    r.deletePayrollByMonth(month),
  );
}
