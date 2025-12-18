# 🚀 Vercel 部署完整指南

本文档提供字流项目部署到 Vercel 的完整步骤。

---

## 📋 部署前准备清单

### 1️⃣ 必需服务账号

- [x] **GitHub 账号**（用于代码托管）
- [x] **Vercel 账号**（访问 [vercel.com](https://vercel.com) 注册）
- [x] **Supabase 账号**（PostgreSQL 数据库，访问 [supabase.com](https://supabase.com) 注册）
- [x] **Cloudflare 账号**（R2 存储，访问 [cloudflare.com](https://cloudflare.com) 注册）
- [ ] **OpenRouter 账号**（可选，AI 功能，访问 [openrouter.ai](https://openrouter.ai) 注册）

### 2️⃣ 需要准备的信息

参考项目根目录的 [`.env.production.template`](.env.production.template) 文件。

---

## 🎯 部署步骤（详细版）

### 步骤 1: 推送代码到 GitHub

```bash
# 1. 在 GitHub 创建一个新仓库（例如：ziliu）

# 2. 在本地项目目录执行
cd h:\编剧-脚本\ziliu

# 3. 确认 Git 仓库已初始化（如果未初始化，执行 git init）
git remote -v

# 4. 添加 GitHub 远程仓库（替换为您的仓库地址）
git remote add origin https://github.com/YOUR_USERNAME/ziliu.git

# 5. 推送代码
git add .
git commit -m "feat: 准备部署到 Vercel"
git push -u origin main
```

**注意**：确保 `.env` 文件已在 `.gitignore` 中（避免泄露密钥）

---

### 步骤 2: 配置 Supabase 数据库

#### 2.1 创建 Supabase 项目

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 **"New Project"**
3. 填写项目信息：
   - **Name**: ziliu
   - **Database Password**: 设置一个强密码（务必保存！）
   - **Region**: 选择 `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)`
4. 等待项目创建完成（约 2 分钟）

#### 2.2 获取数据库连接字符串

1. 进入项目 → **Settings** → **Database**
2. 找到 **Connection String** 部分
3. 选择 **"Connection pooling"** 标签（重要！）
4. 复制连接字符串，格式如下：
   ```
   postgresql://postgres.[ref]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
5. 将 `[PASSWORD]` 替换为您刚才设置的数据库密码

#### 2.3 初始化数据库表结构

**方式 A：本地初始化（推荐）**

```bash
# 1. 在本地创建 .env 文件
cp .env.example .env

# 2. 编辑 .env，填入 Supabase 数据库连接
# DATABASE_URL="postgresql://..."

# 3. 推送数据库表结构
npm run db:push:pg

# 4. 验证数据库连接
npm run db:test
```

**方式 B：使用 Supabase SQL Editor**

1. Supabase Dashboard → **SQL Editor**
2. 复制 `drizzle/migrations-postgres/0000_lowly_rafael_vega.sql` 的内容
3. 粘贴到 SQL Editor 并执行

---

### 步骤 3: 配置 Cloudflare R2 存储

#### 3.1 创建 R2 存储桶

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单 → **R2**
3. 点击 **"Create Bucket"**
4. 桶名称：`ziliu-images`（或您喜欢的名称）
5. 位置：选择 **"Automatic"** 或 **"Asia-Pacific"**
6. 点击 **"Create Bucket"**

#### 3.2 创建 API Token

1. R2 页面 → 右上角 **"Manage R2 API Tokens"**
2. 点击 **"Create API Token"**
3. Token 名称：`ziliu-production`
4. 权限：
   - ✅ **Object Read & Write**
   - ✅ **对象读写权限** 选择您刚创建的桶
5. 点击 **"Create API Token"**
6. **立即保存** 显示的信息：
   ```
   Access Key ID: xxxxxxxx
   Secret Access Key: yyyyyyyy
   ```
   ⚠️ **Secret 只显示一次，务必保存！**

#### 3.3 获取 Account ID

1. 在 R2 页面右侧可以看到 **"Account ID"**
2. 点击复制图标

#### 3.4 配置公开访问域名

**方式 A：使用 R2.dev 域名（快速）**

1. 进入您的 R2 桶 → **Settings**
2. **Public Access** → 点击 **"Allow Access"**
3. 会生成一个公开域名：`https://pub-xxxxx.r2.dev`
4. 复制此域名作为 `R2_PUBLIC_URL`

**方式 B：绑定自定义域名（推荐，需要域名）**

1. R2 桶 → **Settings** → **Custom Domains**
2. 点击 **"Connect Domain"**
3. 输入您的域名（例如：`cdn.yourdomain.com`）
4. 按照提示在 Cloudflare DNS 添加 CNAME 记录
5. 使用 `https://cdn.yourdomain.com` 作为 `R2_PUBLIC_URL`

---

### 步骤 4: 部署到 Vercel

#### 4.1 导入项目

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **"Add New..." → "Project"**
3. 选择 **"Import Git Repository"**
4. 授权 GitHub 并选择您的 `ziliu` 仓库
5. 点击 **"Import"**

#### 4.2 配置项目

**Framework Preset**: 自动检测为 **Next.js**（无需修改）

**Build Settings**:
- **Build Command**: `next build`（默认）
- **Output Directory**: `.next`（默认）
- **Install Command**: `npm install`（默认）

**Root Directory**: `.`（默认）

点击 **"Deploy"** 后，**先暂停！** 我们需要先配置环境变量。

#### 4.3 配置环境变量

1. 点击 **"Environment Variables"** 标签
2. 逐个添加以下变量（参考 `.env.production.template`）：

| 变量名 | 值 | 说明 |
|-------|---|------|
| `DATABASE_URL` | `postgresql://postgres...` | Supabase 数据库连接 |
| `NEXTAUTH_SECRET` | 随机生成的密钥 | 执行 `openssl rand -base64 32` |
| `NEXTAUTH_URL` | 先留空，部署后填写 | 部署后会获得 Vercel 域名 |
| `NEXT_PUBLIC_APP_URL` | 先留空，部署后填写 | 同上 |
| `NEXT_PUBLIC_API_BASE_URL` | 先留空，部署后填写 | 同上 |
| `R2_ACCOUNT_ID` | Cloudflare Account ID | 从 Cloudflare 复制 |
| `R2_ACCESS_KEY_ID` | R2 Access Key ID | 从 API Token 复制 |
| `R2_SECRET_ACCESS_KEY` | R2 Secret Access Key | 从 API Token 复制 |
| `R2_BUCKET_NAME` | `ziliu-images` | 您创建的桶名称 |
| `R2_PUBLIC_URL` | `https://pub-xxxxx.r2.dev` | R2 公开访问域名 |
| `OPENROUTER_API_KEY` | `sk-or-v1-xxxxx` | （可选）OpenRouter API Key |

**添加方式**：
```
Key: DATABASE_URL
Value: postgresql://postgres...
Environment: Production, Preview, Development (全选)
```

#### 4.4 首次部署

1. 环境变量配置完成后，点击 **"Deploy"**
2. 等待构建完成（约 2-3 分钟）
3. 部署成功后，您会看到部署域名，例如：
   ```
   https://ziliu-xxxxx.vercel.app
   ```

#### 4.5 更新 URL 环境变量

1. 复制 Vercel 提供的域名
2. 返回 **Settings → Environment Variables**
3. 编辑以下变量：
   ```
   NEXTAUTH_URL=https://ziliu-xxxxx.vercel.app
   NEXT_PUBLIC_APP_URL=https://ziliu-xxxxx.vercel.app
   NEXT_PUBLIC_API_BASE_URL=https://ziliu-xxxxx.vercel.app
   ```
4. 保存后，点击 **Deployments** → 最新部署 → **三个点** → **Redeploy**

---

### 步骤 5: 验证部署

#### 5.1 访问应用

打开浏览器，访问：`https://ziliu-xxxxx.vercel.app`

#### 5.2 测试注册/登录

1. 点击 **"注册"**
2. 填写邮箱和密码
3. 注册成功后，自动跳转到仪表板

#### 5.3 测试图片上传

1. 进入 **编辑器** → 新建文章
2. 上传一张图片
3. 检查图片是否成功显示
4. 验证 R2 存储桶是否有新文件

#### 5.4 检查数据库

1. Supabase Dashboard → **Table Editor**
2. 查看 `users` 表是否有新注册的用户
3. 查看 `articles` 表是否有创建的文章

---

## 🎨 绑定自定义域名（可选）

### 1. 在 Vercel 添加域名

1. Vercel Dashboard → 您的项目 → **Settings** → **Domains**
2. 点击 **"Add"**
3. 输入您的域名：`yourdomain.com` 或 `app.yourdomain.com`
4. Vercel 会显示需要配置的 DNS 记录

### 2. 配置 DNS 记录

**如果域名在 Cloudflare**:
```
类型: CNAME
名称: @ (或 app)
目标: cname.vercel-dns.com
代理状态: DNS only（关闭橙色云朵）
```

**如果域名在阿里云/腾讯云**:
```
记录类型: CNAME
主机记录: @ (或 app)
记录值: cname.vercel-dns.com
TTL: 10分钟
```

### 3. 等待 DNS 生效

通常需要 5-30 分钟，Vercel 会自动颁发 SSL 证书。

### 4. 更新环境变量

绑定成功后，更新以下环境变量为自定义域名：
```
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com
```

然后重新部署。

---

## 🔧 常见问题

### Q1: 部署失败，显示 "Build failed"

**原因**：可能是环境变量未配置或数据库连接失败

**解决**：
1. 检查 Vercel 部署日志
2. 确认 `DATABASE_URL` 是否正确
3. 测试 Supabase 数据库是否可访问

### Q2: 登录失败，显示 "Invalid credentials"

**原因**：`NEXTAUTH_SECRET` 未配置或 `NEXTAUTH_URL` 不正确

**解决**：
1. 确认 `NEXTAUTH_SECRET` 已生成并配置
2. 确认 `NEXTAUTH_URL` 与实际访问域名一致
3. 重新部署

### Q3: 图片上传失败

**原因**：R2 配置不正确或权限不足

**解决**：
1. 检查 R2 API Token 权限（需要 Object Read & Write）
2. 确认 `R2_BUCKET_NAME` 拼写正确
3. 测试 R2 是否可访问：
   ```bash
   curl https://你的R2公开域名/test.txt
   ```

### Q4: 国内访问慢或无法访问

**解决方案**：
1. 绑定自定义域名
2. 使用 Cloudflare 代理（参考主文档）
3. 或考虑使用 Zeabur（香港节点）

### Q5: 视频元数据生成失败

**原因**：`OPENROUTER_API_KEY` 未配置或配额不足

**解决**：
1. 确认 API Key 已配置
2. 检查 OpenRouter 账户余额
3. 查看 Vercel 函数日志排查错误

---

## 📊 监控与维护

### 1. Vercel 分析

**免费功能**:
- 请求统计
- 函数执行时间
- 错误率

**Pro 功能** ($20/月):
- Web Vitals（性能指标）
- 访客分析
- 实时日志

### 2. Supabase 监控

1. Supabase Dashboard → **Reports**
2. 查看：
   - 数据库连接数
   - 查询性能
   - 存储使用量

### 3. R2 成本监控

1. Cloudflare Dashboard → **R2** → **Usage**
2. 免费额度：
   - 存储：10 GB
   - Class A 操作：100 万次/月
   - Class B 操作：1000 万次/月

---

## 🎉 部署完成！

恭喜您成功部署到 Vercel！

**下一步**：
- [ ] 测试所有功能
- [ ] 配置自定义域名
- [ ] 设置监控告警
- [ ] 邀请用户测试

**需要帮助？**
- Vercel 文档：https://vercel.com/docs
- Supabase 文档：https://supabase.com/docs
- Cloudflare R2 文档：https://developers.cloudflare.com/r2/

---

**部署时间估算**：30-60 分钟（首次部署）
