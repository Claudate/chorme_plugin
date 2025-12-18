---
name: internationalization
description: i18next 国际化快速指南。包含设置、语言文件、使用 Hook、语言切换、新语言添加。(project)
---

# 国际化 (i18n) 快速指南

## 使用场景

添加新语言、修改翻译、使用翻译时使用此 Skill。

## 设置 i18next

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
    interpolation: { escapeValue: false },
  });

export default i18n;
```

## 翻译文件

```json
// frontend/src/i18n/locales/en.json
{
  "common": {
    "home": "Home",
    "loading": "Loading...",
    "error": "Error",
    "noData": "No data"
  },
  "prompts": {
    "title": "AI Prompts",
    "searchPlaceholder": "Search prompts..."
  }
}
```

```json
// frontend/src/i18n/locales/zh.json
{
  "common": {
    "home": "首页",
    "loading": "加载中...",
    "error": "错误",
    "noData": "没有数据"
  },
  "prompts": {
    "title": "AI 提示词",
    "searchPlaceholder": "搜索提示词..."
  }
}
```

## 在组件中使用

```typescript
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('prompts.title')}</h1>
      <input
        placeholder={t('prompts.searchPlaceholder')}
      />

      <button onClick={() => i18n.changeLanguage('en')}>
        English
      </button>
      <button onClick={() => i18n.changeLanguage('zh')}>
        中文
      </button>
    </div>
  );
}
```

## 添加新语言

1. **创建翻译文件**
```json
// frontend/src/i18n/locales/ja.json
{
  "common": { "home": "ホーム" },
  "prompts": { "title": "AIプロンプト" }
}
```

2. **导入并注册**
```typescript
// frontend/src/i18n/index.ts
import ja from './locales/ja.json';

i18n.init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
    ja: { translation: ja },  // 新增
  },
});
```

## 参数插值

```json
// 翻译文件
{
  "greeting": "Hello {{name}}, you have {{count}} messages"
}
```

```typescript
// 使用
t('greeting', { name: 'John', count: 5 })
// 输出: "Hello John, you have 5 messages"
```

## 复数形式

```json
{
  "message": "You have {{count}} message",
  "message_plural": "You have {{count}} messages"
}
```

## 语言切换和持久化

```typescript
const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('language', lang);
};
```

## 命名空间（可选）

```typescript
// 多个命名空间
i18n.init({
  ns: ['common', 'prompts'],
  defaultNS: 'common',
});

// 使用
t('common:home')  // 或
t('prompts:title')
```

## 检查清单

添加语言前：
- [ ] 创建了翻译文件
- [ ] 导入了翻译文件
- [ ] 注册了新语言
- [ ] 验证了所有键的翻译
- [ ] 测试了语言切换
