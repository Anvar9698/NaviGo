import React from 'react';
import { useApp } from '../context/AppContext';
import { X, List, AlertTriangle, Car, Cone, ShieldAlert, CloudSun } from 'lucide-react';

export const ListAlternativeModal: React.FC = () => {
  const { isListAlternative, setIsListAlternative, features, weather, airQuality, t } = useApp();

  if (!isListAlternative) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="list-view-title"
        className="w-full max-w-2xl bg-white dark:bg-darkCard rounded-card shadow-float border border-yolBorder dark:border-darkBorder p-6 max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between pb-4 border-b border-yolBorder dark:border-darkBorder">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orangeTint text-accentOrange flex items-center justify-center">
              <List className="w-5 h-5" />
            </div>
            <div>
              <h2 id="list-view-title" className="text-xl font-bold text-textPrimary dark:text-darkText">
                Accessible Road & Weather List
              </h2>
              <span className="text-xs text-textSecondary dark:text-darkTextSec">
                Screen-reader accessible text alternative to interactive map
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsListAlternative(false)}
            className="w-10 h-10 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center text-textSecondary dark:text-darkTextSec hover:text-textPrimary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
          {/* Weather summary section */}
          {weather && (
            <section aria-labelledby="weather-heading" className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700">
              <h3 id="weather-heading" className="text-sm font-bold text-accentOrange uppercase tracking-wider mb-2">
                Current Atmosphere & Air
              </h3>
              <p className="text-sm text-textPrimary dark:text-darkText">
                Location: <strong>{weather.city}, {weather.country}</strong>. Temperature: <strong>{weather.temperatureC}°C</strong> (feels like {weather.apparentTemperatureC}°C). Condition: <strong>{weather.conditionText}</strong>. Wind speed: {weather.windSpeedKmh} km/h.
              </p>
              {airQuality && (
                <p className="text-xs text-textSecondary dark:text-darkTextSec mt-2">
                  Air Quality Index: <strong>{airQuality.aqiLevel} ({airQuality.aqi})</strong>. Advice: {airQuality.advice}
                </p>
              )}
            </section>
          )}

          {/* Road conditions list */}
          <section aria-labelledby="road-heading">
            <h3 id="road-heading" className="text-sm font-bold text-accentOrange uppercase tracking-wider mb-3">
              Active Road Obstacles & Incidents ({features.length})
            </h3>
            <div className="space-y-3">
              {features.map((item, idx) => (
                <article
                  key={item.id}
                  tabIndex={0}
                  className="p-4 rounded-2xl bg-innerSoftArea dark:bg-gray-800 border border-yolBorder dark:border-gray-700 focus:ring-2 focus:ring-accentOrange"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-accentOrange uppercase">
                      Item {idx + 1}: {item.featureType}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blackPill text-white">
                      Source: {item.source}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-textPrimary dark:text-darkText mt-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-textSecondary dark:text-darkTextSec mt-1">
                    {item.description}
                  </p>
                  <div className="text-[11px] text-textSecondary mt-2">
                    Severity: <strong className="uppercase">{item.severity}</strong> • Coordinates: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <button
          onClick={() => setIsListAlternative(false)}
          className="mt-4 w-full py-3 rounded-full bg-blackPill text-white font-bold hover:bg-blackPillHover"
        >
          Return to Map View
        </button>
      </div>
    </div>
  );
};
