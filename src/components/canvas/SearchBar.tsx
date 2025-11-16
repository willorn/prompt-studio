import React, { useState, useCallback, useEffect } from 'react';

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
  
  /** 可选:占位文本 */
  placeholder?: string;
}

/**
 * 版本树搜索栏组件
 * 支持防抖输入、结果导航和键盘快捷键
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  currentIndex,
  total,
  onQueryChange,
  onNext,
  onPrev,
  onClear,
  placeholder = '搜索版本内容...',
}) => {
  const [localQuery, setLocalQuery] = useState(query);

  // 防抖处理(300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery !== query) {
        onQueryChange(localQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, query, onQueryChange]);

  // 同步外部query变化
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrev();
      } else {
        onNext();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClear();
    }
  }, [onNext, onPrev, onClear]);

  const hasResults = total > 0;
  const canNavigate = total > 1;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-surface-variant rounded-lg shadow-sm">
      {/* 搜索图标 */}
      <svg
        className="w-5 h-5 text-surface-onVariant flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      {/* 输入框 */}
      <input
        type="text"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-surface-onVariant placeholder-surface-onVariant/60 text-sm"
        aria-label="搜索版本内容"
      />

      {/* 结果计数 */}
      {hasResults && (
        <span className="text-sm text-surface-onVariant font-medium flex-shrink-0">
          {currentIndex + 1}/{total}
        </span>
      )}

      {/* 上一个结果按钮 */}
      <button
        onClick={onPrev}
        disabled={!canNavigate}
        className="p-1.5 rounded-full hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="上一个结果 (Shift+Enter)"
        title="上一个结果 (Shift+Enter)"
      >
        <svg
          className="w-4 h-4 text-surface-onVariant"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* 下一个结果按钮 */}
      <button
        onClick={onNext}
        disabled={!canNavigate}
        className="p-1.5 rounded-full hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="下一个结果 (Enter)"
        title="下一个结果 (Enter)"
      >
        <svg
          className="w-4 h-4 text-surface-onVariant"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 清空按钮 */}
      {query && (
        <button
          onClick={onClear}
          className="p-1.5 rounded-full hover:bg-surface transition-colors"
          aria-label="清空搜索 (ESC)"
          title="清空搜索 (ESC)"
        >
          <svg
            className="w-4 h-4 text-surface-onVariant"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
