import { describe, expect, it, beforeEach, vi } from 'vitest';
import { draftService, getDraftStorageKey } from './draftService';
import { storage } from '@/utils/storage';

describe('draftService', () => {
  beforeEach(() => {
    // 某些测试运行器会注入不完整的 localStorage（缺少 getItem/setItem 等），这里显式 stub，确保草稿逻辑可测。
    const mem = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => (mem.has(key) ? mem.get(key)! : null),
      setItem: (key: string, value: string) => {
        mem.set(key, value);
      },
      removeItem: (key: string) => {
        mem.delete(key);
      },
      clear: () => {
        mem.clear();
      },
    });

    // 清理本测试涉及的 key，避免相互污染
    const key = getDraftStorageKey('p1', 'v1');
    storage.remove(key);
  });

  it('save/get/delete draft', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const saved = draftService.saveDraft({
      projectId: 'p1',
      versionId: 'v1',
      content: 'hello\nworld',
      versionName: 'n1',
      baseUpdatedAt: 1690000000000,
      baseContent: 'base',
    });

    expect(saved.projectId).toBe('p1');
    expect(saved.versionId).toBe('v1');
    expect(saved.draftUpdatedAt).toBe(1700000000000);

    const got = draftService.getDraft('p1', 'v1');
    expect(got?.content).toBe('hello\nworld');

    draftService.deleteDraft('p1', 'v1');
    expect(draftService.getDraft('p1', 'v1')).toBeNull();
  });
});
