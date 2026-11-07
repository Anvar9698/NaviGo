import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Lock, Mail, User as UserIcon, Shield, Check } from 'lucide-react';
import { UserRole } from '@yol/shared';

export const AuthModal: React.FC = () => {
  const { isAuthOpen, setIsAuthOpen, loginAs, user, logout, t } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const endpoint = isRegister ? '/api/v1/auth/register' : '/api/v1/auth/login';
    const payload = isRegister ? { email, name, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        loginAs(data.user, data.token);
        setIsAuthOpen(false);
      } else {
        const msg = data.details?.[0]?.message || data.error || 'Authentication failed';
        setErrorMsg(msg);
      }
    } catch (err: any) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'Password123!' })
      });
      const data = await res.json();
      if (res.ok) {
        loginAs(data.user, data.token);
        setIsAuthOpen(false);
      }
    } catch (e) {
      setErrorMsg('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="w-full max-w-md bg-white dark:bg-darkCard rounded-card shadow-float border border-yolBorder dark:border-darkBorder p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b border-yolBorder dark:border-darkBorder">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orangeTint text-accentOrange flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-xl font-bold text-textPrimary dark:text-darkText">
                {user ? t('auth.accountProfile') : isRegister ? t('auth.citizenRegistration') : t('auth.signIn')}
              </h2>
              <span className="text-xs text-textSecondary dark:text-darkTextSec">
                {t('auth.signInSubtitle')}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsAuthOpen(false)}
            className="w-10 h-10 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center text-textSecondary dark:text-darkTextSec hover:text-textPrimary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {user ? (
          <div className="py-6 space-y-4">
            <div className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-textSecondary">{t('auth.nameLabel')}</span>
                <span className="font-bold text-textPrimary dark:text-darkText">{user.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-textSecondary">{t('auth.emailLabel')}</span>
                <span className="font-bold text-textPrimary dark:text-darkText">{user.email}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-textSecondary">{t('auth.roleLabel')}</span>
                <span className="font-bold uppercase text-accentOrange px-2 py-0.5 rounded-full bg-orangeTint/50">
                  {user.role}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-textSecondary">{t('auth.twoFaProtection')}</span>
                <span className="font-bold text-statusSuccess">{t('auth.enabled')}</span>
              </div>
            </div>

            <button
              onClick={() => { logout(); setIsAuthOpen(false); }}
              className="w-full py-3 rounded-full bg-statusDangerBg text-statusDanger font-bold hover:bg-red-100 transition-colors"
            >
              {t('auth.signOut')}
            </button>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-statusDangerBg text-statusDanger text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAuth} className="mt-4 space-y-3">
              {isRegister && (
                <div>
                  <label className="text-xs font-bold text-textSecondary dark:text-darkTextSec mb-1 block">
                    {t('auth.fullName')}
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-textSecondary" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('auth.fullNamePlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-innerSoftArea dark:bg-gray-800 text-sm text-textPrimary dark:text-darkText border border-yolBorder dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-accentOrange"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-textSecondary dark:text-darkTextSec mb-1 block">
                  {t('auth.emailAddress')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-textSecondary" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.uz"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-innerSoftArea dark:bg-gray-800 text-sm text-textPrimary dark:text-darkText border border-yolBorder dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-accentOrange"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-textSecondary dark:text-darkTextSec mb-1 block">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-textSecondary" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-innerSoftArea dark:bg-gray-800 text-sm text-textPrimary dark:text-darkText border border-yolBorder dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-accentOrange"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-full bg-blackPill text-white font-bold hover:bg-blackPillHover transition-colors disabled:opacity-50 mt-2"
              >
                {isLoading ? t('auth.completing') : isRegister ? t('auth.completeRegistration') : t('auth.signIn')}
              </button>
            </form>

            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => { setIsRegister(!isRegister); setErrorMsg(''); }}
                className="text-xs text-accentOrange font-semibold hover:underline"
              >
                {isRegister ? t('auth.alreadyAccount') : t('auth.needAccount')}
              </button>
            </div>

            {/* Quick 1-Click Role Switcher */}
            <div className="mt-6 pt-4 border-t border-yolBorder dark:border-darkBorder">
              <span className="text-[11px] font-bold text-textSecondary dark:text-darkTextSec uppercase tracking-wider block mb-2 text-center">
                {t('auth.quickAccess')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('admin@yol.uz')}
                  className="p-2.5 rounded-xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 text-left hover:border-accentOrange transition-colors"
                >
                  <span className="text-xs font-bold block text-textPrimary dark:text-darkText">{t('auth.roles.admin')}</span>
                  <span className="text-[10px] text-textSecondary">admin@yol.uz</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('editor@yol.uz')}
                  className="p-2.5 rounded-xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 text-left hover:border-accentOrange transition-colors"
                >
                  <span className="text-xs font-bold block text-textPrimary dark:text-darkText">{t('auth.roles.editor')}</span>
                  <span className="text-[10px] text-textSecondary">editor@yol.uz</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('analyst@yol.uz')}
                  className="p-2.5 rounded-xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 text-left hover:border-accentOrange transition-colors"
                >
                  <span className="text-xs font-bold block text-textPrimary dark:text-darkText">{t('auth.roles.analyst')}</span>
                  <span className="text-[10px] text-textSecondary">analyst@yol.uz</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('citizen@yol.uz')}
                  className="p-2.5 rounded-xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 text-left hover:border-accentOrange transition-colors"
                >
                  <span className="text-xs font-bold block text-textPrimary dark:text-darkText">{t('auth.roles.citizen')}</span>
                  <span className="text-[10px] text-textSecondary">citizen@yol.uz</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('dispatcher@103.uz')}
                  className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-left hover:border-red-500 transition-colors"
                >
                  <span className="text-xs font-bold block text-red-700 dark:text-red-300">{t('auth.roles.dispatcher')} 103</span>
                  <span className="text-[10px] text-textSecondary">dispatcher@103.uz</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('driver@103.uz')}
                  className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-left hover:border-red-500 transition-colors"
                >
                  <span className="text-xs font-bold block text-red-700 dark:text-red-300">{t('auth.roles.driver')} #101</span>
                  <span className="text-[10px] text-textSecondary">driver@103.uz</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
