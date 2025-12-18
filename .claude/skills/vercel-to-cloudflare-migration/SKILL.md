# Vercel 到 Cloudflare 迁移指南

完整迁移 Next.js 应用从 Vercel + Supabase 到 Cloudflare Pages + Workers + D1。

## 迁移概览

### 当前架构（Vercel）

```
前端: Next.js 15 → Vercel
后端: Next.js API Routes → Vercel Serverless
数据库: Supabase PostgreSQL
存储: Cloudflare R2（已使用）
认证: NextAuth.js
```

### 目标架构（Cloudflare）

```
前端: Next.js 15 → Cloudflare Pages
后端: Hono API → Cloudflare Workers
数据库: Cloudflare D1 (SQLite)
存储: Cloudflare R2（保持）
认证: JWT + Workers KV
```

## 迁移步骤

### 阶段 1: 准备工作

#### 1.1 安装必要工具

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 安装项目依赖
npm install hono drizzle-orm
npm install -D @cloudflare/next-on-pages drizzle-kit
```

#### 1.2 创建 Cloudflare 资源

```bash
# 创建 D1 数据库
wrangler d1 create content_publisher_db
# 记录 database_id

# 创建 KV 命名空间（用于会话）
wrangler kv:namespace create SESSIONS
# 记录 id

# R2 存储桶（如果还未创建）
wrangler r2 bucket create content-images
```

#### 1.3 配置 wrangler.toml

```toml
name = "content-publisher"
compatibility_date = "2024-01-01"
pages_build_output_dir = ".vercel/output/static"

[[d1_databases]]
binding = "DB"
database_name = "content_publisher_db"
database_id = "your-d1-database-id"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "content-images"

[[kv_namespaces]]
binding = "SESSIONS"
id = "your-kv-namespace-id"

[vars]
ENVIRONMENT = "production"
JWT_SECRET = "your-jwt-secret"
```

### 阶段 2: 数据库迁移

#### 2.1 导出 Supabase 数据

```bash
# 导出 PostgreSQL 数据
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" > backup.sql
```

#### 2.2 转换 Schema 到 SQLite

创建 `src/db/schema.ts`（SQLite 兼容）:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name'),
  subscription_plan: text('subscription_plan').default('free'),
  subscription_expiry: integer('subscription_expiry', { mode: 'timestamp' }),
  created_at: integer('created_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`),
  updated_at: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`),
});

// ... 其他表定义
```

#### 2.3 生成迁移文件

```bash
# 配置 drizzle.config.ts
npx drizzle-kit generate:sqlite

# 执行迁移到 D1
wrangler d1 execute content_publisher_db --file=./drizzle/migrations/0000_initial.sql
```

#### 2.4 迁移数据

由于数据格式差异，需要编写数据转换脚本：

```javascript
// scripts/migrate-data.mjs
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

// 导出用户数据
const users = await sql`SELECT * FROM users`;

// 生成 SQLite INSERT 语句
const inserts = users.map(user => {
  return `INSERT INTO users (email, password, name, subscription_plan, created_at)
          VALUES ('${user.email}', '${user.password}', '${user.name}', '${user.subscription_plan}', ${Math.floor(new Date(user.created_at).getTime() / 1000)});`;
});

// 保存到文件
fs.writeFileSync('data-migration.sql', inserts.join('\n'));

// 执行导入
// wrangler d1 execute content_publisher_db --file=./data-migration.sql
```

### 阶段 3: API 迁移

#### 3.1 创建 Workers 项目结构

```
workers/
├── src/
│   ├── index.ts              # Worker 入口
│   ├── routes/               # API 路由
│   │   ├── auth.ts
│   │   ├── articles.ts
│   │   ├── upload.ts
│   │   ├── publish.ts
│   │   └── presets.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── cors.ts
│   ├── services/
│   │   ├── db.ts
│   │   ├── storage.ts
│   │   └── converter.ts
│   └── types/
│       └── index.ts
├── wrangler.toml
└── package.json
```

#### 3.2 创建 Hono API

```typescript
// workers/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth';
import articlesRoutes from './routes/articles';

type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors({
  origin: ['https://yourdomain.com', 'https://yourdomain.pages.dev'],
  credentials: true,
}));

app.route('/api/auth', authRoutes);
app.route('/api/articles', articlesRoutes);

export default app;
```

#### 3.3 迁移 Next.js API Routes

**原 Next.js API Route:**
```typescript
// app/api/articles/route.ts (Vercel)
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const session = await getServerSession();
  const articles = await db.query.articles.findMany({
    where: eq(articles.userId, session.user.id)
  });
  return Response.json({ articles });
}
```

**迁移后的 Hono Route:**
```typescript
// workers/src/routes/articles.ts (Cloudflare)
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { initDb } from '../services/db';
import { articles } from '../db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', async (c, next) => {
  const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET });
  return jwtMiddleware(c, next);
});

app.get('/', async (c) => {
  const payload = c.get('jwtPayload');
  const db = initDb(c.env.DB);

  const userArticles = await db
    .select()
    .from(articles)
    .where(eq(articles.userId, payload.userId));

  return c.json({ articles: userArticles });
});

export default app;
```

#### 3.4 认证系统迁移

**NextAuth.js → JWT + KV:**

```typescript
// workers/src/routes/auth.ts
import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import bcrypt from 'bcryptjs';

const auth = new Hono<{ Bindings: Bindings }>();

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  const db = initDb(c.env.DB);

  // 查找用户
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .get();

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // 生成 JWT
  const token = await sign(
    { userId: user.id, email: user.email },
    c.env.JWT_SECRET
  );

  // 存储会话到 KV
  await c.env.SESSIONS.put(`session:${user.id}`, token, {
    expirationTtl: 86400 * 7 // 7 天
  });

  return c.json({ token, user });
});

export default auth;
```

### 阶段 4: 前端迁移

#### 4.1 配置 Next.js for Cloudflare Pages

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Cloudflare Pages 不支持图片优化
  },
  output: 'standalone',
  experimental: {
    runtime: 'edge',
  },
};

module.exports = nextConfig;
```

#### 4.2 更新 API 调用

```typescript
// src/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ||
  'https://api.yourdomain.workers.dev';

export async function fetchArticles() {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE_URL}/api/articles`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return res.json();
}
```

#### 4.3 更新认证逻辑

```typescript
// src/hooks/useAuth.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),

  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const { token, user } = await res.json();

    localStorage.setItem('token', token);
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));
```

### 阶段 5: 部署

#### 5.1 部署 Workers API

```bash
# 进入 workers 目录
cd workers

# 部署到 Cloudflare
wrangler deploy

# 记录 Worker URL: https://content-publisher.your-subdomain.workers.dev
```

#### 5.2 部署前端到 Pages

```bash
# 构建 Next.js for Cloudflare Pages
npm run build
npx @cloudflare/next-on-pages

# 部署
wrangler pages deploy .vercel/output/static --project-name=content-publisher

# 或通过 Git 自动部署
git push origin main
```

#### 5.3 配置环境变量

在 Cloudflare Pages 设置中：

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.workers.dev
```

在 Workers 设置中：

```bash
# 通过 wrangler secret 设置敏感信息
wrangler secret put JWT_SECRET
wrangler secret put OPENAI_API_KEY
```

#### 5.4 配置自定义域名

1. **Pages 前端域名:**
   - Pages → Custom domains → `app.yourdomain.com`

2. **Workers API 域名:**
   - Workers → Routes → `api.yourdomain.com/*`

### 阶段 6: 测试和验证

#### 6.1 功能测试清单

- [ ] 用户注册和登录
- [ ] 创建、编辑、删除文章
- [ ] 图片上传到 R2
- [ ] 内容转换
- [ ] 发布到各平台
- [ ] 订阅管理
- [ ] Chrome 扩展集成

#### 6.2 性能对比

测试关键指标：
- API 响应时间
- 首次内容绘制 (FCP)
- 最大内容绘制 (LCP)
- 冷启动时间

#### 6.3 数据一致性验证

```sql
-- 验证数据迁移完整性
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM articles;
SELECT COUNT(*) FROM publish_records;
```

### 阶段 7: 切换流量

#### 7.1 DNS 切换

```
# 原 Vercel 配置
app.yourdomain.com  CNAME  cname.vercel-dns.com

# 新 Cloudflare 配置
app.yourdomain.com  CNAME  content-publisher.pages.dev
api.yourdomain.com  CNAME  content-publisher.workers.dev
```

#### 7.2 渐进式迁移

1. **阶段 1**: 新用户使用 Cloudflare
2. **阶段 2**: 50% 流量切换
3. **阶段 3**: 100% 流量切换
4. **阶段 4**: 关闭 Vercel 服务

## 成本对比

### Vercel + Supabase

- Vercel Pro: $20/月
- Supabase Pro: $25/月
- **总计: $45/月**

### Cloudflare

- Pages: $0（免费）
- Workers: $5/月（可选）
- D1: $0（免费额度内）
- R2: $0（免费额度内）
- **总计: $0-5/月**

## 性能提升预期

- ⚡ **API 响应时间**: 减少 30-50%（边缘计算）
- ⚡ **全球延迟**: < 50ms（200+ 边缘节点）
- ⚡ **冷启动**: < 10ms（vs Vercel ~100ms）
- ⚡ **数据库查询**: 减少 20-40%（D1 本地缓存）

## 回滚计划

如果迁移出现问题，快速回滚步骤：

1. 切换 DNS 回 Vercel
2. 恢复 Supabase 数据库访问
3. 保留 Cloudflare 环境用于调试

## 迁移检查清单

### 准备阶段
- [ ] 备份 Supabase 数据
- [ ] 安装 Wrangler CLI
- [ ] 创建 D1 数据库
- [ ] 创建 KV 命名空间
- [ ] 配置 wrangler.toml

### 开发阶段
- [ ] 转换数据库 Schema
- [ ] 迁移 API Routes 到 Hono
- [ ] 替换 NextAuth 为 JWT
- [ ] 更新前端 API 调用
- [ ] 配置 Next.js for Cloudflare
- [ ] 本地测试所有功能

### 部署阶段
- [ ] 部署 Workers API
- [ ] 部署 Pages 前端
- [ ] 配置环境变量
- [ ] 设置自定义域名
- [ ] 执行数据迁移
- [ ] 全面测试

### 上线阶段
- [ ] 更新 DNS 记录
- [ ] 监控错误日志
- [ ] 性能监控
- [ ] 用户反馈收集
- [ ] 保留 Vercel 作为备份

## 常见问题

### Q1: D1 性能是否足够？

D1 目前是 Beta 版本，但对于中小型应用完全足够。如需更高性能，可考虑：
- 使用 Workers KV 缓存热数据
- 使用 Durable Objects 处理实时数据

### Q2: 如何处理大文件上传？

Cloudflare Workers 有 100MB 请求限制，大文件上传建议：
- 使用 R2 预签名 URL 直传
- 分块上传

### Q3: Next.js 哪些功能不支持？

- ❌ `next/image` 优化（使用 `unoptimized: true`）
- ❌ ISR（Incremental Static Regeneration）
- ✅ SSR（支持，通过 Edge Runtime）
- ✅ API Routes（需改为 `export const runtime = 'edge'`）

## 参考资源

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [D1 数据库文档](https://developers.cloudflare.com/d1/)
- [Hono 框架文档](https://hono.dev/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)
