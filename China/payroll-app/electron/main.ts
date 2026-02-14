import { app, BrowserWindow, ipcMain } from "electron";
import Store from "electron-store";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveRendererIndexPath } from "./app-paths.js";
import { createDatabaseClient, type DatabaseClient } from "./db/client.js";
import { resolveRuntimeConfig } from "./db/config.js";
import { createPayrollRepository } from "./db/repository/index.js";
import type {
  EmployeeRecord,
  RepositoryAdapter,
  RepositorySettings,
} from "./db/repository/contracts.js";
import { resetDatabase } from "./db/reset.js";
import { openBackupJsonFile, saveBackupJsonFile } from "./file/backup-file-service.js";

type StoreValue = string | number | boolean | null | Record<string, unknown>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

const appStore = new Store<Record<string, unknown>>({
  name: "payroll-system",
});

let dbClient: DatabaseClient | null = null;
let repository: RepositoryAdapter | null = null;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#f6f5f1",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Payroll Management System",
  });

  if (isDev) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL as string);
    window.webContents.openDevTools({ mode: "detach" });
  } else {
    void window.loadFile(resolveRendererIndexPath(__dirname));
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

function getDbClientOrThrow(): DatabaseClient {
  if (!dbClient) {
    throw new Error("Database client is not initialized.");
  }

  return dbClient;
}

function getRepositoryOrThrow(): RepositoryAdapter {
  if (!repository) {
    throw new Error("Repository is not initialized.");
  }

  return repository;
}

function registerDbIpc(): void {
  ipcMain.handle("db:runtime-info", () => {
    const client = getDbClientOrThrow();

    return {
      appEnv: client.config.appEnv,
      readSource: client.config.readSource,
      writeMode: client.config.writeMode,
      dbPath: client.config.dbPath,
      schemaVersion: client.schemaVersion,
      pragmas: client.pragmas,
    };
  });

  ipcMain.handle("db:reset", () => {
    const client = getDbClientOrThrow();
    return resetDatabase({
      appEnv: client.config.appEnv,
      db: client.db,
    });
  });
}

function registerRepositoryIpc(): void {
  ipcMain.handle("repo:settings:get", () => {
    return getRepositoryOrThrow().getSettings();
  });

  ipcMain.handle("repo:settings:save", (_event, settings: unknown) => {
    const repo = getRepositoryOrThrow();
    repo.saveSettings(settings as RepositorySettings);
    return repo.getSettings();
  });

  ipcMain.handle("repo:employees:list", () => {
    return getRepositoryOrThrow().listEmployees();
  });

  ipcMain.handle("repo:employees:replace", (_event, employees: unknown) => {
    const safeEmployees = Array.isArray(employees) ? employees : [];
    return getRepositoryOrThrow().replaceEmployees(safeEmployees as EmployeeRecord[]);
  });

  ipcMain.handle("repo:data:backup:export", () => {
    return getRepositoryOrThrow().exportBackup();
  });

  ipcMain.handle("repo:data:backup:import", (_event, payload: unknown) => {
    return getRepositoryOrThrow().importBackup(payload);
  });

  ipcMain.handle("repo:data:clear", () => {
    return getRepositoryOrThrow().clearData();
  });

  ipcMain.handle("repo:data:storage-info", () => {
    return getRepositoryOrThrow().getStorageInfo();
  });
}

function registerFileIpc(): void {
  ipcMain.handle("file:backup:save-json", (event, request: unknown) => {
    const payload = asRecord(request);
    const ownerWindow = BrowserWindow.fromWebContents(event.sender) ?? null;
    const orgName = typeof payload.orgName === "string" ? payload.orgName : undefined;
    const suggestedPath =
      typeof payload.suggestedPath === "string" ? payload.suggestedPath : undefined;

    return saveBackupJsonFile({
      ownerWindow,
      payload: payload.payload,
      orgName,
      suggestedPath,
    });
  });

  ipcMain.handle("file:backup:open-json", (event, request: unknown) => {
    const payload = asRecord(request);
    const ownerWindow = BrowserWindow.fromWebContents(event.sender) ?? null;
    const selectedPath =
      typeof payload.selectedPath === "string" ? payload.selectedPath : undefined;

    return openBackupJsonFile({
      ownerWindow,
      selectedPath,
    });
  });
}

async function bootstrapApp(): Promise<void> {
  const runtimeConfig = resolveRuntimeConfig({
    userDataPath: app.getPath("userData"),
    env: process.env,
  });
  dbClient = createDatabaseClient(runtimeConfig);
  repository = createPayrollRepository({
    db: dbClient.db,
    store: appStore,
    context: {
      appEnv: dbClient.config.appEnv,
      readSource: dbClient.config.readSource,
      writeMode: dbClient.config.writeMode,
    },
    dbPath: dbClient.config.dbPath,
    schemaVersion: dbClient.schemaVersion,
  });

  console.info(
    "[db] runtime:",
    JSON.stringify({
      appEnv: dbClient.config.appEnv,
      readSource: dbClient.config.readSource,
      writeMode: dbClient.config.writeMode,
      dbPath: dbClient.config.dbPath,
      schemaVersion: dbClient.schemaVersion,
      repositoryReady: repository !== null,
    }),
  );

  registerStoreIpc();
  registerDbIpc();
  registerRepositoryIpc();
  registerFileIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

app.whenReady().then(() => {
  void bootstrapApp().catch((error) => {
    console.error("[bootstrap] failed to initialize app", error);
    app.quit();
  });
});

app.on("window-all-closed", () => {
  if (dbClient) {
    dbClient.close();
    dbClient = null;
  }
  repository = null;

  if (process.platform !== "darwin") {
    app.quit();
  }
});
