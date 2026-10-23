import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Mic, 
  AlertTriangle, 
  Car, 
  Cone, 
  ShieldAlert, 
  Wind, 
  Droplets, 
  Clock, 
  ArrowRight,
  List,
  MapPin,
  ChevronRight
} from 'lucide-react';

export const LeftPanel: React.FC = () => {
  const { 
    t, 
    weather, 
    airQuality, 
    features, 
    setIsListAlternative,
    setActiveRoute,
    userCoords
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  // Web Speech API for voice search
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please type your destination.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'uz-UZ';
    recognition.interimResults = false;

    recognition.onstart = () => setIsVoiceListening(true);
    recognition.onend = () => setIsVoiceListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      triggerSearch(transcript);
    };

    recognition.start();
  };

  const triggerSearch = async (query: string) => {
    if (!query.trim()) return;
    try {
      const res = await fetch(`/api/v1/map/geocode?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const places = await res.json();
        if (places.length > 0) {
          const dest = places[0];
          // Request route from current location
          const routeRes = await fetch(
            `/api/v1/map/route?startLat=${userCoords.lat}&startLon=${userCoords.lon}&endLat=${dest.latitude}&endLon=${dest.longitude}&mode=car`
          );
          if (routeRes.ok) {
            const routeData = await routeRes.json();
            setActiveRoute(routeData);
          }
        }
      }
    } catch (e) {
      console.warn('Geocoding search failed:', e);
    }
  };

  const filteredFeatures = features.filter(f => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'accidents') return f.featureType === 'accident';
    if (activeFilter === 'traffic') return f.featureType === 'traffic';
    if (activeFilter === 'roadwork') return f.featureType === 'roadwork';
    if (activeFilter === 'closures') return f.featureType === 'closure';
    return true;
  });

  return (
    <aside 
      aria-label="Road Information and Weather Panel"
      className="hidden md:flex flex-col gap-4 w-[400px] shrink-0 h-full overflow-y-auto pr-1 z-20 pb-4"
    >
      {/* 1. Large Search Bar */}
      <div className="bg-white dark:bg-darkCard p-3 rounded-card shadow-soft border border-yolBorder dark:border-darkBorder">
        <form 
          onSubmit={(e) => { e.preventDefault(); triggerSearch(searchQuery); }}
          className="relative flex items-center"
        >
          <Search className="absolute left-4 w-5 h-5 text-textSecondary dark:text-darkTextSec" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('topBar.searchPlaceholder')}
            className="w-full bg-innerSoftArea dark:bg-gray-800 text-textPrimary dark:text-darkText pl-12 pr-12 py-3 rounded-full text-base font-medium placeholder:text-textSecondary focus:outline-none focus:ring-2 focus:ring-accentOrange transition-all"
          />
          <button
            type="button"
            onClick={handleVoiceSearch}
            title={t('topBar.voiceSearch')}
            className={`absolute right-2.5 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isVoiceListening ? 'bg-red-500 text-white animate-pulse' : 'text-textSecondary hover:text-accentOrange'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
        </form>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All' },
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
      </div>

      {/* 2. Weather & Air Quality Card */}
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

        {/* Big Temperature and Weather Icon */}
        <div className="flex items-center justify-between mt-3">
          <div>
            <div className="text-4xl font-extrabold text-textPrimary dark:text-darkText tracking-tight">
              {weather ? `${weather.temperatureC > 0 ? '+' : ''}${weather.temperatureC}°C` : '+22°C'}
            </div>
            <p className="text-sm font-medium text-textSecondary dark:text-darkTextSec mt-1">
              {weather ? weather.conditionText : 'Partly cloudy'}
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-orangeTint dark:bg-opacity-20 flex items-center justify-center text-3xl">
            ☀️
          </div>
        </div>

        {/* Air Quality Badge & Advice */}
        {airQuality && (
          <div className="mt-4 pt-3 border-t border-yolBorder dark:border-darkBorder">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-textSecondary dark:text-darkTextSec">
                {t('weather.airQuality')}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-statusSuccessBg text-statusSuccess border border-[#C3E6D0]">
                {airQuality.aqiLevel} (AQI {airQuality.aqi})
              </span>
            </div>
            <p className="text-xs text-textSecondary dark:text-darkTextSec mt-1.5 leading-relaxed">
              {airQuality.advice}
            </p>
          </div>
        )}

        {/* 5-Day Forecast Strip */}
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

      {/* 3. Road Status Card ("Roads near you") */}
      <div className="bg-white dark:bg-darkCard p-5 rounded-card shadow-soft border border-yolBorder dark:border-darkBorder flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-textPrimary dark:text-darkText">
            {t('roads.title')}
          </h2>
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-orangeTint text-accentOrange">
            {filteredFeatures.length} {t('roads.summarySuffix')}
          </span>
        </div>

        {/* Incident List Rows */}
        <div className="flex flex-col gap-3 mt-4 overflow-y-auto max-h-[360px] pr-1">
          {filteredFeatures.map((item) => (
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

                {/* Source Pill */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  item.source === 'Live'
                    ? 'bg-blue-100 text-blue-700'
                    : item.source === 'Official'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {item.source}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-700 text-xs">
                <span className="text-textSecondary dark:text-darkTextSec">
                  Verified ~15m ago
                </span>
                <button 
                  onClick={() => alert(`Rerouting to bypass ${item.title}...`)}
                  className="text-accentOrange font-bold hover:underline flex items-center gap-1"
                >
                  <span>{t('roads.findAnotherWay')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Accessible List Alternative Button */}
        <button
          onClick={() => setIsListAlternative(true)}
          className="mt-4 w-full py-3 rounded-full bg-innerSoftArea dark:bg-gray-800 text-textPrimary dark:text-darkText text-xs font-bold flex items-center justify-center gap-2 hover:bg-orangeTint hover:text-accentOrange transition-colors border border-yolBorder dark:border-gray-700"
        >
          <List className="w-4 h-4" />
          <span>{t('map.listAlternative')}</span>
        </button>
      </div>
    </aside>
  );
};
