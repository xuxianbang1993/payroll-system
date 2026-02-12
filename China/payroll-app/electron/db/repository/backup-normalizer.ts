import type { BackupExportFile, CompanyRecord, EmployeeRecord, NormalizedBackupData } from "./contracts.js";
import {
  DEFAULT_ORG_NAME,
  normalizeCompanies,
  normalizeEmployees,
  normalizeSocialConfig,
} from "./defaults.js";
import { normalizePayrollPayloadRecords } from "./payload-normalizer.js";
import { asRecord, asString, resolveCompanyFullName } from "./normalize.js";

interface NormalizeBackupResult {
  sourceFormat: "legacy" | "extended";
  data: NormalizedBackupData;
}

function ensureCompanyCoverage(
  companies: CompanyRecord[],
  employees: EmployeeRecord[],
): CompanyRecord[] {
  const existing = new Map(companies.map((company) => [company.short, company.full]));

  for (const employee of employees) {
    if (employee.companyShort === "") {
      continue;
    }

    if (!existing.has(employee.companyShort)) {
      existing.set(
        employee.companyShort,
        resolveCompanyFullName(employee.companyShort, employee.company),
      );
    }
  }

  return [...existing.entries()].map(([short, full]) => ({ short, full }));
}

function harmonizeEmployeesWithCompanies(
  employees: EmployeeRecord[],
  companies: CompanyRecord[],
): EmployeeRecord[] {
  const byShort = new Map(companies.map((company) => [company.short, company.full]));

  return employees.map((employee) => {
    if (employee.companyShort === "") {
      return employee;
    }

    const full =
      byShort.get(employee.companyShort) ??
      resolveCompanyFullName(employee.companyShort, employee.company);

    return {
      ...employee,
      company: full,
    };
  });
}

export function normalizeBackupPayload(value: unknown): NormalizeBackupResult {
  const record = asRecord(value) ?? {};
  const hasExtendedData = Boolean(asRecord(record.data));
  const sourceFormat: NormalizeBackupResult["sourceFormat"] = hasExtendedData
    ? "extended"
    : "legacy";

  const payload = (hasExtendedData ? asRecord(record.data) : record) ?? {};
  const employees = normalizeEmployees(payload.employees);
  const companies = ensureCompanyCoverage(normalizeCompanies(payload.companies), employees);

  return {
    sourceFormat,
    data: {
      orgName: asString(payload.orgName, DEFAULT_ORG_NAME),
      social: normalizeSocialConfig(payload.social),
      companies,
      employees: harmonizeEmployeesWithCompanies(employees, companies),
      payrollInputs: hasExtendedData
        ? normalizePayrollPayloadRecords(payload.payrollInputs)
        : [],
      payrollResults: hasExtendedData
        ? normalizePayrollPayloadRecords(payload.payrollResults)
        : [],
    },
  };
}

export function buildBackupExport(data: NormalizedBackupData): BackupExportFile {
  return {
    version: 2,
    source: "payroll-system",
    exportedAt: new Date().toISOString(),
    data,
  };
}
