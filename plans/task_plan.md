# Task Plan: P1 Closeout Program

## Goal
Close P1 by finishing Data + Settings + Employee + Import/Export scope and maintaining complete objective evidence artifacts.

## Current Phase
Phase 9

## Phases

### Phase 1: Kickoff & Baseline
- [x] Create and switch to `codex/p1-sqlite-foundation`
- [x] Confirm unresolved P1 gate (`backup-restore.spec.ts`)
- [x] Lock implementation choices with user
- **Status:** complete

### Phase 2: Planning State Sync
- [x] Create sprint plan file `plans/2026-02-14-p1-closeout-sprint.md`
- [x] Refresh `task_plan.md`
- [x] Append kickoff findings and progress
- **Status:** complete

### Phase 3: Backend Data APIs
- [x] Add `clearData` repository contract and adapter implementations
- [x] Add IPC `repo:data:clear`
- [x] Add native backup file IPC (`file:backup:save-json`, `file:backup:open-json`)
- [x] Expose preload and renderer bridges for clear + file operations
- **Status:** complete

### Phase 4: Data Pages
- [x] Implement `BackupPage` and `StoragePage`
- [x] Replace data placeholder routes in `app-routes.tsx`
- [x] Add i18n copy for new data page interactions (zh-CN/zh-HK/en)
- **Status:** complete

### Phase 5: Tests & Evidence
- [x] Extend unit tests for repository/bridge changes
- [x] Add backup file bridge unit tests
- [x] Add `tests/e2e/backup-restore.spec.ts`
- [x] Run unit + e2e suites
- [x] Regenerate P1 case-map reconciliation and XLSX report
- **Status:** complete

### Phase 6: Docs & Closeout
- [x] Update root `README.md`
- [x] Update app `China/payroll-app/README.md`
- [x] Update governance mapping files (`module-test-map.md`, `p1-test-cases.json`)
- [x] Finalize `plans/findings.md` + `plans/progress.md`
- **Status:** complete

## Decisions Kept
| Decision | Rationale |
|----------|-----------|
| Keep current executable test layout (`src` for Vitest, `tests/e2e` for Playwright) | Matches live config; avoids disruptive runner refactor |
| Use native Electron dialogs for backup file I/O | Aligns with desktop UX requirement |
| Keep `db:reset` test-only | Preserve production safety boundary |
| Keep plans continuously updated | User-mandated workflow |

## Errors Encountered
| Error | Resolution |
|-------|------------|
| Sandbox denied `.git/index.lock` during branch switch | Re-ran with escalated permission |
| `dialog` option typing errors in Electron service | Added explicit `SaveDialogOptions` / `OpenDialogOptions` typing |
| E2E preview server `listen EPERM 127.0.0.1:4173` in sandbox | Re-ran Playwright commands with escalated permission |
| JSON reporter artifact polluted by npm prelogs | Generated Playwright JSON via direct `npx playwright ... --reporter=json` |

---

# Task Plan Update: P1 Full Module Closeout (Settings + Employee + Import/Export)

## Goal
Close P1 remaining module scope on top of completed SQLite/Data foundation by delivering settings pages, employee CRUD pages, import/export workflow, and refreshed governance evidence.

## Current Phase
Phase 7 (Completed)

## Added Phases

### Phase 7: Settings + Employee + Import/Export Delivery
- [x] Add settings pages (`/settings/org`, `/settings/social`, `/settings/company`)
- [x] Add employee pages (`/employee/list`, `/employee/import`, `/employee/export`)
- [x] Add stores (`settings-store`, `employee-store`) and Excel import/export utility
- [x] Replace route placeholders with real pages
- [x] Add i18n keys in `zh-CN` / `zh-HK` / `en`
- [x] Add unit/component tests for settings/employee/import-export
- [x] Add E2E `tests/e2e/p1-settings-employee-data.spec.ts`
- [x] Refresh governance map and case catalog to 25 cases
- [x] Regenerate raw JSON + reconciliation + XLSX evidence
- [x] Update root/app README

## Verification Snapshot (Phase 7)
- `npm run build`: PASS
- `npm run test`: PASS (64/64)
- `ALLOW_ELECTRON_GUI_IN_CODEX=1 npm run test:e2e -- tests/e2e/db-isolation.spec.ts tests/e2e/backup-restore.spec.ts tests/e2e/p1-settings-employee-data.spec.ts`: PASS (4/4)
- `p1-case-map-reconciliation.json`: `match=25`, `mismatch=0`, `noEvidence=0`

### Phase 8: Closeout Review Risk Fixes
- [x] Block direct apply when employee import conflicts are unresolved
- [x] Add explicit "jump to edit" action in employee detail panel
- [x] Update overview cards to show `ready` vs `pending` status by module state
- [x] Add/extend targeted component tests for the 3 fixes
- [x] Re-run build + full unit + key e2e regression verification
- **Status:** complete

## Verification Snapshot (Phase 8)
- `npm run test -- src/pages/employee/p1.employee-list.component.spec.tsx src/pages/employee/p1.import-export.component.spec.tsx src/pages/home/p1.overview-status.component.spec.tsx`: PASS (4/4)
- `npm run build`: PASS
- `npm run test`: PASS (67/67)
- `ALLOW_ELECTRON_GUI_IN_CODEX=1 npm run test:e2e -- tests/e2e/db-isolation.spec.ts tests/e2e/backup-restore.spec.ts tests/e2e/p1-settings-employee-data.spec.ts`: PASS (4/4)
- `node scripts/generate-p1-case-map.mjs`: PASS (`match=25`, `mismatch=0`, `noEvidence=0`)
- `node scripts/generate-p1-xlsx-report.mjs`: PASS (`p1-test-report-20260214_100814.xlsx`)

### Phase 9: Release Closure + P2 Kickoff
- [x] Freeze release version as `2.1.2-p1-sqlite-finish`
- [x] Update SOP status to reflect P1 complete and P2/P3 pending work
- [x] Update README (root/app) with done/fixed/pending lists
- [x] Update plans for next-window handoff
- [x] Execute release git flow: commit + tag + push + merge main + delete feature branch
- [ ] Start P2 implementation using `plans/2026-02-14-p2-payroll-kickoff.md`
- **Status:** in progress

## Next Execution Plan (P2)
- Plan file: `plans/P2阶段开发总纲.md`
- Goal: deliver payroll module foundation (`calculator`, payroll pages, payroll e2e) while keeping P1 gates green.

---

# Task Plan Update: P2 薪资核算模块（2026-02-18）

## Goal

交付薪资核算的核心计算引擎 + 全链路 CRUD + 两个交互页面，通过 P2 门槛验证。

## 总纲文件

`plans/P2阶段开发总纲.md` — 子阶段划分、依赖关系、执行规范、验证标准的完整定义。

## 执行约束

- **PRD 强制遵循：** 所有实现严格对照 `01-data-model.md` + `05-mod-payroll.md`
- **开发策略：** `China/Devolop files SOP/薪酬系统-开发策略文档.md`（v3.6）全程有效
- **代码质量：** 不设硬性行数上限；单一职责、简洁优雅、模块化、可维护、解读性强；>300 行必须拆分
- **金额精度：** `decimal.js` 强制，禁原生浮点

## Current Phase

P2.3（Codex prompt 已准备）

## Branch

`codex/p2-payroll`（基于 main `2e2b706`）

## P2 Phases

### P2.1: calculator.ts + calculator.test.ts
- [x] 实现 `src/services/calculator.ts` — 单人工资条计算纯函数
- [x] 实现 `tests/unit/services/calculator.test.ts` — 覆盖 SOP 4.7 全部场景
- [x] 验证：`npm run test -- tests/unit/services/calculator.test.ts`（13/13 PASS）
- [x] Claude Code 代码审查：公式逐条对齐 PRD，decimal.js 全覆盖，零缺陷通过
- **执行方：** Codex (GPT-5.3-codex xhigh)
- **审查方：** Claude Code (Opus 4.6)
- **Status:** ✅ complete (reviewed 2026-02-18)

### P2.2: aggregator.ts + aggregator.test.ts
- [x] 实现 `src/services/aggregator.ts` — 全员汇总纯函数
- [x] 实现 `tests/unit/services/aggregator.test.ts`
- [x] 验证：`npm run test -- tests/unit/services/aggregator.test.ts`（7/7 PASS）
- [x] Claude Code 代码审查：PRD §2.2 逐条对齐，rounding 双轨制正确区分，零缺陷通过
- **执行方：** Codex (GPT-5.3-codex xhigh)
- **审查方：** Claude Code (Opus 4.6)
- **Status:** ✅ complete (reviewed 2026-02-19)

### P2.3: Payroll repository contracts + SQLite CRUD
- [x] 扩展 `contracts.ts` payroll CRUD 接口
- [x] 新建 `sqlite-payroll.ts` SQLite 操作
- [x] 接入 `sqlite-adapter.ts`
- [x] 新建 unit test
- [x] 代码审查：发现2个CRITICAL问题
- [x] 修复CRIT-001（月份格式验证）
- [x] 修复CRIT-002（UNIQUE约束 + Upsert）
- [x] 新建migration 0003
- [x] 重新验证：全量测试113/113 PASS
- **前置：** P2.2 已审查合并 ✅
- **Status:** ✅ complete (reviewed & fixed 2026-02-21)

### P2.4: IPC + preload + renderer bridge
- [x] 读取P2.4定义（P2阶段开发总纲.md）
- [x] 审阅P1的repository-ipc.ts模式
- [x] 审阅现有preload.cts + electron-api.d.ts
- [x] 审阅p1-repository.ts的helper模式
- [x] 用Opus 4.6生成详细Prompt
- [x] 保存Prompt到plans/2026-02-21-p2.4-codex-prompt.md
- [ ] Codex执行P2.4开发
- [ ] 运行npm run build验证编译
- [ ] Claude Code CLI代码审查（Opus 4.6）
- [ ] 合并到main
- **前置：** P2.3 已合并 ✅
- **Status:** ✅ Prompt ready (2026-02-21), awaiting Codex execution

### P2.5: payroll-store.ts + unit test
- [ ] 实现 `src/stores/payroll-store.ts`
- [ ] 实现 `tests/unit/stores/payroll-store.test.ts`
- **前置：** P2.1 + P2.2 + P2.4 已审查合并
- **Status:** pending

### P2.6: MonthPicker + PayCard 组件
- [ ] 实现 `src/components/MonthPicker.tsx`
- [ ] 实现 `src/components/PayCard.tsx`
- **前置：** P2.5 已审查合并
- **Status:** pending

### P2.7: PayrollByEmpPage
- [ ] 实现 `src/pages/payroll/PayrollByEmpPage.tsx`
- [ ] 替换 `app-routes.tsx` payroll/employee 占位
- [ ] 补充 i18n keys
- **前置：** P2.5 + P2.6 已审查合并
- **Status:** pending

### P2.8: PayrollDetailPage（28 列明细表）
- [ ] 实现 `src/pages/payroll/PayrollDetailPage.tsx`
- [ ] 替换 `app-routes.tsx` payroll/detail 占位
- [ ] 补充 i18n keys
- **前置：** P2.5 已审查合并
- **Status:** pending

### P2.9: payroll-flow.spec.ts E2E + 组件测试
- [ ] 实现 `tests/e2e/payroll-flow.spec.ts`
- [ ] 更新 governance 文件
- **前置：** P2.7 + P2.8 已审查合并
- **Status:** pending

### P2.10: 全量回归 + 里程碑证据
- [ ] `npm run test` 全量通过
- [ ] `npm run test:e2e` 全量通过
- [ ] 三件套证据齐全
- [ ] 更新 plans + README + SOP
- [ ] Commit + Tag
- **前置：** P2.9 已审查合并
- **Status:** pending

## P2 完成门槛

```
✅ calculator.test.ts 全部通过
✅ payroll-flow.spec.ts 全部通过
✅ npm run test 全量通过（含 P1 回归）
✅ 里程碑三件套证据齐全（raw JSON + case map + XLSX）
```

## P2 架构决策（已锁定）

| 决策 | 选择 | 理由 |
|------|------|------|
| calculator 签名 | `(Employee, PayrollInput, SocialConfig) → PaySlip` | 纯函数，零副作用，最大可测试性 |
| aggregator 签名 | `(PaySlip[], filterCompany?) → AggregateResult` | 解耦 calculator，P3 凭证直接消费 |
| payroll 持久化 | JSON payload 存入已有 `payroll_inputs` / `payroll_results` 表 | 复用 P1 schema，无需新 migration |
| store 粒度 | 单一 `payroll-store`，按 month 管理 | 月度数据天然一体 |
| PDF/CSV 导出 | P2 不做 | 聚焦核心计算 + UI |

---

# Task Plan Update: Layout Fix Branch Stabilization (2026-02-15)

## Goal

在 `codex/bugfix/layout-fix` 分支完成布局与视觉迁移后的最终收尾，确保开发运行稳定（dev ABI）且概览无伪造业务数据，再进入 P2。

## Current Phase

Phase L3（收尾中）

## Phases

### Phase L1: Documentation Alignment
- [x] 更新 SOP（`00-INDEX.md`、`02-ui-layout.md`）
- [x] 更新 plans（`2026-02-15-layout-sop-sync.md`、`progress.md`）
- [x] 更新 README（root + app）
- **Status:** complete

### Phase L2: UI Layout & Visual Migration
- [x] 迁移主题 token 到 1.html 视觉语义
- [x] 更新 AppHeader / NavPanel / AppLayout / OverviewPage
- [x] 统一 card/button/input/select/badge 风格
- [x] 完成 build + 定向测试验证
- **Status:** complete

### Phase L3: Runtime + Data Display Stabilization
- [x] 定位 `npm run dev` ABI mismatch 根因
- [x] 在 `dev:electron` 前置 `abi:electron`
- [x] 将概览 KPI 默认值修正为 `0`（去除 demo 硬编码值）
- [ ] 提交 L3 修复
- [ ] 复验 build + 定向测试 + dev 启动
- **Status:** in progress

## Verification Checklist (L3)

- `npm run build`
- `npm run test -- src/pages/home/p1.overview-status.component.spec.tsx src/layouts/p0.layout-navigation.component.spec.tsx`
- `npm run dev`（手工 smoke，确认 Electron 正常启动）

## Next Execution Plan

1. 完成 L3 提交并推送。
2. 合并 `codex/bugfix/layout-fix`。
3. 启动 P2：`plans/2026-02-14-p2-payroll-kickoff.md`。
