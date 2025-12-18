# Cloudflare Pages 前端部署指南

将 Next.js 应用部署到 Cloudflare Pages，支持 SSR 和 Edge Runtime。

## 技术栈

- **平台**: Cloudflare Pages
- **框架**: Next.js 15 (App Router)
- **运行时**: Cloudflare Workers（Edge Runtime）
- **适配器**: @cloudflare/next-on-pages
- **构建工具**: Wrangler CLI

## 快速开始

### 1. 安装依赖

```bash
npm install -D @cloudflare/next-on-pages
npm install -g wrangler
```

### 2. 配置 next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 禁用图片优化（Cloudflare Pages 不支持）
  images: {
    unoptimized: true,
  },

  // 输出为 standalone
  output: 'standalone',

  // 实验性功能
  experimental: {
    runtime: 'edge',
  },
};

module.exports = nextConfig;
```

### 3. 配置 package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "pages:build": "npx @cloudflare/next-on-pages",
    "preview": "npm run pages:build && wrangler pages dev",
    "deploy": "npm run pages:build && wrangler pages deploy"
  }
}
```

## 部署方式

### 方式 1: 通过 Git 自动部署（推荐）

#### 步骤 1: 推送代码到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

#### 步骤 2: 连接到 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择 `Workers & Pages`
3. 点击 `Create application` → `Pages` → `Connect to Git`
4. 授权 GitHub 并选择仓库
5. 配置构建设置：
   - **Framework preset**: Next.js
   - **Build command**: `npx @cloudflare/next-on-pages`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/`（如果项目在根目录）

#### 步骤 3: 配置环境变量

在 Pages 项目设置中添加：

```bash
# 数据库
DATABASE_URL=your-d1-database-url

# 认证
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-domain.pages.dev

# R2 存储
R2_BUCKET_NAME=content-images

# 其他变量
OPENAI_API_KEY=sk-...
```

#### 步骤 4: 部署

推送代码到 main 分支会自动触发部署：

```bash
git add .
git commit -m "Deploy to Cloudflare Pages"
git push origin main
```

### 方式 2: 使用 Wrangler CLI 手动部署

#### 步骤 1: 登录 Wrangler

```bash
wrangler login
```

#### 步骤 2: 构建项目

```bash
npm run pages:build
```

#### 步骤 3: 创建 Pages 项目

```bash
wrangler pages project create content-publisher
```

#### 步骤 4: 部署

```bash
wrangler pages deploy .vercel/output/static --project-name=content-publisher
```

## 配置绑定（Bindings）

### D1 数据库绑定

创建 `wrangler.toml` 或在 Pages 设置中配置：

```toml
[[d1_databases]]
binding = "DB"
database_name = "content_db"
database_id = "your-database-id"
```

在代码中使用：

```typescript
// app/api/articles/route.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  // 通过环境变量访问
  const db = (process.env as any).DB;

  const { results } = await db.prepare(
    'SELECT * FROM articles'
  ).all();

  return Response.json({ articles: results });
}
```

### R2 存储绑定

```toml
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "content-images"
```

使用示例：

```typescript
// app/api/upload/route.ts
export const runtime = 'edge';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  const bucket = (process.env as any).IMAGES;
  const fileName = `${Date.now()}-${file.name}`;

  await bucket.put(fileName, file.stream());

  return Response.json({
    url: `https://your-r2-domain.com/${fileName}`
  });
}
```

### KV 命名空间绑定

```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "your-kv-id"
```

## 兼容性调整

### 1. 图片优化

Cloudflare Pages 不支持 Next.js 图片优化，需要禁用：

```javascript
// next.config.js
module.exports = {
  images: {
    unoptimized: true,
    // 或使用外部 loader
    loader: 'custom',
    loaderFile: './imageLoader.js',
  },
};
```

```javascript
// imageLoader.js
export default function cloudflareImageLoader({ src, width, quality }) {
  // 使用 Cloudflare Images 或 R2
  return `https://your-cdn.com/${src}?w=${width}&q=${quality || 75}`;
}
```

### 2. API Routes 必须使用 Edge Runtime

```typescript
// app/api/*/route.ts
export const runtime = 'edge'; // 必须添加
```

### 3. 中间件配置

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

export function middleware(request: NextRequest) {
  // 在 Edge Runtime 中运行
  return NextResponse.next();
}
```

### 4. 不支持的 Next.js 功能

以下功能在 Cloudflare Pages 上**不可用**：

- ❌ `next/image` 优化
- ❌ `getStaticProps` / `getServerSideProps`（使用 App Router 代替）
- ❌ Incremental Static Regeneration (ISR)
- ❌ 服务器端 Node.js 模块（fs, path 等）

## 环境变量管理

### 通过 Wrangler CLI 设置

```bash
# 生产环境
wrangler pages secret put NEXTAUTH_SECRET --project-name=content-publisher

# 预览环境
wrangler pages secret put NEXTAUTH_SECRET --project-name=content-publisher --env=preview
```

### 通过 Dashboard 设置

1. 进入 Pages 项目
2. `Settings` → `Environment variables`
3. 添加变量（支持生产和预览环境分离）

## 自定义域名

### 步骤 1: 添加域名

1. 在 Pages 项目中，点击 `Custom domains`
2. 点击 `Set up a custom domain`
3. 输入域名（例如：`app.yourdomain.com`）

### 步骤 2: 配置 DNS

如果域名在 Cloudflare 托管，会自动配置。否则需要添加 CNAME 记录：

```
CNAME  app  your-project.pages.dev
```

### 步骤 3: 等待 SSL 证书生成

Cloudflare 会自动为自定义域名生成 SSL 证书。

## 性能优化

### 1. 启用缓存

```typescript
// app/api/articles/route.ts
export async function GET(request: Request) {
  const articles = await fetchArticles();

  return new Response(JSON.stringify(articles), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  });
}
```

### 2. 使用 Edge Config

```typescript
// 在边缘存储配置
export const runtime = 'edge';

export async function GET() {
  const config = await fetch('https://edge-config-url.com/config.json');
  return Response.json(await config.json());
}
```

### 3. 预取静态资源

```javascript
// next.config.js
module.exports = {
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  compress: true,
};
```

## 监控和日志

### 查看日志

```bash
# 实时日志
wrangler pages deployment tail

# 查看部署列表
wrangler pages deployment list --project-name=content-publisher
```

### 使用 Cloudflare Analytics

在 Pages Dashboard 中查看：
- 请求数量
- 带宽使用
- 响应时间
- 错误率

## 本地开发

### 使用 Wrangler Dev

```bash
# 构建并预览
npm run preview

# 或分步执行
npm run pages:build
wrangler pages dev .vercel/output/static
```

### 绑定本地服务

```bash
# 绑定本地 D1 数据库
wrangler pages dev .vercel/output/static --d1=DB=local-db

# 绑定本地 R2
wrangler pages dev .vercel/output/static --r2=IMAGES=local-images
```

## 回滚部署

```bash
# 列出所有部署
wrangler pages deployment list --project-name=content-publisher

# 回滚到特定部署
wrangler pages deployment rollback <deployment-id> --project-name=content-publisher
```

## 多环境管理

### 生产环境

```bash
git push origin main  # 自动部署到生产环境
```

### 预览环境

```bash
# 任何非 main 分支都会创建预览部署
git checkout -b feature/new-feature
git push origin feature/new-feature
```

Cloudflare 会为每个预览部署生成唯一 URL：
`https://<commit-hash>.<project-name>.pages.dev`

## 常见问题

### Q1: 部署失败 - "Module not found"

**解决方案**：
```bash
# 确保所有依赖都在 dependencies，不是 devDependencies
npm install <package> --save
```

### Q2: Edge Runtime 不支持 Node.js API

**解决方案**：
使用 Cloudflare 替代方案：
- `fs` → R2 Storage
- `crypto` → Web Crypto API
- `process.env` → Cloudflare Bindings

### Q3: 图片加载失败

**解决方案**：
```javascript
// next.config.js
module.exports = {
  images: {
    unoptimized: true,
  },
};
```

## 部署检查清单

- [ ] 安装 `@cloudflare/next-on-pages`
- [ ] 配置 `next.config.js`（禁用图片优化）
- [ ] 所有 API Routes 添加 `export const runtime = 'edge'`
- [ ] 创建 Cloudflare Pages 项目
- [ ] 配置环境变量
- [ ] 设置 D1/R2/KV 绑定
- [ ] 测试本地构建 `npm run preview`
- [ ] 推送到 Git 或使用 Wrangler 部署
- [ ] 配置自定义域名
- [ ] 验证所有功能正常

## 参考资源

- [@cloudflare/next-on-pages 文档](https://github.com/cloudflare/next-on-pages)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Next.js Edge Runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
