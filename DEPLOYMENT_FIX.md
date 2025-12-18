# Vercel 部署修复指南

## 问题
Vercel 构建失败，错误: `Tenant or user not found`

## 原因
1. Supabase 数据库密码已过期
2. 构建时尝试运行表名修复脚本，但没有权限

## 解决方案

### 步骤 1: 检查数据库表名

首先需要确认数据库中的表名是否需要修复。

**登录 Supabase Dashboard:**
1. 访问 https://supabase.com/dashboard
2. 进入你的项目
3. 点击 **SQL Editor**
4. 运行以下 SQL 查询:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**检查结果:**
- 如果表名是 `zi_users`, `zi_articles` 等（有 `zi_` 前缀）→ **无需修复，跳到步骤 3**
- 如果表名是 `users`, `articles` 等（无前缀）→ **需要修复，继续步骤 2**

### 步骤 2: 修复表名（如果需要）

如果表名没有 `zi_` 前缀，在 Supabase SQL Editor 中运行:

```sql
-- 重命名表
ALTER TABLE IF EXISTS users RENAME TO zi_users;
ALTER TABLE IF EXISTS articles RENAME TO zi_articles;
ALTER TABLE IF EXISTS publish_records RENAME TO zi_publish_records;
ALTER TABLE IF EXISTS publish_presets RENAME TO zi_publish_presets;
ALTER TABLE IF EXISTS redeem_codes RENAME TO zi_redeem_codes;
ALTER TABLE IF EXISTS image_usage_stats RENAME TO zi_image_usage_stats;
ALTER TABLE IF EXISTS video_contents RENAME TO zi_video_contents;

-- 重命名索引
ALTER INDEX IF EXISTS users_email_unique RENAME TO zi_users_email_unique;
ALTER INDEX IF EXISTS redeem_codes_code_unique RENAME TO zi_redeem_codes_code_unique;
```

### 步骤 3: 更新数据库密码（如果需要）

如果你需要在本地连接数据库:

1. **Supabase Dashboard** → **Settings** → **Database**
2. 找到 **Connection String** 部分
3. 点击 **Connection Pooling** 标签
4. 复制 **Transaction** 模式的连接字符串（端口 5432）
5. 更新本地 `.env` 文件中的 `POSTGRES_URL`

### 步骤 4: 重新部署 Vercel

现在构建脚本已经简化（不再需要修复表名），直接推送代码即可:

```bash
git add .
git commit -m "fix: 简化构建流程，移除自动表名修复"
git push
```

Vercel 会自动重新部署。

## 当前构建流程

```json
{
  "build": "npm run db:migrate:vercel && next build"
}
```

- `db:migrate:vercel` - 运行数据库迁移（使用 postgres-js 驱动）
- `next build` - 构建 Next.js 应用

## 如果还有问题

1. **检查 Vercel 环境变量:**
   - Vercel Dashboard → Settings → Environment Variables
   - 确认 `DATABASE_URL` 正确

2. **检查 Supabase Integration:**
   - Vercel Dashboard → Integrations → Supabase
   - 确认已正确连接

3. **查看完整日志:**
   - Vercel Dashboard → Deployments → 点击失败的部署
   - 查看完整构建日志

## 备注

- 表名修复脚本 (`scripts/fix-table-names.ts`) 已被移除构建流程
- 如果需要手动修复表名，使用 `npm run db:fix-names:local`（需要正确的 POSTGRES_URL）
- 建议在 Supabase SQL Editor 中直接执行 SQL 更简单可靠
