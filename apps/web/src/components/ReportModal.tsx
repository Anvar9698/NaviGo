import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useApp } from '../context/AppContext';
import { 
  X, 
  AlertTriangle, 
  Camera, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  ShieldAlert,
  Search,
  Navigation
} from 'lucide-react';
import { ReportCategory, ReportSeverity } from '@yol/shared';

export const ReportModal: React.FC = () => {
  const { 
    isReportingOpen, 
    setIsReportingOpen, 
    t, 
    userCoords, 
    user, 
    token, 
    setIsAuthOpen,
    refreshData 
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<ReportCategory>('damage');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<ReportSeverity>('medium');
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number }>(userCoords);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  // Address search inside modal
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Mini-map inside modal step 2
  const miniMapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerInstanceRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (isReportingOpen) {
      setSelectedCoords(userCoords);
    }
  }, [isReportingOpen, userCoords]);

  // Initialize or update mini-map in step 2
  useEffect(() => {
    if (step !== 2 || !miniMapRef.current) return;

    if (!mapInstanceRef.current) {
      const osmTiles = [
        'https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
      ];

      const map = new maplibregl.Map({
        container: miniMapRef.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: osmTiles,
              tileSize: 256,
              attribution: '© OpenStreetMap'
            }
          },
          layers: [{ id: 'osm-layer', type: 'raster', source: 'osm-tiles' }]
        },
        center: [selectedCoords.lon, selectedCoords.lat],
        zoom: 14,
        attributionControl: false
      });

      // Create a draggable red pin marker
      const el = document.createElement('div');
      el.className = 'cursor-grab active:cursor-grabbing text-3xl select-none';
      el.innerHTML = '📍';

      const marker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat([selectedCoords.lon, selectedCoords.lat])
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setSelectedCoords({ lat: lngLat.lat, lon: lngLat.lng });
      });

      // Also allow clicking anywhere on the mini map to place pin
      map.on('click', (e) => {
        marker.setLngLat(e.lngLat);
        setSelectedCoords({ lat: e.lngLat.lat, lon: e.lngLat.lng });
      });

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;
    } else {
      mapInstanceRef.current.resize();
      mapInstanceRef.current.flyTo({ center: [selectedCoords.lon, selectedCoords.lat] });
      markerInstanceRef.current?.setLngLat([selectedCoords.lon, selectedCoords.lat]);
    }

    return () => {
      if (mapInstanceRef.current && step !== 2) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, [step, selectedCoords]);

  if (!isReportingOpen) return null;

  const categories: { id: ReportCategory; label: string; icon: string }[] = [
    { id: 'damage', label: t('report.categories.damage'), icon: '🕳️' },
    { id: 'closure', label: t('report.categories.closure'), icon: '⛔' },
    { id: 'construction', label: t('report.categories.construction'), icon: '🚧' },
    { id: 'hazard', label: t('report.categories.hazard'), icon: '⚠️' },
    { id: 'signage', label: t('report.categories.signage'), icon: '🚸' },
    { id: 'transit', label: t('report.categories.transit'), icon: '🚌' },
    { id: 'map_error', label: t('report.categories.map_error'), icon: '🗺️' },
    { id: 'other', label: t('report.categories.other'), icon: '📍' }
  ];

  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchAddress.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/v1/map/geocode?q=${encodeURIComponent(searchAddress)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.warn('Geocode search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (place: any) => {
    const coords = { lat: place.latitude, lon: place.longitude };
    setSelectedCoords(coords);
    setSearchResults([]);
    setSearchAddress(place.displayName.split(',')[0]);
    if (mapInstanceRef.current && markerInstanceRef.current) {
      mapInstanceRef.current.flyTo({ center: [coords.lon, coords.lat], zoom: 15 });
      markerInstanceRef.current.setLngLat([coords.lon, coords.lat]);
    }
  };

  const handleUseGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setSelectedCoords(coords);
        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.flyTo({ center: [coords.lon, coords.lat], zoom: 15 });
          markerInstanceRef.current.setLngLat([coords.lon, coords.lat]);
        }
      });
    } else {
      setSelectedCoords(userCoords);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category,
          title: title || `${t(`report.categories.${category}`)}`,
          description: description || '',
          latitude: selectedCoords.lat,
          longitude: selectedCoords.lon,
          severity: severity || 'medium'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSubmittedReportId(data.report.id);
        refreshData();
      } else {
        const errData = await res.json().catch(() => null);
        console.error('Report submission failed:', res.status, errData);
        alert(errData?.message || errData?.error || t('common.error'));
      }
    } catch (e: any) {
      console.error('Report submission error:', e);
      alert(e?.message || t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsReportingOpen(false);
    setStep(1);
    setSubmittedReportId(null);
    setTitle('');
    setDescription('');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="w-full max-w-xl bg-white dark:bg-darkCard rounded-card shadow-float border border-yolBorder dark:border-darkBorder p-6 max-h-[92vh] overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-yolBorder dark:border-darkBorder">
          <div>
            <span className="text-xs font-bold text-accentOrange uppercase tracking-wider">
              {t('report.title')}
            </span>
            <h2 id="report-modal-title" className="text-xl font-bold text-textPrimary dark:text-darkText">
              {step === 1 && t('report.step1Title')}
              {step === 2 && t('report.step2Title')}
              {step === 3 && t('report.step3Title')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label={t('common.close')}
            className="w-10 h-10 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center text-textSecondary dark:text-darkTextSec hover:text-textPrimary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Banner */}
        <div className="flex items-center gap-2.5 p-3 my-3 bg-orangeTint dark:bg-opacity-20 rounded-2xl text-xs font-semibold text-accentOrange border border-orange-200">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{t('report.safetyWarning')}</span>
        </div>

        {/* Success Screen */}
        {submittedReportId ? (
          <div className="py-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-statusSuccessBg text-statusSuccess flex items-center justify-center mb-4">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="text-2xl font-bold text-textPrimary dark:text-darkText">
              {t('report.successTitle')}
            </h3>
            <p className="text-sm text-textSecondary dark:text-darkTextSec mt-2 max-w-sm">
              {t('report.successDesc')}
            </p>
            <div className="mt-4 px-4 py-2 bg-innerSoftArea dark:bg-gray-800 rounded-full text-xs font-mono font-bold text-textPrimary dark:text-darkText">
              ID: {submittedReportId}
            </div>
            <button
              onClick={handleClose}
              className="mt-6 px-8 py-3 rounded-full bg-blackPill text-white font-bold hover:bg-blackPillHover"
            >
              {t('common.close')}
            </button>
          </div>
        ) : (
          <>
            {/* Step 1: Category Selection */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-3 py-2 flex-1 overflow-y-auto">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategory(cat.id);
                      setStep(2);
                    }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                      category === cat.id
                        ? 'border-accentOrange bg-orangeTint/20 font-bold shadow-sm'
                        : 'border-yolBorder dark:border-darkBorder bg-innerSoftArea dark:bg-gray-800 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-sm text-textPrimary dark:text-darkText">{cat.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Location (Manual Picker & Search) & Details */}
            {step === 2 && (
              <div className="flex flex-col gap-4 py-2 flex-1 overflow-y-auto">
                {/* 1. Address Search Bar for Manual Location */}
                <div>
                  <label className="text-xs font-bold text-textSecondary dark:text-darkTextSec mb-1 block">
                    {t('report.confirmLocation')}
                  </label>
                  <form onSubmit={handleSearchAddress} className="relative flex items-center">
                    <Search className="absolute left-3.5 w-4 h-4 text-textSecondary" />
                    <input
                      type="text"
                      value={searchAddress}
                      onChange={(e) => setSearchAddress(e.target.value)}
                      placeholder={t('report.searchAddressPlaceholder')}
                      className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-innerSoftArea dark:bg-gray-800 text-xs text-textPrimary dark:text-darkText border border-yolBorder dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-accentOrange"
                    />
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="absolute right-1 px-3 py-1.5 rounded-lg bg-blackPill text-white text-[11px] font-bold"
                    >
                      {isSearching ? '...' : 'Qidirish'}
                    </button>
                  </form>

                  {/* Search results dropdown */}
                  {searchResults.length > 0 && (
                    <div className="mt-1 bg-white dark:bg-darkCard border border-yolBorder dark:border-gray-700 rounded-xl shadow-lg max-h-36 overflow-y-auto z-10">
                      {searchResults.map((r, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectPlace(r)}
                          className="p-2 text-xs hover:bg-innerSoftArea dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-none"
                        >
                          <div className="font-bold text-textPrimary dark:text-darkText">{r.displayName.split(',')[0]}</div>
                          <div className="text-[10px] text-textSecondary line-clamp-1">{r.displayName}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Interactive Draggable Mini-Map */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-textSecondary dark:text-darkTextSec font-medium">
                      {t('report.dragPinInstruction')}
                    </span>
                    <button
                      type="button"
                      onClick={handleUseGps}
                      className="text-accentOrange font-bold flex items-center gap-1 hover:underline text-[11px]"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{t('report.useMyGps')}</span>
                    </button>
                  </div>

                  <div 
                    ref={miniMapRef} 
                    className="w-full h-44 rounded-2xl overflow-hidden border border-yolBorder dark:border-gray-700 relative shadow-inner bg-gray-100"
                  />

                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-textSecondary dark:text-darkTextSec bg-innerSoftArea dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-yolBorder dark:border-gray-700">
                    <span>{t('report.locationSelected')}:</span>
                    <span className="font-mono font-bold text-textPrimary dark:text-darkText">
                      {selectedCoords.lat.toFixed(5)}, {selectedCoords.lon.toFixed(5)}
                    </span>
                  </div>
                </div>

                {/* 3. Title input */}
                <div>
                  <label className="text-xs font-bold text-textSecondary dark:text-darkTextSec mb-1 block">
                    {t('report.addTitle')}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('report.addTitlePlaceholder')}
                    className="w-full p-2.5 rounded-xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 text-xs text-textPrimary dark:text-darkText focus:outline-none focus:ring-2 focus:ring-accentOrange"
                  />
                </div>

                {/* 4. Description */}
                <div>
                  <label className="text-xs font-bold text-textSecondary dark:text-darkTextSec mb-1 block">
                    {t('report.addNote')}
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('report.addNotePlaceholder')}
                    className="w-full p-2.5 rounded-xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 text-xs text-textPrimary dark:text-darkText focus:outline-none focus:ring-2 focus:ring-accentOrange"
                  />
                </div>

                {/* 5. Urgency Selection */}
                <div>
                  <label className="text-xs font-bold text-textSecondary dark:text-darkTextSec mb-1 block">
                    {t('report.urgencyLevel')}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['low', 'medium', 'high', 'urgent'] as ReportSeverity[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSeverity(lvl)}
                        className={`py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                          severity === lvl
                            ? 'bg-blackPill text-white shadow-sm'
                            : 'bg-innerSoftArea dark:bg-gray-800 text-textSecondary'
                        }`}
                      >
                        {t(`report.urgencies.${lvl}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {step === 3 && (
              <div className="flex flex-col gap-4 py-2 flex-1">
                <div className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-textSecondary">{t('report.categoryLabel')}:</span>
                    <span className="font-bold text-textPrimary dark:text-darkText">{t(`report.categories.${category}`)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-textSecondary">{t('report.addTitle')}:</span>
                    <span className="font-bold text-textPrimary dark:text-darkText">{title || t(`report.categories.${category}`)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-textSecondary">{t('report.coordinatesLabel')}:</span>
                    <span className="font-mono text-textPrimary dark:text-darkText">{selectedCoords.lat.toFixed(4)}, {selectedCoords.lon.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-textSecondary">{t('report.urgencyLevel')}:</span>
                    <span className="font-bold uppercase text-accentOrange">{t(`report.urgencies.${severity}`)}</span>
                  </div>
                </div>

                {!user && (
                  <div className="p-4 rounded-2xl bg-orangeTint/30 border border-accentOrange text-center">
                    <p className="text-xs font-bold text-accentOrange mb-2">
                      {t('report.signInRequiredNotice')}
                    </p>
                    <button
                      onClick={() => setIsAuthOpen(true)}
                      className="px-6 py-2 rounded-full bg-accentOrange text-white text-xs font-bold"
                    >
                      {t('report.signInOrRegister')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-yolBorder dark:border-darkBorder">
              {step > 1 ? (
                <button
                  onClick={() => setStep((step - 1) as any)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-innerSoftArea dark:bg-gray-800 text-textPrimary dark:text-darkText text-sm font-bold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('common.back')}</span>
                </button>
              ) : (
                <div></div>
              )}

              {step < 3 ? (
                <button
                  onClick={() => setStep((step + 1) as any)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-blackPill text-white text-sm font-bold hover:bg-blackPillHover"
                >
                  <span>{t('common.next')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !user}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-blackPill text-white text-base font-bold hover:bg-blackPillHover disabled:opacity-50 shadow-md"
                >
                  {isSubmitting ? t('common.loading') : t('report.submitButton')}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
