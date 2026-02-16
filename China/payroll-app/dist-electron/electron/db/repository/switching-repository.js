function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}
function createRequestId() {
    const stamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 8);
    return `req-${stamp}-${random}`;
}
export class DualWriteError extends Error {
    mode = "dual";
    operation;
    requestId;
    constructor(operation, requestId, cause) {
        const detail = cause instanceof Error ? cause.message : String(cause);
        super(`Dual write inconsistent: mode=dual op=${operation} requestId=${requestId} cause=${detail}`);
        this.name = "DualWriteError";
        this.operation = operation;
        this.requestId = requestId;
    }
}
export function createSwitchingRepository(options) {
    const logger = options.logger ?? {
        warn: (message, metadata) => {
            if (metadata) {
                console.warn(message, metadata);
            }
            else {
                console.warn(message);
            }
        },
    };
    const getReadAdapter = () => {
        return options.context.readSource === "legacy" ? options.legacy : options.sqlite;
    };
    const writeByMode = (operation, payload, invoke) => {
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
        }
        catch (error) {
            logger.warn(`[repository][dual-write][inconsistent] mode=dual op=${operation} requestId=${requestId}`, {
                mode: "dual",
                operation,
                requestId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw new DualWriteError(operation, requestId, error);
        }
    };
    return {
        getSettings: () => getReadAdapter().getSettings(),
        saveSettings: (settings) => {
            writeByMode("saveSettings", settings, (adapter, cloned) => adapter.saveSettings(cloned));
        },
        listEmployees: () => getReadAdapter().listEmployees(),
        replaceEmployees: (employees) => {
            return writeByMode("replaceEmployees", employees, (adapter, cloned) => adapter.replaceEmployees(cloned));
        },
        exportBackup: () => getReadAdapter().exportBackup(),
        importBackup: (payload) => {
            return writeByMode("importBackup", payload, (adapter, cloned) => adapter.importBackup(cloned));
        },
        clearData: () => {
            return writeByMode("clearData", null, (adapter) => adapter.clearData());
        },
        getStorageInfo: () => options.sqlite.getStorageInfo(),
    };
}
//# sourceMappingURL=switching-repository.js.map