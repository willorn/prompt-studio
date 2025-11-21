import React from 'react';
import { Button } from '@/components/common/Button';

interface EditorToolbarProps {
  onSave: () => void;
  onSaveInPlace: () => void;
  onSnippets?: () => void;
  canSaveInPlace: boolean;
  hasProject: boolean; // 是否有选中的项目
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onSave,
  onSaveInPlace,
  onSnippets,
  canSaveInPlace,
  hasProject,
}) => {
  return (
    <div className="flex items-center gap-2 p-3 bg-surface-variant border-b border-surface-onVariant/20">
      <Button
        onClick={onSaveInPlace}
        variant="outlined"
        size="small"
        disabled={!canSaveInPlace || !hasProject}
        title="原地更新当前版本 (Ctrl+S / Ctrl+Enter)"
      >
        原地保存
      </Button>

      <Button
        onClick={onSave}
        variant="outlined"
        size="small"
        disabled={!hasProject}
        title="创建新版本 (Ctrl+Shift+S / Ctrl+Shift+Enter)"
      >
        保存新版本
      </Button>

      

      {onSnippets && (
        <Button onClick={onSnippets} variant="outlined" size="small" title="片段库">
          片段
        </Button>
      )}

      <div className="flex-1" />
    </div>
  );
};

export default EditorToolbar;
