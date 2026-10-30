import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Navigation, 
  HelpCircle, 
  AlertTriangle, 
  Cone, 
  Car, 
  CloudSun,
  Layers,
  ArrowUp,
  ArrowUpRight,
  ArrowUpLeft,
  RotateCcw,
  Flag,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  X,
  Wind,
  Droplets,
  ShieldCheck
} from 'lucide-react';
import { MapFeature, Report } from '@yol/shared';
import { DistrictWeather } from '../context/AppContext';
import { mapRegistry } from '../lib/mapRegistry';

export const MapContainer: React.FC<{ variant?: 'default' | 'bare' }> = ({ variant = 'default' }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const navStepMarkerRef = useRef<maplibregl.Marker | null>(null);

  const { 
    userCoords, 
    setUserCoords, 
    focusedLocation,
    setFocusedLocation,
    features, 
    userReports,
    mapMode, 
    setMapMode,
    locale,
    t, 
    locationStatus, 
    setLocationStatus,
    setIsReportingOpen,
    setIsLegendOpen,
    districtsWeather,
    selectedDistrict,
    setSelectedDistrict,

    // Navigation states
    activeRoute,
    isNavigating,
    stopNavigation,
    currentNavStep,
    setCurrentNavStep,
    isVoiceMuted,
    setIsVoiceMuted,
    speakInstruction,
    theme
  } = useApp();

  const [selectedFeature, setSelectedFeature] = useState<MapFeature | null>(null);
  const [selectedUserReport, setSelectedUserReport] = useState<Report | null>(null);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const osmTiles = [
      'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
    ];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: osmTiles,
            tileSize: 256,
            attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
            paint: theme === 'dark' ? {
              'raster-brightness-max': 0.65,
              'raster-contrast': 0.3,
              'raster-saturation': -0.5
            } : {}
          }
        ]
      },
      center: [userCoords.lon, userCoords.lat],
      zoom: 13,
      attributionControl: false
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    mapRef.current = map;
    mapRegistry.register(map);

    return () => {
      mapRegistry.register(null);
      map.remove();
      mapRef.current = null;
    };
  }, [theme]);

  // Handle flying to focused location
  useEffect(() => {
    if (focusedLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [focusedLocation.lon, focusedLocation.lat],
        zoom: 16,
        essential: true
      });
      setFocusedLocation(null);
    }
  }, [focusedLocation]);

  // Handle markers: Weather District Pins + Incidents + User's Own Reports
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // 1. "You are here" User marker
    const userEl = document.createElement('div');
    userEl.className = 'flex items-center justify-center';
    userEl.innerHTML = `
      <div class="relative flex items-center justify-center">
        <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-400 opacity-75"></span>
        <div class="relative rounded-full h-5 w-5 bg-blue-600 border-2 border-white shadow-md flex items-center justify-center text-white text-[9px] font-bold">
        </div>
      </div>
    `;

    const userMarker = new maplibregl.Marker({ element: userEl })
      .setLngLat([userCoords.lon, userCoords.lat])
      .addTo(mapRef.current);
    markersRef.current.push(userMarker);

    // If bare variant, skip weather, road-incident and report markers
    if (variant === 'bare') {
      return;
    }

    // 2. Weather & Air Quality District Pins (Mode A or Combined)
    if (mapMode === 'weather' || mapMode === 'combined') {
      districtsWeather.forEach((district) => {
        const el = document.createElement('div');
        el.className = 'cursor-pointer transform hover:scale-110 transition-transform select-none';

        const aqiBg = district.aqiLevel === 'Good' 
          ? 'bg-statusSuccess text-white' 
          : district.aqiLevel === 'Moderate'
          ? 'bg-amber-600 text-white'
          : 'bg-statusDanger text-white';

        el.innerHTML = `
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-darkCard shadow-float text-xs font-bold border-2 border-accentOrange">
            <span class="text-base">☀️</span>
            <span class="text-textPrimary dark:text-darkText font-extrabold">${district.temp}°C</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] ${aqiBg}">AQI ${district.aqi}</span>
          </div>
        `;

        el.onclick = () => {
          setSelectedFeature(null);
          setSelectedUserReport(null);
          setSelectedDistrict(district);
        };

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([district.lon, district.lat])
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      });
    }

    // 3. Road Incident Markers (Mode B or Combined)
    if (mapMode === 'roads' || mapMode === 'combined') {
      features.forEach((feature) => {
        const el = document.createElement('div');
        el.className = 'cursor-pointer transform hover:scale-110 transition-transform';

        let badgeBg = 'bg-statusDanger';
        let iconHtml = '⚠️';

        if (feature.featureType === 'traffic') {
          badgeBg = 'bg-orange-500';
          iconHtml = '🚗';
        } else if (feature.featureType === 'roadwork') {
          badgeBg = 'bg-yellow-500 text-black';
          iconHtml = '🚧';
        } else if (feature.featureType === 'closure') {
          badgeBg = 'bg-red-700';
          iconHtml = '⛔';
        }

        el.innerHTML = `
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full ${badgeBg} text-white shadow-lg text-xs font-bold border border-white">
            <span>${iconHtml}</span>
            <span class="hidden sm:inline capitalize">${feature.featureType}</span>
          </div>
        `;

        el.onclick = () => {
          setSelectedDistrict(null);
          setSelectedUserReport(null);
          setSelectedFeature(feature);
        };

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([feature.longitude, feature.latitude])
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      });

      // 4. User's Own Submitted Reports as Distinct Purple Pins
      userReports.forEach((rep) => {
        const repEl = document.createElement('div');
        repEl.className = 'cursor-pointer transform hover:scale-110 transition-transform';
        repEl.innerHTML = `
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600 text-white shadow-lg text-xs font-bold border-2 border-white animate-bounce">
            <span>📍</span>
            <span class="hidden sm:inline">${t('map.yourReport')}</span>
          </div>
        `;

        repEl.onclick = () => {
          setSelectedDistrict(null);
          setSelectedFeature(null);
          setSelectedUserReport(rep);
        };

        const repMarker = new maplibregl.Marker({ element: repEl })
          .setLngLat([rep.longitude, rep.latitude])
          .addTo(mapRef.current!);

        markersRef.current.push(repMarker);
      });
    }
  }, [features, userReports, districtsWeather, mapMode, userCoords, locale]);

  // Handle route display & bounding box
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!activeRoute || activeRoute.coordinates.length === 0) {
      if (map.getSource('route-source')) {
        (map.getSource('route-source') as maplibregl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] }
        });
      }
      return;
    }

    if (map.getSource('route-source')) {
      (map.getSource('route-source') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: activeRoute.coordinates
        }
      });
    } else if (map.isStyleLoaded()) {
      map.addSource('route-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: activeRoute.coordinates
          }
        }
      });

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#E8593A',
          'line-width': 6,
          'line-opacity': 0.9
        }
      });
    }

    // Fit map bounds to encompass the entire route
    const bounds = new maplibregl.LngLatBounds();
    activeRoute.coordinates.forEach(c => bounds.extend(c));
    map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
  }, [activeRoute]);

  // Handle active navigation step camera & waypoint marker
  useEffect(() => {
    if (!isNavigating || !activeRoute || !mapRef.current) {
      if (navStepMarkerRef.current) {
        navStepMarkerRef.current.remove();
        navStepMarkerRef.current = null;
      }
      return;
    }

    const step = activeRoute.steps[currentNavStep];
    if (!step) return;

    // Approximate step coordinate along route
    const coordIndex = Math.min(
      Math.floor((currentNavStep / Math.max(activeRoute.steps.length, 1)) * activeRoute.coordinates.length),
      activeRoute.coordinates.length - 1
    );
    const stepCoord = activeRoute.coordinates[coordIndex];

    if (stepCoord) {
      mapRef.current.flyTo({
        center: stepCoord,
        zoom: 16,
        essential: true
      });

      if (!navStepMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'w-9 h-9 rounded-full bg-blackPill text-white flex items-center justify-center border-2 border-white shadow-float text-base font-bold animate-pulse';
        el.innerHTML = '🎯';
        navStepMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat(stepCoord)
          .addTo(mapRef.current);
      } else {
        navStepMarkerRef.current.setLngLat(stepCoord);
      }
    }
  }, [isNavigating, currentNavStep, activeRoute]);

  const handleNextStep = () => {
    if (!activeRoute) return;
    if (currentNavStep < activeRoute.steps.length - 1) {
      const nextIdx = currentNavStep + 1;
      setCurrentNavStep(nextIdx);
      speakInstruction(activeRoute.steps[nextIdx].instruction);
    } else {
      speakInstruction(t('navigation.arrived'));
    }
  };

  const handlePrevStep = () => {
    if (!activeRoute) return;
    if (currentNavStep > 0) {
      const prevIdx = currentNavStep - 1;
      setCurrentNavStep(prevIdx);
      speakInstruction(activeRoute.steps[prevIdx].instruction);
    }
  };

  const handleRecenter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setUserCoords(coords);
          setLocationStatus('granted');
          mapRef.current?.flyTo({ center: [coords.lon, coords.lat], zoom: 14 });
        },
        () => {
          setLocationStatus('denied');
        }
      );
    }
  };

  const currentStep = activeRoute && isNavigating ? activeRoute.steps[currentNavStep] : null;

  return (
    <div className="relative w-full h-full rounded-panel overflow-hidden shadow-float border border-yolBorder dark:border-darkBorder bg-appPanel dark:bg-darkPanel">
      {/* 1. Main Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 2. Top-Right Map Mode Pill Switcher */}
      {variant !== 'bare' && (
        <div className="absolute top-4 right-4 z-10 flex items-center bg-white dark:bg-darkCard p-1.5 rounded-full shadow-soft border border-yolBorder dark:border-darkBorder">
          <button
            onClick={() => {
              setMapMode('combined');
              setSelectedDistrict(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              mapMode === 'combined'
                ? 'bg-blackPill text-white'
                : 'text-textSecondary dark:text-darkTextSec hover:text-textPrimary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('map.modeCombined')}</span>
          </button>

          <button
            onClick={() => {
              setMapMode('weather');
              setSelectedFeature(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              mapMode === 'weather'
                ? 'bg-blackPill text-white'
                : 'text-textSecondary dark:text-darkTextSec hover:text-textPrimary'
            }`}
          >
            <CloudSun className="w-3.5 h-3.5 text-accentOrange" />
            <span>{t('map.modeA')}</span>
          </button>

          <button
            onClick={() => {
              setMapMode('roads');
              setSelectedDistrict(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              mapMode === 'roads'
                ? 'bg-blackPill text-white'
                : 'text-textSecondary dark:text-darkTextSec hover:text-textPrimary'
            }`}
          >
            <Car className="w-3.5 h-3.5 text-accentOrange" />
            <span>{t('map.modeB')}</span>
          </button>
        </div>
      )}

      {/* 3. Turn-by-Turn Navigation HUD Overlay (Requirement) */}
      {isNavigating && activeRoute && currentStep && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-xl bg-white dark:bg-darkCard p-4 rounded-card shadow-float border-2 border-accentOrange animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blackPill text-white flex items-center justify-center shrink-0 shadow-md">
                {currentStep.maneuverType === 'turn-right' ? (
                  <ArrowUpRight className="w-7 h-7 stroke-[3] text-accentOrange" />
                ) : currentStep.maneuverType === 'turn-left' ? (
                  <ArrowUpLeft className="w-7 h-7 stroke-[3] text-accentOrange" />
                ) : currentStep.maneuverType === 'arrive' ? (
                  <Flag className="w-6 h-6 text-green-400" />
                ) : (
                  <ArrowUp className="w-7 h-7 stroke-[3] text-accentOrange" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold text-accentOrange uppercase tracking-wider block">
                  {t('navigation.nextManeuver')} ({currentNavStep + 1} / {activeRoute.steps.length})
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-textPrimary dark:text-darkText leading-tight">
                  {currentStep.instruction}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-textSecondary dark:text-darkTextSec font-semibold">
                  <span>{currentStep.distanceMeters}m</span>
                  <span>•</span>
                  <span>{activeRoute.durationMinutes} min ({((activeRoute.distanceMeters - currentNavStep * 300) / 1000).toFixed(1)} km)</span>
                </div>
              </div>
            </div>

            {/* Voice Mute & Exit Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsVoiceMuted(!isVoiceMuted)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border ${
                  isVoiceMuted ? 'bg-gray-100 text-gray-400' : 'bg-orangeTint text-accentOrange border-accentOrange'
                }`}
                title={isVoiceMuted ? t('navigation.soundOff') : t('navigation.soundOn')}
              >
                {isVoiceMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button
                onClick={stopNavigation}
                className="w-10 h-10 rounded-full bg-statusDangerBg text-statusDanger flex items-center justify-center hover:bg-red-200 transition-colors"
                title={t('navigation.stopNav')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-yolBorder dark:border-gray-700">
            <button
              onClick={handlePrevStep}
              disabled={currentNavStep === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-innerSoftArea dark:bg-gray-800 text-xs font-bold disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Oldingi</span>
            </button>

            <span className="text-xs font-mono font-bold text-textSecondary">
              {currentNavStep + 1} of {activeRoute.steps.length}
            </span>

            <button
              onClick={handleNextStep}
              disabled={currentNavStep >= activeRoute.steps.length - 1}
              className="flex items-center gap-1 px-4 py-1.5 rounded-full bg-blackPill text-white text-xs font-bold hover:bg-blackPillHover disabled:opacity-40"
            >
              <span>Keyingisi</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Non-blocking Location Prompt Banner */}
      {locationStatus === 'prompt' && !isNavigating && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white dark:bg-darkCard px-5 py-3 rounded-2xl shadow-float border border-yolBorder dark:border-darkBorder flex items-center gap-4 max-w-md animate-fade-in">
          <Navigation className="w-5 h-5 text-accentOrange shrink-0" />
          <p className="text-sm text-textPrimary dark:text-darkText font-medium">
            {t('map.locationPrompt')}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRecenter}
              className="px-3 py-1.5 rounded-full bg-blackPill text-white text-xs font-bold hover:bg-blackPillHover"
            >
              {t('map.allowLocation')}
            </button>
            <button
              onClick={() => setLocationStatus('denied')}
              className="px-2.5 py-1.5 rounded-full text-xs text-textSecondary dark:text-darkTextSec hover:text-textPrimary"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 5. Bottom-Left Controls: Legend & List Alternative */}
      {variant !== 'bare' && (
        <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2">
          <button
            onClick={() => setIsLegendOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-darkCard px-4 py-2.5 rounded-full shadow-soft border border-yolBorder dark:border-darkBorder text-textPrimary dark:text-darkText hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold transition-all"
          >
            <HelpCircle className="w-4 h-4 text-accentOrange" />
            <span>{t('map.whatMean')}</span>
          </button>
        </div>
      )}

      {/* 6. Bottom-Right Controls: Recenter & Report Problem */}
      <div className="absolute bottom-6 right-6 z-10 flex items-center gap-3">
        <button
          onClick={handleRecenter}
          aria-label={t('map.myLocation')}
          className="w-13 h-13 p-3.5 rounded-full bg-white dark:bg-darkCard shadow-float border border-yolBorder dark:border-darkBorder text-textPrimary dark:text-darkText hover:text-accentOrange transition-all flex items-center justify-center"
        >
          <Navigation className="w-6 h-6 text-accentOrange" />
        </button>

        {variant !== 'bare' && (
          <button
            onClick={() => setIsReportingOpen(true)}
            className="flex items-center gap-3 bg-blackPill text-white px-6 py-4 rounded-full shadow-float hover:bg-blackPillHover transition-all text-base font-bold group border border-gray-800"
          >
            <div className="w-7 h-7 rounded-full bg-accentOrange flex items-center justify-center text-white">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
            <span>{t('map.reportProblem')}</span>
          </button>
        )}
      </div>

      {/* 7. Selected District Weather Popover Card (Mode A Fix) */}
      {selectedDistrict && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-sm bg-white dark:bg-darkCard p-5 rounded-card shadow-float border-2 border-accentOrange animate-fade-in">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accentOrange">
                {t('weather.districtAir')}
              </span>
              <h3 className="font-extrabold text-base text-textPrimary dark:text-darkText leading-tight mt-0.5">
                {selectedDistrict.name}
              </h3>
            </div>
            <button
              onClick={() => setSelectedDistrict(null)}
              className="text-textSecondary hover:text-textPrimary p-1"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between my-3">
            <div>
              <div className="text-3xl font-extrabold text-textPrimary dark:text-darkText">
                +{selectedDistrict.temp}°C
              </div>
              <span className="text-xs text-textSecondary dark:text-darkTextSec font-medium">
                Shamol: {selectedDistrict.wind} km/h
              </span>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              selectedDistrict.aqiLevel === 'Good'
                ? 'bg-statusSuccessBg text-statusSuccess border border-green-300'
                : 'bg-statusWarningBg text-statusWarning border border-amber-300'
            }`}>
              AQI {selectedDistrict.aqi} • {selectedDistrict.aqiLevel}
            </div>
          </div>

          <p className="text-xs text-textSecondary dark:text-darkTextSec leading-relaxed">
            {selectedDistrict.aqiLevel === 'Good'
              ? 'Havo sifati a\'lo darajada. Ochiq havoda sayr qilish va derazalarni ochish tavsiya etiladi.'
              : 'Havo sifati o\'rtacha. Shahar bo\'ylab transport harakati barqaror.'}
          </p>

          <button
            onClick={() => setSelectedDistrict(null)}
            className="mt-3 w-full py-2 rounded-full bg-blackPill text-white text-xs font-bold hover:bg-blackPillHover"
          >
            {t('common.close')}
          </button>
        </div>
      )}

      {/* 8. Selected Incident Modal Popup */}
      {selectedFeature && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-md bg-white dark:bg-darkCard p-5 rounded-card shadow-float border border-yolBorder dark:border-darkBorder animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orangeTint flex items-center justify-center text-accentOrange">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-textPrimary dark:text-darkText leading-tight">
                  {selectedFeature.title}
                </h3>
                <span className="text-xs text-textSecondary dark:text-darkTextSec">
                  {t('map.sourceLabel')}:{' '}
                  <span className="font-semibold text-accentOrange">
                    [{selectedFeature.source}]
                  </span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedFeature(null)}
              className="text-textSecondary hover:text-textPrimary p-1"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-textSecondary dark:text-darkTextSec mt-3 leading-relaxed">
            {selectedFeature.description}
          </p>

          <div className="mt-4 pt-3 border-t border-yolBorder dark:border-darkBorder flex items-center justify-between">
            <span className="text-xs text-textSecondary dark:text-darkTextSec">
              {t('map.verifiedAt')}: {new Date(selectedFeature.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <button
              onClick={() => setSelectedFeature(null)}
              className="px-4 py-2 rounded-full bg-blackPill text-white text-xs font-bold hover:bg-blackPillHover"
            >
              {t('roads.findAnotherWay')}
            </button>
          </div>
        </div>
      )}

      {/* 9. Selected User Report Popup */}
      {selectedUserReport && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-md bg-white dark:bg-darkCard p-5 rounded-card shadow-float border border-purple-400 animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-lg">
                📍
              </div>
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase">
                  {t('map.yourReport')} ({selectedUserReport.id})
                </span>
                <h3 className="font-bold text-base text-textPrimary dark:text-darkText leading-tight">
                  {selectedUserReport.title}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedUserReport(null)}
              className="text-textSecondary hover:text-textPrimary p-1"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-textSecondary dark:text-darkTextSec mt-2">
            {selectedUserReport.description || t('myReports.noDetails')}
          </p>

          <div className="mt-3 p-2 rounded-xl bg-innerSoftArea dark:bg-gray-800 text-xs flex justify-between items-center">
            <span>Status:</span>
            <span className="font-bold text-purple-600 uppercase">
              {t(`myReports.statuses.${selectedUserReport.status}`) || selectedUserReport.status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
