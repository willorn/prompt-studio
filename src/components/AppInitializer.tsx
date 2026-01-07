/**
 * 应用初始化组件
 * 负责初始化示例数据并自动加载到UI
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { initializeSampleData } from '@/services/initializeSampleData';
import { useProjectStore } from '@/store/projectStore';
import { useVersionStore } from '@/store/versionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTranslation } from '@/i18n/I18nContext';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { db } from '@/db/schema';
import { applyThemeColor } from '@/theme/themeColor';

interface AppInitializerProps {
  children: React.ReactNode;
}

/**
 * 从 URL hash 中解析项目 ID
 * 格式: #/project/{projectId}
 */
const getProjectIdFromUrl = (): string | null => {
  const hash = window.location.hash;
  if (!hash) return null;

  const match = hash.match(/^#\/project\/(.+)$/);
  return match ? match[1] : null;
};

export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { loadProjects, setCurrentProject, loadFolders, expandFolderPathToProject } = useProjectStore();
  const { loadVersions } = useVersionStore();
  const { theme, themeColor } = useSettingsStore();
  const t = useTranslation();

  // 使用 ref 确保初始化只执行一次（防止 React 18 严格模式下的双重调用）
  const hasInitialized = useRef(false);

  // 主题管理
  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme === 'dark');
  }, [theme]);

  // 主题色管理（写入 CSS 变量，供 Tailwind & 运行时代码共享）
  useEffect(() => {
    applyThemeColor(themeColor);
  }, [themeColor]);

  // 处理从 URL 打开项目的函数
  const handleOpenProjectFromUrl = useCallback(async (projectId: string) => {
    setCurrentProject(projectId);
    await expandFolderPathToProject(projectId);
    await loadVersions(projectId);
  }, [setCurrentProject, expandFolderPathToProject, loadVersions]);

  useEffect(() => {
    // 如果已经初始化过，直接返回
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    const initialize = async () => {
      // 初始化示例数据
      const sampleProjectId = await initializeSampleData();

      // 加载文件夹和项目
      await loadFolders();
      await loadProjects();

      // 检查 URL 中是否有项目 ID 参数
      const urlProjectId = getProjectIdFromUrl();

      if (urlProjectId) {
        // 验证项目是否存在
        const project = await db.projects.get(urlProjectId);
        if (project) {
          // 项目存在，打开它
          await handleOpenProjectFromUrl(urlProjectId);
        } else {
          // 项目不存在，提示用户并重置 URL
          alert(t('errors.projectNotFound'));
          window.open('/', '_self');
        }
      } else if (sampleProjectId) {
        // 如果创建了示例项目，自动加载和选择它
        setCurrentProject(sampleProjectId);
        await loadVersions(sampleProjectId);
      }

      if (storage.get(STORAGE_KEYS.FIRST_OPEN_TIME, null) === null) {
        // 记录首次打开时间
        storage.set(STORAGE_KEYS.FIRST_OPEN_TIME, Date.now());
      }

      setIsInitialized(true);
    };

    initialize();
  }, [loadProjects, loadFolders, setCurrentProject, loadVersions, handleOpenProjectFromUrl, t]);

  // 在初始化完成前，可以显示一个简单的加载提示
  if (!isInitialized) {
    return null; // 或者可以显示一个加载动画
  }

  return <>{children}</>;
};
