# Component Contract: SearchBar

**Type**: React Functional Component  
**Purpose**: 版本树搜索输入框，支持结果导航

---

## Props Interface

```typescript
interface SearchBarProps {
  /** 搜索关键词 */
  query: string;
  
  /** 当前结果索引(0-based) */
  currentIndex: number;
  
  /** 总匹配数 */
  total: number;
  
  /** 搜索关键词变化回调 */
  onQueryChange: (query: string) => void;
  
  /** 跳转到下一个结果 */
  onNext: () => void;
  
  /** 跳转到上一个结果 */
  onPrev: () => void;
  
  /** 清空搜索 */
  onClear: () => void;
  
  /** 可选：占位文本 */
  placeholder?: string;
}
```

---

## 行为规范

### 输入处理
- 输入防抖: 300ms
- 支持中文、英文、特殊字符
- Enter键: 触发`onNext()`
- Shift+Enter: 触发`onPrev()`
- ESC键: 触发`onClear()`

### 结果显示
- 格式: `{currentIndex + 1}/{total}` (如 "3/10")
- 无结果: 显示 "0/0"
- 空查询: 不显示结果计数

### 按钮状态
- `total === 0`: 导航按钮禁用
- `total === 1`: 导航按钮禁用(无需跳转)
- `total > 1`: 导航按钮启用

---

## 样式规范 (M3)

```typescript
<div className="flex items-center gap-2 p-2 bg-surface-variant rounded-m3-medium">
  {/* 搜索图标 */}
  <SearchIcon className="text-surface-onVariant" />
  
  {/* 输入框 */}
  <input
    type="text"
    value={query}
    onChange={(e) => onQueryChange(e.target.value)}
    placeholder={placeholder || "搜索版本内容..."}
    className="flex-1 bg-transparent outline-none"
  />
  
  {/* 结果计数 */}
  {total > 0 && (
    <span className="text-sm text-surface-onVariant">
      {currentIndex + 1}/{total}
    </span>
  )}
  
  {/* 导航按钮 */}
  <IconButton 
    onClick={onPrev} 
    disabled={total <= 1}
    aria-label="上一个结果"
  >
    ↑
  </IconButton>
  
  <IconButton 
    onClick={onNext} 
    disabled={total <= 1}
    aria-label="下一个结果"
  >
    ↓
  </IconButton>
  
  {/* 清空按钮 */}
  {query && (
    <IconButton onClick={onClear} aria-label="清空搜索">
      ✕
    </IconButton>
  )}
</div>
```

---

## 测试要点

- [ ] 输入防抖工作正常
- [ ] 键盘快捷键响应正确
- [ ] 结果计数显示准确
- [ ] 按钮禁用状态正确
- [ ] 清空后状态重置

---

## 性能要求

- **输入响应**: <50ms
- **防抖延迟**: 300ms
- **渲染时间**: <16ms (60fps)
