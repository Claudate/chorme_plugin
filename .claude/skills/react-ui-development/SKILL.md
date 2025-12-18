---
name: react-ui-development
description: React 19 + Zustand + TailwindCSS 前端开发指南。包含页面组件模板、Zustand 状态管理、i18next 国际化、API 调用、通用组件库。(project)
---

# React UI 开发快速指南

## 使用场景

当你需要在 Nano-AI 前端开发或修改 UI 时使用此 Skill。

**适用场景**：
- 创建新的页面组件
- 开发通用 UI 组件
- 实现 Zustand 状态管理
- 调用后端 API
- 使用 i18next 国际化
- 使用 TailwindCSS 样式

---

## 项目 React 架构

### 目录结构

```
frontend/src/
├── pages/                      # 页面组件
│   ├── Home.tsx               # 首页（提示词网格）
│   ├── PromptDetail.tsx       # 详情页
│   └── TagPage.tsx            # 标签过滤页
│
├── components/                # UI 组件
│   ├── auth/
│   │   └── ClerkAuthButton.tsx  # Clerk 认证按钮
│   ├── layout/
│   │   ├── Header.tsx           # 页头
│   │   ├── Footer.tsx           # 页脚
│   │   └── LanguageLayout.tsx   # 语言布局
│   ├── prompt/
│   │   ├── PromptCard.tsx       # 提示词卡片
│   │   ├── PromptGrid.tsx       # 提示词网格
│   │   └── PromptModal.tsx      # 详情弹窗
│   └── ui/
│       ├── SearchInput.tsx      # 搜索框
│       ├── TagFilter.tsx        # 标签过滤
│       └── ScrollToTop.tsx      # 回到顶部
│
├── stores/                    # Zustand 状态管理
│   └── promptStore.ts         # 提示词与标签状态
│
├── services/                  # 服务层
│   └── api.ts                 # API 客户端
│
├── hooks/                     # 自定义 Hooks
│   └── useApi.ts             # API 数据 Hook
│
├── types/                     # 类型定义
│   └── index.ts
│
├── i18n/                      # 国际化
│   ├── index.ts               # i18next 配置
│   └── locales/
│       ├── en.json            # 英文翻译
│       └── zh.json            # 中文翻译
│
├── lib/                       # 第三方配置
│   └── supabase.ts
│
├── utils/                     # 工具函数
├── App.tsx                    # 主应用（路由）
└── main.tsx                   # 入口文件
```

---

## 页面组件开发

### 页面模板

```typescript
// frontend/src/pages/Home.tsx
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePromptStore } from '../stores/promptStore';
import Header from '../components/layout/Header';
import PromptGrid from '../components/prompt/PromptGrid';
import TagFilter from '../components/ui/TagFilter';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const {
    prompts,
    tags,
    loading,
    error,
    selectedTag,
    searchQuery,
    fetchPrompts,
    setSelectedTag,
    setSearchQuery,
  } = usePromptStore();

  // 初始化：获取提示词和标签
  useEffect(() => {
    fetchPrompts({ tag: selectedTag, search: searchQuery });
  }, [selectedTag, searchQuery]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-lg">{t('error.loadFailed')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header onSearch={setSearchQuery} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 标签过滤 */}
        <TagFilter
          tags={tags}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
        />

        {/* 提示词网格 */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('common.noData')}</p>
          </div>
        ) : (
          <PromptGrid prompts={prompts} />
        )}
      </main>
    </div>
  );
};

export default Home;
```

---

## Zustand 状态管理

### Store 模板

```typescript
// frontend/src/stores/promptStore.ts
import { create } from 'zustand';
import { api } from '../services/api';
import { Prompt, Tag } from '../types';

interface PromptStore {
  // 状态
  prompts: Prompt[];
  tags: Tag[];
  loading: boolean;
  error: string | null;
  selectedTag: string | null;
  searchQuery: string;

  // 操作
  fetchPrompts: (filters?: { tag?: string; search?: string }) => Promise<void>;
  fetchTags: () => Promise<void>;
  setSelectedTag: (tag: string | null) => void;
  setSearchQuery: (query: string) => void;
  reset: () => void;
}

export const usePromptStore = create<PromptStore>((set, get) => ({
  // 初始状态
  prompts: [],
  tags: [],
  loading: false,
  error: null,
  selectedTag: null,
  searchQuery: '',

  // 获取提示词
  fetchPrompts: async (filters) => {
    set({ loading: true, error: null });

    try {
      const data = await api.prompts.getList({
        tag: filters?.tag,
        search: filters?.search,
      });

      set({ prompts: data });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '未知错误',
      });
    } finally {
      set({ loading: false });
    }
  },

  // 获取标签
  fetchTags: async () => {
    try {
      const data = await api.tags.getAll();
      set({ tags: data });
    } catch (error) {
      console.error('获取标签失败', error);
    }
  },

  // 设置选中的标签
  setSelectedTag: (tag) => {
    set({ selectedTag: tag });
  },

  // 设置搜索词
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  // 重置状态
  reset: () => {
    set({
      prompts: [],
      tags: [],
      loading: false,
      error: null,
      selectedTag: null,
      searchQuery: '',
    });
  },
}));
```

---

## API 调用

### API 服务层

```typescript
// frontend/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export const api = {
  prompts: {
    // 获取提示词列表
    getList: async (filters?: {
      tag?: string;
      search?: string;
      page?: number;
      limit?: number;
    }): Promise<any[]> => {
      const params = new URLSearchParams();
      if (filters?.tag) params.append('tag', filters.tag);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${API_BASE_URL}/api/prompts?${params}`);
      if (!response.ok) throw new Error('获取提示词失败');
      const json = await response.json();
      return json.data || [];
    },

    // 获取单个提示词
    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/api/prompts/${id}`);
      if (!response.ok) throw new Error('获取详情失败');
      const json = await response.json();
      return json.data;
    },
  },

  tags: {
    // 获取所有标签
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/api/tags`);
      if (!response.ok) throw new Error('获取标签失败');
      const json = await response.json();
      return json.data || [];
    },
  },

  search: {
    // 搜索提示词
    query: async (q: string) => {
      const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(q)}`);
      if (!response.ok) throw new Error('搜索失败');
      const json = await response.json();
      return json.data || [];
    },
  },
};
```

### 使用 API Hook

```typescript
// frontend/src/hooks/useApi.ts
import { useState, useCallback } from 'react';

export function useApi<T>(
  apiCall: (...args: any[]) => Promise<T>,
  immediate = false
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiCall(...args);
        setData(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '未知错误';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiCall]
  );

  return { execute, data, loading, error };
}
```

---

## i18next 国际化

### 配置国际化

```typescript
// frontend/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zh from './locales/zh.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

### 翻译文件结构

```json
// frontend/src/i18n/locales/zh.json
{
  "common": {
    "noData": "没有数据",
    "loading": "加载中...",
    "error": "出错了"
  },
  "home": {
    "title": "AI 提示词库",
    "description": "浏览和学习数百个精心策划的 AI 提示词"
  },
  "error": {
    "loadFailed": "加载失败，请重试"
  }
}
```

### 在组件中使用翻译

```typescript
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('home.title')}</h1>
      <button onClick={() => i18n.changeLanguage('en')}>English</button>
      <button onClick={() => i18n.changeLanguage('zh')}>中文</button>
    </div>
  );
}
```

---

## TailwindCSS 样式

### 常用样式组合

```typescript
// 布局
const layoutClasses = {
  container: 'max-w-7xl mx-auto px-4 py-8',
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  grid2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  grid3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  grid4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
};

// 按钮
const buttonClasses = {
  primary: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition',
  secondary: 'px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition',
  danger: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition',
};

// 卡片
const cardClasses = {
  base: 'bg-white rounded-lg border border-gray-200 p-4 shadow-sm',
  hover: 'bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition',
  selected: 'bg-white rounded-lg border-2 border-blue-500 p-4 shadow-md',
};

// 输入框
const inputClasses = {
  base: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
  error: 'w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500',
};
```

### 通用 Button 组件

```typescript
// frontend/src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'rounded-lg font-medium transition focus:outline-none focus:ring-2';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed';

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || loading ? disabledClasses : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
```

### 提示词卡片组件

```typescript
// frontend/src/components/prompt/PromptCard.tsx
import React from 'react';
import { Prompt } from '../../types';

interface PromptCardProps {
  prompt: Prompt;
  onSelect?: (prompt: Prompt) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onSelect }) => {
  return (
    <div
      onClick={() => onSelect?.(prompt)}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition cursor-pointer"
    >
      <h3 className="font-semibold text-gray-900 line-clamp-2">{prompt.title}</h3>
      <p className="text-gray-600 text-sm mt-2 line-clamp-3">{prompt.content}</p>

      {/* 标签 */}
      <div className="flex flex-wrap gap-2 mt-4">
        {prompt.tags?.map((tag) => (
          <span
            key={tag}
            className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PromptCard;
```

---

## Clerk 认证集成

### 认证按钮组件

```typescript
// frontend/src/components/auth/ClerkAuthButton.tsx
import React from 'react';
import { SignedIn, SignedOut, UserButton } from '@clerk/react';

const ClerkAuthButton: React.FC = () => {
  return (
    <>
      <SignedOut>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Sign In
        </button>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </>
  );
};

export default ClerkAuthButton;
```

---

## 最佳实践

### ✅ 推荐做法
1. **组件拆分** - 单一职责，可复用
2. **类型安全** - 使用 TypeScript 完整类型
3. **状态管理** - 使用 Zustand 管理全局状态
4. **API 集中** - 将所有 API 调用集中到 services/api.ts
5. **国际化** - 使用 i18next 支持多语言
6. **错误处理** - 捕获并显示错误信息
7. **加载状态** - 显示加载指示器
8. **响应式设计** - 使用 TailwindCSS 响应式类

### ❌ 避免做法
1. ❌ 组件过于庞大（超过 300 行）
2. ❌ 直接修改 props
3. ❌ 在组件内直接调用 fetch（使用 API 服务）
4. ❌ 内联大量样式（使用 className 或样式表）
5. ❌ 不处理异步错误
6. ❌ 硬编码文本（使用 i18next）
7. ❌ 复杂逻辑在组件内（提取到 Hooks 或 Store）

---

## 检查清单

开发 UI 前，请确认：
- [ ] 设计了组件结构和层级
- [ ] 确定了状态管理方案
- [ ] 定义了 TypeScript 类型
- [ ] 规划了 API 调用
- [ ] 添加了国际化 (i18n)
- [ ] 设计了样式方案
- [ ] 考虑了加载和错误状态
- [ ] 实现了响应式布局
- [ ] 添加了必要的交互反馈
- [ ] 测试了不同屏幕尺寸
- [ ] 添加了无障碍属性（alt text, aria labels）
