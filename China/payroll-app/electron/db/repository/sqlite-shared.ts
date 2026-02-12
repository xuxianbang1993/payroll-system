import type Database from "better-sqlite3";

import type { CompanyRecord, EmployeeRecord } from "./contracts.js";

export function toCompanyId(short: string): string {
  return `company:${short}`;
}

export function parseJsonRecord(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

export function asEmployeeType(raw: string): EmployeeRecord["type"] {
  return raw === "销售" ? "销售" : "管理";
}

export function ensureCompanies(
  db: Database.Database,
  companies: CompanyRecord[],
): Map<string, string> {
  const upsert = db.prepare(`
    INSERT INTO companies (id, short, full, created_at, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      short = excluded.short,
      full = excluded.full,
      updated_at = CURRENT_TIMESTAMP;
  `);

  const companyIdByShort = new Map<string, string>();

  for (const company of companies) {
    const short = company.short.trim();
    if (short === "") {
      continue;
    }

    const id = toCompanyId(short);
    upsert.run(id, short, company.full);
    companyIdByShort.set(short, id);
  }

  return companyIdByShort;
}
