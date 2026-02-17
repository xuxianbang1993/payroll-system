import { BrowserWindow } from "electron";
import { openBackupJsonFile, saveBackupJsonFile, } from "../file/backup-file-service.js";
function asRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }
    return value;
}
/**
 * Register file-dialog IPC handlers.
 *
 * Channels: file:backup:save-json, file:backup:open-json
 */
export function registerFileIpc(ipcMain) {
    ipcMain.handle("file:backup:save-json", (event, request) => {
        const payload = asRecord(request);
        const ownerWindow = BrowserWindow.fromWebContents(event.sender) ?? null;
        const orgName = typeof payload.orgName === "string" ? payload.orgName : undefined;
        const suggestedPath = typeof payload.suggestedPath === "string"
            ? payload.suggestedPath
            : undefined;
        return saveBackupJsonFile({
            ownerWindow,
            payload: payload.payload,
            orgName,
            suggestedPath,
        });
    });
    ipcMain.handle("file:backup:open-json", (event, request) => {
        const payload = asRecord(request);
        const ownerWindow = BrowserWindow.fromWebContents(event.sender) ?? null;
        const selectedPath = typeof payload.selectedPath === "string"
            ? payload.selectedPath
            : undefined;
        return openBackupJsonFile({
            ownerWindow,
            selectedPath,
        });
    });
}
//# sourceMappingURL=file-ipc.js.map