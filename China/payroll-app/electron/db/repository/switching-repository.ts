import type {
  BackupExportFile,
  ClearDataResult,
  DeleteEmployeeResult,
  EmployeeRecord,
  ImportBackupResult,
  PayrollPayloadRecord,
  ReplaceEmployeesResult,
  RepositoryAdapter,
  RepositoryContext,
  RepositoryLogger,
  RepositorySettings,
} from "./contracts.js";

interface CreateSwitchingRepositoryOptions {
  context: RepositoryContext;
  legacy: RepositoryAdapter;
  sqlite: RepositoryAdapter;
  logger?: RepositoryLogger;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createRequestId(): string {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `req-${stamp}-${random}`;
}

export class DualWriteError extends Error {
  readonly mode = "dual";
  readonly operation: string;
  readonly requestId: string;

  constructor(operation: string, requestId: string, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    super(
      `Dual write inconsistent: mode=dual op=${operation} requestId=${requestId} cause=${detail}`,
    );
    this.name = "DualWriteError";
    this.operation = operation;
    this.requestId = requestId;
  }
}

export function createSwitchingRepository(
  options: CreateSwitchingRepositoryOptions,
): RepositoryAdapter {
  const logger = options.logger ?? {
    warn: (message: string, metadata?: Record<string, unknown>) => {
      if (metadata) {
        console.warn(message, metadata);
      } else {
        console.warn(message);
      }
    },
  };

  const getReadAdapter = (): RepositoryAdapter => {
    return options.context.readSource === "legacy" ? options.legacy : options.sqlite;
  };

  const writeByMode = <T>(
    operation: string,
    payload: T,
    invoke: (adapter: RepositoryAdapter, clonedPayload: T) => unknown,
  ): unknown => {
    if (options.context.writeMode === "legacy") {
      return invoke(options.legacy, deepClone(payload));
    }

    if (options.context.writeMode === "sqlite") {
      return invoke(options.sqlite, deepClone(payload));
    }

    const requestId = createRequestId();
    const sqliteResult = invoke(options.sqlite, deepClone(payload));

    try {
      invoke(options.legacy, deepClone(payload));
      return sqliteResult;
    } catch (error) {
      logger.warn(
        `[repository][dual-write][inconsistent] mode=dual op=${operation} requestId=${requestId}`,
        {
          mode: "dual",
          operation,
          requestId,
          error: error instanceof Error ? error.message : String(error),
        },
      );

      throw new DualWriteError(operation, requestId, error);
    }
  };

  return {
    getSettings: (): RepositorySettings => getReadAdapter().getSettings(),

    saveSettings: (settings): void => {
      writeByMode<RepositorySettings>(
        "saveSettings",
        settings,
        (adapter, cloned) => adapter.saveSettings(cloned),
      );
    },

    listEmployees: (): EmployeeRecord[] => getReadAdapter().listEmployees(),

    addEmployee: (employee): EmployeeRecord => {
      return writeByMode<Omit<EmployeeRecord, "id">>(
        "addEmployee",
        employee,
        (adapter, cloned) => adapter.addEmployee(cloned),
      ) as EmployeeRecord;
    },

    updateEmployee: (employee): EmployeeRecord => {
      return writeByMode<EmployeeRecord>(
        "updateEmployee",
        employee,
        (adapter, cloned) => adapter.updateEmployee(cloned),
      ) as EmployeeRecord;
    },

    deleteEmployee: (id): DeleteEmployeeResult => {
      return writeByMode<number>(
        "deleteEmployee",
        id,
        (adapter, clonedId) => adapter.deleteEmployee(clonedId),
      ) as DeleteEmployeeResult;
    },

    replaceEmployees: (employees): ReplaceEmployeesResult => {
      return writeByMode<EmployeeRecord[]>(
        "replaceEmployees",
        employees,
        (adapter, cloned) => adapter.replaceEmployees(cloned),
      ) as ReplaceEmployeesResult;
    },

    savePayrollInput: (employeeId, month, payload): PayrollPayloadRecord => {
      return writeByMode<{
        employeeId: number;
        month: string;
        payload: Record<string, unknown>;
      }>(
        "savePayrollInput",
        { employeeId, month, payload },
        (adapter, cloned) => adapter.savePayrollInput(cloned.employeeId, cloned.month, cloned.payload),
      ) as PayrollPayloadRecord;
    },

    listPayrollInputs: (month): PayrollPayloadRecord[] => getReadAdapter().listPayrollInputs(month),

    savePayrollResult: (employeeId, month, payload): PayrollPayloadRecord => {
      return writeByMode<{
        employeeId: number;
        month: string;
        payload: Record<string, unknown>;
      }>(
        "savePayrollResult",
        { employeeId, month, payload },
        (adapter, cloned) => adapter.savePayrollResult(cloned.employeeId, cloned.month, cloned.payload),
      ) as PayrollPayloadRecord;
    },

    listPayrollResults: (month): PayrollPayloadRecord[] => getReadAdapter().listPayrollResults(month),

    deletePayrollByMonth: (month): { deletedInputs: number; deletedResults: number } => {
      return writeByMode<string>(
        "deletePayrollByMonth",
        month,
        (adapter, cloned) => adapter.deletePayrollByMonth(cloned),
      ) as { deletedInputs: number; deletedResults: number };
    },

    exportBackup: (): BackupExportFile => getReadAdapter().exportBackup(),

    importBackup: (payload): ImportBackupResult => {
      return writeByMode<unknown>(
        "importBackup",
        payload,
        (adapter, cloned) => adapter.importBackup(cloned),
      ) as ImportBackupResult;
    },

    clearData: (): ClearDataResult => {
      return writeByMode<null>(
        "clearData",
        null,
        (adapter) => adapter.clearData(),
      ) as ClearDataResult;
    },

    getStorageInfo: () => options.sqlite.getStorageInfo(),
  };
}
