# Vercel 快速修复指南

## 🚨 当前错误

```
There is a problem with the server configuration.
Check the server logs for more information.
```

## 🎯 问题原因

**缺少 NextAuth 必需的环境变量**,导致身份认证系统无法正常工作。

## ✅ 快速修复步骤

### 1. 打开 Vercel Dashboard
访问: https://vercel.com/dashboard

### 2. 进入你的项目
选择 `writepush` 项目

### 3. 添加环境变量
点击 **Settings** → **Environment Variables**

### 4. 添加以下两个关键变量

#### 变量 1: NEXTAUTH_SECRET
```
Name: NEXTAUTH_SECRET
Value: YOOjWsNuUg9V7xYPAgF8I5NYq8fU2NSjO0TutDDIFSw=
Environments: ✅ Production, ✅ Preview, ✅ Development
```

**说明**: 这是用于加密 JWT token 的密钥。我已经为你生成了一个随机密钥。

#### 变量 2: NEXTAUTH_URL
```
Name: NEXTAUTH_URL
Value: https://你的实际域名.vercel.app
Environments: ✅ Production
```

**重要**: 将 `你的实际域名.vercel.app` 替换成你的 Vercel 项目实际域名!

例如:
- ✅ `https://writepush.vercel.app`
- ✅ `https://writepush-git-main-username.vercel.app`
- ❌ `https://your-domain.vercel.app` (不要直接复制这个!)

**如何找到你的域名**:
1. 在 Vercel Dashboard 中打开你的项目
2. 查看 **Deployments** 页面
3. 最新部署的 **Domain** 列就是你的域名

### 5. 检查数据库环境变量

确认以下变量之一已设置:

```
POSTGRES_URL ✅ (Supabase Integration 自动设置)
或
DATABASE_URL
```

如果没有,参考 [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) 设置数据库连接。

### 6. 触发重新部署

添加环境变量后:

**方式1: 在 Vercel Dashboard**
1. 进入 **Deployments** 页面
2. 找到最新的部署
3. 点击右侧的 **...** 菜单
4. 选择 **Redeploy**

**方式2: 推送新提交**
```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

### 7. 验证修复

部署完成后:

1. **访问你的应用**: `https://你的域名.vercel.app`
2. **尝试注册/登录**: 应该不再出现 "server configuration" 错误
3. **检查调试 API**: `https://你的域名.vercel.app/api/debug-env`
   - 应该显示 `POSTGRES_URL: ✅ 已设置`

## 📝 完整环境变量清单

以下是推荐在 Vercel 中设置的所有环境变量:

### 必需变量
```bash
# 1. 数据库 (Supabase Integration 自动设置)
POSTGRES_URL=postgresql://...

# 2. NextAuth 认证
NEXTAUTH_SECRET=YOOjWsNuUg9V7xYPAgF8I5NYq8fU2NSjO0TutDDIFSw=
NEXTAUTH_URL=https://your-actual-domain.vercel.app
```

### 可选变量
```bash
# Supabase 公开 API
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cloudflare R2 存储
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-r2-domain.com

# 管理员配置
ADMIN_EMAILS=admin@example.com
```

## 🔍 常见问题

### Q: 为什么需要 NEXTAUTH_SECRET?
A: NextAuth 使用这个密钥来加密和验证 JWT tokens。没有它,认证系统无法工作。

### Q: NEXTAUTH_URL 必须是实际域名吗?
A: 是的! 它必须与你访问应用的 URL 完全匹配。这是 NextAuth 的安全机制。

### Q: 我可以使用自定义域名吗?
A: 可以! 如果你在 Vercel 配置了自定义域名,就使用自定义域名作为 NEXTAUTH_URL。

### Q: Preview 和 Development 环境怎么办?
A: Preview 环境可以使用相同的 NEXTAUTH_SECRET,但 NEXTAUTH_URL 会根据部署自动调整。本地开发使用 `.env.local` 文件设置。

## 🎉 完成

设置完成后,你的应用应该可以正常:
- ✅ 用户注册
- ✅ 用户登录
- ✅ Session 管理
- ✅ 数据库连接

如果还有问题,查看 Vercel 部署日志或联系支持。
