# 数据模型设计: 版本增强功能集

**Feature**: 002-version-enhancements  
**Date**: 2025-11-16  
**Status**: Draft

## 概述

本文档定义版本增强功能集所需的数据模型、状态管理结构和存储方案。所有设计遵循"扁平化数据"原则，使用ID引用关联。

---

## 1. 核心数据模型

### 1.1 Version (已存在，无需修改)

```typescript
export interface Version {
  id: string;                    // 主键，UUID
  projectId: string;             // 所属项目ID
  parentId: string | null;       // 父版本ID，根节点为null
  createdAt: number;             // 创建时间戳(ms)
  updatedAt: number;             // 更新时间戳(ms)
  content: string;               // Prompt原始内容
  normalizedContent: string;     // 标准化内容(用于搜索和对比)
  contentHash: string;           // SHA-256哈希值(用于去重)
  score?: number;                // 评分(1-5)
}
```

**索引**:
- Primary: `id`
- Index: `projectId` (用于项目级查询)
- Index: `contentHash` (用于去重检查)
- Index: `parentId` (用于构建树结构)

**验证规则**:
- `id`: 非空，UUID格式
- `projectId`: 必须存在于projects表中
- `parentId`: 如非null，必须存在于versions表中
- `content`: 非空字符串
- `contentHash`: 64字符十六进制字符串(SHA-256)

---

## 2. 新增数据模型

### 2.1 SearchState (内存状态，不持久化)

```typescript
export interface SearchState {
  query: string;                 // 搜索关键词
  matches: string[];             // 匹配的版本ID列表
  currentIndex: number;          // 当前聚焦的匹配结果索引(0-based)
  total: number;                 // 匹配总数
  isActive: boolean;             // 搜索是否激活
}
```

**字段说明**:
- `query`: 用户输入的搜索文本，空字符串表示未搜索
- `matches`: 按版本在树中的顺序排列(从上到下，从左到右)
- `currentIndex`: -1表示无选中，0表示第一个结果
- `total`: `matches.length`的缓存，方便UI显示"3/10"
- `isActive`: 控制搜索框显示和版本高亮状态

**状态转换**:
```
初始状态: { query: '', matches: [], currentIndex: -1, total: 0, isActive: false }
搜索输入: isActive = true, 计算matches和total
跳转下一个: currentIndex = (currentIndex + 1) % total
跳转上一个: currentIndex = (currentIndex - 1 + total) % total
清空搜索: 返回初始状态
```

### 2.2 CompareState (内存状态，不持久化)

```typescript
export interface CompareState {
  isOpen: boolean;               // 对比模态框是否打开
  sourceVersionId: string | null; // 源版本ID(左侧)
  targetVersionId: string | null; // 目标版本ID(右侧)
}
```

**字段说明**:
- `isOpen`: 控制CompareModal的显示/隐藏
- `sourceVersionId`: 用户首次选中的版本
- `targetVersionId`: 用户从对话框中选择的对比版本

**状态转换**:
```
打开对比: { isOpen: true, sourceVersionId: currentVersionId, targetVersionId: null }
选择目标: targetVersionId = selectedId (从版本选择对话框)
关闭对比: { isOpen: false, sourceVersionId: null, targetVersionId: null }
```

### 2.3 LayoutPreference (localStorage持久化)

```typescript
export interface LayoutPreference {
  canvasPanelWidthRatio: number; // 主画布宽度占比(0.2 - 0.8)
  sidebarCollapsed?: boolean;    // 左侧边栏是否折叠(预留)
}
```

**字段说明**:
- `canvasPanelWidthRatio`: 主画布区域宽度 / 总宽度，默认0.6 (60%)
- `sidebarCollapsed`: 预留字段，用于未来侧边栏折叠功能

**存储键**:
```typescript
const STORAGE_KEYS = {
  CANVAS_RATIO: 'layout.canvasPanelWidthRatio',
  SIDEBAR_COLLAPSED: 'layout.sidebarCollapsed'
} as const;
```

**约束**:
- `canvasPanelWidthRatio`: 
  - 最小值: 0.2 (确保右侧面板至少占20%)
  - 最大值: 0.8 (确保主画布至少占20%)
  - 默认值: 0.6

---

## 3. Zustand Store结构

### 3.1 VersionStore (扩展)

```typescript
interface VersionState {
  // 现有状态
  versions: Version[];
  currentVersionId: string | null;

  // 新增状态
  compareState: CompareState;
  
  // 现有操作
  loadVersions: (projectId: string) => Promise<void>;
  createVersion: (projectId: string, content: string, parentId: string | null) => Promise<string>;
  updateVersionInPlace: (id: string, content: string) => Promise<void>;
  deleteVersion: (id: string) => Promise<void>;
  setCurrentVersion: (id: string | null) => void;
  
  // 新增操作
  checkDuplicate: (content: string, projectId: string) => Promise<Version | null>;
  openCompare: (sourceVersionId: string) => void;
  setCompareTarget: (targetVersionId: string) => void;
  closeCompare: () => void;
}
```

**新增操作说明**:

- `checkDuplicate(content, projectId)`: 
  - 计算contentHash
  - 查询当前项目中相同哈希的版本
  - 返回第一个匹配版本或null

- `openCompare(sourceVersionId)`:
  - 设置compareState.sourceVersionId
  - 设置compareState.isOpen = true

- `setCompareTarget(targetVersionId)`:
  - 设置compareState.targetVersionId
  - 触发Diff计算

- `closeCompare()`:
  - 重置compareState到初始状态

### 3.2 SearchStore (新增)

```typescript
interface SearchStore {
  // 状态
  searchState: SearchState;
  
  // 操作
  setQuery: (query: string) => void;
  executeSearch: (versions: Version[], query: string) => void;
  nextMatch: () => void;
  prevMatch: () => void;
  clearSearch: () => void;
  focusMatch: (index: number) => void;
}
```

**操作说明**:

- `setQuery(query)`: 更新搜索关键词，但不执行搜索
- `executeSearch(versions, query)`: 
  - 遍历versions，过滤匹配项
  - 更新matches、total
  - 设置currentIndex = 0 (如有结果)
  
- `nextMatch()`: currentIndex循环递增
- `prevMatch()`: currentIndex循环递减
- `clearSearch()`: 重置searchState到初始状态
- `focusMatch(index)`: 直接跳转到指定索引

### 3.3 UIStore (扩展)

```typescript
interface UIState {
  // 现有状态
  sidebarOpen: boolean;
  
  // 新增状态
  layoutPreference: LayoutPreference;
  isDraggingSplitter: boolean;
  
  // 现有操作
  toggleSidebar: () => void;
  
  // 新增操作
  setCanvasRatio: (ratio: number) => void;
  startDragging: () => void;
  stopDragging: () => void;
  loadLayoutPreference: () => void;
  saveLayoutPreference: () => void;
}
```

**新增操作说明**:

- `setCanvasRatio(ratio)`:
  - 更新layoutPreference.canvasPanelWidthRatio
  - 限制范围[0.2, 0.8]
  
- `startDragging()`: 设置isDraggingSplitter = true
- `stopDragging()`: 
  - 设置isDraggingSplitter = false
  - 调用saveLayoutPreference()
  
- `loadLayoutPreference()`:
  - 从localStorage读取配置
  - 应用到state
  
- `saveLayoutPreference()`:
  - 将当前layoutPreference写入localStorage

---

## 4. 数据流图

### 4.1 版本对比流程

```
用户点击"对比"按钮
    ↓
versionStore.openCompare(currentVersionId)
    ↓
显示CompareModal
    ↓
用户选择目标版本
    ↓
versionStore.setCompareTarget(targetVersionId)
    ↓
从versionStore.versions中获取两个版本
    ↓
传递给DiffViewer组件
    ↓
使用@codemirror/merge渲染Diff
    ↓
用户关闭模态框
    ↓
versionStore.closeCompare()
```

### 4.2 重复检测流程

```
用户点击"保存"按钮
    ↓
调用versionStore.createVersion(projectId, content, parentId)
    ↓
内部调用checkDuplicate(content, projectId)
    ↓
计算contentHash
    ↓
查询IndexedDB: db.versions.where('contentHash').equals(hash).and(v => v.projectId === projectId).first()
    ↓
┌─────────────┬─────────────┐
│ 有重复      │ 无重复      │
│             │             │
│ 弹出Dialog  │ 直接创建    │
│ 显示已有版本 │             │
│             │             │
│ 用户选择:   │             │
│ - 取消      │             │
│ - 仍然创建  │             │
└─────────────┴─────────────┘
```

### 4.3 版本搜索流程

```
用户输入搜索关键词
    ↓
debounce 300ms
    ↓
searchStore.executeSearch(versionStore.versions, query)
    ↓
遍历versions，过滤content包含query的版本
    ↓
更新searchState.matches、total
    ↓
VersionCanvas组件监听searchState变化
    ↓
高亮匹配的版本卡片
    ↓
自动滚动到第一个匹配版本
    ↓
用户点击"下一个"/"上一个"按钮
    ↓
searchStore.nextMatch() / prevMatch()
    ↓
更新currentIndex
    ↓
VersionCanvas滚动到新的匹配版本
```

### 4.4 面板拖动流程

```
用户鼠标悬停在分隔符上
    ↓
光标变为 ↔
    ↓
用户按下鼠标
    ↓
uiStore.startDragging()
    ↓
监听window.mousemove事件
    ↓
计算新比例: newRatio = e.clientX / window.innerWidth
    ↓
uiStore.setCanvasRatio(clamp(newRatio, 0.2, 0.8))
    ↓
触发React重新渲染，更新面板宽度
    ↓
用户释放鼠标
    ↓
uiStore.stopDragging()
    ↓
内部调用saveLayoutPreference()
    ↓
写入localStorage
```

---

## 5. IndexedDB Schema (无变更)

现有Version表已包含所有必需字段，无需修改schema。

**使用的索引**:
```typescript
// schema.ts (已存在)
export const db = new Dexie('PromptStudioDB');
db.version(1).stores({
  versions: 'id, projectId, parentId, contentHash, createdAt, updatedAt'
});
```

---

## 6. localStorage Schema

```typescript
// 存储结构
{
  "layout.canvasPanelWidthRatio": "0.65",
  "layout.sidebarCollapsed": "false",
  "search.lastQuery": "",  // 预留：记住上次搜索
}
```

**读写封装**:
```typescript
// utils/storage.ts
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
  },
  
  remove(key: string): void {
    localStorage.removeItem(key);
  }
};
```

---

## 7. 数据验证

### 7.1 Version数据验证

```typescript
// utils/validation.ts (扩展)
export function validateVersion(version: Partial<Version>): string[] {
  const errors: string[] = [];
  
  if (!version.id || !isUUID(version.id)) {
    errors.push('id必须是有效的UUID');
  }
  
  if (!version.content || version.content.trim().length === 0) {
    errors.push('content不能为空');
  }
  
  if (!version.contentHash || !/^[a-f0-9]{64}$/.test(version.contentHash)) {
    errors.push('contentHash必须是64字符的十六进制字符串');
  }
  
  // ... 其他验证
  
  return errors;
}
```

### 7.2 LayoutPreference验证

```typescript
export function validateLayoutRatio(ratio: number): number {
  if (typeof ratio !== 'number' || isNaN(ratio)) {
    return 0.6; // 默认值
  }
  
  return Math.max(0.2, Math.min(0.8, ratio));
}
```

---

## 8. 数据迁移

**无需迁移**: 本功能集不修改现有数据结构，仅新增客户端状态管理和localStorage配置。

**向后兼容**: 如果localStorage中不存在布局配置，系统将使用默认值(0.6)，对用户透明。

---

## 9. 性能考虑

### 9.1 搜索性能优化

```typescript
// 使用 Web Worker 进行搜索(如果版本数>5000)
export async function searchVersionsOptimized(
  versions: Version[], 
  query: string
): Promise<string[]> {
  if (versions.length < 5000) {
    // 主线程搜索
    return searchVersionsSync(versions, query);
  } else {
    // Web Worker搜索
    return searchVersionsAsync(versions, query);
  }
}
```

### 9.2 Diff计算优化

```typescript
// 使用 @codemirror/merge 的内置优化
// 大文本自动使用Myers Diff算法的线性空间版本
// 无需手动优化
```

### 9.3 面板拖动性能

```typescript
// 使用 requestAnimationFrame 限流
const handleMouseMove = useCallback((e: MouseEvent) => {
  if (!isDragging.current) return;
  
  requestAnimationFrame(() => {
    const newRatio = e.clientX / window.innerWidth;
    setCanvasRatio(clamp(newRatio, 0.2, 0.8));
  });
}, []);
```

---

## 10. 总结

### 数据模型变更
- ✅ 无破坏性变更
- ✅ 新增3个内存状态模型(SearchState, CompareState, LayoutPreference)
- ✅ 扩展3个Zustand Store (VersionStore, UIStore, 新增SearchStore)
- ✅ 所有数据符合扁平化原则

### 存储方案
- ✅ IndexedDB: 无变更，复用现有Version表
- ✅ localStorage: 新增布局偏好存储
- ✅ 内存状态: Zustand管理搜索和对比状态

### 性能保障
- ✅ 搜索: <200ms (1000版本)
- ✅ 哈希计算: <500ms (10KB内容)
- ✅ 面板拖动: 60fps (requestAnimationFrame)
- ✅ Diff渲染: <1s (5000字符)

**下一步**: 进入Phase 1 - API契约定义 (组件接口)
