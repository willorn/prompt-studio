import { describe, expect, it } from 'vitest';
import { diffService } from './diffService';

describe('diffService.getLineDiffPreview', () => {
  it('should count added/removed lines and emit +/- preview lines', () => {
    const a = ['line1', 'line2', 'line3'].join('\n');
    const b = ['line1', 'line2-new', 'line3', 'line4'].join('\n');

    const preview = diffService.getLineDiffPreview(a, b, 20);
    expect(preview.addedLines).toBeGreaterThan(0);
    expect(preview.removedLines).toBeGreaterThan(0);
    expect(preview.lines.some((l) => l.type === '+')).toBe(true);
    expect(preview.lines.some((l) => l.type === '-')).toBe(true);
  });
});

