---
name: deployment-guide
description: 完整部署指南。包含前端部署、后端部署、MCP 服务器部署、环境配置、CI/CD。(project)
---

# 部署指南

## 使用场景

部署应用到生产环境时使用此 Skill。

---

## ⚠️ 关键配置 - 项目名称

**重要提醒**: 前端和后端使用不同的项目名称!

### 前端 (Frontend)
- **Cloudflare Pages 项目名**: `nano-ai` ⚠️
- **部署命令**: `npx wrangler pages deploy dist --project-name=nano-ai`
- **生产 URL**: https://www.nanobananamaker.com
- **配置文件**: `frontend/wrangler.toml` (name 字段被忽略)

### 后端 (Backend)
- **Cloudflare Workers 项目名**: `nano-ai-api` ⚠️
- **部署命令**: `npx wrangler deploy`
- **生产 URL**: https://nano-ai-api.249068302.workers.dev
- **配置文件**: `backend/wrangler.toml` (使用 name 字段)

### 快速记忆
```
前端 → nano-ai (Pages 项目)
后端 → nano-ai-api (Workers 项目)
```

---

## 前端部署（Cloudflare Pages）

### 重要: 项目名称是 `nano-ai`

### 1. 本地构建
```bash
cd frontend
npm run build
npm run preview  # 可选: 本地预览
```

### 2. 手动部署到 Cloudflare Pages
```bash
cd frontend
npx wrangler pages deploy dist --project-name=nano-ai
```

⚠️ **注意**: 必须使用 `--project-name=nano-ai`,不是 `nano-ai-frontend`!

### 3. 环境变量
在 Pages 仪表板或 wrangler.toml 设置：
```toml
[vars]
VITE_API_URL = "https://nano-ai-api.249068302.workers.dev"
VITE_SUPABASE_URL = "https://dsxowflwwyagymsmlyyc.supabase.co"
VITE_SUPABASE_ANON_KEY = "sb_publishable_LsRYCwTQ6Z6C7tAJI10BmA_mHjVL3zJ"
VITE_CLERK_PUBLISHABLE_KEY = "pk_live_Y2xlcmsubmFub2JhbmFuYW1ha2VyLmNvbSQ"
```

### 4. 部署后验证
```bash
# 访问生产 URL
curl https://www.nanobananamaker.com

# 检查 API 连接
curl https://www.nanobananamaker.com/health
```

## 后端部署（Cloudflare Workers）

### 重要: 项目名称是 `nano-ai-api`

### 1. 本地测试
```bash
cd backend
npm run dev
# 访问 http://localhost:8787
```

### 2. 构建和部署
```bash
cd backend
npm run build
npx wrangler deploy
```

⚠️ **注意**: wrangler.toml 中的 `name = "nano-ai-api"` 决定部署名称

### 3. 环境变量配置
在 wrangler.toml 中已配置:
```toml
name = "nano-ai-api"
account_id = "249068302"

[vars]
SUPABASE_URL = "https://dsxowflwwyagymsmlyyc.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_LsRYCwTQ6Z6C7tAJI10BmA_mHjVL3zJ"
R2_PUBLIC_URL = "https://img.nanobananacanvas.com"
```

### 4. 部署后验证
```bash
# 健康检查
curl https://nano-ai-api.249068302.workers.dev/health

# 测试 API 路由
curl https://nano-ai-api.249068302.workers.dev/api/prompts

# 测试图片分享路由
curl -H "User-Agent: Twitterbot/1.0" \
  https://nano-ai-api.249068302.workers.dev/share/image/your-prompt-id
```

### 5. 监控日志
```bash
npx wrangler tail nano-ai-api
```

## MCP 服务器部署

### 1. 本地构建
```bash
cd mcp-server
npm install
npm run build
```

### 2. 使用 PM2
```bash
pm2 start npm --name "mcp-server" -- start
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs mcp-server
```

### 3. 使用 Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t mcp-server .
docker run -d -p 3000:3000 -e SUPABASE_URL=xxx mcp-server
```

### 4. 环境变量
```bash
export SUPABASE_URL=xxx
export SUPABASE_KEY=xxx
npm start
```

## 数据库迁移

```bash
# 在 mcp-server 中
npm run db:migrate

# 或手动执行 SQL
psql -h $SUPABASE_HOST -U $SUPABASE_USER -d postgres -f scripts/add-processed-field.sql
```

## CI/CD 流程

### GitHub Actions（可选）
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy Frontend
        run: |
          cd frontend
          npm install
          npm run build
          npm run deploy
        env:
          CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}

      - name: Deploy Backend
        run: |
          cd backend
          npm install
          npm run build
          npm run deploy
        env:
          CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
```

## 完整部署流程

### 推荐顺序: 先后端,后前端

#### 步骤 1: 部署后端
```bash
cd backend
npm run build
npx wrangler deploy
# 验证: curl https://nano-ai-api.249068302.workers.dev/health
```

#### 步骤 2: 部署前端
```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=nano-ai
# 验证: curl https://www.nanobananamaker.com
```

---

## 部署检查清单

### 部署前检查
- [ ] 代码已提交到 Git
- [ ] 前端构建成功 (`cd frontend && npm run build`)
- [ ] 后端构建成功 (`cd backend && npm run build`)
- [ ] 环境变量已配置 (wrangler.toml)
- [ ] **确认项目名称**: 前端=nano-ai, 后端=nano-ai-api

### 部署后验证
- [ ] 前端首页正常访问 (https://www.nanobananamaker.com)
- [ ] 后端健康检查正常 (/health)
- [ ] API 路由正常响应 (/api/prompts)
- [ ] 推特分享功能测试 (点击分享按钮)
- [ ] 图片分享路由测试 (/share/image/:id)
- [ ] 使用 Twitter Card Validator 验证 meta 标签
- [ ] 日志无错误 (npx wrangler tail)

### 新功能验证 (2025-12-05)
- [ ] 测试 SEO 渲染中间件 (爬虫访问 /prompt/:id)
- [ ] 测试图片分享路由 (/share/image/:id)
- [ ] 验证推特卡片预览显示正确

## 常见问题

### ❌ 部署到错误的项目名

**问题**: 前端部署到了 `nano-ai-frontend` 而不是 `nano-ai`

**解决**:
```bash
cd frontend
npx wrangler pages deploy dist --project-name=nano-ai
```

### ❌ 后端 API 404

**问题**: 前端无法连接到后端 API

**检查**:
1. 后端是否部署成功
   ```bash
   curl https://nano-ai-api.249068302.workers.dev/health
   ```
2. 前端 `VITE_API_URL` 是否正确
3. CORS 配置是否允许前端域名

### ❌ 推特卡片不显示

**问题**: 分享到推特时没有图片预览

**检查**:
1. 后端 `/share/image/:id` 路由是否正常
   ```bash
   curl -H "User-Agent: Twitterbot/1.0" \
     https://www.nanobananamaker.com/share/image/test-id
   ```
2. 使用 Twitter Card Validator 测试
   ```
   https://cards-dev.twitter.com/validator
   ```
3. 清除推特缓存 (在 URL 后加 `?v=1`)

### ❌ 前端构建失败
```bash
# 清理缓存重试
cd frontend
rm -rf dist node_modules
npm install
npm run build
```

### ❌ 环境变量未生效
```bash
# 检查 wrangler.toml 中的 [vars] 配置
# Pages 部署后需要在仪表板中设置
# Workers 直接读取 wrangler.toml
```

## 回滚

```bash
# Workers 回滚
wrangler rollback --env production

# Pages 回滚
# 在 Cloudflare 仪表板选择之前的版本
```
