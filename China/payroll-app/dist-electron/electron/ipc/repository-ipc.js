/**
 * Register repository CRUD IPC handlers.
 *
 * Channels: repo:settings:*, repo:employees:*, repo:data:*
 */
export function registerRepositoryIpc(ipcMain, getRepository) {
    // --- Settings ---
    ipcMain.handle("repo:settings:get", () => {
        return getRepository().getSettings();
    });
    ipcMain.handle("repo:settings:save", (_event, settings) => {
        const repo = getRepository();
        repo.saveSettings(settings);
        return repo.getSettings();
    });
    // --- Employees ---
    ipcMain.handle("repo:employees:list", () => {
        return getRepository().listEmployees();
    });
    ipcMain.handle("repo:employees:replace", (_event, employees) => {
        const safeEmployees = Array.isArray(employees) ? employees : [];
        return getRepository().replaceEmployees(safeEmployees);
    });
    ipcMain.handle("repo:employees:add", (_event, employee) => {
        if (!employee || typeof employee !== "object") {
            throw new Error("Invalid employee input");
        }
        return getRepository().addEmployee(employee);
    });
    ipcMain.handle("repo:employees:update", (_event, employee) => {
        if (!employee || typeof employee !== "object") {
            throw new Error("Invalid employee input");
        }
        return getRepository().updateEmployee(employee);
    });
    ipcMain.handle("repo:employees:delete", (_event, id) => {
        if (typeof id !== "number") {
            throw new Error("Invalid employee id");
        }
        return getRepository().deleteEmployee(id);
    });
    // --- Data management ---
    ipcMain.handle("repo:data:backup:export", () => {
        return getRepository().exportBackup();
    });
    ipcMain.handle("repo:data:backup:import", (_event, payload) => {
        return getRepository().importBackup(payload);
    });
    ipcMain.handle("repo:data:clear", () => {
        return getRepository().clearData();
    });
    ipcMain.handle("repo:data:storage-info", () => {
        return getRepository().getStorageInfo();
    });
}
//# sourceMappingURL=repository-ipc.js.map