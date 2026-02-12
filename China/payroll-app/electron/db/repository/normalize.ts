import type { EmployeeType } from "./contracts.js";

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value).trim();
}

export function asNumber(value: unknown, fallback = 0): number {
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

export function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(lowered)) {
      return true;
    }
    if (["false", "0", "no", "n"].includes(lowered)) {
      return false;
    }
  }

  return fallback;
}

export function asPositiveInteger(value: unknown): number | null {
  const numberValue = asNumber(value, Number.NaN);
  if (!Number.isFinite(numberValue)) {
    return null;
  }

  const integer = Math.trunc(numberValue);
  if (integer <= 0 || numberValue !== integer) {
    return null;
  }

  return integer;
}

export function normalizeEmployeeType(raw: unknown): EmployeeType {
  const value = asString(raw);
  if (value === "销售" || value.toLowerCase() === "sales") {
    return "销售";
  }

  return "管理";
}

export function resolveCompanyFullName(short: string, full: string): string {
  if (full !== "") {
    return full;
  }

  return short;
}
