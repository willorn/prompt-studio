import { useMemo, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { MinimalButton } from '@/components/common/MinimalButton';
import type { DraftData, SnapshotData } from '@/services/draftService';
import { computeContentHash } from '@/utils/hash';
import { useI18nStore } from '@/store/i18nStore';
import { useTranslation } from '@/i18n/I18nContext';
import { InlineDiffViewer } from '@/components/common/InlineDiffViewer';

export interface DraftSwitchDialogProps {
  open: boolean;
  snapshot: SnapshotData & { displayName: string };
  draft: DraftData;
  onRestoreAndOpen: () => void;
  onDiscardAndOpen: () => void;
  onCancelSwitch: () => void;
}

export function DraftSwitchDialog({
  open,
  snapshot,
  draft,
  onRestoreAndOpen,
  onDiscardAndOpen,
  onCancelSwitch,
}: DraftSwitchDialogProps) {
  const t = useTranslation();
  const currentLocale = useI18nStore((s) => s.currentLocale);
  // 默认展开差异：用户进入弹窗的核心诉求就是“先看差异再决定怎么打开”
  const [showInlineDiff, setShowInlineDiff] = useState(true);

  const formatDateTime = (timestamp: number | null) => {
    if (!timestamp) return t('common.unknown');
    return new Date(timestamp).toLocaleString(currentLocale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const baseChanged = useMemo(() => {
    return draft.baseContentHash !== computeContentHash(snapshot.content);
  }, [draft.baseContentHash, snapshot.content]);

  if (!open) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onCancelSwitch}
      title={t('pages.mainView.drafts.switchTitle')}
      // 弹窗宽度至少为当前的 2 倍以上：直接按视口宽度给一个大幅度空间（更接近“对比弹窗”的可读性）
      size="large"
      panelClassName="w-[92vw] max-w-[92vw]"
    >
      <div className="space-y-3">
        <p className="text-sm text-surface-onVariant dark:text-surface-onVariantDark">
          {t('pages.mainView.drafts.switchDescription')}
        </p>

        <div className="rounded-lg border border-border dark:border-border-dark bg-background dark:bg-background-dark p-3 text-xs text-surface-onVariant dark:text-surface-onVariantDark space-y-1">
          <div>
            {t('pages.mainView.drafts.snapshot')}: {snapshot.displayName}{' '}
            <span className="opacity-80">({formatDateTime(snapshot.updatedAt)})</span>
          </div>
          <div>
            {t('pages.mainView.drafts.draft')}: <span className="opacity-80">{formatDateTime(draft.draftUpdatedAt)}</span>
          </div>
          {baseChanged && (
            <div className="text-warning">{t('pages.mainView.drafts.baseChangedHint')}</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <MinimalButton
            variant="ghost"
            onClick={() => setShowInlineDiff((v) => !v)}
            className="px-3 py-2 text-sm"
          >
            {showInlineDiff
              ? t('pages.mainView.drafts.hideDiff')
              : t('pages.mainView.drafts.viewDiff')}
          </MinimalButton>
        </div>

        {showInlineDiff && (
          <InlineDiffViewer
            // key 绑定 locale：避免切换语言后 Monaco 内部文案/布局不刷新
            key={currentLocale}
            original={snapshot.content}
            modified={draft.content}
            height={420}
          />
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <MinimalButton variant="ghost" onClick={onCancelSwitch} className="px-4 py-2">
            {t('pages.mainView.drafts.cancelSwitch')}
          </MinimalButton>
          <MinimalButton variant="ghost" onClick={onDiscardAndOpen} className="px-4 py-2">
            {t('pages.mainView.drafts.discardAndOpen')}
          </MinimalButton>
          <MinimalButton variant="default" onClick={onRestoreAndOpen} className="px-4 py-2" autoFocus>
            {t('pages.mainView.drafts.restoreAndOpen')}
          </MinimalButton>
        </div>
      </div>
    </Modal>
  );
}
