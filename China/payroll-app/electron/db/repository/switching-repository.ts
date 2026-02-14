import type {
  BackupExportFile,
  ClearDataResult,
  EmployeeRecord,
  ImportBackupResult,
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

    replaceEmployees: (employees): ReplaceEmployeesResult => {
      return writeByMode<EmployeeRecord[]>(
        "replaceEmployees",
        employees,
        (adapter, cloned) => adapter.replaceEmployees(cloned),
      ) as ReplaceEmployeesResult;
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
