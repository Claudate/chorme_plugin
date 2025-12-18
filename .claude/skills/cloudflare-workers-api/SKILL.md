# Cloudflare Workers API 开发指南

将 Next.js 应用迁移到 Cloudflare Workers，使用 Hono 框架构建高性能 API。

## 技术栈

- **运行时**: Cloudflare Workers（Edge Runtime）
- **框架**: Hono（轻量级 Web 框架）
- **数据库**: Cloudflare D1（SQLite）
- **ORM**: Drizzle ORM
- **存储**: Cloudflare R2
- **认证**: JWT + Workers KV
- **工具**: Wrangler CLI

## 项目结构

```
workers/
├── src/
│   ├── index.ts              # Worker 入口
│   ├── routes/               # API 路由
│   │   ├── auth.ts          # 认证路由
│   │   ├── articles.ts      # 文章 CRUD
│   │   ├── upload.ts        # 文件上传
│   │   └── publish.ts       # 发布逻辑
│   ├── middleware/           # 中间件
│   │   ├── auth.ts          # JWT 验证
│   │   └── cors.ts          # CORS 处理
│   ├── services/             # 业务逻辑
│   │   ├── db.ts            # 数据库服务
│   │   ├── storage.ts       # R2 存储
│   │   └── converter.ts     # 内容转换
│   └── types/                # TypeScript 类型
├── wrangler.toml             # Wrangler 配置
└── package.json
```

## Wrangler 配置示例

```toml
name = "content-publisher-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# D1 数据库绑定
[[d1_databases]]
binding = "DB"
database_name = "content_db"
database_id = "your-database-id"

# R2 存储绑定
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "content-images"

# KV 命名空间（用于会话存储）
[[kv_namespaces]]
binding = "SESSIONS"
id = "your-kv-id"

# 环境变量
[vars]
ENVIRONMENT = "production"
JWT_SECRET = "your-jwt-secret"
```

## Hono API 路由示例

### 基础设置

```typescript
// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import authRoutes from './routes/auth';
import articlesRoutes from './routes/articles';

type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS 中间件
app.use('/*', cors({
  origin: ['https://yourdomain.com'],
  credentials: true,
}));

// 路由
app.route('/auth', authRoutes);
app.route('/articles', articlesRoutes);

export default app;
```

### 认证路由

```typescript
// src/routes/auth.ts
import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';

const auth = new Hono<{ Bindings: Bindings }>();

// 注册
auth.post('/register', async (c) => {
  const { email, password, name } = await c.req.json();

  // 哈希密码
  const hashedPassword = await bcrypt.hash(password, 10);

  // 插入用户
  const result = await c.env.DB.prepare(
    'INSERT INTO users (email, password, name) VALUES (?, ?, ?)'
  ).bind(email, hashedPassword, name).run();

  return c.json({ success: true, userId: result.meta.last_row_id });
});

// 登录
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();

  // 查找用户
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  ).bind(email).first();

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // 验证密码
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // 生成 JWT
  const token = await sign(
    { userId: user.id, email: user.email },
    c.env.JWT_SECRET
  );

  return c.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

export default auth;
```

### 文章路由（带认证）

```typescript
// src/routes/articles.ts
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';

const articles = new Hono<{ Bindings: Bindings }>();

// JWT 认证中间件
articles.use('/*', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
});

// 获取所有文章
articles.get('/', async (c) => {
  const payload = c.get('jwtPayload');

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM articles WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(payload.userId).all();

  return c.json({ articles: results });
});

// 创建文章
articles.post('/', async (c) => {
  const payload = c.get('jwtPayload');
  const { title, content, style } = await c.req.json();

  const result = await c.env.DB.prepare(
    'INSERT INTO articles (user_id, title, content, style) VALUES (?, ?, ?, ?)'
  ).bind(payload.userId, title, content, style).run();

  return c.json({ id: result.meta.last_row_id }, 201);
});

// 更新文章
articles.put('/:id', async (c) => {
  const payload = c.get('jwtPayload');
  const id = c.req.param('id');
  const { title, content, style } = await c.req.json();

  await c.env.DB.prepare(
    'UPDATE articles SET title = ?, content = ?, style = ? WHERE id = ? AND user_id = ?'
  ).bind(title, content, style, id, payload.userId).run();

  return c.json({ success: true });
});

export default articles;
```

## D1 数据库集成

### 使用 Drizzle ORM

```typescript
// src/services/db.ts
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

// 使用示例
articles.get('/', async (c) => {
  const db = getDb(c.env.DB);
  const articles = await db.select().from(schema.articles).all();
  return c.json({ articles });
});
```

### Schema 定义

```typescript
// src/services/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name'),
  subscription_plan: text('subscription_plan').default('free'),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const articles = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  style: text('style').default('default'),
  status: text('status').default('draft'),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

## R2 文件上传

```typescript
// src/routes/upload.ts
import { Hono } from 'hono';

const upload = new Hono<{ Bindings: Bindings }>();

upload.post('/', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }

  const fileName = `${Date.now()}-${file.name}`;

  // 上传到 R2
  await c.env.IMAGES.put(fileName, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  });

  const url = `https://your-r2-domain.com/${fileName}`;

  return c.json({ url });
});

export default upload;
```

## 部署命令

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录
wrangler login

# 创建 D1 数据库
wrangler d1 create content_db

# 创建 R2 存储桶
wrangler r2 bucket create content-images

# 创建 KV 命名空间
wrangler kv:namespace create SESSIONS

# 运行数据库迁移
wrangler d1 execute content_db --file=./schema.sql

# 本地开发
npm run dev
# 或
wrangler dev

# 部署到生产环境
npm run deploy
# 或
wrangler deploy
```

## 环境变量管理

```bash
# 设置 Secret（敏感信息）
wrangler secret put JWT_SECRET
wrangler secret put OPENAI_API_KEY

# 在 wrangler.toml 中设置普通变量
[vars]
ENVIRONMENT = "production"
APP_URL = "https://yourdomain.com"
```

## 错误处理

```typescript
// 全局错误处理
app.onError((err, c) => {
  console.error(err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message
  }, 500);
});

// 404 处理
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});
```

## 性能优化

### 缓存策略

```typescript
// 使用 Workers KV 缓存
articles.get('/:id', async (c) => {
  const id = c.req.param('id');

  // 尝试从缓存读取
  const cached = await c.env.CACHE.get(`article:${id}`);
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  // 从数据库查询
  const article = await c.env.DB.prepare(
    'SELECT * FROM articles WHERE id = ?'
  ).bind(id).first();

  // 缓存结果（TTL 1小时）
  await c.env.CACHE.put(
    `article:${id}`,
    JSON.stringify(article),
    { expirationTtl: 3600 }
  );

  return c.json(article);
});
```

## 测试

```typescript
// tests/auth.test.ts
import { describe, it, expect } from 'vitest';

describe('Auth API', () => {
  it('should register new user', async () => {
    const res = await app.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
```

## 迁移检查清单

- [ ] 安装 Wrangler CLI
- [ ] 创建 D1 数据库
- [ ] 创建 R2 存储桶
- [ ] 创建 KV 命名空间
- [ ] 迁移数据库 Schema
- [ ] 将 Next.js API Routes 转换为 Hono 路由
- [ ] 替换 NextAuth.js 为 JWT + KV
- [ ] 更新前端 API 调用地址
- [ ] 配置 CORS
- [ ] 设置环境变量和 Secrets
- [ ] 本地测试
- [ ] 部署到生产环境

## 注意事项

1. **Cold Start**: Workers 冷启动非常快（< 10ms）
2. **限制**: 每个请求 CPU 时间限制 50ms（付费版 CPU Unbound）
3. **数据库**: D1 目前是 Beta 版本，生产使用需谨慎
4. **文件大小**: Worker 脚本限制 1MB（付费版 10MB）
5. **请求大小**: 最大 100MB

## 参考资源

- [Hono 文档](https://hono.dev/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
- [R2 存储文档](https://developers.cloudflare.com/r2/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
