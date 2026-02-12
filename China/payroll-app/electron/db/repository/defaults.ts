import type {
  CompanyRecord,
  EmployeeRecord,
  EmployeeType,
  RepositorySettings,
  SocialConfig,
} from "./contracts.js";
import {
  asBoolean,
  asNumber,
  asPositiveInteger,
  asRecord,
  asString,
  normalizeEmployeeType,
  resolveCompanyFullName,
} from "./normalize.js";
export { normalizePayrollPayloadRecords } from "./payload-normalizer.js";

export const DEFAULT_ORG_NAME = "公司名称";

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

export function createDefaultSettings(): RepositorySettings {
  return {
    orgName: DEFAULT_ORG_NAME,
    social: { ...DEFAULT_SOCIAL_CONFIG },
    companies: [],
  };
}

export function normalizeSocialConfig(value: unknown): SocialConfig {
  const record = asRecord(value) ?? {};

  return {
    compPension: asNumber(record.compPension, DEFAULT_SOCIAL_CONFIG.compPension),
    compLocalPension: asNumber(record.compLocalPension, DEFAULT_SOCIAL_CONFIG.compLocalPension),
    compUnemploy: asNumber(record.compUnemploy, DEFAULT_SOCIAL_CONFIG.compUnemploy),
    compMedical: asNumber(record.compMedical, DEFAULT_SOCIAL_CONFIG.compMedical),
    compInjury: asNumber(record.compInjury, DEFAULT_SOCIAL_CONFIG.compInjury),
    compMaternity: asNumber(record.compMaternity, DEFAULT_SOCIAL_CONFIG.compMaternity),
    workerPension: asNumber(record.workerPension, DEFAULT_SOCIAL_CONFIG.workerPension),
    workerUnemploy: asNumber(record.workerUnemploy, DEFAULT_SOCIAL_CONFIG.workerUnemploy),
    workerMedical: asNumber(record.workerMedical, DEFAULT_SOCIAL_CONFIG.workerMedical),
    pensionBase: asNumber(record.pensionBase, DEFAULT_SOCIAL_CONFIG.pensionBase),
    unemploymentBase: asNumber(record.unemploymentBase, DEFAULT_SOCIAL_CONFIG.unemploymentBase),
    medicalBase: asNumber(record.medicalBase, DEFAULT_SOCIAL_CONFIG.medicalBase),
    injuryBase: asNumber(record.injuryBase, DEFAULT_SOCIAL_CONFIG.injuryBase),
    maternityBase: asNumber(record.maternityBase, DEFAULT_SOCIAL_CONFIG.maternityBase),
  };
}

export function normalizeCompanies(value: unknown): CompanyRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const dedupe = new Set<string>();
  const result: CompanyRecord[] = [];

  for (const item of value) {
    const record = asRecord(item);
    if (!record) {
      continue;
    }

    const short = asString(record.short);
    if (short === "" || dedupe.has(short)) {
      continue;
    }

    dedupe.add(short);
    const full = resolveCompanyFullName(short, asString(record.full));

    result.push({ short, full });
  }

  return result;
}

export function normalizeEmployees(value: unknown): EmployeeRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const output: EmployeeRecord[] = [];
  const usedIds = new Set<number>();

  const assignNextId = (): number => {
    let nextId = 1;
    while (usedIds.has(nextId)) {
      nextId += 1;
    }
    usedIds.add(nextId);
    return nextId;
  };

  for (const item of value) {
    const record = asRecord(item);
    if (!record) {
      continue;
    }

    const name = asString(record.name);
    if (name === "") {
      continue;
    }

    const requestedId =
      asPositiveInteger(record.id) ??
      asPositiveInteger(record.employeeId) ??
      asPositiveInteger(record.employee_id);

    let id: number;
    if (requestedId && !usedIds.has(requestedId)) {
      id = requestedId;
      usedIds.add(id);
    } else {
      id = assignNextId();
    }

    const companyShort = asString(record.companyShort ?? record.company_short);
    const company = resolveCompanyFullName(companyShort, asString(record.company));

    output.push({
      id,
      name,
      idCard: asString(record.idCard ?? record.id_number),
      companyShort,
      company,
      dept: asString(record.dept ?? record.department),
      position: asString(record.position),
      type: normalizeEmployeeType(record.type ?? record.employee_type),
      baseSalary: asNumber(record.baseSalary ?? record.base_salary),
      subsidy: asNumber(record.subsidy),
      hasSocial: asBoolean(record.hasSocial ?? record.has_social),
      hasLocalPension: asBoolean(record.hasLocalPension ?? record.has_local_pension),
      fundAmount: asNumber(record.fundAmount ?? record.fund_amount),
    });
  }

  return output.sort((a, b) => a.id - b.id);
}

export function normalizeRepositorySettings(value: unknown): RepositorySettings {
  const defaults = createDefaultSettings();
  const record = asRecord(value) ?? {};

  return {
    orgName: asString(record.orgName, defaults.orgName),
    social: normalizeSocialConfig(record.social),
    companies: normalizeCompanies(record.companies),
  };
}

export function normalizeType(value: unknown): EmployeeType {
  return normalizeEmployeeType(value);
}
