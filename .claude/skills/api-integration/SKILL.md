---
name: api-integration
description: 前端-后端 API 集成指南。包含 API 调用、状态管理、错误处理、缓存、分页、搜索。(project)
---

# API 集成快速指南

## 使用场景

在前端创建 API 调用、状态管理、与后端集成时使用此 Skill。

## API 服务层

```typescript
// frontend/src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL;

export const api = {
  prompts: {
    getList: (page = 1, limit = 20) =>
      fetch(`${API_URL}/api/prompts?page=${page}&limit=${limit}`)
        .then(r => r.json()),

    getById: (id: string) =>
      fetch(`${API_URL}/api/prompts/${id}`)
        .then(r => r.json()),

    create: (data) =>
      fetch(`${API_URL}/api/prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),

    update: (id: string, data) =>
      fetch(`${API_URL}/api/prompts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),

    delete: (id: string) =>
      fetch(`${API_URL}/api/prompts/${id}`, {
        method: 'DELETE',
      }).then(r => r.json()),
  },

  search: {
    query: (q: string) =>
      fetch(`${API_URL}/api/search?q=${encodeURIComponent(q)}`)
        .then(r => r.json()),
  },
};
```

## Zustand 状态管理

```typescript
// frontend/src/stores/promptStore.ts
import { create } from 'zustand';
import { api } from '../services/api';

export const usePromptStore = create((set) => ({
  prompts: [],
  loading: false,
  error: null,
  page: 1,

  fetch: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.prompts.getList(page);
      set({ prompts: data, page });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  create: async (data) => {
    try {
      const result = await api.prompts.create(data);
      set((state) => ({
        prompts: [result.data, ...state.prompts],
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
}));
```

## 错误处理

```typescript
export function handleError(error: unknown): string {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return '网络连接失败';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '发生了一个错误';
}

// 使用
try {
  await store.fetch();
} catch (error) {
  const msg = handleError(error);
  showNotification(msg, 'error');
}
```

## 分页

```typescript
// 前端
const PAGE_SIZE = 20;
const [page, setPage] = useState(1);

const handleNextPage = () => {
  setPage(page + 1);
  fetchPrompts(page + 1);
};

// 后端
app.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  const { data, count } = await supabase
    .from('prompts')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1);

  return c.json({
    data,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit),
    },
  });
});
```

## 搜索和过滤

```typescript
// 前端
const handleSearch = useCallback(
  debounce((query: string) => {
    api.search.query(query).then(results => {
      setResults(results);
    });
  }, 300),
  []
);

// 后端
app.get('/', async (c) => {
  const q = c.req.query('q');
  const tag = c.req.query('tag');

  let query = supabase.from('prompts').select('*');

  if (q) {
    query = query.ilike('title', `%${q}%`);
  }
  if (tag) {
    query = query.contains('tags', [tag]);
  }

  const { data } = await query;
  return c.json({ data });
});
```

## 缓存

```typescript
// 简单的内存缓存
const cache = new Map();

const getCachedPrompts = async (page: number) => {
  const key = `prompts-${page}`;
  if (cache.has(key)) {
    return cache.get(key);
  }

  const data = await api.prompts.getList(page);
  cache.set(key, data);
  return data;
};
```
