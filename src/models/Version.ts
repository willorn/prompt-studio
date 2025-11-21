export interface Version {
  id: string;
  projectId: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
  content: string;
  normalizedContent: string;
  contentHash: string;
  name?: string; // 版本名称，可选
  score?: number;
}
