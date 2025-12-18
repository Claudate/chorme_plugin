---
name: esm-module-fix
description: 快速修复 ESM 模块在 CommonJS 项目中的导入错误。用于解决 Error [ERR_REQUIRE_ESM]、纯 ESM 包导入问题。支持三种模式：顶层动态导入、模块级导入、按需导入。
---

# ESM 模块兼容性修复

## 使用场景

当你遇到以下错误时使用此 Skill：
```
Error [ERR_REQUIRE_ESM]: require() of ES Module ... not supported.
Instead change the require of ... to a dynamic import() which is available in all CommonJS modules.
```

**常见触发场景**:
- 安装了新的 npm 包（如 @octokit/rest, node-fetch 等纯 ESM 模块）
- Electron 主进程使用 CommonJS 编译（`"module": "CommonJS"`）
- TypeScript 将 `import` 转换为 `require()`

---

## 诊断步骤

### 1. 确认错误类型
检查错误信息中的模块名称，例如：
```
Error [ERR_REQUIRE_ESM]: require() of ES Module
H:\...\node_modules\@octokit\rest\dist-src\index.js
```

### 2. 检查 TypeScript 配置
查看 `tsconfig.main.json`:
```json
{
  "compilerOptions": {
    "module": "CommonJS"  // ⚠️ 如果是 CommonJS，无法直接使用 import
  }
}
```

### 3. 检查包的类型
查看 `node_modules/[包名]/package.json`:
```json
{
  "type": "module"  // ⚠️ 这表示是纯 ESM 包
}
```

---

## 修复方案

### ✅ 方案：使用 eval() 绕过 TypeScript 编译

**原理**:
- TypeScript 会将 `await import()` 转换为 `__importStar(require())`
- 使用 `eval('import(...)')` 可以在运行时执行真正的动态导入
- 这种模式已在项目中使用（参考 `@toon-format/toon` 的导入）

---

## 代码模板

### 1. 顶层动态导入（推荐用于全局单例）

```typescript
// ❌ 错误的导入方式
import { Octokit } from '@octokit/rest';

// ✅ 正确的导入方式

// 第一步：删除顶层 import，添加类型定义
type Octokit = any;

// 第二步：在类中添加属性存储动态导入的类
export class YourService {
  private OctokitClass: any = null;
  private octokit: any = null;

  // 第三步：在 initialize() 或首次使用时动态导入
  async initialize(config: any): Promise<void> {
    // 动态导入 Octokit (ESM module)
    // 使用 eval 绕过 TypeScript 编译器将 import() 转换为 require()
    if (!this.OctokitClass) {
      // eslint-disable-next-line no-eval
      const octokitModule = await eval('import("@octokit/rest")');
      this.OctokitClass = octokitModule.Octokit;
    }

    // 初始化实例
    this.octokit = new this.OctokitClass({
      auth: config.token,
    });
  }
}
```

### 2. 模块级动态导入（推荐用于工具函数）

```typescript
// 文件顶部导入类型定义
type FetchFunction = (url: string, options?: any) => Promise<any>;

// 模块级变量
let fetch: FetchFunction | null = null;

// 立即执行函数加载 ESM 模块
(async () => {
  try {
    // eslint-disable-next-line no-eval
    const fetchModule = await eval('import("node-fetch")');
    fetch = fetchModule.default;
    console.log('[ESM] node-fetch 加载成功');
  } catch (error) {
    console.warn('[ESM] node-fetch 加载失败:', error);
  }
})();

// 使用时检查是否加载完成
export async function makeRequest(url: string): Promise<any> {
  if (!fetch) {
    throw new Error('node-fetch 尚未加载完成');
  }
  return await fetch(url);
}
```

### 3. 按需动态导入（推荐用于低频使用）

```typescript
async function processWithESM(data: any): Promise<void> {
  // 每次使用时动态导入
  // eslint-disable-next-line no-eval
  const esmModule = await eval('import("esm-package-name")');
  const { functionName } = esmModule;

  await functionName(data);
}
```

---

## 实际案例：修复 @octokit/rest

### 问题代码
```typescript
// src/main/services/github/GitHubAPIBackend.ts
import { Octokit } from '@octokit/rest';  // ❌ 导致错误

export class GitHubAPIBackend implements IGitHubBackend {
  private octokit: Octokit | null = null;

  async initialize(config: GitHubSyncConfig): Promise<void> {
    this.octokit = new Octokit({ auth: config.token });
  }
}
```

### 修复后代码
```typescript
// src/main/services/github/GitHubAPIBackend.ts

// 删除静态 import，添加类型定义
type Octokit = any;

export class GitHubAPIBackend implements IGitHubBackend {
  private octokit: any = null;
  private OctokitClass: any = null;  // 🆕 存储动态导入的类

  async initialize(config: GitHubSyncConfig): Promise<void> {
    // 🆕 动态导入 Octokit (ESM module)
    // 使用 eval 绕过 TypeScript 编译器将 import() 转换为 require()
    if (!this.OctokitClass) {
      // eslint-disable-next-line no-eval
      const octokitModule = await eval('import("@octokit/rest")');
      this.OctokitClass = octokitModule.Octokit;
    }

    // 初始化 Octokit
    this.octokit = new this.OctokitClass({
      auth: config.token,
    });
  }
}
```

---

## 验证修复

### 1. 编译检查
```bash
npm run build:electron
# 或
tsc -p tsconfig.main.json
```

### 2. 检查编译输出
打开 `dist/main/services/github/GitHubAPIBackend.js`，确认：
```javascript
// ✅ 应该看到 eval('import(...)')，而不是 require(...)
const octokitModule = await eval('import("@octokit/rest")');
```

### 3. 运行测试
```bash
npm run dev
```

确认应用正常启动，没有 `ERR_REQUIRE_ESM` 错误。

---

## 常见问题

### Q: 为什么不能直接用 `await import()`？
**A**: TypeScript 编译器会将 `await import()` 转换为 `__importStar(require())`，仍然使用 `require()`，无法加载 ESM 模块。

### Q: 为什么不改 tsconfig.json 的 module 为 "ESNext"？
**A**: Electron 主进程运行在 Node.js 环境，某些依赖可能不支持 ESM。保持 CommonJS 兼容性更好。

### Q: eval() 安全吗？
**A**: 在这种场景下是安全的，因为：
1. 我们控制 eval 的内容（硬编码的 import 语句）
2. 不涉及用户输入
3. 只在构建时执行

### Q: 有没有其他替代方案？
**A**: 可以降级包版本到支持 CommonJS 的版本，但：
- 会错过新功能和 bug 修复
- 维护成本更高
- 不推荐

---

## 相关文件

- `tsconfig.main.json` - 主进程 TypeScript 配置
- `src/main/services/ClaudeService.ts` - TOON 库动态导入示例（第 20-32 行）
- `src/main/services/github/GitHubAPIBackend.ts` - Octokit 动态导入示例

---

## 注意事项

⚠️ **TypeScript 类型支持**
- 动态导入会失去类型推断
- 建议手动定义类型：`type Octokit = any;`
- 或者安装 `@types/` 包（如果有）

⚠️ **异步初始化**
- 动态导入是异步的，确保在 `initialize()` 方法中等待完成
- 在使用前检查模块是否已加载

⚠️ **ESLint 规则**
- 添加 `// eslint-disable-next-line no-eval` 避免 ESLint 警告
- 在代码注释中说明为什么需要 eval
