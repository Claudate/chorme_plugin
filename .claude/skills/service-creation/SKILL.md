---
name: service-creation
description: 创建 Service 服务的标准模板。包含后端路由、MCP 服务、前端 API 服务模板，以及错误处理最佳实践。(project)
---

# Service 层快速创建指南

## 使用场景

当你需要添加新的业务逻辑服务时使用此 Skill。

**适用场景**：
- 创建后端 API 路由（Hono）
- 创建 MCP 服务器功能
- 创建前端 API 服务
- 集成第三方服务

---

## Nano-AI Service 架构

### 核心原则
1. **关注分离** - 业务逻辑与 UI 分离
2. **类型安全** - 完整的 TypeScript 类型
3. **错误处理** - 统一的异常处理机制
4. **可复用性** - 可跨多个地方使用

### 服务位置

```
Backend (Hono):
backend/src/routes/          # API 路由服务
backend/src/db/             # 数据库服务
backend/src/storage/        # 存储服务

MCP Server:
mcp-server/src/             # 工具和资源实现

Frontend:
frontend/src/services/      # API 客户端服务
frontend/src/stores/        # Zustand 状态服务
```

---

## 后端 Service（Hono 路由）

### 创建新路由

```typescript
// backend/src/routes/myfeature.ts
import { Hono } from 'hono';
import { supabase } from '../db/supabase';
import type { HonoEnv } from '../types';

const app = new Hono<HonoEnv>();

/**
 * GET /api/myfeature/:id
 * 获取特定资源
 */
app.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    // 验证输入
    if (!id) {
      return c.json({ error: '缺少 ID 参数' }, 400);
    }

    // 数据库查询
    const { data, error } = await supabase
      .from('my_table')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return c.json({ error: '资源不存在' }, 404);

    return c.json({ data });
  } catch (error) {
    console.error('[GET /api/myfeature/:id]', error);
    return c.json({ error: '服务器错误' }, 500);
  }
});

/**
 * POST /api/myfeature
 * 创建新资源
 */
app.post('/', async (c) => {
  try {
    const body = await c.req.json();

    // 验证必要字段
    if (!body.name) {
      return c.json({ error: '缺少必要字段: name' }, 400);
    }

    // 插入数据库
    const { data, error } = await supabase
      .from('my_table')
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return c.json({ data }, 201);
  } catch (error) {
    console.error('[POST /api/myfeature]', error);
    return c.json({ error: '服务器错误' }, 500);
  }
});

/**
 * PUT /api/myfeature/:id
 * 更新资源
 */
app.put('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    const { data, error } = await supabase
      .from('my_table')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return c.json({ error: '资源不存在' }, 404);

    return c.json({ data });
  } catch (error) {
    console.error('[PUT /api/myfeature/:id]', error);
    return c.json({ error: '服务器错误' }, 500);
  }
});

/**
 * DELETE /api/myfeature/:id
 * 删除资源
 */
app.delete('/:id', async (c) => {
  try {
    const { id } = c.req.param();

    const { error } = await supabase
      .from('my_table')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return c.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/myfeature/:id]', error);
    return c.json({ error: '服务器错误' }, 500);
  }
});

export default app;
```

### 注册路由

```typescript
// backend/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import promptsRouter from './routes/prompts';
import tagsRouter from './routes/tags';
import searchRouter from './routes/search';
import myfeatureRouter from './routes/myfeature';  // 新路由

const app = new Hono();

// 中间件
app.use('*', cors());

// 路由注册
app.route('/api/prompts', promptsRouter);
app.route('/api/tags', tagsRouter);
app.route('/api/search', searchRouter);
app.route('/api/myfeature', myfeatureRouter);  // 注册新路由

export default app;
```

---

## 后端 Service（数据库操作）

### 创建数据库服务

```typescript
// backend/src/db/myfeature.service.ts
import { supabase } from './supabase';

export class MyFeatureService {
  /**
   * 获取所有资源（带分页）
   */
  static async getAll(page = 1, limit = 20) {
    const from = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('my_table')
      .select('*', { count: 'exact' })
      .range(from, from + limit - 1);

    if (error) throw error;

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * 按 ID 获取单个资源
   */
  static async getById(id: string) {
    const { data, error } = await supabase
      .from('my_table')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 按条件搜索
   */
  static async search(filters: Record<string, any>) {
    let query = supabase.from('my_table').select('*');

    // 动态添加过滤条件
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * 创建新资源
   */
  static async create(payload: any) {
    const { data, error } = await supabase
      .from('my_table')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 更新资源
   */
  static async update(id: string, payload: any) {
    const { data, error } = await supabase
      .from('my_table')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 删除资源
   */
  static async delete(id: string) {
    const { error } = await supabase
      .from('my_table')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}
```

---

## MCP 服务器 Service

### 创建 MCP 工具

```typescript
// mcp-server/src/myfeature.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  TextContent,
  ToolSchema,
} from '@modelcontextprotocol/sdk/types.js';

export function registerMyFeatureTool(server: Server) {
  /**
   * 定义工具 - 在 listTools 中列出
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'get_feature_data',
          description: '获取特性数据',
          inputSchema: {
            type: 'object' as const,
            properties: {
              id: {
                type: 'string',
                description: '资源 ID',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'process_feature',
          description: '处理特性',
          inputSchema: {
            type: 'object' as const,
            properties: {
              data: {
                type: 'string',
                description: '输入数据',
              },
              options: {
                type: 'object',
                description: '处理选项',
              },
            },
            required: ['data'],
          },
        },
      ],
    };
  });

  /**
   * 执行工具 - 在 callTool 中处理
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'get_feature_data') {
      const { id } = request.params.arguments as { id: string };

      try {
        // 获取数据逻辑
        const result = await getFeatureData(id);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `错误: ${error instanceof Error ? error.message : '未知错误'}`,
            },
          ],
          isError: true,
        };
      }
    }

    if (request.params.name === 'process_feature') {
      const { data, options } = request.params.arguments as any;

      try {
        // 处理逻辑
        const result = await processFeature(data, options);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `错误: ${error instanceof Error ? error.message : '未知错误'}`,
            },
          ],
          isError: true,
        };
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `未知工具: ${request.params.name}`,
        },
      ],
      isError: true,
    };
  });
}

// 辅助函数
async function getFeatureData(id: string) {
  // 实现获取数据的逻辑
  return { id, data: '示例数据' };
}

async function processFeature(data: string, options?: any) {
  // 实现处理逻辑
  return { processed: true, data };
}
```

---

## 前端 API 服务

### 创建 API 客户端

```typescript
// frontend/src/services/myfeature-api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export interface MyFeature {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export const myfeatureApi = {
  /**
   * 获取列表
   */
  getList: async (page = 1, limit = 20) => {
    const response = await fetch(
      `${API_BASE_URL}/api/myfeature?page=${page}&limit=${limit}`
    );
    if (!response.ok) throw new Error('获取列表失败');
    const json = await response.json();
    return json.data || [];
  },

  /**
   * 获取单个项
   */
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/myfeature/${id}`);
    if (!response.ok) throw new Error('获取项失败');
    const json = await response.json();
    return json.data;
  },

  /**
   * 创建项
   */
  create: async (payload: Partial<MyFeature>) => {
    const response = await fetch(`${API_BASE_URL}/api/myfeature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('创建失败');
    const json = await response.json();
    return json.data;
  },

  /**
   * 更新项
   */
  update: async (id: string, payload: Partial<MyFeature>) => {
    const response = await fetch(`${API_BASE_URL}/api/myfeature/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('更新失败');
    const json = await response.json();
    return json.data;
  },

  /**
   * 删除项
   */
  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/api/myfeature/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('删除失败');
    return true;
  },
};
```

### 在 Zustand Store 中使用

```typescript
// frontend/src/stores/myfeatureStore.ts
import { create } from 'zustand';
import { myfeatureApi, MyFeature } from '../services/myfeature-api';

interface MyFeatureStore {
  items: MyFeature[];
  loading: boolean;
  error: string | null;

  // 操作
  fetchItems: (page?: number) => Promise<void>;
  createItem: (payload: Partial<MyFeature>) => Promise<void>;
  updateItem: (id: string, payload: Partial<MyFeature>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useMyFeatureStore = create<MyFeatureStore>((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async (page = 1) => {
    set({ loading: true, error: null });
    try {
      const data = await myfeatureApi.getList(page);
      set({ items: data });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '加载失败',
      });
    } finally {
      set({ loading: false });
    }
  },

  createItem: async (payload) => {
    set({ loading: true, error: null });
    try {
      const newItem = await myfeatureApi.create(payload);
      set((state) => ({
        items: [newItem, ...state.items],
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '创建失败',
      });
    } finally {
      set({ loading: false });
    }
  },

  updateItem: async (id, payload) => {
    try {
      const updated = await myfeatureApi.update(id, payload);
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? updated : item
        ),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新失败',
      });
    }
  },

  deleteItem: async (id) => {
    try {
      await myfeatureApi.delete(id);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除失败',
      });
    }
  },
}));
```

---

## 错误处理

### 后端错误处理

```typescript
// 统一的错误响应
export const errorResponses = {
  badRequest: (message: string) => ({ error: message, code: 400 }),
  unauthorized: () => ({ error: '未授权', code: 401 }),
  notFound: () => ({ error: '资源不存在', code: 404 }),
  serverError: (error?: any) => ({
    error: '服务器错误',
    code: 500,
    details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
  }),
};

// 在路由中使用
try {
  // 业务逻辑
} catch (error) {
  if (error instanceof ValidationError) {
    return c.json(errorResponses.badRequest(error.message), 400);
  }
  return c.json(errorResponses.serverError(error), 500);
}
```

### 前端错误处理

```typescript
// 统一的错误提示
export const handleApiError = (error: unknown): string => {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return '网络连接失败，请检查您的网络';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '发生了一个未知错误';
};

// 在组件中使用
try {
  await fetchData();
} catch (error) {
  const errorMessage = handleApiError(error);
  setError(errorMessage);
}
```

---

## 最佳实践

### ✅ 推荐做法
1. **单一职责** - 每个 Service 只负责一个领域
2. **类型安全** - 定义清晰的接口和类型
3. **统一的错误处理** - 使用统一的错误格式
4. **数据验证** - 在输入和输出时验证数据
5. **日志记录** - 记录重要操作和错误
6. **可复用性** - 提供通用的方法供多处使用

### ❌ 避免做法
1. ❌ Service 中混合多个职责
2. ❌ 直接抛出错误，不处理
3. ❌ 硬编码 API 路径
4. ❌ 不验证输入数据
5. ❌ 不处理网络异常

---

## 检查清单

创建 Service 前：
- [ ] 确定服务位置（后端路由、MCP 工具、前端服务）
- [ ] 定义清晰的接口和类型
- [ ] 计划错误处理策略
- [ ] 设计 API 端点（如果是后端）
- [ ] 考虑分页和过滤需求
- [ ] 添加必要的验证逻辑
- [ ] 编写清晰的注释和文档
