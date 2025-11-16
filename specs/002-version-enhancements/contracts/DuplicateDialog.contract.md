# Component Contract: DuplicateDialog

**Type**: React Functional Component  
**Purpose**: 重复内容提醒对话框

---

## Props Interface

```typescript
interface DuplicateDialogProps {
  /** 对话框是否打开 */
  isOpen: boolean;
  
  /** 已存在的重复版本 */
  duplicateVersion: Version | null;
  
  /** 用户选择"仍然创建"的回调 */
  onConfirm: () => void;
  
  /** 用户选择"取消"的回调 */
  onCancel: () => void;
}
```

---

## 行为规范

### 显示逻辑
- `isOpen === true && duplicateVersion !== null`: 显示对话框
- 其他情况: 隐藏

### 按钮行为
- **取消**: 调用`onCancel()`，关闭对话框
- **仍然创建**: 调用`onConfirm()`，允许创建重复版本

### 快捷键
- ESC: 等同于"取消"
- Enter: 等同于"仍然创建"(需明确focus)

---

## 样式规范 (M3 AlertDialog)

```typescript
<Modal isOpen={isOpen} onClose={onCancel}>
  <div className="bg-surface rounded-m3-extra-large p-6 max-w-md">
    {/* 图标 */}
    <div className="flex items-center gap-3 mb-4">
      <WarningIcon className="text-warning text-3xl" />
      <h2 className="text-xl font-bold">检测到重复内容</h2>
    </div>
    
    {/* 内容 */}
    <div className="mb-6">
      <p className="text-surface-onSurface mb-3">
        已存在相同内容的版本：
      </p>
      
      {duplicateVersion && (
        <div className="bg-surface-variant rounded-m3-medium p-3">
          <p className="text-sm">
            <span className="font-semibold">版本 ID:</span>{' '}
            {duplicateVersion.id}
          </p>
          <p className="text-sm text-surface-onVariant">
            创建于 {formatDate(duplicateVersion.createdAt)}
          </p>
        </div>
      )}
      
      <p className="text-sm text-surface-onVariant mt-3">
        是否仍要创建新版本？
      </p>
    </div>
    
    {/* 按钮 */}
    <div className="flex gap-3 justify-end">
      <Button variant="text" onClick={onCancel}>
        取消
      </Button>
      <Button variant="outlined" onClick={onConfirm}>
        仍然创建
      </Button>
    </div>
  </div>
</Modal>
```

---

## 使用示例

```typescript
import { DuplicateDialog } from '@/components/common/DuplicateDialog';
import { useVersionStore } from '@/store/versionStore';

function EditorToolbar() {
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateVersion, setDuplicateVersion] = useState<Version | null>(null);
  
  const { createVersion, checkDuplicate } = useVersionStore();
  
  const handleSave = async () => {
    const duplicate = await checkDuplicate(editorContent, projectId);
    
    if (duplicate) {
      setDuplicateVersion(duplicate);
      setShowDuplicateDialog(true);
    } else {
      await createVersion(projectId, editorContent, parentId);
    }
  };
  
  const handleConfirmCreate = async () => {
    await createVersion(projectId, editorContent, parentId);
    setShowDuplicateDialog(false);
  };
  
  return (
    <>
      <button onClick={handleSave}>保存</button>
      
      <DuplicateDialog
        isOpen={showDuplicateDialog}
        duplicateVersion={duplicateVersion}
        onConfirm={handleConfirmCreate}
        onCancel={() => setShowDuplicateDialog(false)}
      />
    </>
  );
}
```

---

## 测试要点

- [ ] 对话框正确显示重复版本信息
- [ ] "取消"按钮关闭对话框且不创建版本
- [ ] "仍然创建"按钮创建版本且关闭对话框
- [ ] ESC键等同于"取消"
- [ ] 显示/隐藏动画流畅

---

## 性能要求

- **渲染时间**: <100ms
- **动画流畅度**: 60fps
