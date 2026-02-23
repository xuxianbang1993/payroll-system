# P2.6 Codex Prompt: MonthPicker.tsx + PayCard.tsx

**Generated:** 2026-02-23
**Model:** GPT-5.3-codex xhigh
**Status:** Ready to send to Codex
**Previous prompt:** P2.5 (payroll-store.ts, archived, complete)

---

## ⛔ 严格执行范围（必读，不可违反）

你只能完成以下 **P2.6** 的工作。**不可提前实现 P2.7、P2.8 或任何其他阶段的内容。**

### 允许新建的文件（仅限以下 3 个）

1. `src/components/ui/collapsible.tsx` — shadcn/ui Collapsible 封装
2. `src/components/MonthPicker.tsx` — 年月选择器
3. `src/components/PayCard.tsx` — 员工薪资卡片

### 禁止修改任何已有文件

- ❌ 不得修改 `src/stores/payroll-store.ts`
- ❌ 不得修改 `src/stores/app-store.ts`
- ❌ 不得修改 `src/types/payroll.ts`
- ❌ 不得修改任何路由文件、页面文件
- ❌ 不得修改 `src/components/ui/` 下的任何已有文件

---

## Pre-flight Checks（开始写代码前必须验证）

在写任何代码之前，逐一确认以下条件：

1. `src/stores/payroll-store.ts` 导出 `usePayrollStore`（含 `setMonth` action）和 `DEFAULT_AGGREGATE`
2. `src/stores/app-store.ts` 导出 `useAppStore`，包含：
   - `selectedMonth: string`
   - `setSelectedMonth: (month: string) => void`
3. `src/types/payroll.ts` 导出 `Employee`, `PayrollInput`, `PaySlip`, `EmployeeType`
4. `src/utils/format.ts` 导出 `formatAmount(value: number): string`
5. `node_modules/@radix-ui/react-collapsible` 或 `node_modules/radix-ui` 中存在 Collapsible 相关导出
6. `src/components/ui/` 下已有：`card.tsx`, `button.tsx`, `select.tsx`, `input.tsx`, `label.tsx`, `badge.tsx`

如果任何一项不满足，停止并报告，不要继续。

---

## 联网查证要求（SOP §1.2 强制）

在实现前必须联网查证以下内容：

| 需查证内容 | 目标文档 |
|-----------|---------|
| `@radix-ui/react-collapsible` 实际导出的组件名和 import 路径 | npm / GitHub |
| shadcn/ui collapsible 组件的标准实现方式 | ui.shadcn.com |

如果联网失败，停止并告知用户，**不可凭记忆编写**。

---

## File 1: `src/components/ui/collapsible.tsx`

参照 shadcn/ui 的组件封装模式（同 `card.tsx`、`button.tsx`），将 Radix UI Collapsible 封装为项目可用的 UI 组件。

要求：
- 从实际安装的 radix-ui 包导入（联网确认正确 import 路径）
- 导出：`Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`
- 遵循 shadcn/ui 标准模式，不做多余封装

---

## File 2: `src/components/MonthPicker.tsx`

### 功能定义

年月选择器（YYYY-MM 格式）。受控组件。

### Props 接口

```typescript
interface MonthPickerProps {
  value: string;           // "YYYY-MM" 格式
  onChange: (month: string) => void;
  disabled?: boolean;
}
```

### UI 设计

- 显示当前年月（YYYY年MM月 格式展示）
- 向前/向后切换月份的按钮（`<` `>`），使用 `lucide-react` 的 `ChevronLeft` / `ChevronRight`
- 点击 `<` 减一个月，点击 `>` 加一个月
- 禁止选择未来月份（不允许 onChange 触发未来日期）
- disabled 时按钮不可点击

### 月份计算规则

```typescript
// 当前月 = new Date().toISOString().slice(0, 7)
// 前一月 = year-01 的边界处理好（从 YYYY-01 退到 (YYYY-1)-12）
// 后一月 = 不超过当前月（今日所在月份）
```

### 样式

- 使用 shadcn/ui 设计系统 token（`text-foreground`, `text-muted-foreground` 等）
- 紧凑布局，适合放在页面顶部
- 所有文本走 i18n（`t('payroll.monthPicker.label')` 等），不硬编码中文

### i18n Key 规范

| 用途 | Key |
|------|-----|
| 年份显示 | `payroll.monthPicker.year` |
| 月份显示 | `payroll.monthPicker.month` |
| 上一月 aria-label | `payroll.monthPicker.prevMonth` |
| 下一月 aria-label | `payroll.monthPicker.nextMonth` |

> **注意：** 不需要在 locale 文件中添加这些 key，这超出 P2.6 范围。

---

## File 3: `src/components/PayCard.tsx`

### 功能定义

员工薪资卡片，对应 PRD §1.3（05-mod-payroll.md）。使用 Collapsible 实现展开/收起交互。

### Props 接口

```typescript
interface PayCardProps {
  employee: Employee;
  input?: PayrollInput;      // 当月已保存的输入，undefined 表示尚未输入
  slip?: PaySlip;            // 当月已生成的工资条，undefined 表示尚未生成
  onUpdateInput: (employeeId: number, input: PayrollInput) => Promise<boolean>;
  onGenerateSlip: (employeeId: number) => Promise<boolean>;
  generating?: boolean;      // 全局 generating 标志，禁用操作中的按钮
}
```

### 收起状态（collapsed）— PRD §1.3

显示内容：
- 姓名（`employee.name`）
- 职位（`employee.position`）
- 公司（`employee.company`）
- 基本工资（`formatAmount(employee.baseSalary)`）
- 状态 Badge：
  - `slip` 为 undefined → Badge variant `secondary`，文字 key: `payroll.card.statusNotGenerated`
  - `slip` 存在 → Badge variant `default`，文字 key: `payroll.card.statusGenerated`，同行显示 `formatAmount(slip.netPay)`

右侧：展开/收起箭头图标（ChevronDown / ChevronUp，用 Collapsible state 控制旋转）

### 展开状态（expanded）— PRD §1.3

#### 输入区（7 个字段）

使用受控表单（本地 `useState` 管理输入，不用 react-hook-form，保持简单）：

| 字段 | 类型 | 对应 PayrollInput 字段 |
|------|------|----------------------|
| 绩效等级 | Select 下拉 | `perfGrade` |
| 绩效工资 | number Input | `perfSalary` |
| 提成 | number Input | `commission` |
| 奖金 | number Input | `bonus` |
| 缺勤小时数 | number Input | `absentHours` |
| 所得税 | number Input | `tax` |
| 其他调整（可正可负） | number Input | `otherAdj` |

**绩效等级下拉选项：** `""（未选）`, `"S"`, `"A"`, `"B"`, `"C"`, `"D"`

**输入初始值：** 从 `input` prop 初始化，`input` prop 变化时同步更新（`useEffect`）

**「保存输入」按钮：** 点击时调用 `onUpdateInput(employee.id, localInput)`，按钮 key: `payroll.card.saveInput`，generating 时 disabled

#### 「生成工资条」按钮

- 点击调用 `onGenerateSlip(employee.id)`
- 按钮 i18n key: `payroll.card.generateSlip`
- generating 时 disabled + 显示 loading 状态

#### 计算结果展示（`slip` 存在时渲染）

分三个分组展示，每行"标签 + 金额"格式：

**收入明细：**
- 固定收入 → `formatAmount(slip.base)` （key: `payroll.card.result.base`）
- 绩效工资 → `formatAmount(slip.perfSalary)` （key: `payroll.card.result.perfSalary`）
- 提成 → `formatAmount(slip.commission)` （key: `payroll.card.result.commission`）
- 奖金 → `formatAmount(slip.bonus)` （key: `payroll.card.result.bonus`）
- 缺勤扣款 → `formatAmount(slip.absentDeduct)` （key: `payroll.card.result.absentDeduct`）
- 应发工资 → `formatAmount(slip.grossPay)` （key: `payroll.card.result.grossPay`，加粗）

**单位承担：**
- 单位社保 → `formatAmount(slip.cSocial)` （key: `payroll.card.result.cSocial`）
- 单位公积金 → `formatAmount(slip.cFund)` （key: `payroll.card.result.cFund`）
- 单位总额 → `formatAmount(slip.cTotal)` （key: `payroll.card.result.cTotal`，加粗）

**个人扣除：**
- 个人社保 → `formatAmount(slip.wSocial)` （key: `payroll.card.result.wSocial`）
- 个人公积金 → `formatAmount(slip.wFund)` （key: `payroll.card.result.wFund`）
- 个人所得税 → `formatAmount(slip.tax)` （key: `payroll.card.result.tax`）
- 扣除合计 → `formatAmount(slip.totalDeduct)` （key: `payroll.card.result.totalDeduct`，加粗）

**实发工资（突出显示）：**
- `formatAmount(slip.netPay)` — 大字体，primary 颜色（key: `payroll.card.result.netPay`）

### 样式规范

- 使用 `Card`, `CardHeader`, `CardContent` 来自 `@/components/ui/card`
- 使用 `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` 来自 `@/components/ui/collapsible`
- 使用 `Button`, `Input`, `Select`, `Label`, `Badge` 来自对应 `@/components/ui/*`
- 使用 `cn()` 来自 `@/lib/utils`
- 遵循 shadcn/ui 设计 token，不硬编码颜色值
- 输入区 grid 布局（`grid grid-cols-2 gap-3`）
- 结果区三组间用 `<hr>` 或 spacing 分隔

### TypeScript 要求

- **禁止 `any` 类型**
- 所有 props 有完整类型
- 本地表单状态类型为 `PayrollInput`（允许字段为 undefined）
- 数字 Input 的 `onChange` 处理 `parseFloat(e.target.value) || 0`

---

## 导入模式参考

参照已有组件（如 `EmployeeDetail.tsx`）的导入风格：

```typescript
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { formatAmount } from "@/utils/format";
import type { Employee, PayrollInput, PaySlip } from "@/types/payroll";
```

---

## 验证命令

```bash
cd "/Users/xuxianbang/Documents/payroll system/China/payroll-app"
npm run build
```

**成功标准：**
- TypeScript 编译零错误（tsc + tsc-electron）
- Vite 构建零错误
- 全量测试无回归（`npm run test` 应仍 130/130 PASS）

---

## 交付清单

- [ ] `src/components/ui/collapsible.tsx` — Radix UI Collapsible 封装，shadcn/ui 模式
- [ ] `src/components/MonthPicker.tsx` — 受控年月选择器，禁止未来月，i18n keys
- [ ] `src/components/PayCard.tsx` — Collapsible 卡片，7 字段输入，结果三分组展示
- [ ] 无现有文件被修改
- [ ] `npm run build` 零错误
- [ ] `npm run test` 130/130 PASS（无回归）

---

## 下一阶段（P2.6 完成后）

1. Claude Code CLI（Opus 4.6）代码审查
2. 审查通过后合并 main，tag `v2.1.2-p2-p2.6`
3. 启动 P2.7：`PayrollByEmpPage.tsx`（使用 MonthPicker + PayCard）

**参考文档：**
- `plans/P2阶段开发总纲.md` — P2.6 完整定义
- `China/Devolop files SOP/05-mod-payroll.md §一` — 页面 UI 需求
- `China/Devolop files SOP/薪酬系统-开发策略文档.md` — 开发规范 v3.6
