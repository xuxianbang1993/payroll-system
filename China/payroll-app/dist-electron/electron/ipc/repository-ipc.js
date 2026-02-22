/**
 * Register repository CRUD IPC handlers.
 *
 * Channels: repo:settings:*, repo:employees:*, repo:data:*, repo:payroll:*
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
    // --- Payroll ---
    ipcMain.handle("repo:payroll:input:save", (_event, employeeId, month, payload) => {
        if (typeof employeeId !== "number")
            throw new Error("Invalid employeeId");
        if (typeof month !== "string")
            throw new Error("Invalid month");
        if (!payload || typeof payload !== "object" || Array.isArray(payload))
            throw new Error("Invalid payload");
        return getRepository().savePayrollInput(employeeId, month, payload);
    });
    ipcMain.handle("repo:payroll:input:list", (_event, month) => {
        if (typeof month !== "string")
            throw new Error("Invalid month");
        return getRepository().listPayrollInputs(month);
    });
    ipcMain.handle("repo:payroll:result:save", (_event, employeeId, month, payload) => {
        if (typeof employeeId !== "number")
            throw new Error("Invalid employeeId");
        if (typeof month !== "string")
            throw new Error("Invalid month");
        if (!payload || typeof payload !== "object" || Array.isArray(payload))
            throw new Error("Invalid payload");
        return getRepository().savePayrollResult(employeeId, month, payload);
    });
    ipcMain.handle("repo:payroll:result:list", (_event, month) => {
        if (typeof month !== "string")
            throw new Error("Invalid month");
        return getRepository().listPayrollResults(month);
    });
    ipcMain.handle("repo:payroll:result:delete", (_event, month) => {
        if (typeof month !== "string")
            throw new Error("Invalid month");
        return getRepository().deletePayrollByMonth(month);
    });
}
//# sourceMappingURL=repository-ipc.js.map