# 述而作（Ziliu）技术框架文档

## 项目概述

述而作是一个基于 Next.js 的多平台内容发布 SaaS 应用，支持将 Markdown 内容一键转换并发布到微信公众号、知乎、掘金等多个中文内容平台。

## 技术栈概览

### 前端技术栈

#### 核心框架
- **Next.js 15.4.3** - React 全栈框架，采用 App Router 架构
- **React 19.1.0** - 用户界面库
- **TypeScript 5.0** - 类型安全的 JavaScript 超集

#### 样式方案
- **Tailwind CSS 4.0** - 原子化 CSS 框架
- **PostCSS** - CSS 预处理器
- **class-variance-authority (CVA)** - 组件变体管理
- **clsx & tailwind-merge** - 类名合并工具

#### UI 组件库
- **Radix UI** - 无样式的可访问组件基础
- **shadcn/ui** - 基于 Radix 的组件库
- **lucide-react** - 图标库
- **@uiw/react-md-editor** - Markdown 编辑器

#### 内容处理
- **marked.js** - Markdown 转 HTML
- **turndown** - HTML 转 Markdown
- **highlight.js** - 代码高亮
- **sanitize-html** - HTML 安全处理

### 后端技术栈

#### 运行时与框架
- **Next.js API Routes** - Serverless 函数
- **Node.js** - JavaScript 运行时
- **Edge Runtime** - Vercel 边缘函数

#### 认证与安全
- **NextAuth.js 4.24.11** - 身份认证框架
  - 策略：Credentials Provider（用户名密码）
  - 会话：JWT-based sessions
- **bcryptjs** - 密码哈希加密
- **Zod 4.0.8** - 运行时类型验证与 Schema 校验

#### 数据库层

##### ORM 与客户端
- **Drizzle ORM 0.44.3** - 类型安全的 ORM
- **drizzle-kit** - 数据库迁移工具
- **@libsql/client** - LibSQL/SQLite 客户端

##### 数据库配置
- **开发环境**：SQLite（本地文件 `dev.db`）
- **生产环境**：Turso（分布式 LibSQL）

##### 数据库架构
```typescript
// 核心表结构
users              // 用户表（含订阅计划）
articles           // 文章表（Markdown 内容）
publishRecords     // 发布记录（多平台追踪）
publishPresets     // 发布预设（可复用配置）
redeemCodes        // 兑换码（订阅管理）
imageUsageStats    // 图片使用统计（配额追踪）
videoContents      // 视频内容（视频平台元数据）
```

##### 关键字段设计
- `users`: email, password, name, subscriptionPlan, subscriptionExpiry
- `articles`: userId, title, content, style, status
- `publishRecords`: articleId, platform, publishUrl, status
- `publishPresets`: userId, platform, author, header, footer, settings

#### 文件存储与 CDN

##### 主存储方案
- **Cloudflare R2** - S3 兼容对象存储
- **AWS SDK (@aws-sdk/client-s3)** - S3 操作客户端

##### 多 CDN 支持
系统架构支持多种图片存储提供商：
- Cloudflare R2（默认）
- 七牛云
- 腾讯云 COS
- 阿里云 OSS
- GitHub（作为 CDN）

##### 自定义存储
- Pro 用户可配置自己的 R2 存储桶
- 支持自定义域名和访问密钥

### 浏览器扩展

#### 基本信息
- **类型**：Chrome Extension
- **Manifest 版本**：V3
- **当前版本**：1.3.3
- **架构**：模块化插件系统

#### 支持平台
- 微信公众号（WeChat Official Account）
- 知乎（Zhihu）
- 掘金（Juejin）
- 知识星球（Zhishixingqiu）
- 微信视频号（WeChat Video Account）
- 抖音（Douyin）
- B站（Bilibili）
- 小红书（Xiaohongshu）

#### 核心功能
- 内容注入到平台编辑器
- 平台检测与自动激活
- 剪贴板监控
- 用户订阅验证
- 后台服务工作线程（Background Service Worker）

#### 技术实现
```
extension/
├── manifest.json           # 扩展配置
├── background.js          # 后台服务工作线程
├── core/
│   ├── platform-detector.js  # 平台检测
│   └── content-injector.js   # 内容注入
└── plugins/
    └── platforms/
        ├── wechat.js      # 微信公众号插件 (48KB)
        ├── zhihu.js       # 知乎插件
        ├── juejin.js      # 掘金插件
        ├── zsxq.js        # 知识星球插件 (67KB)
        ├── video-wechat.js # 视频号插件
        ├── douyin.js      # 抖音插件
        ├── bilibili.js    # B站插件
        └── xiaohongshu.js # 小红书插件
```

## 核心功能实现

### 一键发布架构

#### 发布流程
```
用户编辑器 → API 路由 (/api/publish)
  → 平台特定处理器
  → Chrome 扩展
  → 平台编辑器
```

#### 服务端发布 API
位置：`src/app/api/publish/route.ts`

**功能**：
- 通过 NextAuth 验证用户身份
- 接受参数：title, content, platform, settings
- 应用页眉/页脚自定义
- 路由到平台特定处理器：
  - `publishToWechat()` - 微信公众号
  - `publishToZhihu()` - 知乎
  - `publishToJuejin()` - 掘金
  - `publishToZsxq()` - 知识星球
- 返回成功/失败状态及平台 URL

#### Chrome 扩展集成

**后台服务工作线程** (`extension/background.js`)：
- 监听来自 Web 应用的发布请求
- 管理跨域通信
- 处理认证状态

**内容脚本**（按平台注入）：
- 检测编辑器元素（DOM 选择器）
- 填充标题、作者、内容、摘要
- 处理旧版（UEditor）和新版（ProseMirror）编辑器
- 注入期间保留格式

**平台插件** (`extension/plugins/platforms/`)：
- 每个平台独立的 JavaScript 文件
- 处理平台特定的 DOM 操作
- 适配不同编辑器架构
- 支持图片上传和格式转换

### 内容转换管道

位置：`src/lib/converter.ts`

#### 转换流程
```
Markdown 内容
  ↓
marked.js 解析（支持 GFM）
  ↓
样式应用（4 种样式预设）
  ↓
HTML 预处理（微信兼容性优化）
  ↓
内联样式注入
  ↓
平台就绪的 HTML
```

#### 样式系统
- `default`: 简洁专业风格
- `tech`: 代码友好型（带语法高亮）
- `elegant`: 杂志式布局
- `minimal`: 极简设计

#### 高级预处理
- 将 `<h1-h3>` 转换为样式化的 `<p>` 标签（微信兼容性）
- 处理代码块，保留 `<br>` 和 `&nbsp;`
- 支持特殊语法：
  - `[!STEPS]` → 编号徽章列表
  - `[!KEY]/[!CONCLUSION]` → 样式化结论卡片
- 图片 CDN 转换
- 中文平台字体堆栈优化

#### 转换代码示例
```typescript
// src/lib/converter.ts
export function convertMarkdownToHtml(
  markdown: string,
  style: string = 'default'
): string {
  // 1. Markdown → HTML
  let html = marked.parse(markdown);

  // 2. 应用样式
  html = applyStyle(html, style);

  // 3. 微信预处理
  html = preprocessForWechat(html);

  // 4. 内联样式
  html = inlineStyles(html);

  return html;
}
```

### 发布预设系统

#### 数据库表：`publishPresets`
```typescript
{
  id: string;
  userId: string;
  platform: string;      // 'wechat' | 'zhihu' | 'juejin' 等
  name: string;          // 预设名称
  author: string;        // 作者名
  header: string;        // 页眉内容（Markdown）
  footer: string;        // 页脚内容（Markdown）
  settings: object;      // 平台特定设置（JSON）
  isDefault: boolean;    // 是否为默认预设
  createdAt: Date;
  updatedAt: Date;
}
```

#### 功能特性
- 每个用户可创建多个预设
- 按平台配置不同的作者名、页眉页脚
- 支持平台特定设置（JSON 存储）
- 可选：自动生成 AI 摘要
- 默认预设自动应用
- 可复用配置

### 一键复制机制

#### 用户流程
1. 用户点击"复制 HTML"按钮
2. 转换后的 HTML 复制到剪贴板
3. Chrome 扩展检测剪贴板内容
4. 用户导航到目标平台时自动填充编辑器
5. 视觉反馈和状态更新

#### 技术实现
```javascript
// 前端复制逻辑
async function copyHtml() {
  const html = await convertToHtml(markdown, style);
  await navigator.clipboard.writeText(html);
  showToast('已复制到剪贴板');
}

// 扩展监听
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'PASTE_CONTENT') {
    injectContentToEditor(message.content);
  }
});
```

### 扩展自动填充流程

```
1. 用户在述而作编辑器中写作
2. 点击平台预览（如"公众号"）
3. 内容转换为平台优化的 HTML
4. 用户点击"一键复制"或"打开编辑器"
5. 扩展检测平台 URL
6. 内容脚本查找编辑器元素
7. 注入标题、内容、作者、摘要
8. 保留格式和图片
9. 用户审查并手动发布
```

#### 平台检测
位置：`extension/core/platform-detector.js`

**功能**：
- 匹配每个平台的 URL 模式
- 激活相应插件
- 验证编辑器元素存在
- 准备就绪时显示 UI 面板

## 部署架构

### 托管平台：Vercel

#### Vercel 配置
文件：`vercel.json`

```json
{
  "functions": {
    "src/app/api/**/*": {
      "maxDuration": 60  // API 路由超时：60 秒
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

#### 构建配置
文件：`package.json`

```json
{
  "scripts": {
    "dev": "next dev --turbopack",     // Turbopack 快速开发
    "build": "next build",              // 生产构建
    "start": "next start",              // 生产服务器
    "db:generate": "drizzle-kit generate",  // 生成迁移文件
    "db:push": "drizzle-kit push",          // 推送 Schema
    "db:migrate": "drizzle-kit migrate",    // 运行迁移
    "extension:build": "node scripts/build-extension.mjs"  // 构建扩展
  }
}
```

### 部署流程

#### 自动部署（Web 应用）
```
1. Git Push → 主分支
   ↓
2. Vercel 自动检测 → 识别 Next.js 项目
   ↓
3. 构建过程：
   - 安装依赖（npm install）
   - 运行数据库迁移（如需要）
   - 执行 next build
   - 生成优化的静态资源
   - 为 API 路由创建 Serverless 函数
   ↓
4. 部署到边缘：
   - 静态资源 → Vercel CDN
   - API 路由 → Serverless 函数
   - Edge Runtime 优化性能
   ↓
5. 环境变量配置：
   - 数据库：TURSO_DATABASE_URL, TURSO_AUTH_TOKEN
   - 认证：NEXTAUTH_SECRET, NEXTAUTH_URL
   - 存储：R2 凭证
   - 可选：AI 服务、分析、支付
```

### 数据库部署

#### 环境切换
位置：`src/lib/db/index.ts`

```typescript
// 自动检测环境
const useTurso = process.env.TURSO_DATABASE_URL &&
  !process.env.TURSO_DATABASE_URL.includes('your-database-name');

// 创建客户端
const client = createClient({
  url: useTurso ? process.env.TURSO_DATABASE_URL : 'file:./dev.db',
  authToken: useTurso ? process.env.TURSO_AUTH_TOKEN : undefined
});
```

#### 迁移命令
```bash
# 生成迁移文件
npm run db:generate

# 推送 Schema 到数据库
npm run db:push

# 运行迁移
npm run db:migrate
```

### Chrome 扩展部署

#### 构建脚本
位置：`scripts/build-extension.mjs`

**流程**：
1. 从 `extension/manifest.json` 读取版本号
2. 可选：使用 `--bump` 标志自动升级补丁版本
3. 清理 `/public` 中的旧 zip 文件
4. 创建 zip 存档：`ziliu-extension-v{version}.zip`
5. 生成 `extension-latest.json` 元数据：
```json
{
  "version": "1.3.3",
  "filename": "ziliu-extension-v1.3.3.zip",
  "url": "/ziliu-extension-v1.3.3.zip",
  "buildAt": "2024-12-14T..."
}
```
6. 扩展通过 Next.js public 文件夹作为静态文件提供
7. 用户从 `/extension` 页面下载

#### 扩展更新流程
```
用户访问网站
  → 扩展检查版本
  → 如果过期 → 显示更新提示
  → 从 public 文件夹下载最新 zip
  → 在 Chrome 中手动安装
```

## 应用架构

### 系统架构图
```
┌─────────────────────────────────────────────────────────┐
│                    客户端浏览器                          │
├─────────────────────────────────────────────────────────┤
│  Next.js 前端 (React 19 + Tailwind)                    │
│  ├─ App Router 页面                                     │
│  ├─ React 组件（UI + 业务逻辑）                        │
│  └─ 客户端状态管理                                      │
├─────────────────────────────────────────────────────────┤
│  Chrome 扩展                                            │
│  ├─ 后台服务工作线程                                    │
│  ├─ 内容脚本（按平台）                                  │
│  └─ 平台插件系统                                        │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────┐
│              Vercel 边缘网络 (CDN)                      │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│         Next.js 后端 (API 路由)                         │
│  ├─ 身份认证 (NextAuth.js)                             │
│  ├─ 内容转换 (/api/convert)                            │
│  ├─ 发布逻辑 (/api/publish)                            │
│  ├─ 文件上传 (/api/upload)                             │
│  └─ 订阅管理                                            │
└─────────────────────────────────────────────────────────┘
           ↕                           ↕
┌──────────────────────┐    ┌─────────────────────────────┐
│   Turso 数据库       │    │   Cloudflare R2 存储        │
│   (LibSQL/SQLite)    │    │   (S3 兼容 CDN)             │
└──────────────────────┘    └─────────────────────────────┘
```

### 核心设计模式

1. **Monorepo 结构** - Web 应用 + Chrome 扩展在单一仓库
2. **API 路由处理器** - Serverless 函数处理后端逻辑
3. **插件架构** - 通过插件扩展平台支持
4. **服务层** - 可复用服务（图片上传、转换）
5. **功能标志** - 基于订阅的功能门控
6. **乐观 UI** - 即时反馈 + 后台同步
7. **状态持久化** - LocalStorage 存储编辑器状态
8. **撤销/重做系统** - 编辑器历史管理
9. **多租户** - 通过数据库关系隔离用户
10. **内容转换管道** - Markdown → HTML → 平台特定格式

### 目录结构
```
ziliu/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 认证相关页面
│   │   ├── api/               # API 路由
│   │   │   ├── auth/          # NextAuth 端点
│   │   │   ├── convert/       # 内容转换
│   │   │   ├── publish/       # 发布逻辑
│   │   │   └── upload/        # 文件上传
│   │   ├── dashboard/         # 用户仪表板
│   │   ├── editor/            # Markdown 编辑器
│   │   └── extension/         # 扩展下载页
│   ├── components/            # React 组件
│   │   ├── ui/               # shadcn/ui 组件
│   │   └── editor/           # 编辑器组件
│   ├── lib/                   # 工具库
│   │   ├── db/               # 数据库配置
│   │   ├── converter.ts      # Markdown 转换
│   │   ├── upload.ts         # 上传服务
│   │   └── utils.ts          # 通用工具
│   └── styles/               # 全局样式
├── extension/                 # Chrome 扩展
│   ├── manifest.json         # 扩展配置
│   ├── background.js         # 后台脚本
│   ├── core/                 # 核心功能
│   └── plugins/              # 平台插件
├── public/                    # 静态资源
├── scripts/                   # 构建脚本
├── drizzle.config.ts         # Drizzle ORM 配置
├── next.config.js            # Next.js 配置
├── tailwind.config.ts        # Tailwind 配置
└── vercel.json               # Vercel 部署配置
```

## 订阅与商业化

### 订阅等级

#### 免费版
- 基础功能
- 有限图片存储
- 部分平台支持

#### Pro 版
- 所有平台解锁
- 无限图片存储
- 自定义 R2 存储桶配置
- 高级样式
- 优先支持

### 技术实现

#### 兑换码系统
表：`redeemCodes`

```typescript
{
  code: string;           // 兑换码
  type: string;          // 订阅类型
  duration: number;      // 持续时间（天）
  isUsed: boolean;       // 是否已使用
  usedBy: string;        // 使用者 ID
  usedAt: Date;          // 使用时间
  createdAt: Date;
}
```

#### 功能守卫
```typescript
// React 组件中的订阅检查
function ProFeature({ children }) {
  const { user } = useSession();

  if (user.subscriptionPlan !== 'pro') {
    return <UpgradePrompt />;
  }

  return children;
}
```

## 性能优化

### 前端优化
- **Turbopack** - Next.js 15 快速开发服务器
- **React 19** - 自动批处理和并发功能
- **代码分割** - 按路由自动分割
- **图片优化** - Next.js Image 组件
- **字体优化** - next/font 自动优化

### 后端优化
- **Edge Runtime** - Vercel 边缘函数
- **Serverless** - 按需扩展
- **数据库连接池** - Drizzle ORM 连接管理
- **CDN 缓存** - Cloudflare R2 + Vercel CDN

### 扩展优化
- **惰性加载** - 插件按需加载
- **内容脚本隔离** - 每个平台独立脚本
- **消息传递优化** - 最小化跨上下文通信

## 安全措施

### 认证安全
- JWT 会话令牌
- bcrypt 密码哈希（10 轮 salt）
- 安全的 cookie 设置
- CSRF 保护（NextAuth 内置）

### API 安全
- 所有 API 路由需要认证
- 输入验证（Zod schema）
- SQL 注入防护（Drizzle ORM 参数化查询）
- XSS 防护（sanitize-html）

### HTTP 安全头
```javascript
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

### 环境变量
- 敏感信息存储在环境变量
- 从版本控制中排除 `.env`
- Vercel 环境变量加密

## 监控与日志

### 错误追踪
- Next.js 内置错误处理
- 客户端错误边界
- API 路由错误日志

### 性能监控
- Vercel Analytics（可选）
- Web Vitals 追踪
- API 响应时间监控

## 开发工作流

### 本地开发
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 数据库迁移
npm run db:push

# 构建扩展
npm run extension:build
```

### 代码质量
- TypeScript 严格模式
- ESLint 代码检查
- Prettier 代码格式化

### Git 工作流
- 主分支：`main`
- 功能分支：`feature/*`
- 修复分支：`fix/*`
- Vercel 自动预览部署

## 环境变量配置

### 必需变量
```env
# 数据库
TURSO_DATABASE_URL=libsql://xxx.turso.io
TURSO_AUTH_TOKEN=xxx

# 认证
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=http://localhost:3000

# R2 存储
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=xxx
R2_PUBLIC_URL=https://xxx
```

### 可选变量
```env
# AI 服务（可选）
OPENAI_API_KEY=xxx

# 分析（可选）
VERCEL_ANALYTICS_ID=xxx

# 支付（可选）
STRIPE_SECRET_KEY=xxx
```

## 扩展性考虑

### 水平扩展
- Vercel Serverless 自动扩展
- Turso 分布式数据库
- R2 对象存储（无限扩展）

### 垂直扩展
- 数据库索引优化
- API 路由缓存
- CDN 静态资源缓存

### 功能扩展
- 插件系统支持新平台
- 样式系统可扩展
- 存储提供商可插拔

## 总结

述而作是一个现代化的全栈应用，结合了：

1. **前端技术**：React 19 + Next.js 15 + Tailwind CSS
2. **后端技术**：Next.js API Routes + Serverless 架构
3. **数据库**：Drizzle ORM + Turso（分布式 SQLite）
4. **存储**：Cloudflare R2（S3 兼容）
5. **扩展**：Chrome Extension（Manifest V3）
6. **部署**：Vercel 自动化部署

**核心价值**：
- 一键多平台发布
- 智能内容转换
- 专业样式系统
- 无服务器架构
- 高度可扩展

**技术特点**：
- TypeScript 类型安全
- Serverless 按需扩展
- Edge Runtime 低延迟
- 插件化平台支持
- 现代化开发体验

---

**文档版本**：1.0
**最后更新**：2024-12-14
**维护者**：述而作开发团队
