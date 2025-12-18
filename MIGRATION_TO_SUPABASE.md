# 迁移到 Supabase 数据库指南

## 一、为什么选择 Supabase

### 优势
- ✅ **开源免费**：基于 PostgreSQL，完全开源
- ✅ **功能丰富**：内置身份认证、实时订阅、存储、边缘函数
- ✅ **可自部署**：可以部署在自己的服务器上，完全可控
- ✅ **开发友好**：提供丰富的 SDK 和工具
- ✅ **性能强大**：PostgreSQL 比 SQLite 更适合生产环境
- ✅ **免费额度**：500MB 数据库、1GB 文件存储、50MB 带宽/天

### 与 Turso 的对比

| 特性 | Turso (当前) | Supabase (迁移目标) |
|------|-------------|-------------------|
| 数据库类型 | SQLite (分布式) | PostgreSQL |
| 开源 | ✅ | ✅ |
| 自托管 | ✅ | ✅ |
| 身份认证 | ❌ 需自建 | ✅ 内置 |
| 实时功能 | ❌ | ✅ |
| 文件存储 | ❌ | ✅ |
| 免费额度 | 500 行/月 | 无限行数 |

## 二、迁移方案

### 2.1 数据库架构变更

#### SQLite → PostgreSQL 主要差异

1. **数据类型映射**
   ```
   SQLite          →  PostgreSQL
   --------------------------------
   text            →  text / varchar
   integer         →  integer / bigint
   integer(bool)   →  boolean
   integer(ts)     →  timestamp / timestamptz
   ```

2. **自增ID**
   ```sql
   -- SQLite (CUID2)
   text('id').primaryKey().$defaultFn(() => createId())

   -- PostgreSQL (可选方案)
   -- 方案1: 继续使用 CUID2
   text('id').primaryKey().$default(() => createId())

   -- 方案2: 使用 UUID
   uuid('id').primaryKey().defaultRandom()

   -- 方案3: 使用自增ID
   serial('id').primaryKey()
   ```

3. **时间戳处理**
   ```sql
   -- SQLite (Unix时间戳)
   integer('created_at', { mode: 'timestamp' })

   -- PostgreSQL (推荐)
   timestamp('created_at', { withTimezone: true }).defaultNow()
   ```

### 2.2 迁移步骤

#### 步骤 1: 安装 Supabase 相关依赖

```bash
npm install @supabase/supabase-js
npm install drizzle-orm@latest
npm install postgres  # PostgreSQL 客户端
```

#### 步骤 2: 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 创建新项目
3. 记录以下信息：
   - `Project URL`
   - `anon public key`
   - `service_role key` (用于服务端)
   - `Database Password`

#### 步骤 3: 获取数据库连接信息

在 Supabase 项目设置中找到：

```
Project Settings → Database → Connection string

Direct connection:
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

Connection pooling (推荐):
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
```

## 三、代码修改

### 3.1 更新数据库 Schema

创建新文件：`src/lib/db/schema-postgres.ts`

```typescript
import { pgTable, text, integer, boolean, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// 用户表
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  passwordHash: text('password_hash'),
  avatar: text('avatar'),
  plan: varchar('plan', { length: 20, enum: ['free', 'pro'] }).notNull().default('free'),
  planExpiredAt: timestamp('plan_expired_at', { withTimezone: true }),

  // 自定义R2存储配置
  useCustomR2: boolean('use_custom_r2').default(false),
  customR2AccountId: text('custom_r2_account_id'),
  customR2AccessKeyId: text('custom_r2_access_key_id'),
  customR2SecretAccessKey: text('custom_r2_secret_access_key'),
  customR2BucketName: text('custom_r2_bucket_name'),
  customR2PublicUrl: text('custom_r2_public_url'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 文章表
export const articles = pgTable('articles', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  style: varchar('style', { length: 20, enum: ['default', 'tech', 'minimal', 'elegant'] }).notNull().default('default'),
  status: varchar('status', { length: 20, enum: ['draft', 'published'] }).notNull().default('draft'),
  wordCount: integer('word_count').default(0),
  readingTime: integer('reading_time').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 发布记录表
export const publishRecords = pgTable('publish_records', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  articleId: text('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: varchar('platform', {
    length: 50,
    enum: ['wechat', 'zhihu', 'juejin', 'zsxq', 'video_wechat', 'douyin', 'bilibili', 'xiaohongshu']
  }).notNull(),
  status: varchar('status', { length: 20, enum: ['pending', 'success', 'failed'] }).notNull().default('pending'),
  platformArticleId: text('platform_article_id'),
  platformUrl: text('platform_url'),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// 发布预设表
export const publishPresets = pgTable('publish_presets', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull().default('wechat'),
  isDefault: boolean('is_default').default(false),

  authorName: varchar('author_name', { length: 255 }),
  autoGenerateDigest: boolean('auto_generate_digest').default(true),
  headerContent: text('header_content'),
  footerContent: text('footer_content'),
  platformConfig: text('platform_config'), // JSON

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 兑换码表
export const redeemCodes = pgTable('redeem_codes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  code: varchar('code', { length: 50 }).notNull().unique(),
  type: varchar('type', { length: 20, enum: ['monthly', 'yearly'] }).notNull(),
  duration: integer('duration').notNull(),
  isUsed: boolean('is_used').notNull().default(false),
  usedBy: text('used_by').references(() => users.id),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdBy: varchar('created_by', { length: 255 }),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// 图片使用统计表
export const imageUsageStats = pgTable('image_usage_stats', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  month: varchar('month', { length: 7 }).notNull(), // YYYY-MM
  usedCount: integer('used_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 视频内容元数据表
export const videoContents = pgTable('video_contents', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  articleId: text('article_id').notNull().references(() => articles.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 50 }).notNull(),

  shortTitle: varchar('short_title', { length: 100 }),
  keyPoints: text('key_points'),
  tags: text('tags'),
  hashtags: text('hashtags'),
  speechScript: text('speech_script'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### 3.2 更新数据库连接配置

修改 `src/lib/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema-postgres';

// 获取数据库连接字符串
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or SUPABASE_DB_URL must be set');
}

console.log('Connecting to Supabase PostgreSQL database...');

// 创建 PostgreSQL 客户端
// 使用 connection pooling 以提高性能
const client = postgres(connectionString, {
  max: 10, // 最大连接数
  idle_timeout: 20,
  connect_timeout: 10,
});

// 创建 Drizzle 实例
export const db = drizzle(client, { schema });

// 导出 schema
export * from './schema-postgres';
```

### 3.3 更新 Drizzle 配置

修改 `drizzle.config.ts`:

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema-postgres.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '',
  },
} satisfies Config;
```

### 3.4 环境变量配置

创建 `.env.local`:

```bash
# Supabase 数据库配置
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"

# NextAuth 配置
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# R2 存储配置 (可选 - 或使用 Supabase Storage)
R2_ACCOUNT_ID="your-r2-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="your-bucket-name"
R2_PUBLIC_URL="https://your-public-url"
```

### 3.5 更新 package.json

修改依赖:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "drizzle-orm": "^0.44.3",
    "postgres": "^3.4.3",
    // 移除 @libsql/client
  }
}
```

## 四、数据迁移

### 4.1 导出现有数据

如果有生产数据需要迁移：

```bash
# 从 Turso 导出数据
# 1. 连接到 Turso 数据库
turso db shell [database-name]

# 2. 导出为 SQL
.output data.sql
.dump

# 3. 或使用 SQLite 命令
sqlite3 dev.db .dump > data.sql
```

### 4.2 转换数据格式

创建迁移脚本 `scripts/migrate-to-postgres.js`:

```javascript
// 此脚本将 SQLite 数据转换为 PostgreSQL 兼容格式
const fs = require('fs');

const sqliteData = fs.readFileSync('data.sql', 'utf-8');

// 转换时间戳
let postgresData = sqliteData
  .replace(/INTEGER.*timestamp/gi, 'TIMESTAMP WITH TIME ZONE')
  .replace(/INTEGER.*boolean/gi, 'BOOLEAN')
  .replace(/text\('id'\)\.primaryKey/gi, 'TEXT PRIMARY KEY');

fs.writeFileSync('data-postgres.sql', postgresData);
console.log('✅ 数据转换完成');
```

### 4.3 导入到 Supabase

```bash
# 使用 psql 导入
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" < data-postgres.sql
```

或使用 Supabase Dashboard 的 SQL Editor。

## 五、测试迁移

### 5.1 运行迁移

```bash
# 1. 生成迁移文件
npm run db:generate

# 2. 推送到数据库
npm run db:push

# 3. 或运行迁移
npm run db:migrate
```

### 5.2 验证数据

```bash
# 启动开发服务器
npm run dev

# 测试以下功能：
# - 用户注册/登录
# - 创建文章
# - 发布到平台
# - 文件上传
```

## 六、使用 Supabase 额外功能

### 6.1 使用 Supabase Auth (可选)

替代 NextAuth.js，使用 Supabase 内置认证：

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 注册
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});

// 登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### 6.2 使用 Supabase Storage

替代 Cloudflare R2：

```typescript
// lib/storage.ts
import { supabase } from './supabase';

// 上传文件
export async function uploadImage(file: File, userId: string) {
  const fileName = `${userId}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from('images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // 获取公开URL
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(fileName);

  return publicUrl;
}
```

### 6.3 使用实时订阅 (可选)

```typescript
// 监听文章更新
const channel = supabase
  .channel('articles-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'articles',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('文章变更:', payload);
      // 更新 UI
    }
  )
  .subscribe();
```

## 七、部署到生产环境

### 7.1 Vercel 配置

在 Vercel 项目设置中添加环境变量：

```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 7.2 自动迁移

在 `package.json` 中添加构建脚本：

```json
{
  "scripts": {
    "build": "npm run db:push && next build"
  }
}
```

## 八、回滚方案

如果需要回退到 Turso：

1. 保留原有的 `schema.ts` 和配置文件
2. 切换环境变量
3. 重新部署

```bash
# 使用备份恢复
git checkout main
git revert [migration-commit]
```

## 九、性能优化建议

### 9.1 连接池配置

```typescript
const client = postgres(connectionString, {
  max: 10,              // 最大连接数
  idle_timeout: 20,     // 空闲超时
  connect_timeout: 10,  // 连接超时
  ssl: 'require'        // 强制 SSL
});
```

### 9.2 索引优化

```sql
-- 为常用查询添加索引
CREATE INDEX idx_articles_user_id ON articles(user_id);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_publish_records_article_id ON publish_records(article_id);
CREATE INDEX idx_users_email ON users(email);
```

### 9.3 查询优化

```typescript
// 使用 select 只查询需要的字段
const articles = await db
  .select({
    id: articles.id,
    title: articles.title,
    createdAt: articles.createdAt
  })
  .from(articles)
  .where(eq(articles.userId, userId))
  .limit(10);
```

## 十、常见问题

### Q: 为什么选择 Supabase 而不是其他数据库？

A: Supabase 提供：
- 免费的 PostgreSQL 数据库
- 内置认证和存储
- 完全开源，可自托管
- 丰富的工具和文档

### Q: 数据迁移会丢失数据吗？

A: 不会。按照本指南操作，所有数据都会被安全迁移。建议在迁移前备份数据。

### Q: 性能会变好吗？

A: 是的。PostgreSQL 在处理复杂查询、并发连接、数据完整性方面优于 SQLite。

### Q: 可以继续使用 Cloudflare R2 吗？

A: 可以。Supabase Storage 是可选的，您可以继续使用 R2 或任何其他存储服务。

## 十一、总结

### 迁移前
- 数据库：Turso (SQLite)
- 需要单独配置认证
- 有限的免费额度

### 迁移后
- 数据库：Supabase (PostgreSQL)
- 可选内置认证和存储
- 更强大的查询能力
- 完全可控和开源

通过本指南，您可以将项目从 Turso 平稳迁移到 Supabase，获得更好的性能和更多功能。

---

**下一步操作**：
1. 创建 Supabase 项目
2. 按步骤修改代码
3. 测试所有功能
4. 部署到生产环境

**需要帮助？** 参考：
- [Supabase 官方文档](https://supabase.com/docs)
- [Drizzle ORM PostgreSQL 文档](https://orm.drizzle.team/docs/get-started-postgresql)
