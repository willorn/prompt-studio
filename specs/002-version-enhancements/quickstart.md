# 开发快速上手指南: 版本增强功能集

**Feature**: 002-version-enhancements  
**Target Developers**: 前端工程师 (React + TypeScript)  
**Estimated Time**: 10-15 天

---

## 1. 开发环境准备

### 1.1 前置条件

- ✅ Node.js 18+
- ✅ pnpm 8+
- ✅ VS Code (推荐扩展: ES Lint, Prettier, TypeScript)
- ✅ Chrome浏览器 (用于E2E测试)

### 1.2 克隆和安装

```bash
# 切换到功能分支
git checkout 002-version-enhancements

# 安装依赖(所有依赖已存在，无需新增)
pnpm install

# 启动开发服务器
pnpm dev

# 打开 http://localhost:5173
```

### 1.3 验证环境

```bash
# 运行单元测试
pnpm test

# 运行E2E测试
pnpm test:e2e

# 代码检查
pnpm lint
```

---

## 2. 项目结构概览

```
src/
├── components/
│   ├── canvas/
│   │   ├── VersionCanvas.tsx          # [修改] 添加搜索、画布控制
│   │   └── SearchBar.tsx              # [新增] P2
│   ├── common/
│   │   ├── ResizableSplitter.tsx      # [新增] P2
│   │   └── DuplicateDialog.tsx        # [新增] P2
│   └── version/
│       ├── DiffViewer.tsx             # [重构] P1
│       └── CompareModal.tsx           # [新增] P1
├── services/
│   ├── diffService.ts                 # [修改] P1
│   ├── searchService.ts               # [新增] P2
│   └── layoutManager.ts               # [新增] P2
├── store/
│   ├── versionStore.ts                # [修改] P1, P2
│   ├── searchStore.ts                 # [新增] P2
│   └── uiStore.ts                     # [修改] P2
└── hooks/
    ├── useVersionCompare.ts           # [新增] P1
    ├── useVersionSearch.ts            # [新增] P2
    └── useResizable.ts                # [新增] P2
```

**优先级标记**:
- P1: 版本对比 (最高优先级)
- P2: 重复提醒、搜索、面板拖动
- P3: 非叶子保存、UI优化

---

## 3. 开发路线图 (按优先级)

### Phase 1: 版本对比功能 (P1) - 3天

**Day 1**: Diff服务升级
```bash
# 1. 修改 src/services/diffService.ts
# 集成 @codemirror/merge

# 2. 创建 src/hooks/useVersionCompare.ts
# 封装对比状态逻辑

# 3. 测试
pnpm test -- diffService.test.ts
```

**Day 2**: CompareModal组件
```bash
# 1. 创建 src/components/version/CompareModal.tsx
# 按照契约实现

# 2. 修改 src/store/versionStore.ts
# 添加 compareState 和相关actions

# 3. 测试
pnpm test -- CompareModal.test.tsx
```

**Day 3**: 集成和E2E测试
```bash
# 1. 修改 src/pages/MainView.tsx
# 集成CompareModal

# 2. 添加"对比"按钮到EditorToolbar

# 3. E2E测试
pnpm test:e2e -- version-compare.e2e.ts
```

---

### Phase 2: 重复内容提醒 (P2) - 2天

**Day 4**: 去重逻辑
```bash
# 1. 修改 src/store/versionStore.ts
# 实现 checkDuplicate 方法
# 在 createVersion 中调用检查

# 2. 测试
pnpm test -- versionStore.test.ts
```

**Day 5**: DuplicateDialog组件
```bash
# 1. 创建 src/components/common/DuplicateDialog.tsx

# 2. 集成到保存流程

# 3. E2E测试
pnpm test:e2e -- duplicate-warning.e2e.ts
```

---

### Phase 3: 面板拖动分隔符 (P2) - 2天

**Day 6**: 拖动逻辑
```bash
# 1. 创建 src/hooks/useResizable.ts
# 2. 创建 src/services/layoutManager.ts
# 3. 创建 src/utils/storage.ts
```

**Day 7**: ResizableSplitter组件
```bash
# 1. 创建 src/components/common/ResizableSplitter.tsx
# 2. 修改 src/store/uiStore.ts
# 3. 修改 src/pages/MainView.tsx 集成

# E2E测试
pnpm test:e2e -- panel-resize.e2e.ts
```

---

### Phase 4: 版本树搜索 (P2) - 3天

**Day 8**: 搜索服务
```bash
# 1. 创建 src/services/searchService.ts
# 2. 创建 src/store/searchStore.ts
# 3. 测试
pnpm test -- searchService.test.ts
```

**Day 9**: SearchBar组件
```bash
# 1. 创建 src/components/canvas/SearchBar.tsx
# 2. 创建 src/hooks/useVersionSearch.ts
# 3. 测试
pnpm test -- SearchBar.test.tsx
```

**Day 10**: 集成到VersionCanvas
```bash
# 1. 修改 src/components/canvas/VersionCanvas.tsx
#    - 添加SearchBar
#    - 实现高亮和跳转逻辑

# 2. E2E测试
pnpm test:e2e -- version-search.e2e.ts
```

---

### Phase 5: 非叶子版本保存 + UI优化 (P3) - 2天

**Day 11-12**: 快速迭代
```bash
# 1. 修改 src/store/versionStore.ts
#    移除叶子节点限制

# 2. 修改 src/components/canvas/VersionCanvas.tsx
#    - 移动画布控制按钮到右下角
#    - 移除操作提示文字

# 3. 全功能E2E测试
pnpm test:e2e
```

---

## 4. 关键代码片段

### 4.1 版本对比 (useVersionCompare Hook)

```typescript
// src/hooks/useVersionCompare.ts
import { useState } from 'react';
import { useVersionStore } from '@/store/versionStore';

export function useVersionCompare() {
  const { versions, compareState, openCompare, setCompareTarget, closeCompare } = useVersionStore();
  
  const sourceVersion = versions.find(v => v.id === compareState.sourceVersionId);
  const targetVersion = versions.find(v => v.id === compareState.targetVersionId);
  
  const handleOpenCompare = (versionId: string) => {
    openCompare(versionId);
  };
  
  const handleSelectTarget = (versionId: string) => {
    setCompareTarget(versionId);
  };
  
  return {
    isOpen: compareState.isOpen,
    sourceVersion,
    targetVersion,
    availableVersions: versions.filter(v => v.id !== compareState.sourceVersionId),
    handleOpenCompare,
    handleSelectTarget,
    handleClose: closeCompare
  };
}
```

### 4.2 版本搜索 (searchService)

```typescript
// src/services/searchService.ts
import type { Version } from '@/models/Version';

export interface SearchResult {
  matches: string[];
  total: number;
}

export const searchService = {
  /**
   * 在版本列表中搜索关键词
   */
  searchVersions(versions: Version[], query: string): SearchResult {
    if (!query.trim()) {
      return { matches: [], total: 0 };
    }
    
    const lowerQuery = query.toLowerCase();
    const matches = versions
      .filter(v => v.content.toLowerCase().includes(lowerQuery))
      .map(v => v.id);
    
    return { matches, total: matches.length };
  },
  
  /**
   * 转义特殊字符
   */
  escapeQuery(query: string): string {
    return query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
};
```

### 4.3 面板拖动 (useResizable Hook)

```typescript
// src/hooks/useResizable.ts
import { useRef, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

export function useResizable() {
  const { layoutPreference, setCanvasRatio, startDragging, stopDragging } = useUIStore();
  const isDragging = useRef(false);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startDragging();
    
    document.body.style.cursor = 'col-resize';
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      requestAnimationFrame(() => {
        const newRatio = e.clientX / window.innerWidth;
        const clampedRatio = Math.max(0.2, Math.min(0.8, newRatio));
        setCanvasRatio(clampedRatio);
      });
    };
    
    const handleMouseUp = () => {
      if (!isDragging.current) return;
      
      isDragging.current = false;
      stopDragging();
      document.body.style.cursor = '';
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setCanvasRatio, stopDragging]);
  
  return {
    ratio: layoutPreference.canvasPanelWidthRatio,
    handleMouseDown
  };
}
```

---

## 5. 测试策略

### 5.1 单元测试示例

```typescript
// tests/unit/searchService.test.ts
import { describe, it, expect } from 'vitest';
import { searchService } from '@/services/searchService';
import type { Version } from '@/models/Version';

describe('searchService', () => {
  const mockVersions: Version[] = [
    {
      id: 'v1',
      content: 'Hello World',
      // ... 其他字段
    },
    {
      id: 'v2',
      content: 'Goodbye World',
      // ...
    }
  ];
  
  it('应该找到包含关键词的版本', () => {
    const result = searchService.searchVersions(mockVersions, 'world');
    expect(result.matches).toEqual(['v1', 'v2']);
    expect(result.total).toBe(2);
  });
  
  it('空查询应该返回空结果', () => {
    const result = searchService.searchVersions(mockVersions, '');
    expect(result.matches).toEqual([]);
    expect(result.total).toBe(0);
  });
});
```

### 5.2 E2E测试示例

```typescript
// tests/e2e/version-compare.e2e.ts
import { test, expect } from '@playwright/test';

test('版本对比完整流程', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // 1. 创建两个版本
  await page.click('[data-testid="create-version"]');
  await page.fill('[data-testid="editor"]', 'Version 1 content');
  await page.keyboard.press('Control+Enter');
  
  await page.fill('[data-testid="editor"]', 'Version 2 content');
  await page.keyboard.press('Control+Enter');
  
  // 2. 选中第一个版本
  await page.click('[data-testid="version-node-v1"]');
  
  // 3. 打开对比
  await page.click('[data-testid="compare-button"]');
  
  // 4. 选择第二个版本
  await page.click('[data-testid="version-option-v2"]');
  
  // 5. 验证Diff视图
  const diffView = page.locator('[data-testid="diff-view"]');
  await expect(diffView).toBeVisible();
  
  // 6. 关闭模态框
  await page.keyboard.press('Escape');
  await expect(diffView).not.toBeVisible();
});
```

---

## 6. 常见问题解决

### Q1: @codemirror/merge如何集成到React?

```typescript
import { useEffect, useRef } from 'react';
import { MergeView } from '@codemirror/merge';
import { basicSetup } from 'codemirror';

function DiffViewer({ leftContent, rightContent }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MergeView | null>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    viewRef.current = new MergeView({
      a: { doc: leftContent, extensions: [basicSetup] },
      b: { doc: rightContent, extensions: [basicSetup] },
      parent: containerRef.current
    });
    
    return () => {
      viewRef.current?.destroy();
    };
  }, [leftContent, rightContent]);
  
  return <div ref={containerRef} />;
}
```

### Q2: localStorage如何在TypeScript中类型安全地使用?

```typescript
// src/utils/storage.ts
export const storage = {
  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  },
  
  get<T>(key: string, defaultValue: T): T {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    
    try {
      return JSON.parse(saved) as T;
    } catch {
      return defaultValue;
    }
  }
};

// 使用
const ratio = storage.get('layout.canvasPanelWidthRatio', 0.6);
```

### Q3: 如何测试IndexedDB操作?

```typescript
// tests/unit/versionStore.test.ts
import { beforeEach } from 'vitest';
import 'fake-indexeddb/auto'; // 自动Mock IndexedDB

beforeEach(async () => {
  // 每次测试前清空数据库
  const dbs = await indexedDB.databases();
  dbs.forEach(db => db.name && indexedDB.deleteDatabase(db.name));
});
```

---

## 7. 性能优化技巧

### 7.1 搜索防抖

```typescript
import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';

const debouncedSearch = useCallback(
  debounce((query: string) => {
    searchStore.executeSearch(versions, query);
  }, 300),
  [versions]
);
```

### 7.2 面板拖动使用requestAnimationFrame

```typescript
const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging) return;
  
  requestAnimationFrame(() => {
    // 更新UI
  });
};
```

### 7.3 CodeMirror实例复用

```typescript
// 不要在每次render时创建新实例
const viewRef = useRef<MergeView | null>(null);

useEffect(() => {
  if (viewRef.current) {
    // 更新内容而不是重新创建
    viewRef.current.update({ /* new config */ });
  } else {
    viewRef.current = new MergeView({ /* config */ });
  }
}, [dependencies]);
```

---

## 8. 提交和Code Review

### Commit Message规范

```bash
feat(compare): 实现版本对比模态框
test(search): 添加搜索服务单元测试
refactor(diff): 使用@codemirror/merge替换自定义实现
fix(splitter): 修复拖动时的内存泄漏
docs(contract): 更新CompareModal契约文档
```

### PR Checklist

- [ ] 所有单元测试通过
- [ ] E2E测试覆盖核心流程
- [ ] 代码通过Lint检查
- [ ] 性能指标达标(见spec.md成功标准)
- [ ] 添加必要的注释(复杂逻辑)
- [ ] 更新相关文档(如有API变更)

---

## 9. 调试技巧

### Chrome DevTools

```javascript
// 在Console中查看Zustand状态
window.__ZUSTAND_DEVTOOLS__ = true;

// 查看IndexedDB
Application -> Storage -> IndexedDB -> PromptStudioDB

// 性能分析
Performance -> Record -> 执行操作 -> Stop
```

### React DevTools

- 安装React DevTools扩展
- Components标签查看组件树和Props
- Profiler标签分析渲染性能

---

## 10. 资源链接

- [CodeMirror 6 文档](https://codemirror.net/docs/)
- [@codemirror/merge 示例](https://codemirror.net/examples/merge/)
- [Zustand 文档](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Vitest 文档](https://vitest.dev/)
- [Playwright 文档](https://playwright.dev/)

---

**准备开始开发？**

```bash
# 确认当前分支
git branch

# 开始编码!
code .
pnpm dev
```

祝开发顺利！🚀
