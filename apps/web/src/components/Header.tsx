import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  MapPin, 
  Bell, 
  User as UserIcon, 
  Shield, 
  Edit3, 
  BarChart3, 
  HelpCircle, 
  Settings, 
  FileText 
} from 'lucide-react';
import { SupportedLocale } from '@yol/shared';
import { NaviGoLogo } from './NaviGoLogo';

export const Header: React.FC = () => {
  const { 
    locale, 
    setLocale, 
    t, 
    activeTab, 
    setActiveTab, 
    user, 
    setIsAuthOpen,
    setIsNotificationsOpen,
    notifications
  } = useApp();

  const locales: SupportedLocale[] = ['uz', 'ru', 'en'];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="w-full flex items-center justify-between px-3 md:px-6 py-2.5 z-30 select-none gap-2 xl:gap-4">
      {/* 1. Left Brand Pill */}
      <div 
        onClick={() => setActiveTab('map')}
        className="flex items-center gap-2.5 bg-white dark:bg-darkCard px-3.5 py-1.5 md:py-2 rounded-full shadow-soft cursor-pointer hover:opacity-95 transition-all border border-yolBorder dark:border-darkBorder group shrink-0"
      >
        <NaviGoLogo className="w-8 h-8 md:w-9 md:h-9 group-hover:scale-105 transition-transform shrink-0 drop-shadow-sm" />
        <span className="font-black text-xl tracking-tight text-textPrimary dark:text-darkText block leading-tight pr-1">
          Navi<span className="text-accentOrange">Go</span>
        </span>
      </div>

      {/* 2. Center Floating Navigation Pills (Desktop) */}
      <nav 
        aria-label="Main Navigation"
        className="hidden lg:flex items-center gap-1 xl:gap-1.5 bg-white dark:bg-darkCard p-1 md:p-1.5 rounded-full shadow-soft border border-yolBorder dark:border-darkBorder shrink-0"
      >
        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-1.5 px-3 py-1.5 xl:px-4 xl:py-2 rounded-full font-semibold text-xs xl:text-sm whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'map'
              ? 'bg-blackPill text-white shadow-sm'
              : 'text-textSecondary dark:text-darkTextSec hover:text-textPrimary dark:hover:text-white'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
          <span>{t('nav.map')}</span>
        </button>

        <button
          onClick={() => setActiveTab('my-reports')}
          className={`flex items-center gap-1.5 px-3 py-1.5 xl:px-4 xl:py-2 rounded-full font-semibold text-xs xl:text-sm whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'my-reports'
              ? 'bg-blackPill text-white shadow-sm'
              : 'text-textSecondary dark:text-darkTextSec hover:text-textPrimary dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
          <span>{t('nav.myReports')}</span>
        </button>

        <button
          onClick={() => setActiveTab('help')}
          className={`flex items-center gap-1.5 px-3 py-1.5 xl:px-4 xl:py-2 rounded-full font-semibold text-xs xl:text-sm whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'help'
              ? 'bg-blackPill text-white shadow-sm'
              : 'text-textSecondary dark:text-darkTextSec hover:text-textPrimary dark:hover:text-white'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
          <span>{t('nav.help')}</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 px-3 py-1.5 xl:px-4 xl:py-2 rounded-full font-semibold text-xs xl:text-sm whitespace-nowrap shrink-0 transition-all ${
            activeTab === 'settings'
              ? 'bg-blackPill text-white shadow-sm'
              : 'text-textSecondary dark:text-darkTextSec hover:text-textPrimary dark:hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
          <span>{t('nav.settings')}</span>
        </button>

        {/* Staff-only Tabs */}
        {user && (user.role === 'EDITOR' || user.role === 'ADMIN') && (
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 xl:px-3.5 xl:py-2 rounded-full font-semibold text-xs xl:text-sm whitespace-nowrap shrink-0 transition-all ${
              activeTab === 'editor'
                ? 'bg-blackPill text-white'
                : 'text-accentOrange hover:bg-orangeTint dark:hover:bg-opacity-20'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
            <span>{t('nav.editor')}</span>
          </button>
        )}

        {user && (user.role === 'ANALYST' || user.role === 'ADMIN') && (
          <button
            onClick={() => setActiveTab('analyst')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 xl:px-3.5 xl:py-2 rounded-full font-semibold text-xs xl:text-sm whitespace-nowrap shrink-0 transition-all ${
              activeTab === 'analyst'
                ? 'bg-blackPill text-white'
                : 'text-accentOrange hover:bg-orangeTint dark:hover:bg-opacity-20'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
            <span>{t('nav.analyst')}</span>
          </button>
        )}

        {user && user.role === 'ADMIN' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 xl:px-3.5 xl:py-2 rounded-full font-semibold text-xs xl:text-sm whitespace-nowrap shrink-0 transition-all ${
              activeTab === 'admin'
                ? 'bg-blackPill text-white'
                : 'text-accentOrange hover:bg-orangeTint dark:hover:bg-opacity-20'
            }`}
          >
            <Shield className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
            <span>{t('nav.admin')}</span>
          </button>
        )}
      </nav>

      {/* 3. Right Action Controls */}
      <div className="flex items-center gap-2 xl:gap-2.5 shrink-0">
        {/* Language Switcher */}
        <div className="flex items-center bg-white dark:bg-darkCard p-1 rounded-full shadow-soft border border-yolBorder dark:border-darkBorder shrink-0">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`px-2 py-1 md:px-2.5 md:py-1.5 text-[11px] md:text-xs font-bold rounded-full transition-all uppercase ${
                locale === l
                  ? 'bg-blackPill text-white'
                  : 'text-textSecondary dark:text-darkTextSec hover:text-textPrimary'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Notifications Icon Button */}
        <div className="relative shrink-0">
          <button 
            onClick={() => setIsNotificationsOpen(true)}
            aria-label={t('topBar.notifications')}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white dark:bg-darkCard flex items-center justify-center shadow-soft border border-yolBorder dark:border-darkBorder hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-textPrimary dark:text-darkText relative"
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5 text-accentOrange" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-4.5 px-1 bg-accentOrange text-white text-[9px] md:text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-darkCard">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Account / Sign In Button */}
        <button
          onClick={() => setIsAuthOpen(true)}
          className="flex items-center gap-1.5 md:gap-2 bg-white dark:bg-darkCard px-3 py-1.5 md:px-3.5 md:py-2 rounded-full shadow-soft border border-yolBorder dark:border-darkBorder hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-textPrimary dark:text-darkText shrink-0 max-w-[150px] md:max-w-[200px]"
        >
          <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center text-textSecondary dark:text-darkTextSec shrink-0">
            <UserIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </div>
          <span className="font-semibold text-xs md:text-sm truncate max-w-[70px] md:max-w-[100px]">
            {user ? user.name.split(' ')[0] : t('topBar.login')}
          </span>
          {user && (
            <span className="text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orangeTint text-accentOrange uppercase shrink-0">
              {user.role}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
