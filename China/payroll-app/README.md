# Payroll App (Electron + React)

本目录是薪酬系统桌面端应用代码（Electron 主进程 + React 渲染进程）。

## Release Status

- Current release: `P2.1.2-P2`
- Milestone: P2 (Payroll Module) **COMPLETE** — all 10 sub-phases delivered, 5 Critical fixes applied, 130/130 PASS
- Previous: P2.5 (Payroll Store) complete — Zustand state layer wired

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

## Current Status Snapshot (2026-03-07)

- Branch: `main`
- Tag: `P2.1.2-P2`
- Tests: 130 unit, all passing (P1 83 + P2.1 13 + P2.2 7 + P2.3 10 + P2.5 17)
- Build: tsc + vite + tsc-electron all passing
- P2 payroll module COMPLETE

## P2 Progress (Complete)

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

### P2.5 ✅ payroll-store.ts — Zustand 状态层
- 2个新建文件：`src/stores/payroll-store.ts`（258行）+ `tests/unit/stores/payroll-store.test.ts`（531行）
- 8个 actions：loadForMonth / setMonth / updateInput / generateSlip / generateAll / clearResults / clearMessages / reset
- 导出：`usePayrollStore` + `DEFAULT_AGGREGATE`（P2.6-P2.7 依赖）
- CRIT-001 修复：提取 `_computeAndSaveSlip()` 私有 helper，消除 `generateAll` flag 抖动
- IMPORTANT 修复×3：stale messages 清除 + clearMessages/reset 测试 + error-path 测试覆盖
- 130/130 全量回归通过

### P2.6 ✅ MonthPicker.tsx + PayCard.tsx — UI 组件层
- `MonthPicker`：YYYY年MM月显示、prev/next 导航、max=当前月
- `PayCard`：Collapsible 员工卡片，折叠/展开，输入表单 + 生成按钮 + PaySlip 结果展示
- `ui/collapsible.tsx`：shadcn/ui Radix 包装
- 3 语言 i18n 全覆盖

### P2.7 ✅ PayrollByEmpPage.tsx — 按员工录入页
- 路由 `/payroll/employee`，替换 ModulePlaceholderPage
- MonthPicker + 4 统计卡片 + 全部生成按钮 + PayCard 列表
- 集成 payroll-store 全部 actions

### P2.8 ✅ PayrollDetailPage.tsx — 28 列全员明细表
- 路由 `/payroll/detail`，TanStack Table 分组表格
- 6 列组：基本信息(2) + 收入(7) + 工资汇总(2) + 单位承担(9) + 个人扣除(7) + 最终(1)
- decimal.js 精确汇总 + Sticky 首列 + 横向滚动

### P2.9 ✅ E2E 测试 — payroll-flow.spec.ts
- 4 个 Playwright 测试用例

### P2.10 ✅ 全量回归 + Critical 修复
- 130/130 PASS，零回归
- 5 个 CRITICAL 修复：base 双重计算、空字段清除、generateAll 静默失败、PayCard 结果明细缺失、UTC 时间 bug

## Next Steps

1. P3: Voucher module
2. P4: Packaging & acceptance
