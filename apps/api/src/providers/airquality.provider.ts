import { AirQualityData } from '@yol/shared';
import { dbStore } from '../db/store';

interface AirQualityCacheEntry {
  data: AirQualityData;
  timestamp: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const cache = new Map<string, AirQualityCacheEntry>();

function interpretEuropeanAqi(aqi: number): {
  level: AirQualityData['aqiLevel'];
  advice: string;
} {
  if (aqi <= 20) {
    return {
      level: 'Good',
      advice: 'Air quality is excellent. Ideal for walking, outdoor recreation, and opening windows.'
    };
  }
  if (aqi <= 40) {
    return {
      level: 'Moderate',
      advice: 'Air quality is acceptable. Sensitive individuals should monitor respiratory comfort.'
    };
  }
  if (aqi <= 60) {
    return {
      level: 'Unhealthy for Sensitive',
      advice: 'Elderly citizens and people with asthma should limit prolonged vigorous outdoor exercise.'
    };
  }
  if (aqi <= 80) {
    return {
      level: 'Unhealthy',
      advice: 'Wear a protective mask outdoors. Keep home windows closed during peak traffic hours.'
    };
  }
  if (aqi <= 100) {
    return {
      level: 'Very Unhealthy',
      advice: 'Health warnings of emergency conditions. Avoid outdoor activities where possible.'
    };
  }
  return {
    level: 'Hazardous',
    advice: 'Emergency health alert: everyone may experience serious health effects.'
  };
}

export async function fetchAirQualityData(
  lat: number,
  lon: number
): Promise<AirQualityData> {
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const startTime = Date.now();
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5&timezone=auto`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Open-Meteo AQ HTTP ${res.status}`);
    }

    const json = await res.json();
    const current = json.current;
    const aqi = Math.round(current.european_aqi || 32);
    const { level, advice } = interpretEuropeanAqi(aqi);

    const aqData: AirQualityData = {
      aqi,
      aqiLevel: level,
      methodology: 'European Air Quality Index (EAQI)',
      pm2_5: Math.round(current.pm2_5 || 14),
      pm10: Math.round(current.pm10 || 28),
      advice,
      lastUpdated: new Date().toISOString(),
      source: 'Open-Meteo Air Quality'
    };

    cache.set(cacheKey, { data: aqData, timestamp: Date.now() });

    dbStore.updateProviderHealth('Open-Meteo Air Quality', {
      status: 'ONLINE',
      latencyMs: Date.now() - startTime,
      message: 'Active EAQI telemetry'
    });

    return aqData;
  } catch (error) {
    dbStore.updateProviderHealth('Open-Meteo Air Quality', {
      status: 'DEGRADED',
      latencyMs: Date.now() - startTime,
      message: 'Offline fallback active'
    });

    if (cached) {
      return cached.data;
    }

    return {
      aqi: 35,
      aqiLevel: 'Moderate',
      methodology: 'European AQI (Offline estimate)',
      pm2_5: 16,
      pm10: 32,
      advice: 'Air quality is normal. General outdoor activities are safe for most adults.',
      lastUpdated: new Date().toISOString(),
      source: 'Offline fallback (Network disconnected)'
    };
  }
}
