# 导入功能实现总结

## 实现目标

✅ 实现从 webdav、zip 文件导入逻辑的统一、复用  
✅ 增加新功能：让用户选择导入模式：合并（默认）导入或覆盖导入（清空后再导入）  
✅ 合并导入模式细节：合并的粒度是版本，判断项目、版本是否存在的依据是 uuid  

## 实现方案

### 1. 新增文件

#### `src/services/importService.ts`
- 统一的导入服务实现
- 支持从 ZIP 文件和 WebDAV 导入
- 实现合并和覆盖两种模式
- 提供进度回调支持

#### `src/types/import.ts`
- 导入相关类型定义
- `ImportMode`：导入模式枚举
- `ImportOptions`：导入选项接口
- `ImportResult`：导入结果接口
- `ImportProgressCallback`：进度回调类型

#### `tests/unit/importService.test.ts`
- 导入服务的单元测试
- 测试合并和覆盖模式
- 测试进度回调功能

#### `docs/IMPORT-SERVICE.md`
- 导入服务使用指南
- 详细的 API 文档和使用示例

### 2. 修改文件

#### `src/services/exportService.ts`
- 更新 `importFromJSON` 方法，使用新的导入服务
- 更新 `importFromZip` 方法，使用新的导入服务
- 支持进度回调
- 支持导入模式选择

#### `src/services/webdavService.ts`
- 更新 `restoreFromWebDAV` 方法，使用新的导入服务
- 支持进度回调
- 支持导入模式选择
- 移除重复的导入逻辑

## 核心功能

### 1. 统一导入逻辑

通过 `ImportService` 类实现了统一的导入逻辑：

```typescript
class ImportService {
  // 从 ZIP 文件导入
  async importFromZip(file: File, options: ImportOptions, onProgress?: ImportProgressCallback): Promise<ImportResult>
  
  // 从 WebDAV 导入
  async importFromWebDAV(webdavService: any, remotePath: string, options: ImportOptions, onProgress?: ImportProgressCallback): Promise<ImportResult>
}
```

### 2. 导入模式

#### 合并模式（merge）
- **默认模式**
- 根据 UUID 判断数据是否存在
- 只导入不存在的数据
- 保留现有数据

#### 覆盖模式（overwrite）
- 清空现有数据后导入
- 适用于完全替换数据的场景

### 3. 导入粒度

- **项目级别**：根据项目 UUID 判断
- **版本级别**：根据版本 UUID 判断（合并的粒度是版本）
- **文件夹、代码片段、附件**：根据各自 UUID 判断

### 4. 进度回调

提供详细的导入进度信息：

```typescript
type ImportProgressCallback = (progress: {
  current: number;        // 当前进度
  total: number;          // 总进度
  stage: string;          // 当前阶段
  message: string;        // 进度消息
}) => void;
```

### 5. 导入结果

返回详细的导入结果：

```typescript
interface ImportResult {
  success: boolean;       // 是否成功
  message: string;        // 结果消息
  imported: {
    projects: number;     // 导入的项目数量
    folders: number;      // 导入的文件夹数量
    versions: number;     // 导入的版本数量
    snippets: number;     // 导入的代码片段数量
    attachments: number;  // 导入的附件数量
  };
}
```

## 使用示例

### 从 ZIP 文件导入

```typescript
import { exportService } from '@/services/exportService';

// 合并导入（默认）
await exportService.importFromZip(file, { mode: 'merge' }, (progress) => {
  console.log(`导入进度: ${progress.message}`);
});

// 覆盖导入
await exportService.importFromZip(file, { mode: 'overwrite' }, (progress) => {
  console.log(`导入进度: ${progress.message}`);
});
```

### 从 WebDAV 导入

```typescript
import { webdavService } from '@/services/webdavService';

// 合并导入（默认）
await webdavService.restoreFromWebDAV(remotePath, { mode: 'merge' }, (progress) => {
  console.log(`导入进度: ${progress.message}`);
});

// 覆盖导入
await webdavService.restoreFromWebDAV(remotePath, { mode: 'overwrite' }, (progress) => {
  console.log(`导入进度: ${progress.message}`);
});
```

## 代码复用

### 1. WebDAV 导入复用 ZIP 导入逻辑

WebDAV 导入通过以下方式复用 ZIP 导入逻辑：

```typescript
async importFromWebDAV(webdavService: any, remotePath: string, options: ImportOptions, onProgress?: ImportProgressCallback): Promise<ImportResult> {
  // 1. 从 WebDAV 下载文件
  const arrayBuffer = await webdavService.client.getFileContents(remotePath, { format: 'binary' });
  
  // 2. 转换为 File 对象
  const file = new File([arrayBuffer], 'backup.zip', { type: 'application/zip' });
  
  // 3. 复用 ZIP 导入逻辑
  return await this.importFromZip(file, options, onProgress);
}
```

### 2. JSON 导入复用 ZIP 导入逻辑

JSON 导入通过以下方式复用 ZIP 导入逻辑：

```typescript
async importFromJSON(file: File, options: ImportOptions = { mode: 'merge' }, onProgress?: ImportProgressCallback): Promise<void> {
  // 1. 解析 JSON 数据
  const text = await file.text();
  const data = JSON.parse(text);
  
  // 2. 转换为 ZIP 格式
  const zip = new JSZip();
  // ... 添加数据到 ZIP
  const blob = await zip.generateAsync({ type: 'blob' });
  const zipFile = new File([blob], 'import.zip', { type: 'application/zip' });
  
  // 3. 复用 ZIP 导入逻辑
  const result = await importService.importFromZip(zipFile, options, onProgress);
}
```

## 优势

1. **代码复用**：统一的导入逻辑避免了重复代码
2. **易于维护**：导入逻辑集中在一个服务中
3. **功能完整**：支持多种导入模式和进度回调
4. **类型安全**：完整的 TypeScript 类型定义
5. **易于测试**：独立的服务便于单元测试

## 后续优化建议

1. **性能优化**：对于大量数据的导入，可以考虑分批处理
2. **错误恢复**：支持部分失败时的恢复机制
3. **导入预览**：在导入前显示将要导入的数据概览
4. **冲突解决**：提供更细粒度的冲突解决策略