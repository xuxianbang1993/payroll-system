import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export interface TestDbSandbox {
  dbDir: string;
  dbPath: string;
  cleanup: () => void;
}

export function createTestDbSandbox(prefix = "payroll-test-db-"): TestDbSandbox {
  const dbDir = mkdtempSync(path.join(tmpdir(), prefix));
  const dbPath = path.join(dbDir, "payroll.test.sqlite");

  return {
    dbDir,
    dbPath,
    cleanup: () => {
      rmSync(dbDir, { recursive: true, force: true });
    },
  };
}
