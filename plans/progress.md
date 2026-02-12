# Progress Log

## Session: 2026-02-12

### Current Status
- **Phase:** 5 - Delivery prep (P1 repository + evidence scope)
- **Started:** 2026-02-12

### Actions Taken
- Initialized planning files (`task_plan.md`, `findings.md`, `progress.md`) for P1 kickoff.
- Reviewed all SOP files and confirmed current versions/constraints.
- Verified strategy updates for SQLite migration guardrails and test isolation.
- Created implementation plan at `plans/2026-02-12-p1-sqlite-foundation.md`.
- Prepared P1 kickoff summary and execution sequence before coding.
- Implemented Task 1 DB foundation:
  - Added `electron/db/config.ts` for runtime env and path resolution.
  - Added `electron/db/client.ts` for SQLite bootstrap (`WAL`, `foreign_keys`).
  - Added initial schema file `electron/db/migrations/0001_init.sql`.
  - Added TDD unit test `src/lib/p1.db-config.unit.spec.ts`.
  - Added dependencies `better-sqlite3` and `@types/better-sqlite3`.
- Captured environment constraint from user: npm network failures should be retried with proxy-aware strategy (`127.0.0.1:7890`).
- Implemented Task 2 migration foundation:
  - Added `electron/db/migrator.ts` and wired migration execution into `electron/db/client.ts`.
  - Added TDD unit test `src/lib/p1.db-migrator.unit.spec.ts`.
- Implemented Task 3 reset safety gate + test sandbox:
  - Added `electron/db/reset.ts` with `APP_ENV=test` guard (`ResetNotAllowedError` outside test).
  - Added `electron/db/test-db.ts` for isolated temporary test DB lifecycle.
  - Added TDD unit test `src/lib/p1.db-reset.unit.spec.ts`.
- Implemented Task 4 DB admin IPC bridge:
  - Added `src/lib/db-admin.ts` for renderer-side runtime/reset access.
  - Extended `electron/preload.ts` and `src/types/electron-api.d.ts` with `payrollDbAdmin`.
  - Added `db:runtime-info` and `db:reset` handlers in `electron/main.ts`.
  - Added TDD unit test `src/lib/p1.db-admin-bridge.unit.spec.ts`.
- Produced raw JSON for foundation + task3 test runs:
  - `China/test/06-reports/raw/vitest-p1-db-foundation-task3.json`
  - `China/test/06-reports/raw/vitest-p1-db-foundation-task4.json`
- Backfilled SOP engineering constraints after db-isolation stabilization:
  - Updated `08-data-management.md` with `better-sqlite3` ABI switching requirements.
  - Updated `09-nonfunctional.md` with preload CommonJS and Vite `base: "./"` constraints.
  - Updated `10-acceptance.md` with ABI auto-switch acceptance criterion (`B-09`).
  - Updated strategy doc to v3.4 with explicit `npm run test` / `npm run test:e2e` ABI pre-step guidance.
- Implemented Phase 3 repository abstraction and mode switching:
  - Added repository contracts/defaults/legacy/sqlite/switching modules under `electron/db/repository/`.
  - Added migration `0002_employee_id_integer.sql` to upgrade employee IDs to INTEGER and remap payroll foreign keys.
  - Added renderer repository bridge `src/lib/p1-repository.ts`.
  - Added repository IPC handlers in `electron/main.ts` and preload/type exposure (`payrollRepository`).
- Added TDD specs for repository scope:
  - `src/lib/p1.repository-switching.unit.spec.ts`
  - `src/lib/p1.repository-migration-0002.unit.spec.ts`
  - `src/lib/p1.repository-bridge.unit.spec.ts`
- Added Codex/macOS Electron crash guard for GUI-required commands:
  - `scripts/electron-gui-guard-core.mjs` for environment policy evaluation.
  - `scripts/assert-electron-gui.mjs` for preflight command blocking in headless Codex.
  - Updated `package.json` scripts (`dev:electron`, `test:e2e`) to run guard before Electron launch.
  - Added TDD unit test `src/lib/p1.electron-gui-guard.unit.spec.ts`.
- Completed Task 6 evidence artifacts for current implemented scope (foundation + repository):
  - Updated governance map: `China/test/00-governance/module-test-map.md`.
  - Added case catalog: `China/test/00-governance/p1-test-cases.json`.
  - Added reconciliation script/report:
    - `scripts/generate-p1-case-map.mjs`
    - `China/test/06-reports/raw/p1-case-map-reconciliation.json`
  - Added milestone report script/output:
    - `scripts/generate-p1-xlsx-report.mjs`
    - `China/test/06-reports/p1-test-report-20260212_103354.xlsx`
  - Added raw reports:
    - `China/test/06-reports/raw/vitest-p1-repository.json`
    - `China/test/06-reports/raw/playwright-p1-db-isolation.json`
    - `China/test/06-reports/raw/playwright-db-isolation.txt`

### Test Results
| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| SOP review | Identify P1 requirements and gates | Completed | PASS |
| `npm run test -- src/lib/p1.db-config.unit.spec.ts` | New config tests fail first then pass | Passed (5/5) | PASS |
| `npm run build:electron` | Electron TypeScript build compiles | Passed after typing/import fixes | PASS |
| `npm ls better-sqlite3 @types/better-sqlite3` | Both packages installed | `better-sqlite3@12.6.2`, `@types/better-sqlite3@7.6.13` | PASS |
| `node --input-type=module ...better-sqlite3` | Native binding load + CRUD + PRAGMA success | `journal=wal`, `foreignKeys=1`, insert/select ok | PASS |
| `npm run test -- src/lib/p1.db-migrator.unit.spec.ts` | Migration runner TDD test pass | Passed (2/2) | PASS |
| `npm run test -- src/lib/p1.db-reset.unit.spec.ts` | Reset guard + sandbox test pass | Passed (3/3) | PASS |
| `npm run test -- src/lib/p1.db-config.unit.spec.ts src/lib/p1.db-migrator.unit.spec.ts src/lib/p1.db-reset.unit.spec.ts` | Combined foundation suite passes | Passed (10/10) | PASS |
| `npm run test -- src/lib/p1.db-admin-bridge.unit.spec.ts` | DB admin preload bridge test pass | Passed (3/3) | PASS |
| `npm run test -- src/lib/p1.db-config.unit.spec.ts src/lib/p1.db-migrator.unit.spec.ts src/lib/p1.db-reset.unit.spec.ts src/lib/p1.db-admin-bridge.unit.spec.ts` | Foundation + Task4 suite passes | Passed (13/13) | PASS |
| `npm run build:electron` | Electron TypeScript build remains green after Task 3 | Passed | PASS |
| `npm run test -- src/lib/p1.abi-switcher.unit.spec.ts` | ABI switcher core test pass | Passed (6/6) | PASS |
| `npm run test -- src/lib/p1.db-migrator.unit.spec.ts src/lib/p1.db-reset.unit.spec.ts src/lib/p1.db-admin-bridge.unit.spec.ts src/lib/p1.electron-app-paths.unit.spec.ts src/lib/p1.abi-switcher.unit.spec.ts` | P1 targeted Node suite passes with auto ABI switch | Passed (18/18) | PASS |
| `npm run test:e2e -- tests/e2e/db-isolation.spec.ts` | db-isolation E2E with auto Electron ABI switch | Passed (2/2) | PASS |
| `npm run test -- src/lib/p1.db-reset.unit.spec.ts` after E2E | Node ABI auto-restored and unit still passes | Passed (3/3) | PASS |
| `npm run test -- src/lib/p1.repository-switching.unit.spec.ts src/lib/p1.repository-migration-0002.unit.spec.ts src/lib/p1.repository-bridge.unit.spec.ts` | Repository TDD scope passes | Passed (7/7) | PASS |
| `npm run build:electron` | Electron TypeScript build remains green after repository integration | Passed | PASS |
| `npm run test -- src/lib/p1.repository-bridge.unit.spec.ts src/lib/p1.db-admin-bridge.unit.spec.ts src/lib/p1.db-reset.unit.spec.ts` | Bridge + admin + reset regression | Passed (8/8) | PASS |
| `npm run test -- src/lib/p1.electron-gui-guard.unit.spec.ts` | Electron GUI guard policy test | Passed (4/4) | PASS |
| `npm run build` | Full web+electron build passes after repository + migration changes | Passed | PASS |
| `npm run test` | Full Vitest suite remains green after repository changes | Passed (42/42) | PASS |
| `npm run test:e2e -- tests/e2e/db-isolation.spec.ts` (evidence run) | db-isolation remains green and raw artifacts refreshed | Passed (2/2) | PASS |
| `npm run test:e2e -- tests/e2e/db-isolation.spec.ts` (Codex macOS) | Avoid AppKit abort and exit with actionable message in headless environment | Guard blocked launch with explicit remediation text | PASS |
| `node scripts/generate-p1-case-map.mjs` | Case-map reconciliation report generated | `match=12, mismatch=0, noEvidence=0` | PASS |
| `node scripts/generate-p1-xlsx-report.mjs` | P1 milestone XLSX generated | `p1-test-report-20260212_103354.xlsx` | PASS |

### Errors
| Error | Resolution |
|-------|------------|
| `TS7016` missing `better-sqlite3` declarations | Installed `@types/better-sqlite3` |
| `TS2835` NodeNext import extension mismatch | Changed to `./config.js` in `client.ts` |
| Playwright `webServer` failed with `listen EPERM 127.0.0.1:4173` under sandboxed runs | Re-ran required E2E artifact commands with elevated permissions; retained successful JSON/text outputs |
| Electron aborted on macOS (`SIGABRT` in `_NSApplication sharedApplication`) when launched from Codex process | Added `assert-electron-gui` preflight guard and documented desktop-terminal requirement for GUI Electron runs |

### Debug Update (db-isolation)
- Investigated recurring macOS E2E issue where Electron showed default page / blank page and `firstWindow()` timed out.
- Root causes confirmed:
  - Playwright launched raw JS entry path, so Electron default app route was shown in some runs.
  - Preload was emitted as ESM `preload.js`; under current Electron preload constraints it did not expose `window.payrollDbAdmin`.
  - Vite production build used absolute asset paths (`/assets/...`) causing blank renderer when loaded via `file://`.
  - `better-sqlite3` binary ABI mismatch between Node and Electron caused early app bootstrap failure (`NODE_MODULE_VERSION` mismatch).
- Fixes applied:
  - Updated launch path usage to app directory semantics in E2E helper.
  - Converted preload to CommonJS (`electron/preload.cts` -> `dist-electron/electron/preload.cjs`) and updated BrowserWindow preload path.
  - Set `base: "./"` in Vite config for `file://` production loading.
  - Rebuilt native dependency for Electron runtime via `npx electron-rebuild -f -w better-sqlite3`.
- Verification:
  - `npm run build` PASS.
  - `npm run test:e2e -- tests/e2e/db-isolation.spec.ts` PASS (2/2).
  - Raw log captured at `China/test/06-reports/raw/playwright-db-isolation.txt`.

### Debug Update (ABI automation)
- Added dual ABI automation to eliminate manual Node/Electron native rebuild switching:
  - `scripts/abi-switcher-core.mjs` (target parsing + rebuild decision + runtime command mapping).
  - `scripts/ensure-better-sqlite3-abi.mjs` (marker-based runtime switch executor).
  - npm scripts:
    - `abi:node` -> rebuild `better-sqlite3` for Node runtime.
    - `abi:electron` -> rebuild `better-sqlite3` for Electron runtime via `@electron/rebuild`.
    - `test` now auto-runs `abi:node`.
    - `test:e2e` now auto-runs `abi:electron`.
- Added TDD unit coverage for switch logic:
  - `src/lib/p1.abi-switcher.unit.spec.ts` (6 tests).
- Verification:
  - `npm run build` PASS.
  - `npm run test -- src/lib/p1.abi-switcher.unit.spec.ts` PASS (6/6).
  - `npm run test -- src/lib/p1.db-migrator.unit.spec.ts src/lib/p1.db-reset.unit.spec.ts src/lib/p1.db-admin-bridge.unit.spec.ts src/lib/p1.electron-app-paths.unit.spec.ts src/lib/p1.abi-switcher.unit.spec.ts` PASS (18/18).
  - `npm run test:e2e -- tests/e2e/db-isolation.spec.ts` PASS (2/2).
  - Re-run `npm run test -- src/lib/p1.db-reset.unit.spec.ts` after E2E also PASS (3/3), confirming round-trip switch stability.

### Status Snapshot
- Phase 3 repository tasks are complete (switching repository + settings/employee/backup/storage integration path).
- Task 6 evidence package for current implemented scope is complete (raw JSON + case-map reconciliation + XLSX).
- P1 final completion gate is still pending `backup-restore.spec.ts`; no false completion claim has been made.
