const { contextBridge, ipcRenderer } = require("electron") as typeof import("electron");

type StoreValue = string | number | boolean | null | Record<string, unknown>;

const payrollStore = {
  get: (key: string) => ipcRenderer.invoke("store:get", key),
  set: (key: string, value: StoreValue) => ipcRenderer.invoke("store:set", key, value),
  delete: (key: string) => ipcRenderer.invoke("store:delete", key),
  clear: () => ipcRenderer.invoke("store:clear"),
};

const payrollDbAdmin = {
  getRuntimeInfo: () => ipcRenderer.invoke("db:runtime-info"),
  reset: () => ipcRenderer.invoke("db:reset"),
};

const payrollRepository = {
  getSettings: () => ipcRenderer.invoke("repo:settings:get"),
  saveSettings: (settings: unknown) => ipcRenderer.invoke("repo:settings:save", settings),
  listEmployees: () => ipcRenderer.invoke("repo:employees:list"),
  replaceEmployees: (employees: unknown[]) => ipcRenderer.invoke("repo:employees:replace", employees),
  exportBackup: () => ipcRenderer.invoke("repo:data:backup:export"),
  importBackup: (payload: unknown) => ipcRenderer.invoke("repo:data:backup:import", payload),
  getStorageInfo: () => ipcRenderer.invoke("repo:data:storage-info"),
};

contextBridge.exposeInMainWorld("payrollStore", payrollStore);
contextBridge.exposeInMainWorld("payrollDbAdmin", payrollDbAdmin);
contextBridge.exposeInMainWorld("payrollRepository", payrollRepository);
