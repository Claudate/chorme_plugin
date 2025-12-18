# Nano-AI 项目故障排查指南

## 什么时候使用

- 遇到前端或后端错误
- API 调用失败
- 部署后出现问题
- 本地开发环境异常
- 数据库连接问题

---

## 前端常见问题

### 问题 1: API 调用失败（CORS 错误）

**症状**:
- 浏览器控制台显示 CORS 错误
- 错误信息: "Access to fetch at '...' from origin '...' has been blocked by CORS policy"

**排查步骤**:

```bash
# 1. 检查前端环境变量
cat frontend/.env.local

# 应该包含:
# VITE_API_URL=http://localhost:8787  (本地开发)
# 或
# VITE_API_URL=https://api.nanobananamaker.com  (生产环境)
```

**解决方案 1: 检查后端 CORS 配置**

```typescript
// backend/src/index.ts 或 backend/src/middleware/cors.ts
app.use('/*', cors({
  origin: [
    'http://localhost:5173',           // 本地前端
    'https://nanobananamaker.com',     // 生产前端
    'https://www.nanobananamaker.com'
  ],
  credentials: true,
}));
```

**解决方案 2: 确保后端已部署并运行**

```bash
# 本地开发环境
cd backend
npm run dev

# 测试后端是否可访问
curl http://localhost:8787/health
```

**解决方案 3: 重启前端开发服务器**

```bash
# Ctrl+C 停止，然后重启
cd frontend
npm run dev
```

---

### 问题 2: 环境变量未生效

**症状**:
- `import.meta.env.VITE_API_URL` 返回 `undefined`
- API 调用使用了错误的 URL

**排查步骤**:

```bash
# 1. 检查环境变量文件是否存在
ls -la frontend/.env.local

# 2. 检查文件内容
cat frontend/.env.local
```

**解决方案**:

```bash
# 1. 确保变量名以 VITE_ 开头
# ✅ 正确
VITE_API_URL=http://localhost:8787

# ❌ 错误（不会被 Vite 识别）
API_URL=http://localhost:8787

# 2. 重启开发服务器（环境变量修改后必须重启）
# Ctrl+C 停止
npm run dev

# 3. 在浏览器控制台验证
console.log(import.meta.env.VITE_API_URL);
```

---

### 问题 3: 翻译文本不显示

**症状**:
- `t('key')` 显示键名而非翻译文本
- 页面显示 "home.title" 而不是 "AI 提示词库"

**排查步骤**:

```bash
# 1. 检查翻译文件是否存在
ls frontend/src/i18n/locales/

# 应该看到: en.json  zh.json

# 2. 检查翻译文件内容
cat frontend/src/i18n/locales/zh.json
```

**解决方案 1: 检查翻译键是否存在**

```json
// frontend/src/i18n/locales/zh.json
{
  "home": {
    "title": "AI 提示词库"  // 确保这个键存在
  }
}
```

**解决方案 2: 检查 i18next 初始化**

```typescript
// 在组件中添加调试信息
import { useTranslation } from 'react-i18next';

function Component() {
  const { t, i18n } = useTranslation();

  console.log('Current language:', i18n.language);
  console.log('Translation:', t('home.title'));

  // ...
}
```

**解决方案 3: 清除缓存并重启**

```bash
# 清除 node_modules 和缓存
rm -rf frontend/node_modules
rm -rf frontend/.vite

# 重新安装
cd frontend
npm install
npm run dev
```

---

### 问题 4: 页面空白或无内容

**症状**:
- 打开应用显示空白页面
- 浏览器控制台有错误

**排查步骤**:

```bash
# 1. 打开浏览器开发者工具（F12）
# 2. 查看 Console 标签是否有错误
# 3. 查看 Network 标签查看请求是否成功
```

**解决方案 1: 检查路由配置**

```typescript
// frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />  {/* 确保有根路由 */}
        {/* 其他路由... */}
      </Routes>
    </BrowserRouter>
  );
}
```

**解决方案 2: 检查组件导入**

```typescript
// ✅ 正确
import { Home } from './pages/Home';
export function Home() { ... }

// ❌ 错误（export default 与 import {} 不匹配）
import { Home } from './pages/Home';
export default function Home() { ... }
```

**解决方案 3: 检查数据加载**

```typescript
// 在组件中添加加载状态
function Home() {
  const { prompts, loading, error } = usePromptStore();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!prompts.length) return <div>No data</div>;

  return <div>{/* 正常渲染 */}</div>;
}
```

---

### 问题 5: 构建失败

**症状**:
- `npm run build` 报错
- TypeScript 类型错误

**排查步骤**:

```bash
# 1. 检查 TypeScript 错误
cd frontend
npx tsc --noEmit

# 2. 查看具体错误信息
```

**解决方案**:

```bash
# 1. 清除缓存和依赖
rm -rf node_modules dist .vite
npm install

# 2. 修复 TypeScript 错误后重新构建
npm run build

# 3. 如果仍然失败，检查依赖版本
npm outdated
```

---

## 后端常见问题

### 问题 1: 部署后 API 返回 500 错误

**症状**:
- 部署成功但 API 调用返回 500 Internal Server Error
- 前端无法获取数据

**排查步骤**:

```bash
# 1. 查看实时日志
cd backend
wrangler tail

# 2. 检查已设置的密钥
wrangler secret list

# 应该看到:
# - SUPABASE_URL
# - SUPABASE_SERVICE_KEY
```

**解决方案 1: 设置缺失的环境变量**

```bash
# 设置 Supabase URL
wrangler secret put SUPABASE_URL
# 输入: https://your-project.supabase.co

# 设置 Supabase Service Key
wrangler secret put SUPABASE_SERVICE_KEY
# 输入: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 重新部署
wrangler deploy
```

**解决方案 2: 检查数据库连接**

```typescript
// backend/src/db/supabase.ts
export function getSupabaseClient(env: Env) {
  console.log('SUPABASE_URL:', env.SUPABASE_URL);  // 添加日志

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_KEY
  );
  return supabase;
}
```

**解决方案 3: 验证 Supabase 密钥**

1. 登录 https://app.supabase.com
2. 选择项目 → Settings → API
3. 复制 URL 和 Service Key
4. 重新设置密钥（使用 `wrangler secret put`）

---

### 问题 2: 本地开发无法连接数据库

**症状**:
- `wrangler dev` 启动后 API 调用数据库失败
- 返回数据库连接错误

**排查步骤**:

```bash
# 1. 检查是否有 .dev.vars 文件
ls backend/.dev.vars

# 2. 查看文件内容
cat backend/.dev.vars
```

**解决方案**:

```bash
# 1. 创建 .dev.vars 文件（用于本地开发）
cd backend
cat > .dev.vars << EOF
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF

# 2. 重启开发服务器
npm run dev

# 3. 测试连接
curl http://localhost:8787/health
curl http://localhost:8787/api/tags
```

---

### 问题 3: wrangler deploy 认证失败

**症状**:
- 部署时提示 "Not authenticated"
- 无法登录 Cloudflare

**解决方案**:

```bash
# 方法 1: 重新登录
wrangler logout
wrangler login

# 方法 2: 手动设置 API Token
# 1. 登录 Cloudflare Dashboard
# 2. My Profile → API Tokens → Create Token
# 3. 使用 "Edit Cloudflare Workers" 模板
# 4. 复制 Token

# 设置环境变量
export CLOUDFLARE_API_TOKEN=your_token_here

# 或在 ~/.wrangler/config/default.toml 中配置
```

---

### 问题 4: R2 存储桶访问失败

**症状**:
- 上传文件到 R2 失败
- 返回存储桶相关错误

**排查步骤**:

```bash
# 1. 列出所有 R2 存储桶
wrangler r2 bucket list

# 2. 检查 wrangler.toml 配置
cat backend/wrangler.toml
```

**解决方案**:

```bash
# 1. 创建 R2 存储桶（如果不存在）
wrangler r2 bucket create nano

# 2. 确保 wrangler.toml 配置正确
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "nano"

# 3. 重新部署
wrangler deploy
```

---

### 问题 5: API 响应慢或超时

**症状**:
- API 请求耗时超过 10 秒
- 返回超时错误

**排查步骤**:

```bash
# 1. 使用 curl 测试响应时间
time curl "https://api.nanobananamaker.com/api/prompts?page=1&limit=20"

# 2. 查看日志
wrangler tail
```

**解决方案 1: 优化数据库查询**

```typescript
// ✅ 优化后：使用索引字段
const { data } = await supabase
  .from('nano_prompts')
  .select('id, title, tags')  // 只选择需要的字段
  .eq('is_visible', true)     // is_visible 有索引
  .range(0, 19);              // 限制返回数量

// ❌ 未优化：全表扫描
const { data } = await supabase
  .from('nano_prompts')
  .select('*');  // 返回所有字段，无条件筛选
```

**解决方案 2: 添加数据库索引**

在 Supabase SQL 编辑器执行：

```sql
-- 为常用查询字段创建索引
CREATE INDEX IF NOT EXISTS idx_nano_prompts_is_visible
ON nano_prompts(is_visible);

CREATE INDEX IF NOT EXISTS idx_nano_prompts_tags
ON nano_prompts USING GIN(tags);
```

**解决方案 3: 启用缓存**

```typescript
// 为静态数据添加缓存头
app.get('/api/tags', async (c) => {
  const data = await getTags();

  c.header('Cache-Control', 'public, max-age=3600');  // 缓存 1 小时

  return c.json(data);
});
```

---

## 数据库常见问题

### 问题 1: 迁移执行失败

**症状**:
- SQL 执行时提示权限不足
- "permission denied for table..."

**解决方案**:

```sql
-- 方法 1: 暂时禁用 RLS（Row Level Security）
ALTER TABLE nano_prompts DISABLE ROW LEVEL SECURITY;

-- 执行迁移...
ALTER TABLE nano_prompts ADD COLUMN new_field TEXT;

-- 重新启用 RLS
ALTER TABLE nano_prompts ENABLE ROW LEVEL SECURITY;

-- 方法 2: 使用 Service Role Key
-- 确保在 Supabase 中使用的是 Service Role Key，而不是 anon key
```

---

### 问题 2: 查询返回空数据

**症状**:
- API 调用成功但返回空数组
- 数据库中确实有数据

**排查步骤**:

```sql
-- 1. 直接在 Supabase SQL 编辑器查询
SELECT COUNT(*) FROM nano_prompts;

-- 2. 检查过滤条件
SELECT COUNT(*) FROM nano_prompts WHERE is_visible = true;

-- 3. 查看示例数据
SELECT * FROM nano_prompts LIMIT 5;
```

**解决方案**:

```typescript
// 检查查询条件是否正确
const { data, error } = await supabase
  .from('nano_prompts')
  .select('*')
  .eq('is_visible', true);  // 检查这个条件是否正确

if (error) {
  console.error('Query error:', error);
}

console.log('Data count:', data?.length);
```

---

## 调试技巧

### 前端调试

```typescript
// 1. 使用 console.log 调试
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Response:', response);

// 2. 使用 React DevTools
// 安装浏览器扩展：React Developer Tools

// 3. 网络请求调试
// 浏览器 F12 → Network 标签 → 查看 XHR/Fetch 请求
```

### 后端调试

```typescript
// 1. 在代码中添加日志
console.log('Request query:', c.req.query());
console.log('Database result:', data);

// 2. 使用 wrangler tail 查看实时日志
wrangler tail

// 3. 本地测试时使用详细日志
npm run dev  // 自动显示所有日志
```

---

## 快速排查清单

### 前端问题
- [ ] 检查浏览器控制台是否有错误
- [ ] 检查 Network 标签查看 API 请求状态
- [ ] 确认环境变量配置正确
- [ ] 确认后端服务正在运行
- [ ] 尝试清除缓存并重启

### 后端问题
- [ ] 检查 `wrangler tail` 日志
- [ ] 确认所有 Secrets 已设置
- [ ] 测试本地开发环境
- [ ] 验证数据库连接
- [ ] 检查 CORS 配置

### 数据库问题
- [ ] 在 Supabase SQL 编辑器直接查询
- [ ] 检查表结构和索引
- [ ] 验证 RLS 策略
- [ ] 检查 Service Key 权限

---

## 获取帮助

如果以上方法都无法解决问题：

1. **查看日志**:
   - 前端：浏览器控制台（F12）
   - 后端：`wrangler tail`
   - 数据库：Supabase Logs

2. **参考文档**:
   - 前端：[../frontend/CLAUDE.md](../frontend/CLAUDE.md)
   - 后端：[../backend/CLAUDE.md](../backend/CLAUDE.md)
   - 部署：[../docs/WRANGLER_DEPLOYMENT.md](../docs/WRANGLER_DEPLOYMENT.md)

3. **检查相关资源**:
   - [Hono 文档](https://hono.dev/)
   - [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
   - [Supabase 文档](https://supabase.com/docs)
   - [Vite 文档](https://vite.dev/)

---

## 常用调试命令

```bash
# 前端
cd frontend
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npx tsc --noEmit         # 检查 TypeScript 错误

# 后端
cd backend
wrangler dev             # 本地开发
wrangler tail            # 查看实时日志
wrangler secret list     # 列出密钥
wrangler deploy          # 部署

# 测试 API
curl http://localhost:8787/health
curl http://localhost:8787/api/tags
curl "http://localhost:8787/api/prompts?page=1&limit=5"
```
