import { createLegacyRepositoryAdapter } from "./legacy-adapter.js";
import { createSqliteRepositoryAdapter } from "./sqlite-adapter.js";
import { createSwitchingRepository } from "./switching-repository.js";
export function createPayrollRepository(options) {
    const sqlite = createSqliteRepositoryAdapter({
        db: options.db,
        dbPath: options.dbPath,
        schemaVersion: options.schemaVersion,
    });
    const legacy = createLegacyRepositoryAdapter({
        store: options.store,
        dbPath: options.dbPath,
        schemaVersion: options.schemaVersion,
    });
    return createSwitchingRepository({
        context: options.context,
        sqlite,
        legacy,
        logger: options.logger,
    });
}
//# sourceMappingURL=index.js.map