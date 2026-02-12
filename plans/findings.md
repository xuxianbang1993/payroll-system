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
