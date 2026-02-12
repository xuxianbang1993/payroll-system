import { contextBridge, ipcRenderer } from "electron";

type StoreValue = string | number | boolean | null | Record<string, unknown>;

const payrollStore = {
  get: (key: string) => ipcRenderer.invoke("store:get", key),
  set: (key: string, value: StoreValue) => ipcRenderer.invoke("store:set", key, value),
  delete: (key: string) => ipcRenderer.invoke("store:delete", key),
  clear: () => ipcRenderer.invoke("store:clear"),
};

contextBridge.exposeInMainWorld("payrollStore", payrollStore);
