# Payroll App (Electron + React)

本目录是薪酬系统桌面端应用代码（Electron 主进程 + React 渲染进程）。

## Release Status

- Current release target: `2.1.2-p1-sqlite-finish`
- Milestone: P1 (SQLite foundation + Data/Settings/Employee/Import-Export) closed

## Tech Stack

- Electron 40
- React 19 + TypeScript
- Vite 7
- Zustand
- i18next
- SQLite (`better-sqlite3`) + `electron-store`
- Vitest + Playwright

## Development

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

- Vitest：`src/**/*.{test,spec}.{ts,tsx}`
- Playwright：`tests/e2e/*.spec.ts`
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
- Import/Export 域工具：`src/lib/p1-employee-import-export.ts`
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
