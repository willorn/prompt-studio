/**
 * Diff 对比服务
 * 基于 diff-match-patch 算法
 */

import DiffMatchPatch from 'diff-match-patch';

export interface DiffResult {
  operation: 'equal' | 'insert' | 'delete';
  text: string;
}

export interface LineDiffPreviewLine {
  type: '+' | '-';
  text: string;
}

export interface LineDiffPreview {
  addedLines: number;
  removedLines: number;
  lines: LineDiffPreviewLine[];
  truncated: boolean;
}

export class DiffService {
  private dmp: DiffMatchPatch;

  constructor() {
    this.dmp = new DiffMatchPatch();
  }

  /**
   * 计算两个文本的差异
   */
  computeDiff(text1: string, text2: string): DiffResult[] {
    const diffs = this.dmp.diff_main(text1, text2);
    this.dmp.diff_cleanupSemantic(diffs);

    return diffs.map(([op, text]) => ({
      operation: op === 1 ? 'insert' : op === -1 ? 'delete' : 'equal',
      text,
    }));
  }

  /**
   * 计算相似度（0-100%）
   */
  computeSimilarity(text1: string, text2: string): number {
    const diffs = this.dmp.diff_main(text1, text2);
    const levenshtein = this.dmp.diff_levenshtein(diffs);
    const maxLength = Math.max(text1.length, text2.length);

    if (maxLength === 0) return 100;

    return Math.round(((maxLength - levenshtein) / maxLength) * 100);
  }

  /**
   * 生成统一格式的 Diff (类似 Git Diff)
   */
  generateUnifiedDiff(text1: string, text2: string): string {
    const diffs = this.dmp.diff_main(text1, text2);
    this.dmp.diff_cleanupSemantic(diffs);

    const patches = this.dmp.patch_make(text1, text2, diffs);
    return this.dmp.patch_toText(patches);
  }

  /**
   * 应用补丁
   */
  applyPatch(text: string, patch: string): string {
    const patches = this.dmp.patch_fromText(patch);
    const [result] = this.dmp.patch_apply(patches, text);
    return result;
  }

  /**
   * 生成“行级”变更预览：只包含新增/删除行（+/-），用于草稿恢复弹窗的决策信息。
   *
   * 说明：
   * - diff-match-patch 本身偏字符级；这里使用其内部的 linesToChars/charsToLines 转换实现更快的行级 diff。
   * - 预览仅输出变更行，不包含上下文（equal 行），避免过长。
   */
  getLineDiffPreview(text1: string, text2: string, maxLines = 60): LineDiffPreview {
    const anyDmp = this.dmp as any;
    if (
      typeof anyDmp.diff_linesToChars_ !== 'function' ||
      typeof anyDmp.diff_charsToLines_ !== 'function'
    ) {
      // 兜底：库实现变动时，退化为无预览
      return { addedLines: 0, removedLines: 0, lines: [], truncated: false };
    }

    const a = anyDmp.diff_linesToChars_(text1, text2);
    const diffs: Array<[number, string]> = this.dmp.diff_main(a.chars1, a.chars2, false);
    anyDmp.diff_charsToLines_(diffs, a.lineArray);
    this.dmp.diff_cleanupSemantic(diffs);

    let addedLines = 0;
    let removedLines = 0;
    const lines: LineDiffPreviewLine[] = [];

    const pushLines = (type: '+' | '-', block: string) => {
      // 保留换行结构，逐行计数
      const parts = block.split('\n');
      for (let i = 0; i < parts.length; i++) {
        const line = parts[i];
        // split 末尾可能多一个空行（因为原文本以 \n 结尾），跳过即可
        if (line === '' && i === parts.length - 1) continue;
        if (type === '+') addedLines += 1;
        if (type === '-') removedLines += 1;
        if (lines.length < maxLines) {
          lines.push({ type, text: line });
        }
      }
    };

    for (const [op, text] of diffs) {
      if (op === 1) pushLines('+', text);
      else if (op === -1) pushLines('-', text);
      // equal 忽略
    }

    const truncated = addedLines + removedLines > lines.length;
    return { addedLines, removedLines, lines, truncated };
  }
}

export const diffService = new DiffService();
