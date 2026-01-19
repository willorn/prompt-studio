/**
 * 草稿（Draft）服务
 * - 以 localStorage 为第一落点（同步写入，可靠）
 * - 按 projectId + versionId 分桶；versionId 为空时使用 __new__
 *
 * 交互规范：docs/INTERACTION-DRAFTS.md
 */

import { storage } from '@/utils/storage';
import { computeContentHash } from '@/utils/hash';

const DRAFTS_PREFIX = 'promptStudio.drafts.v1';
const NEW_VERSION_BUCKET = '__new__';

export interface DraftData {
  projectId: string;
  versionId: string | null;
  content: string;
  versionName: string;
  draftUpdatedAt: number;

  // 基准版本信息：用于提示“草稿基于旧快照”
  baseUpdatedAt: number | null;
  baseContentHash: string;
}

export interface SnapshotData {
  content: string;
  versionName: string;
  updatedAt: number | null;
}

export function getDraftStorageKey(projectId: string, versionId: string | null): string {
  const bucket = versionId ?? NEW_VERSION_BUCKET;
  return `${DRAFTS_PREFIX}.${projectId}.${bucket}`;
}

export function isDraftDifferentFromSnapshot(draft: DraftData, snapshot: SnapshotData): boolean {
  return draft.content !== snapshot.content || draft.versionName !== snapshot.versionName;
}

export const draftService = {
  saveDraft: (params: {
    projectId: string;
    versionId: string | null;
    content: string;
    versionName: string;
    baseUpdatedAt: number | null;
    baseContent: string;
  }): DraftData => {
    const now = Date.now();
    const draft: DraftData = {
      projectId: params.projectId,
      versionId: params.versionId,
      content: params.content,
      versionName: params.versionName,
      draftUpdatedAt: now,
      baseUpdatedAt: params.baseUpdatedAt,
      baseContentHash: computeContentHash(params.baseContent),
    };

    storage.set(getDraftStorageKey(params.projectId, params.versionId), draft);
    return draft;
  },

  getDraft: (projectId: string, versionId: string | null): DraftData | null => {
    const key = getDraftStorageKey(projectId, versionId);
    const draft = storage.get<DraftData | null>(key, null);
    if (!draft) return null;

    // 轻量校验：避免旧数据/脏数据导致崩溃
    if (
      typeof draft.projectId !== 'string' ||
      typeof draft.content !== 'string' ||
      typeof draft.versionName !== 'string' ||
      typeof draft.draftUpdatedAt !== 'number' ||
      typeof draft.baseContentHash !== 'string'
    ) {
      return null;
    }

    return draft;
  },

  deleteDraft: (projectId: string, versionId: string | null) => {
    storage.remove(getDraftStorageKey(projectId, versionId));
  },
};
