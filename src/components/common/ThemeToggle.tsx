import React from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { MinimalButton } from '@/components/common/MinimalButton';
export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useSettingsStore();

  const toggleTheme = () => {
    // Simple toggle between light and dark for the button
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <MinimalButton
      variant="ghost"
      onClick={toggleTheme}
      className="h-9 w-9 !text-white/90 !hover:text-white hover:bg-white/10"
      title="Toggle Theme"
      aria-label="Toggle Theme"
    >
      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
        {'contrast'}
      </span>
    </MinimalButton>
  );
};
