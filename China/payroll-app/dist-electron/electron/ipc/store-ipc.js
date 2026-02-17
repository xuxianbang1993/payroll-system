/**
 * Register electron-store key-value IPC handlers.
 *
 * Channels: store:get, store:set, store:delete, store:clear
 */
export function registerStoreIpc(ipcMain, store) {
    ipcMain.handle("store:get", (_event, key) => {
        return store.get(key);
    });
    ipcMain.handle("store:set", (_event, key, value) => {
        store.set(key, value);
        return true;
    });
    ipcMain.handle("store:delete", (_event, key) => {
        store.delete(key);
        return true;
    });
    ipcMain.handle("store:clear", () => {
        store.clear();
        return true;
    });
}
//# sourceMappingURL=store-ipc.js.map