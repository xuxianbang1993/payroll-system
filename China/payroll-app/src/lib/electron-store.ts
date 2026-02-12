const UI_STATE_KEY = "ui-state";

export interface ExternalUiState {
  language?: string;
  selectedMonth?: string;
}

export async function loadExternalUiState(): Promise<ExternalUiState | null> {
  if (!window.payrollStore) {
    return null;
  }

  const stored = await window.payrollStore.get(UI_STATE_KEY);
  if (!stored || typeof stored !== "object") {
    return null;
  }

  return stored as ExternalUiState;
}

export async function saveExternalUiState(state: ExternalUiState): Promise<void> {
  if (!window.payrollStore) {
    return;
  }

  await window.payrollStore.set(UI_STATE_KEY, state);
}
