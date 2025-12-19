# 述而作助手 Chrome 插件

[English](#english-version) | [中文](#chinese-version)

---

<a name="chinese-version"></a>

## 📖 中文版本

### 简介

**述而作助手** 是一款智能内容发布 Chrome 浏览器插件，帮助创作者一键将内容发布到多个主流平台，支持图文、视频内容的智能适配和自动填充。

### ✨ 核心特性

#### 🌐 支持平台（9个）

**图文平台**
- ✅ 微信公众号
- ✅ 知乎专栏
- ✅ 掘金
- ✅ 知识星球
- ✅ Linux.do 论坛

**视频平台**
- ✅ 微信视频号
- ✅ 抖音
- ✅ B站（哔哩哔哩）
- ✅ 小红书

#### 🚀 功能亮点

1. **智能内容识别**
   - 自动检测剪贴板内容
   - 支持 HTML、Markdown 格式
   - 智能提取标题、正文、图片

2. **AI 智能适配**
   - 自动将图文内容转换为视频标题/描述
   - 智能生成平台标签
   - 内容格式自动优化

3. **智能标签匹配**
   - B站：三级智能匹配（精确→包含→相似度50%）
   - 小红书：话题智能识别，自动添加 # 前缀
   - 支持推荐标签点击 + 手动输入组合

4. **图片 CDN 上传**
   - 微信公众号支持图片自动上传到平台 CDN
   - 自动替换图片链接
   - 支持批量图片处理

5. **发布记录管理**
   - 完整的发布历史记录
   - 支持按文章、平台筛选
   - 记录发布状态、时间、平台链接

6. **预设模板系统**
   - 支持开头/结尾内容预设
   - 多平台独立配置
   - 一键应用预设

### 📦 下载安装

#### 🇨🇳 国内用户（推荐 Gitee）

**下载地址**: [Gitee Releases](https://gitee.com/seasun000/chrome_plugin/releases)

```bash
# 1. 下载 plugin.zip
# 2. 解压到本地文件夹
# 3. 打开 Chrome 浏览器
# 4. 访问 chrome://extensions/
# 5. 开启"开发者模式"
# 6. 点击"加载已解压的扩展程序"
# 7. 选择解压后的 plugin 文件夹
```

#### 🌍 国际用户（推荐 GitHub）

**Download URL**: [GitHub Releases](https://github.com/Claudate/chorme_plugin/releases)

```bash
# 1. Download plugin.zip
# 2. Extract to local folder
# 3. Open Chrome browser
# 4. Visit chrome://extensions/
# 5. Enable "Developer mode"
# 6. Click "Load unpacked"
# 7. Select the extracted plugin folder
```

### 🎯 使用教程

#### 基础使用流程

1. **准备内容**
   - 在述而作网站（ziliu.online）创建/编辑文章
   - 或直接复制 HTML/Markdown 内容到剪贴板

2. **打开目标平台**
   - 访问对应平台的编辑器页面
   - 插件会自动激活并显示右侧浮动面板

3. **一键填充**
   - 点击"粘贴内容"按钮
   - 插件自动填充标题、内容、标签
   - 检查并调整内容

4. **发布**
   - 点击平台的发布按钮
   - 发布记录自动保存到数据库

#### 平台特殊说明

**B站视频标签**
- 优先使用推荐标签智能匹配
- 支持三级匹配：精确匹配 → 包含匹配 → 相似度匹配（50%阈值）
- 推荐标签不足时自动通过输入框添加
- 最多支持 10 个标签

**小红书话题**
- 自动为话题添加 # 前缀
- 优先点击推荐话题
- 不足时在内容区域添加话题标签
- 最多支持 10 个话题

**微信公众号图片**
- 自动上传图片到微信 CDN
- 支持批量图片处理
- 自动替换文章中的图片链接

**Linux.do 论坛**
- 支持完整 Markdown 语法
- 智能等待 Discourse 编辑器加载
- 支持分类和标签选择

### 🔧 技术架构

```
plugin/
├── core/              # 核心服务
│   ├── api-service.js        # API 通信服务
│   ├── content-service.js    # 内容处理服务
│   ├── platform-manager.js   # 平台管理器
│   └── plugin-manager.js     # 插件管理器
├── plugins/           # 平台插件
│   ├── base-platform.js      # 基础插件类
│   └── platforms/            # 各平台实现
│       ├── wechat.js
│       ├── zhihu.js
│       ├── bilibili.js
│       ├── xiaohongshu.js
│       ├── linuxdo.js
│       └── ...
└── ui/               # 用户界面
    ├── panel.js              # 浮动面板
    └── features.js           # 功能按钮
```

### 📊 平台支持详情

| 平台 | 类型 | 标题 | 内容 | 标签 | 图片CDN | 智能匹配 |
|------|------|------|------|------|---------|----------|
| 微信公众号 | 图文 | ✅ | ✅ | - | ✅ | - |
| 知乎专栏 | 图文 | ✅ | ✅ | ✅ | - | - |
| 掘金 | 图文 | ✅ | ✅ | ✅ | - | - |
| 知识星球 | 图文 | ✅ | ✅ | - | - | - |
| Linux.do | 图文 | ✅ | ✅ | ✅ | - | - |
| 微信视频号 | 视频 | ✅ | ✅ | ✅ | - | - |
| 抖音 | 视频 | ✅ | ✅ | ✅ | - | - |
| B站 | 视频 | ✅ | ✅ | ✅ | - | ✅ |
| 小红书 | 视频 | ✅ | ✅ | ✅ | - | ✅ |

### 📝 版本信息

- **当前版本**: v1.3.3
- **发布日期**: 2025-12-19
- **浏览器支持**: Chrome 88+, Edge 88+

### 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

### 📄 开源协议

MIT License

### 🔗 相关链接

- **官方网站**: https://ziliu.online
- **Gitee 仓库**: https://gitee.com/seasun000/chrome_plugin
- **GitHub 仓库**: https://github.com/Claudate/chorme_plugin

---

<a name="english-version"></a>

## 📖 English Version

### Introduction

**述而作助手 (ShuErZuo Assistant)** is an intelligent content publishing Chrome extension that helps creators publish content to multiple mainstream platforms with one click, supporting intelligent adaptation and automatic filling of text and video content.

### ✨ Core Features

#### 🌐 Supported Platforms (9)

**Text Platforms**
- ✅ WeChat Official Account
- ✅ Zhihu Column
- ✅ Juejin
- ✅ Zhishixingqiu (Knowledge Planet)
- ✅ Linux.do Forum

**Video Platforms**
- ✅ WeChat Video Channel
- ✅ Douyin (TikTok China)
- ✅ Bilibili
- ✅ Xiaohongshu (Little Red Book)

#### 🚀 Feature Highlights

1. **Intelligent Content Recognition**
   - Auto-detect clipboard content
   - Support HTML, Markdown formats
   - Smart extraction of title, content, images

2. **AI Smart Adaptation**
   - Auto-convert text content to video title/description
   - Smart generate platform tags
   - Auto-optimize content format

3. **Smart Tag Matching**
   - Bilibili: Three-level intelligent matching (exact → contains → 50% similarity)
   - Xiaohongshu: Smart topic recognition, auto-add # prefix
   - Support recommend tag clicking + manual input combination

4. **Image CDN Upload**
   - WeChat Official Account supports auto-upload images to platform CDN
   - Auto-replace image links
   - Support batch image processing

5. **Publish Records Management**
   - Complete publish history
   - Filter by article, platform
   - Record publish status, time, platform URL

6. **Preset Template System**
   - Support header/footer content presets
   - Independent configuration for multiple platforms
   - One-click apply presets

### 📦 Download & Installation

#### 🇨🇳 For Chinese Users (Gitee Recommended)

**Download URL**: [Gitee Releases](https://gitee.com/seasun000/chrome_plugin/releases)

```bash
# 1. Download plugin.zip
# 2. Extract to local folder
# 3. Open Chrome browser
# 4. Visit chrome://extensions/
# 5. Enable "Developer mode"
# 6. Click "Load unpacked"
# 7. Select the extracted plugin folder
```

#### 🌍 For International Users (GitHub Recommended)

**Download URL**: [GitHub Releases](https://github.com/Claudate/chorme_plugin/releases)

```bash
# 1. Download plugin.zip
# 2. Extract to local folder
# 3. Open Chrome browser
# 4. Visit chrome://extensions/
# 5. Enable "Developer mode"
# 6. Click "Load unpacked"
# 7. Select the extracted plugin folder
```

### 🎯 User Guide

#### Basic Usage Flow

1. **Prepare Content**
   - Create/edit articles on ShuErZuo website (ziliu.online)
   - Or directly copy HTML/Markdown content to clipboard

2. **Open Target Platform**
   - Visit the editor page of the target platform
   - Plugin will auto-activate and display the right floating panel

3. **One-Click Fill**
   - Click "Paste Content" button
   - Plugin auto-fills title, content, tags
   - Review and adjust content

4. **Publish**
   - Click the platform's publish button
   - Publish record auto-saved to database

#### Platform-Specific Notes

**Bilibili Video Tags**
- Prioritize smart matching with recommend tags
- Support three-level matching: exact → contains → similarity (50% threshold)
- Auto-add via input box when recommend tags insufficient
- Maximum 10 tags

**Xiaohongshu Topics**
- Auto-add # prefix for topics
- Prioritize clicking recommend topics
- Add topic tags in content area when insufficient
- Maximum 10 topics

**WeChat Official Account Images**
- Auto-upload images to WeChat CDN
- Support batch image processing
- Auto-replace image links in articles

**Linux.do Forum**
- Support full Markdown syntax
- Smart wait for Discourse editor loading
- Support category and tag selection

### 🔧 Technical Architecture

```
plugin/
├── core/              # Core services
│   ├── api-service.js        # API communication service
│   ├── content-service.js    # Content processing service
│   ├── platform-manager.js   # Platform manager
│   └── plugin-manager.js     # Plugin manager
├── plugins/           # Platform plugins
│   ├── base-platform.js      # Base plugin class
│   └── platforms/            # Platform implementations
│       ├── wechat.js
│       ├── zhihu.js
│       ├── bilibili.js
│       ├── xiaohongshu.js
│       ├── linuxdo.js
│       └── ...
└── ui/               # User interface
    ├── panel.js              # Floating panel
    └── features.js           # Feature buttons
```

### 📊 Platform Support Details

| Platform | Type | Title | Content | Tags | Image CDN | Smart Match |
|----------|------|-------|---------|------|-----------|-------------|
| WeChat Official | Text | ✅ | ✅ | - | ✅ | - |
| Zhihu Column | Text | ✅ | ✅ | ✅ | - | - |
| Juejin | Text | ✅ | ✅ | ✅ | - | - |
| Zhishixingqiu | Text | ✅ | ✅ | - | - | - |
| Linux.do | Text | ✅ | ✅ | ✅ | - | - |
| WeChat Video | Video | ✅ | ✅ | ✅ | - | - |
| Douyin | Video | ✅ | ✅ | ✅ | - | - |
| Bilibili | Video | ✅ | ✅ | ✅ | - | ✅ |
| Xiaohongshu | Video | ✅ | ✅ | ✅ | - | ✅ |

### 📝 Version Info

- **Current Version**: v1.3.3
- **Release Date**: 2025-12-19
- **Browser Support**: Chrome 88+, Edge 88+

### 🤝 Contributing

Welcome to submit Issues and Pull Requests!

### 📄 License

MIT License

### 🔗 Links

- **Official Website**: https://ziliu.online
- **Gitee Repository**: https://gitee.com/seasun000/chrome_plugin
- **GitHub Repository**: https://github.com/Claudate/chorme_plugin

---

## 🆘 Support

For issues or questions, please:
- Submit an issue on [Gitee](https://gitee.com/seasun000/chrome_plugin/issues) (Chinese users)
- Submit an issue on [GitHub](https://github.com/Claudate/chorme_plugin/issues) (International users)
- Visit our website: https://ziliu.online

**Made with ❤️ by ShuErZuo Team**
