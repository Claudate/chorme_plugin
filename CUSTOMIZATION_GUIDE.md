# 项目定制指南

本指南将帮助您将此项目完全定制为您自己的品牌。

## 一、去除原有品牌信息

### 1.1 更新项目名称

**文件**: `package.json`
```json
{
  "name": "your-app-name",  // 改为您的应用名
  "version": "1.0.0"
}
```

### 1.2 更新应用标题和元数据

**文件**: `src/app/layout.tsx`

```typescript
export const metadata: Metadata = {
  title: '您的应用名称',  // 修改这里
  description: '您的应用描述',  // 修改这里
  // ... 其他元数据
}
```

### 1.3 更新网站配置

**文件**: 搜索项目中所有包含"ziliu"或"字流"的文件

```bash
# 在项目根目录执行
grep -r "ziliu" src/
grep -r "字流" src/
```

需要修改的主要文件：
- `src/app/page.tsx` - 首页内容
- `src/app/pricing/page.tsx` - 价格页面
- `src/app/extension/page.tsx` - 扩展页面
- `src/components/seo/structured-data.tsx` - SEO 数据

### 1.4 更新 Chrome 扩展信息

**文件**: `plugin/manifest.json`

```json
{
  "name": "您的扩展名称",
  "description": "您的扩展描述",
  "author": "您的名字或公司",
  "homepage_url": "https://yourdomain.com"
}
```

**文件**: `plugin/plugins/config.js`

搜索并替换所有"字流"、"Ziliu"等品牌词。

### 1.5 更新环境变量

**文件**: `.env.local`

```bash
NEXT_PUBLIC_APP_NAME="您的应用名"
NEXT_PUBLIC_APP_DOMAIN="yourdomain.com"
FROM_EMAIL="noreply@yourdomain.com"
```

---

## 二、自定义品牌样式

### 2.1 更新 Logo

准备以下尺寸的 Logo：
- `public/logo.svg` - SVG 格式（推荐）
- `public/logo.png` - 192x192 (用于 PWA)
- `public/favicon.ico` - 网站图标
- `plugin/icons/` - 扩展图标（16x16, 48x48, 128x128）

### 2.2 更新颜色主题

**文件**: `src/app/globals.css`

```css
@layer base {
  :root {
    --primary: 222.2 47.4% 11.2%;    /* 主色 */
    --primary-foreground: 210 40% 98%;
    --accent: 210 40% 96.1%;          /* 强调色 */
    /* 根据您的品牌修改这些颜色值 */
  }
}
```

或使用 Shadcn UI 的主题生成器：
https://ui.shadcn.com/themes

### 2.3 更新字体

**文件**: `src/app/layout.tsx`

```typescript
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  // 或使用您喜欢的字体
})
```

### 2.4 自定义组件样式

主要组件位置：
- `src/components/ui/` - UI 基础组件
- `src/components/editor/` - 编辑器组件
- `src/components/layout/` - 布局组件

---

## 三、自定义功能

### 3.1 添加/删除支持的平台

**文件**: `plugin/plugins/config.js`

```javascript
platforms: [
  // 保留您需要的平台
  {
    id: 'wechat',
    displayName: '微信公众号',
    enabled: true,  // 设为 false 可禁用
    // ...
  },
  // 添加新平台（参考 PLUGIN_EXTENSION_GUIDE.md）
]
```

### 3.2 自定义样式预设

**文件**: `src/lib/converter.ts`

```typescript
const styles = {
  default: { /* 默认样式 */ },
  tech: { /* 技术风格 */ },
  minimal: { /* 极简风格 */ },
  elegant: { /* 优雅风格 */ },
  // 添加您自己的样式
  custom: { /* 自定义样式 */ }
}
```

### 3.3 修改订阅计划

**文件**: `src/lib/db/schema-postgres.ts`

```typescript
plan: varchar('plan', {
  enum: ['free', 'pro', 'enterprise']  // 添加您的计划
}).notNull().default('free'),
```

**文件**: `src/app/pricing/page.tsx`

修改价格展示和功能列表。

### 3.4 自定义图片限制

**文件**: 搜索 `imageLimit` 相关代码

```typescript
const IMAGE_LIMITS = {
  free: 10,      // 免费用户：10张/月
  pro: Infinity, // Pro 用户：无限
  // 根据您的业务模型调整
}
```

---

## 四、配置域名和邮件

### 4.1 配置域名

**DNS 记录**（在您的域名提供商处配置）：

```
类型    名称    值
A       @       76.76.21.21 (Vercel IP)
CNAME   www     cname.vercel-dns.com
```

**Vercel 配置**：
1. 进入 Vercel 项目设置
2. Domains → Add Domain
3. 输入您的域名
4. 验证 DNS 配置

### 4.2 配置邮件服务

**选项 1: Resend (推荐)**

1. 注册 [resend.com](https://resend.com)
2. 验证域名
3. 获取 API Key
4. 配置环境变量：
   ```bash
   RESEND_API_KEY="re_..."
   FROM_EMAIL="noreply@yourdomain.com"
   ```

**选项 2: SendGrid / Mailgun**

类似步骤，参考各服务文档。

---

## 五、SEO 优化

### 5.1 更新 Sitemap

**文件**: `src/app/sitemap.ts`

```typescript
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://yourdomain.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // 添加您的页面
  ]
}
```

### 5.2 更新 Robots.txt

**文件**: `src/app/robots.ts`

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: 'https://yourdomain.com/sitemap.xml',
  }
}
```

### 5.3 配置 Google Analytics

```bash
# .env.local
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
```

在 `src/app/layout.tsx` 中添加 GA 脚本。

---

## 六、安全配置

### 6.1 设置 CSP (内容安全策略)

**文件**: `next.config.js`

```javascript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; ..."
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
]
```

### 6.2 设置 CORS

如果需要允许特定域名访问 API：

**文件**: `src/middleware.ts`

```typescript
export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ]

  if (origin && allowedOrigins.includes(origin)) {
    // 允许跨域
  }
}
```

### 6.3 环境变量安全

**重要**：
- ✅ 以 `NEXT_PUBLIC_` 开头的变量会暴露给前端
- ❌ 敏感信息（API密钥、数据库密码）不要使用 `NEXT_PUBLIC_` 前缀
- ✅ 在 `.gitignore` 中忽略 `.env.local`

---

## 七、多语言支持（可选）

### 7.1 使用 next-intl

```bash
npm install next-intl
```

### 7.2 配置语言文件

```
locales/
  ├── en.json
  ├── zh-CN.json
  └── zh-TW.json
```

### 7.3 在组件中使用

```typescript
import { useTranslations } from 'next-intl'

export default function Component() {
  const t = useTranslations('common')
  return <h1>{t('title')}</h1>
}
```

---

## 八、监控与分析

### 8.1 错误监控 (Sentry)

```bash
npm install @sentry/nextjs
```

**配置**: `sentry.client.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

### 8.2 性能监控 (Vercel Analytics)

```bash
npm install @vercel/analytics
```

**使用**:

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 8.3 用户行为分析 (Umami)

免费开源的 Google Analytics 替代品。

1. 部署 Umami：https://umami.is/docs/install
2. 获取 Website ID
3. 添加到环境变量：
   ```bash
   UMAMI_WEBSITE_ID="your-website-id"
   ```

---

## 九、备份策略

### 9.1 数据库备份

**自动备份脚本** (`scripts/backup-db.sh`):

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump "$DATABASE_URL" > "backups/db_$DATE.sql"

# 只保留最近7天的备份
find backups/ -name "db_*.sql" -mtime +7 -delete
```

设置定时任务（cron）：

```bash
# 每天凌晨2点备份
0 2 * * * /path/to/backup-db.sh
```

### 9.2 代码备份

使用 Git + GitHub/GitLab：

```bash
# 定期推送
git add .
git commit -m "Backup $(date)"
git push origin main
```

### 9.3 文件存储备份

如果使用 R2，可以设置定期同步到其他存储：

```bash
# 使用 rclone 同步到 S3
rclone sync r2:your-bucket s3:backup-bucket
```

---

## 十、检查清单

在部署到生产环境前，请确保：

### 安全
- [ ] 已设置强密码的 `NEXTAUTH_SECRET`
- [ ] 数据库密码已更改
- [ ] API 密钥未暴露在代码中
- [ ] 已配置 HTTPS/SSL
- [ ] 已设置 CSP 和安全头

### 品牌
- [ ] 已更新所有"字流"、"ziliu"品牌词
- [ ] Logo 和图标已更换
- [ ] 颜色主题已自定义
- [ ] 网站标题和描述已修改

### 功能
- [ ] 注册/登录功能正常
- [ ] 文章创建和编辑正常
- [ ] 图片上传正常
- [ ] 一键发布功能正常
- [ ] Chrome 扩展正常工作

### SEO
- [ ] Sitemap 已配置
- [ ] Robots.txt 已配置
- [ ] Google Analytics 已添加
- [ ] 元标签已更新

### 性能
- [ ] 已启用图片优化
- [ ] 已配置 CDN
- [ ] 已启用缓存
- [ ] 已压缩静态资源

### 监控
- [ ] 错误监控已配置（Sentry）
- [ ] 性能监控已配置（Vercel Analytics）
- [ ] 备份策略已实施

---

## 十一、推荐的定制流程

### 阶段 1: 基础定制（1-2天）
1. 更新所有品牌信息
2. 更换 Logo 和图标
3. 自定义颜色主题
4. 配置域名

### 阶段 2: 功能定制（3-5天）
5. 调整订阅计划
6. 自定义样式预设
7. 添加/删除支持的平台
8. 配置邮件服务

### 阶段 3: 优化与上线（2-3天）
9. SEO 优化
10. 性能优化
11. 安全加固
12. 部署到生产环境

### 阶段 4: 监控与维护（持续）
13. 配置监控和备份
14. 收集用户反馈
15. 持续优化

---

## 十二、常见定制需求

### 添加新的内容样式

**步骤**：
1. 在 `src/lib/converter.ts` 添加样式定义
2. 在 `src/lib/db/schema-postgres.ts` 的 enum 中添加
3. 在前端选择器中添加选项

### 修改免费版限制

**位置**：
- 图片限制：搜索 `IMAGE_LIMITS`
- 平台限制：在平台配置中设置 `requiredPlan`
- 功能限制：在组件中检查 `user.plan`

### 添加新的支付网关

参考 Stripe 集成方式，实现类似的流程：
1. 创建支付会话
2. 处理回调
3. 更新用户订阅状态

---

## 需要帮助？

- 技术问题：查看 [TECH_STACK.md](./TECH_STACK.md)
- 部署问题：查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- 扩展开发：查看 [PLUGIN_EXTENSION_GUIDE.md](./PLUGIN_EXTENSION_GUIDE.md)

祝您定制顺利！🎨
