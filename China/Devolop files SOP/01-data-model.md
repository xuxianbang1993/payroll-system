---
module: 数据模型
version: 1.0
depends_on: []
consumed_by: [03-mod-settings, 04-mod-employee, 05-mod-payroll, 06-mod-voucher, 07-import-export, 08-data-management]
changelog:
  - v1.0: 初始版本，包含 Settings / SocialConfig / Company / Employee / PayrollInput / PaySlip
---

# 数据模型

所有模块的公共数据结构定义。任何模块开发均需引用本文件。

---

## 1. 全局配置（Settings）

```typescript
interface Settings {
  orgName: string               // 组织名称，默认 "公司名称"
  social: SocialConfig          // 社保公积金配置
  companies: Company[]          // 公司主体列表
}
```

## 2. 社保公积金配置（SocialConfig）

```typescript
interface SocialConfig {
  // —— 单位承担比例（六险）——
  compPension: number          // 单位养老保险比例（%），默认 16
  compLocalPension: number     // 单位地方养老补贴比例（%），默认 1
  compUnemploy: number         // 单位失业保险比例（%），默认 0.8
  compMedical: number          // 单位医疗保险比例（%），默认 5
  compInjury: number           // 单位工伤保险比例（%），默认 0.4
  compMaternity: number        // 单位生育保险比例（%），默认 0.5

  // —— 个人承担比例（三险）——
  workerPension: number        // 个人养老保险比例（%），默认 8
  workerUnemploy: number       // 个人失业保险比例（%），默认 0.2
  workerMedical: number        // 个人医疗保险比例（%），默认 2

  // —— 缴费基数 ——
  pensionBase: number          // 养老保险缴费基数（元），默认 4775
  unemploymentBase: number     // 失业保险缴费基数（元），默认 3000
  medicalBase: number          // 医疗保险缴费基数（元），默认 6727
  injuryBase: number           // 工伤保险缴费基数（元），默认 3000
  maternityBase: number        // 生育保险缴费基数（元），默认 6727
}
```

**说明**：社保公积金配置为全局统一设置，所有参保员工使用相同的比例和基数。个别员工可通过 `hasSocial` 和 `hasLocalPension` 字段控制是否参保。

## 3. 公司主体（Company）

```typescript
interface Company {
  short: string                // 简称（用于列表显示和筛选）
  full: string                 // 全称（用于正式文档）
}
```

## 4. 员工信息（Employee）

```typescript
interface Employee {
  id: number                   // 唯一 ID（自增）
  name: string                 // 姓名
  idCard: string               // 身份证号
  companyShort: string         // 所属公司主体（简称）
  company: string              // 所属公司主体（全称）
  dept: string                 // 部门
  position: string             // 职位
  type: '管理' | '销售'        // 人员类型（决定费用科目归属）
  baseSalary: number           // 基本工资（元/月）
  subsidy: number              // 固定补助（元/月）
  hasSocial: boolean           // 是否缴纳社保
  hasLocalPension: boolean     // 是否缴纳地方养老补贴（仅 hasSocial=true 时有效）
  fundAmount: number           // 公积金金额（元/月，固定金额而非比例）
}
```

**关键设计**：
- `type` 字段决定了该员工的薪资费用在凭证中归入「销售费用」还是「管理费用」
- `fundAmount` 是固定金额，不是按比例计算（公积金个人和单位缴纳相同金额）
- `hasSocial = false` 的员工不参与任何社保计算
- `hasLocalPension = false` 的员工不计算单位地方养老补贴

## 5. 月度薪资输入（PayrollInput）

```typescript
interface PayrollInput {
  perfGrade?: string           // 绩效等级（纯展示，如 A/B/C/D）
  perfSalary?: number          // 绩效工资（元）
  commission?: number          // 提成（元）
  bonus?: number               // 奖金（元）
  absentHours?: number         // 缺勤小时数
  tax?: number                 // 个人所得税（元，手动输入）
  otherAdj?: number            // 其他调整（正数为加项，负数为减项）
}
```

## 6. 工资条计算结果（PaySlip）

```typescript
interface PaySlip {
  // —— 收入项 ——
  base: number                 // 基本工资 + 补助
  perfSalary: number           // 绩效工资
  commission: number           // 提成
  bonus: number                // 奖金
  totalPerf: number            // 绩效合计 = perfSalary + commission + bonus
  otherAdj: number             // 其他调整
  fullGrossPay: number         // 应计工资 = base + totalPerf + otherAdj
  absentH: number              // 缺勤小时数
  absentDeduct: number         // 缺勤扣款
  grossPay: number             // 应发工资 = fullGrossPay - absentDeduct

  // —— 单位承担（不影响实发，做凭证用）——
  cPension: number             // 单位养老
  cLocalPension: number        // 单位地方养老补贴
  cUnemploy: number            // 单位失业
  cMedical: number             // 单位医疗
  cInjury: number              // 单位工伤
  cMaternity: number           // 单位生育
  cSocial: number              // 单位社保合计
  cFund: number                // 单位公积金
  cTotal: number               // 单位承担总额 = cSocial + cFund

  // —— 个人扣除 ——
  wPension: number             // 个人养老
  wUnemploy: number            // 个人失业
  wMedical: number             // 个人医疗
  wSocial: number              // 个人社保合计
  wFund: number                // 个人公积金
  tax: number                  // 个人所得税
  totalDeduct: number          // 个人扣除合计 = wSocial + wFund + tax
  netPay: number               // 实发工资 = grossPay - totalDeduct

  // —— 辅助信息 ——
  hourlyRate: number           // 小时工资（用于缺勤扣款计算）
  perfGrade: string            // 绩效等级
  type: '管理' | '销售'        // 人员类型
  companyShort: string         // 所属公司主体
}
```
