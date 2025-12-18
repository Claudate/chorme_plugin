---
name: config-management
description: 配置文件管理和环境变量设置指南。包含前端 Vite 配置、后端 wrangler 配置、MCP 服务器 .env 配置。(project)
---

# 配置管理快速指南

## 使用场景

当你需要管理项目配置文件和环境变量时使用此 Skill。

**适用场景**：
- 配置环境变量
- 设置开发/生产环境
- 集成 API 密钥
- 配置数据库连接
- 配置第三方服务

---

## 前端配置（Vite）

### 环境变量文件结构

```
frontend/
├── .env                   # 本地环境（开发）
├── .env.production        # 生产环境
└── .env.example          # 示例（提交到 git）
```

### .env 文件示例

```bash
# frontend/.env
VITE_API_URL=http://localhost:8787
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
```

### 在代码中使用环境变量

```typescript
// frontend/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// 类型安全的环境变量
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Vite 配置文件

```typescript
// frontend/vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8787',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
```

---

## 后端配置（Cloudflare Workers）

### wrangler.toml 配置

```toml
# backend/wrangler.toml
name = "nano-ai-backend"
type = "service"
account_id = "your_account_id"
workers_dev = true

# 路由配置
routes = [
  { pattern = "api.example.com/*", zone_id = "your_zone_id" }
]

# 环境配置
[env.development]
name = "nano-ai-backend-dev"
vars = { ENVIRONMENT = "development" }
kv_namespaces = [
  { binding = "CACHE", id = "dev_cache_id", preview_id = "dev_cache_preview_id" }
]
d1_databases = [
  { binding = "DB", database_id = "dev_db_id", preview_id = "dev_db_preview_id" }
]

[env.production]
name = "nano-ai-backend-prod"
vars = { ENVIRONMENT = "production" }
kv_namespaces = [
  { binding = "CACHE", id = "prod_cache_id", preview_id = "prod_cache_preview_id" }
]
d1_databases = [
  { binding = "DB", database_id = "prod_db_id", preview_id = "prod_db_preview_id" }
]

# 构建配置
build = { cwd = ".", command = "npm run build" }
compatibility_date = "2024-01-01"
```

### 环境变量和密钥配置

```bash
# 列出所有环境变量
wrangler secret list

# 设置开发环境密钥
wrangler secret put SUPABASE_URL --env development
wrangler secret put SUPABASE_KEY --env development

# 设置生产环境密钥
wrangler secret put SUPABASE_URL --env production
wrangler secret put SUPABASE_KEY --env production
```

### 在代码中使用环境变量

```typescript
// backend/src/index.ts
import { Hono } from 'hono';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  ENVIRONMENT: 'development' | 'production';
  CACHE: KVNamespace;
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/health', (c) => {
  const env = c.env;
  return c.json({
    status: 'ok',
    environment: env.ENVIRONMENT,
  });
});

// 使用 KV 存储
app.get('/cache/:key', async (c) => {
  const key = c.req.param('key');
  const value = await c.env.CACHE.get(key);
  return c.json({ key, value });
});

export default app;
```

---

## MCP 服务器配置

### .env 文件结构

```bash
# mcp-server/.env

# 数据库配置
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=xxxxx

# 翻译 API 配置
BAIDU_API_KEY=xxxxx
BAIDU_SECRET_KEY=xxxxx

GOOGLE_TRANSLATE_API_KEY=xxxxx

DEEPL_API_KEY=xxxxx

BING_TRANSLATOR_KEY=xxxxx

# 可选：日志级别
LOG_LEVEL=info
```

### 在代码中使用环境变量

```typescript
// mcp-server/src/config.ts
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_KEY || '',
  },
  translators: {
    baidu: {
      apiKey: process.env.BAIDU_API_KEY || '',
      secretKey: process.env.BAIDU_SECRET_KEY || '',
    },
    google: {
      apiKey: process.env.GOOGLE_TRANSLATE_API_KEY || '',
    },
    deepl: {
      apiKey: process.env.DEEPL_API_KEY || '',
    },
    bing: {
      apiKey: process.env.BING_TRANSLATOR_KEY || '',
    },
  },
  logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
};

// 验证必要的环境变量
export function validateConfig() {
  const required = ['SUPABASE_URL', 'SUPABASE_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

### 本地开发配置

```bash
# 运行本地开发服务器
npm run dev

# 运行批量翻译任务
npm run batch-translate

# 运行特定的翻译任务
npm run batch-translate -- --source baidu --limit 100
```

---

## 环境变量管理最佳实践

### 1. 安全原则

```typescript
// ✅ 正确：验证必要变量
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY environment variable is required');
}

// ❌ 错误：直接使用可能不存在的变量
const apiKey = process.env.API_KEY; // 可能为 undefined
```

### 2. 类型安全

```typescript
// 定义环境变量接口
interface Config {
  database: {
    url: string;
    pool: number;
  };
  api: {
    port: number;
    baseUrl: string;
  };
}

// 使用工厂函数
function loadConfig(): Config {
  return {
    database: {
      url: process.env.DATABASE_URL || '',
      pool: parseInt(process.env.DB_POOL_SIZE || '10'),
    },
    api: {
      port: parseInt(process.env.PORT || '3000'),
      baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    },
  };
}

export const config = loadConfig();
```

### 3. 开发 vs 生产

```typescript
// 检查环境
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// 条件配置
const config = isProduction ? {
  apiUrl: 'https://api.example.com',
  debug: false,
} : {
  apiUrl: 'http://localhost:8787',
  debug: true,
};
```

---

## 部署环境变量配置

### Cloudflare Workers 部署

```bash
# 部署前设置所有需要的密钥
wrangler secret put SUPABASE_URL --env production
wrangler secret put SUPABASE_KEY --env production

# 部署到生产环境
wrangler deploy --env production

# 验证部署
wrangler secret list --env production
```

### 前端部署（Cloudflare Pages）

```bash
# 在 Pages 构建设置中配置环境变量
# Pages 仪表板 → 设置 → 环境变量

# 构建命令
npm run build

# 输出文件夹
dist

# 环境变量（在 Pages 控制面板设置）
VITE_API_URL=https://api.example.com
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
```

### MCP 服务器部署

```bash
# 本地验证
npm run build
npm start

# 部署到服务器（示例使用 PM2）
pm2 start npm --name "mcp-server" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs mcp-server
```

---

## 常见问题排查

### 1. 环境变量未加载

```bash
# 检查 .env 文件是否存在
ls -la .env

# 检查 Vite 是否正确加载环境变量
console.log(import.meta.env)

# 确保环境变量名称以 VITE_ 开头（Vite 特定）
```

### 2. 密钥泄露风险

```bash
# 将 .env 添加到 .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# 提交 .env.example 作为参考（不含实际值）
VITE_API_URL=http://localhost:8787
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

### 3. 跨环境变量一致性

```bash
# 使用配置模式统一管理
frontend/
├── .env               # 本地开发
├── .env.staging       # 测试环境
└── .env.production    # 生产环境

# 运行特定环境的构建
npm run build -- --mode staging
npm run build -- --mode production
```

---

## 配置检查清单

部署前检查：
- [ ] 所有必要的环境变量已设置
- [ ] 敏感信息（密钥、密码）未提交到 git
- [ ] .env 文件在 .gitignore 中
- [ ] .env.example 包含所有必要变量（不含实际值）
- [ ] 生产环境使用了强加密密钥
- [ ] 所有 API 密钥限制了权限和使用场景
- [ ] 在本地、测试和生产环境中进行了测试
- [ ] 日志中没有泄露敏感信息
