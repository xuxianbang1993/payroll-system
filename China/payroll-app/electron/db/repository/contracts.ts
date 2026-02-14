import type { AppEnv, ReadSource, WriteMode } from "../config.js";

export type EmployeeType = "管理" | "销售";

export interface SocialConfig {
  compPension: number;
  compLocalPension: number;
  compUnemploy: number;
  compMedical: number;
  compInjury: number;
  compMaternity: number;
  workerPension: number;
  workerUnemploy: number;
  workerMedical: number;
  pensionBase: number;
  unemploymentBase: number;
  medicalBase: number;
  injuryBase: number;
  maternityBase: number;
}

export interface CompanyRecord {
  short: string;
  full: string;
}

export interface RepositorySettings {
  orgName: string;
  social: SocialConfig;
  companies: CompanyRecord[];
}

export interface EmployeeRecord {
  id: number;
  name: string;
  idCard: string;
  companyShort: string;
  company: string;
  dept: string;
  position: string;
  type: EmployeeType;
  baseSalary: number;
  subsidy: number;
  hasSocial: boolean;
  hasLocalPension: boolean;
  fundAmount: number;
}

export interface PayrollPayloadRecord {
  id: string;
  employeeId: number;
  payrollMonth: string;
  payload: Record<string, unknown>;
}

export interface NormalizedBackupData {
  orgName: string;
  social: SocialConfig;
  companies: CompanyRecord[];
  employees: EmployeeRecord[];
  payrollInputs: PayrollPayloadRecord[];
  payrollResults: PayrollPayloadRecord[];
}

export interface BackupExportFile {
  version: 2;
  source: "payroll-system";
  exportedAt: string;
  data: NormalizedBackupData;
}

export interface ImportBackupResult {
  sourceFormat: "legacy" | "extended";
  importedCompanies: number;
  importedEmployees: number;
  importedPayrollInputs: number;
  importedPayrollResults: number;
}

export interface ReplaceEmployeesResult {
  count: number;
}

export interface ClearDataResult {
  clearedTables: string[];
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

export interface RepositoryAdapter {
  getSettings: () => RepositorySettings;
  saveSettings: (settings: RepositorySettings) => void;
  listEmployees: () => EmployeeRecord[];
  replaceEmployees: (employees: EmployeeRecord[]) => ReplaceEmployeesResult;
  exportBackup: () => BackupExportFile;
  importBackup: (payload: unknown) => ImportBackupResult;
  clearData: () => ClearDataResult;
  getStorageInfo: () => RepositoryStorageInfo;
}

export interface RepositoryContext {
  appEnv: AppEnv;
  readSource: ReadSource;
  writeMode: WriteMode;
}

export interface RepositoryLogger {
  warn: (message: string, metadata?: Record<string, unknown>) => void;
}
