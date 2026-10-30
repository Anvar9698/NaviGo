import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ShieldAlert, 
  Users, 
  Settings, 
  LogOut, 
  UserCheck, 
  Building2, 
  Truck, 
  BarChart3, 
  TrendingUp,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';
import { 
  AmbulanceStatePayload, 
  AmbulanceStats, 
  Hospital, 
  AmbulanceUnit, 
  EmergencyRequest, 
  SupportedLocale 
} from '@yol/shared';
import { useApp } from '../context/AppContext';
import { ambulanceApi } from './ambulanceApi';
import { CitizenRequest } from './CitizenRequest';
import { DispatcherInbox } from './DispatcherInbox';
import { DriverNavigation } from './DriverNavigation';
import { AmbulanceMapLayer } from './AmbulanceMapLayer';
import { MapContainer } from '../components/MapContainer';
import { AuthModal } from '../components/AuthModal';
import { SettingsModal } from '../components/SettingsModal';

export const AmbulanceApp: React.FC = () => {
  const { 
    user, 
    loginAs, 
    logout, 
    locale, 
    setLocale, 
    theme, 
    setTheme, 
    setActiveTab, 
    setIsAuthOpen,
    t 
  } = useApp();

  const [state, setState] = useState<AmbulanceStatePayload | null>(null);
  const [stats, setStats] = useState<AmbulanceStats>({
    totalCalls: 12,
    activeCalls: 2,
    completedCalls: 10,
    averageMinutesSaved: 9.5,
    baselineQueuePenaltyMinutes: 12
  });
  const [selectedRoleOverride, setSelectedRoleOverride] = useState<'CITIZEN' | 'DISPATCHER' | 'DRIVER' | 'ANALYST' | 'ADMIN' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Poll state every 1.5 seconds
  const fetchState = async () => {
    try {
      const data = await ambulanceApi.fetchState();
      setState(data);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch {
      // Fallback state if server polling fails
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 1500);
    return () => clearInterval(interval);
  }, [user]);

  // Determine active view mode
  const effectiveRole = selectedRoleOverride || state?.role || (user?.role === 'ADMIN' ? 'ADMIN' : 'CITIZEN');

  const handleDemoLogin = async (email: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Password123!' })
      });
      const data = await res.json();
      if (res.ok) {
        loginAs(data.user, data.token);
        setSelectedRoleOverride(null);
        await fetchState();
      } else {
        alert(data.message || 'Kirishda xatolik yuz berdi');
      }
    } catch (err: any) {
      alert(err.message || 'Kirishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const locales: SupportedLocale[] = ['uz', 'ru', 'en'];

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-outerBg dark:bg-darkOuter p-2 sm:p-4">
      {/* Outer App Panel Container with 32px radius */}
      <div className="w-full h-full flex flex-col bg-appPanel dark:bg-darkPanel rounded-panel shadow-float border border-yolBorder dark:border-darkBorder overflow-hidden">
        
        {/* Ambulance Top Header Bar */}
        <header className="w-full flex items-center justify-between px-3 md:px-6 py-3 border-b border-yolBorder dark:border-darkBorder bg-white/70 dark:bg-darkCard/70 backdrop-blur-md z-30 select-none">
          {/* Left: Back Link & 103 Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { window.location.hash = ''; }}
              className="flex items-center gap-2 bg-innerSoftArea dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3.5 py-2 rounded-full text-xs font-bold text-textPrimary dark:text-darkText transition-all border border-yolBorder dark:border-gray-700"
              title="Yo'l Ma'lumoti bosh sahifasiga qaytish"
            >
              <ArrowLeft className="w-4 h-4 text-accentOrange" />
              <span className="hidden sm:inline">Yo'l Ma'lumoti</span>
            </button>

            <div className="flex items-center gap-2.5 bg-red-600 text-white px-4 py-2 rounded-full shadow-md font-black text-sm">
              <span className="text-base animate-pulse">🚑</span>
              <span>Tez Yordam 103</span>
            </div>
          </div>

          {/* Center: Role Switcher Pill (Live Simulation) */}
          <div className="hidden lg:flex items-center gap-1 bg-innerSoftArea dark:bg-gray-800/80 p-1 rounded-full border border-yolBorder dark:border-gray-700">
            {(['CITIZEN', 'DISPATCHER', 'DRIVER', 'ANALYST', 'ADMIN'] as const).map(role => (
              <button
                key={role}
                onClick={() => setSelectedRoleOverride(role)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  effectiveRole === role
                    ? 'bg-blackPill text-white shadow-sm'
                    : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                {role === 'CITIZEN' && 'Fuqaro'}
                {role === 'DISPATCHER' && 'Dispetcher'}
                {role === 'DRIVER' && 'Haydovchi'}
                {role === 'ANALYST' && 'Tahlilchi'}
                {role === 'ADMIN' && 'Admin'}
              </button>
            ))}
          </div>

          {/* Right: Quick Demo Staff Logins, Language, Theme, Settings */}
          <div className="flex items-center gap-2">
            {/* Quick Demo Logins Dropdown or Quick Buttons */}
            {!user ? (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={() => handleDemoLogin('dispatcher@103.uz')}
                  disabled={isLoading}
                  className="px-2.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  Dispetcher 103
                </button>
                <button
                  onClick={() => handleDemoLogin('driver@103.uz')}
                  disabled={isLoading}
                  className="px-2.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  Haydovchi #101
                </button>
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="px-3 py-1.5 rounded-full bg-blackPill text-white text-xs font-bold hover:bg-blackPillHover"
                >
                  Kirish
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-innerSoftArea dark:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200">
                  <UserCheck className="w-3.5 h-3.5 text-accentOrange" />
                  <span className="truncate max-w-[120px]">{user.name.split(' ')[0]}</span>
                </div>
                <button
                  onClick={logout}
                  title="Chiqish"
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-textSecondary"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                </button>
              </div>
            )}

            {/* Language Switcher */}
            <div className="flex items-center bg-white dark:bg-darkCard p-1 rounded-full shadow-soft border border-yolBorder dark:border-darkBorder">
              {locales.map(l => (
                <button
                  key={l}
                  onClick={() => setLocale(l)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-full uppercase transition-all ${
                    locale === l
                      ? 'bg-blackPill text-white'
                      : 'text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 rounded-full bg-white dark:bg-darkCard flex items-center justify-center shadow-soft border border-yolBorder dark:border-darkBorder text-textPrimary dark:text-darkText hover:bg-gray-50 dark:hover:bg-gray-800"
              title="Mavzu (Yorug'/Qorong'i)"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-accentOrange" /> : <Moon className="w-4 h-4 text-textSecondary" />}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setActiveTab('settings')}
              className="w-9 h-9 rounded-full bg-white dark:bg-darkCard flex items-center justify-center shadow-soft border border-yolBorder dark:border-darkBorder text-textPrimary dark:text-darkText hover:bg-gray-50 dark:hover:bg-gray-800"
              title="Sozlamalar"
            >
              <Settings className="w-4 h-4 text-accentOrange" />
            </button>
          </div>
        </header>

        {/* Ambulance Workspace Body */}
        <div className="flex-1 flex overflow-hidden p-2 sm:p-4 gap-4 relative">
          
          {/* Left Specialized Dispatch & Intake Panel */}
          <aside className="w-full sm:w-[420px] lg:w-[460px] h-full flex flex-col bg-white dark:bg-darkCard rounded-card shadow-soft border border-yolBorder dark:border-darkBorder overflow-hidden shrink-0 z-20">
            {/* Panel Top Title & Active Role Pill */}
            <div className="p-4 border-b border-yolBorder dark:border-darkBorder flex items-center justify-between bg-innerSoftArea/40 dark:bg-gray-800/40">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚑</span>
                <span className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                  {effectiveRole === 'CITIZEN' && 'Tez Tibbiy Yordam Chaqirish'}
                  {effectiveRole === 'DISPATCHER' && '103 Dispetcherlik Markazi'}
                  {effectiveRole === 'DRIVER' && 'Ekipaj Navigatsiyasi (Waze)'}
                  {effectiveRole === 'ANALYST' && 'Dispetcherlik Tahlili & Statistika'}
                  {effectiveRole === 'ADMIN' && 'Tizim Boshqaruvi & Avtopark'}
                </span>
              </div>

              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-accentOrange text-white uppercase">
                {effectiveRole}
              </span>
            </div>

            {/* Scrollable Role Content */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {effectiveRole === 'CITIZEN' && (
                <CitizenRequest
                  activeRequest={state?.activeRequest}
                  assignedAmbulance={state?.ambulances?.[0]}
                  hospitals={state?.hospitals || []}
                  onRefresh={fetchState}
                />
              )}

              {effectiveRole === 'DISPATCHER' && (
                <DispatcherInbox
                  binding={state?.binding}
                  hospitals={state?.hospitals || []}
                  ambulances={state?.ambulances || []}
                  pendingRequests={state?.pendingRequests || []}
                  activeRequest={state?.activeRequest}
                  onRefresh={fetchState}
                />
              )}

              {effectiveRole === 'DRIVER' && (
                <DriverNavigation
                  binding={state?.binding}
                  ambulance={state?.ambulances?.[0]}
                  assignedRequest={state?.assignedRequest || state?.activeRequest}
                  onRefresh={fetchState}
                />
              )}

              {effectiveRole === 'ANALYST' && (
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-card bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700">
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                      O'rtacha tejalgan vaqt
                    </span>
                    <div className="text-3xl font-black text-emerald-800 dark:text-emerald-100 mt-1 flex items-baseline gap-2">
                      <span>+{stats.averageMinutesSaved} daqiqa</span>
                      <TrendingUp className="w-5 h-5 text-emerald-600 inline" />
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2 leading-relaxed">
                      Eski tizimda har bir tuman faqat o'z poliklinikasi mashinasini kutgan (navbat penaltisi: {stats.baselineQueuePenaltyMinutes} min). Yangi aqlli multi-shifoxona tizimi eng tez yetib boradigan bo'sh brigadani biriktiradi.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-card bg-innerSoftArea dark:bg-gray-800">
                      <span className="text-[10px] font-bold text-textSecondary uppercase block">Jami chaqiruvlar</span>
                      <span className="text-2xl font-black text-gray-900 dark:text-gray-100">{stats.totalCalls}</span>
                    </div>

                    <div className="p-3.5 rounded-card bg-innerSoftArea dark:bg-gray-800">
                      <span className="text-[10px] font-bold text-textSecondary uppercase block">Muvaffaqiyatli</span>
                      <span className="text-2xl font-black text-blue-600">{stats.completedCalls}</span>
                    </div>
                  </div>

                  {/* Registered Hospitals List */}
                  <div className="flex flex-col gap-2 mt-2">
                    <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                      Shifoxonalar tarmog'i ({state?.hospitals?.length || 0})
                    </h3>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-yolBorder dark:border-darkBorder rounded-2xl overflow-hidden bg-white dark:bg-darkCard">
                      {(state?.hospitals || []).map(h => (
                        <div key={h.id} className="p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-gray-800 dark:text-gray-200 block truncate max-w-[240px]">
                              {h.name}
                            </span>
                            <span className="text-[10px] text-textSecondary">
                              {h.type === 'private' ? 'Xususiy klinika' : 'Davlat markazi'} • {h.address}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            Demo
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {effectiveRole === 'ADMIN' && (
                <div className="flex flex-col gap-4">
                  <div className="p-3.5 rounded-card bg-blue-50 dark:bg-blue-950/40 border border-blue-200 text-xs">
                    <span className="font-bold text-blue-900 dark:text-blue-200 block">Administrator nazorati:</span>
                    <p className="text-blue-800 dark:text-blue-300 mt-0.5">
                      Toshkent va Farg'ona mintaqasi bo'yicha shifoxonalar, tez yordam mashinalari va xodimlar biriktirmalarini boshqarish.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-black text-gray-900 dark:text-gray-100 uppercase">
                      <span>Ambulanslar parki ({state?.ambulances?.length || 0})</span>
                      <button
                        onClick={fetchState}
                        className="text-accentOrange flex items-center gap-1 hover:underline"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Yangilash</span>
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 border border-yolBorder dark:border-darkBorder rounded-2xl bg-white dark:bg-darkCard">
                      {(state?.ambulances || []).map(amb => (
                        <div key={amb.id} className="p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-black text-gray-900 dark:text-gray-100 block">
                              {amb.plateNumber}
                            </span>
                            <span className="text-[10px] text-textSecondary font-mono">
                              {amb.hospitalId} • {amb.id}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            amb.status === 'free'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {amb.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Ticker: System Efficiency */}
            <div className="p-3 border-t border-yolBorder dark:border-darkBorder bg-gray-50 dark:bg-gray-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-bold text-gray-700 dark:text-gray-300">
                  Tejalgan o'rtacha vaqt:
                </span>
              </div>
              <span className="font-black text-emerald-600 dark:text-emerald-400">
                +{stats.averageMinutesSaved} daqiqa
              </span>
            </div>
          </aside>

          {/* Interactive Map Area (Reusing MapContainer variant="bare") */}
          <main className="flex-1 h-full relative" aria-label="Ambulance Map Area">
            <MapContainer variant="bare" />
            <AmbulanceMapLayer
              hospitals={state?.hospitals || []}
              ambulances={state?.ambulances || []}
              activeRequest={state?.activeRequest || state?.assignedRequest}
            />
          </main>
        </div>

        {/* Reused Modals */}
        <AuthModal />
        <SettingsModal />
      </div>
    </div>
  );
};
