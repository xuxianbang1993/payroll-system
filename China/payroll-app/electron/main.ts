import { app, BrowserWindow, ipcMain } from "electron";
import Store from "electron-store";
import path from "node:path";
import { fileURLToPath } from "node:url";

type StoreValue = string | number | boolean | null | Record<string, unknown>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

const appStore = new Store({
  name: "payroll-system",
});

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#f6f5f1",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Payroll Management System",
  });

  if (isDev) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL as string);
    window.webContents.openDevTools({ mode: "detach" });
  } else {
    void window.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  return window;
}

function registerStoreIpc(): void {
  ipcMain.handle("store:get", (_event, key: string) => {
    return appStore.get(key);
  });

  ipcMain.handle("store:set", (_event, key: string, value: StoreValue) => {
    appStore.set(key, value);
    return true;
  });

  ipcMain.handle("store:delete", (_event, key: string) => {
    appStore.delete(key);
    return true;
  });

  ipcMain.handle("store:clear", () => {
    appStore.clear();
    return true;
  });
}

app.whenReady().then(() => {
  registerStoreIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
