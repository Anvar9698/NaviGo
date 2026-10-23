import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Info } from 'lucide-react';

export const LegendModal: React.FC = () => {
  const { isLegendOpen, setIsLegendOpen, t } = useApp();

  if (!isLegendOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="legend-modal-title"
        className="w-full max-w-lg bg-white dark:bg-darkCard rounded-card shadow-float border border-yolBorder dark:border-darkBorder p-6 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b border-yolBorder dark:border-darkBorder">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orangeTint text-accentOrange flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <h2 id="legend-modal-title" className="text-xl font-bold text-textPrimary dark:text-darkText">
              {t('legend.title')}
            </h2>
          </div>
          <button
            onClick={() => setIsLegendOpen(false)}
            aria-label={t('common.close')}
            className="w-10 h-10 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center text-textSecondary dark:text-darkTextSec hover:text-textPrimary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-accentOrange">
            {t('legend.roadHazardsTitle')}
          </h3>
          <div className="grid grid-cols-1 gap-2.5">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700">
              <span className="p-2 rounded-full bg-red-100 text-red-700 text-lg">⚠️</span>
              <div>
                <h4 className="text-sm font-bold text-textPrimary dark:text-darkText">{t('legend.accidentTitle')}</h4>
                <p className="text-xs text-textSecondary dark:text-darkTextSec">{t('legend.accidentDesc')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700">
              <span className="p-2 rounded-full bg-orange-100 text-orange-700 text-lg">🚗</span>
              <div>
                <h4 className="text-sm font-bold text-textPrimary dark:text-darkText">{t('legend.trafficTitle')}</h4>
                <p className="text-xs text-textSecondary dark:text-darkTextSec">{t('legend.trafficDesc')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700">
              <span className="p-2 rounded-full bg-yellow-100 text-yellow-800 text-lg">🚧</span>
              <div>
                <h4 className="text-sm font-bold text-textPrimary dark:text-darkText">{t('legend.roadWorkTitle')}</h4>
                <p className="text-xs text-textSecondary dark:text-darkTextSec">{t('legend.roadWorkDesc')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700">
              <span className="p-2 rounded-full bg-red-200 text-red-900 text-lg">⛔</span>
              <div>
                <h4 className="text-sm font-bold text-textPrimary dark:text-darkText">{t('legend.closureTitle')}</h4>
                <p className="text-xs text-textSecondary dark:text-darkTextSec">{t('legend.closureDesc')}</p>
              </div>
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wider text-accentOrange pt-2">
            {t('legend.sourceTitle')}
          </h3>
          <div className="space-y-2">
            <div className="p-3 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-textPrimary dark:text-darkText">{t('legend.sourceLiveTitle')}</span>
                <p className="text-xs text-textSecondary dark:text-darkTextSec">{t('legend.sourceLiveDesc')}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{t('roads.sourceLive')}</span>
            </div>

            <div className="p-3 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-textPrimary dark:text-darkText">{t('legend.sourceCommunityTitle')}</span>
                <p className="text-xs text-textSecondary dark:text-darkTextSec">{t('legend.sourceCommunityDesc')}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{t('roads.sourceCommunity')}</span>
            </div>

            <div className="p-3 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-textPrimary dark:text-darkText">{t('legend.sourceOfficialTitle')}</span>
                <p className="text-xs text-textSecondary dark:text-darkTextSec">{t('legend.sourceOfficialDesc')}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{t('roads.sourceOfficial')}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsLegendOpen(false)}
          className="mt-6 w-full py-3 rounded-full bg-blackPill text-white font-bold hover:bg-blackPillHover"
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
};
