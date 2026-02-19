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

### Release Finalization
- merged commit: `69d1088`
- main branch updated and pushed
- release tag pushed: `2.1.2-p1-sqlite-finish`
- feature branch removed: `codex/p1-sqlite-foundation` (local + remote)

## Layout Fix Branch Findings (2026-02-15)

### New Facts Confirmed

- 当前分支：`codex/bugfix/layout-fix`
- 已完成两次提交：
  - `0c289d6`（docs）
  - `783999e`（ui）
- 定向验证通过：
  - `npm run build` PASS
  - overview/layout 定向测试 PASS

### Runtime Root Cause

- 症状：`npm run dev` 启动 Electron 时出现 `better-sqlite3` `NODE_MODULE_VERSION` 不匹配。
- 根因：`npm run test` 会切换到 Node ABI；原 `dev:electron` 未在启动前切回 Electron ABI。
- 结论：`dev:electron` 必须前置 `npm run abi:electron`。

### Data Display Findings

- 症状：概览 KPI 出现 demo 硬编码数据（1245/12350000/98%/3）。
- 风险：用户误认为系统已写入真实业务数据。
- 结论：在未接入真实聚合数据前，正式项目默认显示 `0`，并在 P2/P3 再接入真实值。

### Decisions Applied

| Decision | Rationale |
|----------|-----------|
| `dev:electron` 前置 `abi:electron` | 保证 dev 链路不受上一条 test ABI 影响 |
| 概览 KPI 默认置零 | 消除“伪数据”认知偏差，符合正式系统预期 |
| SOP 与 plans 同步记录上述两项 | 保证后续协作时规则一致，减少回归 |

### Immediate Next Steps

1. 提交 `package.json`（ABI 修复）与 `OverviewPage.tsx`（KPI 置零）。
2. 复验 build + 定向测试 + dev smoke。
3. 分支合并后进入 P2 payroll 开发。

---

## P2 Kickoff Findings (2026-02-18)

### 基线确认

- P1 全部完成，main HEAD `2e2b706`（tag `v2.1.2-p1-current-bug-fixed`）
- P1 测试状态：83 unit ✅ + 4 E2E ✅ + case map `match=25/mismatch=0/noEvidence=0` ✅
- P2 开发分支：`codex/p2-payroll`

### 现有基础设施盘点

| 层级 | 已有 | 缺失 |
|------|------|------|
| 数据库 schema | `payroll_inputs` + `payroll_results` 表已在 P1 migration 中建好 | 无需新 migration |
| Repository contracts | Employee / Settings / Backup CRUD | Payroll CRUD 接口 |
| SQLite actions | `sqlite-employees.ts` / `sqlite-settings.ts` | `sqlite-payroll.ts` |
| IPC channels | 11 个（settings + employee + data） | payroll 相关 channels |
| Preload / bridge | `payrollRepository` 已暴露 settings + employee + data | payroll 方法未暴露 |
| Store | `settings-store` / `employee-store` / `app-store` | `payroll-store` |
| Services | 无 | `calculator.ts` / `aggregator.ts` |
| Pages | payroll 路由为占位 `ModulePlaceholderPage` | `PayrollByEmpPage` / `PayrollDetailPage` |
| Components | 无 payroll 专用组件 | `MonthPicker` / `PayCard` |

### P2 架构决策

| 决策 | 选择 | 理由 |
|------|------|------|
| calculator 是纯函数 | `(Employee, PayrollInput, SocialConfig) → PaySlip` | 零副作用，最大可测试性，SOP 1.5 要求 |
| aggregator 是纯函数 | `(PaySlip[], filterCompany?) → AggregateResult` | 与 calculator 解耦，P3 凭证直接消费 |
| 不需要新 migration | JSON payload 存入已有表 | `payroll_inputs` / `payroll_results` 已在 `0001_init.sql` 建表 |
| rounding 双轨制 | calculator 逐项 round → aggregator 累加后 round | PRD 05 §二 vs §2.2 的精度规则不同 |
| PDF/CSV 推迟 | P2 只做核心计算 + UI | 用户确认，避免分散精力 |
| 子阶段划分 | 10 个细粒度子阶段（Vertical Slice） | 用户选择细粒度，每次 Codex 任务 1-3 文件 |

### P2.1 执行上下文

- P2.1 是 P2 的第一个子阶段，零基础设施依赖
- 产出：`src/services/calculator.ts` + `tests/unit/services/calculator.test.ts`
- 函数签名：`calculatePaySlip(employee, input, socialConfig) → PaySlip`
- 必须用 `decimal.js`，禁原生浮点
- 社保六险每项先独立 `round(2)` 再求和
- 测试需覆盖 SOP 4.7 全部 calculator 场景

### 分工模式

| 角色 | 职责 |
|------|------|
| Codex (GPT-5.3-codex xhigh) | 按子阶段执行开发 |
| 用户 | 将 Codex 产出交给 Claude Code 审查 |
| Claude Code (Opus 4.6) | 代码审查 + 修复 + 更新 plans 文档 |

## P2.1 Code Review (2026-02-18)

### Review Outcome: PASS — 零缺陷，无需修复

### Formula Verification (PRD 05 §二 6 步公式)

- 第一步（收入）：`base`, `totalPerf`, `fullGrossPay` 全部与 PRD 对齐 ✅
- 第二步（缺勤）：`hourlyRate = base / 21.75 / 8`, `absentDeduct`, `grossPay` 正确 ✅
- 第三步（单位社保六险）：每项 `percentAmount` 独立 round(2) 后 `sumRound2` 求和，hasSocial / hasLocalPension 双重守卫正确 ✅
- 第四步（单位公积金）：`cFund = fundAmount`, `cTotal = cSocial + cFund` ✅
- 第五步（个人扣除）：三险 + wFund 正确 ✅
- 第六步（实发）：`totalDeduct = wSocial + wFund + tax`, `netPay = grossPay - totalDeduct` ✅

### Quality Checks

| 检查项 | 结果 |
|--------|------|
| decimal.js 全覆盖，无原生浮点 | ✅ |
| 纯函数，零副作用 | ✅ |
| TypeScript strict，无 `any` | ✅ |
| 单一职责，101 行 | ✅ |
| 无硬编码中文 | ✅ |
| PaySlip 31 字段全部返回 | ✅ |

### Test Coverage (13/13 PASS)

| SOP 场景 | 测试 | 状态 |
|----------|------|------|
| 纯基本工资 | "calculates base-only salary..." | ✅ |
| 含绩效全项 | "calculates fullGrossPay with all..." | ✅ |
| 含缺勤扣款 | "calculates absence deduction..." | ✅ |
| hasSocial 开关 | "zeros all social insurance..." | ✅ |
| hasLocalPension 开关 | "sets cLocalPension to zero..." | ✅ |
| 公积金（>0 / =0） | "sets both cFund and wFund..." (×2) | ✅ |
| 精度敏感 | "rounds each social item..." + "floating-point sensitive" | ✅ |
| netPay 公式 | "calculates netPay..." | ✅ |
| otherAdj 正负 | `it.each` 正/负两组 | ✅ |

### Decisions

| Decision | Rationale |
|----------|-----------|
| hourlyRate 中间 round(2) 后再乘 absentHours | 业务惯例：小时工资是独立展示字段，先定值再扣款。PRD PaySlip 含 hourlyRate 字段佐证此设计 |
| EmployeeType 使用 "management" / "sales" 而非 PRD 的 "管理" / "销售" | P1 已锁定的编码决策，codebase 内部一致 |
| 无需补充全路径集成测试 | 各路径独立覆盖充分，netPay 测试已做端到端公式验证 |

## P2.2 Code Review (2026-02-19)

### Review Outcome: PASS — 零缺陷，无需修复

### PRD §2.2 Verification (汇总规则)

- 汇总 8 字段（fullGrossPay/cSocial/cFund/wSocial/wFund/tax/netPay/absentDeduct）：与 PRD 完全匹配 ✅
- 按 type 分类：`slip.type === "sales"` → sale，else → manage（EmployeeType 仅有 "sales" | "management"，else 分支安全） ✅
- total = sale + manage：通过对所有 slip 并行执行 addSlip(totalGroup) 保证 ✅
- 精度规则：addSlip 用 `Decimal.plus()` 累加原始值，roundGroup 最终统一 `toDecimalPlaces(2)` ✅
- 公司主体筛选：`filterCompany !== undefined && slip.companyShort !== filterCompany` → skip ✅

### Rounding 双轨制验证（P2.2 审查重点）

| 模块 | 策略 | PRD 来源 | 实现 |
|------|------|----------|------|
| calculator.ts | 逐项 round(2) 后求和 | PRD 05 §二 "每一项先单独四舍五入到 2 位小数，再求和" | `sumRound2` / `percentAmount` |
| aggregator.ts | 累加原始值后统一 round(2) | PRD 05 §1.4 / §2.2 "先逐人累加原始值（不取整），全部累加完后统一四舍五入" | `Decimal.plus` → `toDecimalPlaces(2)` |

两套策略在代码中正确区分，无混淆。

### Quality Checks

| 检查项 | 结果 |
|--------|------|
| decimal.js 全覆盖，无原生浮点 | ✅ |
| 纯函数，零副作用 | ✅ |
| TypeScript strict，无 `any` | ✅ |
| 单一职责，77 行 | ✅ |
| 无硬编码中文 | ✅ |
| AggregateResult 类型完整（sale/manage/total） | ✅ |

### Test Coverage (7/7 PASS)

| SOP 场景 | 测试 | 状态 |
|----------|------|------|
| 按 type 分类 | "aggregates slips by type into sale/manage groups" | ✅ |
| 全员合计 = 销售 + 管理 | "makes total equal to sale + manage for every aggregate field" | ✅ |
| 精度规则 | "applies precision rule..." — 3×0.105=0.315→0.32（验证非 round-first 的 0.33） | ✅ |
| 按公司主体筛选 | "filters by companyShort when filterCompany is provided" | ✅ |
| 空输入 | "returns all-zero groups for empty input" | ✅ |
| undefined filter | "treats filterCompany = undefined as aggregating all slips" | ✅ |
| 单一类型 | "keeps missing type group at zero when only one type exists" | ✅ |

### Regression Verification

```
npx vitest run → 30 files / 103 tests PASS（含 P1 全部 + P2.1 calculator）
```

### Decisions

| Decision | Rationale |
|----------|-----------|
| else 分支处理 management 而非显式 `=== "management"` | EmployeeType 是二元联合类型，TypeScript strict 保证穷尽；与 calculator.ts 的 `employee.type` 传递风格一致 |
| AGGREGATE_FIELDS 使用 `as const` + 派生类型 | 类型安全：确保 addSlip/roundGroup 的字段访问与 PaySlip/AggregateGroup 接口同步 |
| 测试数据使用 4 人混合（2 sales + 2 management，分属 AC/BC） | 覆盖分类 + 筛选的交叉场景，与 SOP 4.10 fixtures 要求一致 |
