# Payroll System — 项目开发规范

## AI 模型分层规则（硬性规则 — 第一优先级）

### 代码开发生成 → 必须调用 Codex
- 新文件创建、功能实现、组件开发 → 一律调用 `mcp__codex-cli__codex`
- 参数：`model: "gpt-5.3-codex"`, `reasoningEffort: "xhigh"`, `fullAuto: true`
- Prompt 必须精准描述需求、文件路径、依赖关系、PRD 要求
- **Claude 禁止直接编写超过 10 行的业务逻辑代码**（小修复/hotfix 除外）

### 子代理（Sub-agent）模型对照表
| 任务类型 | subagent_type | 模型 |
|---------|---------------|------|
| 架构设计/复杂决策 | `architect` | Opus |
| 代码审查 | `code-reviewer` | Sonnet |
| 文档验证 | `doc-validator` | Haiku |
| 质量检查（lint/tsc/test） | `quality-checker` | Haiku |
| 代码探索 | `Explore` | Haiku (默认) |

**规则**：启动子代理时必须使用上表中对应的 `subagent_type`，禁止用 `general-purpose` 替代

### Claude 直接操作范围
- 代码审查后的小修复（≤10 行改动）
- Git 操作（commit/push/tag/release）
- README/文档更新
- i18n 键值添加
- 配置文件调整

## 工作流分工
- Codex 负责代码开发生成，Claude 负责代码审查、修复、Git 操作和文档生成
- Claude 不要假设自己负责编写开发代码，除非用户明确要求

## Git 操作
- commit 之后必须 push 到远端（除非用户明确说不要 push）
- 更新 README 时检查并更新项目中所有层级的 README.md（根目录和子目录）
- 完整 Git 流程：commit → push → tag → release → 验证成功
- 阶段完成后创建版本 tag 和 GitHub Release

## 开发阶段流程
- 每个阶段（P2.x）遵循：Codex 开发 → Claude 审查（code-reviewer agent） → 修复 → 测试（quality-checker agent） → Git 收尾 → 生成下一阶段 prompt
- 阶段 prompt 直接输出到聊天窗口，不要写入文件
