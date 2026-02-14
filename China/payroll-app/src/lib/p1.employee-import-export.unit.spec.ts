import { describe, expect, it } from "vitest";
import xlsx from "xlsx";

import type { Employee } from "@/types/payroll";
import {
  EMPLOYEE_IMPORT_TEMPLATE_HEADERS,
  buildEmployeeWorkbook,
  createEmployeeTemplateWorkbook,
  findEmployeeImportConflicts,
  mergeEmployeeImportRows,
  parseEmployeeWorkbook,
} from "@/lib/p1-employee-import-export";

const existingEmployees: Employee[] = [
  {
    id: 1,
    name: "Alice",
    idCard: "110101199001010011",
    companyShort: "AC",
    company: "Acme Co",
    dept: "HR",
    position: "Manager",
    type: "管理",
    baseSalary: 10000,
    subsidy: 500,
    hasSocial: true,
    hasLocalPension: true,
    fundAmount: 300,
  },
  {
    id: 2,
    name: "Bob",
    idCard: "110101199001010022",
    companyShort: "BC",
    company: "Beta Co",
    dept: "Sales",
    position: "Sales",
    type: "销售",
    baseSalary: 9000,
    subsidy: 600,
    hasSocial: true,
    hasLocalPension: false,
    fundAmount: 280,
  },
];

describe("P1 employee import/export utilities", () => {
  it("creates template workbook with standard columns", () => {
    const bytes = createEmployeeTemplateWorkbook();
    const workbook = xlsx.read(bytes, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
    const rows = xlsx.utils.sheet_to_json<Record<string, string>>(sheet);

    expect(Object.keys(rows[0] ?? {})).toEqual(EMPLOYEE_IMPORT_TEMPLATE_HEADERS);
  });

  it("parses workbook and validates required/numeric fields", () => {
    const workbook = xlsx.utils.book_new();
    const sheet = xlsx.utils.json_to_sheet([
      {
        姓名: "",
        身份证号: "",
        公司简称: "AC",
        公司全称: "Acme Co",
        部门: "",
        职位: "",
        人员类型: "管理",
        基本工资: "bad-number",
        补助: 100,
        是否社保: "是",
        是否地方养老: "否",
        公积金金额: 50,
      },
      {
        姓名: "Carol",
        身份证号: "110101199001010099",
        公司简称: "AC",
        公司全称: "Acme Co",
        部门: "Ops",
        职位: "Lead",
        人员类型: "管理",
        基本工资: 12000,
        补助: 800,
        是否社保: "是",
        是否地方养老: "是",
        公积金金额: 500,
      },
    ]);
    xlsx.utils.book_append_sheet(workbook, sheet, "Employees");

    const bytes = xlsx.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const parsed = parseEmployeeWorkbook(bytes);

    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]?.name).toBe("Carol");
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.errors[0]).toContain("第 2 行");
  });

  it("detects import conflicts by name + idCard", () => {
    const rows = [
      {
        rowNumber: 2,
        name: "Alice",
        idCard: "110101199001010011",
        companyShort: "AC",
        company: "Acme Co",
        dept: "HR",
        position: "Manager",
        type: "管理" as const,
        baseSalary: 12000,
        subsidy: 800,
        hasSocial: true,
        hasLocalPension: true,
        fundAmount: 500,
      },
      {
        rowNumber: 3,
        name: "Carol",
        idCard: "110101199001010033",
        companyShort: "AC",
        company: "Acme Co",
        dept: "Ops",
        position: "Analyst",
        type: "管理" as const,
        baseSalary: 8000,
        subsidy: 200,
        hasSocial: false,
        hasLocalPension: false,
        fundAmount: 100,
      },
    ];

    const result = findEmployeeImportConflicts(existingEmployees, rows);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0]?.existing.id).toBe(1);
    expect(result.acceptedRows).toHaveLength(1);
    expect(result.acceptedRows[0]?.name).toBe("Carol");
  });

  it("merges imported rows with overwrite and skip policies", () => {
    const rows = [
      {
        rowNumber: 2,
        name: "Alice",
        idCard: "110101199001010011",
        companyShort: "AC",
        company: "Acme Co",
        dept: "HR",
        position: "Director",
        type: "管理" as const,
        baseSalary: 13000,
        subsidy: 700,
        hasSocial: true,
        hasLocalPension: true,
        fundAmount: 600,
      },
      {
        rowNumber: 3,
        name: "Carol",
        idCard: "110101199001010033",
        companyShort: "AC",
        company: "Acme Co",
        dept: "Ops",
        position: "Analyst",
        type: "管理" as const,
        baseSalary: 9000,
        subsidy: 200,
        hasSocial: false,
        hasLocalPension: false,
        fundAmount: 100,
      },
    ];

    const overwriteResult = mergeEmployeeImportRows(existingEmployees, rows, () => "overwrite");
    expect(overwriteResult.summary.overwritten).toBe(1);
    expect(overwriteResult.summary.inserted).toBe(1);
    expect(overwriteResult.summary.skipped).toBe(0);
    expect(overwriteResult.employees.find((employee) => employee.id === 1)?.position).toBe("Director");

    const skipResult = mergeEmployeeImportRows(existingEmployees, rows, () => "skip");
    expect(skipResult.summary.overwritten).toBe(0);
    expect(skipResult.summary.inserted).toBe(1);
    expect(skipResult.summary.skipped).toBe(1);
    expect(skipResult.employees.find((employee) => employee.id === 1)?.position).toBe("Manager");
  });

  it("exports workbook rows from employee list", () => {
    const bytes = buildEmployeeWorkbook(existingEmployees);
    const workbook = xlsx.read(bytes, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet);

    expect(rows).toHaveLength(2);
    expect(rows[0]?.姓名).toBe("Alice");
    expect(rows[1]?.公司简称).toBe("BC");
  });
});
