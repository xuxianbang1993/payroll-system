export {};

declare global {
  interface Window {
    payrollStore?: {
      get: (key: string) => Promise<unknown>;
      set: (key: string, value: unknown) => Promise<boolean>;
      delete: (key: string) => Promise<boolean>;
      clear: () => Promise<boolean>;
    };
  }
}
