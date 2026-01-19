import { useMemo } from 'react';
import type { DraftData, SnapshotData } from '@/services/draftService';
import { computeContentHash } from '@/utils/hash';
import { useTranslation } from '@/i18n/I18nContext';
import { useI18nStore } from '@/store/i18nStore';
import { MinimalButton } from '@/components/common/MinimalButton';

export interface DraftBannerProps {
  snapshot: SnapshotData & { displayName: string };
  draft: DraftData;
  onResumeEditing: () => void;
  onDiscardDraft: () => void;
  onViewDiff: () => void;
  onDismiss: () => void;
}

export function DraftBanner({
  snapshot,
  draft,
  onResumeEditing,
  onDiscardDraft,
  onViewDiff,
  onDismiss,
}: DraftBannerProps) {
  const t = useTranslation();
  const currentLocale = useI18nStore((s) => s.currentLocale);

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
    // 用内容 hash 判断“基准是否变化”，避免 updatedAt 变化但内容未变导致误报
    return draft.baseContentHash !== computeContentHash(snapshot.content);
  }, [draft.baseContentHash, snapshot.content]);

  return (
    <div className="rounded-xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-surface-onSurface dark:text-surface-onSurfaceDark">
            {t('pages.mainView.drafts.bannerTitle')}
          </div>
          <div className="mt-1 text-xs text-surface-onVariant dark:text-surface-onVariantDark space-y-1">
            <div>
              {t('pages.mainView.drafts.snapshot')}: {snapshot.displayName}{' '}
              <span className="opacity-80">({formatDateTime(snapshot.updatedAt)})</span>
            </div>
            <div>
              {t('pages.mainView.drafts.draft')}: <span className="opacity-80">{formatDateTime(draft.draftUpdatedAt)}</span>
            </div>
            {baseChanged && (
              <div className="text-warning">
                {t('pages.mainView.drafts.baseChangedHint')}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          className="text-surface-onVariant dark:text-surface-onVariantDark hover:text-surface-onSurface dark:hover:text-surface-onSurfaceDark"
          onClick={onDismiss}
          aria-label={t('common.close')}
        >
          ×
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <MinimalButton variant="ghost" onClick={onViewDiff} className="px-3 py-2 text-sm">
          {t('pages.mainView.drafts.viewDiff')}
        </MinimalButton>
        <MinimalButton variant="ghost" onClick={onDiscardDraft} className="px-3 py-2 text-sm">
          {t('pages.mainView.drafts.discardDraftSimple')}
        </MinimalButton>
        <MinimalButton variant="default" onClick={onResumeEditing} className="px-3 py-2 text-sm">
          {t('pages.mainView.drafts.resumeEditing')}
        </MinimalButton>
      </div>

      <div className="mt-2 text-xs text-surface-onVariant dark:text-surface-onVariantDark">
        {t('pages.mainView.drafts.bannerHelp')}
      </div>
    </div>
  );
}

