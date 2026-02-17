import { app, BrowserWindow, ipcMain } from "electron";
import Store from "electron-store";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveRendererIndexPath } from "./app-paths.js";
import { createDatabaseClient, type DatabaseClient } from "./db/client.js";
import { resolveRuntimeConfig } from "./db/config.js";
import { createPayrollRepository } from "./db/repository/index.js";
import type { RepositoryAdapter } from "./db/repository/contracts.js";
import {
  registerStoreIpc,
  registerDbIpc,
  registerRepositoryIpc,
  registerFileIpc,
} from "./ipc/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

const appStore = new Store<Record<string, unknown>>({
  name: "payroll-system",
});

let dbClient: DatabaseClient | null = null;
let repository: RepositoryAdapter | null = null;

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

  registerStoreIpc(ipcMain, appStore);
  registerDbIpc(ipcMain, getDbClientOrThrow);
  registerRepositoryIpc(ipcMain, getRepositoryOrThrow);
  registerFileIpc(ipcMain);
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
