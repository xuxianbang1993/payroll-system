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
- Plan file: `plans/2026-02-14-p2-payroll-kickoff.md`
- Goal: deliver payroll module foundation (`calculator`, payroll pages, payroll e2e) while keeping P1 gates green.

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
