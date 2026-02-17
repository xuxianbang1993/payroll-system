# payroll-system

薪酬系统（Payroll System）开发仓库。

## 快速启动（开发）

在目录 `/Users/xuxianbang/Documents/payroll system/China/payroll-app`：

```bash
npm install
npm run dev
```

## 基线版本（main）

- Git tag: `v2.1.2-p1-current-bug-fixed`
- 分支基线: `main`

## 当前状态

- P1 bugfix 全部完成，已合并到 `main`
- 发布 tag：`v2.1.2-p1-current-bug-fixed`

## 本次主线更新重点（P1 Bugfix）

Code review 发现问题全部修复（Batch A-G）：

- 提取共享工具函数（format/error/type-guards）+ E2E test helpers
- settings/employee store 全面 i18n 化 + utils 提取
- EmployeeType 枚举化（`"management" | "sales"`）
- EmployeeListPage/ImportExportPage/BackupPage 拆分至小模块
- 增量 CRUD（addEmployee/updateEmployee/deleteEmployee），废弃 replaceEmployees
- electron/main.ts IPC 拆分为 4 模块，依赖注入模式
- 新增 13 个组件测试 + decimal.js 精确计算
- 全量回归验证通过（83 unit + 4 E2E + build + 文件/i18n 审计）
- 统计：131 files changed, +5348 insertions, -2357 deletions

## 既有重点（v2.1.2）

- 完成 P1 SQLite Foundation（配置、迁移、隔离重置、DB Admin IPC）。
- 完成 Repository 抽象与真切换：`READ_SOURCE` / `WRITE_MODE` 在 `legacy/sqlite/dual` 生效。
- 新增 `0002_employee_id_integer.sql`，将 employee id 迁移为 `INTEGER` 并保持关联完整。
- 打通 settings、employee、backup/storage 的 repository 路径（main/preload/renderer 类型与桥接）。
- 增加 better-sqlite3 ABI 自动切换（`npm run test` 切 Node ABI，`npm run test:e2e` 切 Electron ABI）。
- 修复 Electron 运行稳定性问题：
  - preload 改为 CommonJS（`preload.cts -> preload.cjs`）。
  - Vite `base` 改为 `./` 以支持 `file://` 资源加载。
  - 在 Codex macOS 环境增加 Electron GUI 启动前置守卫，避免 AppKit `SIGABRT` 崩溃。

## 测试与证据

- `npm run build`：通过
- `npm run test`：通过（83/83）
- `ALLOW_ELECTRON_GUI_IN_CODEX=1 npm run test:e2e -- tests/e2e/db-isolation.spec.ts tests/e2e/backup-restore.spec.ts tests/e2e/p1-settings-employee-data.spec.ts`：通过（4/4）
- 证据目录：`China/test/06-reports/`
- 治理映射：`China/test/00-governance/`

## P1 门槛状态（当前分支）

- `backup-restore.spec.ts`：已实现并通过。
- `db-isolation.spec.ts`：已通过并保持。
- `p1-settings-employee-data.spec.ts`：已实现并通过。
- case map 对账：`match=25, mismatch=0, noEvidence=0`。

## 下一步

- P2（未完成）：`payroll` 模块（`calculator.ts`、`PayrollByEmpPage`、`PayrollDetailPage`、`payroll-flow.spec.ts`）。
- P3（未完成）：`voucher` 模块（`voucherGenerator.ts`、`VoucherPage`、`voucher-flow.spec.ts`）。
- P4（未完成）：安装包与离线验收（`B-01`~`B-04`）。

推荐下一开发分支：`codex/p2-payroll-foundation`（以 `main` 最新提交为基线）。
