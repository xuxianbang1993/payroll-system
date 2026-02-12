---
module: 基础设置
version: 1.0
depends_on: [01-data-model.md]
consumed_by: [05-mod-payroll]
pages:
  - /settings/org
  - /settings/social
  - /settings/company
---

# 基础设置模块（3 个子页面）

---

## 1. 组织信息页（/settings/org）

### 统计概览栏（页面顶部 3 个统计卡片）

| 指标 | 计算方式 |
|------|----------|
| 在职人员 | `employees.length` |
| 公司主体 | 去重后的 `companyShort` 数量 |
| 月度基础薪资总额 | `Σ(baseSalary + subsidy)`，精确到 2 位小数 |

### 组织名称编辑

- 默认显示当前组织名称
- 点击「编辑」进入编辑模式，显示输入框
- 输入后点击「保存」，名称不能为空

---

## 2. 社保配置页（/settings/social）

配置分为 3 个区域：

### 区域一：单位承担（六险）

| 配置项 | 字段 | 单位 | 默认值 |
|--------|------|:----:|:------:|
| 养老保险 | compPension | % | 16 |
| 地方养老补贴 | compLocalPension | % | 1 |
| 失业保险 | compUnemploy | % | 0.8 |
| 医疗保险 | compMedical | % | 5 |
| 工伤保险 | compInjury | % | 0.4 |
| 生育保险 | compMaternity | % | 0.5 |

### 区域二：个人承担（三险）

| 配置项 | 字段 | 单位 | 默认值 |
|--------|------|:----:|:------:|
| 养老保险 | workerPension | % | 8 |
| 失业保险 | workerUnemploy | % | 0.2 |
| 医疗保险 | workerMedical | % | 2 |

### 区域三：缴费基数

| 配置项 | 字段 | 单位 | 默认值 |
|--------|------|:----:|:------:|
| 养老基数 | pensionBase | 元 | 4775 |
| 失业基数 | unemploymentBase | 元 | 3000 |
| 医疗基数 | medicalBase | 元 | 6727 |
| 工伤基数 | injuryBase | 元 | 3000 |
| 生育基数 | maternityBase | 元 | 6727 |

**区域底部**：显示自动计算示例，实时反映配置变更效果。

---

## 3. 公司主体管理页（/settings/company）

- 支持 CRUD
- 每个公司主体有简称（`short`）和全称（`full`）
- 员工新增时从已有公司主体列表中选择
