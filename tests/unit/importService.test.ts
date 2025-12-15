/**
 * 导入服务单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { importService } from '@/services/importService';
import { db } from '@/db/schema';
import JSZip from 'jszip';
import type { ImportOptions, ImportProgressCallback } from '@/types/import';

// Mock dexie
vi.mock('@/db/schema', () => ({
  db: {
    projects: {
      toCollection: vi.fn().mockReturnThis(),
      primaryKeys: vi.fn(),
      bulkPut: vi.fn(),
      clear: vi.fn(),
    },
    folders: {
      toCollection: vi.fn().mockReturnThis(),
      primaryKeys: vi.fn(),
      bulkPut: vi.fn(),
      clear: vi.fn(),
    },
    versions: {
      toCollection: vi.fn().mockReturnThis(),
      primaryKeys: vi.fn(),
      bulkPut: vi.fn(),
      clear: vi.fn(),
    },
    snippets: {
      toCollection: vi.fn().mockReturnThis(),
      primaryKeys: vi.fn(),
      bulkPut: vi.fn(),
      clear: vi.fn(),
    },
    attachments: {
      toCollection: vi.fn().mockReturnThis(),
      primaryKeys: vi.fn(),
      bulkPut: vi.fn(),
      clear: vi.fn(),
    },
    transaction: vi.fn(),
  },
}));

// Mock storage
vi.mock('@/utils/storage', () => ({
  storage: {
    set: vi.fn(),
    get: vi.fn(),
  },
}));

describe('ImportService', () => {
  beforeEach(async () => {
    // 清空数据库模拟
    vi.clearAllMocks();
  });

  describe('importFromZip', () => {
    it('should import data in merge mode', async () => {
      // Mock existing data
      (db.projects.toCollection().primaryKeys as any).mockResolvedValue(['existing-project-id']);
      (db.folders.toCollection().primaryKeys as any).mockResolvedValue(['existing-folder-id']);
      (db.versions.toCollection().primaryKeys as any).mockResolvedValue(['existing-version-id']);
      (db.snippets.toCollection().primaryKeys as any).mockResolvedValue(['existing-snippet-id']);
      (db.attachments.toCollection().primaryKeys as any).mockResolvedValue(['existing-attachment-id']);

      // Mock zip file
      const zip = new JSZip();
      zip.file('projects.json', JSON.stringify([
        { id: 'existing-project-id', name: 'Existing Project' },
        { id: 'new-project-id', name: 'New Project' }
      ]));
      zip.file('folders.json', JSON.stringify([
        { id: 'new-folder-id', name: 'New Folder' }
      ]));
      zip.file('versions.json', JSON.stringify([
        { id: 'new-version-id', projectId: 'new-project-id', content: 'test' }
      ]));
      zip.file('snippets.json', JSON.stringify([
        { id: 'new-snippet-id', name: 'New Snippet' }
      ]));
      zip.file('attachments.json', JSON.stringify([
        { id: 'new-attachment-id', versionId: 'new-version-id', fileName: 'test.txt' }
      ]));
      zip.file('settings.json', JSON.stringify({}));

      const options: ImportOptions = { mode: 'merge' };
      const result = await importService.importFromZip(new File([], 'test.zip'), options);

      expect(result.success).toBe(true);
      expect(result.imported.projects).toBe(1); // 只导入新的项目
      expect(result.imported.folders).toBe(1);
      expect(result.imported.versions).toBe(1);
      expect(result.imported.snippets).toBe(1);
      expect(result.imported.attachments).toBe(1);
    });

    it('should import data in overwrite mode', async () => {
      const zip = new JSZip();
      zip.file('projects.json', JSON.stringify([{ id: 'project-1', name: 'Project 1' }]));
      zip.file('folders.json', JSON.stringify([{ id: 'folder-1', name: 'Folder 1' }]));
      zip.file('versions.json', JSON.stringify([{ id: 'version-1', projectId: 'project-1', content: 'test' }]));
      zip.file('snippets.json', JSON.stringify([{ id: 'snippet-1', name: 'Snippet 1' }]));
      zip.file('attachments.json', JSON.stringify([{ id: 'attachment-1', versionId: 'version-1', fileName: 'test.txt' }]));
      zip.file('settings.json', JSON.stringify({}));

      const options: ImportOptions = { mode: 'overwrite' };
      const result = await importService.importFromZip(new File([], 'test.zip'), options);

      expect(result.success).toBe(true);
      expect(db.projects.clear).toHaveBeenCalled();
      expect(db.folders.clear).toHaveBeenCalled();
      expect(db.versions.clear).toHaveBeenCalled();
      expect(db.snippets.clear).toHaveBeenCalled();
      expect(db.attachments.clear).toHaveBeenCalled();
    });

    it('should handle progress callback', async () => {
      const progressCallback = vi.fn();
      
      const zip = new JSZip();
      zip.file('projects.json', JSON.stringify([{ id: 'project-1', name: 'Project 1' }]));
      zip.file('folders.json', JSON.stringify([{ id: 'folder-1', name: 'Folder 1' }]));
      zip.file('versions.json', JSON.stringify([{ id: 'version-1', projectId: 'project-1', content: 'test' }]));
      zip.file('snippets.json', JSON.stringify([{ id: 'snippet-1', name: 'Snippet 1' }]));
      zip.file('attachments.json', JSON.stringify([{ id: 'attachment-1', versionId: 'version-1', fileName: 'test.txt' }]));
      zip.file('settings.json', JSON.stringify({}));

      const options: ImportOptions = { mode: 'merge' };
      await importService.importFromZip(new File([], 'test.zip'), options, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('importFromWebDAV', () => {
    it('should import from WebDAV', async () => {
      const mockWebDAVService = {
        client: {
          getFileContents: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
        },
      };

      const options: ImportOptions = { mode: 'merge' };
      const result = await importService.importFromWebDAV(mockWebDAVService, '/path/to/file.zip', options);

      expect(result.success).toBe(true);
      expect(mockWebDAVService.client.getFileContents).toHaveBeenCalled();
    });
  });
});