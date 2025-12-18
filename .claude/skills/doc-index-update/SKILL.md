---
name: doc-index-update
description: 扫描项目结构并更新 DOC_INDEX.md 文档索引。用于添加新功能、新 Provider、新 Skill 后同步文档。 (project)
---

# 文档索引更新指南

## 使用场景

当你完成以下操作后，应该更新文档索引：

- 添加了新的 AI Provider
- 添加了新的工作流 Skill
- 添加了新的发布平台
- 添加了新的页面组件
- 添加了新的 Claude Code Skill
- 修改了项目结构

---

## 更新步骤

### 1. 扫描项目统计

执行以下扫描命令获取最新统计：

```bash
# AI 提供商数量
ls electron/services/ai/providers/*.provider.ts | wc -l

# 工作流技能数量
ls electron/services/workflow/skills/*.skill.ts | wc -l

# 发布平台数量
ls electron/services/publish/publishers/*.publisher.ts | wc -l

# 页面组件数量
ls src/pages/*.tsx | wc -l

# Skills 数量
ls .claude/skills/*/SKILL.md | wc -l
```

### 2. 更新 DOC_INDEX.md

读取 `docs/DOC_INDEX.md` 并更新以下区域：

#### 项目统计表

```markdown
## 项目统计

| 类别 | 数量 | 更新时间 |
|-----|------|---------|
| AI 提供商 | [新数量] | [当前日期] |
| 工作流技能 | [新数量] | [当前日期] |
| 发布平台 | [新数量] | [当前日期] |
| 页面组件 | [新数量] | [当前日期] |
| Skills | [新数量] | [当前日期] |
```

#### 新增条目

根据新增的文件类型，在对应的折叠区域添加条目：

- **新 AI Provider** → 更新 `electron/services/ai/providers/` 目录描述
- **新工作流 Skill** → 更新 `electron/services/workflow/` 目录描述
- **新发布平台** → 更新 `electron/services/publish/` 目录描述
- **新页面** → 在 `src/pages/` 区域添加
- **新 Skill** → 在 Skills 文档表格中添加新行

---

## 快速更新模板

### 添加新 Skill

在 Skills 表格中添加：

```markdown
| [新skill名](.claude/skills/新skill名/SKILL.md) | 功能描述 | 使用场景 |
```

### 添加新页面

在渲染进程目录结构中更新页面数量：

```markdown
| [src/pages/](src/pages/) | [新数量]个页面组件 |
```

### 添加新 Provider

更新主进程目录结构中的提供商数量：

```markdown
| [electron/services/ai/providers/](electron/services/ai/providers/) | [新数量]+ AI 提供商实现 |
```

---

## 检查清单

更新完成后，确认以下内容：

- [ ] 项目统计表中的数量已更新
- [ ] 更新时间已改为当前日期
- [ ] 新增的文件已添加到对应区域
- [ ] 链接路径正确
- [ ] 描述文字准确

---

## 示例：添加新 AI Provider 后更新

假设添加了 `claude-official.provider.ts`：

1. **更新项目统计**：AI 提供商数量 25+ → 26+
2. **更新目录描述**：`25+ AI 提供商实现` → `26+ AI 提供商实现`
3. **更新时间**：改为当前日期

---

## 相关文件

- [DOC_INDEX.md](../../docs/DOC_INDEX.md) - 文档索引文件
- [project-structure](../project-structure/SKILL.md) - 项目结构 Skill
