export interface DbRuntimeInfo {
  appEnv: "prod" | "test";
  readSource: "legacy" | "sqlite";
  writeMode: "legacy" | "dual" | "sqlite";
  dbPath: string;
  schemaVersion: number;
  pragmas: {
    journalMode: string;
    foreignKeys: number;
  };
}

export interface DbResetResult {
  clearedTables: string[];
}

export async function loadDbRuntimeInfo(): Promise<DbRuntimeInfo | null> {
  if (!window.payrollDbAdmin) {
    return null;
  }

  const result = await window.payrollDbAdmin.getRuntimeInfo();
  if (!result || typeof result !== "object") {
    return null;
  }

  return result as DbRuntimeInfo;
}

export async function resetDbForTesting(): Promise<DbResetResult | null> {
  if (!window.payrollDbAdmin) {
    return null;
  }

  const result = await window.payrollDbAdmin.reset();
  if (!result || typeof result !== "object") {
    return null;
  }

  return result as DbResetResult;
}
