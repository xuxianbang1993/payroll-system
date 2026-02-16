import type { Employee, EmployeeFormModel, EmployeeType } from "@/types/payroll";

/**
 * Normalizes legacy Chinese employee type values to English enum keys.
 * Provides backward compatibility for data stored with "管理"/"销售".
 */
export function normalizeEmployeeType(value: string): EmployeeType {
  if (value === "销售" || value === "sales") {
    return "sales";
  }
  return "management";
}

/**
 * Validates that a numeric value is finite and non-negative.
 * Returns an i18n error key if validation fails.
 */
export function validateNumeric(value: number, fieldKey: string): string | null {
  if (!Number.isFinite(value) || value < 0) {
    return `error.numericFieldInvalid|${fieldKey}`;
  }

  return null;
}

/**
 * Resolves company full name from short name, falling back to short if full is empty.
 */
export function toCompanyFullName(companyShort: string, company: string): string {
  const full = company.trim();
  if (full !== "") {
    return full;
  }

  return companyShort.trim();
}

/**
 * Sanitizes and validates employee input.
 * Returns either a sanitized employee model or an error i18n key.
 */
export function sanitizeEmployeeInput(input: EmployeeFormModel): {
  employee: EmployeeFormModel | null;
  errorKey: string;
} {
  const name = input.name.trim();
  if (name === "") {
    return {
      employee: null,
      errorKey: "error.employeeNameEmpty",
    };
  }

  const baseError = validateNumeric(input.baseSalary, "employee.form.baseSalary");
  if (baseError) {
    return {
      employee: null,
      errorKey: baseError,
    };
  }

  const subsidyError = validateNumeric(input.subsidy, "employee.form.subsidy");
  if (subsidyError) {
    return {
      employee: null,
      errorKey: subsidyError,
    };
  }

  const fundAmountError = validateNumeric(input.fundAmount, "employee.form.fund");
  if (fundAmountError) {
    return {
      employee: null,
      errorKey: fundAmountError,
    };
  }

  return {
    employee: {
      ...input,
      name,
      idCard: input.idCard.trim(),
      companyShort: input.companyShort.trim(),
      company: toCompanyFullName(input.companyShort, input.company),
      dept: input.dept.trim(),
      position: input.position.trim(),
      type: normalizeEmployeeType(input.type),
      hasLocalPension: input.hasSocial ? input.hasLocalPension : false,
    },
    errorKey: "",
  };
}

/**
 * Converts a validated EmployeeFormModel to an Employee record with the given ID.
 */
export function toEmployeeRecord(model: EmployeeFormModel, id: number): Employee {
  return {
    id,
    name: model.name,
    idCard: model.idCard,
    companyShort: model.companyShort,
    company: model.company,
    dept: model.dept,
    position: model.position,
    type: model.type,
    baseSalary: model.baseSalary,
    subsidy: model.subsidy,
    hasSocial: model.hasSocial,
    hasLocalPension: model.hasLocalPension,
    fundAmount: model.fundAmount,
  };
}

/**
 * Computes the next employee ID based on the max ID in the current employee list.
 */
export function nextEmployeeId(employees: Employee[]): number {
  if (employees.length === 0) {
    return 1;
  }

  const maxId = employees.reduce((max, employee) => Math.max(max, employee.id), 0);
  return maxId + 1;
}

/**
 * Creates an empty employee form with default values.
 */
export function createEmptyForm(): EmployeeFormModel {
  return {
    name: "",
    idCard: "",
    companyShort: "",
    company: "",
    dept: "",
    position: "",
    type: "management",
    baseSalary: 0,
    subsidy: 0,
    hasSocial: true,
    hasLocalPension: true,
    fundAmount: 0,
  };
}

/**
 * Converts an Employee to an EmployeeFormModel for editing.
 */
export function toFormModel(employee: Employee): EmployeeFormModel {
  return {
    id: employee.id,
    name: employee.name,
    idCard: employee.idCard,
    companyShort: employee.companyShort,
    company: employee.company,
    dept: employee.dept,
    position: employee.position,
    type: employee.type,
    baseSalary: employee.baseSalary,
    subsidy: employee.subsidy,
    hasSocial: employee.hasSocial,
    hasLocalPension: employee.hasLocalPension,
    fundAmount: employee.fundAmount,
  };
}

/**
 * Type definition for inline edit draft state.
 */
export interface InlineEditDraft {
  name: string;
  companyShort: string;
  position: string;
  baseSalary: number;
  subsidy: number;
  fundAmount: number;
}

