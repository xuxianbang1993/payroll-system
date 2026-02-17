import { _electron as electron } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

export interface ElectronLaunchResult {
  app: Awaited<ReturnType<typeof electron.launch>>;
  logs: string[];
}

export interface LaunchElectronOptions {
  env: NodeJS.ProcessEnv;
  waitFor?: "payrollDbAdmin" | "payrollRepository";
}

function getElectronAppPath(): string {
  return process.cwd();
}

export function getDbPath(name: string): string {
  const dbDir = path.join(process.cwd(), "..", "test", "06-reports", "e2e");
  mkdirSync(dbDir, { recursive: true });
  return path.join(dbDir, name);
}

export async function launchElectronForTest(
  options: LaunchElectronOptions,
): Promise<ElectronLaunchResult> {
  const app = await electron.launch({
    args: [getElectronAppPath()],
    env: {
      ...process.env,
      ...options.env,
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

export async function getFirstWindowOrThrow(
  launch: ElectronLaunchResult,
  waitFor: "payrollDbAdmin" | "payrollRepository" = "payrollRepository",
) {
  try {
    const page = await launch.app.firstWindow();
    await page.waitForURL(/^(file|https?):/, { timeout: 15_000 });
    await page.waitForLoadState("domcontentloaded");

    if (waitFor === "payrollDbAdmin") {
      await page.waitForFunction(() => Boolean(window.payrollDbAdmin), undefined, {
        timeout: 15_000,
      });
    } else {
      await page.waitForFunction(() => Boolean(window.payrollRepository), undefined, {
        timeout: 15_000,
      });
    }

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
