# 快速开始指南

这是一个精简的快速开始指南，帮助您在 30 分钟内完成项目的基础配置和部署。

## 📋 前提条件

- ✅ Node.js 18+ 已安装
- ✅ Git 已安装
- ✅ 已有 GitHub 账号（用于部署）

## 🚀 10 步快速部署

### 步骤 1: 克隆项目（2分钟）

```bash
git clone <your-repo-url>
cd content-publisher
npm install
```

### 步骤 2: 创建 Supabase 项目（5分钟）

1. 访问 https://supabase.com
2. 注册/登录账号
3. 点击 "New Project"
4. 填写信息：
   - Name: `content-publisher`
   - Database Password: **记住这个密码！**
   - Region: 选择最近的区域
5. 等待项目创建（约2分钟）

### 步骤 3: 获取 Supabase 配置（3分钟）

在 Supabase Dashboard：

1. **获取数据库 URL**：
   - 左侧菜单 → `Project Settings` → `Database`
   - 找到 "Connection string" 部分
   - 选择 "URI" 标签
   - 复制 "Connection pooling" 的 URL
   - 看起来像：`postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

2. **获取 API Keys**：
   - 左侧菜单 → `Project Settings` → `API`
   - 复制 `Project URL`
   - 复制 `anon public` key
   - 复制 `service_role` key（⚠️ 保密）

### 步骤 4: 配置环境变量（3分钟）

```bash
# 复制模板
cp .env.example .env.local

# 编辑 .env.local
```

最小化配置（必需）：

```bash
# 数据库（从步骤3获取）
DATABASE_URL="postgresql://postgres.[ref]:[password]@..."
SUPABASE_URL="https://[project-ref].supabase.co"
SUPABASE_ANON_KEY="eyJhb..."
SUPABASE_SERVICE_ROLE_KEY="eyJhb..."

# 认证（生成随机密钥）
NEXTAUTH_SECRET="使用以下命令生成: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# 暂时跳过文件存储配置（稍后添加）
```

### 步骤 5: 初始化数据库（2分钟）

```bash
npm run db:push
```

成功后会看到：
```
✅ Tables created successfully
```

### 步骤 6: 启动开发服务器（1分钟）

```bash
npm run dev
```

访问 http://localhost:3000

### 步骤 7: 测试基础功能（5分钟）

1. **注册账号**：
   - 访问 `/auth/signup`
   - 创建测试账号

2. **登录**：
   - 使用刚创建的账号登录

3. **创建文章**：
   - 进入仪表板
   - 点击"新建文章"
   - 写一些测试内容
   - 保存

✅ 如果以上都成功，基础功能正常！

### 步骤 8: 配置文件存储（可选，10分钟）

**快速方案：使用 Supabase Storage**

1. 在 Supabase Dashboard：
   - 左侧菜单 → `Storage`
   - 点击 "Create a new bucket"
   - Bucket name: `images`
   - Public bucket: **勾选**
   - 点击 "Save"

2. 更新 `.env.local`：
   ```bash
   # 已有的 SUPABASE_URL 和密钥就足够了
   # 无需额外配置
   ```

3. 测试上传图片功能

**高级方案：使用 Cloudflare R2**

参考 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 的详细步骤。

### 步骤 9: 部署到 Vercel（5分钟）

1. **推送到 GitHub**：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **连接 Vercel**：
   - 访问 https://vercel.com
   - 点击 "Add New..." → "Project"
   - 选择您的 GitHub 仓库
   - 点击 "Import"

3. **配置环境变量**：
   - 在 Vercel 项目设置中
   - 进入 "Settings" → "Environment Variables"
   - 添加所有 `.env.local` 中的变量
   - **重要**：将 `NEXTAUTH_URL` 改为您的 Vercel 域名

4. **部署**：
   - 点击 "Deploy"
   - 等待构建完成（约2分钟）

### 步骤 10: 安装 Chrome 扩展（可选，3分钟）

1. **构建扩展**：
   ```bash
   npm run ext:build
   ```

2. **安装到 Chrome**：
   - 解压 `public/content-publisher-extension-v1.0.0.zip`
   - 打开 Chrome → `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择解压后的文件夹

3. **测试扩展**：
   - 访问 https://mp.weixin.qq.com
   - 应该能看到扩展图标
   - 点击图标查看功能

---

## ✅ 完成！

恭喜您已成功完成基础配置！

### 当前状态
- ✅ 数据库已配置并运行
- ✅ 用户认证正常工作
- ✅ 文章创建和管理功能可用
- ✅ 项目已部署到 Vercel
- ✅ Chrome 扩展可用（如果完成步骤10）

### 暂未配置（可选）
- ⏳ 文件上传（如果未完成步骤8）
- ⏳ 品牌定制（Logo、颜色等）
- ⏳ AI 功能（OpenAI API）
- ⏳ 支付功能（Stripe）
- ⏳ 分析服务（Google Analytics）

---

## 🎯 下一步做什么？

### 立即可做
1. **测试所有功能**：
   - 创建多篇文章
   - 测试不同样式
   - 尝试平台预览

2. **配置文件存储**（如果还没做）：
   - 参考步骤8
   - 测试图片上传

3. **安装扩展**（如果还没做）：
   - 参考步骤10
   - 测试一键发布

### 进阶配置
4. **去除品牌信息**：
   - 阅读 [CUSTOMIZATION_GUIDE.md](./CUSTOMIZATION_GUIDE.md)
   - 搜索并替换 "ziliu"、"字流"
   - 更新 Logo 和图标
   - 自定义颜色主题

5. **添加更多平台**：
   - 阅读 [PLUGIN_EXTENSION_GUIDE.md](./PLUGIN_EXTENSION_GUIDE.md)
   - 学习如何添加国外平台
   - 实现 Medium、Dev.to 等

6. **自定义域名**：
   - 在 Vercel 中添加自定义域名
   - 配置 DNS 记录
   - 更新 `NEXTAUTH_URL`

---

## 🔧 常见问题

### Q1: 数据库连接失败

**错误**: `Error: connect ECONNREFUSED`

**解决**:
```bash
# 检查 DATABASE_URL 是否正确
# 确保密码中的特殊字符已 URL 编码
# 例如：@ 编码为 %40
```

### Q2: 无法注册账号

**错误**: `Error: Cannot register user`

**解决**:
```bash
# 1. 检查数据库是否已初始化
npm run db:push

# 2. 检查 Supabase 项目是否正常运行
# 访问 Supabase Dashboard 确认
```

### Q3: 图片上传失败

**原因**: 未配置文件存储

**解决**: 完成步骤8，配置 Supabase Storage 或 Cloudflare R2

### Q4: Vercel 部署失败

**常见原因**:
- 环境变量未配置
- 数据库 URL 错误
- 构建命令错误

**解决**: 查看 Vercel 构建日志，根据错误信息调整

---

## 📚 更多资源

### 详细文档
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 完整部署指南
- [CUSTOMIZATION_GUIDE.md](./CUSTOMIZATION_GUIDE.md) - 定制指南
- [TECH_STACK.md](./TECH_STACK.md) - 技术架构
- [PLUGIN_ARCHITECTURE.md](./PLUGIN_ARCHITECTURE.md) - 插件架构

### 技术支持
- 📖 查看文档
- 🐛 提交 Issue
- 💬 GitHub Discussions
- 📧 社区帮助

---

## 🎉 祝贺！

您已成功完成快速部署！

**接下来可以**：
- 🎨 定制您的品牌
- 🚀 添加更多功能
- 📱 发布到用户
- 💰 实现商业化

**保持学习**：
- 阅读详细文档
- 研究代码实现
- 贡献您的改进

祝您使用愉快！🚀
