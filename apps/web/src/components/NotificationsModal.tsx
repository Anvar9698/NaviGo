import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Bell, AlertTriangle, FileText, CloudSun, Check, MapPin } from 'lucide-react';

export const NotificationsModal: React.FC = () => {
  const { 
    isNotificationsOpen, 
    setIsNotificationsOpen, 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    setFocusedLocation,
    setActiveTab,
    t 
  } = useApp();

  if (!isNotificationsOpen) return null;

  const handleNotificationClick = (n: any) => {
    markNotificationAsRead(n.id);
    if (n.latitude && n.longitude) {
      setFocusedLocation({ lat: n.latitude, lon: n.longitude });
      setActiveTab('map');
      setIsNotificationsOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-title"
        className="w-full max-w-lg bg-white dark:bg-darkCard rounded-card shadow-float border border-yolBorder dark:border-darkBorder p-6 max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-4 border-b border-yolBorder dark:border-darkBorder">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orangeTint text-accentOrange flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 id="notifications-title" className="text-xl font-bold text-textPrimary dark:text-darkText">
                {t('topBar.notificationsTitle')}
              </h2>
              <span className="text-xs text-textSecondary dark:text-darkTextSec">
                {notifications.filter(n => !n.isRead).length} unread updates
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsNotificationsOpen(false)}
            className="w-10 h-10 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center text-textSecondary dark:text-darkTextSec hover:text-textPrimary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={markAllNotificationsAsRead}
            className="text-xs font-semibold text-accentOrange hover:underline"
          >
            {t('topBar.markAllRead')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-2 space-y-3 pr-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-textSecondary dark:text-darkTextSec">
              {t('topBar.noNotifications')}
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  !n.isRead
                    ? 'bg-orangeTint/20 border-accentOrange/40'
                    : 'bg-innerSoftArea dark:bg-gray-800 border-yolBorder dark:border-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="p-2 rounded-full bg-white dark:bg-darkCard shrink-0 shadow-sm">
                  {n.type === 'road' ? (
                    <AlertTriangle className="w-4 h-4 text-accentOrange" />
                  ) : n.type === 'report' ? (
                    <FileText className="w-4 h-4 text-purple-600" />
                  ) : (
                    <CloudSun className="w-4 h-4 text-blue-500" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-textPrimary dark:text-darkText leading-tight">
                      {n.title}
                    </h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-accentOrange shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-textSecondary dark:text-darkTextSec mt-1 leading-relaxed">
                    {n.message}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-textSecondary dark:text-darkTextSec mt-2">
                    <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {n.latitude && n.longitude && (
                      <span className="text-accentOrange font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {t('myReports.viewOnMap')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={() => setIsNotificationsOpen(false)}
          className="mt-4 w-full py-3 rounded-full bg-blackPill text-white font-bold hover:bg-blackPillHover"
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
};
