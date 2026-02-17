import { resetDatabase } from "../db/reset.js";
/**
 * Register database management IPC handlers.
 *
 * Channels: db:runtime-info, db:reset
 */
export function registerDbIpc(ipcMain, getDbClient) {
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
//# sourceMappingURL=db-ipc.js.map