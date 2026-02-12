import { describe, expect, it } from "vitest";
import path from "node:path";

import {
  resolveAppEnv,
  resolveDatabasePath,
  resolveReadSource,
  resolveRuntimeConfig,
  resolveWriteMode,
} from "../../electron/db/config";

describe("P1 db config", () => {
  it("defaults to production-safe modes for invalid env values", () => {
    expect(resolveAppEnv("staging")).toBe("prod");
    expect(resolveReadSource("foo")).toBe("legacy");
    expect(resolveWriteMode("bar")).toBe("legacy");
  });

  it("uses userData sqlite path for prod mode", () => {
    const dbPath = resolveDatabasePath({
      appEnv: "prod",
      userDataPath: "/tmp/payroll-user",
      testDbPathEnv: undefined,
    });

    expect(dbPath).toBe(path.join("/tmp/payroll-user", "payroll.sqlite"));
  });

  it("uses TEST_DB_PATH when in test mode", () => {
    const dbPath = resolveDatabasePath({
      appEnv: "test",
      userDataPath: "/tmp/payroll-user",
      testDbPathEnv: "/tmp/custom-test.sqlite",
    });

    expect(dbPath).toBe("/tmp/custom-test.sqlite");
  });

  it("falls back to temp sqlite path in test mode", () => {
    const dbPath = resolveDatabasePath({
      appEnv: "test",
      userDataPath: "/tmp/payroll-user",
      testDbPathEnv: undefined,
    });

    expect(dbPath).toContain("payroll-test");
    expect(dbPath.endsWith(".sqlite")).toBe(true);
  });

  it("builds a full runtime config with defaults", () => {
    const runtimeConfig = resolveRuntimeConfig({
      userDataPath: "/tmp/payroll-user",
      env: {},
    });

    expect(runtimeConfig.appEnv).toBe("prod");
    expect(runtimeConfig.readSource).toBe("legacy");
    expect(runtimeConfig.writeMode).toBe("legacy");
    expect(runtimeConfig.dbPath).toBe(path.join("/tmp/payroll-user", "payroll.sqlite"));
  });
});
