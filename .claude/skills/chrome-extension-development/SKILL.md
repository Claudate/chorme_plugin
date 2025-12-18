# Chrome 扩展开发指南

开发 Chrome 扩展以实现跨平台内容自动填充功能。

## 项目结构

```
plugin/
├── manifest.json              # 扩展配置文件
├── background.js             # Service Worker（后台脚本）
├── core/                     # 核心功能模块
│   ├── platform-detector.js # 平台检测
│   ├── content-injector.js  # 内容注入引擎
│   └── storage-manager.js   # 本地存储管理
├── plugins/                  # 平台插件系统
│   ├── config.js            # 平台配置（配置驱动）
│   └── platforms/           # 各平台实现
│       ├── wechat.js        # 微信公众号
│       ├── zhihu.js         # 知乎
│       ├── juejin.js        # 掘金
│       ├── xiaohongshu.js   # 小红书
│       ├── bilibili.js      # B站
│       └── douyin.js        # 抖音
└── ui/                       # UI 组件
    ├── popup.html           # 弹出窗口
    ├── popup.js
    └── styles.css
```

## Manifest V3 配置

### manifest.json

```json
{
  "manifest_version": 3,
  "name": "多平台内容发布助手",
  "version": "1.3.3",
  "description": "一键发布内容到微信公众号、知乎、掘金等多个平台",

  "permissions": [
    "storage",
    "activeTab",
    "clipboardWrite",
    "clipboardRead"
  ],

  "host_permissions": [
    "https://mp.weixin.qq.com/*",
    "https://creator.douyin.com/*",
    "https://zhuanlan.zhihu.com/*",
    "https://juejin.cn/*",
    "https://creator.xiaohongshu.com/*",
    "https://member.bilibili.com/*",
    "https://wx.zsxq.com/*"
  ],

  "background": {
    "service_worker": "background.js",
    "type": "module"
  },

  "content_scripts": [
    {
      "matches": ["https://mp.weixin.qq.com/*"],
      "js": ["core/content-injector.js", "plugins/platforms/wechat.js"],
      "run_at": "document_idle"
    },
    {
      "matches": ["https://zhuanlan.zhihu.com/*"],
      "js": ["core/content-injector.js", "plugins/platforms/zhihu.js"],
      "run_at": "document_idle"
    },
    {
      "matches": ["https://juejin.cn/*"],
      "js": ["core/content-injector.js", "plugins/platforms/juejin.js"],
      "run_at": "document_idle"
    }
  ],

  "action": {
    "default_popup": "ui/popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },

  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

## Service Worker（后台脚本）

### background.js

```javascript
// Service Worker 在 Manifest V3 中替代了后台页面

// 监听扩展安装
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('扩展已安装');
    // 打开欢迎页面
    chrome.tabs.create({ url: 'https://yourdomain.com/extension' });
  }
});

// 监听来自 Content Script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('收到消息:', message);

  switch (message.type) {
    case 'GET_CLIPBOARD':
      // 读取剪贴板内容
      navigator.clipboard.readText()
        .then(text => sendResponse({ content: text }))
        .catch(err => sendResponse({ error: err.message }));
      return true; // 异步响应

    case 'SAVE_CONTENT':
      // 保存内容到本地存储
      chrome.storage.local.set({
        lastContent: message.content,
        lastPlatform: message.platform,
        timestamp: Date.now()
      }, () => {
        sendResponse({ success: true });
      });
      return true;

    case 'CHECK_AUTH':
      // 检查用户认证状态
      fetch('https://api.yourdomain.com/auth/check', {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => sendResponse({ authenticated: data.authenticated }))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

// 监听 Tab 更新（检测平台切换）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // 检测是否是支持的平台
    const supportedPlatforms = [
      { pattern: /mp\.weixin\.qq\.com/, name: 'wechat' },
      { pattern: /zhuanlan\.zhihu\.com/, name: 'zhihu' },
      { pattern: /juejin\.cn/, name: 'juejin' },
    ];

    for (const platform of supportedPlatforms) {
      if (platform.pattern.test(tab.url)) {
        // 通知 Content Script 平台已检测
        chrome.tabs.sendMessage(tabId, {
          type: 'PLATFORM_DETECTED',
          platform: platform.name
        });
        break;
      }
    }
  }
});
```

## 内容注入引擎

### core/content-injector.js

```javascript
// 内容注入核心逻辑

class ContentInjector {
  constructor(platformConfig) {
    this.config = platformConfig;
    this.retryCount = 0;
    this.maxRetries = 10;
  }

  // 等待编辑器元素加载
  async waitForEditor() {
    return new Promise((resolve, reject) => {
      const check = () => {
        const editor = document.querySelector(this.config.selectors.editor);
        if (editor) {
          resolve(editor);
        } else if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          setTimeout(check, 500);
        } else {
          reject(new Error('Editor not found'));
        }
      };
      check();
    });
  }

  // 注入内容
  async inject(content) {
    try {
      const editor = await this.waitForEditor();

      // 根据编辑器类型选择注入方式
      if (this.config.editorType === 'prosemirror') {
        this.injectProseMirror(editor, content);
      } else if (this.config.editorType === 'ueditor') {
        this.injectUEditor(editor, content);
      } else if (this.config.editorType === 'contenteditable') {
        this.injectContentEditable(editor, content);
      }

      // 触发输入事件
      this.triggerInputEvent(editor);

      return { success: true };
    } catch (error) {
      console.error('注入失败:', error);
      return { success: false, error: error.message };
    }
  }

  // ProseMirror 编辑器注入
  injectProseMirror(editor, content) {
    // 获取 ProseMirror 实例
    const view = editor.__vue__?.$refs?.editor?.view ||
                 editor.__vueParentComponent?.ctx?.view;

    if (view) {
      // 使用 ProseMirror API
      const { state } = view;
      const tr = state.tr.insertText(content);
      view.dispatch(tr);
    } else {
      // 降级到 DOM 操作
      this.injectContentEditable(editor, content);
    }
  }

  // UEditor 注入
  injectUEditor(editor, content) {
    const editorInstance = UE.getEditor(editor.id);
    if (editorInstance) {
      editorInstance.setContent(content);
    }
  }

  // ContentEditable 注入
  injectContentEditable(editor, content) {
    // 清空现有内容
    editor.innerHTML = '';

    // 插入 HTML
    editor.innerHTML = content;

    // 移动光标到末尾
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(editor);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  // 触发输入事件
  triggerInputEvent(element) {
    const events = ['input', 'change', 'blur'];
    events.forEach(eventType => {
      const event = new Event(eventType, { bubbles: true });
      element.dispatchEvent(event);
    });
  }

  // 填充标题
  fillTitle(title) {
    const titleInput = document.querySelector(this.config.selectors.title);
    if (titleInput) {
      titleInput.value = title;
      this.triggerInputEvent(titleInput);
    }
  }

  // 填充摘要
  fillSummary(summary) {
    const summaryInput = document.querySelector(this.config.selectors.summary);
    if (summaryInput) {
      summaryInput.value = summary;
      this.triggerInputEvent(summaryInput);
    }
  }
}

// 导出给平台插件使用
window.ContentInjector = ContentInjector;
```

## 平台配置驱动

### plugins/config.js

```javascript
// 平台配置中心

export const platformConfigs = {
  wechat: {
    name: '微信公众号',
    urlPattern: /mp\.weixin\.qq\.com/,
    selectors: {
      editor: '#ueditor_0',
      title: '#js_title',
      author: '#js_author',
      summary: '#js_summary',
    },
    editorType: 'ueditor', // 'ueditor' | 'prosemirror' | 'contenteditable'
    supportedFormats: ['html'],
  },

  zhihu: {
    name: '知乎',
    urlPattern: /zhuanlan\.zhihu\.com/,
    selectors: {
      editor: '.ProseMirror',
      title: 'input[placeholder="请输入标题"]',
    },
    editorType: 'prosemirror',
    supportedFormats: ['html', 'markdown'],
  },

  juejin: {
    name: '掘金',
    urlPattern: /juejin\.cn/,
    selectors: {
      editor: '.CodeMirror',
      title: 'input[placeholder="输入文章标题..."]',
    },
    editorType: 'codemirror',
    supportedFormats: ['markdown'],
  },

  xiaohongshu: {
    name: '小红书',
    urlPattern: /creator\.xiaohongshu\.com/,
    selectors: {
      editor: '[contenteditable="true"]',
      title: 'input[placeholder="填写标题会有更多赞哦"]',
    },
    editorType: 'contenteditable',
    supportedFormats: ['text'],
  },
};
```

## 平台插件示例

### plugins/platforms/wechat.js

```javascript
// 微信公众号平台插件

(function() {
  'use strict';

  const platform = 'wechat';

  // 监听来自 background 的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'INJECT_CONTENT' && message.platform === platform) {
      handleInject(message.data)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
  });

  // 处理内容注入
  async function handleInject(data) {
    const { title, content, author, summary } = data;

    // 填充标题
    if (title) {
      const titleInput = document.querySelector('#js_title');
      if (titleInput) {
        titleInput.value = title;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    // 填充作者
    if (author) {
      const authorInput = document.querySelector('#js_author');
      if (authorInput) {
        authorInput.value = author;
        authorInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    // 填充摘要
    if (summary) {
      const summaryInput = document.querySelector('#js_summary');
      if (summaryInput) {
        summaryInput.value = summary;
        summaryInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    // 填充内容（UEditor）
    if (content) {
      await waitForUEditor();
      const editor = UE.getEditor('ueditor_0');
      if (editor) {
        editor.ready(() => {
          editor.setContent(content);
          // 显示成功提示
          showNotification('内容已填充');
        });
      }
    }

    return { success: true };
  }

  // 等待 UEditor 加载
  function waitForUEditor() {
    return new Promise((resolve) => {
      const check = () => {
        if (window.UE && UE.getEditor('ueditor_0')) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  // 显示通知
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 4px;
      z-index: 10000;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // 自动检测剪贴板内容
  document.addEventListener('paste', async (e) => {
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedData = clipboardData.getData('text/html') || clipboardData.getData('text');

    // 检查是否是从我们的网站复制的内容
    if (pastedData.includes('data-source="content-publisher"')) {
      e.preventDefault();
      // 自动填充
      handleInject({ content: pastedData });
    }
  });
})();
```

## Popup UI

### ui/popup.html

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>多平台内容发布助手</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h2>多平台内容发布助手</h2>

    <div class="status">
      <p id="platform-status">检测中...</p>
    </div>

    <div class="actions">
      <button id="paste-btn" class="btn-primary">
        从剪贴板粘贴
      </button>
      <button id="open-editor-btn" class="btn-secondary">
        打开编辑器
      </button>
    </div>

    <div class="settings">
      <label>
        <input type="checkbox" id="auto-paste">
        自动粘贴剪贴板内容
      </label>
    </div>
  </div>

  <script src="popup.js"></script>
</body>
</html>
```

### ui/popup.js

```javascript
// Popup UI 逻辑

document.addEventListener('DOMContentLoaded', async () => {
  const platformStatus = document.getElementById('platform-status');
  const pasteBtn = document.getElementById('paste-btn');
  const openEditorBtn = document.getElementById('open-editor-btn');
  const autoPaste = document.getElementById('auto-paste');

  // 检测当前平台
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const platform = detectPlatform(tab.url);

  if (platform) {
    platformStatus.textContent = `✓ 已检测到: ${platform.name}`;
    platformStatus.className = 'status-active';
  } else {
    platformStatus.textContent = '× 当前页面不支持';
    platformStatus.className = 'status-inactive';
    pasteBtn.disabled = true;
  }

  // 粘贴按钮
  pasteBtn.addEventListener('click', async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();

      chrome.tabs.sendMessage(tab.id, {
        type: 'INJECT_CONTENT',
        platform: platform.key,
        data: { content: clipboardText }
      });

      showMessage('内容已粘贴');
    } catch (error) {
      showMessage('粘贴失败: ' + error.message, 'error');
    }
  });

  // 打开编辑器
  openEditorBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://yourdomain.com/editor' });
  });

  // 加载设置
  chrome.storage.sync.get(['autoPaste'], (result) => {
    autoPaste.checked = result.autoPaste || false;
  });

  // 保存设置
  autoPaste.addEventListener('change', () => {
    chrome.storage.sync.set({ autoPaste: autoPaste.checked });
  });
});

function detectPlatform(url) {
  const platforms = {
    wechat: { name: '微信公众号', key: 'wechat', pattern: /mp\.weixin\.qq\.com/ },
    zhihu: { name: '知乎', key: 'zhihu', pattern: /zhuanlan\.zhihu\.com/ },
    juejin: { name: '掘金', key: 'juejin', pattern: /juejin\.cn/ },
  };

  for (const [key, platform] of Object.entries(platforms)) {
    if (platform.pattern.test(url)) {
      return platform;
    }
  }

  return null;
}

function showMessage(message, type = 'success') {
  const statusEl = document.getElementById('platform-status');
  statusEl.textContent = message;
  statusEl.className = `status-${type}`;

  setTimeout(() => {
    statusEl.className = 'status';
  }, 3000);
}
```

## 构建和打包

### scripts/build-extension.mjs

```javascript
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const manifestPath = './plugin/manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version;

const outputFileName = `content-publisher-extension-v${version}.zip`;
const outputPath = path.join('./public', outputFileName);

// 创建 zip 文件
const output = fs.createWriteStream(outputPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`✓ 扩展已打包: ${outputFileName}`);
  console.log(`  文件大小: ${(archive.pointer() / 1024).toFixed(2)} KB`);
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);

// 添加整个 plugin 目录
archive.directory('plugin/', false);

archive.finalize();

// 生成元数据文件
const metadata = {
  version,
  filename: outputFileName,
  url: `/${outputFileName}`,
  buildAt: new Date().toISOString()
};

fs.writeFileSync(
  './public/extension-latest.json',
  JSON.stringify(metadata, null, 2)
);

console.log('✓ 元数据已生成: extension-latest.json');
```

## 测试和调试

### 加载扩展

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `plugin` 目录

### 查看日志

- **Service Worker**: `chrome://extensions/` → 点击扩展的 "Service Worker"
- **Content Script**: F12 → Console
- **Popup**: 右键点击扩展图标 → 检查弹出窗口

## 发布到 Chrome Web Store

1. 注册开发者账号（$5 一次性费用）
2. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. 点击"New Item"
4. 上传 zip 文件
5. 填写详细信息
6. 提交审核

## 参考资源

- [Chrome Extension API 文档](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 迁移指南](https://developer.chrome.com/docs/extensions/mv3/intro/)
