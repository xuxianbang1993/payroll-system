# payroll-system

薪酬系统（Payroll System）开发仓库。

## 快速启动（开发）

在目录 `/Users/xuxianbang/Documents/payroll system/China/payroll-app`：

```bash
npm install
npm run dev
```

## 基线版本（main）

- Git tag: `P2.1.2-P2`
- 分支基线: `main`

## 当前状态

- P1 全部完成，已合并到 `main`
- P2 薪资核算模块全部完成（P2.1-P2.10）
- 发布 tag：`P2.1.2-P2`

## P2 薪资核算进展（P2.1 — P2.10）

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
- 单元测试 10/10 PASS（CRUD + FK 约束 + 月份隔离）
- 全量回归：113/113 PASS
- 代码审查：Opus 4.6 发现 2 个 CRITICAL 问题，已全部修复，SOP 合规 10/10 ✅

### P2.4: IPC + Preload + Renderer Bridge — payroll 数据通路打通
- 四层模式（contracts → ipc → preload → api.d.ts → p1-repository）完整实装
- 5 个 IPC channels：`repo:payroll:input:save/list`、`repo:payroll:result:save/list/delete`
- 4 个已有文件扩展（无新建文件）
- 代码审查：Opus 4.6，I-1/I-2 两处 Important 修复
- 验证：`npm run build` 零 TypeScript 错误；113/113 全量测试通过

### P2.5: payroll-store.ts — Zustand 状态层
- 2 个新建文件：`src/stores/payroll-store.ts` + `tests/unit/stores/payroll-store.test.ts`
- 8 个 actions：loadForMonth / setMonth / updateInput / generateSlip / generateAll / clearResults / clearMessages / reset
- 导出：`usePayrollStore` + `DEFAULT_AGGREGATE`（P2.6-P2.7 依赖）
- 代码审查：Opus 4.6，1 Critical + 3 Important 全部修复
  - CRIT：提取 `_computeAndSaveSlip()` 私有 helper，消除 `generateAll` flag 抖动
  - IMPORTANT：stale messages 清除 + clearMessages/reset 测试 + error-path 覆盖
- 全量回归：130/130 PASS（零回归）

### P2.6: MonthPicker.tsx + PayCard.tsx — UI 组件层
- `MonthPicker`：YYYY年MM月显示、prev/next 导航、max=当前月
- `PayCard`：Collapsible 员工卡片，折叠/展开，输入表单 + 生成按钮 + PaySlip 结果展示
- `ui/collapsible.tsx`：shadcn/ui Radix 包装
- 3 语言 i18n 全覆盖（zh-CN/zh-HK/en）

### P2.7: PayrollByEmpPage.tsx — 按员工录入页
- 路由 `/payroll/employee`，替换 ModulePlaceholderPage
- MonthPicker + 4 统计卡片 + 全部生成按钮 + PayCard 列表
- 集成 payroll-store 全部 actions

### P2.8: PayrollDetailPage.tsx — 28 列全员明细表
- 路由 `/payroll/detail`，TanStack Table 分组表格
- 6 列组：基本信息(2) + 收入(7) + 工资汇总(2) + 单位承担(9) + 个人扣除(7) + 最终(1)
- 按公司主体分组 + 小计行 + 全员合计行
- decimal.js 精确汇总（先累加后 round）
- Sticky 首列 + 横向滚动 + tabular-nums 对齐

### P2.9: E2E 测试 — payroll-flow.spec.ts
- 4 个 Playwright 测试用例覆盖：页面加载 + 明细表 + 月份导航 + 生成按钮状态

### P2.10: 全量回归 + Critical 修复
- 130/130 单元测试 PASS，0 TypeScript 错误，Vite 构建通过
- 浏览器自动化验证全部页面（P1 + P2）零回归
- 5 个 CRITICAL 问题修复：
  - C-1: PayrollDetailPage base 字段去除 subsidy 双重计算
  - C-2: PayCard handleNumericChange 空字段返回 undefined 而非 0
  - C-3: generateAll 追踪失败员工，不再静默显示成功
  - C-4: PayCard 结果区新增 otherAdj/wPension/wUnemploy/wMedical 明细行
  - C-5: MonthPicker/payroll-store 使用本地时间替换 UTC

### 全量回归
- `npm run test`：130/130 PASS（含 P1 全部回归）

## 下一步

- P3（未开始）：`voucher` 模块
- P4（未开始）：安装包与离线验收

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
