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

## Session: 2026-02-14 (P1 Data Closeout Sprint)

### Current Status
- **Phase:** 2 - Planning state sync, implementation starting
- **Branch:** `codex/p1-sqlite-foundation`

### Actions Taken
- Confirmed current workspace baseline and unresolved P1 gate against README + SOP.
- Confirmed user choices:
  - execute P1 closeout sprint (Data module first)
  - include both root and app README updates
  - maintain four plans files continuously
  - keep executable test layout unchanged
  - use native Electron dialogs for backup file I/O
- Created branch `codex/p1-sqlite-foundation` (escalated git switch due sandbox lock restriction).
- Created sprint plan file: `plans/2026-02-14-p1-closeout-sprint.md`.
- Refreshed `plans/task_plan.md` for this sprint.
- Appended kickoff findings and assumptions in `plans/findings.md`.

### Next Immediate Steps
- Implement repository clear-data contract and adapters.
- Add data clear + backup file IPC in main/preload/renderer bridges.
- Build BackupPage + StoragePage and wire routes.
- Add tests (`src` unit specs + `tests/e2e/backup-restore.spec.ts`).

### Completion Update (2026-02-14)
- Implemented backend Data closeout changes:
  - repository contracts/adapters now include `clearData`
  - main process IPC added for `repo:data:clear` and backup file save/open
  - preload/type/renderer bridges updated for clear + file operations
- Implemented Data UI pages and route wiring:
  - `src/pages/data/BackupPage.tsx`
  - `src/pages/data/StoragePage.tsx`
  - `src/router/app-routes.tsx` updated for real data routes
- Added/updated tests:
  - `src/lib/p1.repository-switching.unit.spec.ts`
  - `src/lib/p1.repository-bridge.unit.spec.ts`
  - `src/lib/p1.repository-clear-data.unit.spec.ts` (new)
  - `src/lib/p1.backup-files-bridge.unit.spec.ts` (new)
  - `tests/e2e/backup-restore.spec.ts` (new)
- Updated governance mapping files:
  - `China/test/00-governance/p1-test-cases.json`
  - `China/test/00-governance/module-test-map.md`
- Updated docs:
  - root `README.md`
  - `China/payroll-app/README.md`

### Final Test Results (This Session)
| Command | Result |
|--------|--------|
| `npm run build` | PASS |
| `npm run test` | PASS (18 files / 50 tests) |
| `ALLOW_ELECTRON_GUI_IN_CODEX=1 npm run test:e2e -- tests/e2e/db-isolation.spec.ts tests/e2e/backup-restore.spec.ts` | PASS (3 tests) |
| `node scripts/generate-p1-case-map.mjs` | PASS (`match=16/mismatch=0/noEvidence=0`) |
| `node scripts/generate-p1-xlsx-report.mjs` | PASS (`p1-test-report-20260214_085752.xlsx`) |
- Post-doc/i18n adjustment verification rerun:
  - `npm run test` PASS (50/50)
  - `ALLOW_ELECTRON_GUI_IN_CODEX=1 npm run test:e2e -- tests/e2e/db-isolation.spec.ts tests/e2e/backup-restore.spec.ts` PASS (3/3)
- Final evidence refresh complete:
  - `China/test/06-reports/raw/vitest-p1-repository.json` regenerated
  - `China/test/06-reports/raw/playwright-p1-db-isolation.json` regenerated
  - `China/test/06-reports/raw/p1-case-map-reconciliation.json` regenerated (`match=16`)
  - `China/test/06-reports/p1-test-report-20260214_090224.xlsx` generated

## Session: 2026-02-14 (P1 Full Module Closeout)

### Scope
- Complete remaining P1 modules on top of existing SQLite/Data foundation:
  - `settings`
  - `employee`
  - `import-export`

### Actions Taken
- Added new front-end domain types in `src/types/payroll.ts`:
  - `SettingsFormModel`
  - `EmployeeFormModel`
  - `EmployeeImportRow`
- Added new libraries/stores:
  - `src/lib/p1-employee-import-export.ts`
  - `src/stores/settings-store.ts`
  - `src/stores/employee-store.ts`
- Added new pages:
  - `src/pages/settings/OrgSettingsPage.tsx`
  - `src/pages/settings/SocialConfigPage.tsx`
  - `src/pages/settings/CompanyPage.tsx`
  - `src/pages/employee/EmployeeListPage.tsx`
  - `src/pages/employee/ImportExportPage.tsx`
- Replaced placeholder routes in `src/router/app-routes.tsx` for settings + employee paths.
- Expanded locale dictionaries in:
  - `src/i18n/locales/zh-CN/common.json`
  - `src/i18n/locales/zh-HK/common.json`
  - `src/i18n/locales/en/common.json`
- Added tests:
  - `src/lib/p1.employee-import-export.unit.spec.ts`
  - `src/stores/p1.settings-store.unit.spec.ts`
  - `src/stores/p1.employee-store.unit.spec.ts`
  - `src/pages/settings/p1.org-settings.component.spec.tsx`
  - `src/pages/employee/p1.employee-list.component.spec.tsx`
  - `tests/e2e/p1-settings-employee-data.spec.ts`
- Updated governance and docs:
  - `China/test/00-governance/p1-test-cases.json`
  - `China/test/00-governance/module-test-map.md`
  - root/app `README.md`

### Verification Results
| Command | Result |
|--------|--------|
| `npm run build` | PASS |
| `npm run test` | PASS (23 files / 64 tests) |
| `ALLOW_ELECTRON_GUI_IN_CODEX=1 npm run test:e2e -- tests/e2e/db-isolation.spec.ts tests/e2e/backup-restore.spec.ts tests/e2e/p1-settings-employee-data.spec.ts` | PASS (4/4) |
| `npm run abi:node && npx vitest run --reporter=json --outputFile=../test/06-reports/raw/vitest-p1-repository.json` | PASS |
| `npm run abi:electron && ALLOW_ELECTRON_GUI_IN_CODEX=1 npx playwright test ... --reporter=json > ../test/06-reports/raw/playwright-p1-db-isolation.json` | PASS |
| `node scripts/generate-p1-case-map.mjs` | PASS (`match=25/mismatch=0/noEvidence=0`) |
| `node scripts/generate-p1-xlsx-report.mjs` | PASS (`p1-test-report-20260214_092954.xlsx`) |

## Session: 2026-02-14 (Closeout Review Risk Fixes)

### Scope
- Apply top-3 closeout review fixes before submit-ready checklist:
  - import conflict guard
  - employee detail edit jump
  - overview status truthfulness

### Actions Taken
- Updated `src/pages/employee/ImportExportPage.tsx`:
  - added unresolved-conflict guard to disable main apply action
  - added explicit "resolve conflicts" CTA and pending-conflict notice
- Updated `src/pages/employee/EmployeeListPage.tsx`:
  - added detail-card action to start inline edit directly
- Updated `src/pages/home/OverviewPage.tsx`:
  - switched module card status text to ready/pending keyed rendering
- Updated locale files (`zh-CN` / `zh-HK` / `en`) for newly added copy.
- Added/updated tests:
  - `src/pages/employee/p1.employee-list.component.spec.tsx`
  - `src/pages/employee/p1.import-export.component.spec.tsx`
  - `src/pages/home/p1.overview-status.component.spec.tsx`

### Verification Results
| Command | Result |
|--------|--------|
| `npm run test -- src/pages/employee/p1.employee-list.component.spec.tsx src/pages/employee/p1.import-export.component.spec.tsx src/pages/home/p1.overview-status.component.spec.tsx` | PASS (3 files / 4 tests) |
| `npm run build` | PASS |
| `npm run test` | PASS (25 files / 67 tests) |
| `ALLOW_ELECTRON_GUI_IN_CODEX=1 npm run test:e2e -- tests/e2e/db-isolation.spec.ts tests/e2e/backup-restore.spec.ts tests/e2e/p1-settings-employee-data.spec.ts` | PASS (4/4) |
| `node scripts/generate-p1-case-map.mjs` | PASS (`match=25/mismatch=0/noEvidence=0`) |
| `node scripts/generate-p1-xlsx-report.mjs` | PASS (`p1-test-report-20260214_100814.xlsx`) |

### Notes
- E2E command required elevated execution in this Codex environment due local preview server bind permission (`127.0.0.1:4173`).

### Issues and Resolutions
| Issue | Resolution |
|-------|------------|
| TypeScript build error for `Blob` input in import/export page | Copied bytes into `Uint8Array` with concrete `ArrayBuffer` backing before constructing `Blob` |
| Type inference issue when persisting updated employee rows | Added explicit `toEmployeeRecord` conversion to keep strong `Employee` typing |
| Playwright preview server blocked in sandbox (`listen EPERM 127.0.0.1:4173`) | Re-ran E2E/evidence commands with elevated permissions |

## Session: 2026-02-14 (Release Prep: 2.1.2-p1-sqlite-finish)

### Scope
- Finalize P1 release packaging and handoff artifacts:
  - SOP status synchronization
  - plans next-step handoff
  - README progress synchronization
  - git release flow (commit/tag/push/merge/cleanup)

### Actions Taken
- Confirmed release version from user: `2.1.2-p1-sqlite-finish`.
- Updated SOP docs with latest stage state and next-phase instructions:
  - `00-INDEX.md`, `02-ui-layout.md`, `03-mod-settings.md`, `04-mod-employee.md`
  - `05-mod-payroll.md`, `06-mod-voucher.md`, `07-import-export.md`
  - `08-data-management.md`, `09-nonfunctional.md`, `10-acceptance.md`
  - `薪酬系统-开发策略文档.md`
- Updated READMEs:
  - root `README.md`
  - `China/payroll-app/README.md`
- Updated plans handoff metadata and next-phase kickoff reference.

### Next Immediate Steps
- Run final verification commands (build + test + key e2e).
- Complete git flow:
  - commit
  - tag `2.1.2-p1-sqlite-finish`
  - push branch/tag
  - merge to `main`
  - delete `codex/p1-sqlite-foundation`.

### Verification Results (Release Prep)
| Command | Result |
|--------|--------|
| `npm run build` | PASS |
| `npm run test` | PASS (25 files / 67 tests) |
| `ALLOW_ELECTRON_GUI_IN_CODEX=1 npm run test:e2e -- tests/e2e/db-isolation.spec.ts tests/e2e/backup-restore.spec.ts tests/e2e/p1-settings-employee-data.spec.ts` | PASS (4/4) |
| `node scripts/generate-p1-case-map.mjs` | PASS (`match=25/mismatch=0/noEvidence=0`) |
| `node scripts/generate-p1-xlsx-report.mjs` | PASS (`p1-test-report-20260214_100814.xlsx`) |

### Git Release Flow Results
| Step | Result |
|------|--------|
| Commit | `69d1088` created |
| Tag | `2.1.2-p1-sqlite-finish` created |
| Push branch | `codex/p1-sqlite-foundation` pushed |
| Merge | Fast-forward merged into `main` |
| Push main | `origin/main` updated to `69d1088` |
| Push tag | `origin/2.1.2-p1-sqlite-finish` created |
| Cleanup | local/remote `codex/p1-sqlite-foundation` deleted |
