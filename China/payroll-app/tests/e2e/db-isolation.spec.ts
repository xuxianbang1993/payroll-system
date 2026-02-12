import { _electron as electron, expect, test } from "@playwright/test";
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";

interface ElectronLaunchResult {
  app: Awaited<ReturnType<typeof electron.launch>>;
  logs: string[];
}

function getElectronAppPath(): string {
  return process.cwd();
}

function getDbPath(name: string): string {
  const dbDir = path.join(process.cwd(), "..", "test", "06-reports", "e2e");
  mkdirSync(dbDir, { recursive: true });
  return path.join(dbDir, name);
}

async function launchElectronForDbTest(env: NodeJS.ProcessEnv): Promise<ElectronLaunchResult> {
  const app = await electron.launch({
    args: [getElectronAppPath()],
    env: {
      ...process.env,
      ...env,
    },
  });
  const logs: string[] = [];
  const proc = app.process();

  proc?.stdout?.on("data", (chunk) => {
    logs.push(`[stdout] ${chunk.toString()}`);
  });
  proc?.stderr?.on("data", (chunk) => {
    logs.push(`[stderr] ${chunk.toString()}`);
  });
  proc?.on("exit", (code, signal) => {
    logs.push(`[exit] code=${String(code)} signal=${String(signal)}`);
  });

  return { app, logs };
}

async function getFirstWindowOrThrow(launch: ElectronLaunchResult) {
  try {
    const page = await launch.app.firstWindow();
    await page.waitForURL(/^(file|https?):/, { timeout: 15_000 });
    await page.waitForLoadState("domcontentloaded");
    await page.waitForFunction(() => Boolean(window.payrollDbAdmin), undefined, {
      timeout: 15_000,
    });
    return page;
  } catch (error) {
    const crashLogs = launch.logs.join("\n");
    const urls = launch.app
      .windows()
      .map((page, index) => `[window-${String(index)}] ${page.url()}`)
      .join("\n");
    throw new Error(
      `Failed to get first window: ${
        error instanceof Error ? error.message : String(error)
      }\nWindows:\n${urls}\nElectron logs:\n${crashLogs}`,
    );
  }
}

test("allows db reset when APP_ENV=test", async () => {
  const testDbPath = getDbPath("db-isolation-test.sqlite");
  rmSync(testDbPath, { force: true });

  const launch = await launchElectronForDbTest({
    APP_ENV: "test",
    TEST_DB_PATH: testDbPath,
  });
  const { app } = launch;

  const page = await getFirstWindowOrThrow(launch);
  const info = await page.evaluate(async () => {
    return window.payrollDbAdmin?.getRuntimeInfo();
  });
  expect(info?.appEnv).toBe("test");
  expect(info?.dbPath).toBe(testDbPath);

  const resetResult = await page.evaluate(async () => {
    return window.payrollDbAdmin?.reset();
  });
  expect(Array.isArray(resetResult?.clearedTables)).toBe(true);
  expect(resetResult?.clearedTables).toContain("settings");

  await app.close();
  rmSync(testDbPath, { force: true });
});

test("rejects db reset when APP_ENV=prod", async () => {
  const testDbPath = getDbPath("db-isolation-prod.sqlite");
  rmSync(testDbPath, { force: true });

  const launch = await launchElectronForDbTest({
    APP_ENV: "prod",
    TEST_DB_PATH: testDbPath,
  });
  const { app } = launch;

  const page = await getFirstWindowOrThrow(launch);
  const info = await page.evaluate(async () => {
    return window.payrollDbAdmin?.getRuntimeInfo();
  });
  expect(info?.appEnv).toBe("prod");

  const errorMessage = await page.evaluate(async () => {
    try {
      await window.payrollDbAdmin?.reset();
      return "";
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  });
  expect(errorMessage).toContain("APP_ENV=test");

  await app.close();
  rmSync(testDbPath, { force: true });
});
