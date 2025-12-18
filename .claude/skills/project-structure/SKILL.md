---
name: project-structure
description: 快速了解 Nano-AI 全栈项目架构。包含 3 层架构、前后端分离、MCP 服务、目录结构、技术栈、快速查找指南。(project)
---

# Nano-AI 项目结构快速参考

## 首次使用提示

**新窗口启动时，请先了解项目结构**：

Nano-AI 是一个**全栈 AI 提示词库平台**，包含 3 个独立的部分：
1. **frontend/** - React 前端（用户界面）
2. **backend/** - Cloudflare Workers API（服务端）
3. **mcp-server/** - MCP 服务器（批量翻译系统）

---

## 使用场景

- 新窗口启动时快速了解项目
- 开始修复 bug 前了解代码组织
- 添加新功能前确定文件位置
- 选择合适的 Skill 进行开发

---

## 项目概览

**项目名称**：Nano-AI - AI 提示词库管理平台

**核心功能**：
- 🌐 多语言 AI 提示词库（中文 + 英文）
- 🏷️ 标签分类与搜索
- 🤖 AI 驱动的批量翻译系统
- 📱 响应式设计
- 🔐 用户认证（Clerk）
- 🚀 SEO 优化

**技术栈**：
- **前端**: React 19 + Vite 7 + TailwindCSS 3
- **后端**: Hono 4 + Cloudflare Workers
- **状态**: Zustand 5（前端）
- **数据库**: Supabase
- **翻译**: 8 个翻译源 + MCP 服务器

---

## 架构设计

### 3 层架构

```
┌────────────────────────────────┐
│    前端 (React SPA)             │
│  - 页面组件                     │
│  - Zustand 状态管理            │
│  - TailwindCSS 样式            │
└────────────┬───────────────────┘
             │ HTTP REST API
             │
┌────────────▼───────────────────┐
│  后端 (Cloudflare Workers)      │
│  - Hono 路由处理               │
│  - 数据库操作                   │
│  - 搜索与过滤                   │
└────────────┬───────────────────┘
             │ Supabase SDK
             │
┌────────────▼───────────────────┐
│    数据库 (Supabase)           │
│  - Prompts（提示词）           │
│  - Tags（标签）                │
│  - Users（用户）               │
└────────────────────────────────┘

┌────────────────────────────────┐
│  MCP 服务器（独立）             │
│  - 批量翻译处理                 │
│  - 语言检测                     │
│  - 进度跟踪                     │
└────────────────────────────────┘
```

---

## 目录结构详解

### 顶层目录

```
nano-ai/
├── frontend/              # React 前端应用
├── backend/               # Cloudflare Workers API
├── mcp-server/            # MCP 服务器 + 批量翻译
├── .claude/              # Claude Code 配置
│   ├── skills/           # 9 个开发指导 Skill
│   └── mcp.json          # MCP 配置
├── docs/                 # 项目文档
└── QUICK_REFERENCE.md    # 快速参考
```

---

## 前端结构：`frontend/`

```
frontend/
├── src/
│   ├── App.tsx                  # 主应用（路由）
│   ├── main.tsx                 # 入口文件
│   │
│   ├── pages/                   # 页面组件
│   │   ├── Home.tsx             # 首页（提示词网格）
│   │   ├── PromptDetail.tsx     # 详情页
│   │   └── TagPage.tsx          # 标签过滤页
│   │
│   ├── components/              # UI 组件库
│   │   ├── auth/
│   │   │   └── ClerkAuthButton.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── LanguageLayout.tsx
│   │   ├── prompt/
│   │   │   ├── PromptCard.tsx
│   │   │   ├── PromptGrid.tsx
│   │   │   └── PromptModal.tsx
│   │   └── ui/
│   │       ├── SearchInput.tsx
│   │       ├── TagFilter.tsx
│   │       └── ScrollToTop.tsx
│   │
│   ├── stores/                  # Zustand 状态管理
│   │   └── promptStore.ts       # 提示词与标签状态
│   │
│   ├── services/                # 服务层
│   │   └── api.ts               # API 客户端
│   │
│   ├── types/                   # 类型定义
│   │   └── index.ts
│   │
│   ├── i18n/                    # 国际化
│   │   ├── index.ts             # i18next 配置
│   │   └── locales/
│   │       ├── en.json          # 英文翻译
│   │       └── zh.json          # 中文翻译
│   │
│   ├── lib/                     # 第三方配置
│   │   └── supabase.ts
│   │
│   └── utils/                   # 工具函数
│
├── public/                      # 静态文件
├── dist/                        # 构建输出
├── vite.config.ts               # Vite 配置
├── tailwind.config.js           # TailwindCSS 配置
├── tsconfig.json                # TypeScript 配置
└── package.json
```

---

## 后端结构：`backend/`

```
backend/
├── src/
│   ├── index.ts                 # Hono 应用入口
│   │
│   ├── routes/                  # API 路由
│   │   ├── prompts.ts           # GET/POST /api/prompts
│   │   ├── tags.ts              # /api/tags
│   │   ├── search.ts            # /api/search
│   │   ├── admin.ts             # /api/admin
│   │   └── sitemap.ts           # SEO 站点地图
│   │
│   ├── middleware/              # 中间件
│   │   ├── cors.ts              # CORS 处理
│   │   └── antiCrawler.ts       # 防爬虫
│   │
│   ├── db/                      # 数据库操作
│   │   └── supabase.ts
│   │
│   ├── storage/                 # 文件存储
│   │   └── r2.ts                # Cloudflare R2
│   │
│   ├── types/                   # 类型定义
│   │   └── index.ts
│   │
│   ├── config/                  # 配置
│   ├── constants/               # 常量
│   └── utils/                   # 工具函数
│
├── dist/                        # 编译输出
├── wrangler.toml                # Cloudflare Workers 配置
├── tsconfig.json
└── package.json
```

---

## MCP 服务器结构：`mcp-server/`

```
mcp-server/
├── src/
│   ├── index.ts                 # MCP 服务器主入口（CRUD）
│   ├── batch-translate.ts       # 批量翻译主入口
│   ├── batch-processor.ts       # 批处理核心逻辑
│   ├── language-detector.ts     # 语言检测引擎
│   ├── progress-manager.ts      # 进度追踪系统
│   ├── translators.ts           # 翻译管理器（8 个源）
│   │
│   ├── translators/             # 个别翻译器实现
│   │   └── baidu-ai.ts
│   │
│   └── [其他翻译工具]
│
├── scripts/
│   ├── run-batch-translate.js   # 启动脚本
│   └── add-processed-field.sql  # 数据库迁移
│
├── data/
│   ├── progress/                # 进度文件
│   └── reports/                 # 处理报告
│
├── .env                         # 环境变量
├── tsconfig.json
└── package.json
```

---

## Claude Code Skills 目录

```
.claude/skills/
├── project-structure/           # 项目结构（本文件）
├── coding-standards/            # 编码规范参考
├── config-management/           # 配置文件管理
├── context-resume/              # 恢复之前会话
├── context-save/                # 保存当前会话
├── doc-index-update/            # 更新文档索引
├── esm-fix/                     # 修复 ESM 导入错误
├── react-ui-development/        # React UI 开发指南
├── service-creation/            # Service 创建模板
├── mcp-server-development/      # MCP 服务器开发
├── cloudflare-workers-api/      # Cloudflare Workers API
├── batch-translation-system/    # 批量翻译系统
├── api-integration/             # API 集成指南
├── internationalization/        # 国际化指南
└── deployment-guide/            # 部署指南
```

---

## 技术栈详解

### 前端技术
| 库 | 版本 | 用途 |
|----|------|------|
| React | 19 | UI 框架 |
| Vite | 7 | 构建工具 |
| TypeScript | 5.9 | 类型系统 |
| Zustand | 5 | 状态管理 |
| TailwindCSS | 3 | 样式框架 |
| React Router | 7 | 路由管理 |
| i18next | - | 国际化 |
| Clerk | 5.57 | 认证系统 |
| Supabase | 2.86 | 数据库客户端 |

### 后端技术
| 库 | 版本 | 用途 |
|----|------|------|
| Hono | 4.10 | Web 框架 |
| TypeScript | 5.9 | 类型系统 |
| Cloudflare Workers | - | 无服务器平台 |
| Wrangler | 4.51 | Cloudflare CLI |
| Supabase | 2.86 | 数据库 |
| AWS SDK | 3.940 | S3 存储 |

### MCP 服务器技术
| 库 | 版本 | 用途 |
|----|------|------|
| Node.js | - | 运行环境 |
| TypeScript | 5.4 | 类型系统 |
| MCP SDK | 0.6 | Model Context Protocol |
| Supabase | 2.46 | 数据库 |
| 多种翻译 API | - | 翻译源 |

---

## 快速查找指南

### 我想修改...

| 内容 | 位置 |
|------|------|
| 前端路由 | frontend/src/App.tsx |
| 主页布局 | frontend/src/pages/Home.tsx |
| 提示词卡片 | frontend/src/components/prompt/PromptCard.tsx |
| 全局状态 | frontend/src/stores/promptStore.ts |
| API 调用 | frontend/src/services/api.ts |
| 中文翻译 | frontend/src/i18n/locales/zh.json |
| 英文翻译 | frontend/src/i18n/locales/en.json |
| API 端点 | backend/src/routes/*.ts |
| 数据库连接 | backend/src/db/supabase.ts |

### 我想添加...

| 功能 | 操作步骤 | 参考 Skill |
|------|---------|-----------|
| 新的前端页面 | 在 src/pages/ 创建，添加路由到 App.tsx | react-ui-development |
| 新的 API 路由 | 在 backend/src/routes/ 创建，注册到 index.ts | cloudflare-workers-api |
| 新的状态管理 | 在 frontend/src/stores/ 创建 Zustand store | react-ui-development |
| 新的翻译源 | 在 mcp-server/src/translators/ 创建 | batch-translation-system |
| 新的语言支持 | 添加 locale 文件到 i18n/locales/ | internationalization |
| 新的 Service | 在 backend/src 或 mcp-server/src 创建类 | service-creation |
| 环境变量配置 | 更新 .env 或 wrangler.toml | config-management |

---

## 关键设计模式

### 1. Zustand 状态管理（前端）
```typescript
// frontend/src/stores/promptStore.ts
export const usePromptStore = create<PromptStore>((set) => ({
  prompts: [],
  loading: false,
  error: null,
  setPrompts: (prompts) => set({ prompts }),
  setLoading: (loading) => set({ loading }),
}));
```

### 2. Hono 路由处理（后端）
```typescript
// backend/src/routes/prompts.ts
app.get('/api/prompts', async (c) => {
  const { page = 1, limit = 20 } = c.req.query();
  // 处理逻辑
  return c.json({ data: prompts, total });
});
```

### 3. API 服务层（前端）
```typescript
// frontend/src/services/api.ts
export const api = {
  prompts: {
    getList: (page = 1, limit = 20) =>
      fetch(`/api/prompts?page=${page}&limit=${limit}`),
    getById: (id: string) =>
      fetch(`/api/prompts/${id}`),
  },
};
```

### 4. MCP 工具实现
```typescript
// mcp-server/src/index.ts
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'translate-batch') {
    // 批量翻译逻辑
  }
});
```

---

## 常用开发命令

### 前端开发
```bash
cd frontend
npm install
npm run dev           # 启动开发服务器
npm run build         # 生产构建
npm run preview       # 预览生产构建
```

### 后端开发
```bash
cd backend
npm install
npm run dev           # 启动本地 Workers（通过 Wrangler）
npm run build         # 构建生产版本
npm run deploy        # 部署到 Cloudflare
```

### MCP 服务器
```bash
cd mcp-server
npm install
npm run build
npm start
# 或运行批量翻译
npm run batch-translate
```

---

## 环境变量配置

### 前端（frontend/.env）
```env
VITE_API_URL=http://localhost:8787
VITE_CLERK_PUBLISHABLE_KEY=***
```

### 后端（backend/wrangler.toml）
```toml
[env.production]
vars = { ENVIRONMENT = "production" }
```

### MCP 服务器（mcp-server/.env）
```env
SUPABASE_URL=***
SUPABASE_KEY=***
BAIDU_API_KEY=***
```

---

## 相关文档

详细信息请查阅：
- 快速参考 → QUICK_REFERENCE.md
- 实现总结 → docs/IMPLEMENTATION_SUMMARY.md
- 部署指南 → docs/WRANGLER_DEPLOYMENT.md
- 项目完成状态 → IMPLEMENTATION_COMPLETE.md
