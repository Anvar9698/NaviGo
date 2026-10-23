import React from 'react';
import { useApp } from '../context/AppContext';
import { Sun, Moon, HelpCircle, LogOut, ZoomIn, ZoomOut, Eye } from 'lucide-react';

export const LeftDock: React.FC = () => {
  const { 
    theme, 
    setTheme, 
    textScale, 
    setTextScale, 
    setActiveTab, 
    user, 
    logout, 
    setIsAuthOpen,
    t
  } = useApp();

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('high-contrast');
    else setTheme('light');
  };

  const increaseText = () => {
    setTextScale(Math.min(textScale + 0.1, 1.4));
  };

  const decreaseText = () => {
    setTextScale(Math.max(textScale - 0.1, 0.9));
  };

  return (
    <aside 
      aria-label="Accessibility Dock"
      className="hidden xl:flex flex-col items-center justify-between py-6 px-2 w-16 bg-white dark:bg-darkCard rounded-full shadow-soft border border-yolBorder dark:border-darkBorder my-4 ml-4 z-20"
    >
      {/* Top Dock Items */}
      <div className="flex flex-col items-center gap-5">
        <button
          onClick={toggleTheme}
          title={`Theme: ${theme}`}
          className="flex flex-col items-center gap-1 group text-textSecondary dark:text-darkTextSec hover:text-accentOrange transition-colors"
        >
          <div className="w-11 h-11 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center group-hover:bg-orangeTint transition-colors">
            {theme === 'light' ? (
              <Sun className="w-5 h-5 text-accentOrange" />
            ) : theme === 'dark' ? (
              <Moon className="w-5 h-5 text-yellow-400" />
            ) : (
              <Eye className="w-5 h-5 text-yellow-500" />
            )}
          </div>
          <span className="text-[10px] font-semibold tracking-tight uppercase">
            {theme === 'light' ? t('dock.day') : theme === 'dark' ? t('dock.night') : t('dock.contrast')}
          </span>
        </button>

        {/* Text Scaling Controls */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-yolBorder dark:border-darkBorder">
          <button
            onClick={increaseText}
            title="Increase text size"
            className="w-9 h-9 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center text-textPrimary dark:text-darkText hover:bg-orangeTint transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-bold text-textSecondary dark:text-darkTextSec">
            {Math.round(textScale * 100)}%
          </span>
          <button
            onClick={decreaseText}
            title="Decrease text size"
            className="w-9 h-9 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center text-textPrimary dark:text-darkText hover:bg-orangeTint transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Dock Items */}
      <div className="flex flex-col items-center gap-5">
        <button
          onClick={() => setActiveTab('help')}
          title={t('dock.help')}
          className="flex flex-col items-center gap-1 group text-textSecondary dark:text-darkTextSec hover:text-accentOrange transition-colors"
        >
          <div className="w-11 h-11 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center group-hover:bg-orangeTint transition-colors">
            <HelpCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-semibold">{t('dock.help')}</span>
        </button>

        {user ? (
          <button
            onClick={logout}
            title={t('dock.exit')}
            className="flex flex-col items-center gap-1 group text-textSecondary dark:text-darkTextSec hover:text-statusDanger transition-colors"
          >
            <div className="w-11 h-11 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center group-hover:bg-statusDangerBg transition-colors">
              <LogOut className="w-5 h-5 text-statusDanger" />
            </div>
            <span className="text-[10px] font-semibold text-statusDanger">{t('dock.exit')}</span>
          </button>
        ) : (
          <button
            onClick={() => setIsAuthOpen(true)}
            title={t('dock.login')}
            className="flex flex-col items-center gap-1 group text-textSecondary dark:text-darkTextSec hover:text-accentOrange transition-colors"
          >
            <div className="w-11 h-11 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center group-hover:bg-orangeTint transition-colors">
              <LogOut className="w-5 h-5 rotate-180 text-accentOrange" />
            </div>
            <span className="text-[10px] font-semibold">{t('dock.login')}</span>
          </button>
        )}
      </div>
    </aside>
  );
};
