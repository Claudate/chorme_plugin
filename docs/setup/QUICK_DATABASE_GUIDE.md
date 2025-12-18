# 快速数据库设置指南

## 🚀 快速开始（3 步）

### 步骤 1: 获取数据库连接字符串

访问 [Supabase Dashboard](https://app.supabase.com/) → 你的项目 → Settings → Database

复制 **Connection string** (Transaction mode, 端口 6543):
```
postgresql://postgres.[PROJECT]:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

⚠️ **重要**: 将 `PASSWORD` 替换为你的实际数据库密码（不是 Service Role Key）

### 步骤 2: 更新环境变量

创建或编辑 `.env.local` 文件：

```env
DATABASE_URL="你的连接字符串"
SUPABASE_URL="https://dsxowflwwyagymsmlyyc.supabase.co"
SUPABASE_SERVICE_KEY="你的service_role_key"
```

### 步骤 3: 初始化数据库

```bash
# 测试连接
npm run db:test

# 创建数据表
npm run db:init
```

完成！✅

## 📋 验证

运行以下命令确认 7 个 `zi_` 开头的表已创建：

```bash
npm run db:test
```

## 🎯 数据表列表

所有表都使用 `zi_` 前缀：

1. `zi_users` - 用户表
2. `zi_articles` - 文章表
3. `zi_publish_records` - 发布记录表
4. `zi_publish_presets` - 发布预设表
5. `zi_redeem_codes` - 兑换码表
6. `zi_image_usage_stats` - 图片使用统计表
7. `zi_video_contents` - 视频内容元数据表

## 🔧 npm 脚本命令

```bash
npm run db:test        # 测试数据库连接
npm run db:init        # 初始化数据库（创建表）
npm run db:generate:pg # 生成新的迁移文件
npm run db:push:pg     # 推送 schema 到数据库
npm run db:studio      # 打开 Drizzle Studio（可视化管理）
```

## ❓ 遇到问题？

### "Tenant or user not found"
- ✅ 检查数据库密码是否正确
- ✅ 在 Supabase Dashboard 重置密码
- ✅ 确认项目状态为 Active

### 忘记密码？
1. Supabase Dashboard → Settings → Database
2. 滚动到 "Database Password"
3. 点击 "Reset Database Password"
4. 复制新密码并更新 `.env.local`

### 想手动执行 SQL？
1. Supabase Dashboard → SQL Editor
2. 复制 `drizzle/migrations-postgres/0000_lowly_rafael_vega.sql`
3. 点击 "Run" 执行

## 📚 详细文档

- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - 完整设置指南
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase 配置详解
- [DATABASE_MIGRATION_SUMMARY.md](./DATABASE_MIGRATION_SUMMARY.md) - 迁移总结

---

**提示**: 第一次设置时建议先运行 `npm run db:test` 确保连接正常！
