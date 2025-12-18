# Vercel 部署配置指南

## 问题诊断

你当前遇到的错误是:
```
Error: DATABASE_URL or SUPABASE_DB_URL environment variable must be set
```

这个错误发生在构建阶段,表明环境变量没有被正确加载。

## 解决方案

### 1. 检查 Vercel 环境变量设置

从你的截图看,你已经在 Vercel 添加了环境变量。请确认:

1. 打开 Vercel Dashboard
2. 进入你的项目 (writepush)
3. 点击 **Settings** → **Environment Variables**
4. 确认以下变量已正确设置,并且**勾选了 Production 环境**:

#### 必需的数据库环境变量:

```
POSTGRES_URL (或 DATABASE_URL)
```

**重要**:
- ✅ 必须使用 Supabase Pooler 地址 (包含 `pooler.supabase.com:6543`)
- ❌ 不能使用直连地址 (包含 `db.xxx.supabase.co:5432`)

示例正确格式:
```
postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### 2. Vercel Integration 自动同步环境变量

从你的第二张截图看,你已经设置了 Vercel Integration。这个集成应该会自动同步环境变量:

1. **检查集成状态**:
   - 在 Supabase Dashboard → Settings → Integrations → Vercel
   - 确认连接状态为 "Connected"
   - 查看 "Sync environment variables for selected targets"
   - 确保 **Production** 环境被选中

2. **手动触发重新同步**:
   - 在 Vercel Integration 页面,点击 "Resync environment variables"
   - 或者点击 "Manage" → "Resync environment variables"

### 3. 验证环境变量前缀

从截图看,你设置的环境变量前缀是 `NEXT_PUBLIC_`。

**重要说明**:
- `NEXT_PUBLIC_` 前缀的变量会暴露到浏览器客户端
- **数据库连接字符串不应该使用这个前缀** (安全风险!)

正确的环境变量名应该是:
```
POSTGRES_URL=postgresql://...
# 或
DATABASE_URL=postgresql://...
# 或
SUPABASE_DB_URL=postgresql://...
```

❌ **错误** (不要这样):
```
NEXT_PUBLIC_POSTGRES_URL=postgresql://...  # 会暴露到客户端!
```

### 4. 重新部署

完成上述检查后,触发新的部署:

```bash
# 方式1: 推送新的提交
git add .
git commit -m "fix: update database configuration for Vercel"
git push

# 方式2: 在 Vercel Dashboard 手动触发重新部署
# Deployments → 点击最新部署 → Redeploy
```

### 5. 查看部署日志

重新部署后,查看构建日志:

1. 进入 Vercel Dashboard → Deployments
2. 点击最新的部署
3. 查看 "Building" 阶段的日志
4. 应该能看到:
   ```
   🔗 Connecting to Supabase PostgreSQL database...
   📍 Connection details: { host: '...', port: '6543', ... }
   ✅ Supabase database connection established
   ```

## 当前代码改进

我已经更新了 `src/lib/db/index.ts`,实现了**延迟初始化**:
- 数据库连接不会在构建时创建
- 只有在实际使用时才会连接数据库
- 避免了构建阶段的环境变量问题

## 后续步骤

1. ✅ 在 Vercel Dashboard 检查环境变量设置
2. ✅ 确认使用正确的变量名 (不带 `NEXT_PUBLIC_` 前缀)
3. ✅ 验证数据库 URL 使用 pooler 地址
4. ✅ 触发 Vercel 重新同步环境变量
5. ✅ 推送代码或手动触发重新部署
6. ✅ 查看部署日志确认成功

## 环境变量清单

以下是你需要在 Vercel 中设置的完整环境变量列表:

### 数据库 (必需)
```bash
# 从 Supabase Integration 自动同步,或手动设置其中之一:
POSTGRES_URL=postgresql://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
# 或
DATABASE_URL=postgresql://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Supabase (如果使用客户端 SDK)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # 注意:不要加 NEXT_PUBLIC_ 前缀
```

### NextAuth (必需)
```bash
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
```

### 其他服务
```bash
# 根据你的项目需求添加其他环境变量
# 例如: R2存储, 微信公众号, 知乎等
```

## 调试技巧

如果部署仍然失败,可以添加一个测试 API 来验证环境变量:

创建 `src/app/api/debug-env/route.ts`:
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasSupabaseDbUrl: !!process.env.SUPABASE_DB_URL,
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    // 只显示连接字符串的开头部分
    postgresUrlPrefix: process.env.POSTGRES_URL?.substring(0, 30),
  });
}
```

部署后访问: `https://your-domain.vercel.app/api/debug-env`

**记住**: 测试完成后删除这个文件,避免泄露敏感信息!
