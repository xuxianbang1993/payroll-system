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

## P2.3 Preparation Findings (2026-02-19)

### 现有基础设施确认

- `payroll_inputs` / `payroll_results` 表已在 0001_init.sql 建立，0002 迁移后 employee_id 为 INTEGER
- `PayrollPayloadRecord` 接口已在 contracts.ts 定义（id: string UUID, employeeId: number, payrollMonth: string, payload: Record）
- `parseJsonRecord` 工具函数可复用（sqlite-shared.ts）
- 无需新 migration，复用已有 schema

### Decisions

| Decision | Rationale |
|----------|-----------|
| save 使用 UPSERT（按 employee_id + payroll_month 唯一性） | 同员工同月只保留最新一份，符合业务语义 |
| id 使用 randomUUID() | 与已有 payroll_inputs/results 的 TEXT PRIMARY KEY 一致 |
| deletePayrollByMonth 同时删 inputs + results | 月度数据是一体的，部分删除会造成不一致 |
| 不修改 IPC/preload/bridge | 属于 P2.4 范围，严格遵循子阶段边界 |

## P2.4 Preparation Findings (2026-02-21)

### 前置条件确认
- ✅ **P2.3已合并**：P2.3代码审查（发现2个CRITICAL）→修复 → 113/113测试通过 → 2026-02-21合并完成
- ✅ **PaySlip类型已定义**：P2.1/P2.2交付的calculator/aggregator支持
- ✅ **SQLite schema已建立**：`payroll_inputs` / `payroll_results` 表在0001_init.sql中已定义，0003 migration添加UNIQUE约束

### 架构规范确认
- **四层IPC模式**（复用P1）：
  - Layer 1: `contracts.ts` — 定义 `RepositoryAdapter` payroll CRUD接口（P2.3已完成）
  - Layer 2: `repository-ipc.ts` — 主进程 `ipcMain.handle()` 处理5个channels
  - Layer 3: `preload.cts` — 暴露 `window.payrollRepository` 对象，包含5个方法
  - Layer 4: `electron-api.d.ts` / `p1-repository.ts` — 渲染进程类型定义和导出函数
- **目的**：打通 renderer→main 的 payroll 数据通路，完成全链路IPC集成

### 5个IPC Channels定义
| Channel | Parameters | Return Type | Maps To |
|---------|-----------|-------------|---------|
| `repo:payroll:input:save` | `employeeId: number, month: string, payload: Record<string, unknown>` | `PayrollPayloadRecord` | `savePayrollInput()` |
| `repo:payroll:input:list` | `month: string` | `PayrollPayloadRecord[]` | `listPayrollInputs()` |
| `repo:payroll:result:save` | `employeeId: number, month: string, payload: Record<string, unknown>` | `PayrollPayloadRecord` | `savePayrollResult()` |
| `repo:payroll:result:list` | `month: string` | `PayrollPayloadRecord[]` | `listPayrollResults()` |
| `repo:payroll:result:delete` | `month: string` | `{ deletedInputs: number; deletedResults: number }` | `deletePayrollByMonth()` |

### 4个文件扩展
1. `electron/ipc/repository-ipc.ts` — 添加 `// --- Payroll ---` section with 5 handlers
2. `electron/preload.cts` — 扩展 `payrollRepository` object with 5 methods
3. `src/types/electron-api.d.ts` — 扩展 `Window.payrollRepository?` interface with 5 signatures
4. `src/lib/p1-repository.ts` — 添加5个exported函数 + `RepositoryDeletePayrollResult` interface

### Prompt生成完成
- P2.4 Codex Prompt已由Opus 4.6生成
- 文件位置：`plans/2026-02-21-p2.4-codex-prompt.md`
- 内容涵盖：
  - 4个文件扩展的精确位置（含行号）
  - 5个IPC channels完整定义与代码示例
  - TypeScript类型要求（无any、typed parameters、Promise<unknown>返回）
  - Channel命名Pattern: `repo:payroll:{input|result}:{save|list|delete}`
  - 验证命令：`npm run build` → TypeScript编译链路完整即通过

### 代码审查重点（为后续Claude Code final review准备）
| 审查点 | 标准 |
|--------|------|
| **Channel命名与P1风格一致** | 遵循 `repo:<domain>:<entity>:<action>` pattern，与 `repo:settings:*`、`repo:employees:*`、`repo:data:*` 风格对齐 |
| **TypeScript类型完整** | ipcMain handlers使用`unknown`+runtime验证、preload方法typed parameters、electron-api.d.ts `Promise<unknown>`、p1-repository函数完整返回类型 |
| **Preload暴露正确** | 5个方法挂在 `window.payrollRepository` 对象上，参数/返回与channel对应，无缺失或多余 |
| **No `any` type** | 全链路严禁any，不合规则reject |
| **Channel runtime validation** | 每个ipcMain.handle都对参数做runtime type check（typeof验证），防止illegal values写入DB |

### Decisions
| Decision | Rationale |
|----------|-----------|
| 5个channels命名 | `repo:payroll:input:{save,list}` + `repo:payroll:result:{save,list,delete}` — 遵循P1模式 `repo:<domain>:<entity>:<action>` |
| 4个文件扩展位置 | repository-ipc.ts、preload.cts、electron-api.d.ts、p1-repository.ts — 都有明确的代码行号，无新建文件 |
| Upsert in IPC? | 否，save channels直接调用repository的savePayrollInput/Result（upsert由P2.3 sqlite-payroll.ts内部处理），保持关注点分离 |
| 验证方式 | `npm run build` — TypeScript编译通过 = 类型链路完整 + channel实装正确 |

## P2.4 Code Review Findings (2026-02-22)

### Review Outcome: Fix Required → Fixed → PASS

**审查方**: Opus 4.6 (superpowers:code-reviewer subagent, SOP §0.2 高难度)
**审查文件**: 4个文件 diff（repository-ipc.ts / preload.cts / electron-api.d.ts / p1-repository.ts）

### Strengths

- 零 `any` 类型，全链路 TypeScript strict 合规
- Channel命名 `repo:payroll:{input|result}:{save|list|delete}` 完全遵循P1规范
- 类型链路完整：contracts → ipc → preload → api.d.ts → p1-repository
- preload方法具有typed parameters（非unknown）
- 列表函数使用直接array pattern，save/delete使用invokeRepo<T>（与P1一致）
- Codex额外添加了显式handler返回类型注解（超出plan要求，属有益偏差）

### Important Issues (2个，已全部修复)

#### I-1 — Array payload 绕过 `typeof` 验证（数据完整性风险）

- **文件**: `electron/ipc/repository-ipc.ts`（save handlers）
- **问题**: `typeof [] === "object"` 为 true，数组可绕过原有检查
  - 数组写入DB会被`JSON.stringify`接受，但`parseJsonRecord`在读取时会拒绝数组
  - 导致 save 表面成功但数据不可恢复（静默数据损坏）
- **修复**: 两个save handler各加 `|| Array.isArray(payload)` 防护
  ```typescript
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw new Error("Invalid payload");
  ```
- **一致性**: 与项目现有的 `asObject` 工具函数（type-guards.ts:9）及 `parseJsonRecord` 防护策略一致

#### I-2 — delete handler 缺少显式返回类型注解（内部不一致）

- **文件**: `electron/ipc/repository-ipc.ts`（`repo:payroll:result:delete` handler）
- **问题**: 其他4个handler均有显式返回类型注解，delete handler遗漏
- **修复**: 添加 `): { deletedInputs: number; deletedResults: number } =>` 注解
- **影响**: 仅一致性问题，TypeScript 会从 repository 方法推断类型，不影响正确性

### Minor Issues (2个，无需操作)

- **M-1**: `PayrollPayloadRecord` import 在 `import type` 中，用作返回类型注解而非JSDoc（plan说明有偏差，实际用法正确）
- **M-2**: IPC层不验证 YYYY-MM 格式（by design：格式验证在DB层 `assertValidPayrollMonth` 已处理，IPC层负责类型安全）

### Verification After Fixes

```
npm run build → ✅ 0 TypeScript errors
npm run test  → ✅ 113/113 PASS（无回归）
```

### Decisions Applied

| 决策 | 理由 |
|------|------|
| 添加 `Array.isArray(payload)` 防护 | 与项目现有 asObject/parseJsonRecord 策略一致，封堵 typeof=object 的数组漏洞 |
| 补充 delete handler 返回类型注解 | 4个handler有注解而1个没有属内部不一致，统一提高可读性和编译安全性 |
| 不添加IPC层 YYYY-MM 格式验证 | 格式验证已在DB层 assertValidPayrollMonth 处理（CRIT-001修复），避免重复防护破坏关注点分离 |

## P2.3 Code Review & Fixes (2026-02-21)

### Review Outcome: Initial PASS (功能完整), 发现2个CRITICAL SOP合规问题

**审查方**: Claude Code (Opus 4.6)
**审查文件**: sqlite-payroll.ts + payroll-repository.test.ts + contracts.ts + sqlite-adapter.ts

### 发现的CRITICAL问题

#### **CRIT-001 — 月份格式无验证**
- **文件**: `electron/db/repository/sqlite-payroll.ts` (行 8-12, 65-101)
- **问题**: 所有5个public函数接受 `month: string` 完全不验证格式
- **SOP要求**: 开发策略文档 §P2.3 明确要求 `YYYY-MM` 格式
- **影响**: 非法月份字符串（如 `"202602"`, `"2026-2"`, `"2026-13"`, `""`, `"abc"`）可被持久化到数据库
- **修复**: 添加 `assertValidPayrollMonth()` 验证函数 + 在所有入口点调用

#### **CRIT-002 — 缺少UNIQUE约束**
- **文件**: `electron/db/migrations/0001_init.sql` + `0002_employee_id_integer.sql` + `sqlite-payroll.ts`
- **问题**: 表 `payroll_inputs` 和 `payroll_results` 缺少 `(employee_id, payroll_month)` 的UNIQUE INDEX
- **SOP要求**: 开发策略文档 §1.5 明确要求 "外键约束" 包括schema级别的约束
- **影响**:
  - 当前用SELECT+INSERT/UPDATE逻辑容易在multi-process或导入场景中产生重复
  - `LIMIT 1` 会隐藏这些重复数据
- **修复**:
  1. 创建新migration `0003_payroll_unique_index.sql` 添加UNIQUE INDEX
  2. 将 `savePayrollPayload` 从SELECT+INSERT/UPDATE改为标准upsert模式 (INSERT ... ON CONFLICT ... DO UPDATE)

### 修复执行

**修改文件**:
1. `electron/db/repository/sqlite-payroll.ts`
   - 添加 PAYROLL_MONTH_RE 常量 + assertValidPayrollMonth() 函数 (行 11-19)
   - 所有public函数入口添加验证调用
   - PayrollTableStatements 从5个statement减为4个（insertOne/updatePayloadById → upsertOne）
   - savePayrollPayload 逻辑从SELECT+INSERT/UPDATE改为single upsert (行 97)

2. `electron/db/migrations/0003_payroll_unique_index.sql` (新建)
   - 创建两个UNIQUE INDEX: uq_payroll_inputs_employee_month + uq_payroll_results_employee_month
   - 包含前置去重逻辑（保留rowid最大的记录）

3. `tests/unit/services/payroll-repository.test.ts`
   - 添加 m3 migration 加载 (行 16, 19)

### 修复验证

```
npm run test -- tests/unit/services/payroll-repository.test.ts
→ ✅ 10/10 PASS (16ms)

npm run test (全量)
→ ✅ 31 files / 113 tests PASS (含P1全部83个 + P2.1计算器13个 + P2.2聚合器7个 + P2.3仓库10个)
→ 无回归
```

### 合规状态

| 检查项 | 修复前 | 修复后 | 状态 |
|--------|--------|--------|------|
| CRIT-001 月份格式验证 | ❌ 无验证 | ✅ YYYY-MM格式强制验证 | PASS |
| CRIT-002 UNIQUE约束 | ❌ 仅应用层 | ✅ Schema级别 + Upsert模式 | PASS |
| 与P1模式一致性 | ✅ | ✅ | PASS |
| TypeScript strict | ✅ | ✅ | PASS |
| decimal.js覆盖 | N/A | N/A | N/A |
| 纯函数设计 | ✅ | ✅ | PASS |
| 单元测试覆盖 | ✅ 10/10 | ✅ 10/10 | PASS |

### 最终评分

**修复前**: 7/10（功能完整，SOP合规不足）
**修复后**: 10/10（全部CRITICAL问题已解决，完全合规SOP §1.5和§P2.3要求）

### 决策记录

| 决策 | 理由 |
|------|------|
| 用 ON CONFLICT upsert 替代 SELECT+INSERT/UPDATE | 标准SQL模式，更安全，更简洁，符合defense-in-depth原则 |
| 创建独立migration 0003 | 保持migration隔离，便于版本管理和回滚 |
| 在migration中前置去重 | 支持对已有脏数据的生产环境应用 |
| 验证所有5个public函数 | 确保没有漏网之鱼 |

## P2.5 Preparation Findings (2026-02-22)

### 现有基础设施确认

| 层级 | 已有 | P2.5 需要 |
|------|------|-----------|
| 纯函数 | calculator.ts / aggregator.ts (P2.1/P2.2) | 直接调用 |
| IPC bridge | 7个 payroll 函数 (P2.4) | 直接调用 |
| 类型 | PayrollInput / PaySlip / AggregateResult / Employee / SocialConfig | 直接使用 |
| Store 模式 | settings-store.ts / employee-store.ts | 复用 create<State>() + toErrorMessage() 模式 |
| 月份 | app-store.ts defaultMonth 模式 | 复用 `new Date().toISOString().slice(0, 7)` |

### 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| State 数据结构 | `Record<number, PayrollInput>` / `Record<number, PaySlip>` | employeeId 为 key，避免数组下标与 id 不对齐 |
| Persist 中间件 | 不使用 | payroll 数据已由 IPC/SQLite 持久化；月度切换时 reset，无需 localStorage |
| generateAll 策略 | 串行 for-loop | 避免 Zustand `set()` 并发竞态；每个 slip 独立错误不阻断其他 |
| aggregate 初始值 | `null`（非 DEFAULT_AGGREGATE） | 区分"未生成任何 slip"和"生成但全为 0"两种语义 |
| DEFAULT_AGGREGATE 导出 | 导出 `DEFAULT_AGGREGATE` const | P2.7 页面展示占位需要 |
| updateInput vs generateSlip 分离 | 分离 | 输入保存和计算是独立操作，用户可先录入所有人的数据再批量生成 |
| setMonth 实现 | `reset() + loadForMonth(month)` | 复用现有 action，保持 DRY |

### Prompt 文件命名策略

- 旧文件: `2026-02-21-p2.4-codex-prompt.md` → 保留作历史存档
- 新文件: `P2-current-status-codex-prompt.md` → 滚动更新，始终代表 P2 阶段当前执行子阶段的 Codex prompt
- 约定: P2.5 完成后，此文件将被替换为 P2.6 的 prompt

---

## P3 Voucher Module Findings (2026-04-09)

### 基线确认

- P2 全部完成，main HEAD `8a1169d`（tag `P2.1.2-P2`）
- P2 测试状态：130 unit ✅ + E2E ✅
- aggregator.ts (P2.2) 可直接被 P3 消费
- `/voucher` 路由为占位 ModulePlaceholderPage

### 架构决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 凭证数据结构 | VoucherEntry → Voucher → VoucherSet 三层 | 最小化耦合，组件只需 Voucher，页面需 VoucherSet |
| 生成函数返回 null | 全部分录为 0 时返回 null | 比返回空数组语义更明确，页面直接 filter(Boolean) |
| 科目名称硬编码中文 | 会计科目是领域术语，不走 i18n | 会计准则中科目名称是固定的 |
| 不新建 voucher-store | 凭证从 payroll slips 实时计算，无独立状态 | 避免状态冗余，遵循 YAGNI |
| CSV 不用 SheetJS | 凭证 CSV 结构简单（5 列），Blob 下载 | 减少依赖，YAGNI |
| 公司筛选在页面层 | aggregatePaySlips(slips, filterCompany) 已支持 | 复用 P2.2 能力，不重复实现 |
| P3.2+P3.3 合并为一个 Codex prompt | UI 组件和页面紧耦合 | 分开发送增加上下文切换成本 |

### 执行发现

1. **Codex prompt 边界锁定有效** — 5 个子阶段全部一次审查通过（零返工），归因于精确的类型定义、函数签名、科目名称、测试场景在 prompt 中全部锁死
2. **CCB 异步通信稳定** — 5 次 `/ask codex` 均成功，无超时或丢失
3. **预存在 build 错误** — payroll-store.ts 有 TS strict 类型转换问题（`as Record<string, unknown>` → `as unknown as Record<string, unknown>`），在 P3 session 中修复
4. **code-reviewer agent 403** — subagent_type: "code-reviewer" 遇到认证错误，改为 CTO 手动审查完成全部代码复查

### CTO 审查清单（全部通过）

| 检查项 | P3.1 | P3.2 | P3.3 | P3.4 | P3.5 |
|--------|------|------|------|------|------|
| decimal.js 全覆盖 | ✅ | N/A | N/A | N/A | N/A |
| 纯函数 | ✅ | N/A | N/A | ✅ | N/A |
| 无 any | ✅ | ✅ | ✅ | ✅ | ✅ |
| i18n 合规 | N/A | ✅ | ✅ | ✅ | N/A |
| 单一职责 | ✅ | ✅ | ✅ | ✅ | ✅ |
| ≤300 行 | ✅(139) | ✅(70) | ✅(182) | ✅(43) | ✅(69) |
| PRD 对齐 | ✅ | ✅ | ✅ | ✅ | ✅ |

### 验收快照

| 编号 | 验收项 | 状态 |
|:----:|--------|------|
| A-04 | 5 张凭证全部借贷平衡 | ✅ |
| A-05 | 按公司筛选正确 | ✅ |
| A-11 | 应付职工薪酬-人员工资余额 = 0 | ✅ |
