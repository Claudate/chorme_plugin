# 部署指南 - 多平台内容发布工具

本指南将帮助您将项目部署到自己的服务器或云平台。

## 目录
- [准备工作](#准备工作)
- [数据库设置 (Supabase)](#数据库设置-supabase)
- [文件存储设置](#文件存储设置)
- [本地开发](#本地开发)
- [部署到 Vercel](#部署到-vercel)
- [部署到自己的服务器](#部署到自己的服务器)
- [Chrome 扩展部署](#chrome-扩展部署)
- [环境变量配置](#环境变量配置)
- [常见问题](#常见问题)

---

## 准备工作

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd content-publisher
```

### 2. 安装依赖

```bash
npm install
```

### 3. 复制环境变量模板

```bash
cp .env.example .env.local
```

---

## 数据库设置 (Supabase)

### 步骤 1: 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 点击 "Start your project"
3. 创建新项目：
   - Project name: `content-publisher`
   - Database Password: 设置一个强密码（请记住）
   - Region: 选择离您最近的区域

### 步骤 2: 获取数据库连接信息

在 Supabase Dashboard 中：

1. 进入 `Project Settings` → `Database`
2. 在 "Connection string" 部分，选择 **"Connection pooling"**
3. 复制连接字符串（应该类似于）：
   ```
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

### 步骤 3: 配置环境变量

在 `.env.local` 文件中：

```bash
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
SUPABASE_URL="https://[project-ref].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 步骤 4: 运行数据库迁移

```bash
# 生成迁移文件
npm run db:generate

# 推送到数据库
npm run db:push
```

### 步骤 5: 验证数据库

在 Supabase Dashboard 中：

1. 进入 `Table Editor`
2. 应该能看到以下表：
   - users
   - articles
   - publish_records
   - publish_presets
   - redeem_codes
   - image_usage_stats
   - video_contents

---

## 文件存储设置

### 选项 1: 使用 Cloudflare R2 (推荐)

#### 优势
- 无出站费用
- S3 兼容
- 全球 CDN
- 免费额度：10 GB 存储

#### 设置步骤

1. **注册 Cloudflare 账号**：https://dash.cloudflare.com/sign-up

2. **创建 R2 存储桶**：
   - 登录 Cloudflare Dashboard
   - 左侧菜单选择 `R2`
   - 点击 `Create bucket`
   - 输入存储桶名称（例如：`content-images`）
   - 点击 `Create bucket`

3. **获取 API 凭证**：
   - 在 R2 页面，点击 `Manage R2 API Tokens`
   - 点击 `Create API Token`
   - 设置权限：`Object Read & Write`
   - 复制：
     - Account ID
     - Access Key ID
     - Secret Access Key

4. **配置自定义域名**（可选但推荐）：
   - 在存储桶设置中，添加自定义域名
   - 例如：`cdn.yourdomain.com`

5. **在 `.env.local` 中配置**：
   ```bash
   R2_ACCOUNT_ID="your-account-id"
   R2_ACCESS_KEY_ID="your-access-key"
   R2_SECRET_ACCESS_KEY="your-secret-key"
   R2_BUCKET_NAME="content-images"
   R2_PUBLIC_URL="https://cdn.yourdomain.com"
   ```

### 选项 2: 使用 Supabase Storage

#### 优势
- 与数据库集成
- 内置 CDN
- 免费额度：1 GB 存储

#### 设置步骤

1. 在 Supabase Dashboard 中：
   - 进入 `Storage`
   - 点击 `Create a new bucket`
   - 名称：`images`
   - Public bucket: 是（勾选）
   - 点击 `Save`

2. 环境变量已配置（使用之前的 `SUPABASE_URL` 和密钥）

3. 修改代码使用 Supabase Storage（可选）：
   ```typescript
   // lib/storage.ts
   import { supabase } from './supabase';

   export async function uploadImage(file: File) {
     const fileName = `${Date.now()}-${file.name}`;

     const { data, error } = await supabase.storage
       .from('images')
       .upload(fileName, file);

     if (error) throw error;

     const { data: { publicUrl } } = supabase.storage
       .from('images')
       .getPublicUrl(fileName);

     return publicUrl;
   }
   ```

---

## 本地开发

### 1. 确保所有环境变量已配置

检查 `.env.local` 文件，确保以下变量已设置：

```bash
# 数据库
DATABASE_URL="..."

# 认证
NEXTAUTH_SECRET="..."  # 生成：openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# 存储（选择一个）
R2_ACCOUNT_ID="..."
# 或
SUPABASE_URL="..."
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 3. 测试功能

- [ ] 注册账号
- [ ] 登录
- [ ] 创建文章
- [ ] 上传图片
- [ ] 预览样式
- [ ] 安装 Chrome 扩展
- [ ] 测试一键发布

---

## 部署到 Vercel

### 步骤 1: 推送代码到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 步骤 2: 在 Vercel 上导入项目

1. 访问 [vercel.com](https://vercel.com)
2. 点击 `Add New...` → `Project`
3. 选择您的 GitHub 仓库
4. 点击 `Import`

### 步骤 3: 配置环境变量

在 Vercel 项目设置中：

1. 进入 `Settings` → `Environment Variables`
2. 添加所有环境变量：

```bash
# 必需
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://yourdomain.com

# 存储（根据您的选择）
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=...

# 可选
OPENAI_API_KEY=...
```

### 步骤 4: 部署

1. 点击 `Deploy`
2. 等待部署完成
3. 访问生成的 URL

### 步骤 5: 配置自定义域名（可选）

1. 在 Vercel 项目中，进入 `Settings` → `Domains`
2. 添加您的域名
3. 按照提示配置 DNS 记录

---

## 部署到自己的服务器

### 系统要求

- Node.js 18+
- PM2（进程管理器）
- Nginx（反向代理）
- SSL 证书（Let's Encrypt）

### 步骤 1: 准备服务器

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装 Nginx
sudo apt install -y nginx

# 安装 Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

### 步骤 2: 克隆并构建项目

```bash
# 克隆代码
cd /var/www
git clone <your-repo-url> content-publisher
cd content-publisher

# 安装依赖
npm install

# 创建环境变量文件
nano .env.local
# 粘贴所有环境变量

# 构建项目
npm run build
```

### 步骤 3: 使用 PM2 启动

```bash
# 启动应用
pm2 start npm --name "content-publisher" -- start

# 设置开机自启
pm2 startup
pm2 save
```

### 步骤 4: 配置 Nginx

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/content-publisher
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/content-publisher /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 步骤 5: 配置 SSL

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 步骤 6: 验证部署

访问 https://yourdomain.com

---

## Chrome 扩展部署

### 步骤 1: 构建扩展

```bash
npm run ext:build
```

这将生成 `public/content-publisher-extension-v1.0.0.zip`

### 步骤 2: 发布到 Chrome Web Store（可选）

1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. 支付一次性开发者注册费（$5）
3. 点击 `New Item`
4. 上传 zip 文件
5. 填写详细信息：
   - 名称：多平台内容发布助手
   - 描述：一键发布内容到多个平台
   - 图标：准备 128x128 的图标
   - 截图：准备应用截图
6. 提交审核

### 步骤 3: 或者提供直接下载

如果不发布到 Chrome Web Store，用户可以：

1. 下载 zip 文件
2. 解压到本地文件夹
3. 打开 Chrome → `chrome://extensions/`
4. 开启"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择解压后的文件夹

---

## 环境变量配置

### 完整的环境变量列表

```bash
# =================================
# 数据库配置（必需）
# =================================
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://..."  # 如果使用 Supabase Storage
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# =================================
# 认证配置（必需）
# =================================
NEXTAUTH_SECRET="..."  # openssl rand -base64 32
NEXTAUTH_URL="https://yourdomain.com"

# =================================
# 存储配置（必需 - 选择一个）
# =================================
# 选项 1: Cloudflare R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="..."
R2_PUBLIC_URL="..."

# 选项 2: Supabase Storage
# （使用上面的 SUPABASE_URL 和密钥）

# =================================
# AI 服务（可选）
# =================================
OPENAI_API_KEY="sk-..."
OPENAI_BASE_URL="https://api.openai.com/v1"

# =================================
# 支付（可选）
# =================================
STRIPE_PUBLIC_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# =================================
# 分析（可选）
# =================================
GOOGLE_ANALYTICS_ID="G-..."
UMAMI_WEBSITE_ID="..."

# =================================
# 邮件（可选）
# =================================
RESEND_API_KEY="re_..."
FROM_EMAIL="noreply@yourdomain.com"
```

---

## 常见问题

### Q1: 数据库连接失败

**错误**：`Error: connect ECONNREFUSED`

**解决**：
1. 检查 `DATABASE_URL` 是否正确
2. 确保使用 Connection pooling URL（端口 6543）
3. 检查 Supabase 项目是否已暂停（免费计划闲置 7 天会暂停）

### Q2: 图片上传失败

**错误**：`Failed to upload image`

**解决**：
1. 检查 R2 凭证是否正确
2. 验证存储桶是否公开可访问
3. 检查自定义域名是否正确配置

### Q3: 扩展无法连接到网站

**错误**：扩展未检测到平台编辑器

**解决**：
1. 检查 `manifest.json` 中的 `matches` 是否正确
2. 确保在正确的 URL（如 `https://mp.weixin.qq.com/*`）
3. 重新加载扩展

### Q4: NextAuth 认证失败

**错误**：`[next-auth][error][JWT_SESSION_ERROR]`

**解决**：
1. 确保 `NEXTAUTH_SECRET` 已设置
2. 检查 `NEXTAUTH_URL` 是否与实际域名匹配
3. 清除浏览器 Cookie 后重试

### Q5: 构建失败

**错误**：`Module not found: Can't resolve 'postgres'`

**解决**：
```bash
npm install postgres @supabase/supabase-js
npm run build
```

---

## 更新部署

### Vercel

推送代码到 GitHub，Vercel 会自动重新部署。

```bash
git add .
git commit -m "Update"
git push origin main
```

### 自托管

```bash
# 拉取最新代码
cd /var/www/content-publisher
git pull origin main

# 安装依赖
npm install

# 重新构建
npm run build

# 重启应用
pm2 restart content-publisher
```

---

## 监控与维护

### 查看 PM2 日志

```bash
pm2 logs content-publisher
```

### 查看 Nginx 日志

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 数据库备份

定期备份 Supabase 数据库：

```bash
# 使用 pg_dump
pg_dump "postgresql://..." > backup-$(date +%Y%m%d).sql
```

---

## 下一步

- [ ] 配置自定义域名
- [ ] 设置 SSL 证书
- [ ] 配置 CDN
- [ ] 添加监控（如 Sentry）
- [ ] 设置自动备份
- [ ] 优化性能

---

## 需要帮助？

- 查看 [TECH_STACK.md](./TECH_STACK.md) 了解技术架构
- 查看 [MIGRATION_TO_SUPABASE.md](./MIGRATION_TO_SUPABASE.md) 了解数据库迁移
- 查看 [PLUGIN_ARCHITECTURE.md](./PLUGIN_ARCHITECTURE.md) 了解插件系统

---

**部署完成后，记得删除或更新以下内容：**
- 更改默认管理员账号
- 更新品牌信息
- 自定义样式和主题
- 添加自己的分析工具

祝部署顺利！🚀
