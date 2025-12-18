# 数据库设置指南

本项目使用 PostgreSQL (Supabase) 作为数据库，所有数据表都以 `zi_` 为前缀，以区分其他数据库格式。

## 数据库结构

项目包含以下数据表（均带有 `zi_` 前缀）：

- `zi_users` - 用户表
- `zi_articles` - 文章表
- `zi_publish_records` - 发布记录表
- `zi_publish_presets` - 发布预设表
- `zi_redeem_codes` - 兑换码表
- `zi_image_usage_stats` - 图片使用统计表
- `zi_video_contents` - 视频内容元数据表

## 快速设置

### 方法 1: 使用 Drizzle Kit Push（推荐）

1. 确保你的 `.env` 或 `.env.local` 文件包含正确的数据库连接字符串：

```env
DATABASE_URL="postgresql://postgres.YOUR_PROJECT:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
```

2. 运行迁移命令：

```bash
npx drizzle-kit push --config=drizzle.config.supabase.ts
```

### 方法 2: 手动执行 SQL

如果方法 1 失败，你可以手动在 Supabase Dashboard 中执行 SQL：

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目
3. 进入 SQL Editor
4. 复制并执行 `drizzle/migrations-postgres/0000_lowly_rafael_vega.sql` 文件中的 SQL 语句

### 方法 3: 使用 MCP Server

如果你已经配置了 `.claude/mcp.json` 中的 MCP Server，可以通过 Claude 直接执行数据库操作。

## 配置文件

- **Schema 定义**: `src/lib/db/schema-postgres.ts`
- **Drizzle 配置**: `drizzle.config.supabase.ts`
- **迁移文件**: `drizzle/migrations-postgres/`

## 验证安装

创建数据库后，你可以运行以下查询验证表是否正确创建：

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'zi_%'
ORDER BY table_name;
```

你应该看到 7 个表，全部以 `zi_` 开头。

## 常见问题

### 连接失败 - "Tenant or user not found"

这通常意味着：
- 数据库密码不正确
- 项目 ID 不正确
- 数据库实例已暂停或删除

解决方法：
1. 在 Supabase Dashboard 检查你的项目状态
2. 重新获取数据库连接字符串：Project Settings → Database → Connection string
3. 确保使用 Connection Pooling (端口 6543) 以获得更好的性能

### 缺少 PostgreSQL 驱动

运行以下命令安装：

```bash
npm install pg @types/pg --save-dev
```

## 后续步骤

数据库设置完成后：

1. 更新你的 `.env` 文件，添加所有必需的环境变量（参考 `.env.example`）
2. 运行开发服务器：`npm run dev`
3. 访问 `http://localhost:3000` 测试应用

## 参考链接

- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [Supabase 文档](https://supabase.com/docs)
- [项目 README](./README.md)
