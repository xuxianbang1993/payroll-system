# P1 SQLite Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the P1 storage foundation (SQLite + migration + safe test isolation + rollback switches) before migrating feature modules.

**Architecture:** Introduce a database layer in Electron main process with explicit environment gating, then expose a typed IPC API to renderer stores. Keep rollout safe with `READ_SOURCE` and `WRITE_MODE`, and guarantee test safety with `APP_ENV=test` + isolated `TEST_DB_PATH`.

**Tech Stack:** Electron, TypeScript, better-sqlite3, Vitest, Playwright

---

### Task 1: Add dependency and DB module skeleton

**Files:**
- Modify: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/package.json`
- Create: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/electron/db/client.ts`
- Create: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/electron/db/config.ts`
- Create: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/electron/db/migrations/0001_init.sql`

**Step 1: Write failing tests for DB config resolution**
- Create unit test file for environment parsing and DB path selection.

**Step 2: Run test to confirm failure**
- Run: `npm run test -- src/electron/db/config.test.ts`

**Step 3: Implement minimal config and client bootstrap**
- Add `APP_ENV`, `TEST_DB_PATH`, `READ_SOURCE`, `WRITE_MODE` parsing.
- Initialize SQLite with `PRAGMA journal_mode=WAL` and `PRAGMA foreign_keys=ON`.

**Step 4: Re-run tests**
- Run same command and expect pass.

**Step 5: Commit**
- `git add ... && git commit -m "feat(db): add sqlite config and bootstrap"`

---

### Task 2: Add migration runner and schema version tracking

**Files:**
- Create: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/electron/db/migrator.ts`
- Modify: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/electron/db/client.ts`
- Create: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/electron/db/migrator.test.ts`

**Step 1: Write failing tests**
- Test first-run migration applies `0001_init.sql`.
- Test re-run is idempotent.

**Step 2: Run tests and confirm failure**
- `npm run test -- src/electron/db/migrator.test.ts`

**Step 3: Implement migration table + runner**
- Add `schema_migrations` table.
- Apply SQL files in lexical order once.

**Step 4: Re-run tests**
- Expect both migration tests pass.

**Step 5: Commit**
- `git add ... && git commit -m "feat(db): add schema migration runner"`

---

### Task 3: Add reset safety gate and test sandbox utilities

**Files:**
- Create: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/electron/db/reset.ts`
- Create: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/electron/db/test-db.ts`
- Create: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/electron/db/reset.test.ts`

**Step 1: Write failing tests**
- `APP_ENV=test` allows reset.
- `APP_ENV=prod` throws guarded error.

**Step 2: Run tests and confirm failure**
- `npm run test -- src/electron/db/reset.test.ts`

**Step 3: Implement guard**
- Fail fast outside test mode.
- Ensure reset only clears business tables, not migration metadata.

**Step 4: Re-run tests**
- Expect pass.

**Step 5: Commit**
- `git add ... && git commit -m "feat(db): add reset safety gate for test mode"`

---

### Task 4: Add storage IPC contract for DB status and reset

**Files:**
- Modify: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/electron/main.ts`
- Modify: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/electron/preload.ts`
- Modify: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/src/types/electron-api.d.ts`
- Create: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/src/lib/db-admin.ts`
- Create: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/src/lib/db-admin.test.ts`

**Step 1: Write failing bridge tests**
- Validate renderer calls into new preload methods.

**Step 2: Run tests and confirm failure**
- `npm run test -- src/lib/db-admin.test.ts`

**Step 3: Implement IPC handlers**
- Expose db metadata (path, schema version, mode) and test reset endpoint.

**Step 4: Re-run tests**
- Expect pass.

**Step 5: Commit**
- `git add ... && git commit -m "feat(ipc): expose db admin bridge"`

---

### Task 5: Add P1 isolation verification specs

**Files:**
- Create: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/tests/e2e/db-isolation.spec.ts`
- Modify: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/playwright.config.ts`
- Create: `/Users/xuxianbang/Documents/payroll system/China/payroll-app/tests/fixtures/db-seed.json`

**Step 1: Write E2E spec**
- Verify test mode reset works in isolated DB path.
- Verify production mode reset is rejected.

**Step 2: Run E2E and confirm expected behavior**
- `npm run test:e2e -- tests/e2e/db-isolation.spec.ts`

**Step 3: Fix config/environment wiring**
- Ensure Playwright web/electron startup injects `APP_ENV=test`.

**Step 4: Re-run E2E**
- Expect pass.

**Step 5: Commit**
- `git add ... && git commit -m "test(e2e): add db isolation spec"`

---

### Task 6: End-to-end verification and evidence artifacts

**Files:**
- Modify/Create: `/Users/xuxianbang/Documents/payroll system/China/test/00-governance/module-test-map.md`
- Create: `/Users/xuxianbang/Documents/payroll system/China/test/03-e2e/p1-db-isolation/*.json`
- Create: `/Users/xuxianbang/Documents/payroll system/China/test/06-reports/p1-test-report-*.xlsx`

**Step 1: Run full required checks**
- `npm run test`
- `npm run test:e2e`

**Step 2: Export raw outputs and case-map comparison**
- Save structured results to governance folders.

**Step 3: Generate milestone report**
- Produce XLSX for P1 evidence set.

**Step 4: Final verification**
- Confirm P1 gate: `backup-restore.spec.ts` + `db-isolation.spec.ts` passing.

**Step 5: Commit**
- `git add ... && git commit -m "test(p1): publish isolation and migration evidence"`

---

## Execution Checkpoint (Updated 2026-02-12)

### Completed
- Task 1 delivered: SQLite runtime config, client bootstrap, init migration, unit tests.
- Task 2 delivered: migration runner + schema version tracking, unit tests.
- Task 3 delivered: reset safety gate (`APP_ENV=test`) + temp test DB sandbox, unit tests.
- Task 4 delivered: DB admin IPC bridge (`db:runtime-info`, `db:reset`) + typed preload/renderer API.
- Task 5 delivered: `tests/e2e/db-isolation.spec.ts` implemented and passing.
- Phase 3 repository delivery complete:
  - repository abstraction (`legacy/sqlite` switching + `READ_SOURCE/WRITE_MODE` enforcement)
  - settings/employee/backup/storage integration path via repository IPC + preload + renderer bridge
  - `0002_employee_id_integer.sql` migration with payroll FK remap
- Task 6 evidence set delivered for current implemented scope:
  - governance update + P1 case catalog
  - raw JSON (`vitest-p1-repository.json`, `playwright-p1-db-isolation.json`)
  - case-map reconciliation (`p1-case-map-reconciliation.json`)
  - milestone XLSX (`p1-test-report-20260212_103354.xlsx`)

### Additional Stabilization Work
- Fixed Electron renderer loading for `file://` by setting Vite `base: "./"`.
- Fixed preload bridge reliability by moving to CommonJS preload artifact (`preload.cts` -> `preload.cjs`).
- Added renderer path resolver helper for dist layout differences.
- Added automated Node/Electron ABI switching for `better-sqlite3`:
  - `scripts/abi-switcher-core.mjs`
  - `scripts/ensure-better-sqlite3-abi.mjs`
  - npm scripts `abi:node`, `abi:electron`, and auto-hook into `test` / `test:e2e`.

### Verified Commands
- `npm run build` PASS.
- `npm run test -- src/lib/p1.db-migrator.unit.spec.ts src/lib/p1.db-reset.unit.spec.ts src/lib/p1.db-admin-bridge.unit.spec.ts src/lib/p1.electron-app-paths.unit.spec.ts src/lib/p1.abi-switcher.unit.spec.ts` PASS (18/18).
- `npm run test:e2e -- tests/e2e/db-isolation.spec.ts` PASS (2/2).
- `npm run test -- src/lib/p1.repository-switching.unit.spec.ts src/lib/p1.repository-migration-0002.unit.spec.ts src/lib/p1.repository-bridge.unit.spec.ts` PASS (7/7).
- `npm run test` PASS (42/42).
- `npm run test:e2e -- tests/e2e/db-isolation.spec.ts --reporter=json` PASS (2/2).

### Remaining for P1 Closeout
- Final P1 gate still pending:
  - `backup-restore.spec.ts` implementation + passing evidence
  - final closeout once `backup-restore.spec.ts` and `db-isolation.spec.ts` both pass together
