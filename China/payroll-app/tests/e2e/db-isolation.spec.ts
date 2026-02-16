import { expect, test } from "@playwright/test";
import { rmSync } from "node:fs";
import { getDbPath, getFirstWindowOrThrow, launchElectronForTest } from "./helpers";

test("allows db reset when APP_ENV=test", async () => {
  const testDbPath = getDbPath("db-isolation-test.sqlite");
  rmSync(testDbPath, { force: true });

  const launch = await launchElectronForTest({
    env: {
      APP_ENV: "test",
      TEST_DB_PATH: testDbPath,
    },
  });
  const { app } = launch;

  const page = await getFirstWindowOrThrow(launch, "payrollDbAdmin");
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

  const launch = await launchElectronForTest({
    env: {
      APP_ENV: "prod",
      TEST_DB_PATH: testDbPath,
    },
  });
  const { app } = launch;

  const page = await getFirstWindowOrThrow(launch, "payrollDbAdmin");
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
