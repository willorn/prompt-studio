import { describe, expect, it, afterEach } from 'vitest';
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
