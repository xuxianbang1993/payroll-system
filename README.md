# payroll-system

薪酬系统（Payroll System）开发仓库。

## 当前版本

- Git tag: `v2.1.2`
- 分支基线: `codex/p1-sqlite-foundation`

## 本次更新重点（v2.1.2）

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

- P1 unit tests、repository tests、db-isolation E2E 已在当前周期完成验证并产出证据。
- 证据目录：`China/test/06-reports/`
- 治理映射：`China/test/00-governance/`

## 当前未完成门槛

- P1 最终完成门槛中的 `backup-restore.spec.ts` 仍待实现并通过（`db-isolation.spec.ts` 已通过）。
