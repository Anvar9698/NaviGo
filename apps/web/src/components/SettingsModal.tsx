import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Settings as SettingsIcon, Sun, Moon, Eye, Type, Shield, Trash2, Download } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    t, 
    theme, 
    setTheme, 
    textScale, 
    setTextScale,
    reduceMotion,
    setReduceMotion 
  } = useApp();

  if (activeTab !== 'settings') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="w-full max-w-xl bg-white dark:bg-darkCard rounded-card shadow-float border border-yolBorder dark:border-darkBorder p-6 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b border-yolBorder dark:border-darkBorder">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orangeTint text-accentOrange flex items-center justify-center">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 id="settings-title" className="text-xl font-bold text-textPrimary dark:text-darkText">
                {t('accessibility.title')}
              </h2>
              <span className="text-xs text-textSecondary dark:text-darkTextSec">
                {t('accessibility.subtitle')}
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('map')}
            aria-label={t('common.close')}
            className="w-10 h-10 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center text-textSecondary dark:text-darkTextSec hover:text-textPrimary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* 1. Text Size Scaling Slider */}
          <div className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-textPrimary dark:text-darkText flex items-center gap-2">
                <Type className="w-4 h-4 text-accentOrange" />
                <span>{t('accessibility.textSize')}</span>
              </label>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blackPill text-white">
                {Math.round(textScale * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.9"
              max="1.4"
              step="0.05"
              value={textScale}
              onChange={(e) => setTextScale(parseFloat(e.target.value))}
              className="w-full accent-accentOrange cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-textSecondary mt-1">
              <span>{t('accessibility.textSizeStandard')}</span>
              <span>{t('accessibility.textSizeSenior')}</span>
            </div>
          </div>

          {/* 2. Color Theme Selection */}
          <div className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700">
            <label className="text-sm font-bold text-textPrimary dark:text-darkText block mb-3">
              {t('accessibility.theme')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                  theme === 'light'
                    ? 'border-accentOrange bg-white dark:bg-darkCard shadow-sm text-textPrimary'
                    : 'border-transparent text-textSecondary'
                }`}
              >
                <Sun className="w-5 h-5 text-accentOrange" />
                <span>{t('accessibility.themeLight')}</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                  theme === 'dark'
                    ? 'border-accentOrange bg-white dark:bg-darkCard shadow-sm text-textPrimary dark:text-white'
                    : 'border-transparent text-textSecondary'
                }`}
              >
                <Moon className="w-5 h-5 text-yellow-400" />
                <span>{t('accessibility.themeDark')}</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('high-contrast')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                  theme === 'high-contrast'
                    ? 'border-yellow-400 bg-black text-yellow-400 shadow-sm'
                    : 'border-transparent text-textSecondary'
                }`}
              >
                <Eye className="w-5 h-5 text-yellow-400" />
                <span>{t('accessibility.themeHighContrast')}</span>
              </button>
            </div>
          </div>

          {/* 3. Reduce Motion Switch */}
          <div className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-textPrimary dark:text-darkText">
                {t('accessibility.reduceMotion')}
              </div>
              <div className="text-xs text-textSecondary dark:text-darkTextSec">
                {t('accessibility.reduceMotionDesc')}
              </div>
            </div>
            <input
              type="checkbox"
              checked={reduceMotion}
              onChange={(e) => setReduceMotion(e.target.checked)}
              className="w-5 h-5 accent-accentOrange cursor-pointer"
            />
          </div>

          {/* 4. Privacy & Consent */}
          <div className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-textPrimary dark:text-darkText">
              <Shield className="w-4 h-4 text-accentOrange" />
              <span>{t('accessibility.privacyTitle')}</span>
            </div>
            <p className="text-xs text-textSecondary dark:text-darkTextSec leading-relaxed">
              {t('accessibility.privacyDesc')}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => alert('Data export prepared.')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-darkCard text-xs font-bold text-textPrimary dark:text-darkText border border-yolBorder dark:border-gray-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('accessibility.exportData')}</span>
              </button>
              <button
                onClick={() => alert('Account data purged.')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-statusDangerBg text-statusDanger text-xs font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('accessibility.deleteAccount')}</span>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('map')}
          className="mt-6 w-full py-3 rounded-full bg-blackPill text-white font-bold hover:bg-blackPillHover"
        >
          {t('common.save')}
        </button>
      </div>
    </div>
  );
};
