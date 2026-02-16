import type { Company, Employee, Settings, SocialConfig } from "@/types/payroll";

export const DEFAULT_SOCIAL_CONFIG: SocialConfig = {
  compPension: 16,
  compLocalPension: 1,
  compUnemploy: 0.8,
  compMedical: 5,
  compInjury: 0.4,
  compMaternity: 0.5,
  workerPension: 8,
  workerUnemploy: 0.2,
  workerMedical: 2,
  pensionBase: 4775,
  unemploymentBase: 3000,
  medicalBase: 6727,
  injuryBase: 3000,
  maternityBase: 6727,
};

export const DEFAULT_SETTINGS: Settings = {
  orgName: "",
  social: { ...DEFAULT_SOCIAL_CONFIG },
  companies: [],
};

export interface OrgStats {
  employeeCount: number;
  companyCount: number;
  monthlyBaseTotal: number;
}

/**
 * Normalizes settings from repository, filling in defaults for missing fields.
 */
export function normalizeSettings(value: Settings | null): Settings {
  if (!value) {
    return {
      ...DEFAULT_SETTINGS,
      social: { ...DEFAULT_SOCIAL_CONFIG },
      companies: [],
    };
  }

  return {
    orgName: value.orgName,
    social: {
      ...DEFAULT_SOCIAL_CONFIG,
      ...value.social,
    },
    companies: Array.isArray(value.companies) ? value.companies : [],
  };
}

/**
 * Computes organization statistics from employee list.
 */
export function computeOrgStats(employees: Employee[]): OrgStats {
  const companies = new Set<string>();
  let monthlyBaseTotal = 0;

  for (const employee of employees) {
    if (employee.companyShort.trim() !== "") {
      companies.add(employee.companyShort.trim());
    }
    monthlyBaseTotal += employee.baseSalary + employee.subsidy;
  }

  return {
    employeeCount: employees.length,
    companyCount: companies.size,
    monthlyBaseTotal,
  };
}

/**
 * Normalizes and deduplicates company list, sorting by Chinese collation.
 */
export function normalizeCompanies(companies: Company[]): Company[] {
  const dedupe = new Set<string>();
  const normalized: Company[] = [];

  for (const company of companies) {
    const short = company.short.trim();
    const full = company.full.trim();
    if (short === "" || dedupe.has(short)) {
      continue;
    }

    dedupe.add(short);
    normalized.push({ short, full: full || short });
  }

  return normalized.sort((left, right) => left.short.localeCompare(right.short, "zh-Hans-CN"));
}

/**
 * Validates that organization name is not empty after trimming.
 */
export function validateOrgName(orgName: string): { valid: boolean; errorKey?: string } {
  const trimmed = orgName.trim();
  if (trimmed === "") {
    return { valid: false, errorKey: "error.orgNameEmpty" };
  }

  return { valid: true };
}

/**
 * Validates company short name and checks for duplicates.
 */
export function validateCompanyShort(
  short: string,
  existingCompanies: Company[],
  previousShort?: string,
): { valid: boolean; errorKey?: string } {
  const trimmedShort = short.trim();
  if (trimmedShort === "") {
    return { valid: false, errorKey: "error.companyShortEmpty" };
  }

  const duplicate = existingCompanies.find(
    (item) => item.short === trimmedShort && item.short !== (previousShort ?? ""),
  );
  if (duplicate) {
    return { valid: false, errorKey: "error.companyShortDuplicate" };
  }

  return { valid: true };
}
