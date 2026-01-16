import { useEffect, useMemo, useState } from 'react';
import { useOverlayStore, type ToastVariant } from '@/store/overlayStore';
import { Modal } from '@/components/common/Modal';
import { MinimalButton } from '@/components/common/MinimalButton';
import { Input } from '@/components/common/Input';

const getToastClasses = (variant: ToastVariant) => {
  switch (variant) {
    case 'success':
      return 'border-green-500/30 bg-green-500/10';
    case 'warning':
      return 'border-yellow-500/30 bg-yellow-500/10';
    case 'error':
      return 'border-error/30 bg-error/10';
    case 'info':
    default:
      return 'border-border dark:border-border-dark bg-surface dark:bg-surface-dark';
  }
};

export const OverlayHost: React.FC = () => {
  const toasts = useOverlayStore((s) => s.toasts);

  const confirm = useOverlayStore((s) => s.confirm);
  const resolveConfirm = useOverlayStore((s) => s.resolveConfirm);

  const prompt = useOverlayStore((s) => s.prompt);
  const resolvePrompt = useOverlayStore((s) => s.resolvePrompt);

  const unsavedChanges = useOverlayStore((s) => s.unsavedChanges);
  const resolveUnsavedChanges = useOverlayStore((s) => s.resolveUnsavedChanges);

  const [promptValue, setPromptValue] = useState('');
  const [promptError, setPromptError] = useState<string | null>(null);

  useEffect(() => {
    if (!prompt) return;
    setPromptValue(prompt.initialValue ?? '');
    setPromptError(null);
  }, [prompt]);

  const canSubmitPrompt = useMemo(() => {
    if (!prompt) return false;
    if (!prompt.validate) return true;
    return prompt.validate(promptValue) === null;
  }, [prompt, promptValue]);

  const handleSubmitPrompt = () => {
    if (!prompt) return;
    const error = prompt.validate ? prompt.validate(promptValue) : null;
    if (error) {
      setPromptError(error);
      return;
    }
    resolvePrompt(promptValue);
  };

  return (
    <>
      {/* Toast 区域：不阻塞操作，固定在右下角 */}
      <div
        className="fixed z-[60] bottom-4 right-4 flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            message={toast.message}
            durationMs={toast.durationMs}
            createdAt={toast.createdAt}
            className={getToastClasses(toast.variant)}
          />
        ))}
      </div>

      {/* Confirm */}
      <Modal
        isOpen={!!confirm}
        onClose={() => resolveConfirm(false)}
        title={confirm?.title}
        size="small"
      >
        {confirm?.description && (
          <p className="text-sm text-surface-onVariant dark:text-surface-onVariantDark">
            {confirm.description}
          </p>
        )}
        <div className="mt-6 flex items-center justify-end gap-2">
          <MinimalButton
            variant="ghost"
            onClick={() => resolveConfirm(false)}
            className="px-4 py-2"
          >
            {confirm?.cancelText ?? '取消'}
          </MinimalButton>
          <MinimalButton
            variant={confirm?.variant === 'danger' ? 'danger' : 'default'}
            onClick={() => resolveConfirm(true)}
            className="px-4 py-2"
          >
            {confirm?.confirmText ?? '确定'}
          </MinimalButton>
        </div>
      </Modal>

      {/* Prompt */}
      <Modal
        isOpen={!!prompt}
        onClose={() => resolvePrompt(null)}
        title={prompt?.title}
        size="small"
      >
        {prompt?.description && (
          <p className="text-sm text-surface-onVariant dark:text-surface-onVariantDark mb-4">
            {prompt.description}
          </p>
        )}
        <Input
          label={prompt?.label}
          placeholder={prompt?.placeholder}
          value={promptValue}
          onChange={(e) => {
            setPromptValue(e.target.value);
            setPromptError(null);
          }}
          error={promptError ?? undefined}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmitPrompt();
            }
          }}
        />
        <div className="mt-6 flex items-center justify-end gap-2">
          <MinimalButton variant="ghost" onClick={() => resolvePrompt(null)} className="px-4 py-2">
            {prompt?.cancelText ?? '取消'}
          </MinimalButton>
          <MinimalButton
            variant="default"
            onClick={handleSubmitPrompt}
            className="px-4 py-2"
            disabled={!canSubmitPrompt}
          >
            {prompt?.confirmText ?? '确定'}
          </MinimalButton>
        </div>
      </Modal>

      {/* Unsaved Changes */}
      <Modal
        isOpen={!!unsavedChanges}
        onClose={() => resolveUnsavedChanges('cancel')}
        title={unsavedChanges?.title}
        size="small"
      >
        {unsavedChanges?.description && (
          <p className="text-sm text-surface-onVariant dark:text-surface-onVariantDark">
            {unsavedChanges.description}
          </p>
        )}
        <div className="mt-6 flex items-center justify-end gap-2">
          <MinimalButton
            variant="ghost"
            onClick={() => resolveUnsavedChanges('cancel')}
            className="px-4 py-2"
          >
            {unsavedChanges?.cancelText ?? '取消'}
          </MinimalButton>
          <MinimalButton
            variant="danger"
            onClick={() => resolveUnsavedChanges('discard')}
            className="px-4 py-2"
          >
            {unsavedChanges?.discardText ?? '丢弃'}
          </MinimalButton>
          <MinimalButton
            variant="default"
            onClick={() => resolveUnsavedChanges('keep')}
            className="px-4 py-2"
            autoFocus
          >
            {unsavedChanges?.keepText ?? '保留'}
          </MinimalButton>
        </div>
      </Modal>
    </>
  );
};

const ToastItem: React.FC<{
  id: string;
  message: string;
  durationMs: number;
  createdAt: number;
  className: string;
}> = ({ id, message, durationMs, createdAt, className }) => {
  const dismissToast = useOverlayStore((s) => s.dismissToast);

  useEffect(() => {
    if (!durationMs || durationMs <= 0) return;
    // createdAt 变化时，重新开始计时：用于“从最后一次触发开始计时”的 toast 体验
    const timer = window.setTimeout(() => dismissToast(id), durationMs);
    return () => window.clearTimeout(timer);
  }, [createdAt, dismissToast, durationMs, id]);

  return (
    <div
      className={`pointer-events-auto max-w-sm w-[360px] rounded-xl border shadow-lg px-4 py-3 text-sm text-surface-onSurface dark:text-surface-onSurfaceDark ${className}`}
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 whitespace-pre-wrap break-words">{message}</div>
        <button
          type="button"
          className="text-surface-onVariant dark:text-surface-onVariantDark hover:text-surface-onSurface dark:hover:text-surface-onSurfaceDark"
          onClick={() => dismissToast(id)}
          aria-label="关闭提示"
        >
          ×
        </button>
      </div>
    </div>
  );
};
