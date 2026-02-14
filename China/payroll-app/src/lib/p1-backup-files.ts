export interface SaveBackupJsonRequest {
  payload: unknown;
  orgName?: string;
  suggestedPath?: string;
}

export interface SaveBackupJsonResult {
  canceled: boolean;
  filePath: string | null;
  bytesWritten: number;
}

export interface OpenBackupJsonRequest {
  selectedPath?: string;
}

export interface OpenBackupJsonResult {
  canceled: boolean;
  filePath: string | null;
  payload: unknown | null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export async function saveBackupJsonFile(
  request: SaveBackupJsonRequest,
): Promise<SaveBackupJsonResult | null> {
  if (!window.payrollFiles) {
    return null;
  }

  const result = await window.payrollFiles.saveBackupJson(request);
  if (!asObject(result)) {
    return null;
  }

  return result as SaveBackupJsonResult;
}

export async function openBackupJsonFile(
  request?: OpenBackupJsonRequest,
): Promise<OpenBackupJsonResult | null> {
  if (!window.payrollFiles) {
    return null;
  }

  const result = await window.payrollFiles.openBackupJson(request);
  if (!asObject(result)) {
    return null;
  }

  return result as OpenBackupJsonResult;
}
