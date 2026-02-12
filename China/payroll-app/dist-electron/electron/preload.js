import { contextBridge, ipcRenderer } from "electron";
const payrollStore = {
    get: (key) => ipcRenderer.invoke("store:get", key),
    set: (key, value) => ipcRenderer.invoke("store:set", key, value),
    delete: (key) => ipcRenderer.invoke("store:delete", key),
    clear: () => ipcRenderer.invoke("store:clear"),
};
contextBridge.exposeInMainWorld("payrollStore", payrollStore);
//# sourceMappingURL=preload.js.map