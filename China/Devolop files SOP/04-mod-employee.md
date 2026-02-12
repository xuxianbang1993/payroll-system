---
module: 人员管理
version: 1.0
depends_on: [01-data-model.md]
consumed_by: [05-mod-payroll, 07-import-export]
pages:
  - /employee/list
  - /employee/import
---

# 人员管理模块（2 个子页面）

---

## 1. 员工列表页（/employee/list）

### 列表展示

- 表格列：姓名 | 公司主体 | 职位 | 基本工资 | 补助 | 公积金 | 操作
- 点击行 → 展开该员工详情面板
- 操作列：编辑（行内编辑模式）、删除

### 新增员工（Modal 弹窗）

- 必填字段：姓名
- 选填字段：身份证号、所属公司（下拉选择已有公司主体）、部门、职位、人员类型（管理/销售）、基本工资、补助、是否缴纳社保（checkbox）、是否缴纳地方养老（checkbox）、公积金金额
- 人员类型默认为「管理」

### 员工详情面板

- 点击列表行展开
- 显示员工全部信息
- 可直接从详情面板跳转到编辑

### 行内编辑

- 点击编辑按钮后，该行变为输入框模式
- 保存 / 取消操作

### 删除

- 二次确认弹窗
- 删除后自动保存

---

## 2. Excel 导入导出页（/employee/import）

- Excel 模板下载（详见 `07-import-export.md` 第 1 节）
- Excel 导入 + 冲突处理（详见 `07-import-export.md` 第 2 节）
- 员工数据 Excel 导出（详见 `07-import-export.md` 第 3 节）
