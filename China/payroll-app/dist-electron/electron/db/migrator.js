import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const MIGRATION_TABLE = "schema_migrations";
function ensureMigrationTable(db) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
function listSqlFiles(migrationsDir) {
    return readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort();
}
function getAppliedMigrationNames(db) {
    const rows = db.prepare(`SELECT name FROM ${MIGRATION_TABLE}`).all();
    return new Set(rows.map((row) => row.name));
}
function applyMigration(db, migrationName, sql) {
    const statement = db.prepare(`INSERT INTO ${MIGRATION_TABLE} (name) VALUES (?)`);
    const migrate = db.transaction(() => {
        db.exec(sql);
        statement.run(migrationName);
    });
    migrate();
}
export function runMigrations(db, migrationsDir) {
    ensureMigrationTable(db);
    const appliedSet = getAppliedMigrationNames(db);
    const files = listSqlFiles(migrationsDir);
    const newlyApplied = [];
    for (const file of files) {
        if (appliedSet.has(file)) {
            continue;
        }
        const fullPath = path.join(migrationsDir, file);
        const sql = readFileSync(fullPath, "utf8");
        applyMigration(db, file, sql);
        newlyApplied.push(file);
    }
    return {
        applied: newlyApplied,
    };
}
export function getSchemaVersion(db) {
    ensureMigrationTable(db);
    const row = db
        .prepare(`SELECT COUNT(1) as version FROM ${MIGRATION_TABLE}`)
        .get();
    return row.version;
}
export function resolveDefaultMigrationsDir() {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    const candidates = [
        path.join(moduleDir, "migrations"),
        path.join(process.cwd(), "electron", "db", "migrations"),
        path.join(process.cwd(), "src", "electron", "db", "migrations"),
    ];
    for (const candidate of candidates) {
        if (existsSync(candidate)) {
            return candidate;
        }
    }
    throw new Error(`Cannot resolve migrations directory. Tried: ${candidates.join(", ")}`);
}
//# sourceMappingURL=migrator.js.map