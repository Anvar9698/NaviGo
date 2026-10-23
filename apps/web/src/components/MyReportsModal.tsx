import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Clock, CheckCircle, AlertCircle, RefreshCw, FileText, MapPin } from 'lucide-react';
import { Report } from '@yol/shared';

export const MyReportsModal: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    t, 
    token, 
    user, 
    setIsAuthOpen, 
    userReports, 
    fetchUserReports,
    setFocusedLocation 
  } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'my-reports' && token) {
      setIsLoading(true);
      fetchUserReports().finally(() => setIsLoading(false));
    }
  }, [activeTab, token]);

  if (activeTab !== 'my-reports') return null;

  const handleViewOnMap = (report: Report) => {
    setFocusedLocation({ lat: report.latitude, lon: report.longitude });
    setActiveTab('map');
  };

  const getStatusBadge = (status: Report['status']) => {
    const label = t(`myReports.statuses.${status}`) || status;
    switch (status) {
      case 'SUBMITTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">{label}</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">{label}</span>;
      case 'PUBLISHED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">{label}</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">{label}</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{label}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-reports-title"
        className="w-full max-w-2xl bg-white dark:bg-darkCard rounded-card shadow-float border border-yolBorder dark:border-darkBorder p-6 max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-4 border-b border-yolBorder dark:border-darkBorder">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orangeTint text-accentOrange flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 id="my-reports-title" className="text-xl font-bold text-textPrimary dark:text-darkText">
                {t('myReports.title')}
              </h2>
              <span className="text-xs text-textSecondary dark:text-darkTextSec">
                {t('myReports.subtitle')}
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

        {!user ? (
          <div className="py-12 flex flex-col items-center text-center">
            <AlertCircle className="w-12 h-12 text-accentOrange mb-3" />
            <h3 className="text-lg font-bold text-textPrimary dark:text-darkText">
              {t('myReports.signInRequired')}
            </h3>
            <p className="text-sm text-textSecondary dark:text-darkTextSec max-w-sm mt-1">
              {t('myReports.signInPrompt')}
            </p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="mt-5 px-6 py-2.5 rounded-full bg-blackPill text-white font-bold"
            >
              {t('topBar.login')}
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
            {isLoading ? (
              <div className="py-12 text-center text-textSecondary dark:text-darkTextSec">
                {t('common.loading')}
              </div>
            ) : userReports.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-textSecondary dark:text-darkTextSec">{t('myReports.noReports')}</p>
              </div>
            ) : (
              userReports.map((report) => (
                <div 
                  key={report.id}
                  className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 flex flex-col gap-2.5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-textSecondary uppercase tracking-wider">
                        {report.id} • {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                      <h4 className="font-bold text-base text-textPrimary dark:text-darkText mt-0.5">
                        {report.title}
                      </h4>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>

                  <p className="text-xs text-textSecondary dark:text-darkTextSec">
                    {report.description || t('myReports.noDetails')}
                  </p>

                  {report.statusNotes && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-darkCard text-xs border border-yolBorder dark:border-gray-700">
                      <span className="font-bold text-accentOrange">{t('myReports.editorFeedback')}: </span>
                      <span className="text-textSecondary dark:text-darkTextSec">{report.statusNotes}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-textSecondary dark:text-darkTextSec text-[11px]">
                      <span>{t('report.categoryLabel')}: <strong className="capitalize text-textPrimary dark:text-darkText">{t(`report.categories.${report.category}`)}</strong></span>
                      <span>•</span>
                      <span>{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span>
                    </div>

                    {/* View on Map Button */}
                    <button
                      onClick={() => handleViewOnMap(report)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-darkCard hover:bg-orangeTint hover:text-accentOrange text-textPrimary dark:text-darkText text-xs font-bold border border-yolBorder dark:border-gray-700 transition-colors shadow-sm"
                    >
                      <MapPin className="w-3.5 h-3.5 text-accentOrange" />
                      <span>{t('myReports.viewOnMap')}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
