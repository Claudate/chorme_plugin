# 数据库问题排查指南

本文档记录了常见的数据库问题及其解决方案,帮助快速诊断和修复问题。

## 快速诊断

### 1. 健康检查 API

访问 `/api/health` 端点可快速检查应用健康状态:

```bash
# 本地环境
curl http://localhost:3000/api/health

# 生产环境
curl https://your-app.vercel.app/api/health
```

**预期响应**:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-18T...",
  "checks": {
    "hasDatabaseUrl": true,
    "databaseConnection": true,
    "tablesExist": true,
    "usingConnectionPool": true,
    "tableCount": 8
  }
}
```

### 2. 测试数据库连接

```bash
npm run db:test
```

预期输出:
```
✅ 数据库连接成功!
📊 PostgreSQL 版本: PostgreSQL 15.x...
📋 检查数据库表...
   ✓ zi_users
   ✓ zi_articles
   ...
```

---

## 常见问题

### 问题 1: Failed query 错误

#### 症状
```
Failed query: select ... from "zi_users" ...
Error: relation "zi_users" does not exist
```

#### 可能原因
1. ❌ Drizzle 配置文件引用的 schema 文件不存在
2. ❌ 数据库迁移未应用
3. ❌ DATABASE_URL 配置错误或未设置

#### 解决方案

**步骤 1**: 验证 schema 文件
```bash
npm run verify:schema
```

预期输出:
```
✅ 所有配置验证通过!
```

如果失败:
- 检查 `drizzle.config.supabase.ts` 中的 `schema` 路径
- 确保 `src/lib/db/schema.ts` 文件存在
- 常见错误: `schema-postgres.ts` 已被重命名为 `schema.ts`

**步骤 2**: 检查数据库连接
```bash
npm run db:test
```

**步骤 3**: 应用迁移
```bash
npm run db:init
```

预期输出:
```
📁 找到 N 个迁移文件
📄 执行迁移: 0000_xxx.sql
   ✅ 迁移完成
🎉 所有数据库迁移完成!
```

---

### 问题 2: 连接超时或连接被拒绝

#### 症状
```
Error: Connection timeout
Error: connect ECONNREFUSED
```

#### 可能原因
1. ❌ 使用错误的端口 (5432 vs 6543)
2. ❌ 网络问题或防火墙阻止
3. ❌ Supabase 项目暂停或删除

#### 解决方案

**检查端口配置**:

本地 `.env.local`:
```bash
# ❌ 错误 - 直连端口
DATABASE_URL=postgresql://...@db.xxx.supabase.co:5432/postgres

# ✅ 正确 - 连接池端口 (Serverless 环境必须使用)
DATABASE_URL=postgresql://...@db.xxx.supabase.co:6543/postgres
```

Vercel 环境变量:
- 确保使用端口 **6543** (连接池)
- Serverless 环境下使用端口 5432 会导致连接数耗尽

**检查 Supabase 项目状态**:
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 检查项目是否在线
3. 重启项目或重置数据库密码

---

### 问题 3: 表不存在

#### 症状
```
relation "zi_users" does not exist
```

#### 解决方案

**本地环境**:
```bash
npm run db:init
```

**Vercel 环境**:

方案 A - 自动迁移 (推荐):
- 确保 `package.json` 中的 `build` 命令包含迁移:
  ```json
  {
    "scripts": {
      "build": "npm run db:migrate:vercel && next build"
    }
  }
  ```
- 重新部署到 Vercel

方案 B - 手动迁移:
```bash
# 设置 Vercel 数据库连接
export DATABASE_URL="postgresql://...@db.xxx.supabase.co:6543/postgres"

# 运行迁移
npm run db:init
```

---

### 问题 4: Schema 文件不存在

#### 症状
```
Error: Cannot find module './src/lib/db/schema-postgres.ts'
```

#### 原因
`drizzle.config.supabase.ts` 引用了不存在的 schema 文件。

#### 解决方案

编辑 `drizzle.config.supabase.ts`:
```typescript
export default {
  schema: './src/lib/db/schema.ts',  // ✅ 正确
  // schema: './src/lib/db/schema-postgres.ts',  // ❌ 此文件不存在
  out: './drizzle/migrations-postgres',
  dialect: 'postgresql',
  // ...
};
```

---

### 问题 5: Drizzle migrations 表不存在

#### 症状
```
relation "drizzle_migrations" does not exist
```

#### 解决方案

这是正常现象,`drizzle_migrations` 表会在首次运行迁移时自动创建。

运行迁移:
```bash
npm run db:init
```

或在 Vercel 部署时自动创建(如果配置了自动迁移)。

---

## Vercel 部署问题

### 检查清单

在部署到 Vercel 之前,确保:

- [ ] **环境变量已设置**
  - `DATABASE_URL` (使用端口 6543)
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`

- [ ] **数据库迁移方式选择**
  - 方案 A: 自动迁移 (build 命令包含 `npm run db:migrate:vercel`)
  - 方案 B: 手动迁移 (本地运行 `npm run db:init` 连接到 Vercel 数据库)

- [ ] **健康检查**
  - 部署后访问 `https://your-app.vercel.app/api/health`
  - 检查 `status` 是否为 `"healthy"`

- [ ] **查看日志**
  - Vercel Dashboard → Deployments → Latest → Functions → Logs
  - 查找错误信息或警告

### 常见 Vercel 错误

#### Error: connect ENETUNREACH (IPv6 连接错误)

**症状**:
```
Error: connect ENETUNREACH 2600:1f18:2e13:9d18:....:5432 - Local (:::0)
at internalConnect (node:net:1110:16)
```

**原因**:
- Vercel 不支持 IPv6
- 使用了 Supabase 直连地址 (`db.[project-ref].supabase.co`)，该地址只返回 IPv6
- 从 2024年1月15日起，Supabase 停止为新项目分配 IPv4 地址

**解决方案**:

必须使用 Supabase Pooler (Supavisor) 地址，它支持 IPv4：

```bash
# ❌ 错误 - 使用直连地址 (仅 IPv6)
DATABASE_URL=postgresql://postgres:[PWD]@db.xxx.supabase.co:5432/postgres

# ✅ 正确 - 使用 Pooler 地址 (支持 IPv4)
# Transaction Mode - 推荐用于 Vercel/Serverless (端口 6543)
DATABASE_URL=postgresql://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# 或 Session Mode (端口 5432)
DATABASE_URL=postgresql://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

**获取正确的连接字符串**:
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 Project Settings → Database
4. 在 "Connection Pooling" 部分复制 "Connection string"
5. 选择 "Transaction" 模式（推荐用于 Vercel）

**参考文档**:
- [Supabase IPv4/IPv6 兼容性](https://supabase.com/docs/guides/troubleshooting/supabase--your-network-ipv4-and-ipv6-compatibility-cHe3BP)
- [GitHub Discussion #17817](https://github.com/orgs/supabase/discussions/17817)

---

#### Error: Too many connections

**原因**: 使用端口 5432 (直连) 导致连接数耗尽

**解决方案**: 修改 `DATABASE_URL` 使用端口 6543

#### Error: Failed to fetch

**原因**: NEXTAUTH_URL 未设置或设置错误

**解决方案**:
```bash
# Vercel 环境变量
NEXTAUTH_URL=https://your-app.vercel.app
```

#### Build 失败: Cannot find module 'tsx'

**原因**: 迁移脚本依赖 `tsx` 但未安装

**解决方案**:
```bash
npm install --save-dev tsx
```

---

## 调试技巧

### 1. 启用详细日志

修改后的代码已包含详细日志:
- 数据库连接详情 (`src/lib/db/index.ts`)
- 用户注册流程 (`src/lib/auth.ts`)
- API 请求和响应 (`src/app/api/auth/register/route.ts`)

### 2. 本地调试

```bash
# 1. 启动开发服务器
npm run dev

# 2. 访问注册页面
# http://localhost:3000/auth/signup

# 3. 查看控制台日志
# 应该看到:
# 🔗 Connecting to Supabase PostgreSQL database...
# 📍 Connection details: { host: ..., port: '6543', ... }
# 🔧 Using connection pooling: true
# ✅ Supabase database connection established
```

### 3. Vercel 日志

访问 Vercel Function Logs:
1. Vercel Dashboard → Project → Deployments
2. 点击最新部署
3. 选择 "Functions" 标签
4. 点击 "Logs" 查看实时日志

---

## 预防措施

### 1. 使用 Schema 验证脚本

在生成迁移前自动验证配置:
```bash
npm run verify:schema
```

已配置为 `predb:generate:pg` hook,会在生成迁移前自动运行。

### 2. 使用健康检查 API

在 CI/CD 流程中添加健康检查:
```bash
# 部署后验证
curl -f https://your-app.vercel.app/api/health || exit 1
```

### 3. 监控连接池使用情况

访问 `/api/health` 检查:
```json
{
  "checks": {
    "usingConnectionPool": true,  // 应该为 true
    "databasePort": "6543"        // 应该为 6543
  }
}
```

---

## 参考资源

- [Supabase 连接池文档](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [Next.js 环境变量](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Vercel 部署文档](https://vercel.com/docs)

---

## 获取帮助

如果问题仍未解决:

1. 检查 `/api/health` 响应
2. 运行 `npm run verify:schema`
3. 运行 `npm run db:test`
4. 查看 Vercel Function Logs
5. 检查 Supabase Dashboard 项目状态

提供以上信息有助于快速诊断问题。
