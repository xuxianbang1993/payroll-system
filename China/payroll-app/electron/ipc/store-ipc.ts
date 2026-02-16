import type { IpcMain } from "electron";
import type Store from "electron-store";

type StoreValue = string | number | boolean | null | Record<string, unknown>;

/**
 * Register electron-store key-value IPC handlers.
 *
 * Channels: store:get, store:set, store:delete, store:clear
 */
export function registerStoreIpc(
  ipcMain: IpcMain,
  store: Store<Record<string, unknown>>,
): void {
  ipcMain.handle("store:get", (_event, key: string) => {
    return store.get(key);
  });

  ipcMain.handle("store:set", (_event, key: string, value: StoreValue) => {
    store.set(key, value);
    return true;
  });

  ipcMain.handle("store:delete", (_event, key: string) => {
    store.delete(key);
    return true;
  });

  ipcMain.handle("store:clear", () => {
    store.clear();
    return true;
  });
}
