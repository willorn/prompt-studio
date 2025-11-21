import React, { useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useUiStore } from '@/store/uiStore';
import { Button } from '@/components/common/Button';
import { FolderTree } from './FolderTree';

const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { loadFolders, loadProjects, createFolder, createProject, selectProject } = useProjectStore();

  useEffect(() => {
    loadFolders();
    loadProjects();
  }, [loadFolders, loadProjects]);

  const handleCreateFolder = async () => {
    const folderName = prompt('请输入文件夹名称:');
    if (folderName && folderName.trim()) {
      await createFolder(folderName.trim(), null);
      await loadFolders();
    }
  };

  const handleCreateProject = async () => {
    const projectName = prompt('请输入项目名称:');
    if (projectName && projectName.trim()) {
      // 查找或创建默认根文件夹
      let rootFolderId = 'root';
      await loadFolders();
      
      // 创建项目和初始根版本
      const projectId = await createProject(projectName.trim(), rootFolderId);
      await loadProjects();
      
      // 自动选择新创建的项目
      selectProject(projectId);
    }
  };

  if (sidebarCollapsed) {
    return (
      <div className="w-16 bg-surface-variant border-r border-surface-onVariant/20 flex flex-col items-center py-4">
        <button
          onClick={toggleSidebar}
          className="w-8 h-8 p-0 flex items-center justify-center rounded-m3-small transition-colors hover:bg-surface-containerHighest"
          aria-label="展开侧边栏"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-surface-variant border-r border-surface-onVariant/20 flex flex-col">
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">项目</h2>
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 p-0 flex items-center justify-center rounded-m3-small transition-colors hover:bg-surface-containerHighest"
            aria-label="折叠侧边栏"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 justify-center">
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleCreateFolder} 
            className="w-10 h-10 p-0 flex items-center justify-center relative" 
            title="新建文件夹"
          >
            <span className="text-base leading-none">📁</span>
            <span className="absolute top-0 right-1 text-base leading-none font-bold opacity-70">+</span>
          </Button>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleCreateProject} 
            className="w-10 h-10 p-0 flex items-center justify-center relative" 
            title="新建项目"
          >
            <span className="text-base leading-none">📄</span>
            <span className="absolute top-0 right-1 text-base leading-none font-bold opacity-70">+</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <FolderTree />
      </div>
    </div>
  );
};

export default Sidebar;
