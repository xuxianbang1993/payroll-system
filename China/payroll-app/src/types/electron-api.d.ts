export {};

declare global {
  interface Window {
    payrollStore?: {
      get: (key: string) => Promise<unknown>;
      set: (key: string, value: unknown) => Promise<boolean>;
      delete: (key: string) => Promise<boolean>;
      clear: () => Promise<boolean>;
    };
    payrollDbAdmin?: {
      getRuntimeInfo: () => Promise<unknown>;
      reset: () => Promise<unknown>;
    };
    payrollRepository?: {
      getSettings: () => Promise<unknown>;
      saveSettings: (settings: unknown) => Promise<unknown>;
      listEmployees: () => Promise<unknown>;
      replaceEmployees: (employees: unknown[]) => Promise<unknown>;
      exportBackup: () => Promise<unknown>;
      importBackup: (payload: unknown) => Promise<unknown>;
      clearData: () => Promise<unknown>;
      getStorageInfo: () => Promise<unknown>;
    };
    payrollFiles?: {
      saveBackupJson: (request: { payload: unknown; orgName?: string; suggestedPath?: string }) => Promise<unknown>;
      openBackupJson: (request?: { selectedPath?: string }) => Promise<unknown>;
    };
  }
}
