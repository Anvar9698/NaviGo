import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  SupportedLocale,
  TRANSLATIONS,
  WeatherData,
  AirQualityData,
  MapFeature,
  RouteResult
} from '@yol/shared';

export type AppTheme = 'light' | 'dark' | 'high-contrast';
export type MapDisplayMode = 'combined' | 'weather' | 'roads';
export type AppNavTab = 'map' | 'my-reports' | 'help' | 'settings' | 'editor' | 'admin' | 'analyst';

interface AppContextType {
  locale: SupportedLocale;
  setLocale: (l: SupportedLocale) => void;
  t: (key: string) => any;
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  textScale: number;
  setTextScale: (scale: number) => void;
  reduceMotion: boolean;
  setReduceMotion: (r: boolean) => void;
  user: User | null;
  token: string | null;
  loginAs: (user: User, token: string) => void;
  logout: () => void;
  mapMode: MapDisplayMode;
  setMapMode: (m: MapDisplayMode) => void;
  activeTab: AppNavTab;
  setActiveTab: (tab: AppNavTab) => void;
  userCoords: { lat: number; lon: number };
  setUserCoords: (coords: { lat: number; lon: number }) => void;
  locationStatus: 'prompt' | 'granted' | 'denied';
  setLocationStatus: (s: 'prompt' | 'granted' | 'denied') => void;
  isReportingOpen: boolean;
  setIsReportingOpen: (open: boolean) => void;
  isLegendOpen: boolean;
  setIsLegendOpen: (open: boolean) => void;
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;
  isListAlternative: boolean;
  setIsListAlternative: (open: boolean) => void;
  features: MapFeature[];
  weather: WeatherData | null;
  airQuality: AirQualityData | null;
  activeRoute: RouteResult | null;
  setActiveRoute: (route: RouteResult | null) => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default coordinates: Tashkent Center
const DEFAULT_COORDS = { lat: 41.3111, lon: 69.2797 };

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    return (localStorage.getItem('yol_locale') as SupportedLocale) || 'uz';
  });

  const [theme, setThemeState] = useState<AppTheme>(() => {
    return (localStorage.getItem('yol_theme') as AppTheme) || 'light';
  });

  const [textScale, setTextScaleState] = useState<number>(() => {
    return parseFloat(localStorage.getItem('yol_text_scale') || '1');
  });

  const [reduceMotion, setReduceMotionState] = useState<boolean>(() => {
    return localStorage.getItem('yol_reduce_motion') === 'true';
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('yol_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('yol_token');
  });

  const [mapMode, setMapMode] = useState<MapDisplayMode>('combined');
  const [activeTab, setActiveTab] = useState<AppNavTab>('map');
  const [userCoords, setUserCoords] = useState(DEFAULT_COORDS);
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  const [isReportingOpen, setIsReportingOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isListAlternative, setIsListAlternative] = useState(false);

  const [features, setFeatures] = useState<MapFeature[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);

  // Sync theme to DOM class
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'high-contrast');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'high-contrast') {
      root.classList.add('high-contrast');
    }
    localStorage.setItem('yol_theme', theme);
  }, [theme]);

  // Sync text scale to CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--text-scale', textScale.toString());
    localStorage.setItem('yol_text_scale', textScale.toString());
  }, [textScale]);

  // Sync reduce motion class
  useEffect(() => {
    if (reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
    localStorage.setItem('yol_reduce_motion', reduceMotion ? 'true' : 'false');
  }, [reduceMotion]);

  const setLocale = (l: SupportedLocale) => {
    setLocaleState(l);
    localStorage.setItem('yol_locale', l);
  };

  const setTheme = (t: AppTheme) => {
    setThemeState(t);
  };

  const setTextScale = (scale: number) => {
    setTextScaleState(scale);
  };

  const setReduceMotion = (r: boolean) => {
    setReduceMotionState(r);
  };

  const loginAs = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('yol_user', JSON.stringify(userData));
    localStorage.setItem('yol_token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('yol_user');
    localStorage.removeItem('yol_token');
    setActiveTab('map');
  };

  // Translation helper function
  const t = (path: string): any => {
    const keys = path.split('.');
    let current: any = TRANSLATIONS[locale] || TRANSLATIONS.uz;
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        return path;
      }
    }
    return current;
  };

  const refreshData = async () => {
    try {
      const [featRes, wRes, aqRes] = await Promise.all([
        fetch('/api/v1/map/features'),
        fetch(`/api/v1/map/weather?lat=${userCoords.lat}&lon=${userCoords.lon}`),
        fetch(`/api/v1/map/air-quality?lat=${userCoords.lat}&lon=${userCoords.lon}`)
      ]);

      if (featRes.ok) {
        const featData = await featRes.json();
        setFeatures(featData.features || []);
      }
      if (wRes.ok) {
        const wData = await wRes.json();
        setWeather(wData);
      }
      if (aqRes.ok) {
        const aqData = await aqRes.json();
        setAirQuality(aqData);
      }
    } catch (e) {
      console.warn('Data fetch error, using local state:', e);
    }
  };

  useEffect(() => {
    refreshData();
  }, [userCoords]);

  return (
    <AppContext.Provider
      value={{
        locale,
        setLocale,
        t,
        theme,
        setTheme,
        textScale,
        setTextScale,
        reduceMotion,
        setReduceMotion,
        user,
        token,
        loginAs,
        logout,
        mapMode,
        setMapMode,
        activeTab,
        setActiveTab,
        userCoords,
        setUserCoords,
        locationStatus,
        setLocationStatus,
        isReportingOpen,
        setIsReportingOpen,
        isLegendOpen,
        setIsLegendOpen,
        isAuthOpen,
        setIsAuthOpen,
        isListAlternative,
        setIsListAlternative,
        features,
        weather,
        airQuality,
        activeRoute,
        setActiveRoute,
        refreshData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
