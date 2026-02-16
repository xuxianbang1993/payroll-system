import type { IpcMain } from "electron";
import type { DatabaseClient } from "../db/client.js";
import { resetDatabase } from "../db/reset.js";

/**
 * Register database management IPC handlers.
 *
 * Channels: db:runtime-info, db:reset
 */
export function registerDbIpc(
  ipcMain: IpcMain,
  getDbClient: () => DatabaseClient,
): void {
  ipcMain.handle("db:runtime-info", () => {
    const client = getDbClient();

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
    const client = getDbClient();
    return resetDatabase({
      appEnv: client.config.appEnv,
      db: client.db,
    });
  });
}
