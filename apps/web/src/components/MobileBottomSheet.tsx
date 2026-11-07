import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ChevronUp, 
  ChevronDown, 
  AlertTriangle, 
  Car, 
  Cone, 
  MapPin, 
  FileText, 
  HelpCircle, 
  Settings, 
  Plus,
  Truck 
} from 'lucide-react';

export const MobileBottomSheet: React.FC = () => {
  const { 
    features, 
    weather, 
    airQuality, 
    activeRoute,
    userCoords,
    setFocusedLocation,
    activeTab, 
    setActiveTab, 
    setIsReportingOpen, 
    t 
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);

  const activeWeather = activeRoute?.destinationWeather || weather;
  const activeAqi = activeRoute?.destinationAirQuality || airQuality;
  const displayedFeatures = activeRoute
    ? (activeRoute.routeIncidents || [])
    : features.filter(
        f => Boolean(f.linkedReportId) || Math.hypot(f.latitude - userCoords.lat, f.longitude - userCoords.lon) <= 0.25
      );

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center">
      {/* Floating Buttons on Mobile: 103 Ambulance & Report Problem */}
      <div className="mb-3 flex items-center gap-2">
        <a
          href="#/ambulance"
          className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-3 rounded-full shadow-float font-extrabold text-sm border border-red-700 active:scale-95 transition-all"
        >
          <Truck className="w-4 h-4 text-white" />
          <span>Favqulodda Xizmatlar (SOS)</span>
        </a>

        <button
          onClick={() => setIsReportingOpen(true)}
          className="flex items-center gap-2 bg-blackPill text-white px-4 py-3 rounded-full shadow-float font-bold text-sm border border-gray-700 active:scale-95 transition-all"
        >
          <div className="w-5 h-5 rounded-full bg-accentOrange flex items-center justify-center text-white">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>
          <span>{t('map.reportProblem')}</span>
        </button>
      </div>

      {/* Bottom Sheet Card */}
      <div className="w-full bg-white dark:bg-darkCard rounded-t-[28px] shadow-float border-t border-yolBorder dark:border-darkBorder transition-all duration-300">
        {/* Drag Handle & Summary Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full pt-3 pb-2 px-5 flex flex-col items-center justify-center text-center cursor-pointer"
        >
          <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700 mb-2"></div>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-left">
              <span className="w-2.5 h-2.5 rounded-full bg-accentOrange animate-ping"></span>
              <span className="text-xs font-bold text-textPrimary dark:text-darkText">
                {displayedFeatures.length} {t('roads.summarySuffix')}
              </span>
            </div>
            {activeWeather && (
              <span className="text-xs font-bold text-textSecondary dark:text-darkTextSec">
                {activeWeather.city}: {activeWeather.temperatureC > 0 ? '+' : ''}{activeWeather.temperatureC}°C • {activeWeather.conditionText}
              </span>
            )}
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-textSecondary" />
            ) : (
              <ChevronUp className="w-5 h-5 text-textSecondary" />
            )}
          </div>
        </button>

        {/* Expanded Drawer Content */}
        {isExpanded && (
          <div className="px-5 py-3 max-h-[50vh] overflow-y-auto space-y-3">
            {/* Weather & AQI Mini Card */}
            {activeWeather && (
              <div className="p-3.5 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700">
                <div className="flex justify-between items-center text-xs font-bold text-textPrimary dark:text-darkText">
                  <span>{activeWeather.city}</span>
                  <span className="text-statusSuccess">AQI: {activeAqi?.aqi || 28} ({activeAqi?.aqiLevel || 'Good'})</span>
                </div>
                <div className="text-xl font-extrabold text-textPrimary dark:text-darkText mt-1">
                  {activeWeather.temperatureC > 0 ? '+' : ''}{activeWeather.temperatureC}°C
                </div>
                <p className="text-[11px] text-textSecondary dark:text-darkTextSec mt-1">
                  {activeAqi?.advice}
                </p>
              </div>
            )}

            {/* Road Incidents List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-textSecondary uppercase">
                {activeRoute ? "Yo'nalishdagi muammolar" : t('roads.title')}
              </span>
              {displayedFeatures.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setFocusedLocation({ lat: item.latitude, lon: item.longitude });
                    setIsExpanded(false);
                  }}
                  className="p-3 rounded-xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 text-xs cursor-pointer"
                >
                  <div className="flex justify-between items-center font-bold text-textPrimary dark:text-darkText">
                    <span>{item.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orangeTint text-accentOrange">
                      {item.source}
                    </span>
                  </div>
                  <p className="text-[11px] text-textSecondary mt-0.5">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Floating Nav Bar (Mobile Tabs) */}
        <nav 
          aria-label="Mobile Navigation"
          className="flex items-center justify-around py-3 px-2 border-t border-yolBorder dark:border-darkBorder"
        >
          <button
            onClick={() => { setActiveTab('map'); setIsExpanded(false); }}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'map' ? 'text-accentOrange font-bold' : 'text-textSecondary'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px]">{t('nav.map')}</span>
          </button>

          <button
            onClick={() => { setActiveTab('my-reports'); setIsExpanded(false); }}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'my-reports' ? 'text-accentOrange font-bold' : 'text-textSecondary'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px]">{t('nav.myReports')}</span>
          </button>

          <button
            onClick={() => { setActiveTab('help'); setIsExpanded(false); }}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'help' ? 'text-accentOrange font-bold' : 'text-textSecondary'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-[10px]">{t('nav.help')}</span>
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setIsExpanded(false); }}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'settings' ? 'text-accentOrange font-bold' : 'text-textSecondary'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px]">{t('nav.settings')}</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
