import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { webdavService, type WebDAVConfig } from '@/services/webdavService';
import { exportService } from '@/services/exportService';
import { useProjectStore } from '@/store/projectStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { MinimalButton } from '@/components/common/MinimalButton';
import { ImportModeDialog } from '@/components/common/ImportModeDialog';
import { Icons } from '@/components/icons/Icons';
import { storage, STORAGE_KEYS } from '@/utils/storage';
import { useTranslation } from '@/i18n/I18nContext';
import { DEFAULT_THEME_COLOR } from '@/styles/tokens';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const t = useTranslation();
  const { loadFolders, loadProjects } = useProjectStore();
  const { theme, setTheme, themeColor, setThemeColor } = useSettingsStore();
  const [webdavConfig, setWebdavConfig] = useState<WebDAVConfig>({
    url: '/jianguoyun-dav-proxy/', // 默认指向坚果云的代理地址，开箱即用
    username: '',
    password: '',
  });
  const [webdavProvider, setWebdavProvider] = useState<'jianguoyun' | 'custom'>('jianguoyun');
  const [isConnected, setIsConnected] = useState(false);
  const [testing, setTesting] = useState(false);
  const [backups, setBackups] = useState<
    Array<{ name: string; path: string; size: number; lastMod: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showImportModeDialog, setShowImportModeDialog] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [pendingRestorePath, setPendingRestorePath] = useState<string | null>(null);

  // 校验配置是否完整
  const isConfigValid = useMemo(() => {
    return (
      webdavConfig.url?.trim() !== '' &&
      webdavConfig.username?.trim() !== '' &&
      webdavConfig.password?.trim() !== ''
    );
  }, [webdavConfig]);

  useEffect(() => {
    // 从 localStorage 加载配置
    const config = storage.get<WebDAVConfig | null>(STORAGE_KEYS.WEBDAV_CONFIG, null);
    if (config) {
      setWebdavConfig(config);
      setWebdavProvider(
        config.url === '/jianguoyun-dav-proxy/' || config.url.includes('jianguoyun.com')
          ? 'jianguoyun'
          : 'custom'
      );
      webdavService.configure(config);
    }
  }, []);

  // 自动保存 WebDAV 配置到 localStorage
  useEffect(() => {
    if (webdavConfig.url || webdavConfig.username || webdavConfig.password) {
      storage.set(STORAGE_KEYS.WEBDAV_CONFIG, webdavConfig);
    }
  }, [webdavConfig]);

  const handleProviderChange = (value: 'jianguoyun' | 'custom') => {
    setWebdavProvider(value);
    if (value === 'jianguoyun') {
      setWebdavConfig((prev) => ({ ...prev, url: '/jianguoyun-dav-proxy/' }));
    } else {
      setWebdavConfig((prev) => ({ ...prev, url: '' }));
    }
  };

  const serverUrlPlaceholder = useMemo(
    () =>
      webdavProvider === 'jianguoyun'
        ? '/jianguoyun-dav-proxy/ （代理到 https://dav.jianguoyun.com/dav/）'
        : 'https://example.com/webdav',
    [webdavProvider]
  );

  const handleTestConnection = async () => {
    if (!isConfigValid) return;
    setTesting(true);
    try {
      webdavService.configure(webdavConfig);
      const result = await webdavService.testConnection();
      setIsConnected(result);
      if (result) {
          alert(t('pages.settings.webdav.connectionSuccess'));
          await loadBackups();
      } else {
        alert(t('pages.settings.webdav.connectionFailed'));
      }
    } catch (error) {
      alert(
        `${t('pages.settings.webdav.connectionFailed')}: ${error instanceof Error ? error.message : t('pages.settings.errors.unknown')}`
      );
      setIsConnected(false);
    } finally {
      setTesting(false);
    }
  };

  const loadBackups = async () => {
    try {
      const list = await webdavService.listBackups();
      setBackups(list);
    } catch (error) {
      console.error(t('pages.settings.errors.loadBackupsFailed'), error);
    }
  };

  const handleBackup = async () => {
    if (!isConfigValid) return;
    // 确保使用当前配置
    webdavService.configure(webdavConfig);

    setLoading(true);
    try {
      await webdavService.backupToWebDAV();
      alert(t('pages.settings.webdav.backupSuccess'));
      await loadBackups();
    } catch (error) {
      alert(
        `${t('pages.settings.webdav.backupFailed')}: ${error instanceof Error ? error.message : t('pages.settings.errors.unknown')}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRestoreModal = async () => {
    if (!isConfigValid) return;
    // 确保使用当前配置
    webdavService.configure(webdavConfig);

    setLoading(true);
    try {
      const list = await webdavService.listBackups();
      setBackups(list);
      setShowRestoreModal(true);
    } catch (error) {
      alert(
        `${t('pages.settings.errors.loadBackupsFailed')}: ${error instanceof Error ? error.message : t('pages.settings.errors.unknown')}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (remotePath: string) => {
    // 设置待处理的恢复路径并显示模式选择对话框
    setPendingRestorePath(remotePath);
    setShowImportModeDialog(true);
  };

  const handleRestoreWithMode = async (mode: 'merge' | 'overwrite') => {
    if (!pendingRestorePath) return;

    if (!confirm(t('pages.settings.webdav.confirmRestore'))) {
      return;
    }

    setShowRestoreModal(false);
    setShowImportModeDialog(false);
    setLoading(true);
    try {
      await webdavService.restoreFromWebDAV(pendingRestorePath, { mode });
      alert(t('pages.settings.webdav.restoreSuccess'));
      window.location.reload();
    } catch (error) {
      alert(
        `${t('pages.settings.webdav.restoreFailed')}: ${error instanceof Error ? error.message : t('pages.settings.errors.unknown')}`
      );
    } finally {
      setLoading(false);
      setPendingRestorePath(null);
    }
  };
  const handleDeleteBackup = async (remotePath: string) => {
    if (!confirm(t('pages.settings.webdav.confirmDelete'))) {
      return;
    }

    try {
      await webdavService.deleteBackup(remotePath);
      alert(t('pages.settings.webdav.deleteSuccess'));
      // 更新备份列表和模态框中的备份列表
      await loadBackups();
      setBackups((prev) => prev.filter((b) => b.path !== remotePath));
    } catch (error) {
      alert(
        `${t('pages.settings.webdav.deleteFailed')}: ${error instanceof Error ? error.message : t('pages.settings.errors.unknown')}`
      );
    }
  };

  const handleExportClick = async () => {
    try {
      await exportService.exportAllAsZip();
    } catch (error) {
      alert(
        `${t('pages.settings.local.exportFailed')}: ${error instanceof Error ? error.message : t('pages.settings.errors.unknown')}`
      );
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 设置待处理的文件并显示模式选择对话框
    setPendingImportFile(file);
    setShowImportModeDialog(true);
  };

  const handleImportWithMode = async (mode: 'merge' | 'overwrite') => {
    // 处理文件导入
    if (pendingImportFile) {
      try {
        if (pendingImportFile.name.endsWith('.zip')) {
          await exportService.importFromZip(pendingImportFile, { mode });
        } else if (pendingImportFile.name.endsWith('.json')) {
          await exportService.importFromJSON(pendingImportFile, { mode });
        } else {
          alert(t('pages.settings.local.unsupportedFormat'));
          return;
        }

        // 刷新数据而不是重新加载页面
        await loadFolders();
        await loadProjects();

        alert(t('pages.settings.local.importSuccess'));
      } catch (error) {
        alert(
          `${t('pages.settings.local.importFailed')}: ${error instanceof Error ? error.message : t('pages.settings.errors.unknown')}`
        );
      } finally {
        // 清理状态
        setShowImportModeDialog(false);
        setPendingImportFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
    // 处理WebDAV恢复
    else if (pendingRestorePath) {
      await handleRestoreWithMode(mode);
    }
  };

  const handleCancelImportMode = () => {
    setShowImportModeDialog(false);
    setPendingImportFile(null);
    setPendingRestorePath(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
  };

  const handleThemeColorChange = (color: string) => {
    setThemeColor(color);
  };

  const handleResetThemeColor = () => {
    setThemeColor(DEFAULT_THEME_COLOR);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex flex-col h-screen bg-background dark:bg-background-dark text-surface-onSurface overflow-hidden">
      {/* 头部 */}
      <header className="h-12 bg-primary text-white flex items-center justify-between px-6 shrink-0 shadow-md z-20">
        <div className="flex items-center gap-2">
          <Icons.Settings className="text-2xl" />
          <h1 className="text-lg font-bold tracking-wide">{t('pages.settings.title')}</h1>
        </div>
        <MinimalButton
          variant="ghost"
          onClick={() => navigate('/')}
          className="h-9 w-9 !text-white/90 !hover:text-white hover:bg-white/10"
          title={t('common.back')}
        >
          <Icons.ArrowLeft className="h-6 w-6" />
        </MinimalButton>
      </header>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden p-2 gap-2 justify-center">
        <main className="flex-1 flex flex-col overflow-y-auto max-w-4xl p-4 md:p-6 gap-6">
          {/* 主题设置卡片 */}
          <section className="bg-surface dark:bg-surface-dark rounded-xl shadow-sm border border-border dark:border-border-dark p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg text-primary shrink-0">
                <span className="material-symbols-outlined text-2xl">palette</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-surface-onSurface dark:text-surface-onSurfaceDark">
                  {t('pages.settings.theme.title')}
                </h2>
                <p className="text-sm text-surface-onVariant dark:text-surface-onVariantDark mt-1">
                  {t('pages.settings.theme.description')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4 items-center">
              <div className="flex items-center gap-3">
                <label className="text-sm text-surface-onVariant dark:text-surface-onVariantDark">
                  {t('pages.settings.theme.primaryColor')}
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="color"
                  value={themeColor}
                  onChange={(e) => handleThemeColorChange(e.target.value)}
                  aria-label={t('pages.settings.theme.primaryColor')}
                  className="h-10 w-16 rounded border border-border dark:border-border-dark cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={(e) => handleThemeColorChange(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-border dark:border-border-dark bg-surface-variant dark:bg-surface-variantDark text-sm text-surface-onSurface dark:text-surface-onSurfaceDark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  spellCheck={false}
                />
                <MinimalButton variant="ghost" onClick={handleResetThemeColor}>
                  {t('pages.settings.theme.reset')}
                </MinimalButton>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <span className="text-sm text-surface-onVariant dark:text-surface-onVariantDark">
                {t('pages.settings.theme.mode')}
              </span>
              <div className="flex gap-2">
                <MinimalButton
                  variant={theme === 'light' ? 'default' : 'ghost'}
                  onClick={() => setTheme('light')}
                  className="px-3 py-2 text-sm"
                >
                  {t('pages.settings.theme.light')}
                </MinimalButton>
                <MinimalButton
                  variant={theme === 'dark' ? 'default' : 'ghost'}
                  onClick={() => setTheme('dark')}
                  className="px-3 py-2 text-sm"
                >
                  {t('pages.settings.theme.dark')}
                </MinimalButton>
                <MinimalButton variant="ghost" onClick={toggleTheme} className="px-3 py-2 text-sm">
                  {t('pages.settings.theme.toggle')}
                </MinimalButton>
              </div>
            </div>
          </section>

          {/* 本地导入导出卡片 */}
          <section className="bg-surface dark:bg-surface-dark rounded-xl shadow-sm border border-border dark:border-border-dark p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg text-primary shrink-0">
                <span className="material-symbols-outlined text-2xl">folder_zip</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-surface-onSurface dark:text-surface-onSurfaceDark">
                  {t('pages.settings.local.title')}
                </h2>
                <p className="text-sm text-surface-onVariant dark:text-surface-onVariantDark mt-1">
                  {t('pages.settings.local.description')}
                </p>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto justify-end">
              <MinimalButton
                variant="default"
                onClick={handleExportClick}
                className="px-4 py-2.5 text-sm gap-2"
              >
                <Icons.Download size={18} />
                {t('pages.settings.local.exportZip')}
              </MinimalButton>
              <MinimalButton
                variant="default"
                onClick={handleImportClick}
                className="px-4 py-2.5 text-sm gap-2"
              >
                <Icons.Upload size={18} />
                {t('pages.settings.local.importZip')}
              </MinimalButton>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
          </section>

          {/* WebDAV 配置卡片 */}
          <section className="bg-surface dark:bg-surface-dark rounded-xl shadow-sm border border-border dark:border-border-dark p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-primary/10 rounded-lg text-primary shrink-0">
                <span className="material-symbols-outlined text-2xl">cloud_sync</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-surface-onSurface dark:text-surface-onSurfaceDark">
                  {t('pages.settings.webdav.title')}
                </h2>
                <p className="text-sm text-surface-onVariant dark:text-surface-onVariantDark mt-1">
                  {t('pages.settings.webdav.description')}
                </p>
              </div>
            </div>

            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-surface-onSurface dark:text-surface-onSurfaceDark">
                  WebDAV 服务
                </label>
                <select
                  value={webdavProvider}
                  onChange={(e) => handleProviderChange(e.target.value as 'jianguoyun' | 'custom')}
                  className="px-4 py-2 border-2 rounded-m3-small 
                    bg-surface-variant dark:bg-background-dark 
                    text-surface-onVariant dark:text-surface-onSurfaceDark
                    border-surface-variant dark:border-border-dark
                    focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="jianguoyun">坚果云（推荐）</option>
                  <option value="custom">自定义 WebDAV</option>
                </select>
                <p className="text-xs text-surface-onVariant dark:text-surface-onVariantDark">
                  坚果云将通过 /jianguoyun-dav-proxy/ 代理，避免跨域；如需其他服务请选择自定义并填写完整 URL。
                </p>
              </div>
              {webdavProvider === 'custom' ? (
                <Input
                  label={t('pages.settings.webdav.serverUrl')}
                  placeholder={serverUrlPlaceholder}
                  value={webdavConfig.url}
                  onChange={(e) => setWebdavConfig({ ...webdavConfig, url: e.target.value })}
                  className="focus:border-transparent focus:ring-2 focus:ring-primary"
                />
              ) : (
                <div className="text-sm text-surface-onVariant dark:text-surface-onVariantDark">
                  已为你使用内置代理 `/jianguoyun-dav-proxy/` 访问坚果云，无需额外配置。
                </div>
              )}
              <Input
                label={t('pages.settings.webdav.username')}
                placeholder="username"
                value={webdavConfig.username}
                onChange={(e) => setWebdavConfig({ ...webdavConfig, username: e.target.value })}
                className="focus:border-transparent focus:ring-2 focus:ring-primary"
              />
              <Input
                label={t('pages.settings.webdav.password')}
                type="password"
                placeholder="password"
                value={webdavConfig.password}
                onChange={(e) => setWebdavConfig({ ...webdavConfig, password: e.target.value })}
                className="focus:border-transparent focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-border dark:border-border-dark">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <MinimalButton
                  variant="default"
                  onClick={handleTestConnection}
                  disabled={testing || !isConfigValid}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">wifi</span>
                  {testing
                    ? t('pages.settings.webdav.testing')
                    : t('pages.settings.webdav.testConnection')}
                </MinimalButton>
                {isConnected && (
                  <span className="flex items-center text-sm text-primary font-medium shrink-0">
                    <span className="material-symbols-outlined text-lg mr-1">check_circle</span>
                    {t('pages.settings.webdav.connected')}
                  </span>
                )}
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <MinimalButton
                  variant="default"
                  onClick={handleBackup}
                  disabled={loading || !isConfigValid}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-sm gap-2"
                >
                  {loading ? (
                    <span>{t('pages.settings.webdav.backingUp')}</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                      <span>{t('pages.settings.webdav.backupToWebdav')}</span>
                    </>
                  )}
                </MinimalButton>
                <MinimalButton
                  variant="default"
                  onClick={handleOpenRestoreModal}
                  disabled={loading || !isConfigValid}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-sm gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">cloud_download</span>
                  <span>{t('pages.settings.webdav.restoreFromWebdav')}</span>
                </MinimalButton>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* 从 WebDAV 还原模态框 */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        title={t('pages.settings.webdav.restoreModalTitle')}
        size="large"
      >
        <div className="space-y-4">
          {backups.length === 0 ? (
            <p className="text-center text-surface-onVariant py-8">
              {t('pages.settings.webdav.noBackups')}
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {backups.map((backup) => (
                <div
                  key={backup.path}
                  className="flex items-center justify-between p-4 bg-surface-container-high dark:bg-zinc-800 rounded-lg hover:bg-surface-variant dark:hover:bg-zinc-700 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium truncate text-surface-onSurface dark:text-surface-onSurfaceDark">
                      {backup.name}
                    </p>
                    <p className="text-xs text-surface-onVariant dark:text-surface-onVariantDark mt-1">
                      {formatDate(backup.lastMod)} • {formatFileSize(backup.size)}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <MinimalButton
                      variant="default"
                      onClick={() => handleRestore(backup.path)}
                      disabled={loading}
                      className="px-3 py-1.5 text-xs text-primary border-primary/30 hover:bg-primary/5"
                    >
                      {t('pages.settings.webdav.restore')}
                    </MinimalButton>
                    <MinimalButton
                      variant="danger"
                      onClick={() => handleDeleteBackup(backup.path)}
                      disabled={loading}
                      className="px-3 py-1.5 text-xs"
                    >
                      {t('pages.settings.webdav.delete')}
                    </MinimalButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* 导入模式选择对话框 */}
      <ImportModeDialog
        open={showImportModeDialog}
        onClose={handleCancelImportMode}
        onConfirm={handleImportWithMode}
      />
    </div>
  );
};

export default Settings;
