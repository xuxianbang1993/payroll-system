import type { Employee, EmployeeImportRow } from "@/types/payroll";
import { toCompanyFullName } from "@/utils/employee-utils";

export type ConflictDecision = "overwrite" | "skip";

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

function toEmployeeKey(name: string, idCard: string): string {
  return `${name.trim()}::${idCard.trim()}`;
}

function nextEmployeeId(usedIds: Set<number>): number {
  let nextId = 1;
  while (usedIds.has(nextId)) {
    nextId += 1;
  }
  usedIds.add(nextId);
  return nextId;
}

function toEmployeeRecord(row: EmployeeImportRow, id: number): Employee {
  return {
    id,
    name: row.name,
    idCard: row.idCard,
    companyShort: row.companyShort,
    company: toCompanyFullName(row.companyShort, row.company),
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
