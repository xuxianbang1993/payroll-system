export type AppLanguage = "zh-CN" | "zh-HK" | "en";

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

export interface Company {
  short: string;
  full: string;
}

export type EmployeeType = "管理" | "销售";

export interface Employee {
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

export interface Settings {
  orgName: string;
  social: SocialConfig;
  companies: Company[];
}

export interface SettingsFormModel {
  orgName: string;
  social: SocialConfig;
  companies: Company[];
}

export interface EmployeeFormModel {
  id?: number;
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

export interface EmployeeImportRow extends EmployeeFormModel {
  rowNumber: number;
}

export interface PayrollInput {
  perfGrade?: string;
  perfSalary?: number;
  commission?: number;
  bonus?: number;
  absentHours?: number;
  tax?: number;
  otherAdj?: number;
}

export interface PaySlip {
  base: number;
  perfSalary: number;
  commission: number;
  bonus: number;
  totalPerf: number;
  otherAdj: number;
  fullGrossPay: number;
  absentH: number;
  absentDeduct: number;
  grossPay: number;
  cPension: number;
  cLocalPension: number;
  cUnemploy: number;
  cMedical: number;
  cInjury: number;
  cMaternity: number;
  cSocial: number;
  cFund: number;
  cTotal: number;
  wPension: number;
  wUnemploy: number;
  wMedical: number;
  wSocial: number;
  wFund: number;
  tax: number;
  totalDeduct: number;
  netPay: number;
  hourlyRate: number;
  perfGrade: string;
  type: EmployeeType;
  companyShort: string;
}
