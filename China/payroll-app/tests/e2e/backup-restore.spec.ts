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

async function launchElectronForDataTest(env: NodeJS.ProcessEnv): Promise<ElectronLaunchResult> {
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
    await page.waitForFunction(() => Boolean(window.payrollRepository), undefined, {
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

test("backup -> clear -> restore keeps data consistent", async () => {
  const testDbPath = getDbPath("backup-restore-test.sqlite");
  rmSync(testDbPath, { force: true });

  const launch = await launchElectronForDataTest({
    APP_ENV: "test",
    TEST_DB_PATH: testDbPath,
    READ_SOURCE: "sqlite",
    WRITE_MODE: "sqlite",
  });
  const { app } = launch;

  const page = await getFirstWindowOrThrow(launch);

  const result = await page.evaluate(async () => {
    const social = {
      compPension: 16,
      compLocalPension: 1,
      compUnemploy: 0.8,
      compMedical: 5,
      compInjury: 0.4,
      compMaternity: 0.5,
      workerPension: 8,
      workerUnemploy: 0.2,
      workerMedical: 2,
      pensionBase: 4775,
      unemploymentBase: 3000,
      medicalBase: 6727,
      injuryBase: 3000,
      maternityBase: 6727,
    };
    const employees = [
      {
        id: 1,
        name: "Alice",
        idCard: "110101199001010011",
        companyShort: "AC",
        company: "Acme Co",
        dept: "HR",
        position: "Manager",
        type: "管理",
        baseSalary: 10000,
        subsidy: 500,
        hasSocial: true,
        hasLocalPension: true,
        fundAmount: 300,
      },
    ];

    await window.payrollRepository?.saveSettings({
      orgName: "Acme",
      social,
      companies: [{ short: "AC", full: "Acme Co" }],
    });
    await window.payrollRepository?.replaceEmployees(employees);

    const before = await window.payrollRepository?.getStorageInfo();
    const backup = await window.payrollRepository?.exportBackup();
    const clear = await window.payrollRepository?.clearData();
    const afterClear = await window.payrollRepository?.getStorageInfo();
    const afterClearSettings = await window.payrollRepository?.getSettings();

    const restored = await window.payrollRepository?.importBackup(backup);
    const afterRestore = await window.payrollRepository?.getStorageInfo();
    const afterRestoreSettings = await window.payrollRepository?.getSettings();

    return {
      before,
      clear,
      afterClear,
      afterClearSettings,
      restored,
      afterRestore,
      afterRestoreSettings,
    };
  });

  expect(result.before?.employeeCount).toBe(1);
  expect(result.before?.companyCount).toBe(1);
  expect(result.clear?.clearedTables).toContain("settings");
  expect(result.afterClear?.employeeCount).toBe(0);
  expect(result.afterClear?.companyCount).toBe(0);
  expect(result.afterClear?.payrollInputCount).toBe(0);
  expect(result.afterClear?.payrollResultCount).toBe(0);
  expect(result.afterClearSettings?.orgName).toBe("公司名称");

  expect(result.restored?.importedEmployees).toBe(1);
  expect(result.restored?.importedCompanies).toBe(1);
  expect(result.afterRestore?.employeeCount).toBe(1);
  expect(result.afterRestore?.companyCount).toBe(1);
  expect(result.afterRestoreSettings?.orgName).toBe("Acme");

  await app.close();
  rmSync(testDbPath, { force: true });
});
