# Payroll App (Electron + React)

本目录是薪酬系统桌面端应用代码（Electron 主进程 + React 渲染进程）。

## Release Status

- Current release: `v2.1.2-p2-p2.4`
- Milestone: P2.4 (IPC + Preload + Renderer Bridge) complete — payroll 5-channel IPC bridge wired, Opus 4.6 review 0 Critical / 2 Important fixed
- Previous: P2.3 (Payroll Repository) complete — CRIT-001/CRIT-002 fixes applied, SOP compliance 10/10

## Tech Stack

- Electron 40
- React 19 + TypeScript
- Vite 7
- Zustand
- i18next
- SQLite (`better-sqlite3`) + `electron-store`
- Vitest + Playwright

## Development

工作目录：

```bash
cd /Users/xuxianbang/Documents/payroll system/China/payroll-app
```

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Test Commands

```bash
npm run test
npm run test:e2e
npm run test:all
```

说明：

- `npm run test` 会先执行 `abi:node`，再跑 Vitest。
- `npm run test:e2e` 会先执行 `abi:electron`，再跑 Playwright。
- 若在 Codex/macOS 环境执行 GUI Electron 测试，需设置：
  - `ALLOW_ELECTRON_GUI_IN_CODEX=1`

## Test File Layout (Locked)

- Vitest unit/component：`tests/unit/**/*.{test,spec}.{ts,tsx}`
- Playwright E2E：`tests/e2e/*.spec.ts`
- E2E fixtures：`tests/fixtures/*`

## P1 Full Closeout (Current Branch)

已交付：

- Settings 页面：
  - `/settings/org`
  - `/settings/social`（并复用到 `/settings/fund`、`/settings/base`）
  - `/settings/company`
- Employee 页面：
  - `/employee/list`（新增、行内编辑、删除、详情）
  - `/employee/import`
  - `/employee/export`
- Import/Export 域工具：`src/lib/employee-import-parse.ts` + `src/lib/employee-import-merge.ts`
- 新增 Zustand store：
  - `src/stores/settings-store.ts`
  - `src/stores/employee-store.ts`
- `repo:data:clear`（生产可用数据清空，保留 schema）
- `file:backup:save-json` / `file:backup:open-json`
- `/data/backup` 与 `/data/storage` 页面落地
- `tests/e2e/backup-restore.spec.ts`
- `tests/e2e/p1-settings-employee-data.spec.ts`
- repository/bridge 新增 clear + backup-file 单元测试
- settings/employee/import-export 新增 unit + component 测试

保留安全策略：

- `db:reset` 仍仅允许 `APP_ENV=test`

本次收口修复：

- 导入冲突未处理前禁止主入口直接导入
- 员工详情支持直接跳转行内编辑
- 概览页按模块显示 ready/pending 真实状态

## P1 Bugfix (2.1.2-p1-current-bug-fixed)

Code review 发现问题全部修复：

- **Batch A:** 提取共享工具函数（format/error/type-guards）+ E2E test helpers
- **Batch B:** settings/employee store i18n 化 + utils 提取 + EmployeeType 枚举化
- **Batch C:** EmployeeListPage/ImportExportPage/BackupPage 拆分至 ≤200 行
- **Batch D:** 增量 CRUD（addEmployee/updateEmployee/deleteEmployee），废弃 replaceEmployees
- **Batch E:** electron/main.ts IPC 拆分为 4 模块，依赖注入
- **Batch F:** 新增 13 个组件测试 + SocialConfigPage decimal.js 精确计算
- **Batch G:** 全量回归验证通过（83 unit + 4 E2E + build + 文件/i18n 审计）

统计：131 files changed, +5348 insertions, -2357 deletions

## Remaining Work

- P2 `payroll`:
  - `calculator.ts` + `calculator.test.ts`
  - `/payroll/employee`, `/payroll/detail`
  - `payroll-flow.spec.ts`
- P3 `voucher`:
  - `voucherGenerator.ts` + `voucherGenerator.test.ts`
  - `/voucher`
  - `voucher-flow.spec.ts`
- P4 packaging:
  - `B-01`~`B-04` acceptance items

## Evidence Artifacts

治理和报告目录：

- `../test/00-governance/`
- `../test/06-reports/raw/`
- `../test/06-reports/`

生成命令：

```bash
node scripts/generate-p1-case-map.mjs
node scripts/generate-p1-xlsx-report.mjs
```

## Layout & Visual Baseline (2026-02-15)

- 信息架构基线：`/Users/xuxianbang/Documents/payroll system/plans/参考图/1.2.html`
- 视觉 token 基线：`/Users/xuxianbang/Documents/payroll system/plans/参考图/1.html`
- 主交互色：橙色（`#ef8b4a` 语义映射）
- 统一目标：卡片、按钮、输入、下拉、badge 的边框/阴影/圆角一致化
- 技术架构不变：React + TypeScript + Vite + Tailwind/shadcn
- 约束：只做布局与样式统一，不改业务逻辑、route 和 IPC

## Current Status Snapshot (2026-02-22)

- Branch: `main` (merged from `codex/P2-P2.4`)
- Tag: `v2.1.2-p2-p2.4`
- Tests: 113 unit, all passing (P1 83 + P2.1 13 + P2.2 7 + P2.3 10)
- Build: tsc + vite + tsc-electron all passing
- P2.4 IPC bridge complete, ready for P2.5

## P2 Progress (Current)

### P2.1 ✅ calculator.ts — 单人工资条计算引擎
- 纯函数 `calculatePaySlip(employee, input, socialConfig) → PaySlip`
- decimal.js 全覆盖；社保六险逐项 round(2) 后求和
- 13/13 PASS；Opus 4.6 零缺陷通过

### P2.2 ✅ aggregator.ts — 全员汇总纯函数
- 纯函数 `aggregatePaySlips(slips, filterCompany?) → { sale, manage, total }`
- 精度双轨制：累加原始值后统一 round(2)（区别于 calculator 逐项 round）
- 7/7 PASS；Opus 4.6 零缺陷通过

### P2.3 ✅ sqlite-payroll.ts — Payroll 仓储层 CRUD
- CRIT-001 修复：月份格式 YYYY-MM 验证（`assertValidPayrollMonth`）
- CRIT-002 修复：UNIQUE INDEX on (employee_id, payroll_month) + upsert
- 10/10 PASS；SOP 合规 10/10

### P2.4 ✅ IPC + Preload + Renderer Bridge
- 5个channels: repo:payroll:input:save/list, repo:payroll:result:save/list/delete
- 4个文件扩展（无新建）：repository-ipc.ts / preload.cts / electron-api.d.ts / p1-repository.ts
- I-1 修复：Array payload 防护（`Array.isArray` guard）
- I-2 修复：delete handler 显式返回类型注解
- `npm run build` 零错误；113/113 全量回归通过

## Next Steps

1. P2.5: `payroll-store.ts` + `tests/unit/stores/payroll-store.test.ts`
2. P2.6: `MonthPicker.tsx` + `PayCard.tsx`
3. P2.7-P2.10: 页面 → E2E → 关门
