# payroll-system

薪酬系统（Payroll System）开发仓库。

## 基线版本（main）

- Git tag: `2.1.2-p1-sqlite-finish`
- 分支基线: `main`

## 当前状态

- P1 SQLite 收口版本已合并到 `main`
- 发布 tag：`2.1.2-p1-sqlite-finish`

## 本次主线更新重点（P1 全模块收口）

- 已完成 P1 SQLite Foundation + Data 收口（仓储清空、备份文件 IPC、`/data/backup`、`/data/storage`）。
- 新增 Settings 模块落地页面：
  - `/settings/org`
  - `/settings/social`（并复用到 `/settings/fund`、`/settings/base`）
  - `/settings/company`
- 新增 Employee 与 Import/Export 页面：
  - `/employee/list`
  - `/employee/import`
  - `/employee/export`
- 新增前端域层能力：
  - `src/stores/settings-store.ts`
  - `src/stores/employee-store.ts`
  - `src/lib/p1-employee-import-export.ts`
- 新增测试覆盖：
  - settings/employee/import-export 的 unit + component
  - `tests/e2e/p1-settings-employee-data.spec.ts`
- 治理映射与 case map 已扩展到 25 条并完成对账。

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
- `npm run test`：通过（67/67）
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

## 本次收口修复（Closeout Review）

- 导入冲突未处理时，主按钮禁止直接导入。
- 员工详情增加“跳转编辑”操作。
- 概览页状态文案改为按模块真实交付状态显示（ready/pending）。
