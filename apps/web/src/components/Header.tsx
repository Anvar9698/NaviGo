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
    <header className="w-full flex items-center justify-between px-3 md:px-6 py-3 z-30 select-none">
      {/* 1. Left Brand Pill */}
      <div 
        onClick={() => setActiveTab('map')}
        className="flex items-center gap-3 bg-white dark:bg-darkCard px-4 py-2.5 rounded-full shadow-soft cursor-pointer hover:opacity-95 transition-all border border-yolBorder dark:border-darkBorder"
      >
        <div className="w-9 h-9 rounded-full bg-accentOrange flex items-center justify-center text-white shadow-sm">
          <MapPin className="w-5 h-5 fill-white text-accentOrange" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight text-textPrimary dark:text-darkText block leading-tight">
            Yo'l Ma'lumoti
          </span>
          <span className="text-xs text-textSecondary dark:text-darkTextSec hidden md:block">
            {t('tagline')}
          </span>
        </div>
      </div>

      {/* 2. Center Floating Navigation Pills (Desktop) */}
      <nav 
        aria-label="Main Navigation"
        className="hidden lg:flex items-center gap-1.5 bg-white dark:bg-darkCard p-1.5 rounded-full shadow-soft border border-yolBorder dark:border-darkBorder"
      >
        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-base transition-all ${
            activeTab === 'map'
              ? 'bg-blackPill text-white shadow-sm'
              : 'text-textSecondary dark:text-darkTextSec hover:text-textPrimary dark:hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>{t('nav.map')}</span>
        </button>

        <button
          onClick={() => setActiveTab('my-reports')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-base transition-all ${
            activeTab === 'my-reports'
              ? 'bg-blackPill text-white shadow-sm'
              : 'text-textSecondary dark:text-darkTextSec hover:text-textPrimary dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t('nav.myReports')}</span>
        </button>

        <button
          onClick={() => setActiveTab('help')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-base transition-all ${
            activeTab === 'help'
              ? 'bg-blackPill text-white shadow-sm'
              : 'text-textSecondary dark:text-darkTextSec hover:text-textPrimary dark:hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{t('nav.help')}</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-base transition-all ${
            activeTab === 'settings'
              ? 'bg-blackPill text-white shadow-sm'
              : 'text-textSecondary dark:text-darkTextSec hover:text-textPrimary dark:hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{t('nav.settings')}</span>
        </button>

        {/* Staff-only Tabs */}
        {user && (user.role === 'EDITOR' || user.role === 'ADMIN') && (
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
              activeTab === 'editor'
                ? 'bg-blackPill text-white'
                : 'text-accentOrange hover:bg-orangeTint dark:hover:bg-opacity-20'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{t('nav.editor')}</span>
          </button>
        )}

        {user && (user.role === 'ANALYST' || user.role === 'ADMIN') && (
          <button
            onClick={() => setActiveTab('analyst')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
              activeTab === 'analyst'
                ? 'bg-blackPill text-white'
                : 'text-accentOrange hover:bg-orangeTint dark:hover:bg-opacity-20'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t('nav.analyst')}</span>
          </button>
        )}

        {user && user.role === 'ADMIN' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
              activeTab === 'admin'
                ? 'bg-blackPill text-white'
                : 'text-accentOrange hover:bg-orangeTint dark:hover:bg-opacity-20'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{t('nav.admin')}</span>
          </button>
        )}
      </nav>

      {/* 3. Right Action Controls */}
      <div className="flex items-center gap-2.5">
        {/* Language Switcher */}
        <div className="flex items-center bg-white dark:bg-darkCard p-1 rounded-full shadow-soft border border-yolBorder dark:border-darkBorder">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all uppercase ${
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
        <div className="relative">
          <button 
            onClick={() => setIsNotificationsOpen(true)}
            aria-label={t('topBar.notifications')}
            className="w-11 h-11 rounded-full bg-white dark:bg-darkCard flex items-center justify-center shadow-soft border border-yolBorder dark:border-darkBorder hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-textPrimary dark:text-darkText relative"
          >
            <Bell className="w-5 h-5 text-accentOrange" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-accentOrange text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-darkCard">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Account / Sign In Button */}
        <button
          onClick={() => setIsAuthOpen(true)}
          className="flex items-center gap-2 bg-white dark:bg-darkCard px-4 py-2.5 rounded-full shadow-soft border border-yolBorder dark:border-darkBorder hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-textPrimary dark:text-darkText"
        >
          <div className="w-7 h-7 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center text-textSecondary dark:text-darkTextSec">
            <UserIcon className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm max-w-[120px] truncate">
            {user ? user.name.split(' ')[0] : t('topBar.login')}
          </span>
          {user && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orangeTint text-accentOrange uppercase">
              {user.role}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
