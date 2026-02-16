import * as xlsx from "xlsx";

import type { Employee, EmployeeImportRow, EmployeeType } from "@/types/payroll";
import { normalizeEmployeeType } from "@/utils/employee-utils";
import { parseNumber } from "@/utils/format.ts";

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

const PERSON_TYPE_MANAGEMENT: EmployeeType = "management";

export interface EmployeeImportParseResult {
  rows: EmployeeImportRow[];
  errors: string[];
}

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseNumberOrFallback(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") return parseNumber(value, fallback);
  return fallback;
}

function isNumericLike(value: unknown): boolean {
  if (typeof value === "number" && Number.isFinite(value)) return true;
  if (typeof value === "string") {
    if (value.trim() === "") return true;
    return Number.isFinite(Number(value));
  }
  return value === null || value === undefined;
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const lowered = asString(value).toLowerCase();
  if (["true", "1", "yes", "y", "是"].includes(lowered)) return true;
  if (["false", "0", "no", "n", "否"].includes(lowered)) return false;
  return fallback;
}

function ensureCompanyFullName(short: string, full: string): string {
  return full !== "" ? full : short;
}

function normalizeEmployeeTypeFromInput(value: unknown): EmployeeType {
  return normalizeEmployeeType(asString(value).toLowerCase());
}

function writeWorkbook(rows: Array<Record<string, unknown>>, sheetName: string): Uint8Array {
  const workbook = xlsx.utils.book_new();
  const sheet = xlsx.utils.json_to_sheet(rows, { header: [...EMPLOYEE_IMPORT_TEMPLATE_HEADERS] });
  xlsx.utils.book_append_sheet(workbook, sheet, sheetName);
  return new Uint8Array(xlsx.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer);
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
    const type = normalizeEmployeeTypeFromInput(sourceRow["人员类型"]);

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
      baseSalary: parseNumberOrFallback(baseSalaryInput, 0),
      subsidy: parseNumberOrFallback(subsidyInput, 0),
      hasSocial,
      hasLocalPension,
      fundAmount: parseNumberOrFallback(fundAmountInput, 0),
    });
  });

  return {
    rows: parsedRows,
    errors,
  };
}
