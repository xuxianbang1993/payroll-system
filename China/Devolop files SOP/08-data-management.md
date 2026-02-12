---
module: 数据管理
version: 1.3
depends_on: [01-data-model.md]
consumed_by: []
pages:
  - /data/backup
  - /data/storage
---

# 数据管理模块

包含备份恢复、清空、旧数据兼容。

---

## 1. 数据备份

- 将业务主数据（设置、员工、公司主体、月度输入、工资结果）从 SQLite 导出为 JSON 文件
- 文件名格式：`薪酬数据备份_{组织名称}_{YYYY-MM-DD}.json`
- 触发位置：设置页 → 数据管理 → 备份数据

## 2. 数据恢复

- 从 JSON 文件导入数据，并以单事务写入 SQLite（失败则回滚）
- 导入前显示确认弹窗（组织名称、员工数量、公司主体数量）
- 警告：当前数据将被完全替换
- 导入后自动与默认值合并（确保新版本新增字段有默认值）

## 3. 清空数据

- 二次确认（两次 confirm 弹窗）
- 清空后恢复到初始默认状态（仅业务表数据）
- 清空操作不删除 SQLite 文件与 schema，仅执行业务数据重置
- 建议用户先备份

## 4. 存储信息页（/data/storage）

- 显示 SQLite 数据库文件占用空间
- 显示员工数量、公司主体数量、月度记录数量、schema 版本

---

## 5. 旧数据兼容

### 兼容目标

支持从原系统（HTML 版本）导出的 JSON 备份文件直接导入新系统。

### 数据映射规则

原系统 JSON 结构与新系统完全兼容，字段名一致：

```typescript
// 原系统 JSON 结构
{
  orgName: string,
  employees: Employee[],       // 字段结构相同
  social: SocialConfig,        // 字段结构相同
  companies: Company[]         // 字段结构相同
}
```

### 迁移适配逻辑

```
1. 解析 JSON 文件
2. 与默认配置合并（补全可能缺失的新增字段）
3. 类型校验（确保数值字段为 number，布尔字段为 boolean）
4. 写入 SQLite（事务提交）
5. 显示迁移结果（成功导入 X 名员工、X 个公司主体）
```

---

## 6. 测试环境隔离与重置策略

### 运行模式

- 默认 `APP_ENV=prod`，读写正式业务库
- 功能测试/自动化测试必须设置 `APP_ENV=test`
- `APP_ENV=test` 时数据库路径由 `TEST_DB_PATH` 指定，未指定则自动落到系统临时目录

### 重置策略

- 提供 `resetDatabase()` 给自动化测试使用（用于 CRUD 回归与重置）
- `resetDatabase()` 仅允许在 `APP_ENV=test` 执行；非 test 模式必须直接拒绝并返回错误
- UI 中“清空数据”属于产品功能，仍可在正式模式使用，但必须保留双重确认

### 生命周期要求

- 每次测试运行创建独立测试库（或独立临时目录）
- 测试结束后清理测试库文件，禁止残留到正式数据目录
- 启动日志需输出当前 `APP_ENV` 与数据库路径，便于排查误连

### ABI 兼容要求（better-sqlite3）

- `better-sqlite3` 是原生模块，Vitest（Node 运行时）与 Playwright/Electron（Electron 运行时）需要不同 ABI
- 运行 `npm run test` 前必须切换到 Node ABI（项目脚本默认自动执行 `abi:node`）
- 运行 `npm run test:e2e` 前必须切换到 Electron ABI（项目脚本默认自动执行 `abi:electron`）
- 若跳过 npm 包装脚本直接运行 `vitest` 或 `playwright test`，必须先手动执行对应 ABI 切换命令，否则会出现 `NODE_MODULE_VERSION` mismatch
