# Component Contract: ResizableSplitter

**Type**: React Functional Component  
**Purpose**: 可拖动的面板分隔符

---

## Props Interface

```typescript
interface ResizableSplitterProps {
  /** 当前宽度比例(0-1) */
  ratio: number;
  
  /** 比例变化回调 */
  onRatioChange: (newRatio: number) => void;
  
  /** 拖动开始回调 */
  onDragStart?: () => void;
  
  /** 拖动结束回调 */
  onDragEnd?: () => void;
  
  /** 最小比例 */
  minRatio?: number;
  
  /** 最大比例 */
  maxRatio?: number;
  
  /** 可选：自定义样式类名 */
  className?: string;
}
```

---

## 行为规范

### 拖动逻辑
```typescript
const handleMouseDown = (e: React.MouseEvent) => {
  e.preventDefault();
  onDragStart?.();
  
  const handleMouseMove = (e: MouseEvent) => {
    requestAnimationFrame(() => {
      const newRatio = e.clientX / window.innerWidth;
      const clampedRatio = Math.max(
        minRatio, 
        Math.min(maxRatio, newRatio)
      );
      onRatioChange(clampedRatio);
    });
  };
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    onDragEnd?.();
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};
```

### 触控支持
```typescript
const handleTouchStart = (e: React.TouchEvent) => {
  // 类似逻辑，使用TouchEvent
};
```

### 鼠标样式
- 悬停: `cursor: col-resize`
- 拖动中: `cursor: col-resize` + 全局样式

---

## 样式规范

```css
.resizable-splitter {
  width: 4px;
  background: var(--md-sys-color-surface-variant);
  cursor: col-resize;
  position: relative;
  transition: background-color 0.2s;
}

.resizable-splitter:hover,
.resizable-splitter.dragging {
  background: var(--md-sys-color-primary);
}

/* 可拖动区域扩大(增加点击容错) */
.resizable-splitter::before {
  content: '';
  position: absolute;
  left: -4px;
  right: -4px;
  top: 0;
  bottom: 0;
}
```

---

## 使用示例

```typescript
import { ResizableSplitter } from '@/components/common/ResizableSplitter';
import { useUIStore } from '@/store/uiStore';

function MainLayout() {
  const { 
    layoutPreference, 
    setCanvasRatio,
    startDragging,
    stopDragging
  } = useUIStore();
  
  return (
    <div className="flex">
      <div style={{ width: `${layoutPreference.canvasPanelWidthRatio * 100}%` }}>
        {/* 主画布 */}
      </div>
      
      <ResizableSplitter
        ratio={layoutPreference.canvasPanelWidthRatio}
        onRatioChange={setCanvasRatio}
        onDragStart={startDragging}
        onDragEnd={stopDragging}
        minRatio={0.2}
        maxRatio={0.8}
      />
      
      <div style={{ width: `${(1 - layoutPreference.canvasPanelWidthRatio) * 100}%` }}>
        {/* 右侧面板 */}
      </div>
    </div>
  );
}
```

---

## 测试要点

- [ ] 拖动流畅度达到60fps
- [ ] 比例限制正确(不小于minRatio，不大于maxRatio)
- [ ] 触控设备支持
- [ ] 内存泄漏检查(事件监听器清理)

---

## 性能要求

- **帧率**: 60fps (使用requestAnimationFrame)
- **响应延迟**: <16ms
