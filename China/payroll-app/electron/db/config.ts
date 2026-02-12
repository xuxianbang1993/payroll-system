import path from "node:path";
import { tmpdir } from "node:os";

export type AppEnv = "prod" | "test";
export type ReadSource = "legacy" | "sqlite";
export type WriteMode = "legacy" | "dual" | "sqlite";

const PROD_DB_FILE = "payroll.sqlite";

export interface ResolvePathOptions {
  appEnv: AppEnv;
  userDataPath: string;
  testDbPathEnv?: string;
}

export interface RuntimeConfigOptions {
  userDataPath: string;
  env?: NodeJS.ProcessEnv;
}

export interface DbRuntimeConfig {
  appEnv: AppEnv;
  readSource: ReadSource;
  writeMode: WriteMode;
  dbPath: string;
}

export function resolveAppEnv(raw?: string): AppEnv {
  return raw === "test" ? "test" : "prod";
}

export function resolveReadSource(raw?: string): ReadSource {
  if (raw === "sqlite") {
    return "sqlite";
  }

  return "legacy";
}

export function resolveWriteMode(raw?: string): WriteMode {
  if (raw === "dual" || raw === "sqlite") {
    return raw;
  }

  return "legacy";
}

function resolveTempTestPath(): string {
  const now = new Date().toISOString().replaceAll(":", "-");
  return path.join(tmpdir(), `payroll-test-${process.pid}-${now}.sqlite`);
}

export function resolveDatabasePath(options: ResolvePathOptions): string {
  if (options.appEnv === "test") {
    if (options.testDbPathEnv && options.testDbPathEnv.trim() !== "") {
      return path.resolve(options.testDbPathEnv);
    }

    return resolveTempTestPath();
  }

  return path.join(options.userDataPath, PROD_DB_FILE);
}

export function resolveRuntimeConfig(options: RuntimeConfigOptions): DbRuntimeConfig {
  const env = options.env ?? process.env;
  const appEnv = resolveAppEnv(env.APP_ENV);
  const readSource = resolveReadSource(env.READ_SOURCE);
  const writeMode = resolveWriteMode(env.WRITE_MODE);
  const dbPath = resolveDatabasePath({
    appEnv,
    userDataPath: options.userDataPath,
    testDbPathEnv: env.TEST_DB_PATH,
  });

  return {
    appEnv,
    readSource,
    writeMode,
    dbPath,
  };
}
