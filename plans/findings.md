# Findings & Decisions

## Requirements
- User confirmed: start P1 now, but first summarize current conversation state and inspect SOP files.
- P0 is complete and released; branch is `codex/p1-sqlite-foundation`.
- Migration target is fixed: SQLite + better-sqlite3 for business data, electron-store for light UI config.
- Test safety requirements are mandatory: `APP_ENV=test`, isolated DB path, guarded reset API.
- If npm install fails, retry with proxy-aware methods; user proxy endpoint is `127.0.0.1:7890`.

## Research Findings
- P1 required PRD set from strategy doc:
  - `01-data-model.md`
  - `03-mod-settings.md`
  - `04-mod-employee.md`
  - `07-import-export.md`
  - `08-data-management.md`
- Non-functional and acceptance files now include post-debug engineering constraints:
  - `09-nonfunctional.md` v1.4 (preload CJS + Vite `base: "./"` constraints)
  - `10-acceptance.md` v1.4 (`B-09` ABI auto-switch acceptance)
- Strategy doc v3.4 defines:
  - `APP_ENV`, `TEST_DB_PATH`, `READ_SOURCE`, `WRITE_MODE`
  - `db-isolation.spec.ts` as P1 gate
  - P1 completion gate includes `backup-restore.spec.ts` + `db-isolation.spec.ts`
  - `npm run test` / `npm run test:e2e` ABI pre-switch requirements
- Task 1 implementation used official APIs:
  - `better-sqlite3` supports `db.pragma(...)` for WAL and foreign key activation.
  - SQLite PRAGMA values can be read back for runtime verification.
- Task 3 implementation confirms policy enforcement:
  - `resetDatabase` is blocked unless `appEnv === "test"`.
  - Reset only clears business tables and preserves `schema_migrations`.
- Task 4 implementation establishes a typed renderer bridge:
  - `db:runtime-info` returns env/mode/db path/schema/pragmas for diagnostics.
  - `db:reset` routes through the same guard logic as internal reset service.
- db-isolation debugging (2026-02-12) found cross-runtime and packaging issues:
  - Electron preload behavior: `.js` preload emitted as ESM did not reliably execute in this setup; switched to CommonJS preload artifact (`preload.cjs`).
  - Electron file-based renderer load with Vite requires relative build asset paths; absolute `/assets/...` led to blank page under `file://`.
  - Native addon ABI is runtime-specific: `better-sqlite3` needs Electron-target rebuild for E2E (`npx electron-rebuild -w better-sqlite3`), otherwise bootstrap fails with `NODE_MODULE_VERSION` mismatch.
  - `electron-builder install-app-deps` with default options may still leave `better-sqlite3` on Node ABI in this environment; forced rebuild via `@electron/rebuild -f -w better-sqlite3` is reliable.
- Repository implementation findings (2026-02-12):
  - `READ_SOURCE` and `WRITE_MODE` are now enforced by switching repository, not only logged as config.
  - Legacy compatibility layer can be safely hosted in `electron-store` as migration buffer (`legacy.repository.state.v1`) without coupling renderer state.
  - Backup import must normalize both legacy and extended payloads to avoid schema drift and missing-field crashes.
  - Employee ID migration to INTEGER requires coordinated remap for `employees/payroll_inputs/payroll_results` to preserve foreign-key integrity.
- E2E execution environment finding:
  - Sandbox runs may block Playwright preview server binding on `127.0.0.1:4173` (`listen EPERM`); elevated execution is required in this environment for deterministic artifact generation.
  - macOS Codex-launched Electron GUI startup can abort in AppKit initialization (`_NSApplication sharedApplication`, `SIGABRT`) because process context is non-interactive/headless.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Review SOP first, code second | Follow user request and reduce rework |
| Use foundation-first P1 sequence | Stabilizes data layer before module migration |
| Keep rollback switches during migration | Supports safe staged rollout and quick fallback |
| Keep DB config resolution pure and testable (no direct Electron dependency) | Enables unit testing and clear env gating behavior |
| Use explicit allow-list for resettable tables | Prevents accidental truncation of metadata/system tables |
| Keep DB admin operations in dedicated bridge (`payrollDbAdmin`) | Avoids coupling with existing `payrollStore` contract |
| Emit preload as CommonJS (`preload.cts` -> `preload.cjs`) | Restores stable bridge injection in Electron runtime used by db-isolation tests |
| Set Vite `base: "./"` | Ensures production assets load correctly in `file://` desktop mode |
| Introduce marker-based ABI switch scripts (`abi:node`, `abi:electron`) | Eliminates manual native rebuild toggling and stabilizes alternating unit/E2E runs |
| Backfill hardened constraints into SOP docs immediately | Prevents future contributors from reintroducing known runtime/packaging regressions |
| Implement true `legacy/sqlite` switching repository instead of placeholder flags | Delivers real migration rollback control promised by v3.4 strategy |
| Keep dual-write failure explicit (`DualWriteError`) with structured log fields | Prevents silent divergence between sqlite and legacy stores |
| Complete P1 evidence for current implemented scope before full module feature work | Preserves traceable milestone chain while keeping `backup-restore` as explicit remaining gate |
| Add preflight Electron GUI guard for Codex/macOS commands | Fails fast with actionable instructions instead of crashing in AppKit init |

## Execution Status (Updated 2026-02-12)
- Task 1 complete: SQLite config/bootstrap + migration seed.
- Task 2 complete: migration runner + schema version tracking.
- Task 3 complete: reset safety gate + test sandbox.
- Task 4 complete: DB admin IPC bridge + renderer API typing.
- Task 5 complete: `db-isolation` E2E implemented and passing (`test` reset allowed / `prod` reset denied).
- Phase 3 repository tasks complete:
  - repository abstraction with `legacy/sqlite` read-write switching
  - settings + employee + backup/storage path integration via repository IPC/preload/renderer bridge
  - employee ID INTEGER migration (`0002_employee_id_integer.sql`)
- Task 6 evidence publishing complete for current implemented scope:
  - raw JSON (`vitest-p1-repository.json`, `playwright-p1-db-isolation.json`)
  - case-map reconciliation (`p1-case-map-reconciliation.json`, `match=12/mismatch=0/noEvidence=0`)
  - milestone XLSX (`p1-test-report-20260212_103354.xlsx`)
- Remaining in P1 final gate: `backup-restore.spec.ts` still pending (not yet implemented in this batch).

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| `better-sqlite3` ABI mismatch when switching Node tests and Electron E2E | Added scripted runtime rebuild flow and marker file under `node_modules/.cache/better-sqlite3-abi-target` |
| Electron default app page appeared in E2E | Switched E2E launch to app path semantics and aligned package `main` |
| Preload bridge missing in renderer (`window.payrollDbAdmin` undefined) | Converted preload build target to CommonJS (`preload.cts`) and updated BrowserWindow preload path |
| Blank renderer window in packaged/file mode | Set Vite build base to relative (`base: "./"`) |
| Playwright artifact runs intermittently failed with `listen EPERM 127.0.0.1:4173` in sandbox | Executed required E2E evidence commands with elevated permissions and preserved successful report outputs |
| Electron process aborted with `SIGABRT` when launched by Codex on macOS | Guarded `dev:electron` and `test:e2e` with `scripts/assert-electron-gui.mjs`; require desktop terminal (or explicit override) for GUI Electron runs |

## Resources
- `/Users/xuxianbang/Documents/payroll system/China/Devolop files SOP/00-INDEX.md`
- `/Users/xuxianbang/Documents/payroll system/China/Devolop files SOP/01-data-model.md`
- `/Users/xuxianbang/Documents/payroll system/China/Devolop files SOP/03-mod-settings.md`
- `/Users/xuxianbang/Documents/payroll system/China/Devolop files SOP/04-mod-employee.md`
- `/Users/xuxianbang/Documents/payroll system/China/Devolop files SOP/07-import-export.md`
- `/Users/xuxianbang/Documents/payroll system/China/Devolop files SOP/08-data-management.md`
- `/Users/xuxianbang/Documents/payroll system/China/Devolop files SOP/09-nonfunctional.md`
- `/Users/xuxianbang/Documents/payroll system/China/Devolop files SOP/10-acceptance.md`
- `/Users/xuxianbang/Documents/payroll system/China/Devolop files SOP/薪酬系统-开发策略文档.md`

## Execution Kickoff (2026-02-14)

### New Facts Confirmed
- Branch `codex/p1-sqlite-foundation` is created from current `main` baseline.
- P1 foundation code exists (SQLite/migrator/repository switching/db isolation), while Data UI pages are still placeholders.
- Remaining P1 hard gate still includes `backup-restore.spec.ts` + `db-isolation.spec.ts` passing with evidence bundle.
- Current Vitest config executes only `src/**/*.{test,spec}.{ts,tsx}` and excludes `tests/**`.
- Current Playwright config executes only `tests/e2e`.

### Scope Locked for This Sprint
- Priority: Data module closeout first (`/data/backup`, `/data/storage`).
- Keep current test execution layout; do not migrate to `tests/unit` or `tests/component` now.
- Add native backup file I/O via Electron IPC instead of browser-only blob/fileinput flow.
- Keep test safety policy unchanged (`db:reset` remains test-only).

### Implementation Notes
- `repo:data:clear` will be added as production-facing clear operation distinct from `db:reset`.
- Repository adapter contract must remain mode-safe across `legacy/sqlite/dual` write modes.
- File backup API will support cancel-safe responses for native dialog flows.

### Risks and Controls
- Existing dirty workspace files (`.DS_Store`, `dist-electron`) require strict file-level staging discipline.
- Electron GUI commands may require `ALLOW_ELECTRON_GUI_IN_CODEX=1` in this environment.

## Sprint Completion (2026-02-14)

### Delivered
- Added production data clear operation through repository path (`repo:data:clear`) while preserving test-only `db:reset` guard.
- Added native backup file bridge (`file:backup:save-json`, `file:backup:open-json`) and renderer wrappers.
- Implemented `/data/backup` and `/data/storage` pages and replaced data route placeholders.
- Added i18n coverage for Data module interactions in `zh-CN` / `zh-HK` / `en`.
- Added test coverage for:
  - repository clear routing
  - sqlite clear behavior and default restoration
  - backup file preload bridge
  - backup/clear/restore e2e flow
- Updated governance case catalog from 12 to 16 cases and refreshed evidence bundle.

### Verification Outcomes
- `npm run build` PASS
- `npm run test` PASS (50/50)
- `ALLOW_ELECTRON_GUI_IN_CODEX=1 npm run test:e2e -- tests/e2e/db-isolation.spec.ts tests/e2e/backup-restore.spec.ts` PASS (3/3)
- `p1-case-map-reconciliation.json`: `match=16`, `mismatch=0`, `noEvidence=0`

### Updated Evidence Artifacts
- `China/test/06-reports/raw/vitest-p1-repository.json`
- `China/test/06-reports/raw/playwright-p1-db-isolation.json`
- `China/test/06-reports/raw/p1-case-map-reconciliation.json`
- `China/test/06-reports/p1-test-report-20260214_085752.xlsx`

### Final Evidence Refresh (2026-02-14)
- Re-generated raw test outputs after final validation pass.
- Latest reconciliation summary:
  - generatedAt: `2026-02-14T09:02:23.933Z`
  - totalCases: `16`
  - match: `16`
  - mismatch: `0`
  - noEvidence: `0`
- Latest XLSX artifact: `China/test/06-reports/p1-test-report-20260214_090224.xlsx`.

## Full Module Closeout Update (2026-02-14)

### New Findings
- Data closeout was complete, but SOP-mandated P1 scope still lacked `settings` + `employee` + `import-export` actual pages.
- Existing repository IPC surface was sufficient for this stage (`getSettings/saveSettings/listEmployees/replaceEmployees/exportBackup/importBackup/getStorageInfo/clearData`), so no additional main-process CRUD IPC was required.
- Route-level placeholders could be replaced directly while preserving payroll/voucher placeholders as out-of-scope.
- Excel import/export can be implemented on renderer side with `xlsx` while conflict resolution remains deterministic through name+idCard keying.

### Decisions Applied
| Decision | Rationale |
|----------|-----------|
| Reuse existing repository IPC for settings/employee writes | Avoid unnecessary main-process interface expansion in P1 closeout |
| Add dedicated front-end stores (`settings-store`, `employee-store`) | Isolate page state and keep page components focused on UI |
| Implement `p1-employee-import-export` utility for template/parse/conflict/export | Centralize import/export rules and improve unit-test coverage |
| Keep test layout unchanged (`src` Vitest, `tests/e2e` Playwright) | Matches active runner config and prior governance assumptions |
| Produce new E2E flow `p1-settings-employee-data.spec.ts` | Adds objective evidence for remaining P1 module scope |

### Evidence Outcome
- Case catalog expanded from 16 to 25.
- Latest reconciliation (`China/test/06-reports/raw/p1-case-map-reconciliation.json`):
  - `totalCases=25`
  - `match=25`
  - `mismatch=0`
  - `noEvidence=0`
- Latest XLSX report: `China/test/06-reports/p1-test-report-20260214_092954.xlsx`.

## Closeout Review Update (2026-02-14)

### Review Findings Addressed
- Import conflict path: direct "Apply Import" can no longer proceed while unresolved conflicts exist.
- Employee detail usability: added direct action to jump from detail panel into inline edit.
- Overview state signal: cards now differentiate `ready` and `pending` instead of showing all modules as pending.

### Decisions Applied
| Decision | Rationale |
|----------|-----------|
| Keep import execution gated behind conflict-resolution dialog | Prevent accidental overwrite import from main action path |
| Add detail-to-edit action instead of adding a separate edit page | Minimal UX change, immediate completion of documented behavior |
| Keep payroll/voucher as pending in overview | Respect current out-of-scope boundary while exposing true readiness of delivered modules |

### Verification Evidence
- `npm run test -- src/pages/employee/p1.employee-list.component.spec.tsx src/pages/employee/p1.import-export.component.spec.tsx src/pages/home/p1.overview-status.component.spec.tsx`: PASS
- `npm run build`: PASS
- `npm run test`: PASS (`67/67`)
- `ALLOW_ELECTRON_GUI_IN_CODEX=1 npm run test:e2e -- tests/e2e/db-isolation.spec.ts tests/e2e/backup-restore.spec.ts tests/e2e/p1-settings-employee-data.spec.ts`: PASS (`4/4`)
- `node scripts/generate-p1-case-map.mjs`: PASS (`summary.match=25`, `summary.mismatch=0`, `summary.noEvidence=0`)
- `node scripts/generate-p1-xlsx-report.mjs`: PASS (`China/test/06-reports/p1-test-report-20260214_100814.xlsx`)

## Release Closure Decision (2026-02-14)

### Versioning
- Release version fixed by user: `2.1.2-p1-sqlite-finish`.
- Baseline reference remains main tag `2.1.2`.

### Documentation Sync
- SOP files updated to show:
  - P1 delivered: settings/employee/import-export(data) modules
  - P2 pending: payroll module
  - P3 pending: voucher module
- Root/app README updated with:
  - what was completed
  - what was fixed in closeout review
  - what remains

### Next Work Package
- Next mandatory plan file: `plans/2026-02-14-p2-payroll-kickoff.md`.
- P2 first gate:
  - `calculator.ts` + unit tests
  - `payroll-flow.spec.ts`
  - evidence three-piece output.
