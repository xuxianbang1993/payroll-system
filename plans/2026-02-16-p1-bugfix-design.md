# P1 Bugfix Design — Code Review 问题全量修复

## Goal

修复 P1 code review 发现的全部问题（3 CRITICAL + 3 IMPORTANT + 4 SUGGESTION），确保进入 P2 前代码质量符合开发策略文档红线要求。

## Branch

`bugfix/P1-current-issue`

## Locked Decisions

| 决策 | 选择 | 理由 |
|------|------|------|
| 修复范围 | 全部（CRITICAL + IMPORTANT + SUGGESTION） | 彻底加固 P1 基线 |
| i18n 策略 | Store 返回 key，组件层解析 | Store 保持纯净，不耦合 i18n 模块 |
| replaceEmployees | 改为增量 CRUD | 避免 P2 payroll 数据被误删 |

---

## Part 1: 文件拆分（8 个超 200 行文件）

| 原文件 | 行数 | 拆分目标 |
|--------|------|----------|
| `EmployeeListPage.tsx` | 609 | → `EmployeeForm.tsx` + `EmployeeDetail.tsx` + `EmployeeInlineRow.tsx` |
| `ImportExportPage.tsx` | 340 | → `ImportPreview.tsx` + `ExportPanel.tsx` |
| `p1-employee-import-export.ts` | 354 | → `employee-import-parse.ts` + `employee-import-merge.ts` |
| `settings-store.ts` | 280 | → `settings-utils.ts` |
| `employee-store.ts` | 246 | → `employee-utils.ts` |
| `BackupPage.tsx` | 265 | → `BackupActions.tsx` + `RestoreActions.tsx` |
| `electron/main.ts` | 251 | → `ipc/store-ipc.ts` + `ipc/db-ipc.ts` + `ipc/repository-ipc.ts` + `ipc/file-ipc.ts` |
| `sqlite-backup.ts` | 247 | → `sqlite-import.ts` |

约束：拆分后每个文件 ≤ 200 行，保持现有功能和测试不受影响。

## Part 2: i18n 修复

### Store 层
- 所有错误/通知消息改为返回 i18n key（如 `"error.orgNameEmpty"`）
- Store 不 import i18next，保持纯函数/纯状态

### 组件层
- 消费 store 状态时用 `t(store.errorMessage)` 解析显示
- OverviewPage KPI labels 改用 `t('overview.kpi.people')` 等

### 员工类型
- 内部值从中文（`"管理"` / `"销售"`）改为英文 enum key（`"management"` / `"sales"`）
- UI 显示通过 i18n 映射

### i18n 字典
- 三语言文件（zh-CN / zh-HK / en）补充全部新 key

## Part 3: replaceEmployees → 增量 CRUD

### 新增方法
- `addEmployee(employee: EmployeeRecord): EmployeeRecord`
- `updateEmployee(id: number, employee: Partial<EmployeeRecord>): EmployeeRecord`
- `deleteEmployee(id: number): void`

### 改动范围
- `electron/db/repository/contracts.ts` — 接口扩展
- `electron/db/repository/sqlite-employees.ts` — SQLite 实现
- `electron/db/repository/legacy-adapter.ts` — Legacy 适配
- `electron/db/repository/switching-repository.ts` — 路由新方法
- `electron/main.ts`（或拆分后的 `ipc/repository-ipc.ts`）— IPC handler
- `electron/preload.cts` — preload 暴露
- `src/types/electron-api.d.ts` — 类型声明
- `src/lib/p1-repository.ts` — renderer bridge
- `src/stores/employee-store.ts` — store 改用增量方法

### 向后兼容
- `replaceEmployees` 保留但标记 `@deprecated`，仅 import 批量场景使用
- 新方法不影响 payroll_inputs / payroll_results 数据

## Part 4: 补充组件测试

| 新测试文件 | 覆盖内容 |
|-----------|----------|
| `p1.social-config.component.spec.tsx` | 修改后示例实时更新 |
| `p1.company.component.spec.tsx` | 公司主体 CRUD |
| `p1.employee-form.component.spec.tsx` | 必填校验、提交数据、默认值 |

## Part 5: E2E helper 提取 + 工具函数去重

### E2E
- 新建 `tests/e2e/helpers.ts`
- 提取共享函数：`launchElectronForTest`、`getFirstWindowOrThrow`
- 3 个 spec 文件改为 import 共享 helper

### 工具函数
- `src/utils/format.ts` — formatAmount / formatBytes / formatCurrency
- `src/utils/error.ts` — toErrorMessage
- `src/utils/type-guards.ts` — asRecord / asObject

## Part 6: IPC 边界验证 + decimal.js

- IPC handler 添加入参 schema 验证（轻量 zod 或手写 guard）
- `SocialConfigPage` 示例计算改用 decimal.js

---

## Model Tier Execution Plan

| 任务 | 建议模型 | 理由 |
|------|----------|------|
| i18n key 补充三语言文件 | Haiku 4.5 | 单文件、无业务逻辑 |
| 工具函数提取 | Haiku 4.5 | 搬移代码 |
| E2E helper 提取 | Haiku 4.5 | 搬移代码 |
| 组件提取（EmployeeForm 等） | Sonnet 4.5 Thinking | 单模块重构 |
| Store 拆分 + i18n key 改造 | Sonnet 4.5 Thinking | 单模块逻辑改造 |
| 页面拆分（ImportExport/Backup） | Sonnet 4.5 Thinking | 单模块重构 |
| 组件测试编写 | Sonnet 4.5 Thinking | 单模块测试 |
| replaceEmployees → 增量 CRUD | Opus 4.6 | 跨层联动 |
| electron/main.ts IPC 拆分 + 验证 | Opus 4.6 | 跨模块架构 |
| 回归验证 + 证据刷新 | Sonnet 4.5 Thinking | 测试执行 |

## Verification Targets

- `npm run build`
- `npm run test`（所有现有 67 测试 + 新增组件测试）
- `npm run test:e2e`（4/4 保持通过）
- 所有文件 ≤ 200 行
- 零硬编码中文
- case map 对账无 mismatch

## Exit Criteria

- 全部 CRITICAL / IMPORTANT / SUGGESTION 问题已修复
- 现有功能无回归
- 提交合并到 main
