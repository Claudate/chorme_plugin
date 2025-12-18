# Cloudflare D1 数据库集成指南

使用 Cloudflare D1（SQLite）+ Drizzle ORM 管理应用数据。

## 技术栈

- **数据库**: Cloudflare D1（分布式 SQLite）
- **ORM**: Drizzle ORM
- **迁移工具**: Drizzle Kit
- **CLI**: Wrangler

## 快速开始

### 1. 安装依赖

```bash
npm install drizzle-orm
npm install -D drizzle-kit
npm install -g wrangler
```

### 2. 创建 D1 数据库

```bash
# 登录 Cloudflare
wrangler login

# 创建数据库
wrangler d1 create content_publisher_db

# 输出示例：
# [[d1_databases]]
# binding = "DB"
# database_name = "content_publisher_db"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 3. 配置 wrangler.toml

```toml
name = "content-publisher"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "content_publisher_db"
database_id = "your-database-id"  # 从上一步获取
```

## 数据库 Schema 设计

### Schema 定义

```typescript
// src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 用户表
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name'),
  subscriptionPlan: text('subscription_plan').default('free'),
  subscriptionExpiry: integer('subscription_expiry', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`),
});

// 文章表
export const articles = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  style: text('style').default('default'),
  status: text('status').default('draft'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`),
});

// 发布记录表
export const publishRecords = sqliteTable('publish_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  articleId: integer('article_id').notNull(),
  platform: text('platform').notNull(),
  publishUrl: text('publish_url'),
  status: text('status').default('pending'),
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`),
});

// 发布预设表
export const publishPresets = sqliteTable('publish_presets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  platform: text('platform').notNull(),
  name: text('name').notNull(),
  author: text('author'),
  header: text('header'),
  footer: text('footer'),
  settings: text('settings', { mode: 'json' }),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`),
});

// 兑换码表
export const redeemCodes = sqliteTable('redeem_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  type: text('type').notNull(),
  duration: integer('duration').notNull(),
  isUsed: integer('is_used', { mode: 'boolean' }).default(false),
  usedBy: integer('used_by'),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`),
});

// 图片使用统计表
export const imageUsageStats = sqliteTable('image_usage_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  imageKey: text('image_key').notNull(),
  size: integer('size').notNull(),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`),
});
```

## Drizzle 配置

### drizzle.config.ts

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  driver: 'd1',
  dbCredentials: {
    wranglerConfigPath: './wrangler.toml',
    dbName: 'content_publisher_db',
  },
} satisfies Config;
```

## 数据库迁移

### 生成迁移文件

```bash
# 根据 schema 生成 SQL 迁移文件
npx drizzle-kit generate:sqlite
```

这会在 `drizzle/migrations` 目录生成 SQL 文件。

### 执行迁移

```bash
# 本地数据库
wrangler d1 execute content_publisher_db --local --file=./drizzle/migrations/0000_initial.sql

# 远程数据库（生产环境）
wrangler d1 execute content_publisher_db --remote --file=./drizzle/migrations/0000_initial.sql
```

### 批量迁移

```bash
# 创建一个脚本来执行所有迁移
for file in drizzle/migrations/*.sql; do
  echo "Applying $file..."
  wrangler d1 execute content_publisher_db --remote --file="$file"
done
```

## 在 Workers 中使用

### 初始化 Drizzle

```typescript
// src/db/index.ts
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export type Database = ReturnType<typeof initDb>;

export function initDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
```

### 在 Hono API 中使用

```typescript
// src/routes/articles.ts
import { Hono } from 'hono';
import { initDb } from '../db';
import { articles } from '../db/schema';
import { eq } from 'drizzle-orm';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// 获取所有文章
app.get('/', async (c) => {
  const db = initDb(c.env.DB);

  const allArticles = await db
    .select()
    .from(articles)
    .orderBy(articles.createdAt);

  return c.json({ articles: allArticles });
});

// 获取单篇文章
app.get('/:id', async (c) => {
  const db = initDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  const article = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .get();

  if (!article) {
    return c.json({ error: 'Article not found' }, 404);
  }

  return c.json({ article });
});

// 创建文章
app.post('/', async (c) => {
  const db = initDb(c.env.DB);
  const { title, content, style, userId } = await c.req.json();

  const result = await db
    .insert(articles)
    .values({
      userId,
      title,
      content,
      style,
      status: 'draft',
    })
    .returning();

  return c.json({ article: result[0] }, 201);
});

// 更新文章
app.put('/:id', async (c) => {
  const db = initDb(c.env.DB);
  const id = parseInt(c.req.param('id'));
  const { title, content, style, status } = await c.req.json();

  const result = await db
    .update(articles)
    .set({
      title,
      content,
      style,
      status,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id))
    .returning();

  return c.json({ article: result[0] });
});

// 删除文章
app.delete('/:id', async (c) => {
  const db = initDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  await db
    .delete(articles)
    .where(eq(articles.id, id));

  return c.json({ success: true });
});

export default app;
```

## 高级查询

### 关联查询

```typescript
import { eq } from 'drizzle-orm';

// 查询用户及其文章
const usersWithArticles = await db
  .select()
  .from(users)
  .leftJoin(articles, eq(users.id, articles.userId))
  .where(eq(users.id, userId));
```

### 聚合查询

```typescript
import { count, sum } from 'drizzle-orm';

// 统计用户文章数量
const articleCount = await db
  .select({ count: count() })
  .from(articles)
  .where(eq(articles.userId, userId))
  .get();

// 统计用户图片使用量
const imageUsage = await db
  .select({ total: sum(imageUsageStats.size) })
  .from(imageUsageStats)
  .where(eq(imageUsageStats.userId, userId))
  .get();
```

### 分页查询

```typescript
// 分页获取文章
app.get('/articles', async (c) => {
  const db = initDb(c.env.DB);
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '10');

  const offset = (page - 1) * pageSize;

  const results = await db
    .select()
    .from(articles)
    .limit(pageSize)
    .offset(offset)
    .orderBy(articles.createdAt);

  const total = await db
    .select({ count: count() })
    .from(articles)
    .get();

  return c.json({
    articles: results,
    pagination: {
      page,
      pageSize,
      total: total.count,
      totalPages: Math.ceil(total.count / pageSize),
    },
  });
});
```

### 事务处理

```typescript
import { eq } from 'drizzle-orm';

// 发布文章并创建记录（事务）
app.post('/articles/:id/publish', async (c) => {
  const db = initDb(c.env.DB);
  const id = parseInt(c.req.param('id'));
  const { platform, publishUrl } = await c.req.json();

  // D1 暂不支持事务，需要手动处理
  try {
    // 更新文章状态
    await db
      .update(articles)
      .set({ status: 'published' })
      .where(eq(articles.id, id));

    // 创建发布记录
    await db
      .insert(publishRecords)
      .values({
        articleId: id,
        platform,
        publishUrl,
        status: 'success',
      });

    return c.json({ success: true });
  } catch (error) {
    // 回滚需要手动处理
    return c.json({ error: error.message }, 500);
  }
});
```

## 本地开发

### 使用本地 D1 数据库

```bash
# 创建本地数据库
wrangler d1 execute content_publisher_db --local --command="SELECT 1"

# 执行迁移
wrangler d1 execute content_publisher_db --local --file=./drizzle/migrations/0000_initial.sql

# 启动本地开发服务器
wrangler dev
```

### 使用 Drizzle Studio（可视化工具）

```bash
# 安装
npm install -D drizzle-kit

# 启动 Studio（仅支持远程 D1）
npx drizzle-kit studio
```

## 数据库管理

### 查询数据

```bash
# 执行 SQL 查询
wrangler d1 execute content_publisher_db --command="SELECT * FROM users"

# 远程查询
wrangler d1 execute content_publisher_db --remote --command="SELECT COUNT(*) FROM articles"
```

### 导出数据

```bash
# 导出整个数据库
wrangler d1 export content_publisher_db --output=backup.sql
```

### 导入数据

```bash
# 导入 SQL 文件
wrangler d1 execute content_publisher_db --file=backup.sql
```

## 性能优化

### 添加索引

```typescript
// src/db/schema.ts
import { index } from 'drizzle-orm/sqlite-core';

export const articles = sqliteTable('articles', {
  // ... 字段定义
}, (table) => ({
  // 为 userId 添加索引
  userIdIdx: index('user_id_idx').on(table.userId),
  // 为 status 和 createdAt 添加复合索引
  statusCreatedIdx: index('status_created_idx').on(table.status, table.createdAt),
}));
```

### 使用 Prepared Statements

```typescript
// 准备查询语句
const getUserArticles = db
  .select()
  .from(articles)
  .where(eq(articles.userId, sql.placeholder('userId')))
  .prepare();

// 执行查询
const results = await getUserArticles.execute({ userId: 123 });
```

## 限制与注意事项

### D1 限制（截至 2024）

- ✅ **免费额度**: 每天 100,000 次读取 + 50,000 次写入
- ✅ **数据库大小**: 最大 2GB（免费版）
- ❌ **不支持事务**（目前）
- ❌ **不支持外键约束**
- ✅ **支持全文搜索**（FTS5）

### 最佳实践

1. **使用索引**: 为常查询字段添加索引
2. **批量操作**: 使用批量插入代替单条插入
3. **避免大查询**: 使用分页和限制
4. **缓存结果**: 使用 KV 缓存频繁查询的数据

## 迁移检查清单

- [ ] 创建 D1 数据库
- [ ] 配置 wrangler.toml
- [ ] 定义 Drizzle Schema
- [ ] 生成迁移文件
- [ ] 执行本地迁移测试
- [ ] 执行远程迁移
- [ ] 更新 API 代码使用 Drizzle
- [ ] 添加必要的索引
- [ ] 测试所有 CRUD 操作
- [ ] 设置数据备份策略

## 参考资源

- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [Drizzle Kit 文档](https://orm.drizzle.team/kit-docs/overview)
- [SQLite 文档](https://www.sqlite.org/docs.html)
