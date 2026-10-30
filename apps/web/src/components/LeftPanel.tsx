import React, { useState } from 'react';
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
  Navigation as NavIcon
} from 'lucide-react';
import { TravelMode } from '../context/AppContext';

export const LeftPanel: React.FC = () => {
  const { 
    t, 
    weather, 
    airQuality, 
    features, 
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
    setFocusedLocation
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lon: number; name: string } | null>(null);

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
      setSearchQuery(transcript);
      triggerSearch(transcript);
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
        if (places.length > 0) {
          selectDestination(places[0]);
        }
      }
    } catch (e) {
      console.warn('Geocoding search failed:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const selectDestination = async (place: any) => {
    const dest = {
      lat: place.latitude,
      lon: place.longitude,
      name: place.displayName.split(',')[0]
    };
    setDestinationCoords(dest);
    setSearchResults([]);
    setSearchQuery(dest.name);
    setFocusedLocation({ lat: dest.lat, lon: dest.lon });
    await requestRoute(dest.lat, dest.lon, travelMode, dest.name);
  };

  const handleModeChange = async (newMode: TravelMode) => {
    setTravelMode(newMode);
    if (destinationCoords) {
      await requestRoute(destinationCoords.lat, destinationCoords.lon, newMode, destinationCoords.name);
    }
  };

  const handleClearRoute = () => {
    stopNavigation();
    setActiveRoute(null);
    setDestinationCoords(null);
    setSearchQuery('');
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
      className="hidden md:flex flex-col gap-4 w-[420px] shrink-0 h-full overflow-y-auto pr-1 z-20 pb-4"
    >
      {/* 1. Large Search Bar */}
      <div className="bg-white dark:bg-darkCard p-3 rounded-card shadow-soft border border-yolBorder dark:border-darkBorder relative">
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
            className="w-full bg-innerSoftArea dark:bg-gray-800 text-textPrimary dark:text-darkText pl-12 pr-16 py-3 rounded-full text-base font-medium placeholder:text-textSecondary focus:outline-none focus:ring-2 focus:ring-accentOrange transition-all"
          />
          <div className="absolute right-2.5 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearRoute}
                className="w-7 h-7 rounded-full flex items-center justify-center text-textSecondary hover:text-textPrimary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleVoiceSearch}
              title={t('topBar.voiceSearch')}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isVoiceListening ? 'bg-red-500 text-white animate-pulse' : 'text-textSecondary hover:text-accentOrange'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-white dark:bg-darkCard border border-yolBorder dark:border-gray-700 rounded-2xl shadow-float max-h-48 overflow-y-auto z-30">
            {searchResults.map((r, idx) => (
              <div
                key={idx}
                onClick={() => selectDestination(r)}
                className="p-3 text-xs hover:bg-orangeTint/20 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-none flex items-start gap-2.5"
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

        {/* Filter Chips */}
        {!activeRoute && (
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 no-scrollbar">
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

      {/* 2. Route Planner & Direction Card (When route is calculated) */}
      {activeRoute ? (
        <div className="bg-white dark:bg-darkCard p-5 rounded-card shadow-soft border border-yolBorder dark:border-darkBorder animate-fade-in space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accentOrange">
                {t('navigation.routeTitle')}
              </span>
              <h3 className="font-bold text-lg text-textPrimary dark:text-darkText leading-tight mt-0.5">
                {activeRoute.destinationName}
              </h3>
            </div>
            <button
              onClick={handleClearRoute}
              className="text-textSecondary hover:text-textPrimary p-1 rounded-full hover:bg-innerSoftArea"
            >
              <X className="w-5 h-5" />
            </button>
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

          {/* Time & Distance Summary */}
          <div className="p-3.5 rounded-2xl bg-orangeTint/20 border border-orange-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accentOrange" />
              <div>
                <span className="text-xl font-extrabold text-textPrimary dark:text-darkText">
                  {activeRoute.durationMinutes} {t('weather.updatedMinutesAgo').replace('daqiqa oldin yangilandi', 'min').replace('мин. назад', 'мин')}
                </span>
                <span className="text-xs text-textSecondary dark:text-darkTextSec block">
                  {(activeRoute.distanceMeters / 1000).toFixed(1)} km
                </span>
              </div>
            </div>

            {/* Nearest Roads to Destination (Requirement) */}
            {activeRoute.nearbyRoads && activeRoute.nearbyRoads.length > 0 && (
              <div className="text-right max-w-[170px]">
                <span className="text-[10px] font-bold text-accentOrange uppercase block">
                  {t('navigation.nearestRoads')}:
                </span>
                <span className="text-xs text-textPrimary dark:text-darkText font-medium line-clamp-2">
                  {activeRoute.nearbyRoads.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Route Hazards Warning / Clear Confirmation */}
          {activeRoute.nearbyIncidentsCount && activeRoute.nearbyIncidentsCount > 0 ? (
            <div className="p-3 rounded-xl bg-statusWarningBg text-statusWarning border border-amber-300 text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{activeRoute.warnings[0] || t('navigation.routeHazards')}</span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-statusSuccessBg text-statusSuccess border border-green-200 text-xs flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{t('navigation.noHazards')}</span>
            </div>
          )}

          {/* Big Black Pill "Boshlash (Go)" Button */}
          {!isNavigating ? (
            <button
              onClick={startNavigation}
              className="w-full py-3.5 rounded-full bg-blackPill hover:bg-blackPillHover text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-float transition-all group"
            >
              <div className="w-7 h-7 rounded-full bg-accentOrange flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                <Play className="w-4 h-4 fill-white stroke-[3] ml-0.5" />
              </div>
              <span>{t('navigation.startNav')}</span>
            </button>
          ) : (
            <div className="space-y-3">
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
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {activeRoute.steps.map((st, idx) => {
                  const isCurrent = currentNavStep === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setCurrentNavStep(idx);
                        speakInstruction(st.instruction);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isCurrent
                          ? 'bg-orangeTint/30 border-accentOrange font-bold shadow-sm'
                          : 'bg-innerSoftArea dark:bg-gray-800 border-yolBorder dark:border-gray-700 opacity-75'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                        isCurrent ? 'bg-blackPill text-white' : 'bg-gray-200 dark:bg-gray-700 text-textSecondary'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="text-textPrimary dark:text-darkText">{st.instruction}</div>
                        <div className="text-[10px] text-textSecondary">{st.distanceMeters}m</div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                {filteredFeatures.length} {t('roads.summarySuffix')}
              </span>
            </div>

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
              ))}
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
