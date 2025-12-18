---
name: coding-standards
description: 代码规范快速参考。包含命名规范、代码风格、TypeScript 规范、错误处理与日志规范，附带检查清单。
---

# 代码规范快速参考

## 使用场景

当你编写或审查代码时参考此 Skill，确保代码质量和团队一致性。

**适用场景**:
- 创建新文件、类、函数时确定命名
- 代码审查时检查规范符合度
- 重构现有代码时保持一致性

---

## 1. 命名规范

### 1.1 文件命名

| 类型 | 命名规则 | 示例 |
|------|---------|------|
| Service | `kebab-case.service.ts` | `ai.service.ts`, `config.service.ts` |
| Provider | `kebab-case.provider.ts` | `openai.provider.ts`, `base.provider.ts` |
| Skill | `kebab-case.skill.ts` | `article-rewriter.skill.ts` |
| Handler | `kebab-case.handler.ts` | `login.handler.ts`, `publish.handler.ts` |
| 类型定义 | `kebab-case.types.ts` | `ai-provider.types.ts` |
| Store | `use[Name]Store.ts` | `useAppStore.ts`, `usePublishStore.ts` |
| 页面组件 | `PascalCase.tsx` | `RewriterPage.tsx`, `SettingsPage.tsx` |
| 通用组件 | `PascalCase.tsx` | `Button.tsx`, `Modal.tsx` |
| Hook | `use[Name].ts` | `useIPC.ts`, `useWorkflow.ts` |

```typescript
// ✅ 正确
electron/services/core/ai.service.ts
electron/services/ai/providers/openai.provider.ts
src/store/useAppStore.ts
src/pages/RewriterPage.tsx

// ❌ 错误
electron/services/core/AIService.ts       // 应用 kebab-case
electron/services/ai/providers/OpenAI.ts  // 缺少 .provider 后缀
src/store/appStore.ts                     // 应用 use 前缀
```

### 1.2 类与接口命名

| 类型 | 命名规则 | 示例 |
|------|---------|------|
| 类 | `PascalCase` + 后缀 | `AIService`, `BaseAIProvider` |
| 接口 | `I` 前缀 + `PascalCase` | `IAIProvider`, `IWorkflowSkill` |
| 类型别名 | `PascalCase` | `AIProviderType`, `WorkflowStatus` |
| 枚举 | `PascalCase` | `ErrorCode`, `LogLevel` |

```typescript
// ✅ 正确
export class AIService { }
export class BaseAIProvider implements IAIProvider { }
export interface IAIProvider { }
export type AIProviderType = 'official' | 'reverse' | 'gateway';

// ❌ 错误
export class aiService { }            // 类名应 PascalCase
export interface AIProvider { }       // 接口应有 I 前缀
export type ai_provider_type = ''     // 类型应 PascalCase
```

### 1.3 变量与函数命名

| 类型 | 命名规则 | 示例 |
|------|---------|------|
| 变量 | `camelCase` | `currentProvider`, `isLoading` |
| 函数/方法 | `camelCase` | `getProvider()`, `handleSubmit()` |
| 常量 | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT` |
| 布尔变量 | `is/has/can/should` 前缀 | `isInitialized`, `hasError` |
| 事件处理 | `handle` + 动作 | `handleClick`, `handleSubmit` |
| 回调函数 | `on` + 事件名 | `onChunk`, `onProgress` |

```typescript
// ✅ 正确
const MAX_RETRY_COUNT = 3;
const currentProviderId = 'openai';
let isInitialized = false;
function getProvider(id: string): IAIProvider { }
const handleSubmit = () => { };

// ❌ 错误
const max_retry_count = 3;      // 常量应 UPPER_SNAKE_CASE
const CurrentProvider = '';     // 变量应 camelCase
function GetProvider() { }      // 函数应 camelCase
```

### 1.4 目录命名

```
// ✅ 正确 - 使用 kebab-case
electron/services/core/
electron/services/ai/providers/
src/components/unified-login/

// ❌ 错误 - 不要用 PascalCase
electron/services/Core/
electron/services/AIProviders/
src/components/UnifiedLogin/
```

---

## 2. 代码风格

### 2.1 导入顺序

按以下顺序组织导入，各组之间空一行：

```typescript
// 1. Node.js 内置模块
import * as fs from 'fs';
import * as path from 'path';

// 2. 第三方模块
import OpenAI from 'openai';
import { create } from 'zustand';
import React, { useState, useEffect } from 'react';

// 3. 项目共享模块 (shared/)
import { IAIProvider, AIMessage } from '@shared/types/ai-provider.types';

// 4. 项目本地模块 (相对路径)
import { configService } from './config.service';
import { BaseAIProvider } from '../base.provider';

// 5. 样式文件 (仅前端)
import './styles.css';
```

### 2.2 类文件结构

```typescript
/**
 * 文件描述
 */

// 导入

// 常量
const MAX_RETRY = 3;

// 类型（局部）
interface LocalConfig { }

// 类定义
export class MyService {
  // 1. 静态属性
  private static instance: MyService;

  // 2. 实例属性
  private readonly id: string;
  private initialized = false;

  // 3. 构造函数
  private constructor() { }

  // 4. 静态方法
  public static getInstance(): MyService {
    if (!MyService.instance) {
      MyService.instance = new MyService();
    }
    return MyService.instance;
  }

  // 5. 公共方法
  public async initialize(): Promise<void> { }

  // 6. 私有方法
  private validateConfig(): void { }
}

// 单例导出
export const myService = MyService.getInstance();
```

### 2.3 React 组件结构

```typescript
// 导入

// 类型
interface Props { }

// 常量
const ITEMS_PER_PAGE = 10;

// 组件
const MyComponent: React.FC<Props> = ({ prop1 }) => {
  // 1. 外部 Hooks
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 2. Store 状态
  const { state, action } = useAppStore();

  // 3. 本地状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 4. 副作用
  useEffect(() => { }, []);

  // 5. 事件处理
  const handleSubmit = async () => { };

  // 6. 条件渲染
  if (isLoading) return <Loading />;

  // 7. 主渲染
  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

### 2.4 Zustand Store 结构

```typescript
import { create } from 'zustand';

// ==================== 类型 ====================

interface ItemState { }

interface StoreState {
  // 状态
  items: ItemState[];
  isLoading: boolean;
  error: string | null;

  // 操作
  setItems: (items: ItemState[]) => void;
  reset: () => void;
}

// ==================== 初始状态 ====================

const initialState = {
  items: [],
  isLoading: false,
  error: null,
};

// ==================== Store ====================

export const useItemStore = create<StoreState>((set) => ({
  ...initialState,

  setItems: (items) => set({ items }),

  reset: () => set(initialState),
}));
```

### 2.5 空行与换行

```typescript
// ✅ 正确 - 逻辑块之间空一行
async function processData(): Promise<void> {
  const data = await fetchData();

  const processed = transform(data);

  return processed;
}

// 行长度超过 100 字符时换行
async function processArticle(
  article: string,
  options: ProcessOptions,
  callback: (progress: number) => void
): Promise<ProcessResult> {
  // ...
}
```

---

## 3. TypeScript 规范

### 3.1 类型定义原则

```typescript
// ✅ 1. 对象类型用 interface
interface UserConfig {
  apiKey: string;
  timeout?: number;
}

// ✅ 2. 联合类型用 type
type AIProviderType = 'official' | 'reverse' | 'gateway';
type PartialConfig = Partial<UserConfig>;

// ✅ 3. 枚举定义常量集
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  ERROR = 'error',
}
```

### 3.2 避免 any

```typescript
// ❌ 错误 - 使用 any
function process(data: any): any { }

// ✅ 正确 - 使用 unknown + 类型守卫
function process(data: unknown): void {
  if (typeof data === 'string') {
    // 类型收窄后使用
  }
}

// ✅ 正确 - 使用泛型
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

### 3.3 接口设计

```typescript
/**
 * AI Provider 接口
 */
export interface IAIProvider {
  /** Provider 唯一标识 */
  readonly id: string;
  /** Provider 显示名称 */
  readonly name: string;
  /** Provider 类型 */
  readonly type: AIProviderType;

  /** 初始化 */
  initialize(credentials: Record<string, any>): Promise<void>;
  /** 聊天请求 */
  chat(messages: AIMessage[], options?: ChatOptions): Promise<AIResponse>;
  /** 流式聊天 */
  chatStream(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    options?: ChatOptions
  ): Promise<void>;
}

// ✅ 使用可选属性
interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// ✅ 使用 readonly
interface Project {
  readonly id: string;
  readonly createdAt: number;
  name: string;  // 可修改
}
```

### 3.4 类型断言

```typescript
// ✅ 使用 as 语法
const element = document.getElementById('app') as HTMLDivElement;

// ✅ 优先使用类型守卫
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// ✅ 非空断言仅在确定时使用
const provider = this.providers.get(id)!;  // 已检查存在

// ❌ 避免双重断言
const value = (data as unknown) as Type;  // 危险
```

---

## 4. 错误处理与日志

### 4.1 日志格式

```typescript
// 格式：[模块.方法] 消息

// INFO - 关键业务节点
console.log('[AIService.initialize] 初始化成功');
console.log('[WorkflowService] 工作流开始:', { projectId });

// WARN - 潜在问题
console.warn('[AIService] Provider 缓存未命中');
console.warn('[ConfigService] 配置不存在，使用默认值');

// ERROR - 错误信息
console.error('[AIService.chat] 调用失败:', error);
console.error('[IPC] 处理请求失败:', { channel, error });
```

### 4.2 敏感信息

```typescript
// ✅ 正确 - 隐藏敏感信息
function logCredentials(creds: Record<string, any>): void {
  const safe = {
    ...creds,
    apiKey: creds.apiKey ? '***' : undefined,
  };
  console.log('[Config] 凭据:', safe);
}

// ❌ 错误 - 泄露敏感信息
console.log('凭据:', credentials);  // 可能包含 API Key
```

### 4.3 错误处理模式

```typescript
// ✅ 标准错误处理
export class AIService {
  async getProvider(id: string): Promise<IAIProvider> {
    try {
      // 1. 参数校验
      if (!id) {
        throw new Error('Provider ID 不能为空');
      }

      // 2. 业务逻辑
      const provider = createProvider(id);
      await provider.initialize(credentials);
      return provider;

    } catch (error) {
      // 3. 记录错误
      console.error('[AIService.getProvider] 失败:', error);

      // 4. 转换为用户友好消息
      if (error instanceof Error) {
        throw new Error(`获取 Provider 失败: ${error.message}`);
      }
      throw new Error('获取 Provider 失败: 未知错误');
    }
  }
}

// ❌ 错误 - 吞掉错误
async getProvider(id: string): Promise<IAIProvider | null> {
  try {
    // ...
  } catch (error) {
    console.log('出错了');  // 没有重新抛出
    return null;            // 隐藏了错误
  }
}
```

### 4.4 React 组件错误处理

```typescript
const MyComponent: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await window.electronAPI.doSomething();
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败';
      setError(message);
      console.error('[MyComponent.handleSubmit] 失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="text-red-500">{error}</div>}
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? '处理中...' : '提交'}
      </button>
    </div>
  );
};
```

---

## 5. 好坏代码对比

### 5.1 Service 类

```typescript
// ❌ 不好的代码
export class aiservice {
  private Providers = new Map();
  api_key: string;

  GetProvider(id) {
    try {
      var p = this.Providers.get(id);
      return p;
    } catch(e) {
      console.log('error');
    }
  }
}
```

```typescript
// ✅ 好的代码
export class AIService {
  private static instance: AIService;
  private providers = new Map<string, IAIProvider>();

  private constructor() {
    console.log('[AIService] 创建实例');
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async getProvider(id: string): Promise<IAIProvider> {
    if (!id) {
      throw new Error('Provider ID 不能为空');
    }

    if (this.providers.has(id)) {
      return this.providers.get(id)!;
    }

    try {
      const provider = createProvider(id);
      await provider.initialize(credentials);
      this.providers.set(id, provider);
      console.log(`[AIService.getProvider] ${id} 初始化成功`);
      return provider;
    } catch (error) {
      console.error(`[AIService.getProvider] ${id} 失败:`, error);
      throw new Error(`获取 Provider 失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}

export const aiService = AIService.getInstance();
```

### 5.2 React 组件

```typescript
// ❌ 不好的代码
function myComponent(props) {
  var [data, setData] = useState()
  var [loading, setLoading] = useState()

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => setData(d))
  })

  function click_handler() {
    setLoading(true)
    fetch('/api/submit').then(() => setLoading(false))
  }

  return <div>
    {loading && <span>loading</span>}
    <button onclick={click_handler}>submit</button>
  </div>
}
```

```typescript
// ✅ 好的代码
interface MyComponentProps {
  initialId?: string;
}

const MyComponent: React.FC<MyComponentProps> = ({ initialId }) => {
  const [data, setData] = useState<DataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [initialId]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await window.electronAPI.getData(initialId);
      setData(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载失败';
      setError(message);
      console.error('[MyComponent.loadData] 失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await window.electronAPI.submitData(data);
      console.log('[MyComponent.handleSubmit] 成功');
    } catch (err) {
      const message = err instanceof Error ? err.message : '提交失败';
      setError(message);
      console.error('[MyComponent.handleSubmit] 失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  return (
    <div className="p-4">
      {error && (
        <div className="mb-4 text-red-500">{error}</div>
      )}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        提交
      </button>
    </div>
  );
};

export default MyComponent;
```

---

## 检查清单

编写代码前，确认遵循以下规范：

### 命名规范
- [ ] 文件名 `kebab-case` + 正确后缀
- [ ] 类名 `PascalCase`，接口 `I` 前缀
- [ ] 变量/函数 `camelCase`
- [ ] 常量 `UPPER_SNAKE_CASE`
- [ ] 布尔变量 `is/has/can` 前缀

### 代码风格
- [ ] 导入顺序正确（Node → 第三方 → 共享 → 本地）
- [ ] 类成员顺序正确（属性 → 构造 → 公共 → 私有）
- [ ] 行长度不超过 100 字符
- [ ] 逻辑块之间有空行

### TypeScript
- [ ] 避免 `any`，用 `unknown` + 类型守卫
- [ ] 接口有 JSDoc 注释
- [ ] 合理使用 `readonly`

### 错误处理
- [ ] 捕获后记录再抛出
- [ ] 日志格式 `[模块.方法]`
- [ ] 不打印敏感信息
- [ ] React 组件有错误状态

### 提交前
- [ ] `npm run type-check` 通过
- [ ] 无 `any` 滥用
- [ ] 错误处理完善
