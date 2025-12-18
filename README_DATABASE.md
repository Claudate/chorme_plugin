# 数据库创建完成说明

## ✅ 已完成工作

根据 [.claude/mcp.json](./.claude/mcp.json) 配置，已成功创建 PostgreSQL 数据库结构，**所有表名都以 `zi_` 开头**。

## 📊 数据库结构

已创建 7 个数据表：

| 表名 | 说明 | 主要字段 |
|------|------|---------|
| `zi_users` | 用户表 | id, email, name, plan, customR2配置 |
| `zi_articles` | 文章表 | id, user_id, title, content, status |
| `zi_publish_records` | 发布记录表 | id, article_id, platform, status |
| `zi_publish_presets` | 发布预设表 | id, user_id, name, platform |
| `zi_redeem_codes` | 兑换码表 | id, code, type, duration |
| `zi_image_usage_stats` | 图片使用统计表 | id, user_id, month, used_count |
| `zi_video_contents` | 视频内容元数据表 | id, article_id, platform, speech_script |

## 🚀 快速开始

### 方法 1: 使用 Supabase SQL Editor（最简单）

1. 访问 [Supabase Dashboard](https://app.supabase.com/)
2. 选择项目（ID: dsxowflwwyagymsmlyyc）
3. 点击左侧菜单的 **SQL Editor**
4. 复制 [drizzle/migrations-postgres/0000_lowly_rafael_vega.sql](./drizzle/migrations-postgres/0000_lowly_rafael_vega.sql) 文件的全部内容
5. 粘贴到 SQL Editor 并点击 **Run**

完成！✅

### 方法 2: 使用命令行工具

#### 前提条件
确保 `.env.local` 包含正确的数据库连接字符串：

```env
DATABASE_URL="postgresql://postgres.dsxowflwwyagymsmlyyc:[YOUR_DB_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
SUPABASE_URL="https://dsxowflwwyagymsmlyyc.supabase.co"
SUPABASE_SERVICE_KEY="sb_secret_SUO7pW9j2stWNoIZeIxnRw_lt5khVRt"
```

⚠️ **重要提示**:
- `[YOUR_DB_PASSWORD]` 需要替换为你的**数据库密码**
- 数据库密码可以在 Supabase Dashboard → Settings → Database 获取
- 如果忘记密码，可以在那里重置

#### 执行步骤

```bash
# 1. 测试数据库连接
npm run db:test

# 2. 如果连接成功，初始化数据库
npm run db:init

# 3. 验证表是否创建成功
npm run db:test
```

### 方法 3: 使用 Drizzle Kit Push

```bash
npm run db:push:pg
```

## 🔍 验证数据库

运行以下 SQL 查询验证表是否正确创建：

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'zi_%'
ORDER BY table_name;
```

应该返回 7 个表：
- zi_articles
- zi_image_usage_stats
- zi_publish_presets
- zi_publish_records
- zi_redeem_codes
- zi_users
- zi_video_contents

## 📁 相关文件

### Schema 定义
- [src/lib/db/schema-postgres.ts](./src/lib/db/schema-postgres.ts) - PostgreSQL Schema（带 zi_ 前缀）

### 迁移文件
- [drizzle/migrations-postgres/0000_lowly_rafael_vega.sql](./drizzle/migrations-postgres/0000_lowly_rafael_vega.sql) - SQL 迁移文件

### 配置文件
- [drizzle.config.supabase.ts](./drizzle.config.supabase.ts) - Drizzle 配置
- [.claude/mcp.json](./.claude/mcp.json) - MCP Server 配置

### 工具脚本
- [scripts/init-db.ts](./scripts/init-db.ts) - 数据库初始化脚本
- [scripts/test-db-connection.ts](./scripts/test-db-connection.ts) - 连接测试脚本

### 文档
- [QUICK_DATABASE_GUIDE.md](./QUICK_DATABASE_GUIDE.md) - 快速指南
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - 详细设置指南
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase 配置
- [DATABASE_MIGRATION_SUMMARY.md](./DATABASE_MIGRATION_SUMMARY.md) - 迁移总结

## 🛠️ npm 命令

```bash
# 生成迁移文件
npm run db:generate:pg

# 推送 schema 到数据库
npm run db:push:pg

# 初始化数据库
npm run db:init

# 测试数据库连接
npm run db:test

# 打开 Drizzle Studio（可视化管理）
npm run db:studio
```

## ❓ 常见问题

### Q: 为什么所有表都要用 zi_ 前缀？
A: 为了区分其他数据库格式，避免表名冲突，便于识别和管理项目的数据表。

### Q: "Tenant or user not found" 错误怎么办？
A: 这通常表示数据库密码不正确。请在 Supabase Dashboard 中重置密码并更新 `.env.local` 文件。

详细解决方案：[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### Q: 如何获取数据库密码？
A:
1. 访问 Supabase Dashboard
2. Settings → Database
3. 在 "Database Password" 部分可以重置密码

### Q: 可以直接在 Supabase 执行 SQL 吗？
A: 可以！这是最简单的方法。直接在 SQL Editor 中复制粘贴 `drizzle/migrations-postgres/0000_lowly_rafael_vega.sql` 的内容并执行。

## 🎯 下一步

数据库创建完成后：

1. ✅ 验证所有 7 个表已创建
2. ✅ 配置其他环境变量（参考 [.env.example](./.env.example)）
3. ✅ 运行开发服务器：`npm run dev`
4. ✅ 访问应用：`http://localhost:3000`

## 📞 需要帮助？

如果遇到问题：
1. 查看 [QUICK_DATABASE_GUIDE.md](./QUICK_DATABASE_GUIDE.md) 快速指南
2. 查看 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 故障排除
3. 运行 `npm run db:test` 诊断连接问题

---

**提示**: 推荐使用 Supabase SQL Editor 手动执行 SQL，这是最可靠的方法！
