import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useApp } from '../context/AppContext';
import { 
  Plus, 
  Navigation, 
  HelpCircle, 
  AlertTriangle, 
  Cone, 
  ShieldAlert, 
  Car, 
  CheckCircle,
  CloudSun,
  Layers
} from 'lucide-react';
import { MapFeature } from '@yol/shared';

export const MapContainer: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const { 
    userCoords, 
    setUserCoords, 
    features, 
    mapMode, 
    setMapMode,
    t, 
    locationStatus, 
    setLocationStatus,
    setIsReportingOpen,
    setIsLegendOpen,
    activeRoute,
    weather,
    theme
  } = useApp();

  const [selectedFeature, setSelectedFeature] = useState<MapFeature | null>(null);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Use Carto Voyager or Positron tiles for high clarity and soft modern palette
    const tileUrl = theme === 'dark' 
      ? 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      : 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256,
            attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>, © <a href="https://carto.com/">CARTO</a>'
          }
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [userCoords.lon, userCoords.lat],
      zoom: 13,
      attributionControl: false
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [theme]);

  // Handle markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // 1. Add "You are here" user marker
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

    // 2. Add Road Incidents markers if in Mode B or Combined
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
          setSelectedFeature(feature);
        };

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([feature.longitude, feature.latitude])
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      });
    }
  }, [features, mapMode, userCoords]);

  // Handle route display
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activeRoute) return;

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
          'line-opacity': 0.85
        }
      });
    }
  }, [activeRoute]);

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

  return (
    <div className="relative w-full h-full rounded-panel overflow-hidden shadow-float border border-yolBorder dark:border-darkBorder bg-appPanel dark:bg-darkPanel">
      {/* 1. Main Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 2. Top-Right Map Mode Pill Switcher */}
      <div className="absolute top-4 right-4 z-10 flex items-center bg-white dark:bg-darkCard p-1.5 rounded-full shadow-soft border border-yolBorder dark:border-darkBorder">
        <button
          onClick={() => setMapMode('combined')}
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
          onClick={() => setMapMode('weather')}
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
          onClick={() => setMapMode('roads')}
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

      {/* 3. Non-blocking Location Prompt Banner (if ungranted) */}
      {locationStatus === 'prompt' && (
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

      {/* 4. Bottom-Left Controls: Legend & List Alternative */}
      <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2">
        <button
          onClick={() => setIsLegendOpen(true)}
          className="flex items-center gap-2 bg-white dark:bg-darkCard px-4 py-2.5 rounded-full shadow-soft border border-yolBorder dark:border-darkBorder text-textPrimary dark:text-darkText hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold transition-all"
        >
          <HelpCircle className="w-4 h-4 text-accentOrange" />
          <span>{t('map.whatMean')}</span>
        </button>
      </div>

      {/* 5. Bottom-Right Controls: Recenter & Report Problem */}
      <div className="absolute bottom-6 right-6 z-10 flex items-center gap-3">
        {/* Recenter Button */}
        <button
          onClick={handleRecenter}
          aria-label={t('map.myLocation')}
          className="w-13 h-13 p-3.5 rounded-full bg-white dark:bg-darkCard shadow-float border border-yolBorder dark:border-darkBorder text-textPrimary dark:text-darkText hover:text-accentOrange transition-all flex items-center justify-center"
        >
          <Navigation className="w-6 h-6 text-accentOrange" />
        </button>

        {/* Big Black Pill "+ Report a problem" Button */}
        <button
          onClick={() => setIsReportingOpen(true)}
          className="flex items-center gap-3 bg-blackPill text-white px-6 py-4 rounded-full shadow-float hover:bg-blackPillHover transition-all text-base font-bold group border border-gray-800"
        >
          <div className="w-7 h-7 rounded-full bg-accentOrange flex items-center justify-center text-white">
            <Plus className="w-5 h-5 stroke-[3]" />
          </div>
          <span>{t('map.reportProblem')}</span>
        </button>
      </div>

      {/* 6. Selected Incident Modal/Card Popup */}
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
                  Source:{' '}
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
              Verified: {new Date(selectedFeature.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
    </div>
  );
};
