# Payroll System — 项目开发规范

## 工作流分工
- Codex 负责代码开发生成，Claude 负责代码审查、修复、Git 操作和文档生成
- Claude 不要假设自己负责编写开发代码，除非用户明确要求

## Git 操作
- commit 之后必须 push 到远端（除非用户明确说不要 push）
- 更新 README 时检查并更新项目中所有层级的 README.md（根目录和子目录）
- 完整 Git 流程：commit → push → tag → 验证成功
- 阶段完成后创建版本 tag（如 v2.1.0）

## 开发阶段流程
- 每个阶段（P2.x）遵循：Codex 开发 → Claude 审查 → 修复 → 测试 → Git 收尾 → 生成下一阶段 prompt
- 阶段 prompt 直接输出到聊天窗口，不要写入文件
