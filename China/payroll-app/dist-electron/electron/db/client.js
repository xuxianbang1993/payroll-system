import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { getSchemaVersion, resolveDefaultMigrationsDir, runMigrations } from "./migrator.js";
function readPragmas(db) {
    const journalMode = db.pragma("journal_mode", { simple: true });
    const foreignKeys = db.pragma("foreign_keys", { simple: true });
    return {
        journalMode: String(journalMode),
        foreignKeys: Number(foreignKeys),
    };
}
export function createDatabaseClient(config) {
    mkdirSync(path.dirname(config.dbPath), { recursive: true });
    const db = new Database(config.dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    const migrationResult = runMigrations(db, resolveDefaultMigrationsDir());
    const schemaVersion = getSchemaVersion(db);
    return {
        db,
        config,
        pragmas: readPragmas(db),
        appliedMigrations: migrationResult.applied,
        schemaVersion,
        close: () => db.close(),
    };
}
//# sourceMappingURL=client.js.map