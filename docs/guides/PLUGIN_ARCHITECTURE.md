# 述而作助手插件一键发布功能深度分析

## 目录
- [一、插件整体架构](#一插件整体架构)
- [二、一键发布完整流程](#二一键发布完整流程)
- [三、平台检测与内容注入机制](#三平台检测与内容注入机制)
- [四、通信机制架构](#四通信机制架构)
- [五、各平台插件实现细节](#五各平台插件实现细节)
- [六、关键代码逻辑和算法](#六关键代码逻辑和算法)
- [七、错误处理机制](#七错误处理机制)

---

## 一、插件整体架构

### 1.1 架构设计模式

这是一个基于 **配置驱动、插件化、模块化** 的 Chrome Extension，采用现代化的分层架构设计。

#### 目录结构
```
plugin/
├── manifest.json                    # Chrome 扩展配置清单
├── background.js                    # Service Worker 后台脚本 (471行)
├── main.js                          # 主入口和应用启动器 (407行)
├── website-detector.js              # 网站端检测脚本
│
├── core/                            # 核心服务层
│   ├── app.js                       # 应用核心控制器 (590行)
│   ├── event-bus.js                 # 事件总线 - 发布订阅模式 (73行)
│   ├── platform-detector.js         # 平台检测工具
│   ├── platform-manager.js          # 平台管理服务 (263行)
│   ├── platform-registry.js         # 平台注册中心
│   ├── plugin-manager.js            # 插件生命周期管理
│   ├── api-service.js               # API 调用服务 (331行)
│   ├── content-service.js           # 内容处理服务 (203行)
│   ├── config-service.js            # 配置服务
│   └── subscription-service.js      # 订阅权限服务
│
├── plugins/                         # 平台插件层
│   ├── config.js                    # 平台配置文件 - 配置驱动核心 (390行)
│   ├── base-platform.js             # 基础平台插件类 (460行)
│   └── platforms/                   # 各平台具体实现
│       ├── wechat.js                # 微信公众号插件 (1491行，最复杂)
│       ├── zhihu.js                 # 知乎插件 (453行)
│       ├── juejin.js                # 掘金插件
│       ├── zsxq.js                  # 知识星球插件
│       ├── video-wechat.js          # 视频号插件
│       ├── douyin.js                # 抖音插件
│       ├── bilibili.js              # B站插件
│       └── xiaohongshu.js           # 小红书插件
│
└── ui/                              # UI 层
    ├── panel.js                     # 侧边面板 (382行)
    ├── features.js                  # 功能管理器 (824行)
    └── subscription-status.js       # 订阅状态UI
```

### 1.2 核心设计理念

#### 配置驱动架构
所有平台通过 `plugins/config.js` 统一配置，实现了"配置即代码"的理念：

```javascript
// plugins/config.js
window.ZiliuPluginConfig = {
  platforms: [
    {
      id: 'wechat',                    // 平台唯一标识
      displayName: '微信公众号',       // 显示名称
      enabled: true,                   // 是否启用
      urlPatterns: [                   // URL 匹配模式
        'https://mp.weixin.qq.com/*',
        'http://mp.weixin.qq.com/*'
      ],
      editorUrl: 'https://mp.weixin.qq.com/',  // 编辑器地址
      selectors: {                     // DOM 选择器配置
        title: '#title',
        content: '.ProseMirror, .rich_media_content .ProseMirror',
        contentFallback: '#ueditor_0'
      },
      features: [                      // 支持的功能
        'title',
        'content',
        'richText'
      ],
      specialHandling: {               // 特殊处理配置
        initDelay: 500,                // 初始化延迟
        noCopyButton: true             // 不显示复制按钮
      },
      priority: 10                     // 优先级（多平台匹配时使用）
    }
  ],

  // 根据 URL 获取平台配置
  getPluginsForUrl(url) {
    return this.platforms.filter(platform => {
      if (!platform.enabled) return false;
      return platform.urlPatterns.some(pattern =>
        this.matchPattern(url, pattern)
      );
    });
  },

  // 通配符模式匹配
  matchPattern(url, pattern) {
    const escapedPattern = pattern
      .replace(/[.+^${}()|[\]\\?]/g, '\\$&')
      .replace(/\*/g, '.*');
    const regex = new RegExp('^' + escapedPattern + '$', 'i');
    return regex.test(url);
  }
};
```

**配置驱动的优势**：
- 新增平台只需添加配置，无需修改核心代码
- 配置集中管理，易于维护
- 支持动态启用/禁用平台
- 灵活的优先级和特殊处理机制

#### 分层架构

```
┌─────────────────────────────────────────────┐
│              UI 层 (用户交互)                │
│  - 侧边面板 (panel.js)                      │
│  - 功能管理器 (features.js)                 │
│  - 订阅状态 (subscription-status.js)        │
└─────────────────────────────────────────────┘
                    ↓ ↑
┌─────────────────────────────────────────────┐
│          插件层 (平台特定实现)               │
│  - 基础平台类 (base-platform.js)            │
│  - 微信插件 (wechat.js)                     │
│  - 知乎插件 (zhihu.js)                      │
│  - 其他平台插件...                          │
└─────────────────────────────────────────────┘
                    ↓ ↑
┌─────────────────────────────────────────────┐
│          核心层 (基础服务)                   │
│  - 应用控制器 (app.js)                      │
│  - 事件总线 (event-bus.js)                  │
│  - 平台管理器 (platform-manager.js)         │
│  - API 服务 (api-service.js)                │
│  - 内容服务 (content-service.js)            │
└─────────────────────────────────────────────┘
                    ↓ ↑
┌─────────────────────────────────────────────┐
│        通信层 (Chrome Extension API)        │
│  - Background Script (background.js)        │
│  - Message Passing                          │
│  - Storage API                              │
└─────────────────────────────────────────────┘
```

### 1.3 Manifest V3 配置

```json
{
  "manifest_version": 3,
  "name": "述而作助手",
  "version": "1.3.3",
  "description": "一键发布到多个内容平台的浏览器扩展",

  "background": {
    "service_worker": "background.js"
  },

  "content_scripts": [
    {
      "matches": [
        "https://mp.weixin.qq.com/*",
        "http://mp.weixin.qq.com/*"
      ],
      "js": [
        "core/event-bus.js",
        "core/api-service.js",
        "core/content-service.js",
        "plugins/config.js",
        "plugins/base-platform.js",
        "plugins/platforms/wechat.js",
        "main.js"
      ],
      "css": ["ui/panel.css"],
      "run_at": "document_end"
    },
    {
      "matches": ["https://zhuanlan.zhihu.com/*"],
      "js": [
        "core/event-bus.js",
        "core/api-service.js",
        "plugins/config.js",
        "plugins/base-platform.js",
        "plugins/platforms/zhihu.js",
        "main.js"
      ],
      "run_at": "document_end"
    }
    // ... 其他平台配置
  ],

  "permissions": [
    "storage",
    "tabs",
    "cookies"
  ],

  "host_permissions": [
    "https://ziliu.online/*",
    "http://localhost:3000/*",
    "https://mp.weixin.qq.com/*"
  ]
}
```

---

## 二、一键发布完整流程

### 2.1 用户操作时序图

```
用户                述而作网站            插件-Website      插件-Main         Background        Content Script
 │                   Detector          │                 Script            │
 │  点击"发布到微信"    │                   │                   │                   │                   │
 ├──────────────────>│                   │                   │                   │                   │
 │                   │ postMessage       │                   │                   │                   │
 │                   ├──────────────────>│                   │                   │                   │
 │                   │                   │ 验证来源           │                   │                   │
 │                   │                   ├──────────────────>│                   │                   │
 │                   │                   │                   │ sendMessage       │                   │
 │                   │                   │                   ├──────────────────>│                   │
 │                   │                   │                   │                   │ 查找/创建标签页    │
 │                   │                   │                   │                   │ 等待页面加载      │
 │                   │                   │                   │                   ├──────────────────>│
 │                   │                   │                   │                   │                   │ 填充内容
 │                   │                   │                   │                   │<──────────────────┤
 │                   │                   │                   │<──────────────────┤ 返回结果          │
 │                   │                   │<──────────────────┤                   │                   │
 │                   │<──────────────────┤                   │                   │                   │
 │<──────────────────┤ 显示成功提示       │                   │                   │                   │
```

### 2.2 详细流程说明

#### Step 1: 网站端发起请求

位置：述而作网站前端代码

```javascript
// 用户点击"发布到微信公众号"按钮
async function publishToWechat(articleId) {
  // 生成唯一请求ID
  const requestId = `publish_${Date.now()}_${Math.random()}`;

  // 发送 postMessage 到插件
  window.postMessage({
    type: 'ZILIU_PUBLISH_REQUEST',
    data: {
      articleId: articleId,
      platform: 'wechat',
      // 可选：直接传递内容
      title: '文章标题',
      content: '<p>文章内容HTML</p>'
    },
    requestId: requestId,
    source: 'ziliu-web'
  }, '*');

  // 监听响应
  return new Promise((resolve) => {
    const listener = (event) => {
      if (event.data.type === 'ZILIU_PUBLISH_RESPONSE' &&
          event.data.requestId === requestId) {
        window.removeEventListener('message', listener);
        resolve(event.data);
      }
    };
    window.addEventListener('message', listener);

    // 超时处理
    setTimeout(() => {
      window.removeEventListener('message', listener);
      resolve({ success: false, error: '请求超时' });
    }, 30000);
  });
}
```

#### Step 2: 插件检测和验证

位置：`website-detector.js` 和 `main.js`

```javascript
// website-detector.js - 监听网站消息
window.addEventListener('message', (event) => {
  const { type, data, requestId, source } = event.data;

  // 安全验证：只接受来自可信来源的消息
  const isAllowedOrigin =
    event.origin.includes('ziliu.online') ||
    event.origin.includes('localhost:3000');

  if (!isAllowedOrigin) {
    console.warn('❌ 拒绝未知来源的消息:', event.origin);
    return;
  }

  // 验证消息来源标识
  if (source !== 'ziliu-web') {
    return;
  }

  // 处理发布请求
  if (type === 'ZILIU_PUBLISH_REQUEST') {
    handlePublishRequest(data, requestId);
  }
});

// main.js - 处理发布请求
async function handlePublishRequest(data, requestId) {
  try {
    // 调用应用核心控制器
    const result = await window.ZiliuApp.handleFillContent(data);

    // 发送响应回网站
    window.postMessage({
      type: 'ZILIU_PUBLISH_RESPONSE',
      requestId: requestId,
      success: true,
      data: result
    }, '*');

  } catch (error) {
    // 发送错误响应
    window.postMessage({
      type: 'ZILIU_PUBLISH_RESPONSE',
      requestId: requestId,
      success: false,
      error: error.message
    }, '*');
  }
}
```

#### Step 3: 应用控制器处理

位置：`core/app.js`

```javascript
// ZiliuApp 核心控制器
class ZiliuApp {
  async handleFillContent(data) {
    // 1. 获取当前平台
    const currentPlatform = this.platformManager.getCurrentPlatform();
    if (!currentPlatform) {
      throw new Error('未检测到支持的平台');
    }

    // 2. 获取选中的预设
    const selectedPreset = this.getSelectedPreset();

    // 3. 处理内容数据（可能需要从服务器获取文章）
    const processedData = await this.contentService.processContentData(
      data,
      currentPlatform,
      selectedPreset
    );

    // 4. 发送消息到 Background Script
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'oneClickPublish',
        data: {
          platform: currentPlatform.id,
          content: processedData
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || '发布失败'));
        }
      });
    });
  }
}
```

#### Step 4: Background Script 标签页管理

位置：`background.js`

```javascript
// 消息处理器映射
const messageHandlers = {
  oneClickPublish: handleOneClickPublish,
  apiRequest: handleApiRequest,
  // ... 其他处理器
};

// 监听来自 Content Script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = messageHandlers[message.action];

  if (handler) {
    handler(message.data, sender)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 保持消息通道开放（异步响应）
  }

  sendResponse({ success: false, error: '未知操作' });
});

// 一键发布处理器
async function handleOneClickPublish(data) {
  const { platform, content } = data;

  // 1. 获取平台配置
  const platformConfig = getPlatformConfig(platform);
  if (!platformConfig) {
    throw new Error(`未找到平台配置: ${platform}`);
  }

  // 2. 查找现有编辑器标签页
  const existingTabs = await chrome.tabs.query({
    url: platformConfig.urlPatterns
  });

  if (existingTabs.length > 0) {
    // 激活现有标签页
    const tab = existingTabs[0];
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });

    // 延迟后发送填充消息（确保页面准备好）
    return sendFillMessage(tab.id, content, 500);
  } else {
    // 创建新标签页
    const newTab = await chrome.tabs.create({
      url: platformConfig.editorUrl,
      active: true
    });

    // 等待页面加载完成后填充
    return waitForTabAndFill(
      newTab.id,
      content,
      platformConfig.specialHandling?.loadDelay || 2000
    );
  }
}

// 等待标签页加载并填充内容
function waitForTabAndFill(tabId, content, loadDelay) {
  return new Promise((resolve, reject) => {
    // 设置超时
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('页面加载超时'));
    }, 30000);

    // 监听标签页加载状态
    const listener = (currentTabId, changeInfo, tab) => {
      if (currentTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        clearTimeout(timeout);

        // 页面加载完成，延迟后发送填充消息
        setTimeout(() => {
          sendFillMessage(tabId, content, 0)
            .then(resolve)
            .catch(reject);
        }, loadDelay);
      }
    };

    chrome.tabs.onUpdated.addListener(listener);
  });
}

// 发送填充消息到 Content Script
function sendFillMessage(tabId, content, delay) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, {
        action: 'fillContent',
        data: content
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    }, delay);
  });
}

// 获取平台配置
function getPlatformConfig(platformId) {
  // 从存储的配置中获取（在扩展启动时从 config.js 加载）
  return platformConfigs[platformId];
}
```

#### Step 5: Content Script 执行填充

位置：`main.js` → 平台插件

```javascript
// main.js - 监听 Background 消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fillContent') {
    handleFillContent(message.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 异步响应
  }
});

// 处理填充请求
async function handleFillContent(data) {
  // 获取当前平台插件
  const platform = window.ZiliuApp.platformManager.getCurrentPlatform();

  if (!platform) {
    throw new Error('当前页面不是支持的编辑器');
  }

  // 调用平台插件的 fillContent 方法
  const results = await platform.fillContent(data);

  // 发送填充完成事件
  ZiliuEventBus.emit('platform:fillComplete', {
    platform: platform.id,
    results: results
  });

  return results;
}
```

### 2.3 流程图总结

```
[用户点击发布]
      ↓
[网站 postMessage]
      ↓
[插件检测 + 验证来源] ← 安全检查
      ↓
[应用控制器处理]
      ↓
[获取文章数据] ← 可能从 API 获取
      ↓
[应用预设配置] ← 页眉、页脚、作者等
      ↓
[发送到 Background]
      ↓
[查找/创建标签页] ← 标签页管理
      ↓
[等待页面加载]
      ↓
[发送填充消息]
      ↓
[平台插件执行] ← 检测编辑器、DOM 操作
      ↓
[内容注入成功]
      ↓
[返回结果到网站]
```

---

## 三、平台检测与内容注入机制

### 3.1 三层平台检测机制

#### 第一层：Manifest 声明式匹配

```json
{
  "content_scripts": [{
    "matches": [
      "https://mp.weixin.qq.com/*",
      "http://mp.weixin.qq.com/*"
    ],
    "js": ["...", "plugins/platforms/wechat.js", "main.js"]
  }]
}
```

**优势**：
- Chrome 自动注入脚本到匹配的页面
- 性能最优（无需额外检测）
- 精确控制注入时机（`run_at: "document_end"`）

#### 第二层：URL 模式动态匹配

位置：`core/platform-detector.js`

```javascript
class PlatformDetector {
  detectPlatformFromUrl(url) {
    // 从配置中获取所有平台
    const allPlatforms = window.ZiliuPluginConfig.platforms;

    // 找到所有匹配当前 URL 的平台
    const matchedPlatforms = allPlatforms.filter(platform => {
      if (!platform.enabled) return false;

      return platform.urlPatterns.some(pattern =>
        this.matchUrl(url, pattern)
      );
    });

    // 按优先级排序
    matchedPlatforms.sort((a, b) => {
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      return priorityB - priorityA;
    });

    // 返回最高优先级平台
    return matchedPlatforms[0] || null;
  }

  // 支持通配符的 URL 匹配
  matchUrl(url, pattern) {
    // 将通配符模式转换为正则表达式
    const escapedPattern = pattern
      .replace(/[.+^${}()|[\]\\?]/g, '\\$&')  // 转义特殊字符
      .replace(/\*/g, '.*');                   // * 转为 .*

    const regex = new RegExp('^' + escapedPattern + '$', 'i');
    return regex.test(url);
  }
}

// 使用示例
const detector = new PlatformDetector();
const platform = detector.detectPlatformFromUrl(window.location.href);
console.log('检测到平台:', platform?.displayName);
```

#### 第三层：编辑器元素验证

位置：`plugins/base-platform.js`

```javascript
class BasePlatformPlugin {
  // 查找并验证编辑器元素
  findEditorElements(useCache = true) {
    // 使用缓存提高性能
    if (useCache && this.cachedElements) {
      const isStillValid = this.validateCache(this.cachedElements);
      if (isStillValid) {
        return this.cachedElements;
      }
    }

    // 重新查找元素
    return this._findElements();
  }

  _findElements() {
    const elements = {
      title: this.findElement(this.selectors.title),
      content: this.findElement(this.selectors.content),
      author: this.findElement(this.selectors.author),
      digest: this.findElement(this.selectors.digest)
    };

    // 验证是否为真正的编辑器
    elements.isEditor = this.validateEditorElements(elements);

    // 缓存结果
    if (elements.isEditor) {
      this.cachedElements = elements;
      this.cacheTimestamp = Date.now();
    }

    return elements;
  }

  // 验证编辑器元素
  validateEditorElements(elements) {
    // 至少需要标题或内容编辑器
    if (!elements.title && !elements.content) {
      return false;
    }

    // 检查元素是否可见
    if (elements.title && !this.isElementVisible(elements.title)) {
      return false;
    }

    if (elements.content && !this.isElementVisible(elements.content)) {
      return false;
    }

    return true;
  }

  // 支持多选择器查找（回退机制）
  findElement(selector) {
    if (!selector) return null;

    // 支持数组形式的多选择器
    if (Array.isArray(selector)) {
      for (const sel of selector) {
        const element = this.findElement(sel);
        if (element) return element;
      }
      return null;
    }

    // 支持逗号分隔的选择器
    if (selector.includes(',')) {
      const selectors = selector.split(',').map(s => s.trim());
      for (const sel of selectors) {
        const element = document.querySelector(sel);
        if (element) return element;
      }
      return null;
    }

    // 单一选择器
    return document.querySelector(selector);
  }
}
```

### 3.2 智能内容注入策略

#### 不同编辑器类型的注入方法

**1. ProseMirror 编辑器（微信新版）**

```javascript
// plugins/platforms/wechat.js
async fillProseMirrorEditor(element, content) {
  // 1. 聚焦编辑器
  element.focus();

  // 2. 清空现有内容
  element.innerHTML = '';

  // 3. 设置新内容（HTML）
  element.innerHTML = content;

  // 4. 触发 ProseMirror 的 input 事件
  const inputEvent = new Event('input', {
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(inputEvent);

  // 5. 触发微信自动保存机制
  await this.triggerWeChatAutoSave(element);

  // 6. 等待渲染完成
  await this.waitForRender(500);

  return { success: true };
}

// 触发微信自动保存
async triggerWeChatAutoSave(element) {
  // 模拟用户输入触发自动保存
  const events = ['input', 'change', 'blur'];

  for (const eventType of events) {
    const event = new Event(eventType, { bubbles: true });
    element.dispatchEvent(event);
    await this.delay(100);
  }
}
```

**2. UEditor 编辑器（微信旧版）**

```javascript
async fillUEditor(element, content) {
  // UEditor 有自己的 API
  const editorId = element.id;
  const ue = window.UE?.getEditor(editorId);

  if (ue) {
    // 使用 UEditor API
    ue.setContent(content);
    ue.focus();
    return { success: true };
  } else {
    // 降级到 DOM 操作
    element.innerHTML = content;
    return { success: true };
  }
}
```

**3. Draft.js 编辑器（知乎）**

```javascript
// plugins/platforms/zhihu.js
async fillDraftJsEditor(element, content) {
  element.focus();

  // Draft.js 使用剪贴板事件注入效果最好
  const clipboardData = new DataTransfer();
  clipboardData.setData('text/html', content);
  clipboardData.setData('text/plain', this.stripHtml(content));

  const pasteEvent = new ClipboardEvent('paste', {
    clipboardData: clipboardData,
    bubbles: true,
    cancelable: true
  });

  element.dispatchEvent(pasteEvent);

  // 等待 Draft.js 处理
  await this.delay(300);

  return { success: true };
}
```

**4. ContentEditable 元素（通用）**

```javascript
async fillContentEditable(element, content) {
  element.focus();

  // 选中所有内容
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  // 使用 document.execCommand (虽然已废弃但仍广泛支持)
  document.execCommand('insertHTML', false, content);

  // 触发 input 事件
  element.dispatchEvent(new Event('input', { bubbles: true }));

  return { success: true };
}
```

### 3.3 智能选择器系统

```javascript
// plugins/config.js 中的选择器配置
selectors: {
  // 主选择器（优先尝试）
  content: '.ProseMirror, .rich_media_content .ProseMirror',

  // 回退选择器（主选择器失败时使用）
  contentFallback: '#ueditor_0',

  // 排除选择器（避免误选）
  contentExclude: '.ziliu-panel, .ziliu-feature',

  // 数组形式（按顺序尝试）
  title: [
    '#title',
    'input[placeholder*="标题"]',
    '[contenteditable="true"][data-field="title"]'
  ]
}

// base-platform.js 中的查找逻辑
findElement(selector) {
  // 处理数组选择器
  if (Array.isArray(selector)) {
    for (const sel of selector) {
      const element = document.querySelector(sel);
      if (element && this.isElementVisible(element)) {
        return element;
      }
    }
    return null;
  }

  // 处理逗号分隔选择器
  if (typeof selector === 'string' && selector.includes(',')) {
    const selectors = selector.split(',').map(s => s.trim());
    for (const sel of selectors) {
      const element = document.querySelector(sel);
      if (element && this.isElementVisible(element)) {
        return element;
      }
    }
    return null;
  }

  // 单一选择器
  const element = document.querySelector(selector);
  return (element && this.isElementVisible(element)) ? element : null;
}

// 排除不需要的元素
findElementWithExclusion(selector, excludeSelector) {
  const elements = document.querySelectorAll(selector);

  for (const element of elements) {
    // 检查是否匹配排除选择器
    if (excludeSelector && element.matches(excludeSelector)) {
      continue;
    }

    // 检查是否在排除的父元素内
    if (excludeSelector && element.closest(excludeSelector)) {
      continue;
    }

    if (this.isElementVisible(element)) {
      return element;
    }
  }

  return null;
}
```

---

## 四、通信机制架构

### 4.1 多层通信体系

```
┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
│   述而作网站      │          │  Content Script │          │  Background     │          │   API Server    │
│  (ziliu.online) │          │   (插件注入)     │          │   Script        │          │  (ziliu.online) │
└─────────────────┘          └─────────────────┘          └─────────────────┘          └─────────────────┘
        │                            │                            │                            │
        │  ① window.postMessage      │                            │                            │
        ├───────────────────────────>│                            │                            │
        │   {type: 'PUBLISH_REQ'}    │                            │                            │
        │                            │                            │                            │
        │                            │  ② chrome.runtime.sendMsg  │                            │
        │                            ├───────────────────────────>│                            │
        │                            │   {action: 'oneClick'}     │                            │
        │                            │                            │                            │
        │                            │                            │  ③ fetch (HTTP/HTTPS)      │
        │                            │                            ├───────────────────────────>│
        │                            │                            │   GET /api/articles/123    │
        │                            │                            │                            │
        │                            │                            │  ④ JSON Response           │
        │                            │                            │<───────────────────────────┤
        │                            │                            │   {data: {...}}            │
        │                            │                            │                            │
        │                            │  ⑤ chrome.tabs.sendMsg     │                            │
        │                            │<───────────────────────────┤                            │
        │                            │   {action: 'fillContent'}  │                            │
        │                            │                            │                            │
        │  ⑥ window.postMessage      │                            │                            │
        │<───────────────────────────┤                            │                            │
        │   {type: 'PUBLISH_RESP'}   │                            │                            │
```

### 4.2 通信层详解

#### ① 网站与插件通信（window.postMessage）

**为什么使用 postMessage？**
- Web 页面无法直接调用 Chrome Extension API
- postMessage 是跨域通信的标准方式
- 支持双向通信

**安全机制**：

```javascript
// website-detector.js
window.addEventListener('message', (event) => {
  // ✅ 安全检查 1: 验证来源域名
  const allowedOrigins = [
    'https://ziliu.online',
    'https://www.ziliu.online',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  const isAllowedOrigin = allowedOrigins.some(origin =>
    event.origin.startsWith(origin)
  );

  if (!isAllowedOrigin) {
    console.warn('❌ 拒绝来自未知来源的消息:', event.origin);
    return;
  }

  // ✅ 安全检查 2: 验证消息结构
  const { type, source, data, requestId } = event.data;

  if (source !== 'ziliu-web') {
    console.warn('❌ 拒绝无效的消息来源标识');
    return;
  }

  // ✅ 安全检查 3: 验证消息类型
  const allowedTypes = [
    'ZILIU_PUBLISH_REQUEST',
    'ZILIU_EXTENSION_DETECT',
    'ZILIU_GET_ARTICLE'
  ];

  if (!allowedTypes.includes(type)) {
    console.warn('❌ 拒绝未知的消息类型:', type);
    return;
  }

  // 处理消息
  handleMessage(type, data, requestId);
});
```

**消息格式约定**：

```typescript
// 发布请求
interface PublishRequest {
  type: 'ZILIU_PUBLISH_REQUEST';
  source: 'ziliu-web';
  requestId: string;
  data: {
    articleId?: string;     // 文章ID（从服务器获取）
    platform: string;       // 目标平台
    title?: string;         // 直接传递的标题
    content?: string;       // 直接传递的内容
  };
}

// 发布响应
interface PublishResponse {
  type: 'ZILIU_PUBLISH_RESPONSE';
  requestId: string;
  success: boolean;
  data?: any;
  error?: string;
}
```

#### ② Content Script 与 Background 通信

**chrome.runtime.sendMessage（单次请求）**：

```javascript
// Content Script 发送消息
chrome.runtime.sendMessage({
  action: 'apiRequest',
  data: {
    endpoint: '/api/articles/123',
    method: 'GET'
  }
}, (response) => {
  if (chrome.runtime.lastError) {
    console.error('通信错误:', chrome.runtime.lastError.message);
    return;
  }

  if (response.success) {
    console.log('数据:', response.data);
  } else {
    console.error('请求失败:', response.error);
  }
});

// Background Script 监听和响应
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action, data } = message;

  if (action === 'apiRequest') {
    // 异步处理
    handleApiRequest(data)
      .then(result => {
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });

    return true; // ⚠️ 关键：保持消息通道开放（异步响应）
  }
});
```

**chrome.tabs.sendMessage（Background → Content）**：

```javascript
// Background Script 发送消息到指定标签页
chrome.tabs.sendMessage(
  tabId,
  {
    action: 'fillContent',
    data: {
      title: '标题',
      content: '<p>内容</p>'
    }
  },
  (response) => {
    if (chrome.runtime.lastError) {
      console.error('发送失败:', chrome.runtime.lastError.message);
      return;
    }

    console.log('填充结果:', response);
  }
);

// Content Script 监听
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fillContent') {
    fillContent(message.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));

    return true; // 异步响应
  }
});
```

#### ③ Background 与服务器通信（Fetch API）

```javascript
// core/api-service.js (在 Background 中执行)
class ApiService {
  constructor() {
    this.baseUrl = 'https://ziliu.online';
    this.cache = new Map();
  }

  async makeRequest(endpoint, options = {}) {
    const { method = 'GET', body, headers = {}, useCache = false } = options;

    // 检查缓存
    if (useCache && method === 'GET') {
      const cached = this.getCache(endpoint);
      if (cached) return cached;
    }

    // 构建请求
    const url = `${this.baseUrl}${endpoint}`;
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      credentials: 'include', // ⚠️ 重要：携带 Cookie（认证）
      body: body ? JSON.stringify(body) : undefined
    };

    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // 缓存结果
      if (useCache && method === 'GET') {
        this.setCache(endpoint, data);
      }

      return data;

    } catch (error) {
      // 网络错误处理
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络');
      }
      throw error;
    }
  }
}

// 暴露给 Content Script 使用
window.ZiliuApiService = new ApiService();
```

**为什么在 Background 中请求 API？**
- 解决跨域问题（Background 不受 CORS 限制）
- 统一管理 Cookie 和认证
- 实现请求缓存
- 避免在多个 Content Script 中重复请求

### 4.3 事件总线系统（EventBus）

**发布订阅模式**实现组件间解耦通信：

```javascript
// core/event-bus.js
class EventBus {
  constructor() {
    this.events = {};
  }

  // 订阅事件
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  // 一次性订阅
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  // 发布事件
  emit(event, ...args) {
    if (!this.events[event]) return;

    this.events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`EventBus 错误 [${event}]:`, error);
      }
    });
  }

  // 取消订阅
  off(event, callback) {
    if (!this.events[event]) return;

    if (callback) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    } else {
      delete this.events[event];
    }
  }
}

// 全局实例
window.ZiliuEventBus = new EventBus();
```

**使用示例**：

```javascript
// UI 组件订阅事件
ZiliuEventBus.on('platform:fillComplete', (data) => {
  console.log('✅ 填充完成:', data.platform);
  showSuccessToast('内容已填充到编辑器');
});

ZiliuEventBus.on('platform:error', (data) => {
  console.error('❌ 填充失败:', data.error);
  showErrorToast(data.error.message);
});

ZiliuEventBus.on('subscription:changed', (data) => {
  console.log('📋 订阅状态变更:', data);
  updateUI();
});

// 平台插件发布事件
class WeChatPlatform extends BasePlatformPlugin {
  async fillContent(data) {
    try {
      ZiliuEventBus.emit('platform:fillStart', { platform: 'wechat' });

      const results = await this.doFill(data);

      ZiliuEventBus.emit('platform:fillComplete', {
        platform: 'wechat',
        results: results
      });

      return results;
    } catch (error) {
      ZiliuEventBus.emit('platform:error', {
        platform: 'wechat',
        error: error
      });
      throw error;
    }
  }
}
```

---

## 五、各平台插件实现细节

### 5.1 微信公众号插件（最复杂）

文件：`plugins/platforms/wechat.js` (1491 行)

#### 核心特性

1. **双编辑器支持**：ProseMirror（新版） + UEditor（旧版）
2. **图片外链转 CDN**：自动上传图片到微信 CDN
3. **队列管理**：防止并发上传触发风控
4. **预设应用**：页眉、页脚、作者信息
5. **特殊语法处理**：历史文章获取（`{{featured-articles:10}}`）

#### 图片上传系统

**风控配置**：

```javascript
class WeChatPlatform extends BasePlatformPlugin {
  static get UPLOAD_CONFIG() {
    return {
      MAX_CONCURRENT_UPLOADS: 3,      // 最大并发数
      MAX_RETRY_ATTEMPTS: 3,          // 最大重试次数
      BASE_DELAY: 1000,               // 基础延迟（毫秒）
      MIN_REQUEST_INTERVAL: 500,      // 最小请求间隔
      MAX_DELAY: 10000,               // 最大延迟
      QUEUE_PROCESS_INTERVAL: 200     // 队列处理间隔
    };
  }

  constructor(config) {
    super(config);

    // 上传状态管理
    this.uploadState = {
      uploadQueue: [],                 // 上传队列
      activeUploads: new Set(),        // 活动上传任务
      uploadHistory: new Map(),        // 上传历史（URL → 结果）
      lastUploadTime: 0,               // 最后上传时间
      isProcessing: false              // 是否正在处理队列
    };
  }
}
```

**队列处理逻辑**：

```javascript
// 将图片加入上传队列
async uploadImageWithQueue(imageUrl) {
  // 检查缓存
  if (this.uploadState.uploadHistory.has(imageUrl)) {
    const cached = this.uploadState.uploadHistory.get(imageUrl);
    if (cached.success) {
      return cached.cdnUrl;
    }
  }

  // 创建上传任务
  const uploadTask = {
    id: `upload_${Date.now()}_${Math.random()}`,
    imageUrl: imageUrl,
    addedAt: Date.now(),
    status: 'pending'
  };

  this.uploadState.uploadQueue.push(uploadTask);

  // 启动队列处理（防抖）
  this.processUploadQueue();

  // 等待上传完成
  return new Promise((resolve, reject) => {
    uploadTask.resolve = resolve;
    uploadTask.reject = reject;
  });
}

// 处理上传队列（核心算法）
async processUploadQueue() {
  if (this.uploadState.isProcessing) {
    return; // 已在处理中
  }

  this.uploadState.isProcessing = true;

  while (this.uploadState.uploadQueue.length > 0) {
    // 控制并发数
    while (
      this.uploadState.activeUploads.size >= this.UPLOAD_CONFIG.MAX_CONCURRENT_UPLOADS
    ) {
      await this.delay(this.UPLOAD_CONFIG.QUEUE_PROCESS_INTERVAL);
    }

    // 控制请求频率
    const timeSinceLastUpload = Date.now() - this.uploadState.lastUploadTime;
    if (timeSinceLastUpload < this.UPLOAD_CONFIG.MIN_REQUEST_INTERVAL) {
      await this.delay(
        this.UPLOAD_CONFIG.MIN_REQUEST_INTERVAL - timeSinceLastUpload
      );
    }

    // 取出队列头部任务
    const task = this.uploadState.uploadQueue.shift();
    if (!task) break;

    // 执行上传（不等待完成）
    this.executeUploadTask(task);
  }

  this.uploadState.isProcessing = false;
}

// 执行单个上传任务
async executeUploadTask(task) {
  this.uploadState.activeUploads.add(task.id);
  this.uploadState.lastUploadTime = Date.now();

  try {
    const cdnUrl = await this.uploadImageWithRetry(task);

    // 缓存成功结果
    this.uploadState.uploadHistory.set(task.imageUrl, {
      success: true,
      cdnUrl: cdnUrl
    });

    task.resolve(cdnUrl);

  } catch (error) {
    // 缓存失败结果（避免重复失败）
    this.uploadState.uploadHistory.set(task.imageUrl, {
      success: false,
      error: error.message
    });

    task.reject(error);
  } finally {
    this.uploadState.activeUploads.delete(task.id);
  }
}

// 带重试的上传（指数退避）
async uploadImageWithRetry(task) {
  let lastError = null;

  for (let attempt = 0; attempt <= this.UPLOAD_CONFIG.MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`📤 上传图片 [尝试 ${attempt + 1}/${this.UPLOAD_CONFIG.MAX_RETRY_ATTEMPTS + 1}]:`, task.imageUrl);

      const cdnUrl = await this.uploadImageToCDN(task.imageUrl);

      if (cdnUrl) {
        console.log('✅ 上传成功:', cdnUrl);
        return cdnUrl;
      }

    } catch (error) {
      lastError = error;
      console.warn(`⚠️ 上传失败 [尝试 ${attempt + 1}]:`, error.message);

      // 检查是否为致命错误（不重试）
      if (this.isFatalError(error)) {
        console.error('❌ 致命错误，停止重试');
        break;
      }

      // 计算退避延迟
      if (attempt < this.UPLOAD_CONFIG.MAX_RETRY_ATTEMPTS) {
        const delay = this.calculateBackoffDelay(attempt);
        console.log(`⏳ 等待 ${delay}ms 后重试...`);
        await this.delay(delay);
      }
    }
  }

  throw lastError || new Error('上传失败');
}

// 指数退避算法
calculateBackoffDelay(attempt) {
  const { BASE_DELAY, MAX_DELAY } = this.UPLOAD_CONFIG;

  // 指数增长：1秒 → 2秒 → 4秒 → 8秒
  const exponentialDelay = BASE_DELAY * Math.pow(2, attempt);

  // 添加随机抖动（避免雷鸣群效应）
  const jitter = Math.random() * BASE_DELAY;

  // 限制最大延迟
  return Math.min(exponentialDelay + jitter, MAX_DELAY);
}

// 判断是否为致命错误
isFatalError(error) {
  const fatalMessages = [
    '图片格式不支持',
    '图片过大',
    '权限不足',
    '401',
    '403'
  ];

  return fatalMessages.some(msg =>
    error.message.includes(msg)
  );
}
```

**调用微信 CDN 上传接口**：

```javascript
async uploadImageToCDN(imageUrl) {
  // 通过 Background Script 调用 API
  const response = await ZiliuApiService.uploadImage({
    imageUrl: imageUrl,
    platform: 'wechat'
  });

  if (response.success && response.cdnUrl) {
    return response.cdnUrl;
  }

  throw new Error(response.error || '上传失败');
}
```

#### 预设应用系统

```javascript
async fillContentEditor(contentElement, content, data) {
  let fullContent = content;

  // 应用预设
  if (data.preset) {
    console.log('📋 应用预设:', data.preset.name);

    // 1. 转换页眉 Markdown 为 HTML
    if (data.preset.headerContent) {
      const headerHtml = await this.convertMarkdownToHtml(
        data.preset.headerContent,
        data.style || 'default'
      );
      fullContent = headerHtml + '\n' + fullContent;
    }

    // 2. 转换页脚 Markdown 为 HTML
    if (data.preset.footerContent) {
      const footerHtml = await this.convertMarkdownToHtml(
        data.preset.footerContent,
        data.style || 'default'
      );
      fullContent = fullContent + '\n' + footerHtml;
    }

    // 3. 应用作者信息
    if (data.preset.author) {
      // 微信公众号的作者通过单独字段设置
      const authorElement = this.findElement(this.selectors.author);
      if (authorElement) {
        await this.fillAuthor(authorElement, data.preset.author);
      }
    }
  }

  // 处理特殊语法（如 {{featured-articles:10}}）
  fullContent = await this.processSpecialSyntax(fullContent);

  // 转换外链图片为微信 CDN
  fullContent = await this.preProcessImages(fullContent);

  // 填充到编辑器
  return await this.fillProseMirrorEditor(contentElement, fullContent);
}

// Markdown 转 HTML
async convertMarkdownToHtml(markdown, style) {
  // 调用服务器的转换 API
  const response = await ZiliuApiService.convertMarkdown({
    content: markdown,
    style: style,
    platform: 'wechat'
  });

  if (response.success) {
    return response.html;
  }

  throw new Error('Markdown 转换失败');
}

// 处理特殊语法
async processSpecialSyntax(content) {
  // 匹配 {{featured-articles:N}} 语法
  const regex = /\{\{featured-articles:(\d+)\}\}/g;

  let processedContent = content;
  const matches = [...content.matchAll(regex)];

  for (const match of matches) {
    const count = parseInt(match[1], 10);
    const placeholder = match[0];

    try {
      // 获取历史文章列表
      const articles = await this.getFeaturedArticles(count);

      // 生成 HTML 列表
      const articlesHtml = this.generateArticlesHtml(articles);

      // 替换占位符
      processedContent = processedContent.replace(placeholder, articlesHtml);

    } catch (error) {
      console.error('获取历史文章失败:', error);
      processedContent = processedContent.replace(placeholder, '');
    }
  }

  return processedContent;
}

// 预处理图片（转换外链）
async preProcessImages(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const images = doc.querySelectorAll('img');

  console.log(`🖼️ 发现 ${images.length} 张图片`);

  // 收集所有外链图片
  const externalImages = [];
  for (const img of images) {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('https://mmbiz.qpic.cn/')) {
      externalImages.push({ element: img, url: src });
    }
  }

  if (externalImages.length === 0) {
    console.log('✅ 无需转换图片');
    return htmlContent;
  }

  console.log(`📤 需要上传 ${externalImages.length} 张外链图片`);

  // 批量上传
  const uploadPromises = externalImages.map(async ({ element, url }) => {
    try {
      const cdnUrl = await this.uploadImageWithQueue(url);
      element.setAttribute('src', cdnUrl);
      console.log(`✅ 图片转换成功: ${url} → ${cdnUrl}`);
    } catch (error) {
      console.error(`❌ 图片上传失败 [${url}]:`, error);
      // 保留原始链接
    }
  });

  await Promise.all(uploadPromises);

  return doc.body.innerHTML;
}
```

### 5.2 知乎插件

文件：`plugins/platforms/zhihu.js` (453 行)

#### 特殊处理

知乎采用 **copyOnly 模式**：只填充标题，内容需用户复制粘贴。

**原因**：
- 知乎编辑器（Draft.js）对程序化填充有限制
- 复制粘贴能更好地保留格式
- 避免触发知乎的反作弊机制

```javascript
class ZhihuPlatform extends BasePlatformPlugin {
  async fillContent(data) {
    const elements = await this.waitForEditor();

    if (!elements.isEditor) {
      throw new Error('当前页面不是知乎编辑器');
    }

    const results = {};

    // ✅ 只填充标题
    if (data.title && elements.elements.title) {
      results.title = await this.fillTitle(elements.elements.title, data.title);
    }

    // ❌ 不填充内容
    if (data.content) {
      results.content = {
        success: false,
        reason: 'zhihu_copy_only',
        message: '知乎平台内容请使用"复制正文"按钮获取，然后手动粘贴到编辑器'
      };

      // 自动复制到剪贴板
      try {
        await navigator.clipboard.writeText(data.content);
        results.content.message += '（内容已复制到剪贴板，请按 Ctrl+V 粘贴）';
      } catch (error) {
        console.warn('自动复制失败:', error);
      }
    }

    return results;
  }

  // 智能等待编辑器加载
  async waitForEditor(maxWaitTime = 10000) {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const checkEditor = () => {
        const elements = this._findElements();

        // 编辑器已就绪
        if (elements.isEditor && this.isEditorReady(elements.elements)) {
          console.log('✅ 知乎编辑器已就绪');
          resolve(elements);
          return;
        }

        // 超时
        if (Date.now() - startTime >= maxWaitTime) {
          console.warn('⚠️ 等待编辑器超时');
          resolve(elements);
          return;
        }

        // 继续等待
        setTimeout(checkEditor, 500);
      };

      checkEditor();
    });
  }

  // 智能选择标题输入框（排除插件自身元素）
  _findElements() {
    // 知乎的标题输入框可能有多个，需要排除插件面板中的输入框
    const titleInputs = document.querySelectorAll('input[placeholder*="标题"]');

    let titleElement = null;
    for (const input of titleInputs) {
      // 排除插件自身的元素
      if (input.closest('.ziliu-panel')) {
        continue;
      }

      // 排除隐藏元素
      if (!this.isElementVisible(input)) {
        continue;
      }

      titleElement = input;
      break;
    }

    const contentElement = this.findElement(this.selectors.content);

    return {
      elements: {
        title: titleElement,
        content: contentElement
      },
      isEditor: !!(titleElement || contentElement)
    };
  }
}
```

### 5.3 基础平台插件类

文件：`plugins/base-platform.js` (460 行)

所有平台插件的基类，提供通用功能。

#### 核心方法

```javascript
class BasePlatformPlugin {
  constructor(config) {
    this.id = config.id;
    this.displayName = config.displayName;
    this.selectors = config.selectors;
    this.features = config.features || [];
    this.specialHandling = config.specialHandling || {};

    // 缓存
    this.cachedElements = null;
    this.cacheTimestamp = 0;
  }

  // ==================== 查找元素 ====================

  findEditorElements(useCache = true) {
    // 使用缓存（提高性能）
    if (useCache && this.cachedElements) {
      const cacheAge = Date.now() - this.cacheTimestamp;
      if (cacheAge < 5000) { // 5秒内有效
        return this.cachedElements;
      }
    }

    return this._findElements();
  }

  _findElements() {
    const elements = {
      title: this.findElement(this.selectors.title),
      content: this.findElement(this.selectors.content),
      author: this.findElement(this.selectors.author),
      digest: this.findElement(this.selectors.digest)
    };

    elements.isEditor = this.validateEditorElements(elements);

    if (elements.isEditor) {
      this.cachedElements = elements;
      this.cacheTimestamp = Date.now();
    }

    return elements;
  }

  // ==================== 填充内容 ====================

  async fillContent(data) {
    console.log(`📝 开始填充内容到 ${this.displayName}`);

    const elements = this.findEditorElements(false); // 不使用缓存

    if (!elements.isEditor) {
      throw new Error(`当前页面不是 ${this.displayName} 编辑器`);
    }

    const results = {};

    // 填充标题
    if (data.title && elements.elements.title) {
      try {
        results.title = await this.fillTitle(elements.elements.title, data.title);
      } catch (error) {
        results.title = { success: false, error: error.message };
      }
    }

    // 填充内容
    if (data.content && elements.elements.content) {
      try {
        results.content = await this.fillContentEditor(
          elements.elements.content,
          data.content,
          data
        );
      } catch (error) {
        results.content = { success: false, error: error.message };
      }
    }

    // 填充作者
    if (data.author && elements.elements.author) {
      try {
        results.author = await this.fillAuthor(elements.elements.author, data.author);
      } catch (error) {
        results.author = { success: false, error: error.message };
      }
    }

    // 填充摘要
    if (data.digest && elements.elements.digest) {
      try {
        results.digest = await this.fillDigest(elements.elements.digest, data.digest);
      } catch (error) {
        results.digest = { success: false, error: error.message };
      }
    }

    // 后处理钩子
    await this.postFillProcess(elements.elements, data, results);

    console.log('✅ 填充完成:', results);
    return results;
  }

  // 填充标题
  async fillTitle(element, title) {
    element.focus();

    // 清空
    element.value = '';

    // 设置新值
    element.value = title;

    // 触发事件
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    return { success: true };
  }

  // 填充内容编辑器（子类可重写）
  async fillContentEditor(element, content, data) {
    element.focus();

    // 清空
    element.innerHTML = '';

    // 设置内容
    element.innerHTML = content;

    // 触发事件
    element.dispatchEvent(new Event('input', { bubbles: true }));

    return { success: true };
  }

  // ==================== 复制文章 ====================

  async copyArticleContent(articleId) {
    // 获取文章原始 Markdown 内容
    const response = await ZiliuApiService.articles.get(articleId, 'raw');
    let contentToCopy = response.data.content;

    // 应用预设
    const currentPreset = window.ZiliuApp?.getSelectedPreset?.();
    if (currentPreset) {
      if (currentPreset.headerContent) {
        contentToCopy = currentPreset.headerContent + '\n\n' + contentToCopy;
      }
      if (currentPreset.footerContent) {
        contentToCopy += '\n\n' + currentPreset.footerContent;
      }
    }

    // 复制到剪贴板
    await navigator.clipboard.writeText(contentToCopy);

    return {
      success: true,
      message: '内容已复制到剪贴板（包含预设）'
    };
  }

  // ==================== 工具方法 ====================

  isElementVisible(element) {
    if (!element) return false;

    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 后处理钩子（子类可重写）
  async postFillProcess(elements, data, results) {
    // 默认无操作
  }
}
```

---

## 六、关键代码逻辑和算法

### 6.1 平台注册与发现

位置：`core/platform-registry.js` + `core/platform-manager.js`

```javascript
// 平台注册中心
class PlatformRegistry {
  constructor() {
    this.platforms = new Map();
  }

  // 注册平台
  register(platformId, platformInstance) {
    if (this.platforms.has(platformId)) {
      console.warn(`⚠️ 平台 ${platformId} 已注册，将被覆盖`);
    }

    this.platforms.set(platformId, platformInstance);
    console.log(`✅ 注册平台: ${platformId}`);
  }

  // 获取平台
  get(platformId) {
    return this.platforms.get(platformId);
  }

  // 获取所有平台
  getAll() {
    return Array.from(this.platforms.values());
  }
}

// 平台管理器
class PlatformManager {
  constructor() {
    this.registry = new PlatformRegistry();
    this.currentPlatform = null;
  }

  // 初始化（从配置创建平台实例）
  initialize() {
    const configs = window.ZiliuPluginConfig.platforms;

    for (const config of configs) {
      if (!config.enabled) continue;

      // 根据配置动态创建平台实例
      const PlatformClass = this.getPlatformClass(config.id);
      if (PlatformClass) {
        const instance = new PlatformClass(config);
        this.registry.register(config.id, instance);
      }
    }

    // 检测当前平台
    this.detectCurrentPlatform();
  }

  // 获取平台类（工厂模式）
  getPlatformClass(platformId) {
    const classMap = {
      'wechat': WeChatPlatform,
      'zhihu': ZhihuPlatform,
      'juejin': JuejinPlatform,
      // ... 其他平台
    };

    return classMap[platformId] || BasePlatformPlugin;
  }

  // 检测当前平台
  detectCurrentPlatform() {
    const url = window.location.href;
    const detector = new PlatformDetector();
    const platformConfig = detector.detectPlatformFromUrl(url);

    if (platformConfig) {
      this.currentPlatform = this.registry.get(platformConfig.id);
      console.log(`🎯 检测到平台: ${platformConfig.displayName}`);
    }

    return this.currentPlatform;
  }

  // 获取当前平台
  getCurrentPlatform() {
    return this.currentPlatform;
  }
}
```

### 6.2 内容处理服务

位置：`core/content-service.js`

```javascript
class ZiliuContentService {
  // 处理内容数据（统一入口）
  async processContentData(data, currentPlatform, selectedPreset) {
    // 如果提供了 articleId，从服务器获取文章
    if (data.articleId) {
      return await this.processArticleData(data, currentPlatform, selectedPreset);
    }

    // 否则直接使用提供的数据
    return {
      ...data,
      preset: selectedPreset
    };
  }

  // 处理文章数据
  async processArticleData(data, currentPlatform, selectedPreset) {
    // 1. 获取文章详情
    const articleDetail = await this.fetchArticleDetail(data.articleId);

    // 2. 判断是否为视频平台
    const isVideoPlatform = ['video_wechat', 'douyin', 'bilibili', 'xiaohongshu']
      .includes(currentPlatform?.id);

    if (isVideoPlatform) {
      // 视频平台：获取 AI 转换后的视频数据
      const videoData = await this.getVideoContent(
        data.articleId,
        currentPlatform.id
      );

      return {
        ...articleDetail,
        ...videoData,
        preset: selectedPreset
      };
    } else {
      // 普通平台：转换内容格式
      const targetFormat = currentPlatform?.id === 'zhihu' ? 'zhihu' : 'wechat';

      const convertedContent = await this.convertArticleFormat(
        articleDetail.content,
        targetFormat,
        articleDetail.style
      );

      return {
        title: articleDetail.title,
        content: convertedContent,
        style: articleDetail.style,
        preset: selectedPreset
      };
    }
  }

  // 获取文章详情
  async fetchArticleDetail(articleId) {
    const response = await ZiliuApiService.articles.get(articleId);

    if (!response.success) {
      throw new Error(response.error || '获取文章失败');
    }

    return response.data;
  }

  // 转换文章格式
  async convertArticleFormat(content, targetFormat, style) {
    const response = await ZiliuApiService.convert({
      content: content,
      targetFormat: targetFormat,
      style: style || 'default'
    });

    if (!response.success) {
      throw new Error(response.error || '内容转换失败');
    }

    return response.data.html;
  }

  // 获取视频内容
  async getVideoContent(articleId, platform) {
    const response = await ZiliuApiService.video.get(articleId, platform);

    if (!response.success) {
      throw new Error(response.error || '获取视频内容失败');
    }

    return response.data;
  }
}
```

### 6.3 订阅权限服务

位置：`core/subscription-service.js`

```javascript
class SubscriptionService {
  constructor() {
    this.userInfo = null;
    this.updateCallbacks = [];
  }

  // 获取用户信息
  async getUserInfo(forceRefresh = false) {
    if (!forceRefresh && this.userInfo) {
      return this.userInfo;
    }

    try {
      const response = await ZiliuApiService.user.getInfo();

      if (response.success) {
        this.userInfo = response.data;
        this.notifyUpdate();
        return this.userInfo;
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }

    return null;
  }

  // 检查平台权限
  async checkPlatformAccess(platformId) {
    const userInfo = await this.getUserInfo();

    if (!userInfo) {
      return {
        hasAccess: false,
        reason: 'not_logged_in',
        message: '请先登录'
      };
    }

    // Pro 用户拥有所有权限
    if (userInfo.subscriptionPlan === 'pro') {
      return {
        hasAccess: true,
        plan: 'pro'
      };
    }

    // 免费用户权限限制
    const freePlatforms = ['wechat', 'zhihu'];
    if (freePlatforms.includes(platformId)) {
      return {
        hasAccess: true,
        plan: 'free'
      };
    }

    return {
      hasAccess: false,
      reason: 'subscription_required',
      message: '该平台需要 Pro 订阅'
    };
  }

  // 订阅更新通知
  onUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  notifyUpdate() {
    this.updateCallbacks.forEach(cb => cb(this.userInfo));
  }
}
```

---

## 七、错误处理机制

### 7.1 分层错误处理

#### API 层

```javascript
// background.js
async function handleApiRequest(requestData) {
  const { method, endpoint, body, headers } = requestData;
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined
    });

    // HTTP 错误
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    // 网络错误
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('无法连接到服务器，请检查网络连接');
    }

    // 超时错误
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试');
    }

    // 其他错误
    throw error;
  }
}
```

#### 平台插件层

```javascript
// base-platform.js
async fillContent(data) {
  try {
    // 1. 验证编辑器
    const elements = this.findEditorElements(false);
    if (!elements.isEditor) {
      throw new Error(`当前页面不是 ${this.displayName} 编辑器`);
    }

    // 2. 执行填充
    const results = await this.doFill(elements, data);

    // 3. 发送成功事件
    ZiliuEventBus.emit('platform:fillComplete', {
      platform: this.id,
      results: results
    });

    return results;

  } catch (error) {
    // 记录错误
    console.error(`❌ ${this.displayName} 填充失败:`, error);

    // 发送错误事件
    ZiliuEventBus.emit('platform:error', {
      platform: this.id,
      error: error
    });

    // 重新抛出（让上层处理）
    throw error;
  }
}
```

#### UI 层

```javascript
// ui/features.js
async fillArticle(articleId, buttonElement) {
  const originalText = buttonElement.textContent;

  try {
    // 更新按钮状态
    buttonElement.textContent = '填充中...';
    buttonElement.disabled = true;

    // 执行填充
    const result = await window.ZiliuApp.handleFillContent({ articleId });

    if (result.success) {
      // 成功
      buttonElement.textContent = '✓ 已填充';
      this.showToast('文章已成功填充到编辑器', 'success');

      // 3秒后恢复
      setTimeout(() => {
        buttonElement.textContent = originalText;
        buttonElement.disabled = false;
      }, 3000);
    } else {
      throw new Error(result.error || '填充失败');
    }

  } catch (error) {
    // 失败
    buttonElement.textContent = '✗ 填充失败';
    buttonElement.disabled = false;

    this.showToast(`填充失败: ${error.message}`, 'error');

    // 3秒后恢复
    setTimeout(() => {
      buttonElement.textContent = originalText;
    }, 3000);
  }
}

// Toast 提示
showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `ziliu-toast ziliu-toast-${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  // 动画显示
  setTimeout(() => toast.classList.add('show'), 10);

  // 3秒后移除
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

### 7.2 重试机制

```javascript
// 通用重试函数（指数退避）
async function retryWithBackoff(fn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry = null
  } = options;

  let lastError = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();

    } catch (error) {
      lastError = error;

      // 最后一次尝试，不再重试
      if (attempt === maxAttempts - 1) {
        break;
      }

      // 计算延迟
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * baseDelay;
      const delay = Math.min(exponentialDelay + jitter, maxDelay);

      // 回调
      if (onRetry) {
        onRetry(attempt + 1, maxAttempts, delay, error);
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// 使用示例
async function uploadImage(imageUrl) {
  return retryWithBackoff(
    async () => {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ url: imageUrl })
      });

      if (!response.ok) throw new Error('上传失败');

      return await response.json();
    },
    {
      maxAttempts: 3,
      baseDelay: 1000,
      onRetry: (attempt, total, delay, error) => {
        console.log(`⚠️ 上传失败，${delay}ms 后进行第 ${attempt}/${total} 次重试`);
      }
    }
  );
}
```

---

## 八、总结

### 8.1 架构优势

1. **高度模块化**
   - 核心、插件、UI 分层清晰
   - 每个模块职责单一
   - 便于测试和维护

2. **配置驱动**
   - 新增平台只需添加配置
   - 无需修改核心代码
   - 降低开发成本

3. **可扩展性强**
   - 基于基类 + 配置的插件系统
   - 支持自定义平台插件
   - 灵活的钩子机制

4. **容错性好**
   - 多层错误处理
   - 重试机制（指数退避）
   - 友好的错误提示

5. **性能优化**
   - 请求缓存
   - 元素查找缓存
   - 队列管理
   - 并发控制

### 8.2 关键技术点

1. **Chrome Extension Manifest V3**
   - Service Worker 后台处理
   - Content Scripts 页面注入
   - 声明式权限管理

2. **通信机制**
   - `window.postMessage`（网站 ↔ 插件）
   - `chrome.runtime.sendMessage`（Content ↔ Background）
   - `chrome.tabs.sendMessage`（Background ↔ Content）
   - EventBus（组件内通信）

3. **设计模式**
   - 发布订阅模式（EventBus）
   - 策略模式（不同平台不同策略）
   - 工厂模式（动态创建平台实例）
   - 注册中心模式（平台注册与发现）

4. **DOM 操作**
   - 智能选择器（多层回退）
   - 编辑器检测与验证
   - 事件触发与监听
   - 兼容不同编辑器类型

5. **风控与限流**
   - 并发控制
   - 请求队列
   - 指数退避重试
   - 频率限制

### 8.3 文件清单

| 文件路径 | 代码行数 | 主要功能 |
|---------|---------|---------|
| `manifest.json` | - | Chrome 扩展配置 |
| `background.js` | 471 | 后台脚本，处理标签页和 API 请求 |
| `main.js` | 407 | 主入口，初始化应用 |
| `website-detector.js` | - | 网站端检测和通信 |
| `core/app.js` | 590 | 应用核心控制器 |
| `core/event-bus.js` | 73 | 事件总线（发布订阅） |
| `core/api-service.js` | 331 | API 调用服务 |
| `core/content-service.js` | 203 | 内容处理服务 |
| `core/platform-manager.js` | 263 | 平台管理服务 |
| `plugins/config.js` | 390 | 平台配置（配置驱动核心） |
| `plugins/base-platform.js` | 460 | 基础平台插件类 |
| `plugins/platforms/wechat.js` | 1491 | 微信公众号插件（最复杂） |
| `plugins/platforms/zhihu.js` | 453 | 知乎插件 |
| `ui/panel.js` | 382 | 侧边面板 UI |
| `ui/features.js` | 824 | 功能管理器 UI |

**总代码量**：约 6000+ 行

### 8.4 核心价值

**述而作助手插件**实现了：

1. **真正的一键发布**
   - 用户在网站点击按钮
   - 自动打开/切换到平台编辑器
   - 自动填充所有内容
   - 无需手动复制粘贴

2. **智能内容处理**
   - 自动格式转换（Markdown → HTML）
   - 自动应用预设（页眉、页脚）
   - 自动图片上传（外链 → CDN）
   - 支持特殊语法扩展

3. **多平台支持**
   - 8+ 个中文内容平台
   - 统一的操作体验
   - 平台特定优化

4. **企业级质量**
   - 完善的错误处理
   - 智能重试机制
   - 性能优化
   - 安全可靠

这是一个**设计精良、架构清晰、功能完善**的现代化浏览器扩展程序！

---

**文档版本**：1.0
**最后更新**：2024-12-14
**维护者**：述而作开发团队
