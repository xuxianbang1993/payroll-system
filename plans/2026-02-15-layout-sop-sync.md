# 2026-02-15 Layout SOP Sync

## Goal

将 `plans/参考图/1.2.html` 的信息架构迁移到正式项目 `China/payroll-app`，并以 `plans/参考图/1.html` 作为颜色与阴影视觉基线；保持现有前端技术架构与业务行为不变。

## Locked Decisions

1. 分支：`codex/bugfix/layout-fix`
2. 执行顺序：先文档、后代码，分两次提交
3. 视觉方向：暖色中性底 + 橙色主交互（`#ef8b4a`）
4. 范围：全量页面视觉统一，但不新增业务逻辑
5. 验证：`npm run build` + 定向测试（overview/layout）

## Scope

### In Scope

- SOP 文档更新：`02-ui-layout.md`、`00-INDEX.md`
- plans 文档：本文件 + `progress.md`
- README 更新：根 README 与 app README
- 正式代码样式与布局统一：
  - `src/index.css`
  - `src/layouts/AppLayout.tsx`
  - `src/components/layout/{app-header,nav-panel}.tsx`
  - `src/pages/home/OverviewPage.tsx`
  - `src/components/ui/{card,button,input,select,badge}.tsx`

### Out of Scope

- 路由结构与导航语义变更
- store 数据模型调整
- Electron IPC 或数据库接口改动
- P2/P3 业务功能开发

## Implementation Notes

1. 保持 Tailwind/shadcn 体系，仅重映射 token 与组件 class。
2. 概览页采用三段式：工具条 + KPI + 模块卡。
3. 模块卡高度和底部动作区对齐，避免“高低不齐”。
4. 月份、语言、菜单、面包屑保留现有交互行为。

## Acceptance Criteria

1. 页面风格与 1.html 的颜色/阴影一致性明显提升。
2. 全站输入/按钮/卡片/badge 风格统一。
3. 顶栏与弹层菜单对齐，无遮挡与突兀留白。
4. `npm run build` 通过。
5. `npm run test -- src/pages/home/p1.overview-status.component.spec.tsx src/layouts/p0.layout-navigation.component.spec.tsx` 通过。

## Execution Status (2026-02-15)

### Completed

1. `docs(layout)` 提交已完成：`0c289d6`
2. `feat(ui)` 提交已完成：`783999e`
3. 验证已完成：
   - `npm run build` PASS
   - 定向测试 PASS（overview/layout）

### Findings After Implementation

1. `npm run dev` 在某些顺序下报 `better-sqlite3` ABI mismatch：
   - 原因：`test` 将 ABI 切到 Node，但 `dev:electron` 未在启动前切回 Electron ABI。
2. 概览 KPI 出现 demo 固定值（如 `1245/12350000/98%`）：
   - 原因：`OverviewPage` 使用了演示硬编码。

### In Progress

1. Runtime 修复：
   - `package.json` 中 `dev:electron` 增加 `npm run abi:electron` 预步骤。
2. 数据展示修复：
   - `OverviewPage` KPI 默认值调整为 `0 / ¥ 0 / 0% / 0`。

## Next Actions

1. 提交上述两项修复（runtime + KPI default）。
2. 复跑：
   - `npm run build`
   - `npm run test -- src/pages/home/p1.overview-status.component.spec.tsx src/layouts/p0.layout-navigation.component.spec.tsx`
3. 手工验证：`npm run dev` 可正常启动 Electron 壳。
4. 完成分支合并后，进入 `plans/2026-02-14-p2-payroll-kickoff.md` 对应的 P2 实施。
