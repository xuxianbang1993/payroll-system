import type Database from "better-sqlite3";
import type Store from "electron-store";

import type {
  RepositoryAdapter,
  RepositoryContext,
  RepositoryLogger,
} from "./contracts.js";
import { createLegacyRepositoryAdapter } from "./legacy-adapter.js";
import { createSqliteRepositoryAdapter } from "./sqlite-adapter.js";
import { createSwitchingRepository } from "./switching-repository.js";

interface CreatePayrollRepositoryOptions {
  db: Database.Database;
  store: Store<Record<string, unknown>>;
  context: RepositoryContext;
  dbPath: string;
  schemaVersion: number;
  logger?: RepositoryLogger;
}

export function createPayrollRepository(
  options: CreatePayrollRepositoryOptions,
): RepositoryAdapter {
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
