import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Mic, 
  AlertTriangle, 
  Car, 
  Cone, 
  Clock, 
  List, 
  ChevronRight,
  Bus,
  Bike,
  Footprints,
  Play,
  X,
  MapPin,
  CheckCircle,
  Navigation as NavIcon,
  Sparkles,
  Building,
  Plane,
  Train,
  Trees,
  ShoppingBag,
  Landmark,
  ArrowUpDown,
  ArrowRightLeft,
  LocateFixed,
  CloudSun,
  Zap,
  Fuel,
  Gauge,
  Flag,
  Activity,
  Siren
} from 'lucide-react';
import { TravelMode } from '../context/AppContext';

export interface SuggestedPlace {
  id: string;
  name: string;
  city: string;
  category: 'Markaz' | 'Bozor' | 'Aeroport' | 'Vokzal' | 'Park' | 'Tarixiy' | 'Tibbiyot' | 'Shahar' | 'Dam olish';
  lat: number;
  lon: number;
  tag: string;
}

export const POPULAR_SUGGESTIONS: SuggestedPlace[] = [
  // Tashkent
  { id: 'tash-skver', name: 'Amir Temur xiyoboni', city: 'Toshkent', category: 'Markaz', lat: 41.3111, lon: 69.2797, tag: 'Shahar markazi' },
  { id: 'tash-chorsu', name: 'Chorsu bozori', city: 'Toshkent', category: 'Bozor', lat: 41.3273, lon: 69.2355, tag: 'Eski shahar' },
  { id: 'tash-city', name: 'Tashkent City Park', city: 'Toshkent', category: 'Park', lat: 41.3142, lon: 69.2515, tag: 'Xiyobon va Mall' },
  { id: 'tash-magic', name: 'Magic City bog\'i', city: 'Toshkent', category: 'Park', lat: 41.3023, lon: 69.2483, tag: 'Ko\'ngilochar markaz' },
  { id: 'tash-airport', name: 'Toshkent Xalqaro Aeroporti', city: 'Toshkent', category: 'Aeroport', lat: 41.2579, lon: 69.2812, tag: 'Islom Karimov nomidagi' },
  { id: 'tash-vokzal-n', name: 'Shimoliy vokzal (Toshkent Markaziy)', city: 'Toshkent', category: 'Vokzal', lat: 41.2917, lon: 69.2847, tag: 'Temir yo\'l vokzali' },
  { id: 'tash-vokzal-s', name: 'Janubiy vokzal', city: 'Toshkent', category: 'Vokzal', lat: 41.2612, lon: 69.2132, tag: 'Temir yo\'l vokzali' },
  { id: 'tash-hosp16', name: 'Respublika Shoshilinch Tibbiy Markazi (16)', city: 'Toshkent', category: 'Tibbiyot', lat: 41.2721, lon: 69.2155, tag: 'Kichik halqa yo\'li' },
  { id: 'tash-chilonzor', name: 'Chilonzor Savdo Markazi', city: 'Toshkent', category: 'Bozor', lat: 41.2725, lon: 69.2045, tag: 'Metro Mirzo Ulug\'bek' },
  { id: 'tash-hastimom', name: 'Hazrati Imom (Hastimom)', city: 'Toshkent', category: 'Tarixiy', lat: 41.3364, lon: 69.2415, tag: 'Tarixiy obida' },
  
  // Viloyatlar & Mashhur manzillar
  { id: 'nam-chust', name: 'Chust shahri', city: 'Namangan', category: 'Shahar', lat: 41.0069, lon: 71.2294, tag: 'Pichoqchilik markazi' },
  { id: 'sam-registon', name: 'Registon maydoni', city: 'Samarqand', category: 'Tarixiy', lat: 39.6548, lon: 66.9757, tag: 'Tarixiy obida' },
  { id: 'bux-labi', name: 'Labi Hovuz ansambli', city: 'Buxoro', category: 'Tarixiy', lat: 39.7731, lon: 64.4206, tag: 'Eski shahar' },
  { id: 'xiv-ichan', name: 'Ichan Qal\'a', city: 'Xiva', category: 'Tarixiy', lat: 41.3783, lon: 60.3639, tag: 'Ochiq osmon ostidagi shahar' },
  { id: 'tash-chorvoq', name: 'Chorvoq suv ombori', city: 'Bo\'stonliq', category: 'Dam olish', lat: 41.6322, lon: 70.0272, tag: 'Tog\'li hudud' },
  { id: 'fer-center', name: 'Farg\'ona markazi', city: 'Farg\'ona', category: 'Shahar', lat: 40.3842, lon: 71.7843, tag: 'Al-Farg\'oniy' },
  { id: 'and-center', name: 'Andijon (Bobur maydoni)', city: 'Andijon', category: 'Shahar', lat: 40.7821, lon: 72.3442, tag: 'Shahar markazi' },
  { id: 'qar-center', name: 'Qarshi markazi', city: 'Qashqadaryo', category: 'Shahar', lat: 38.8606, lon: 65.7891, tag: 'Nasaf' },
  { id: 'nuk-center', name: 'Nukus shahri', city: 'Qoraqalpog\'iston', category: 'Shahar', lat: 42.4602, lon: 59.6166, tag: 'Savitskiy muzeyi' },
  { id: 'tash-chirchiq', name: 'Chirchiq shahri', city: 'Toshkent viloyati', category: 'Shahar', lat: 41.4689, lon: 69.5822, tag: 'Chirchiq daryosi' },
  { id: 'tash-angren', name: 'Angren shahri', city: 'Toshkent viloyati', category: 'Shahar', lat: 41.0167, lon: 70.1436, tag: 'A373 trassasi' },
  { id: 'tash-ohangaron', name: 'Ohangaron shahri', city: 'Toshkent viloyati', category: 'Shahar', lat: 40.9064, lon: 69.6383, tag: 'Ohangaron' }
];

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getLocalizedPlaceName(name: string, locale: string): string {
  if (locale === 'ru') {
    const ruMap: Record<string, string> = {
      'Amir Temur xiyoboni': 'Сквер Амира Темура',
      'Chorsu bozori': 'Базар Чорсу',
      'Tashkent City Park': 'Парк Tashkent City',
      'Magic City bog\'i': 'Парк Magic City',
      'Toshkent Xalqaro Aeroporti': 'Международный аэропорт Ташкента',
      'Shimoliy vokzal (Toshkent Markaziy)': 'Северный вокзал (Ташкент)',
      'Janubiy vokzal': 'Южный вокзал (Ташкент)',
      'Respublika Shoshilinch Tibbiy Markazi (16)': 'РНЦЭМП (16-я горбольница)',
      'Chilonzor Savdo Markazi': 'ТЦ Чиланзар',
      'Hazrati Imom (Hastimom)': 'Хазрати Имам (Хастимом)',
      'Chust shahri': 'Город Чуст',
      'Registon maydoni': 'Площадь Регистан (Самарканд)',
      'Labi Hovuz ansambli': 'Ансамбль Ляби-Хауз (Бухара)',
      'Ichan Qal\'a': 'Ичан-Кала (Хива)',
      'Chorvoq suv ombori': 'Чарвакское водохранилище',
      'Farg\'ona markazi': 'Центр Ферганы',
      'Andijon (Bobur maydoni)': 'Андижан (Площадь Бабура)',
      'Qarshi markazi': 'Центр Карши',
      'Nukus shahri': 'Город Нукус',
      'Chirchiq shahri': 'Город Чирчик',
      'Angren shahri': 'Город Ангрен',
      'Ohangaron shahri': 'Город Ахангаран'
    };
    return ruMap[name] || name;
  }
  if (locale === 'en') {
    const enMap: Record<string, string> = {
      'Amir Temur xiyoboni': 'Amir Temur Square',
      'Chorsu bozori': 'Chorsu Bazaar',
      'Tashkent City Park': 'Tashkent City Park',
      'Magic City bog\'i': 'Magic City Park',
      'Toshkent Xalqaro Aeroporti': 'Tashkent International Airport',
      'Shimoliy vokzal (Toshkent Markaziy)': 'North Railway Station',
      'Janubiy vokzal': 'South Railway Station',
      'Respublika Shoshilinch Tibbiy Markazi (16)': 'Emergency Medical Center (Hosp 16)',
      'Chilonzor Savdo Markazi': 'Chilonzor Trade Center',
      'Hazrati Imom (Hastimom)': 'Hazrati Imam Complex',
      'Chust shahri': 'Chust City',
      'Registon maydoni': 'Registan Square (Samarkand)',
      'Labi Hovuz ansambli': 'Lyabi-Khauz Ensemble (Bukhara)',
      'Ichan Qal\'a': 'Itchan Kala (Khiva)',
      'Chorvoq suv ombori': 'Charvak Reservoir',
      'Farg\'ona markazi': 'Fergana Center',
      'Andijon (Bobur maydoni)': 'Andijan (Babur Square)',
      'Qarshi markazi': 'Karshi Center',
      'Nukus shahri': 'Nukus City',
      'Chirchiq shahri': 'Chirchiq City',
      'Angren shahri': 'Angren City',
      'Ohangaron shahri': 'Ohangaron City'
    };
    return enMap[name] || name;
  }
  return name;
}

export function getLocalizedCategory(cat: string, locale: string): string {
  if (locale === 'ru') {
    const map: Record<string, string> = {
      'Markaz': 'Центр',
      'Bozor': 'Базар',
      'Aeroport': 'Аэропорт',
      'Vokzal': 'Вокзал',
      'Park': 'Парк',
      'Tarixiy': 'История',
      'Tibbiyot': 'Больница',
      'Shahar': 'Город',
      'Dam olish': 'Отдых'
    };
    return map[cat] || cat;
  }
  if (locale === 'en') {
    const map: Record<string, string> = {
      'Markaz': 'Center',
      'Bozor': 'Market',
      'Aeroport': 'Airport',
      'Vokzal': 'Station',
      'Park': 'Park',
      'Tarixiy': 'Historical',
      'Tibbiyot': 'Medical',
      'Shahar': 'City',
      'Dam olish': 'Resort'
    };
    return map[cat] || cat;
  }
  return cat;
}

export function getLocalizedWarning(w: string, locale: string): string {
  if (!w) return '';
  if (locale === 'ru') {
    if (w.includes('Alert:') || w.includes('road incident')) {
      return w.replace(/Alert:/i, 'Внимание:')
              .replace(/road incident\(s\) detected near your path:/i, 'обнаружено происшествий на вашем пути:')
              .replace(/\(Live\)/gi, '(В реальном времени)')
              .replace(/Collision near Amir Temur Square/gi, 'ДТП около сквера Амира Темура')
              .replace(/Collision near/gi, 'ДТП в районе')
              .replace(/Amir Temur Square/gi, 'сквера Амира Темура');
    }
    if (w.includes('Sidewalk and pedestrian')) {
      return 'Пешеходные переходы и тротуары проверены на доступность.';
    }
    if (w.includes('Bicycle route:')) {
      return 'Веломаршрут: Пожалуйста, используйте велодорожки или крайнюю правую полосу.';
    }
    if (w.includes('Transit schedule:')) {
      return 'Общественный транспорт: расписание ташкентского автобуса и метро.';
    }
  }
  if (locale === 'uz') {
    if (w.includes('Alert:') || w.includes('road incident')) {
      return w.replace(/Alert:/i, 'Diqqat:')
              .replace(/road incident\(s\) detected near your path:/i, "yo'lingiz yaqinida hodisalar aniqlandi:")
              .replace(/\(Live\)/gi, '(Jonli)')
              .replace(/Collision near Amir Temur Square/gi, "Amir Temur xiyoboni yaqinida to'qnashuv")
              .replace(/Collision near/gi, "yaqinida to'qnashuv")
              .replace(/Amir Temur Square/gi, 'Amir Temur xiyoboni');
    }
  }
  return w;
}

export const LeftPanel: React.FC = () => {
  const { 
    t, 
    locale,
    weather, 
    airQuality, 
    features, 
    userCoords,
    setIsListAlternative,
    activeRoute,
    setActiveRoute,
    travelMode,
    setTravelMode,
    isNavigating,
    startNavigation,
    stopNavigation,
    currentNavStep,
    setCurrentNavStep,
    speakInstruction,
    requestRoute,
    setFocusedLocation,
    originCoords,
    setOriginCoords,
    destinationCoords,
    setDestinationCoords,
    gasStations,
    isGasLayerVisible,
    setIsGasLayerVisible,
    setSelectedGasStation,
    triggerDemoV2XAlert,
    approachingAlert
  } = useApp();

  const [originQuery, setOriginQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeInput, setActiveInput] = useState<'origin' | 'destination'>('destination');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedRouteVariant, setSelectedRouteVariant] = useState<'fastest' | 'bypass'>('fastest');
  const baseRouteCoordsRef = useRef<[number, number][] | null>(null);
  const baseRouteStatsRef = useRef<{ duration: number; distance: number } | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync base route when a new activeRoute arrives
  useEffect(() => {
    if (activeRoute && activeRoute.coordinates && activeRoute.coordinates.length > 0 && selectedRouteVariant === 'fastest') {
      baseRouteCoordsRef.current = activeRoute.coordinates;
      baseRouteStatsRef.current = {
        duration: activeRoute.durationMinutes,
        distance: activeRoute.distanceMeters
      };
    }
  }, [activeRoute?.destinationName, activeRoute?.originName, activeRoute?.mode]);

  const handleSelectRouteVariant = (variant: 'fastest' | 'bypass') => {
    if (!activeRoute || !baseRouteCoordsRef.current || !baseRouteStatsRef.current) return;
    setSelectedRouteVariant(variant);
    if (variant === 'fastest') {
      setActiveRoute({
        ...activeRoute,
        coordinates: baseRouteCoordsRef.current,
        durationMinutes: baseRouteStatsRef.current.duration,
        distanceMeters: baseRouteStatsRef.current.distance
      });
    } else {
      // Create a smooth Yandex/Waze alternative bypass geometry shifted slightly around the congested corridor
      const baseCoords = baseRouteCoordsRef.current;
      const bypassCoords: [number, number][] = baseCoords.map(([lon, lat], idx) => {
        if (idx === 0 || idx === baseCoords.length - 1) return [lon, lat];
        const ratio = Math.sin((idx / (baseCoords.length - 1)) * Math.PI);
        return [Number((lon + 0.0085 * ratio).toFixed(5)), Number((lat - 0.0065 * ratio).toFixed(5))];
      });
      setActiveRoute({
        ...activeRoute,
        coordinates: bypassCoords,
        durationMinutes: Math.max(3, baseRouteStatsRef.current.duration + 3),
        distanceMeters: Math.round(baseRouteStatsRef.current.distance * 1.14)
      });
    }
  };

  // Close search suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Current active query depending on which input is selected
  const activeQuery = activeInput === 'origin' ? originQuery : searchQuery;

  // Filtered suggested places based on active query
  const filteredSuggestions = useMemo(() => {
    const q = activeQuery.trim().toLowerCase();
    if (!q) {
      return POPULAR_SUGGESTIONS.slice(0, 8);
    }
    return POPULAR_SUGGESTIONS.filter(item => 
      item.name.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q) ||
      item.tag.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }, [activeQuery]);

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t('topBar.voiceNotSupported'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'uz-UZ';
    recognition.interimResults = false;

    recognition.onstart = () => setIsVoiceListening(true);
    recognition.onend = () => setIsVoiceListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (activeInput === 'origin') {
        setOriginQuery(transcript);
        triggerSearch(transcript);
      } else {
        setSearchQuery(transcript);
        triggerSearch(transcript);
      }
    };

    recognition.start();
  };

  const triggerSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/v1/map/geocode?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const places = await res.json();
        setSearchResults(places);
      }
    } catch (e) {
      console.warn('Geocoding search failed:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const selectPlace = async (place: { lat: number; lon: number; name: string }) => {
    setIsSearchFocused(false);
    setSearchResults([]);

    if (activeInput === 'origin') {
      setOriginCoords(place);
      setOriginQuery(place.name);
      if (destinationCoords) {
        await requestRoute(destinationCoords.lat, destinationCoords.lon, travelMode, destinationCoords.name, place.lat, place.lon, place.name);
      } else {
        setActiveInput('destination');
      }
    } else {
      setDestinationCoords(place);
      setSearchQuery(place.name);
      const sLat = originCoords ? originCoords.lat : userCoords.lat;
      const sLon = originCoords ? originCoords.lon : userCoords.lon;
      const sName = originCoords ? originCoords.name : (locale === 'ru' ? 'Моё местоположение' : locale === 'en' ? 'My location' : 'Mening joylashuvim');
      await requestRoute(place.lat, place.lon, travelMode, place.name, sLat, sLon, sName);
    }
  };

  const selectGeocodeResult = async (item: any) => {
    const place = {
      lat: item.latitude,
      lon: item.longitude,
      name: item.displayName.split(',')[0]
    };
    await selectPlace(place);
  };

  const selectSuggestedPlace = async (item: SuggestedPlace) => {
    const place = {
      lat: item.lat,
      lon: item.lon,
      name: item.name
    };
    await selectPlace(place);
  };

  const handleSwapRoute = async () => {
    const currentOrigin = originCoords || {
      lat: userCoords.lat,
      lon: userCoords.lon,
      name: locale === 'ru' ? 'Моё местоположение' : locale === 'en' ? 'My location' : 'Mening joylashuvim'
    };
    const currentDest = destinationCoords;

    if (!currentDest) {
      setDestinationCoords(currentOrigin);
      setSearchQuery(currentOrigin.name);
      setOriginCoords(null);
      setOriginQuery('');
      return;
    }

    const newOrigin = { ...currentDest };
    const newDest = { ...currentOrigin };

    setOriginCoords(newOrigin);
    setOriginQuery(newOrigin.name);
    setDestinationCoords(newDest);
    setSearchQuery(newDest.name);

    await requestRoute(newDest.lat, newDest.lon, travelMode, newDest.name, newOrigin.lat, newOrigin.lon, newOrigin.name);
  };

  const handleResetOriginToGps = async () => {
    const defaultName = locale === 'ru' ? 'Моё местоположение' : locale === 'en' ? 'My location' : 'Mening joylashuvim';
    setOriginCoords(null);
    setOriginQuery('');
    if (destinationCoords) {
      await requestRoute(destinationCoords.lat, destinationCoords.lon, travelMode, destinationCoords.name, userCoords.lat, userCoords.lon, defaultName);
    }
  };

  const handleModeChange = async (newMode: TravelMode) => {
    setTravelMode(newMode);
    if (destinationCoords) {
      const sLat = originCoords ? originCoords.lat : userCoords.lat;
      const sLon = originCoords ? originCoords.lon : userCoords.lon;
      const sName = originCoords ? originCoords.name : (locale === 'ru' ? 'Моё местоположение' : locale === 'en' ? 'My location' : 'Mening joylashuvim');
      await requestRoute(destinationCoords.lat, destinationCoords.lon, newMode, destinationCoords.name, sLat, sLon, sName);
    }
  };

  const handleClearRoute = () => {
    stopNavigation();
    setActiveRoute(null);
    setDestinationCoords(null);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const formatDurationText = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hourLabel = locale === 'ru' ? 'ч' : locale === 'en' ? 'h' : 'soat';
    return m > 0 ? `${h} ${hourLabel} ${m} min` : `${h} ${hourLabel}`;
  };

  const localFeatures = useMemo(() => {
    return features.filter(
      f => Boolean(f.linkedReportId) || Math.hypot(f.latitude - userCoords.lat, f.longitude - userCoords.lon) <= 0.25
    );
  }, [features, userCoords]);

  const filteredFeatures = localFeatures.filter(f => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'accidents') return f.featureType === 'accident';
    if (activeFilter === 'traffic') return f.featureType === 'traffic';
    if (activeFilter === 'roadwork') return f.featureType === 'roadwork';
    if (activeFilter === 'closures') return f.featureType === 'closure';
    return true;
  });

  const sortedGasStations = useMemo(() => {
    return [...gasStations].map(station => ({
      ...station,
      distanceKm: calculateDistanceKm(userCoords.lat, userCoords.lon, station.latitude, station.longitude)
    })).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [gasStations, userCoords]);

  return (
    <aside 
      aria-label="Road Information and Weather Panel"
      className="hidden md:flex flex-col gap-4 w-[420px] shrink-0 h-full overflow-y-auto pr-1 z-20 pb-4"
    >
      {/* 1. Dual Route Search Box (Point A & Point B with Instant Swap - only shown before route calculation) */}
      {!activeRoute && (
        <div 
          ref={searchContainerRef}
          className="bg-white dark:bg-darkCard p-3.5 rounded-card shadow-soft border border-yolBorder dark:border-darkBorder relative space-y-2.5"
        >
        <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5 text-xs font-black text-textPrimary dark:text-darkText uppercase tracking-wider">
            <NavIcon className="w-3.5 h-3.5 text-accentOrange" />
            <span>{t('navigation.planRoute')}</span>
          </div>
          <button
            type="button"
            onClick={handleSwapRoute}
            title={t('navigation.swap')}
            className="flex items-center gap-1 text-[11px] font-bold text-accentOrange hover:bg-orangeTint/30 px-2.5 py-1 rounded-full transition-all border border-orange-200 dark:border-orange-900/50 shadow-xs active:scale-95"
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>{t('navigation.swap')}</span>
          </button>
        </div>

        {/* Origin & Destination Dual Inputs */}
        <div className="space-y-2">
          {/* Point A (Qayerdan / Origin) */}
          <div className={`relative flex items-center rounded-2xl border transition-all ${
            activeInput === 'origin' && isSearchFocused
              ? 'border-slate-800 ring-2 ring-slate-800/20 bg-white dark:bg-gray-800'
              : 'border-yolBorder dark:border-gray-700 bg-innerSoftArea dark:bg-gray-800/80'
          }`}>
            <span className="absolute left-3 w-4 h-4 rounded-md bg-slate-900 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
              A
            </span>
            <input
              type="text"
              value={originQuery || (originCoords ? originCoords.name : '')}
              onFocus={() => {
                setActiveInput('origin');
                setIsSearchFocused(true);
              }}
              onChange={(e) => {
                setOriginQuery(e.target.value);
                triggerSearch(e.target.value);
              }}
              placeholder={originCoords ? originCoords.name : `${t('navigation.from')}: ${t('navigation.myLocation')}`}
              className="w-full bg-transparent text-textPrimary dark:text-darkText pl-9 pr-14 py-2 text-xs font-bold placeholder:text-textSecondary/70 focus:outline-none"
            />
            <div className="absolute right-2 flex items-center gap-1">
              {originCoords ? (
                <button
                  type="button"
                  onClick={handleResetOriginToGps}
                  title={t('navigation.myLocation')}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  GPS
                </span>
              )}
              {originQuery && (
                <button
                  type="button"
                  onClick={() => { setOriginQuery(''); setOriginCoords(null); }}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-textSecondary hover:text-textPrimary"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Point B (Qayerga / Destination) */}
          <div className={`relative flex items-center rounded-2xl border transition-all ${
            activeInput === 'destination' && isSearchFocused
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-white dark:bg-gray-800'
              : 'border-yolBorder dark:border-gray-700 bg-innerSoftArea dark:bg-gray-800/80'
          }`}>
            <span className="absolute left-3 w-4 h-4 rounded-md bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
              B
            </span>
            <input
              type="text"
              value={searchQuery}
              onFocus={() => {
                setActiveInput('destination');
                setIsSearchFocused(true);
              }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                triggerSearch(e.target.value);
              }}
              placeholder={t('navigation.destPlaceholder')}
              className="w-full bg-transparent text-textPrimary dark:text-darkText pl-9 pr-14 py-2 text-xs font-bold placeholder:text-textSecondary/70 focus:outline-none"
            />
            <div className="absolute right-2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearRoute}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-textSecondary hover:text-textPrimary"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handleVoiceSearch}
                title={t('topBar.voiceSearch')}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                  isVoiceListening ? 'bg-red-500 text-white animate-pulse' : 'text-textSecondary hover:text-accentOrange'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Predictive Location Chips */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-0.5">
            <Sparkles className="w-3 h-3 text-accentOrange" />
            {activeInput === 'origin' ? `A (${t('navigation.from')}):` : `B (${t('navigation.to')}):`}
          </span>

          {/* ⛽ Metan & Propan Zapravkalar Live Quick Chip */}
          <button
            type="button"
            onClick={() => {
              const next = !isGasLayerVisible;
              setIsGasLayerVisible(next);
              setActiveFilter(next ? 'gas' : 'all');
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-black whitespace-nowrap transition-all shadow-xs active:scale-95 flex items-center gap-1 shrink-0 ${
              isGasLayerVisible || activeFilter === 'gas'
                ? 'bg-emerald-600 text-white shadow-emerald-500/30 shadow-md ring-1 ring-emerald-400'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>Metan/Propan</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/15 font-black">
              {gasStations.length}
            </span>
          </button>
          {[
            POPULAR_SUGGESTIONS[0], // Amir Temur
            POPULAR_SUGGESTIONS[10], // Chust
            POPULAR_SUGGESTIONS[11], // Samarqand
            POPULAR_SUGGESTIONS[1], // Chorsu
            POPULAR_SUGGESTIONS[2], // Tashkent City
            POPULAR_SUGGESTIONS[4], // Aeroport
            POPULAR_SUGGESTIONS[12], // Buxoro
            POPULAR_SUGGESTIONS[13], // Xiva
            POPULAR_SUGGESTIONS[14] // Chorvoq
          ].map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectSuggestedPlace(p)}
              className="px-2.5 py-1 rounded-full text-xs font-bold bg-innerSoftArea dark:bg-gray-800 hover:bg-orangeTint/30 text-textPrimary dark:text-darkText border border-gray-200 dark:border-gray-700 whitespace-nowrap transition-all shadow-xs active:scale-95 flex items-center gap-1"
            >
              <MapPin className="w-3 h-3 text-accentOrange" />
              <span>{getLocalizedPlaceName(p.name, locale).split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Predictive Suggestions & Live Geocode Results Dropdown */}
        {(isSearchFocused || searchResults.length > 0) && (
          <div className="mt-2 bg-white dark:bg-darkCard border border-yolBorder dark:border-gray-700 rounded-2xl shadow-float max-h-72 overflow-y-auto z-30 divide-y divide-gray-100 dark:divide-gray-800">
            
            {/* Geocode query results if available */}
            {searchResults.length > 0 && (
              <div>
                <div className="p-2 bg-gray-50/70 dark:bg-gray-800/50 text-[10px] font-black text-accentOrange uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-3 h-3" />
                  {locale === 'ru' ? 'Результаты поиска' : locale === 'en' ? 'Search Results' : 'Qidiruv natijalari'}
                </div>
                {searchResults.map((r, idx) => (
                  <div
                    key={`res-${idx}`}
                    onClick={() => selectGeocodeResult(r)}
                    className="p-3 text-xs hover:bg-orangeTint/20 cursor-pointer flex items-start gap-2.5 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-accentOrange shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-textPrimary dark:text-darkText text-sm">
                        {r.displayName.split(',')[0]}
                      </div>
                      <div className="text-[11px] text-textSecondary line-clamp-1">{r.displayName}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Predicted / Popular Places Suggestions */}
            <div>
              <div className="p-2 bg-gray-50/70 dark:bg-gray-800/50 text-[10px] font-black text-accentOrange uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accentOrange" />
                  {activeInput === 'origin' 
                    ? (locale === 'ru' ? 'Выберите начальную точку (А)' : locale === 'en' ? 'Choose Starting Point (A)' : "Boshlang'ich joyni tanlang (A)")
                    : (locale === 'ru' ? 'Выберите пункт назначения (Б)' : locale === 'en' ? 'Choose Destination (B)' : 'Boradigan manzilni tanlang (B)')}
                </span>
                <span className="text-[10px] text-textSecondary font-bold">
                  {filteredSuggestions.length} {locale === 'ru' ? 'мест' : locale === 'en' ? 'places' : 'ta manzil'}
                </span>
              </div>

              {filteredSuggestions.map((item) => {
                const distKm = userCoords ? calculateDistanceKm(userCoords.lat, userCoords.lon, item.lat, item.lon) : null;
                const localizedName = getLocalizedPlaceName(item.name, locale);
                const localizedCat = getLocalizedCategory(item.category, locale);
                return (
                  <div
                    key={item.id}
                    onClick={() => selectSuggestedPlace(item)}
                    className="p-3 text-xs hover:bg-orangeTint/20 cursor-pointer flex items-center justify-between gap-3 group transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center text-accentOrange shrink-0 group-hover:scale-105 transition-transform">
                        {item.category === 'Aeroport' && <Plane className="w-4 h-4" />}
                        {item.category === 'Vokzal' && <Train className="w-4 h-4" />}
                        {item.category === 'Park' && <Trees className="w-4 h-4" />}
                        {item.category === 'Bozor' && <ShoppingBag className="w-4 h-4" />}
                        {item.category === 'Tarixiy' && <Landmark className="w-4 h-4" />}
                        {(item.category === 'Shahar' || item.category === 'Markaz' || item.category === 'Tibbiyot' || item.category === 'Dam olish') && <MapPin className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-textPrimary dark:text-darkText text-sm group-hover:text-accentOrange transition-colors truncate">
                          {localizedName}
                        </div>
                        <div className="text-[11px] text-textSecondary truncate">
                          {item.city} • {localizedCat}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 block mb-0.5">
                        {localizedCat}
                      </span>
                      {distKm !== null && (
                        <span className="text-[10px] font-bold text-accentOrange block">
                          ~{distKm > 20 ? Math.round(distKm) : distKm.toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Chips */}
        {!activeRoute && (
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: t('roads.all') },
              { id: 'accidents', label: t('roads.accidents') },
              { id: 'traffic', label: t('roads.traffic') },
              { id: 'roadwork', label: t('roads.roadWork') },
              { id: 'closures', label: t('roads.closures') }
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeFilter === chip.id
                    ? 'bg-blackPill text-white'
                    : 'bg-innerSoftArea dark:bg-gray-800 text-textSecondary dark:text-darkTextSec hover:text-textPrimary'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
      </div>
      )}

      {/* 2. Route Planner & Direction Card (When route is calculated) */}
      {activeRoute ? (
        <div className="bg-white dark:bg-darkCard p-4 rounded-card shadow-soft border border-yolBorder dark:border-darkBorder animate-fade-in space-y-3">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1.5 text-xs font-black text-textPrimary dark:text-darkText uppercase tracking-wider">
              <NavIcon className="w-3.5 h-3.5 text-accentOrange" />
              <span>{t('navigation.routeTitle')}</span>
            </div>

            <button
              onClick={handleClearRoute}
              title={locale === 'ru' ? 'Сбросить маршрут' : locale === 'en' ? 'Close route' : 'Marshrutni yopish'}
              className="flex items-center gap-1 text-[11px] font-bold text-textSecondary hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1 rounded-full transition-all border border-gray-200 dark:border-gray-700 shadow-xs active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>{locale === 'ru' ? 'Закрыть' : locale === 'en' ? 'Close' : 'Yopish'}</span>
            </button>
          </div>

          {/* Point A ➔ Point B corridor inputs with quick swap */}
          <div className="space-y-1.5">
            {/* Origin A */}
            <div className="relative flex items-center rounded-2xl border border-yolBorder dark:border-gray-700 bg-innerSoftArea dark:bg-gray-800/80 p-1.5 pr-2.5">
              <span className="w-5 h-5 rounded-md bg-slate-900 text-white font-black text-[10px] flex items-center justify-center shrink-0 ml-1 shadow-xs">
                A
              </span>
              <span className="ml-2 font-bold text-xs text-textPrimary dark:text-darkText truncate flex-1">
                {activeRoute.originName || t('navigation.myLocation')}
              </span>
              <button
                type="button"
                onClick={handleSwapRoute}
                title={t('navigation.swap')}
                className="w-7 h-7 rounded-full bg-white dark:bg-gray-700 hover:bg-accentOrange hover:text-white flex items-center justify-center text-textSecondary transition-all shadow-xs shrink-0 active:scale-95"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Destination B */}
            <div className="relative flex items-center rounded-2xl border border-rose-300 dark:border-rose-900/60 bg-innerSoftArea dark:bg-gray-800/80 p-1.5 pr-2.5">
              <span className="w-5 h-5 rounded-md bg-rose-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 ml-1 shadow-xs">
                B
              </span>
              <span className="ml-2 font-black text-xs text-textPrimary dark:text-darkText truncate flex-1">
                {getLocalizedPlaceName(activeRoute.destinationName || '', locale)}
              </span>
              <button
                type="button"
                onClick={handleClearRoute}
                title={locale === 'ru' ? 'Сменить пункт назначения' : locale === 'en' ? 'Change destination' : "Manzilni o'zgartirish"}
                className="w-6 h-6 rounded-full flex items-center justify-center text-textSecondary hover:text-rose-600 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mode Selector Tabs (Car, Bus/Transit, Bike, Walk) */}
          <div className="grid grid-cols-4 gap-1.5 bg-innerSoftArea dark:bg-gray-800 p-1.5 rounded-2xl border border-yolBorder dark:border-gray-700">
            {[
              { id: 'car', icon: Car, label: t('navigation.modes.car') },
              { id: 'transit', icon: Bus, label: t('navigation.modes.transit') },
              { id: 'bike', icon: Bike, label: t('navigation.modes.bike') },
              { id: 'walk', icon: Footprints, label: t('navigation.modes.walk') }
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = travelMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id as TravelMode)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-blackPill text-white shadow-sm'
                      : 'text-textSecondary hover:text-textPrimary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] tracking-tight">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Yandex Maps / Waze Alternative Route Selector Cards */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectRouteVariant('fastest')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedRouteVariant === 'fastest'
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/40 shadow-xs'
                  : 'bg-innerSoftArea dark:bg-gray-800 border-yolBorder dark:border-gray-700 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-blue-600" />
                  <span>{locale === 'ru' ? 'Быстрый' : locale === 'en' ? 'Fastest' : 'Eng tez yo\'l'}</span>
                </span>
                {selectedRouteVariant === 'fastest' && (
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </div>
              <div className="text-base font-black text-textPrimary dark:text-darkText mt-1">
                {formatDurationText(baseRouteStatsRef.current?.duration ?? activeRoute.durationMinutes)}
              </div>
              <div className="text-[11px] font-bold text-textSecondary dark:text-darkTextSec">
                {((baseRouteStatsRef.current?.distance ?? activeRoute.distanceMeters) / 1000).toFixed(1)} km • Optimal
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRouteVariant('bypass')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedRouteVariant === 'bypass'
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40 shadow-xs'
                  : 'bg-innerSoftArea dark:bg-gray-800 border-yolBorder dark:border-gray-700 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <NavIcon className="w-3 h-3 text-emerald-600" />
                  <span>{locale === 'ru' ? 'Объезд' : locale === 'en' ? 'Bypass' : 'Aylanma yo\'l'}</span>
                </span>
                {selectedRouteVariant === 'bypass' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                )}
              </div>
              <div className="text-base font-black text-textPrimary dark:text-darkText mt-1">
                {formatDurationText((baseRouteStatsRef.current?.duration ?? activeRoute.durationMinutes) + 3)}
              </div>
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                {(((baseRouteStatsRef.current?.distance ?? activeRoute.distanceMeters) * 1.14) / 1000).toFixed(1)} km • Tirbandliksiz
              </div>
            </button>
          </div>

          {/* Time, Arrival Clock, Fuel & Distance Summary */}
          <div className="p-3.5 rounded-2xl bg-orangeTint/20 border border-orange-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-accentOrange shrink-0" />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-textPrimary dark:text-darkText">
                    {formatDurationText(activeRoute.durationMinutes)}
                  </span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <Flag className="w-3 h-3 text-emerald-600 inline" />
                    <span>{new Date(Date.now() + activeRoute.durationMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-textSecondary dark:text-darkTextSec font-bold mt-0.5">
                  <span>{(activeRoute.distanceMeters / 1000).toFixed(1)} km</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Fuel className="w-3 h-3 text-slate-500" />
                    <span>~{Math.max(0.2, (activeRoute.distanceMeters / 1000) * 0.085).toFixed(1)} L</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Nearest Roads to Destination */}
            {activeRoute.nearbyRoads && activeRoute.nearbyRoads.length > 0 && (
              <div className="text-right max-w-[165px]">
                <span className="text-[10px] font-bold text-accentOrange uppercase block">
                  {t('navigation.nearestRoads')}:
                </span>
                <span className="text-xs text-textPrimary dark:text-darkText font-medium line-clamp-2">
                  {activeRoute.nearbyRoads.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Big Black Pill "Boshlash (Go)" Button - Prominently placed directly under route stats */}
          {!isNavigating ? (
            <button
              onClick={startNavigation}
              className="w-full py-3.5 rounded-full bg-blackPill hover:bg-blackPillHover text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-float transition-all group active:scale-98"
            >
              <div className="w-7 h-7 rounded-full bg-accentOrange flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                <Play className="w-4 h-4 fill-white stroke-[3] ml-0.5" />
              </div>
              <span>{t('navigation.startNav')}</span>
            </button>
          ) : (
            <div className="space-y-3 p-3 rounded-2xl bg-orangeTint/20 border border-orange-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-accentOrange uppercase">
                  {t('navigation.turnByTurn')}
                </span>
                <button
                  onClick={stopNavigation}
                  className="px-3 py-1 rounded-full bg-statusDangerBg text-statusDanger text-xs font-bold hover:bg-red-200"
                >
                  {t('navigation.stopNav')}
                </button>
              </div>

              {/* Turn-by-Turn Steps List */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {activeRoute.steps.map((st, idx) => {
                  const isCurrent = currentNavStep === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setCurrentNavStep(idx);
                        speakInstruction(st.instruction);
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isCurrent
                          ? 'bg-white dark:bg-gray-800 border-accentOrange font-bold shadow-sm'
                          : 'bg-white/60 dark:bg-gray-800/60 border-yolBorder dark:border-gray-700 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                        isCurrent ? 'bg-blackPill text-white' : 'bg-gray-200 dark:bg-gray-700 text-textSecondary'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="text-textPrimary dark:text-darkText font-bold">{st.instruction}</div>
                        <div className="text-[10px] text-textSecondary">{st.distanceMeters}m</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Destination Weather & Air Quality Card (Only shown when searching/routing) */}
          {activeRoute.destinationWeather && (
            <div className="bg-gradient-to-br from-white to-orange-50/50 dark:from-darkCard dark:to-gray-800 p-3.5 rounded-2xl border border-orange-200 dark:border-gray-700 shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-orange-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CloudSun className="w-4 h-4 text-accentOrange shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-accentOrange truncate">
                    {locale === 'ru' ? 'Погода в пункте назначения' : locale === 'en' ? 'Destination Weather' : 'Manzildagi ob-havo'}
                  </span>
                </div>
                <span className="text-xs font-black text-textPrimary dark:text-darkText truncate max-w-[170px]">
                  {activeRoute.destinationWeather.city}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-textPrimary dark:text-darkText">
                    {activeRoute.destinationWeather.temperatureC > 0 ? '+' : ''}{activeRoute.destinationWeather.temperatureC}°C
                  </span>
                  <span className="text-xs font-bold text-textSecondary dark:text-darkTextSec">
                    {activeRoute.destinationWeather.conditionText}
                  </span>
                </div>
                {activeRoute.destinationAirQuality && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-statusSuccessBg text-statusSuccess border border-green-200">
                    AQI {activeRoute.destinationAirQuality.aqi} ({activeRoute.destinationAirQuality.aqiLevel})
                  </span>
                )}
              </div>
              {activeRoute.destinationAirQuality?.advice && (
                <p className="text-[11px] text-textSecondary dark:text-darkTextSec mt-1.5 leading-snug">
                  {activeRoute.destinationAirQuality.advice}
                </p>
              )}
              {activeRoute.destinationWeather.forecast && activeRoute.destinationWeather.forecast.length > 0 && (
                <div className="grid grid-cols-5 gap-1 mt-2.5 pt-2 border-t border-orange-100 dark:border-gray-700">
                  {activeRoute.destinationWeather.forecast.map((day) => (
                    <div key={day.date} className="flex flex-col items-center bg-white/80 dark:bg-gray-900/60 p-1.5 rounded-lg text-center border border-orange-100/60 dark:border-gray-700">
                      <span className="text-[9px] font-bold text-textSecondary dark:text-darkTextSec uppercase">
                        {day.dayName.slice(0, 3)}
                      </span>
                      <span className="text-[11px] font-extrabold text-textPrimary dark:text-darkText my-0.5">
                        {day.maxTempC}°
                      </span>
                      <span className="text-[9px] text-textSecondary dark:text-darkTextSec">
                        {day.minTempC}°
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Corridor Hazards & Traffic List along this entire path */}
          {activeRoute.routeIncidents && activeRoute.routeIncidents.length > 0 ? (
            <div className="p-3.5 rounded-2xl bg-statusWarningBg/40 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  {locale === 'ru' 
                    ? `Проблемы на маршруте (${activeRoute.routeIncidents.length} шт)` 
                    : locale === 'en' 
                    ? `Incidents Along Route (${activeRoute.routeIncidents.length})` 
                    : `Yo'nalishdagi muammolar (${activeRoute.routeIncidents.length} ta)`}
                </span>
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">
                  {locale === 'ru' ? 'Вся трасса' : locale === 'en' ? 'Entire Corridor' : 'Butun yo\'nalish bo\'ylab'}
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {activeRoute.routeIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => setFocusedLocation({ lat: inc.latitude, lon: inc.longitude })}
                    className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-amber-200 dark:border-gray-700 hover:border-accentOrange cursor-pointer transition-all shadow-xs group"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">
                        {inc.featureType === 'traffic' ? 'Tirbandlik' : inc.featureType === 'roadwork' ? "Yo'l ta'miri" : inc.featureType === 'accident' ? 'Avariya' : inc.featureType === 'closure' ? 'Yopiq yo\'l' : 'Xavf'}
                      </span>
                      <span className="text-[10px] text-textSecondary group-hover:text-accentOrange font-extrabold transition-colors">
                        {locale === 'ru' ? 'Показать →' : locale === 'en' ? 'Show →' : 'Ko\'rish →'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-textPrimary dark:text-darkText mt-1 line-clamp-1">
                      {inc.title}
                    </div>
                    {inc.description && (
                      <div className="text-[11px] text-textSecondary dark:text-darkTextSec mt-0.5 line-clamp-1">
                        {inc.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : activeRoute.nearbyIncidentsCount && activeRoute.nearbyIncidentsCount > 0 ? (
            <div className="p-3 rounded-xl bg-statusWarningBg text-statusWarning border border-amber-300 text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{getLocalizedWarning(activeRoute.warnings[0], locale) || t('navigation.routeHazards')}</span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-statusSuccessBg text-statusSuccess border border-green-200 text-xs flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{t('navigation.noHazards')}</span>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 3. Weather & Air Quality Card */}
          <div className="bg-white dark:bg-darkCard p-5 rounded-card shadow-soft border border-yolBorder dark:border-darkBorder">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs tracking-wider text-textSecondary dark:text-darkTextSec uppercase">
                {weather ? `${weather.city}, ${weather.country}` : 'Tashkent, Uzbekistan'}
              </span>
              <span className="text-[11px] text-textSecondary dark:text-darkTextSec flex items-center gap-1">
                <Clock className="w-3 h-3 text-accentOrange" />
                10 {t('weather.updatedMinutesAgo')}
              </span>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div>
                <div className="text-4xl font-extrabold text-textPrimary dark:text-darkText tracking-tight">
                  {weather ? `${weather.temperatureC > 0 ? '+' : ''}${weather.temperatureC}°C` : '+22°C'}
                </div>
                <p className="text-sm font-medium text-textSecondary dark:text-darkTextSec mt-1">
                  {weather ? weather.conditionText : 'Clear sky'}
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-orangeTint dark:bg-opacity-20 flex items-center justify-center text-3xl">
                ☀️
              </div>
            </div>

            {airQuality && (
              <div className="mt-4 pt-3 border-t border-yolBorder dark:border-darkBorder">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-textSecondary dark:text-darkTextSec">
                    {t('weather.airQuality')}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-statusSuccessBg text-statusSuccess border border-[#C3E6D0]">
                    {airQuality.aqiLevel === 'Good' ? t('weather.airGood') : airQuality.aqiLevel === 'Moderate' ? t('weather.airModerate') : t('weather.airUnhealthy')} (AQI {airQuality.aqi})
                  </span>
                </div>
                <p className="text-xs text-textSecondary dark:text-darkTextSec mt-1.5 leading-relaxed">
                  {airQuality.advice}
                </p>
              </div>
            )}

            {weather && weather.forecast && (
              <div className="grid grid-cols-5 gap-1.5 mt-4 pt-3 border-t border-yolBorder dark:border-darkBorder">
                {weather.forecast.map((day) => (
                  <div key={day.date} className="flex flex-col items-center bg-innerSoftArea dark:bg-gray-800 p-2 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-textSecondary dark:text-darkTextSec uppercase">
                      {day.dayName.slice(0, 3)}
                    </span>
                    <span className="text-xs font-extrabold text-textPrimary dark:text-darkText my-1">
                      {day.maxTempC}°
                    </span>
                    <span className="text-[9px] text-textSecondary dark:text-darkTextSec">
                      {day.minTempC}°
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 text-[10px] text-textSecondary dark:text-darkTextSec text-center">
              {t('weather.sourceAttribution')}
            </div>
          </div>

          {/* 4. Road Status Card ("Roads near you") */}
          <div className="bg-white dark:bg-darkCard p-5 rounded-card shadow-soft border border-yolBorder dark:border-darkBorder flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-textPrimary dark:text-darkText">
                {t('roads.title')}
              </h2>
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-orangeTint text-accentOrange">
                {activeFilter === 'gas' ? sortedGasStations.length : filteredFeatures.length} {t('roads.summarySuffix')}
              </span>
            </div>

            {/* Quick Category Filters */}
            <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                  activeFilter === 'all'
                    ? 'bg-blackPill text-white shadow-xs'
                    : 'bg-innerSoftArea dark:bg-gray-800 text-textSecondary dark:text-darkTextSec hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Barchasi
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('gas');
                  setIsGasLayerVisible(true);
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-black transition-all shrink-0 flex items-center gap-1 ${
                  activeFilter === 'gas'
                    ? 'bg-emerald-600 text-white shadow-emerald-500/30 shadow-md ring-1 ring-emerald-400'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                }`}
              >
                <Fuel className="w-3 h-3" />
                <span>⛽ Metan/Propan ({gasStations.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('traffic')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                  activeFilter === 'traffic'
                    ? 'bg-blackPill text-white'
                    : 'bg-innerSoftArea dark:bg-gray-800 text-textSecondary dark:text-darkTextSec hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Tirbandlik
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('accidents')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                  activeFilter === 'accidents'
                    ? 'bg-blackPill text-white'
                    : 'bg-innerSoftArea dark:bg-gray-800 text-textSecondary dark:text-darkTextSec hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Avariya
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('roadwork')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                  activeFilter === 'roadwork'
                    ? 'bg-blackPill text-white'
                    : 'bg-innerSoftArea dark:bg-gray-800 text-textSecondary dark:text-darkTextSec hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Ta'mirlash
              </button>
            </div>

            <div className="flex flex-col gap-3 mt-3 overflow-y-auto max-h-[360px] pr-1">
              {activeFilter === 'gas' ? (
                sortedGasStations.length === 0 ? (
                  <div className="text-center py-8 text-xs text-textSecondary">
                    Hozirda hududda gaz zapravkalar topilmadi.
                  </div>
                ) : (
                  sortedGasStations.map((station) => (
                    <div 
                      key={station.id}
                      className="p-3.5 rounded-2xl bg-innerSoftArea dark:bg-gray-800 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors border border-emerald-500/20 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            !station.isOpen
                              ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                              : (station.pressureBar ?? 0) >= 185
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                          }`}>
                            <Fuel className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded">
                                {station.brand}
                              </span>
                              <span className={`text-[10px] font-bold ${station.isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                {station.isOpen ? "Ochiq" : "Yopiq"}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-textPrimary dark:text-darkText leading-tight mt-0.5">
                              {station.name}
                            </h3>
                          </div>
                        </div>

                        {/* Pressure Badge */}
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-black px-2 py-0.5 rounded-full inline-block ${
                            (station.pressureBar ?? 0) >= 190
                              ? 'bg-emerald-500 text-white'
                              : (station.pressureBar ?? 0) >= 170
                              ? 'bg-amber-500 text-white'
                              : 'bg-rose-500 text-white'
                          }`}>
                            {station.pressureBar ?? 0} Bar
                          </span>
                          <div className="text-[10px] font-bold text-textSecondary dark:text-darkTextSec mt-0.5">
                            {station.distanceKm ? `~${station.distanceKm.toFixed(1)} km` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Queue & Price Row */}
                      <div className="flex items-center justify-between text-xs font-medium text-textSecondary dark:text-darkTextSec pt-1 border-t border-gray-200 dark:border-gray-700">
                        <span className="flex items-center gap-1">
                          <Car className="w-3.5 h-3.5 text-blue-500" />
                          <span>Navbat: <strong className="text-textPrimary dark:text-darkText">{station.queueCarsCount} ta</strong> (~{station.estimatedWaitMinutes || station.waitMinutesEstimated || 5} daq)</span>
                        </span>
                        {(station.prices?.metan || station.pricePerUnit?.metan) && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {(station.prices?.metan || station.pricePerUnit?.metan)?.toLocaleString()} so'm
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsGasLayerVisible(true);
                            setFocusedLocation({ lat: station.latitude, lon: station.longitude });
                            setSelectedGasStation(station);
                          }}
                          className="px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          Xaritada ko'rish
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const sLat = originCoords ? originCoords.lat : userCoords.lat;
                            const sLon = originCoords ? originCoords.lon : userCoords.lon;
                            const sName = originCoords ? originCoords.name : 'Mening joylashuvim';
                            setDestinationCoords({ lat: station.latitude, lon: station.longitude, name: station.name });
                            requestRoute(station.latitude, station.longitude, 'car', station.name, sLat, sLon, sName);
                          }}
                          className="px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
                        >
                          <NavIcon className="w-3 h-3 fill-current" />
                          <span>Yo'nalish</span>
                        </button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                filteredFeatures.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-innerSoftArea dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-yolBorder dark:border-gray-700 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          item.featureType === 'accident'
                            ? 'bg-statusDangerBg text-statusDanger'
                            : item.featureType === 'traffic'
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.featureType === 'accident' ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : item.featureType === 'traffic' ? (
                            <Car className="w-4 h-4" />
                          ) : (
                            <Cone className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-textPrimary dark:text-darkText leading-tight">
                            {item.title}
                          </h3>
                          <p className="text-xs text-textSecondary dark:text-darkTextSec line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        item.source === 'Live'
                          ? 'bg-blue-100 text-blue-700'
                          : item.source === 'Official'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {item.source === 'Live' ? t('roads.sourceLive') : item.source === 'Official' ? t('roads.sourceOfficial') : t('roads.sourceCommunity')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-700 text-xs">
                      <span className="text-textSecondary dark:text-darkTextSec">
                        {t('roads.verifiedTimeAgo')} ~15m
                      </span>
                      <button 
                        onClick={() => setFocusedLocation({ lat: item.latitude, lon: item.longitude })}
                        className="text-accentOrange font-bold hover:underline flex items-center gap-1"
                      >
                        <span>{t('roads.findAnotherWay')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setIsListAlternative(true)}
              className="mt-4 w-full py-3 rounded-full bg-innerSoftArea dark:bg-gray-800 text-textPrimary dark:text-darkText text-xs font-bold flex items-center justify-center gap-2 hover:bg-orangeTint hover:text-accentOrange transition-colors border border-yolBorder dark:border-gray-700"
            >
              <List className="w-4 h-4" />
              <span>{t('map.listAlternative')}</span>
            </button>
          </div>
        </>
      )}
    </aside>
  );
};
