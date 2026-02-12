---
module: 薪资核算
version: 1.0
depends_on: [01-data-model.md, 03-mod-settings.md]
consumed_by: [06-mod-voucher]
pages:
  - /payroll/employee
  - /payroll/detail
---

# 薪资核算模块

包含页面 UI 需求和核心计算公式。

---

## 一、页面 UI 需求

### 1.1 顶部区域

- 年月选择器（自定义组件，选择工资所属年月）
- 统计概览栏（人数、应发总额、实发总额、单位社保总额）
- 操作按钮：全部生成、导出

### 1.2 子页面

| 子页面 | 路由 | 内容 |
|--------|------|------|
| **按员工** | /payroll/employee | 每个员工一张卡片，可输入月度变量、单独生成/查看 |
| **明细表** | /payroll/detail | 全员大表格（28 列），按公司主体分组，含小计和全员合计 |

### 1.3 员工薪资卡片（按员工页面）

**收起状态**：显示姓名、职位、公司、基本工资、状态（未生成/已生成 + 实发金额）

**展开状态**：
- **输入区域**：绩效等级（下拉）、绩效工资、提成、奖金、缺勤小时数、所得税、其他调整
- **「生成工资条」按钮**
- **计算结果展示**（生成后）：收入明细、单位承担明细、个人扣除明细、实发工资
- **工资条预览**：标准格式的工资条，可用于 PDF 导出

### 1.4 明细表（28 列大表）

| 列组 | 包含列 |
|------|--------|
| 基本信息 | 姓名、职位 |
| 收入 | 基本工资、补助、绩效工资、提成、奖金、缺勤扣款、其他调整 |
| 工资汇总 | 应计工资（fullGrossPay）、应发工资（grossPay） |
| 单位承担 | 单位养老、地方补贴、单位失业、单位医疗、单位工伤、单位生育、单位社保合计、单位公积金、单位总额 |
| 个人扣除 | 个人养老、个人失业、个人医疗、个人社保合计、个人公积金、所得税、个人扣除合计 |
| 最终 | 实发工资 |

- 按公司主体分组显示
- 每组有小计行
- 最底部有全员合计行
- 汇总规则：先逐人累加原始值，最后统一四舍五入到 2 位小数（避免先取整再累加的精度偏差）

---

## 二、薪资计算规则（核心业务逻辑）

所有金额计算结果均四舍五入到 2 位小数（使用 decimal.js）。

### 2.1 单人工资条计算公式

#### 第一步：计算收入

```
base = baseSalary + subsidy                                   // 固定收入
totalPerf = perfSalary + commission + bonus                   // 绩效合计
otherAdj = otherAdj（可正可负）                                // 其他调整
fullGrossPay = base + totalPerf + otherAdj                    // 应计工资（不含缺勤）
```

#### 第二步：计算缺勤扣款

```
hourlyRate = base / 21.75 / 8                                 // 小时工资（月计薪天数 21.75）
absentDeduct = absentHours × hourlyRate                       // 缺勤扣款
grossPay = fullGrossPay - absentDeduct                        // 应发工资
```

#### 第三步：计算单位承担社保（六险）

前提条件：`hasSocial = true` 时才计算，否则全部为 0。

```
cPension       = pensionBase × compPension%                   // 单位养老
cLocalPension  = pensionBase × compLocalPension%              // 单位地方养老（仅 hasLocalPension=true）
cUnemploy      = unemploymentBase × compUnemploy%             // 单位失业
cMedical       = medicalBase × compMedical%                   // 单位医疗
cInjury        = injuryBase × compInjury%                     // 单位工伤
cMaternity     = maternityBase × compMaternity%               // 单位生育
cSocial        = cPension + cLocalPension + cUnemploy + cMedical + cInjury + cMaternity
```

**注意**：每一项先单独四舍五入到 2 位小数，再求和。

#### 第四步：计算单位公积金

```
cFund = fundAmount                                            // 单位公积金 = 员工设定的固定金额
cTotal = cSocial + cFund                                      // 单位承担总额
```

#### 第五步：计算个人扣除

前提条件：`hasSocial = true` 时才计算社保部分，否则社保为 0。

```
wPension  = pensionBase × workerPension%                      // 个人养老
wUnemploy = unemploymentBase × workerUnemploy%                // 个人失业
wMedical  = medicalBase × workerMedical%                      // 个人医疗
wSocial   = wPension + wUnemploy + wMedical                   // 个人社保合计
wFund     = fundAmount                                        // 个人公积金 = 单位公积金（等额）
```

#### 第六步：计算实发工资

```
totalDeduct = wSocial + wFund + tax                           // 个人扣除合计
netPay = grossPay - totalDeduct                               // 实发工资
```

### 2.2 全员汇总规则

汇总时按 `type` 字段分为两类：

| 分类 | 条件 | 用于凭证科目 |
|------|------|-------------|
| **销售**（sale） | `employee.type === '销售'` | 销售费用 |
| **管理**（manage） | `employee.type === '管理'` | 管理费用 |

汇总维度（每类和合计各自独立汇总）：

```
fullGrossPay  — 应计工资总额
cSocial       — 单位社保总额
cFund         — 单位公积金总额
wSocial       — 个人社保总额
wFund         — 个人公积金总额
tax           — 个人所得税总额
netPay        — 实发工资总额
absentDeduct  — 缺勤扣款总额
```

**精度规则**：先逐人累加原始值（不取整），全部累加完后统一四舍五入到 2 位小数。

### 2.3 按公司主体筛选

凭证页面支持按公司主体筛选：
- 「全部公司」→ 汇总所有员工
- 选择某个公司主体 → 只汇总该主体下的员工

筛选后重新执行汇总计算，凭证数据相应更新。
