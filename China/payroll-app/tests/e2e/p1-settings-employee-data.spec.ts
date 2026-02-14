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

async function launchElectronForP1Test(env: NodeJS.ProcessEnv): Promise<ElectronLaunchResult> {
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

test("settings + employee repository flow is persisted and replace-based CRUD works", async () => {
  const testDbPath = getDbPath("p1-settings-employee-data.sqlite");
  rmSync(testDbPath, { force: true });

  const launch = await launchElectronForP1Test({
    APP_ENV: "test",
    TEST_DB_PATH: testDbPath,
    READ_SOURCE: "sqlite",
    WRITE_MODE: "sqlite",
  });

  const { app } = launch;
  const page = await getFirstWindowOrThrow(launch);

  const result = await page.evaluate(async () => {
    const social = {
      compPension: 17,
      compLocalPension: 1,
      compUnemploy: 0.8,
      compMedical: 5,
      compInjury: 0.4,
      compMaternity: 0.5,
      workerPension: 8,
      workerUnemploy: 0.2,
      workerMedical: 2,
      pensionBase: 5000,
      unemploymentBase: 3200,
      medicalBase: 6800,
      injuryBase: 3200,
      maternityBase: 6800,
    };

    await window.payrollRepository?.saveSettings({
      orgName: "Acme Payroll",
      social,
      companies: [
        { short: "AC", full: "Acme Co" },
        { short: "AC", full: "Acme Co Duplicate" },
        { short: "BC", full: "Beta Co" },
      ],
    });

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
      {
        id: 2,
        name: "Bob",
        idCard: "110101199001010022",
        companyShort: "BC",
        company: "Beta Co",
        dept: "Sales",
        position: "Sales",
        type: "销售",
        baseSalary: 9000,
        subsidy: 600,
        hasSocial: true,
        hasLocalPension: false,
        fundAmount: 280,
      },
    ];

    await window.payrollRepository?.replaceEmployees(employees);

    const savedSettings = await window.payrollRepository?.getSettings();
    const afterCreate = await window.payrollRepository?.listEmployees();

    const updated = (afterCreate ?? []).map((employee: Record<string, unknown>) => {
      if (employee.id === 1) {
        return {
          ...employee,
          position: "Director",
          subsidy: 800,
        };
      }

      return employee;
    });

    await window.payrollRepository?.replaceEmployees(updated);
    const afterUpdate = await window.payrollRepository?.listEmployees();

    const afterDeletePayload = (afterUpdate ?? []).filter((employee: Record<string, unknown>) => employee.id !== 2);
    await window.payrollRepository?.replaceEmployees(afterDeletePayload);

    const afterDelete = await window.payrollRepository?.listEmployees();
    const storage = await window.payrollRepository?.getStorageInfo();

    return {
      savedSettings,
      afterCreate,
      afterUpdate,
      afterDelete,
      storage,
    };
  });

  expect(result.savedSettings?.orgName).toBe("Acme Payroll");
  expect(result.savedSettings?.social?.compPension).toBe(17);
  expect(result.savedSettings?.companies).toHaveLength(2);

  expect(result.afterCreate).toHaveLength(2);
  expect(result.afterUpdate?.find((employee: { id: number }) => employee.id === 1)?.position).toBe("Director");
  expect(result.afterDelete).toHaveLength(1);
  expect(result.afterDelete?.[0]?.name).toBe("Alice");

  expect(result.storage?.employeeCount).toBe(1);
  expect(result.storage?.companyCount).toBe(2);

  await app.close();
  rmSync(testDbPath, { force: true });
});
