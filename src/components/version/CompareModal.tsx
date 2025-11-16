/**
 * 版本对比模态框组件
 * 使用 @codemirror/merge 实现并排Diff视图
 */

import { useEffect, useRef } from 'react';
import { MergeView } from '@codemirror/merge';
import type { Version } from '@/models/Version';
import { createDiffEditorExtensions, diffService } from '@/services/diffService';

export interface CompareModalProps {
  /** 模态框是否打开 */
  isOpen: boolean;
  
  /** 源版本(左侧) */
  sourceVersion: Version | null;
  
  /** 目标版本(右侧) */
  targetVersion: Version | null;
  
  /** 关闭模态框的回调 */
  onClose: () => void;
  
  /** 可选:自定义标题 */
  title?: string;
  
  /** 可用于对比的版本列表 */
  availableVersions?: Version[];
  
  /** 选择目标版本的回调 */
  onSelectTarget?: (versionId: string) => void;
}

export function CompareModal({
  isOpen,
  sourceVersion,
  targetVersion,
  onClose,
  title = '版本对比',
  availableVersions = [],
  onSelectTarget,
}: CompareModalProps) {
  const mergeViewRef = useRef<MergeView | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算相似度
  const similarity = sourceVersion && targetVersion
    ? diffService.computeSimilarity(sourceVersion.content, targetVersion.content)
    : 0;

  // 初始化和更新MergeView
  useEffect(() => {
    if (!isOpen || !containerRef.current || !sourceVersion || !targetVersion) {
      return;
    }

    // 清理旧实例
    if (mergeViewRef.current) {
      mergeViewRef.current.destroy();
      mergeViewRef.current = null;
    }

    // 创建新实例
    const extensions = createDiffEditorExtensions();
    mergeViewRef.current = new MergeView({
      a: {
        doc: sourceVersion.content,
        extensions,
      },
      b: {
        doc: targetVersion.content,
        extensions,
      },
      parent: containerRef.current,
    });

    return () => {
      if (mergeViewRef.current) {
        mergeViewRef.current.destroy();
        mergeViewRef.current = null;
      }
    };
  }, [isOpen, sourceVersion, targetVersion]);

  // ESC键关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[95vw] h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col">
        {/* Header */}
        <header className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="关闭"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* 相似度指示器 */}
          {sourceVersion && targetVersion && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">相似度:</span>
              <span className="font-bold text-blue-600">{similarity}%</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden ml-2">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${similarity}%` }}
                />
              </div>
            </div>
          )}

          {/* 目标版本选择器 */}
          {sourceVersion && !targetVersion && availableVersions.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择要对比的版本:
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) => onSelectTarget?.(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>请选择版本...</option>
                {availableVersions.map((v) => (
                  <option key={v.id} value={v.id}>
                    版本 {v.id.slice(0, 8)} - {formatDate(v.createdAt)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </header>

        {/* Diff区域 */}
        <div className="flex-1 grid grid-cols-2 gap-0 overflow-hidden">
          {/* 左侧面板 */}
          <div className="border-r border-gray-200 flex flex-col">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                版本 {sourceVersion?.id.slice(0, 8)}
              </h3>
              <span className="text-xs text-gray-600">
                创建于 {sourceVersion && formatDate(sourceVersion.createdAt)}
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              {sourceVersion ? (
                <div ref={(el) => el && containerRef.current === null && (containerRef.current = el)} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  请选择源版本
                </div>
              )}
            </div>
          </div>

          {/* 右侧面板 */}
          <div className="flex flex-col">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                版本 {targetVersion?.id.slice(0, 8)}
              </h3>
              <span className="text-xs text-gray-600">
                创建于 {targetVersion && formatDate(targetVersion.createdAt)}
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              {targetVersion ? (
                <div ref={containerRef} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  请选择要对比的版本
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
