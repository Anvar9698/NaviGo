import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  SupportedLocale,
  TRANSLATIONS,
  WeatherData,
  AirQualityData,
  MapFeature,
  RouteResult,
  Report
} from '@yol/shared';

export type AppTheme = 'light' | 'dark' | 'high-contrast';
export type MapDisplayMode = 'combined' | 'weather' | 'roads';
export type AppNavTab = 'map' | 'my-reports' | 'help' | 'settings' | 'editor' | 'admin' | 'analyst';
export type TravelMode = 'car' | 'transit' | 'bike' | 'walk';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'report' | 'road' | 'weather';
  timestamp: string;
  isRead: boolean;
  latitude?: number;
  longitude?: number;
}

export interface DistrictWeather {
  name: string;
  lat: number;
  lon: number;
  temp: number;
  aqi: number;
  aqiLevel: 'Good' | 'Moderate' | 'Unhealthy';
  wind: number;
}

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
  focusedLocation: { lat: number; lon: number } | null;
  setFocusedLocation: (coords: { lat: number; lon: number } | null) => void;
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
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  features: MapFeature[];
  userReports: Report[];
  weather: WeatherData | null;
  airQuality: AirQualityData | null;
  districtsWeather: DistrictWeather[];
  selectedDistrict: DistrictWeather | null;
  setSelectedDistrict: (d: DistrictWeather | null) => void;
  
  // Navigation & Multi-Modal Routing
  travelMode: TravelMode;
  setTravelMode: (m: TravelMode) => void;
  activeRoute: RouteResult | null;
  setActiveRoute: (route: RouteResult | null) => void;
  isNavigating: boolean;
  setIsNavigating: (nav: boolean) => void;
  currentNavStep: number;
  setCurrentNavStep: (step: number) => void;
  isVoiceMuted: boolean;
  setIsVoiceMuted: (muted: boolean) => void;
  startNavigation: () => void;
  stopNavigation: () => void;
  speakInstruction: (text: string) => void;
  requestRoute: (destLat: number, destLon: number, mode?: TravelMode, destName?: string) => Promise<void>;

  refreshData: () => Promise<void>;
  fetchUserReports: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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
  const [focusedLocation, setFocusedLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  const [isReportingOpen, setIsReportingOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isListAlternative, setIsListAlternative] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [features, setFeatures] = useState<MapFeature[]>([]);
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [districtsWeather, setDistrictsWeather] = useState<DistrictWeather[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictWeather | null>(null);

  // Routing & Navigation states
  const [travelMode, setTravelMode] = useState<TravelMode>('car');
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentNavStep, setCurrentNavStep] = useState(0);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);

  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      title: "Buyuk Ipak Yo'lida ta'mir ishlari",
      message: "Avtomobillar harakati vaqtincha Mirzo Ulug'bek ko'chasi orqali aylanib o'tmoqda.",
      type: 'road',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      isRead: false,
      latitude: 41.3289,
      longitude: 69.3350
    },
    {
      id: 'notif-2',
      title: "Xabaringiz tekshirilmoqda",
      message: "Minor kanali bo'yidagi daraxt shoxi to'siqligi bo'yicha hisobotingiz tahririyat tomonidan qabul qilindi.",
      type: 'report',
      timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      isRead: false,
      latitude: 41.3320,
      longitude: 69.2830
    },
    {
      id: 'notif-3',
      title: "Ob-havo yangilanishi",
      message: "Toshkentda havo sifati o'rtacha toza darajada (AQI 34). Sayr qilish uchun qulay.",
      type: 'weather',
      timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      isRead: true
    }
  ]);

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

  useEffect(() => {
    document.documentElement.style.setProperty('--text-scale', textScale.toString());
    localStorage.setItem('yol_text_scale', textScale.toString());
  }, [textScale]);

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

  const setTheme = (t: AppTheme) => setThemeState(t);
  const setTextScale = (scale: number) => setTextScaleState(scale);
  const setReduceMotion = (r: boolean) => setReduceMotionState(r);

  const loginAs = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('yol_user', JSON.stringify(userData));
    localStorage.setItem('yol_token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUserReports([]);
    localStorage.removeItem('yol_user');
    localStorage.removeItem('yol_token');
    setActiveTab('map');
  };

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

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const fetchUserReports = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/reports/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserReports(data.reports || []);
      }
    } catch (e) {
      console.warn('Failed to load user reports:', e);
    }
  };

  // Speech synthesis for Voice Navigation
  const speakInstruction = (text: string) => {
    if (isVoiceMuted || typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === 'ru' ? 'ru-RU' : locale === 'en' ? 'en-US' : 'uz-UZ';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Request Route with given mode
  const requestRoute = async (destLat: number, destLon: number, mode = travelMode, destName?: string) => {
    try {
      const url = `/api/v1/map/route?startLat=${userCoords.lat}&startLon=${userCoords.lon}&endLat=${destLat}&endLon=${destLon}&mode=${mode}&destinationName=${encodeURIComponent(destName || '')}`;
      const res = await fetch(url);
      if (res.ok) {
        const routeData: RouteResult = await res.json();
        setActiveRoute(routeData);
        setCurrentNavStep(0);
      }
    } catch (err) {
      console.warn('Error fetching route:', err);
    }
  };

  // Start active navigation
  const startNavigation = () => {
    if (!activeRoute || activeRoute.steps.length === 0) return;
    setIsNavigating(true);
    setCurrentNavStep(0);
    const firstStep = activeRoute.steps[0];
    speakInstruction(firstStep.instruction);
  };

  // Stop active navigation
  const stopNavigation = () => {
    setIsNavigating(false);
    setCurrentNavStep(0);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const refreshData = async () => {
    try {
      const [featRes, wRes, aqRes, distRes] = await Promise.all([
        fetch('/api/v1/map/features'),
        fetch(`/api/v1/map/weather?lat=${userCoords.lat}&lon=${userCoords.lon}`),
        fetch(`/api/v1/map/air-quality?lat=${userCoords.lat}&lon=${userCoords.lon}`),
        fetch('/api/v1/map/districts-weather')
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
      if (distRes.ok) {
        const distData = await distRes.json();
        setDistrictsWeather(distData.districts || []);
      }

      if (token) {
        await fetchUserReports();
      }
    } catch (e) {
      console.warn('Data fetch error:', e);
    }
  };

  useEffect(() => {
    refreshData();
  }, [userCoords, token]);

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
        focusedLocation,
        setFocusedLocation,
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
        isNotificationsOpen,
        setIsNotificationsOpen,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        features,
        userReports,
        weather,
        airQuality,
        districtsWeather,
        selectedDistrict,
        setSelectedDistrict,

        // Routing & Navigation
        travelMode,
        setTravelMode,
        activeRoute,
        setActiveRoute,
        isNavigating,
        setIsNavigating,
        currentNavStep,
        setCurrentNavStep,
        isVoiceMuted,
        setIsVoiceMuted,
        startNavigation,
        stopNavigation,
        speakInstruction,
        requestRoute,

        refreshData,
        fetchUserReports
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
