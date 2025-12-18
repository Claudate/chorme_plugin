# 数据库迁移总结

## ✅ 已完成的工作

### 1. PostgreSQL Schema 创建
- ✅ 创建了 `src/lib/db/schema-postgres.ts` 文件
- ✅ 所有表名都添加了 `zi_` 前缀以区分其他数据库格式
- ✅ 包含 7 个数据表：
  - `zi_users` - 用户表
  - `zi_articles` - 文章表
  - `zi_publish_records` - 发布记录表
  - `zi_publish_presets` - 发布预设表
  - `zi_redeem_codes` - 兑换码表
  - `zi_image_usage_stats` - 图片使用统计表
  - `zi_video_contents` - 视频内容元数据表

### 2. 数据库迁移文件生成
- ✅ 生成了迁移 SQL 文件: `drizzle/migrations-postgres/0000_lowly_rafael_vega.sql`
- ✅ 所有 CREATE TABLE 语句都使用 `zi_` 前缀
- ✅ 包含所有必要的外键约束和索引

### 3. 工具脚本创建
- ✅ `scripts/init-db.ts` - 数据库初始化脚本
- ✅ `scripts/test-db-connection.ts` - 数据库连接测试脚本

### 4. package.json 脚本命令
新增了以下 npm 脚本：
- ✅ `npm run db:generate:pg` - 生成 PostgreSQL 迁移文件
- ✅ `npm run db:push:pg` - 推送 schema 到 Supabase
- ✅ `npm run db:init` - 初始化数据库（执行迁移）
- ✅ `npm run db:test` - 测试数据库连接

### 5. 文档创建
- ✅ `DATABASE_SETUP.md` - 数据库设置完整指南
- ✅ `SUPABASE_SETUP.md` - Supabase 配置和故障排除
- ✅ `DATABASE_MIGRATION_SUMMARY.md` - 本文档

### 6. 依赖安装
- ✅ 安装了 `pg` 和 `@types/pg` - PostgreSQL 驱动
- ✅ 安装了 `tsx` - TypeScript 脚本执行器
- ✅ 安装了 `dotenv` - 环境变量管理

## ⚠️ 当前状态

### 数据库连接问题
遇到 "Tenant or user not found" 错误，原因可能是：
1. 数据库密码不正确或已过期
2. MCP 配置中的连接字符串可能已失效

### 需要用户操作
用户需要：
1. 访问 [Supabase Dashboard](https://app.supabase.com/)
2. 确认项目状态为活跃
3. 获取正确的数据库连接字符串
4. 更新 `.env.local` 中的 `DATABASE_URL`

## 📝 下一步操作

### 选项 1: 使用自动化脚本（推荐）

1. **更新数据库连接字符串**
   ```bash
   # 编辑 .env.local 文件，添加正确的 DATABASE_URL
   ```

2. **测试数据库连接**
   ```bash
   npm run db:test
   ```

3. **初始化数据库**
   ```bash
   npm run db:init
   ```

### 选项 2: 手动执行 SQL

1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 进入 SQL Editor
3. 复制 `drizzle/migrations-postgres/0000_lowly_rafael_vega.sql` 的内容
4. 在 SQL Editor 中执行

### 选项 3: 使用 Drizzle Kit Push

```bash
npm run db:push:pg
```

## 📊 数据表结构

所有表都遵循以下命名规范：
- 表名前缀：`zi_`
- 列名：snake_case (如 `user_id`, `created_at`)
- 主键：`id` (text, CUID2)
- 外键：采用级联删除 (cascade)
- 时间戳：使用 `timestamp with time zone`

## 🔧 配置文件

### Drizzle 配置
- **SQLite**: `drizzle.config.ts`
- **PostgreSQL**: `drizzle.config.supabase.ts`

### 环境变量 (.env.local)
```env
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://..."
SUPABASE_SERVICE_KEY="..."
```

## 📚 相关文档

1. [DATABASE_SETUP.md](./DATABASE_SETUP.md) - 完整设置指南
2. [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase 特定配置
3. [Drizzle ORM 文档](https://orm.drizzle.team/)
4. [Supabase 数据库文档](https://supabase.com/docs/guides/database)

## 🚀 验证安装

数据库创建成功后，运行以下 SQL 验证：

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'zi_%'
ORDER BY table_name;
```

期望结果：7 个表，全部以 `zi_` 开头。

## 💡 常见问题

### Q: 为什么使用 zi_ 前缀？
A: 为了区分不同的数据库格式，避免表名冲突，便于识别和管理。

### Q: 可以混用 SQLite 和 PostgreSQL 吗？
A: 不建议。项目应该选择一个数据库系统。当前配置支持两者，但应该只使用其中一个。

### Q: 如何切换数据库？
A: 修改应用代码中的数据库导入，从 `src/lib/db/schema.ts` (SQLite) 切换到 `src/lib/db/schema-postgres.ts` (PostgreSQL)。

## ✨ 总结

所有数据库相关的文件和脚本都已准备就绪。主要剩余工作是：

1. ✅ Schema 文件已创建（带 `zi_` 前缀）
2. ✅ 迁移文件已生成
3. ✅ 工具脚本已就位
4. ⏳ **需要正确的数据库连接字符串**
5. ⏳ **执行数据库初始化**

一旦获得正确的 DATABASE_URL，运行 `npm run db:init` 即可完成数据库设置！
