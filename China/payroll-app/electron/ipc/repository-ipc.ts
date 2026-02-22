import type { IpcMain } from "electron";
import type {
  EmployeeRecord,
  PayrollPayloadRecord,
  RepositoryAdapter,
  RepositorySettings,
} from "../db/repository/contracts.js";

/**
 * Register repository CRUD IPC handlers.
 *
 * Channels: repo:settings:*, repo:employees:*, repo:data:*, repo:payroll:*
 */
export function registerRepositoryIpc(
  ipcMain: IpcMain,
  getRepository: () => RepositoryAdapter,
): void {
  // --- Settings ---

  ipcMain.handle("repo:settings:get", () => {
    return getRepository().getSettings();
  });

  ipcMain.handle("repo:settings:save", (_event, settings: unknown) => {
    const repo = getRepository();
    repo.saveSettings(settings as RepositorySettings);
    return repo.getSettings();
  });

  // --- Employees ---

  ipcMain.handle("repo:employees:list", () => {
    return getRepository().listEmployees();
  });

  ipcMain.handle("repo:employees:replace", (_event, employees: unknown) => {
    const safeEmployees = Array.isArray(employees) ? employees : [];
    return getRepository().replaceEmployees(safeEmployees as EmployeeRecord[]);
  });

  ipcMain.handle("repo:employees:add", (_event, employee: unknown) => {
    if (!employee || typeof employee !== "object") {
      throw new Error("Invalid employee input");
    }
    return getRepository().addEmployee(employee as Omit<EmployeeRecord, "id">);
  });

  ipcMain.handle("repo:employees:update", (_event, employee: unknown) => {
    if (!employee || typeof employee !== "object") {
      throw new Error("Invalid employee input");
    }
    return getRepository().updateEmployee(employee as EmployeeRecord);
  });

  ipcMain.handle("repo:employees:delete", (_event, id: unknown) => {
    if (typeof id !== "number") {
      throw new Error("Invalid employee id");
    }
    return getRepository().deleteEmployee(id);
  });

  // --- Data management ---

  ipcMain.handle("repo:data:backup:export", () => {
    return getRepository().exportBackup();
  });

  ipcMain.handle("repo:data:backup:import", (_event, payload: unknown) => {
    return getRepository().importBackup(payload);
  });

  ipcMain.handle("repo:data:clear", () => {
    return getRepository().clearData();
  });

  ipcMain.handle("repo:data:storage-info", () => {
    return getRepository().getStorageInfo();
  });

  // --- Payroll ---

  ipcMain.handle(
    "repo:payroll:input:save",
    (
      _event,
      employeeId: unknown,
      month: unknown,
      payload: unknown,
    ): PayrollPayloadRecord => {
      if (typeof employeeId !== "number") throw new Error("Invalid employeeId");
      if (typeof month !== "string") throw new Error("Invalid month");
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid payload");
      return getRepository().savePayrollInput(
        employeeId,
        month,
        payload as Record<string, unknown>,
      );
    },
  );

  ipcMain.handle("repo:payroll:input:list", (_event, month: unknown): PayrollPayloadRecord[] => {
    if (typeof month !== "string") throw new Error("Invalid month");
    return getRepository().listPayrollInputs(month);
  });

  ipcMain.handle(
    "repo:payroll:result:save",
    (
      _event,
      employeeId: unknown,
      month: unknown,
      payload: unknown,
    ): PayrollPayloadRecord => {
      if (typeof employeeId !== "number") throw new Error("Invalid employeeId");
      if (typeof month !== "string") throw new Error("Invalid month");
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid payload");
      return getRepository().savePayrollResult(
        employeeId,
        month,
        payload as Record<string, unknown>,
      );
    },
  );

  ipcMain.handle("repo:payroll:result:list", (_event, month: unknown): PayrollPayloadRecord[] => {
    if (typeof month !== "string") throw new Error("Invalid month");
    return getRepository().listPayrollResults(month);
  });

  ipcMain.handle("repo:payroll:result:delete", (_event, month: unknown): { deletedInputs: number; deletedResults: number } => {
    if (typeof month !== "string") throw new Error("Invalid month");
    return getRepository().deletePayrollByMonth(month);
  });
}
