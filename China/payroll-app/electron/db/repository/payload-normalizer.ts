import type { PayrollPayloadRecord } from "./contracts.js";
import { asPositiveInteger, asRecord, asString } from "./normalize.js";

function normalizePayloadRecord(
  value: unknown,
  fallbackId: string,
): PayrollPayloadRecord | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const employeeId = asPositiveInteger(record.employeeId) ?? asPositiveInteger(record.employee_id);
  if (!employeeId) {
    return null;
  }

  const payload = asRecord(record.payload) ?? {};

  return {
    id: asString(record.id, fallbackId),
    employeeId,
    payrollMonth: asString(record.payrollMonth ?? record.payroll_month, ""),
    payload,
  };
}

export function normalizePayrollPayloadRecords(value: unknown): PayrollPayloadRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const records: PayrollPayloadRecord[] = [];

  for (const [index, item] of value.entries()) {
    const normalized = normalizePayloadRecord(item, `payload-${String(index + 1)}`);
    if (normalized) {
      records.push(normalized);
    }
  }

  return records;
}
