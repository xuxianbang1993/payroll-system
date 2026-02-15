---
module: 整体布局与导航
version: 2.2
depends_on: []
consumed_by: [03-mod-settings, 04-mod-employee, 05-mod-payroll, 06-mod-voucher, 08-data-management]
change_log:
  - v2.2: 正式代码采用 1.2 信息架构，并以 1.html 作为颜色/阴影视觉基线；明确实现文件映射
  - v2.1: 同步 P1 收口后的实际路由与组件命名，并补充当前实现状态
  - v2.0: 布局方案由「侧边栏导航」改为「顶栏 + 弹出分类面板」（参考阿里云控制台）
  - v1.0: 初始版本（侧边栏导航）
---

# 整体布局与导航

采用**顶部导航栏 + 弹出分类面板 + 右侧内容区**布局。

本版规范新增一条硬约束：
- **信息架构基线**：采用 `plans/参考图/1.2.html` 的布局思路（概览工具条 + KPI + 模块入口卡）。
- **视觉基线**：采用 `plans/参考图/1.html` 的颜色与阴影 token。
- **技术架构不变**：仍为 React + TypeScript + Vite + Tailwind/shadcn，不改路由/IPC/store 结构。

---

## 一、视觉 Token（1.html 基线）

| Token | 值 | 用途 |
|------|----|------|
| `--bg` | `#f6f5f1` | 页面背景底色 |
| `--surface` | `#ffffff` | 面板/卡片底色 |
| `--border` | `#e9e7e2` | 主边框 |
| `--border-light` | `#f2f0ec` | 轻边框/分隔 |
| `--text-1` | `#1c1c1a` | 主文本 |
| `--text-2` | `#6b6860` | 次文本 |
| `--text-3` | `#a09d95` | 辅助文本 |
| `--accent` | `#ef8b4a` | 主交互强调色（按钮/hover/focus） |
| `--accent-2` | `#2c5f4a` | 辅助状态色（仅少量语义） |
| `--danger` | `#b5453a` | 风险/待处理语义 |
| `--radius` | `12px` | 主圆角 |
| `--radius-sm` | `8px` | 小控件圆角 |
| `--shadow` | `0 12px 30px rgba(35, 30, 20, 0.08)` | 主容器阴影 |

说明：
- 正式项目的 Tailwind HSL 变量需映射到上述视觉语义。
- 颜色统一遵循“暖中性色 + 橙色主交互”的方向，避免模块间风格漂移。

---

## 二、顶部导航栏（固定，高 52px）

| 元素 | 位置 | 行为 |
|------|------|------|
| Logo「薪酬管理系统」 | 左侧 | 点击回到概览页 |
| 菜单按钮 ☰ | Logo 右侧 | 点击弹出/关闭分类面板 |
| 语言切换 | 右侧固定 | 繁体中文 / 简体中文 / English |

布局要求：
- 顶栏与主内容区在同一容器宽度基准内对齐。
- 视觉使用 `--surface` 背景 + `--border` 底边框 + 轻模糊。

---

## 三、弹出分类面板（点击 ☰ 后出现）

结构仍为三级导航：
- 左栏：大类（基础设置/人员管理/薪资核算/会计凭证/数据管理）
- 右栏：子类分组 + 模块条目

交互规则：
- 点击 ☰：面板 + 遮罩显示，按钮进入 active 态
- hover/点击左侧大类：右侧内容切换
- 点击具体模块：关闭面板，跳转对应路由
- 点击遮罩或再次点击 ☰：关闭面板

尺寸与对齐要求：
- 面板左边界与主容器内容起点对齐
- 宽度采用固定上限策略（大屏不拉满，小屏不溢出）

---

## 四、概览页（默认首页）

概览页结构固定为三段：
1. **概览工具条**：标题 +（月份/部门/状态）联动控件
2. **KPI 区**：4 张指标卡（数值动画、联动刷新）
3. **模块入口卡区**：5 张大类卡片

模块卡交互要求：
- 列表项可点击跳转具体功能
- 底部按钮文案明确为 `进入：<默认功能名>`
- 卡片空白区不可点击，避免误触
- `pending` 模块可进入占位页，并给出“开发中”提示

视觉一致性要求：
- 5 张卡片高度统一，底部动作区对齐
- 按钮、badge、输入、下拉统一圆角/边框/阴影语义

---

## 五、右侧内容区

- 顶部：面包屑（大类 > 子类 > 页面）
- 月份选择器：仅薪资核算与会计凭证路由显示
- 主体：对应模块页面

本次布局迁移不改变：
- 路由映射关系
- IPC 接口
- store 数据结构

---

## 六、页面路由映射（保持不变）

| 面板中的模块 | 页面组件 | 路由（内部） |
|-------------|----------|-------------|
| 概览（Logo 点击） | OverviewPage | / |
| 基础设置 > 组织信息 | OrgSettingsPage | /settings/org |
| 基础设置 > 公司主体管理 | CompanyPage | /settings/company |
| 基础设置 > 社保比例配置 | SocialConfigPage | /settings/social |
| 基础设置 > 公积金比例配置 | SocialConfigPage（复用） | /settings/fund |
| 基础设置 > 缴费基数设置 | SocialConfigPage（复用） | /settings/base |
| 人员管理 > 员工列表 | EmployeeListPage | /employee/list |
| 人员管理 > Excel 导入 | ImportExportPage | /employee/import |
| 人员管理 > Excel 导出 | ImportExportPage | /employee/export |
| 薪资核算 > 按员工录入 | PayrollByEmpPage | /payroll/employee |
| 薪资核算 > 全员明细表 | PayrollDetailPage | /payroll/detail |
| 会计凭证 > 凭证总览 | VoucherPage | /voucher |
| 数据管理 > JSON 备份 | BackupPage | /data/backup |
| 数据管理 > 存储使用统计 | StoragePage | /data/storage |

---

## 七、正式实现文件映射（v2.2）

- 主题 token：`China/payroll-app/src/index.css`
- 顶栏：`China/payroll-app/src/components/layout/app-header.tsx`
- 导航弹层：`China/payroll-app/src/components/layout/nav-panel.tsx`
- 页面骨架：`China/payroll-app/src/layouts/AppLayout.tsx`
- 概览页：`China/payroll-app/src/pages/home/OverviewPage.tsx`
- 通用 UI（统一风格）：
  - `China/payroll-app/src/components/ui/card.tsx`
  - `China/payroll-app/src/components/ui/button.tsx`
  - `China/payroll-app/src/components/ui/input.tsx`
  - `China/payroll-app/src/components/ui/select.tsx`
  - `China/payroll-app/src/components/ui/badge.tsx`

---

## 八、当前实现状态（2026-02-15）

- 已完成：`/settings/*`、`/employee/*`、`/data/*`（P1）。
- 待开发：`/payroll/*` 与 `/voucher` 业务页（P2/P3）。
- 本轮目标：在不改业务逻辑前提下，完成全站布局与视觉一致性升级。
