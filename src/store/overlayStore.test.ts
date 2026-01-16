import { describe, expect, it, afterEach, vi } from 'vitest';
import { useOverlayStore } from './overlayStore';

afterEach(() => {
  // 重置运行时状态，避免测试之间互相污染（函数保持不变，只重置数据字段）
  useOverlayStore.setState({
    toasts: [],
    confirm: null,
    prompt: null,
    unsavedChanges: null,
    confirmResolver: null,
    promptResolver: null,
    unsavedChangesResolver: null,
  });
});

describe('overlayStore.unsavedChangesAsync', () => {
  it('应能 resolve 为选择结果', async () => {
    const promise = useOverlayStore.getState().unsavedChangesAsync({ title: 't' });
    useOverlayStore.getState().resolveUnsavedChanges('discard');
    await expect(promise).resolves.toBe('discard');
  });

  it('新的 unsavedChangesAsync 会取消上一个未完成的调用', async () => {
    const first = useOverlayStore.getState().unsavedChangesAsync({ title: 'first' });
    const second = useOverlayStore.getState().unsavedChangesAsync({ title: 'second' });

    await expect(first).resolves.toBe('cancel');

    useOverlayStore.getState().resolveUnsavedChanges('keep');
    await expect(second).resolves.toBe('keep');
  });
});

describe('overlayStore.showToast', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('相同 key 会复用 toast，并以最后一次触发时间重新计时（刷新 createdAt）', () => {
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValueOnce(1000);
    const id1 = useOverlayStore.getState().showToast({ message: 'A', key: 'save' });
    expect(useOverlayStore.getState().toasts).toHaveLength(1);
    expect(useOverlayStore.getState().toasts[0].createdAt).toBe(1000);

    now.mockReturnValueOnce(2000);
    const id2 = useOverlayStore.getState().showToast({ message: 'B', key: 'save' });
    expect(id2).toBe(id1);
    expect(useOverlayStore.getState().toasts).toHaveLength(1);
    expect(useOverlayStore.getState().toasts[0].message).toBe('B');
    expect(useOverlayStore.getState().toasts[0].createdAt).toBe(2000);
  });
});
