import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

import type { DbRuntimeConfig } from "./config.js";
import { getSchemaVersion, resolveDefaultMigrationsDir, runMigrations } from "./migrator.js";

export interface DatabasePragmas {
  journalMode: string;
  foreignKeys: number;
}

export interface DatabaseClient {
  db: Database.Database;
  config: DbRuntimeConfig;
  pragmas: DatabasePragmas;
  appliedMigrations: string[];
  schemaVersion: number;
  close: () => void;
}

function readPragmas(db: Database.Database): DatabasePragmas {
  const journalMode = db.pragma("journal_mode", { simple: true });
  const foreignKeys = db.pragma("foreign_keys", { simple: true });

  return {
    journalMode: String(journalMode),
    foreignKeys: Number(foreignKeys),
  };
}

export function createDatabaseClient(config: DbRuntimeConfig): DatabaseClient {
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
