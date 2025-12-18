# 述而作插件扩展指南 - 如何添加国外平台支持

## 目录
- [一、为什么当前架构适合扩展](#一为什么当前架构适合扩展)
- [二、添加新平台的步骤](#二添加新平台的步骤)
- [三、国外平台示例](#三国外平台示例)
- [四、高级功能实现](#四高级功能实现)
- [五、测试与调试](#五测试与调试)
- [六、常见问题解决](#六常见问题解决)

---

## 一、为什么当前架构适合扩展

### 1.1 配置驱动架构

当前插件采用**配置驱动**的设计，新增平台只需要：
1. 在 `plugins/config.js` 添加平台配置
2. （可选）创建平台特定的插件类
3. 更新 `manifest.json` 的 `content_scripts`

**无需修改核心代码**，极大降低了扩展成本。

### 1.2 已有的国外平台支持基础

虽然目前主要支持中文平台，但架构已经具备支持任意平台的能力：

```javascript
// plugins/config.js 的核心结构
window.ZiliuPluginConfig = {
  platforms: [
    {
      id: 'platform_id',           // 平台唯一标识
      displayName: '平台名称',      // 显示名称
      urlPatterns: ['...'],        // URL 匹配模式（支持通配符）
      selectors: {...},            // DOM 选择器
      contentType: 'html|markdown', // 内容类型
      features: [...],             // 支持的功能
      specialHandling: {...}       // 特殊处理配置
    }
  ]
};
```

### 1.3 模块化插件系统

```
BasePlatformPlugin (基础类)
  ↓
  ├─ 通用功能（查找元素、填充内容、错误处理）
  ↓
子类继承并重写特定方法
  ├─ WeChatPlatform（微信特有逻辑）
  ├─ ZhihuPlatform（知乎特有逻辑）
  └─ MediumPlatform（新增：Medium 特有逻辑）
```

---

## 二、添加新平台的步骤

### 步骤 1：调研平台编辑器

在添加平台前，需要调研：

1. **编辑器类型**
   - 纯文本输入框
   - ContentEditable 编辑器
   - 富文本编辑器（Quill、ProseMirror、Draft.js 等）
   - Markdown 编辑器（CodeMirror、Monaco 等）

2. **DOM 结构**
   - 标题输入框的选择器
   - 内容编辑器的选择器
   - 其他字段（标签、摘要、封面等）

3. **内容格式**
   - 支持 HTML 还是 Markdown
   - 是否需要转换
   - 特殊格式要求

4. **限制与风控**
   - 字数限制
   - 提交频率限制
   - 反爬虫机制

### 步骤 2：添加平台配置

在 `plugin/plugins/config.js` 的 `platforms` 数组中添加：

```javascript
{
  id: 'medium',                    // 平台ID（唯一，用于代码识别）
  name: 'Medium平台插件',          // 插件名称
  displayName: 'Medium',           // 显示名称（用户可见）
  enabled: true,                   // 是否启用

  // URL 匹配模式（支持通配符 *）
  urlPatterns: [
    'https://medium.com/new-story*',
    'https://medium.com/p/*/edit*'
  ],

  // 编辑器页面 URL（用于"打开编辑器"功能）
  editorUrl: 'https://medium.com/new-story',

  // DOM 选择器配置
  selectors: {
    title: 'h3[data-default-value="Title"], input[placeholder*="Title"]',
    content: '.graf--first, [contenteditable="true"]',
    tags: 'input[placeholder*="tags"]'
  },

  // 支持的功能
  features: ['title', 'content', 'richText', 'tags'],

  // 内容类型：'html' | 'markdown' | 'text'
  contentType: 'html',

  // 特殊处理配置
  specialHandling: {
    initDelay: 1500,              // 初始化延迟（毫秒）
    waitForEditor: true,          // 是否等待编辑器加载
    maxWaitTime: 10000,           // 最大等待时间
    retryOnFail: true,            // 失败时重试
    retryDelay: 2000,             // 重试延迟

    // 按钮配置
    buttonConfig: {
      fillButton: {
        text: '✍️ Fill to Medium',
        tooltip: 'Fill article to Medium editor'
      },
      copyButton: {
        text: '📋 Copy Content',
        tooltip: 'Copy article content'
      }
    }
  },

  // 优先级（多个平台匹配时使用）
  priority: 8,

  // 是否需要订阅（可选）
  requiredPlan: 'pro',            // 'free' | 'pro'
  featureId: 'medium-platform'
}
```

### 步骤 3：更新 Manifest.json

在 `plugin/manifest.json` 的 `content_scripts` 中添加：

```json
{
  "matches": [
    "https://medium.com/new-story*",
    "https://medium.com/p/*/edit*"
  ],
  "js": [
    "core/event-bus.js",
    "core/api-service.js",
    "core/content-service.js",
    "plugins/config.js",
    "plugins/base-platform.js",
    "plugins/platforms/medium.js",  // 如果有自定义插件类
    "main.js"
  ],
  "css": ["ui/panel.css"],
  "run_at": "document_end"
}
```

### 步骤 4：（可选）创建平台特定插件类

如果平台有特殊逻辑，创建 `plugin/plugins/platforms/medium.js`：

```javascript
/**
 * Medium 平台插件
 */
class MediumPlatform extends BasePlatformPlugin {
  constructor(config) {
    super(config);
  }

  /**
   * 重写：查找编辑器元素
   */
  _findElements() {
    // Medium 的编辑器结构特殊，需要自定义查找逻辑
    const titleElement = this.findMediumTitle();
    const contentElement = this.findMediumContent();

    return {
      elements: {
        title: titleElement,
        content: contentElement
      },
      isEditor: !!(titleElement || contentElement)
    };
  }

  /**
   * 查找 Medium 的标题元素
   */
  findMediumTitle() {
    // Medium 的标题可能是 h3 或 input
    const titleSelectors = [
      'h3[data-default-value="Title"]',
      'input[placeholder*="Title"]',
      '.graf--title'
    ];

    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && this.isElementVisible(element)) {
        return element;
      }
    }

    return null;
  }

  /**
   * 查找 Medium 的内容编辑器
   */
  findMediumContent() {
    // Medium 使用 contenteditable 的 div
    const contentSelectors = [
      '.graf--first',
      '[contenteditable="true"]:not([data-default-value="Title"])',
      '.section-content'
    ];

    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element && this.isElementVisible(element)) {
        return element;
      }
    }

    return null;
  }

  /**
   * 重写：填充标题
   */
  async fillTitle(element, title) {
    // Medium 的标题可能是 h3 或 input
    if (element.tagName === 'H3') {
      element.focus();
      element.textContent = title;
    } else {
      element.focus();
      element.value = title;
    }

    // 触发事件
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    return { success: true };
  }

  /**
   * 重写：填充内容
   */
  async fillContentEditor(contentElement, content, data) {
    // Medium 使用 contenteditable
    contentElement.focus();

    // 清空内容
    contentElement.innerHTML = '';

    // 插入新内容
    contentElement.innerHTML = content;

    // 触发 Medium 的更新事件
    contentElement.dispatchEvent(new Event('input', { bubbles: true }));

    // Medium 可能需要额外的事件来触发保存
    await this.triggerMediumSave(contentElement);

    return { success: true };
  }

  /**
   * 触发 Medium 的自动保存
   */
  async triggerMediumSave(element) {
    // 模拟用户操作触发保存
    const events = ['input', 'blur', 'change'];

    for (const eventType of events) {
      const event = new Event(eventType, { bubbles: true });
      element.dispatchEvent(event);
      await this.delay(100);
    }
  }

  /**
   * 辅助方法：延迟
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 注册到全局
window.MediumPlatform = MediumPlatform;
```

### 步骤 5：更新平台管理器

在 `core/platform-manager.js` 中注册新平台：

```javascript
// 获取平台类（工厂模式）
getPlatformClass(platformId) {
  const classMap = {
    'wechat': WeChatPlatform,
    'zhihu': ZhihuPlatform,
    'juejin': JuejinPlatform,
    'medium': MediumPlatform,    // 新增
    // ... 其他平台
  };

  return classMap[platformId] || BasePlatformPlugin;
}
```

---

## 三、国外平台示例

### 3.1 Medium 平台（已在步骤中详细说明）

**特点**：
- ContentEditable 编辑器
- 支持富文本
- 简洁的编辑器结构

### 3.2 Dev.to 平台

```javascript
// 添加到 plugins/config.js
{
  id: 'devto',
  displayName: 'Dev.to',
  enabled: true,
  urlPatterns: [
    'https://dev.to/new*',
    'https://dev.to/*/edit*'
  ],
  editorUrl: 'https://dev.to/new',
  selectors: {
    title: 'input#article-form-title',
    content: '.CodeMirror',
    tags: 'input[placeholder*="tags"]',
    coverImage: 'input#cover-image-input'
  },
  features: ['title', 'content', 'markdown', 'tags', 'coverImage'],
  contentType: 'markdown',
  specialHandling: {
    initDelay: 1000,
    buttonConfig: {
      fillButton: {
        text: '💻 Fill to Dev.to',
        tooltip: 'Fill article to Dev.to editor'
      },
      copyButton: {
        text: '📋 Copy Markdown',
        tooltip: 'Copy article as Markdown'
      }
    }
  },
  priority: 8
}
```

**自定义插件类** (`plugins/platforms/devto.js`)：

```javascript
class DevToPlatform extends BasePlatformPlugin {
  constructor(config) {
    super(config);
  }

  /**
   * Dev.to 使用 CodeMirror 编辑器
   */
  async fillContentEditor(contentElement, content, data) {
    // 查找 CodeMirror 实例
    const codeMirror = contentElement.CodeMirror;

    if (codeMirror) {
      // 使用 CodeMirror API
      codeMirror.setValue(content);
      codeMirror.focus();
      return { success: true };
    } else {
      // 降级到 DOM 操作
      const textarea = contentElement.querySelector('textarea');
      if (textarea) {
        textarea.value = content;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        return { success: true };
      }
    }

    throw new Error('找不到 Dev.to 编辑器');
  }

  /**
   * 填充标签
   */
  async fillTags(tagInput, tags) {
    if (!Array.isArray(tags)) {
      tags = tags.split(',').map(t => t.trim());
    }

    tagInput.focus();
    tagInput.value = tags.join(', ');
    tagInput.dispatchEvent(new Event('input', { bubbles: true }));

    return { success: true };
  }
}

window.DevToPlatform = DevToPlatform;
```

### 3.3 Hashnode 平台

```javascript
{
  id: 'hashnode',
  displayName: 'Hashnode',
  enabled: true,
  urlPatterns: [
    'https://hashnode.com/create-story*',
    'https://*.hashnode.dev/draft/*'
  ],
  editorUrl: 'https://hashnode.com/create-story',
  selectors: {
    title: 'textarea[placeholder*="Article Title"]',
    content: '.ProseMirror',
    tags: 'input[placeholder*="tags"]',
    coverImage: 'input[type="file"][accept*="image"]'
  },
  features: ['title', 'content', 'markdown', 'tags', 'coverImage'],
  contentType: 'markdown',
  specialHandling: {
    initDelay: 2000,
    waitForEditor: true,
    maxWaitTime: 15000,
    buttonConfig: {
      fillButton: {
        text: '📝 Fill to Hashnode',
        tooltip: 'Fill article to Hashnode editor'
      },
      copyButton: {
        text: '📋 Copy Markdown',
        tooltip: 'Copy article as Markdown'
      }
    }
  },
  priority: 8
}
```

### 3.4 Substack 平台

```javascript
{
  id: 'substack',
  displayName: 'Substack',
  enabled: true,
  urlPatterns: [
    'https://*.substack.com/publish/post/*'
  ],
  editorUrl: 'https://substack.com/publish',
  selectors: {
    title: 'textarea[placeholder*="Post title"]',
    subtitle: 'textarea[placeholder*="Subtitle"]',
    content: '.ProseMirror, [contenteditable="true"]'
  },
  features: ['title', 'subtitle', 'content', 'richText'],
  contentType: 'html',
  specialHandling: {
    initDelay: 2000,
    waitForEditor: true,
    buttonConfig: {
      fillButton: {
        text: '📧 Fill to Substack',
        tooltip: 'Fill newsletter to Substack editor'
      },
      copyButton: {
        text: '📋 Copy Content',
        tooltip: 'Copy newsletter content'
      }
    }
  },
  priority: 7
}
```

### 3.5 WordPress 平台

```javascript
{
  id: 'wordpress',
  displayName: 'WordPress',
  enabled: true,
  urlPatterns: [
    'https://wordpress.com/post/*',
    'https://wordpress.com/page/*',
    'https://*/wp-admin/post-new.php*',
    'https://*/wp-admin/post.php*'
  ],
  editorUrl: 'https://wordpress.com/post',
  selectors: {
    // Gutenberg 编辑器
    title: '.editor-post-title__input, textarea[placeholder*="Add title"]',
    content: '.block-editor-writing-flow, .editor-styles-wrapper',

    // 经典编辑器
    titleClassic: '#title',
    contentClassic: '#content, #tinymce'
  },
  features: ['title', 'content', 'richText', 'gutenberg'],
  contentType: 'html',
  specialHandling: {
    initDelay: 2000,
    waitForEditor: true,
    maxWaitTime: 10000,
    supportGutenberg: true,      // 支持 Gutenberg 编辑器
    supportClassic: true,         // 支持经典编辑器
    buttonConfig: {
      fillButton: {
        text: 'WP Fill to WordPress',
        tooltip: 'Fill article to WordPress editor (Gutenberg/Classic)'
      },
      copyButton: {
        text: '📋 Copy HTML',
        tooltip: 'Copy article as HTML'
      }
    }
  },
  priority: 9
}
```

**WordPress 自定义插件** (`plugins/platforms/wordpress.js`)：

```javascript
class WordPressPlatform extends BasePlatformPlugin {
  constructor(config) {
    super(config);
    this.editorType = null; // 'gutenberg' | 'classic'
  }

  /**
   * 检测 WordPress 编辑器类型
   */
  detectEditorType() {
    // 检测 Gutenberg
    if (document.querySelector('.block-editor-writing-flow')) {
      return 'gutenberg';
    }

    // 检测经典编辑器
    if (document.querySelector('#tinymce')) {
      return 'classic';
    }

    return null;
  }

  /**
   * 查找编辑器元素
   */
  _findElements() {
    this.editorType = this.detectEditorType();

    if (this.editorType === 'gutenberg') {
      return this.findGutenbergElements();
    } else if (this.editorType === 'classic') {
      return this.findClassicElements();
    }

    return { elements: {}, isEditor: false };
  }

  /**
   * 查找 Gutenberg 编辑器元素
   */
  findGutenbergElements() {
    return {
      elements: {
        title: document.querySelector('.editor-post-title__input'),
        content: document.querySelector('.block-editor-writing-flow')
      },
      isEditor: true
    };
  }

  /**
   * 查找经典编辑器元素
   */
  findClassicElements() {
    return {
      elements: {
        title: document.querySelector('#title'),
        content: document.querySelector('#tinymce') || document.querySelector('#content')
      },
      isEditor: true
    };
  }

  /**
   * 填充内容（根据编辑器类型）
   */
  async fillContentEditor(contentElement, content, data) {
    if (this.editorType === 'gutenberg') {
      return await this.fillGutenberg(content);
    } else if (this.editorType === 'classic') {
      return await this.fillClassic(contentElement, content);
    }

    throw new Error('无法识别 WordPress 编辑器类型');
  }

  /**
   * 填充 Gutenberg 编辑器
   */
  async fillGutenberg(content) {
    // Gutenberg 使用块编辑器，需要转换 HTML 为块
    // 这里使用 WordPress 的全局 API
    if (window.wp && window.wp.blocks) {
      const blocks = window.wp.blocks.parse(content);
      window.wp.data.dispatch('core/block-editor').resetBlocks(blocks);
      return { success: true };
    }

    // 降级：直接插入 HTML
    const editor = document.querySelector('.block-editor-writing-flow');
    if (editor) {
      editor.innerHTML = content;
      return { success: true };
    }

    throw new Error('无法填充 Gutenberg 编辑器');
  }

  /**
   * 填充经典编辑器
   */
  async fillClassic(contentElement, content) {
    // 经典编辑器使用 TinyMCE
    if (window.tinyMCE) {
      const editor = window.tinyMCE.get('content');
      if (editor) {
        editor.setContent(content);
        return { success: true };
      }
    }

    // 降级：直接操作 textarea
    contentElement.value = content;
    contentElement.dispatchEvent(new Event('input', { bubbles: true }));
    return { success: true };
  }
}

window.WordPressPlatform = WordPressPlatform;
```

---

## 四、高级功能实现

### 4.1 内容格式转换

某些平台可能需要特殊的内容格式转换。

**示例：将 HTML 转换为 Medium 的特殊格式**

```javascript
class MediumPlatform extends BasePlatformPlugin {
  /**
   * 在填充前预处理内容
   */
  async preprocessContent(content, data) {
    // 1. 转换代码块
    content = this.convertCodeBlocks(content);

    // 2. 转换图片
    content = await this.convertImages(content);

    // 3. 转换列表
    content = this.convertLists(content);

    return content;
  }

  /**
   * 转换代码块为 Medium 格式
   */
  convertCodeBlocks(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const codeBlocks = doc.querySelectorAll('pre code');

    codeBlocks.forEach(block => {
      const language = this.detectLanguage(block);
      const code = block.textContent;

      // Medium 的代码块格式
      const mediumCodeBlock = `<pre><code class="language-${language}">${code}</code></pre>`;
      block.parentElement.outerHTML = mediumCodeBlock;
    });

    return doc.body.innerHTML;
  }

  /**
   * 检测代码语言
   */
  detectLanguage(codeElement) {
    const classes = codeElement.className.split(' ');
    for (const cls of classes) {
      if (cls.startsWith('language-')) {
        return cls.replace('language-', '');
      }
    }
    return 'javascript'; // 默认语言
  }
}
```

### 4.2 图片上传处理

某些平台不支持外链图片，需要上传到平台 CDN。

**示例：上传图片到 Medium**

```javascript
class MediumPlatform extends BasePlatformPlugin {
  /**
   * 转换外链图片
   */
  async convertImages(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = doc.querySelectorAll('img');

    const uploadPromises = Array.from(images).map(async (img) => {
      const src = img.getAttribute('src');

      // 跳过已经是 Medium CDN 的图片
      if (src.includes('cdn-images-1.medium.com')) {
        return;
      }

      try {
        // 上传图片到 Medium
        const mediumUrl = await this.uploadImageToMedium(src);
        img.setAttribute('src', mediumUrl);
      } catch (error) {
        console.error('图片上传失败:', error);
        // 保留原始链接
      }
    });

    await Promise.all(uploadPromises);
    return doc.body.innerHTML;
  }

  /**
   * 上传图片到 Medium CDN
   */
  async uploadImageToMedium(imageUrl) {
    // 通过后端 API 上传
    const response = await ZiliuApiService.uploadImage({
      imageUrl: imageUrl,
      platform: 'medium'
    });

    if (response.success && response.cdnUrl) {
      return response.cdnUrl;
    }

    throw new Error('图片上传失败');
  }
}
```

### 4.3 标签智能匹配

某些平台（如 B 站、小红书）有推荐标签，可以智能匹配。

**示例：B 站标签匹配**

```javascript
class BilibiliPlatform extends BasePlatformPlugin {
  /**
   * 填充标签（智能匹配推荐标签）
   */
  async fillTags(tagInput, tags, data) {
    if (!Array.isArray(tags)) {
      tags = tags.split(',').map(t => t.trim());
    }

    // 获取 B 站推荐标签
    const recommendTags = this.getRecommendTags();

    // 智能匹配
    const matchedTags = this.matchTags(tags, recommendTags);

    // 填充标签
    for (const tag of matchedTags) {
      await this.addTag(tag);
      await this.delay(300); // 避免触发风控
    }

    return { success: true, matchedTags };
  }

  /**
   * 获取 B 站推荐标签
   */
  getRecommendTags() {
    const tagElements = document.querySelectorAll('.hot-tag-container .tag-item');
    return Array.from(tagElements).map(el => el.textContent.trim());
  }

  /**
   * 智能匹配标签
   */
  matchTags(userTags, recommendTags) {
    const matched = [];

    for (const userTag of userTags) {
      // 精确匹配
      if (recommendTags.includes(userTag)) {
        matched.push(userTag);
        continue;
      }

      // 模糊匹配
      const fuzzyMatch = recommendTags.find(recTag =>
        recTag.includes(userTag) || userTag.includes(recTag)
      );

      if (fuzzyMatch) {
        matched.push(fuzzyMatch);
      } else {
        // 无匹配，使用原标签
        matched.push(userTag);
      }
    }

    return matched.slice(0, 10); // 最多 10 个标签
  }

  /**
   * 添加单个标签
   */
  async addTag(tag) {
    const tagInput = document.querySelector('input[placeholder*="按回车键Enter创建标签"]');

    if (!tagInput) {
      throw new Error('找不到标签输入框');
    }

    // 检查是否为推荐标签
    const recommendTag = document.querySelector(`.hot-tag-container .tag-item:contains("${tag}")`);

    if (recommendTag) {
      // 点击推荐标签
      recommendTag.click();
    } else {
      // 手动输入标签
      tagInput.value = tag;
      tagInput.dispatchEvent(new Event('input', { bubbles: true }));

      // 模拟回车键
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        bubbles: true
      });
      tagInput.dispatchEvent(enterEvent);
    }
  }
}
```

### 4.4 多语言支持

为国外平台添加多语言支持。

**示例：国际化配置**

```javascript
// 在 config.js 中添加
i18n: {
  'zh-CN': {
    fillButton: '填充',
    copyButton: '复制',
    success: '填充成功',
    error: '填充失败'
  },
  'en-US': {
    fillButton: 'Fill',
    copyButton: 'Copy',
    success: 'Fill successful',
    error: 'Fill failed'
  }
}

// 在插件中使用
getButtonText(key) {
  const lang = navigator.language || 'en-US';
  const i18n = this.config.i18n || {};
  const translations = i18n[lang] || i18n['en-US'] || {};
  return translations[key] || key;
}
```

---

## 五、测试与调试

### 5.1 开发环境设置

1. **加载未打包的扩展**
   ```
   1. 打开 Chrome 扩展管理页面：chrome://extensions/
   2. 开启"开发者模式"
   3. 点击"加载已解压的扩展程序"
   4. 选择 plugin 文件夹
   ```

2. **启用调试模式**
   ```javascript
   // 在 config.js 中
   settings: {
     debug: true  // 启用调试日志
   }
   ```

### 5.2 调试技巧

**1. 查看控制台日志**
```javascript
// 在平台插件中添加日志
console.log('🔍 [Medium] 查找编辑器元素');
console.log('📝 [Medium] 填充标题:', title);
console.log('✅ [Medium] 填充成功');
```

**2. 使用 Chrome DevTools**
```javascript
// 在代码中设置断点
debugger;

// 检查元素
console.log('元素:', element);
console.log('是否可见:', this.isElementVisible(element));
```

**3. 模拟事件**
```javascript
// 测试填充功能
async function testFill() {
  const platform = window.ZiliuApp.platformManager.getCurrentPlatform();
  const result = await platform.fillContent({
    title: '测试标题',
    content: '<p>测试内容</p>'
  });
  console.log('填充结果:', result);
}
testFill();
```

**4. 检查 DOM 选择器**
```javascript
// 在控制台测试选择器
document.querySelector('.ProseMirror');
document.querySelectorAll('input[placeholder*="Title"]');
```

### 5.3 常见问题排查

| 问题 | 可能原因 | 解决方法 |
|------|---------|---------|
| 找不到编辑器元素 | 选择器错误 | 使用 DevTools 检查 DOM 结构 |
| 填充后内容消失 | 未触发事件 | 添加 input、change 事件 |
| 平台未检测到 | URL 模式不匹配 | 检查 urlPatterns 配置 |
| 内容格式错误 | contentType 设置错误 | 确认平台支持的格式 |
| 扩展未注入 | manifest.json 未更新 | 重新加载扩展 |

---

## 六、常见问题解决

### 6.1 编辑器检测失败

**问题**：进入编辑器页面后，插件没有检测到编辑器。

**解决方案**：

```javascript
// 使用等待机制
async waitForEditor(maxWaitTime = 10000) {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const checkEditor = () => {
      const elements = this._findElements();

      if (elements.isEditor) {
        console.log('✅ 编辑器已就绪');
        resolve(elements);
        return;
      }

      if (Date.now() - startTime >= maxWaitTime) {
        console.warn('⚠️ 等待编辑器超时');
        resolve(elements);
        return;
      }

      setTimeout(checkEditor, 500);
    };

    checkEditor();
  });
}
```

### 6.2 内容填充后自动清除

**问题**：填充内容后，编辑器自动清空。

**原因**：编辑器框架（如 React、Vue）重新渲染导致。

**解决方案**：

```javascript
// 使用编辑器的 API 而非直接 DOM 操作
async fillContentEditor(contentElement, content, data) {
  // 查找编辑器实例
  const editorInstance = this.findEditorInstance(contentElement);

  if (editorInstance) {
    // 使用编辑器 API
    editorInstance.setContent(content);
  } else {
    // 降级到 DOM 操作
    contentElement.innerHTML = content;

    // 触发多个事件确保更新
    const events = ['input', 'change', 'blur'];
    for (const eventType of events) {
      contentElement.dispatchEvent(new Event(eventType, { bubbles: true }));
      await this.delay(100);
    }
  }

  return { success: true };
}
```

### 6.3 跨域问题

**问题**：调用平台 API 时出现跨域错误。

**解决方案**：

1. **在 manifest.json 中添加权限**
```json
{
  "host_permissions": [
    "https://medium.com/*",
    "https://api.medium.com/*"
  ]
}
```

2. **通过 Background Script 代理请求**
```javascript
// Content Script 发送消息
chrome.runtime.sendMessage({
  action: 'apiRequest',
  data: {
    url: 'https://api.medium.com/v1/upload',
    method: 'POST',
    body: { ... }
  }
}, (response) => {
  console.log('响应:', response);
});

// Background Script 处理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'apiRequest') {
    fetch(message.data.url, {
      method: message.data.method,
      body: JSON.stringify(message.data.body)
    })
      .then(res => res.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});
```

### 6.4 性能优化

**问题**：填充大量内容时卡顿。

**解决方案**：

```javascript
// 分批处理内容
async fillLargeContent(contentElement, content) {
  const chunks = this.splitContent(content, 1000); // 每 1000 字符一批

  for (let i = 0; i < chunks.length; i++) {
    await this.fillChunk(contentElement, chunks[i]);

    // 让出主线程
    await this.delay(50);

    // 更新进度
    ZiliuEventBus.emit('fill:progress', {
      current: i + 1,
      total: chunks.length
    });
  }

  return { success: true };
}

// 分割内容
splitContent(content, chunkSize) {
  const chunks = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }
  return chunks;
}
```

---

## 七、总结

### 7.1 扩展能力总结

当前架构**完全支持**扩展到国外平台，具备以下优势：

✅ **配置驱动**：新增平台只需添加配置
✅ **模块化**：可选择性创建自定义插件类
✅ **灵活性**：支持各种编辑器类型和内容格式
✅ **可扩展**：易于添加新功能（标签匹配、图片上传等）
✅ **易维护**：核心代码无需修改

### 7.2 推荐的国外平台

| 平台 | 难度 | 推荐理由 |
|------|------|---------|
| Medium | ⭐⭐ | 编辑器简单，用户群大 |
| Dev.to | ⭐⭐ | Markdown 编辑器，技术受众 |
| Hashnode | ⭐⭐⭐ | 功能丰富，开发者友好 |
| Substack | ⭐⭐ | Newsletter 平台，适合长文 |
| WordPress | ⭐⭐⭐⭐ | 需要支持两种编辑器，但市场份额大 |

### 7.3 开发检查清单

在添加新平台前，确认以下事项：

- [ ] 调研平台编辑器类型和 DOM 结构
- [ ] 在 `config.js` 中添加平台配置
- [ ] 更新 `manifest.json` 的 content_scripts
- [ ] （如需）创建自定义平台插件类
- [ ] 测试填充功能是否正常
- [ ] 测试复制功能是否正常
- [ ] 处理边缘情况（编辑器未加载、网络错误等）
- [ ] 添加错误提示和用户反馈
- [ ] 性能测试（大量内容填充）
- [ ] 多浏览器测试（Chrome、Edge 等）

### 7.4 后续优化建议

1. **AI 内容优化**
   - 根据平台特点自动调整内容风格
   - 智能生成平台特定的标题、标签

2. **批量发布**
   - 一次发布到多个平台
   - 发布队列管理

3. **发布记录**
   - 记录发布历史
   - 同步发布状态

4. **模板系统**
   - 平台特定的内容模板
   - 预设管理

通过这套架构，您可以轻松扩展到任何国外平台，无论是技术博客（Dev.to、Hashnode）、Newsletter（Substack）、还是通用博客平台（Medium、WordPress）！

---

**文档版本**：1.0
**最后更新**：2024-12-14
**维护者**：述而作开发团队
