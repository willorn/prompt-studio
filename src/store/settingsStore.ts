import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_THEME_COLOR } from '@/styles/tokens';
import { storage, STORAGE_KEYS } from '@/utils/storage';

interface SettingsState {
  // WebDAV
  webdavUrl: string;
  webdavUsername: string;
  webdavPassword: string;
  setWebdavConfig: (url: string, username: string, password: string) => void;

  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  themeColor: string;
  setThemeColor: (color: string) => void;

  // Editor
  editorFontSize: number;
  editorLineHeight: number;
  setEditorSettings: (fontSize: number, lineHeight: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      webdavUrl: '',
      webdavUsername: '',
      webdavPassword: '',
      setWebdavConfig: (url, username, password) =>
        set({ webdavUrl: url, webdavUsername: username, webdavPassword: password }),

      theme: 'light',
      setTheme: (theme) => {
        storage.set(STORAGE_KEYS.THEME, theme);
        set({ theme });
      },
      themeColor: DEFAULT_THEME_COLOR,
      setThemeColor: (color) => {
        storage.set(STORAGE_KEYS.THEME_COLOR, color);
        set({ themeColor: color });
      },

      editorFontSize: 14,
      editorLineHeight: 1.5,
      setEditorSettings: (fontSize, lineHeight) =>
        set({ editorFontSize: fontSize, editorLineHeight: lineHeight }),
    }),
    {
      name: 'prompt-studio-settings',
    }
  )
);
