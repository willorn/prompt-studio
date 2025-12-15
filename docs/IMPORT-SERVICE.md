# 导入服务使用指南

## 概述

新的导入服务实现了从 WebDAV 和 ZIP 文件导入逻辑的统一和复用，并新增了合并导入和覆盖导入两种模式。

## 功能特性

- ✅ 统一的导入逻辑，支持 WebDAV 和 ZIP 文件
- ✅ 合并导入模式（默认）：根据 UUID 判断项目和版本是否存在，只导入新数据
- ✅ 覆盖导入模式：清空现有数据后导入
- ✅ 导入进度回调支持
- ✅ 完整的导入结果反馈

## 使用方法

### 1. 从 ZIP 文件导入

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

### 2. 从 WebDAV 导入

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

### 3. 从 JSON 文件导入

```typescript
import { exportService } from '@/services/exportService';

// 合并导入（默认）
await exportService.importFromJSON(file, { mode: 'merge' }, (progress) => {
  console.log(`导入进度: ${progress.message}`);
});
```

## 导入模式说明

### 合并导入（merge）

- **默认模式**
- 根据 UUID 判断项目和版本是否存在
- 只导入不存在的数据
- 保留现有数据，避免覆盖

### 覆盖导入（overwrite）

- 清空现有数据后导入
- 适用于完全替换数据的场景
- 需要用户确认操作

## 导入粒度

- **项目级别**：根据项目 UUID 判断
- **版本级别**：根据版本 UUID 判断
- **文件夹、代码片段、附件**：根据各自 UUID 判断

## 进度回调

进度回调函数提供详细的导入进度信息：

```typescript
type ImportProgressCallback = (progress: {
  current: number;        // 当前进度
  total: number;          // 总进度
  stage: string;          // 当前阶段
  message: string;        // 进度消息
}) => void;
```

### 导入阶段

1. **projects** - 项目导入
2. **folders** - 文件夹导入
3. **versions** - 版本导入
4. **snippets** - 代码片段导入
5. **attachments** - 附件导入
6. **settings** - 设置导入

## 导入结果

导入完成后返回 `ImportResult` 对象：

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

## 注意事项

1. **UUID 唯一性**：导入依赖于数据的 UUID 字段进行去重判断
2. **数据完整性**：导入过程会保持数据的完整性
3. **错误处理**：导入失败时会抛出错误，需要适当处理
4. **性能考虑**：大量数据导入时建议使用进度回调

## 文件结构

```
src/
├── services/
│   ├── importService.ts      # 统一的导入服务
│   ├── exportService.ts      # 导出服务（已更新）
│   └── webdavService.ts      # WebDAV 服务（已更新）
└── types/
    └── import.ts             # 导入相关类型定义