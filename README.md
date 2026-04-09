# payroll-system

薪酬系统（Payroll System）开发仓库。

## 快速启动（开发）

在目录 `/Users/xuxianbang/Documents/payroll system/China/payroll-app`：

```bash
npm install
npm run dev
```

## 基线版本（main）

- Git tag: `v2.1.2-p3-voucher`
- 分支基线: `main`

## 当前状态

- P0 基础框架 ✅
- P1 设置 + 员工 + 数据管理 ✅
- P2 薪资核算模块 ✅（P2.1-P2.10）
- **P3 会计凭证模块 ✅（P3.1-P3.5）**
- P4 打包 + 全量验收（待启动）
- 测试：155/155 PASS + 4 E2E 场景
- 发布 tag：`v2.1.2-p3-voucher`

## P3 会计凭证模块（已完成 2026-04-09）

### P3.1: voucherGenerator.ts — 5 张凭证纯函数生成器
- 纯函数 `generateVouchers(aggregate, month) → VoucherSet`
- 5 张凭证各自独立生成函数（积木式策略模式）
- decimal.js 全覆盖，零原生浮点运算
- 余额校验：应付职工薪酬-人员工资 = 0（PRD §8 数学证明）
- 单元测试 13/13 PASS
- CTO 审查：零缺陷通过

### P3.2: VoucherCard.tsx — 凭证展示卡片
- shadcn/ui Table + Badge，借贷方向分列显示
- formatAmount 千分位格式化，font-mono 等宽对齐
- 平衡状态 Badge（绿色 ✅ / 红色 ⚠️）

### P3.3: VoucherPage.tsx — 凭证总览页面
- 路由 `/voucher`，替换 ModulePlaceholderPage
- 公司主体筛选（复用 aggregatePaySlips filterCompany）
- 余额校验三格卡片（贷方合计 / 借方合计 / 余额）
- useMemo 性能优化，i18n 三语覆盖

### P3.4: voucher-csv.ts — CSV 导出
- 纯函数 `voucherSetToCsv(voucherSet) → string`
- UTF-8 BOM + RFC 4180 转义 + 每张凭证小计行
- VoucherPage 导出按钮（disabled when empty）

### P3.5: voucher-flow.spec.ts — E2E 测试
- 4 个 Playwright 场景：页面加载 / 空状态 / 凭证展示 / 公司筛选交互

### 验收标准
- ✅ A-04: 5 张凭证全部借贷平衡
- ✅ A-05: 按公司筛选正确
- ✅ A-11: 应付职工薪酬-人员工资余额 = 0

## P2 薪资核算进展（P2.1 — P2.10，已完成）

### P2.1: calculator.ts — 单人工资条计算引擎
- 纯函数 `calculatePaySlip(employee, input, socialConfig) → PaySlip`
- 严格对照 PRD 05-mod-payroll.md §二 六步公式
- decimal.js 全覆盖，社保六险每项独立 round(2) 后求和
- 单元测试 13/13 PASS（覆盖全部 SOP 4.7 场景）

### P2.2: aggregator.ts — 全员汇总纯函数
- 纯函数 `aggregatePaySlips(slips, filterCompany?) → { sale, manage, total }`
- 精度双轨制：累加原始值后统一 round(2)

### P2.3: sqlite-payroll.ts — Payroll 仓储层 CRUD
- CRIT-001 修复：月份格式验证
- CRIT-002 修复：UNIQUE INDEX + upsert

### P2.4: IPC + Preload + Renderer Bridge
- 5 个 IPC channels，4 个文件扩展

### P2.5: payroll-store.ts — Zustand 状态层
- 8 个 actions，1 Critical + 3 Important 修复

### P2.6-P2.10: UI + Pages + E2E + Regression
- MonthPicker + PayCard + PayrollByEmpPage + PayrollDetailPage
- payroll-flow.spec.ts E2E + 5 Critical 修复
- 130/130 全量测试通过

## 下一步

- **P4（待启动）**：electron-builder 打包（.dmg/.exe）+ 全量验收
  - i18n 完善（~200 keys）
  - `10-acceptance.md` A-01~A-12, B-01~B-09 逐项验收
- 待补：Payroll CSV 导出、PDF 工资条批量导出
