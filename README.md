# payroll-system

薪酬系统（Payroll System）开发仓库。

## 快速启动（开发）

在目录 `/Users/xuxianbang/Documents/payroll system/China/payroll-app`：

```bash
npm install
npm run dev
```

## 基线版本（main）

- Git tag: `v2.1.2-p2-p2.3-complete`
- 分支基线: `main`

## 当前状态

- P1 全部完成，已合并到 `main`
- P2 薪资核算模块进行中（P2.1-P2.3 已完成）
- 发布 tag：`v2.1.2-p2-p2.3-complete`

## P2 薪资核算进展（P2.1 — P2.3）

### P2.1: calculator.ts — 单人工资条计算引擎
- 纯函数 `calculatePaySlip(employee, input, socialConfig) → PaySlip`
- 严格对照 PRD 05-mod-payroll.md §二 六步公式
- decimal.js 全覆盖，社保六险每项独立 round(2) 后求和
- 单元测试 13/13 PASS（覆盖全部 SOP 4.7 场景）
- 代码审查：Opus 4.6 逐条核验，零缺陷通过

### P2.2: aggregator.ts — 全员汇总纯函数
- 纯函数 `aggregatePaySlips(slips, filterCompany?) → { sale, manage, total }`
- 汇总 8 字段：fullGrossPay/cSocial/cFund/wSocial/wFund/tax/netPay/absentDeduct
- 精度规则：先逐人累加原始值（Decimal.plus），最后统一 round(2)（与 calculator 的逐项 round 策略正确区分）
- 按 type 分类（sales/management）+ 按公司主体筛选
- 单元测试 7/7 PASS（含精度验证 3×0.105=0.315→0.32）
- 代码审查：Opus 4.6 + pr-review-toolkit agent 双重校验，零缺陷通过

### P2.3: sqlite-payroll.ts — Payroll 仓储层 CRUD + 持久化
- **CRIT-001 修复**：添加月份格式验证（YYYY-MM），所有 5 个 public 函数都有保护
- **CRIT-002 修复**：创建 migration 0003，添加 UNIQUE INDEX on (employee_id, payroll_month)，改 SELECT+INSERT/UPDATE 为标准 upsert 模式
- `savePayrollInput(employeeId, month, payload) → PayrollPayloadRecord`
- `listPayrollInputs(month) → PayrollPayloadRecord[]`
- `savePayrollResult(employeeId, month, payload) → PayrollPayloadRecord`
- `listPayrollResults(month) → PayrollPayloadRecord[]`
- `deletePayrollByMonth(month) → { deletedInputs, deletedResults }`
- 单元测试 10/10 PASS（CRUD + FK 约束 + 月份隔离）
- 全量回归：113/113 PASS（P1 83 + P2.1 13 + P2.2 7 + P2.3 10）
- 代码审查：Opus 4.6 发现 2 个 CRITICAL 问题，已全部修复
- **SOP 合规评分**：修复前 7/10 → 修复后 10/10 ✅

### 全量回归
- `npm run test`：113/113 PASS（含 P1 全部回归）

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
- `npm run test`：通过（103/103）
- `ALLOW_ELECTRON_GUI_IN_CODEX=1 npm run test:e2e -- tests/e2e/db-isolation.spec.ts tests/e2e/backup-restore.spec.ts tests/e2e/p1-settings-employee-data.spec.ts`：通过（4/4）
- 证据目录：`China/test/06-reports/`
- 治理映射：`China/test/00-governance/`

## P1 门槛状态

- `backup-restore.spec.ts`：已实现并通过。
- `db-isolation.spec.ts`：已通过并保持。
- `p1-settings-employee-data.spec.ts`：已实现并通过。
- case map 对账：`match=25, mismatch=0, noEvidence=0`。

## 下一步

- P2.3-P2.10（进行中）：Payroll repository CRUD → IPC → store → UI 组件 → 页面 → E2E → 里程碑关门。
- P3（未开始）：`voucher` 模块（`voucherGenerator.ts`、`VoucherPage`、`voucher-flow.spec.ts`）。
- P4（未开始）：安装包与离线验收（`B-01`~`B-04`）。

推荐下一开发分支：`codex/P2-payroll-P2.3`（以 `main` 最新提交为基线）。
