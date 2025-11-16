# Component Contract: CompareModal

**Type**: React Functional Component  
**Purpose**: 全屏版本对比模态框，使用@codemirror/merge实现并排Diff视图

---

## Props Interface

```typescript
interface CompareModalProps {
  /** 模态框是否打开 */
  isOpen: boolean;
  
  /** 源版本(左侧) */
  sourceVersion: Version | null;
  
  /** 目标版本(右侧) */
  targetVersion: Version | null;
  
  /** 关闭模态框的回调 */
  onClose: () => void;
  
  /** 可选：自定义标题 */
  title?: string;
}
```

---

## 行为规范

### 显示逻辑
- **当 `isOpen === true`**: 
  - 显示全屏模态框(z-index: 50)
  - 背景遮罩(backdrop)半透明黑色(rgba(0,0,0,0.5))
  - 支持ESC键关闭
  
- **当 `isOpen === false`**: 
  - 完全隐藏，不渲染DOM节点

### Diff视图
- **当 `sourceVersion && targetVersion` 都存在**:
  - 左侧显示sourceVersion.content
  - 右侧显示targetVersion.content
  - 使用@codemirror/merge的MergeView组件
  - 高亮差异行和字符
  
- **当任一版本为null**:
  - 显示占位文本: "请选择要对比的版本"

### 关闭行为
- 点击背景遮罩 → `onClose()`
- 点击右上角关闭按钮(×) → `onClose()`
- 按ESC键 → `onClose()`

---

## 样式规范 (Material Design 3)

### 模态框容器
```css
.compare-modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 95vw;
  height: 90vh;
  background: var(--md-sys-color-surface);
  border-radius: var(--md-sys-shape-corner-extra-large); /* 28px */
  box-shadow: var(--md-sys-elevation-level-3);
}
```

### 头部区域
```typescript
<header className="p-6 border-b border-surface-onVariant/20">
  <div className="flex items-center justify-between">
    <h2 className="text-2xl font-bold">
      {title || '版本对比'}
    </h2>
    <button 
      className="icon-button" 
      onClick={onClose}
      aria-label="关闭"
    >
      ✕
    </button>
  </div>
  {/* 相似度指示器 */}
  <div className="mt-4 flex items-center gap-2">
    <span className="text-sm text-surface-onVariant">相似度:</span>
    <span className="font-bold text-primary">{similarity}%</span>
  </div>
</header>
```

### Diff区域
```typescript
<div className="flex-1 grid grid-cols-2 gap-0 overflow-hidden">
  {/* 左侧面板 */}
  <div className="border-r border-surface-variant">
    <div className="bg-surface-variant px-4 py-2">
      <h3 className="font-semibold">
        版本 {sourceVersion?.id.slice(0, 8)}
      </h3>
      <span className="text-xs text-surface-onVariant">
        创建于 {formatDate(sourceVersion?.createdAt)}
      </span>
    </div>
    <div ref={mergeViewLeftRef} />
  </div>
  
  {/* 右侧面板 */}
  <div>
    {/* 类似结构 */}
  </div>
</div>
```

---

## 使用示例

```typescript
import { CompareModal } from '@/components/version/CompareModal';
import { useVersionStore } from '@/store/versionStore';

function MyComponent() {
  const { 
    compareState, 
    versions, 
    closeCompare 
  } = useVersionStore();
  
  const sourceVersion = versions.find(
    v => v.id === compareState.sourceVersionId
  );
  const targetVersion = versions.find(
    v => v.id === compareState.targetVersionId
  );
  
  return (
    <CompareModal
      isOpen={compareState.isOpen}
      sourceVersion={sourceVersion || null}
      targetVersion={targetVersion || null}
      onClose={closeCompare}
    />
  );
}
```

---

## 测试要点

### 单元测试
- [ ] `isOpen=false` 时不渲染任何DOM
- [ ] `isOpen=true` 但版本为null时显示占位文本
- [ ] `onClose` 回调被正确触发(点击背景、按钮、ESC键)

### 组件测试
- [ ] MergeView组件正确渲染
- [ ] Diff高亮正确显示
- [ ] 相似度计算准确

### E2E测试
- [ ] 从版本树点击"对比"按钮
- [ ] 选择目标版本
- [ ] 验证Diff视图显示
- [ ] 关闭模态框
- [ ] 验证状态重置

---

## 依赖

- `@codemirror/merge`: Diff视图核心
- `@codemirror/state`: CodeMirror状态管理
- `diffService`: 相似度计算
- `useVersionStore`: 版本数据和状态
- `Modal`: 基础模态框组件(可复用现有)

---

## 性能要求

- **渲染时间**: <500ms (5000字符对比)
- **内存占用**: <50MB (包含CodeMirror实例)
- **动画流畅度**: 60fps (打开/关闭动画)
