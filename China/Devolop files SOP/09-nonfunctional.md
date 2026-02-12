---
module: 非功能性需求
version: 1.3
depends_on: []
consumed_by: [10-acceptance]
---

# 非功能性需求

---

## 1. 性能

- 支持 200 名以内员工无卡顿
- 工资条批量生成 < 1 秒
- PDF 批量导出 < 10 秒（50 人）

## 2. 数据安全

- 所有业务主数据存储在本地（SQLite → 用户目录下 DB 文件），UI 轻配置存储在 electron-store
- 不涉及网络传输
- 应用无需联网即可运行（CDN 依赖全部本地化）

### 2.1 测试隔离与破坏性操作保护

- `APP_ENV=prod` 为默认运行模式；仅 `APP_ENV=test` 允许测试专用重置能力
- `resetDatabase()` 等破坏性重置 API 在非 test 模式必须拒绝执行
- 功能/E2E 测试必须使用独立测试库路径（`TEST_DB_PATH` 或临时目录），禁止复用正式库
- 应用启动时必须记录 `APP_ENV`、SQLite 路径、`READ_SOURCE`、`WRITE_MODE`，便于审计与排障

## 3. 兼容性

- macOS 12+ (Monterey 及以上)
- Windows 10+ (64-bit)
- 安装包大小目标 < 150MB

## 4. 国际化

- 三语支持：zh-HK（繁体中文）、zh-CN（简体中文）、en（English）
- 语言切换后界面立即刷新
- 数据内容（员工姓名、组织名称等）不做翻译，仅翻译 UI 标签

## 5. 测试可追溯性

- 测试结果必须可追溯到「需求 → case map → 执行结果」链路
- 日常迭代最小证据：raw JSON + case map 对账结果
- 阶段里程碑证据：raw JSON + case map 对账结果 + XLSX 报告
- 客观结果允许失败项存在；禁止将失败结果改写为通过
- 测试治理细则（命名、目录、分级规则）以《薪酬系统-开发策略文档》第四章为唯一权威源
