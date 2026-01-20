/**
 * 内嵌差异查看器（用于在弹窗内部直接查看差异）
 * - 目标：不跳出当前决策弹窗，避免“看完差异后无法选择”的断流体验
 * - 说明：主题逻辑参考 CompareModal，保持明暗模式一致
 */

import { useMemo } from 'react';
import { DiffEditor, type DiffOnMount } from '@monaco-editor/react';
import { runtimeColors } from '@/styles/tokens';
import { getRuntimePrimary } from '@/theme/themeColor';
import { useSettingsStore } from '@/store/settingsStore';

export interface InlineDiffViewerProps {
  original: string;
  modified: string;
  language?: string;
  height?: string | number;
  /**
   * 是否使用并排视图。弹窗内容区域默认用 inline diff（更易读），全屏可切换为并排。
   */
  renderSideBySide?: boolean;
}

export function InlineDiffViewer({
  original,
  modified,
  language = 'markdown',
  height = 360,
  renderSideBySide = false,
}: InlineDiffViewerProps) {
  const { editorFontSize, editorLineHeight } = useSettingsStore();

  const diffEditorOptions = useMemo(
    () => ({
      readOnly: true,
      fontSize: editorFontSize,
      lineHeight: Math.round(editorFontSize * editorLineHeight),
      fontFamily: 'ui-monospace, monospace',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on' as const,
      automaticLayout: true,
      glyphMargin: false,
      padding: { top: 8, bottom: 10 },

      renderSideBySide,
      useInlineViewWhenSpaceIsLimited: !renderSideBySide,

      folding: false,
      renderLineHighlight: 'none' as const,
      unicodeHighlight: {
        nonBasicASCII: false,
        ambiguousCharacters: false,
        invisibleCharacters: false,
      },
      overviewRulerLanes: 0,
      overviewRulerBorder: false,
    }),
    [editorFontSize, editorLineHeight, renderSideBySide]
  );

  const handleEditorDidMount: DiffOnMount = (_editor, monaco) => {
    // 动态检测暗黑模式，确保 Diff 编辑器主题与主编辑器一致
    const isDark = document.documentElement.classList.contains('dark');
    const surfaceColor = isDark ? runtimeColors.surface.dark : runtimeColors.surface.DEFAULT;
    const textColor = isDark ? runtimeColors.text.dark.primary : runtimeColors.text.light.primary;
    const lineNumberColor = isDark ? runtimeColors.text.dark.muted : runtimeColors.text.light.muted;
    const gutterColor = isDark ? runtimeColors.surface.variantDark : runtimeColors.surface.variant;
    const primary = getRuntimePrimary();

    monaco.editor.defineTheme('prompt-studio-inline-diff-theme', {
      base: isDark ? 'vs-dark' : 'vs',
      inherit: true,
      rules: [
        {
          token: '',
          foreground: textColor,
          background: surfaceColor,
        },
      ],
      colors: {
        'editor.background': surfaceColor,
        'editor.foreground': textColor,
        'editorCursor.foreground': primary.DEFAULT,
        'editorLineNumber.foreground': lineNumberColor,
        'editorGutter.background': gutterColor,
        'editor.lineHighlightBackground': runtimeColors.primary.editorBackground,
      },
    });
    monaco.editor.setTheme('prompt-studio-inline-diff-theme');
  };

  return (
    <div className="rounded-lg border border-border dark:border-border-dark overflow-hidden bg-surface dark:bg-surface-dark">
      <DiffEditor
        height={height}
        language={language}
        original={original}
        modified={modified}
        onMount={handleEditorDidMount}
        keepCurrentModifiedModel={true}
        keepCurrentOriginalModel={true}
        options={diffEditorOptions}
      />
    </div>
  );
}
