"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { contextBridge, ipcRenderer } = require("electron");
const payrollStore = {
    get: (key) => ipcRenderer.invoke("store:get", key),
    set: (key, value) => ipcRenderer.invoke("store:set", key, value),
    delete: (key) => ipcRenderer.invoke("store:delete", key),
    clear: () => ipcRenderer.invoke("store:clear"),
};
const payrollDbAdmin = {
    getRuntimeInfo: () => ipcRenderer.invoke("db:runtime-info"),
    reset: () => ipcRenderer.invoke("db:reset"),
};
const payrollRepository = {
    getSettings: () => ipcRenderer.invoke("repo:settings:get"),
    saveSettings: (settings) => ipcRenderer.invoke("repo:settings:save", settings),
    listEmployees: () => ipcRenderer.invoke("repo:employees:list"),
    replaceEmployees: (employees) => ipcRenderer.invoke("repo:employees:replace", employees),
    exportBackup: () => ipcRenderer.invoke("repo:data:backup:export"),
    importBackup: (payload) => ipcRenderer.invoke("repo:data:backup:import", payload),
    clearData: () => ipcRenderer.invoke("repo:data:clear"),
    getStorageInfo: () => ipcRenderer.invoke("repo:data:storage-info"),
};
const payrollFiles = {
    saveBackupJson: (request) => ipcRenderer.invoke("file:backup:save-json", request),
    openBackupJson: (request) => ipcRenderer.invoke("file:backup:open-json", request ?? {}),
};
contextBridge.exposeInMainWorld("payrollStore", payrollStore);
contextBridge.exposeInMainWorld("payrollDbAdmin", payrollDbAdmin);
contextBridge.exposeInMainWorld("payrollRepository", payrollRepository);
contextBridge.exposeInMainWorld("payrollFiles", payrollFiles);
//# sourceMappingURL=preload.cjs.map