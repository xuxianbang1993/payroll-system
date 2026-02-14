import * as xlsx from "xlsx";

import type { Employee, EmployeeImportRow, EmployeeType } from "@/types/payroll";

export const EMPLOYEE_IMPORT_TEMPLATE_HEADERS = [
  "姓名",
  "身份证号",
  "公司简称",
  "公司全称",
  "部门",
  "职位",
  "人员类型",
  "基本工资",
  "补助",
  "是否社保",
  "是否地方养老",
  "公积金金额",
] as const;

const PERSON_TYPE_MANAGEMENT: EmployeeType = "管理";
const PERSON_TYPE_SALES: EmployeeType = "销售";

type ConflictDecision = "overwrite" | "skip";

export interface EmployeeImportParseResult {
  rows: EmployeeImportRow[];
  errors: string[];
}

export interface EmployeeImportConflict {
  row: EmployeeImportRow;
  existing: Employee;
}

export interface EmployeeImportConflictResult {
  conflicts: EmployeeImportConflict[];
  acceptedRows: EmployeeImportRow[];
}

export interface EmployeeImportMergeResult {
  employees: Employee[];
  summary: {
    inserted: number;
    overwritten: number;
    skipped: number;
  };
}

function asString(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeEmployeeType(value: unknown): EmployeeType {
  const text = asString(value).toLowerCase();
  if (text === "销售" || text === "sales") {
    return PERSON_TYPE_SALES;
  }

  return PERSON_TYPE_MANAGEMENT;
}

function parseNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function isNumericLike(value: unknown): boolean {
  if (typeof value === "number" && Number.isFinite(value)) {
    return true;
  }

  if (typeof value === "string") {
    if (value.trim() === "") {
      return true;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed);
  }

  return value === null || value === undefined;
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const lowered = asString(value).toLowerCase();
  if (["true", "1", "yes", "y", "是"].includes(lowered)) {
    return true;
  }
  if (["false", "0", "no", "n", "否"].includes(lowered)) {
    return false;
  }

  return fallback;
}

function toEmployeeKey(name: string, idCard: string): string {
  return `${name.trim()}::${idCard.trim()}`;
}

function ensureCompanyFullName(short: string, full: string): string {
  if (full !== "") {
    return full;
  }

  return short;
}

function nextEmployeeId(usedIds: Set<number>): number {
  let nextId = 1;
  while (usedIds.has(nextId)) {
    nextId += 1;
  }
  usedIds.add(nextId);
  return nextId;
}

function writeWorkbook(rows: Array<Record<string, unknown>>, sheetName: string): Uint8Array {
  const workbook = xlsx.utils.book_new();
  const sheet = xlsx.utils.json_to_sheet(rows, {
    header: [...EMPLOYEE_IMPORT_TEMPLATE_HEADERS],
  });
  xlsx.utils.book_append_sheet(workbook, sheet, sheetName);
  const output = xlsx.write(workbook, { type: "array", bookType: "xlsx" });

  return new Uint8Array(output as ArrayBuffer);
}

export function createEmployeeTemplateWorkbook(): Uint8Array {
  const sampleRow = {
    姓名: "示例员工",
    身份证号: "110101199001010000",
    公司简称: "AC",
    公司全称: "Acme Co",
    部门: "HR",
    职位: "Manager",
    人员类型: PERSON_TYPE_MANAGEMENT,
    基本工资: 10000,
    补助: 500,
    是否社保: "是",
    是否地方养老: "是",
    公积金金额: 300,
  };

  return writeWorkbook([sampleRow], "Template");
}

export function buildEmployeeWorkbook(employees: Employee[]): Uint8Array {
  const rows = employees.map((employee) => ({
    姓名: employee.name,
    身份证号: employee.idCard,
    公司简称: employee.companyShort,
    公司全称: employee.company,
    部门: employee.dept,
    职位: employee.position,
    人员类型: employee.type,
    基本工资: employee.baseSalary,
    补助: employee.subsidy,
    是否社保: employee.hasSocial ? "是" : "否",
    是否地方养老: employee.hasLocalPension ? "是" : "否",
    公积金金额: employee.fundAmount,
  }));

  return writeWorkbook(rows, "Employees");
}

export function parseEmployeeWorkbook(buffer: ArrayBuffer): EmployeeImportParseResult {
  const workbook = xlsx.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return {
      rows: [],
      errors: ["未找到可读取的工作表"],
    };
  }

  const sheet = workbook.Sheets[firstSheetName];
  const sourceRows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const parsedRows: EmployeeImportRow[] = [];
  const errors: string[] = [];

  sourceRows.forEach((sourceRow, index) => {
    const rowNumber = index + 2;
    const name = asString(sourceRow["姓名"]);
    const idCard = asString(sourceRow["身份证号"]);
    const companyShort = asString(sourceRow["公司简称"]);
    const company = ensureCompanyFullName(companyShort, asString(sourceRow["公司全称"]));
    const dept = asString(sourceRow["部门"]);
    const position = asString(sourceRow["职位"]);
    const type = normalizeEmployeeType(sourceRow["人员类型"]);

    const baseSalaryInput = sourceRow["基本工资"];
    const subsidyInput = sourceRow["补助"];
    const fundAmountInput = sourceRow["公积金金额"];

    if (name === "") {
      errors.push(`第 ${String(rowNumber)} 行：姓名不能为空`);
      return;
    }
    if (!isNumericLike(baseSalaryInput)) {
      errors.push(`第 ${String(rowNumber)} 行：基本工资必须为数字`);
      return;
    }
    if (!isNumericLike(subsidyInput)) {
      errors.push(`第 ${String(rowNumber)} 行：补助必须为数字`);
      return;
    }
    if (!isNumericLike(fundAmountInput)) {
      errors.push(`第 ${String(rowNumber)} 行：公积金金额必须为数字`);
      return;
    }

    const hasSocial = parseBoolean(sourceRow["是否社保"], true);
    const hasLocalPension = hasSocial ? parseBoolean(sourceRow["是否地方养老"], true) : false;

    parsedRows.push({
      rowNumber,
      name,
      idCard,
      companyShort,
      company,
      dept,
      position,
      type,
      baseSalary: parseNumber(baseSalaryInput, 0),
      subsidy: parseNumber(subsidyInput, 0),
      hasSocial,
      hasLocalPension,
      fundAmount: parseNumber(fundAmountInput, 0),
    });
  });

  return {
    rows: parsedRows,
    errors,
  };
}

export function findEmployeeImportConflicts(
  existingEmployees: Employee[],
  importRows: EmployeeImportRow[],
): EmployeeImportConflictResult {
  const byKey = new Map<string, Employee>();
  for (const employee of existingEmployees) {
    byKey.set(toEmployeeKey(employee.name, employee.idCard), employee);
  }

  const conflicts: EmployeeImportConflict[] = [];
  const acceptedRows: EmployeeImportRow[] = [];

  for (const row of importRows) {
    const existing = byKey.get(toEmployeeKey(row.name, row.idCard));
    if (existing) {
      conflicts.push({ row, existing });
      continue;
    }

    acceptedRows.push(row);
  }

  return {
    conflicts,
    acceptedRows,
  };
}

function toEmployeeRecord(row: EmployeeImportRow, id: number): Employee {
  return {
    id,
    name: row.name,
    idCard: row.idCard,
    companyShort: row.companyShort,
    company: ensureCompanyFullName(row.companyShort, row.company),
    dept: row.dept,
    position: row.position,
    type: row.type,
    baseSalary: row.baseSalary,
    subsidy: row.subsidy,
    hasSocial: row.hasSocial,
    hasLocalPension: row.hasSocial ? row.hasLocalPension : false,
    fundAmount: row.fundAmount,
  };
}

export function mergeEmployeeImportRows(
  existingEmployees: Employee[],
  importRows: EmployeeImportRow[],
  resolveConflict: (conflict: EmployeeImportConflict) => ConflictDecision,
): EmployeeImportMergeResult {
  const conflicts = findEmployeeImportConflicts(existingEmployees, importRows);
  const byId = new Map<number, Employee>();
  const usedIds = new Set<number>();

  for (const employee of existingEmployees) {
    byId.set(employee.id, employee);
    usedIds.add(employee.id);
  }

  let inserted = 0;
  let overwritten = 0;
  let skipped = 0;

  for (const row of conflicts.acceptedRows) {
    const id = nextEmployeeId(usedIds);
    byId.set(id, toEmployeeRecord(row, id));
    inserted += 1;
  }

  for (const conflict of conflicts.conflicts) {
    const decision = resolveConflict(conflict);
    if (decision === "skip") {
      skipped += 1;
      continue;
    }

    byId.set(conflict.existing.id, toEmployeeRecord(conflict.row, conflict.existing.id));
    overwritten += 1;
  }

  return {
    employees: Array.from(byId.values()).sort((left, right) => left.id - right.id),
    summary: {
      inserted,
      overwritten,
      skipped,
    },
  };
}
