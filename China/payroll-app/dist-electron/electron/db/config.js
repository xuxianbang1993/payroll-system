import path from "node:path";
import { tmpdir } from "node:os";
const PROD_DB_FILE = "payroll.sqlite";
export function resolveAppEnv(raw) {
    return raw === "test" ? "test" : "prod";
}
export function resolveReadSource(raw) {
    if (raw === "sqlite") {
        return "sqlite";
    }
    return "legacy";
}
export function resolveWriteMode(raw) {
    if (raw === "dual" || raw === "sqlite") {
        return raw;
    }
    return "legacy";
}
function resolveTempTestPath() {
    const now = new Date().toISOString().replaceAll(":", "-");
    return path.join(tmpdir(), `payroll-test-${process.pid}-${now}.sqlite`);
}
export function resolveDatabasePath(options) {
    if (options.appEnv === "test") {
        if (options.testDbPathEnv && options.testDbPathEnv.trim() !== "") {
            return path.resolve(options.testDbPathEnv);
        }
        return resolveTempTestPath();
    }
    return path.join(options.userDataPath, PROD_DB_FILE);
}
export function resolveRuntimeConfig(options) {
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
//# sourceMappingURL=config.js.map