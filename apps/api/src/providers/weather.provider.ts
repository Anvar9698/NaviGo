import { WeatherData } from '@yol/shared';
import { dbStore } from '../db/store';

interface WeatherCacheEntry {
  data: WeatherData;
  timestamp: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const cache = new Map<string, WeatherCacheEntry>();

export function mapWmoCodeToText(code: number): { text: string; icon: string } {
  if (code === 0) return { text: 'Clear sky', icon: 'sun' };
  if (code === 1 || code === 2) return { text: 'Partly cloudy', icon: 'cloud-sun' };
  if (code === 3) return { text: 'Overcast', icon: 'cloud' };
  if (code === 45 || code === 48) return { text: 'Foggy conditions', icon: 'cloud-fog' };
  if (code >= 51 && code <= 55) return { text: 'Light drizzle', icon: 'cloud-drizzle' };
  if (code >= 61 && code <= 65) return { text: 'Rain', icon: 'cloud-rain' };
  if (code >= 71 && code <= 77) return { text: 'Snowfall', icon: 'snowflake' };
  if (code >= 80 && code <= 82) return { text: 'Rain showers', icon: 'cloud-rain' };
  if (code >= 95) return { text: 'Thunderstorm', icon: 'cloud-lightning' };
  return { text: 'Mild weather', icon: 'sun' };
}

export async function fetchWeatherData(
  lat: number,
  lon: number,
  city = 'Tashkent',
  country = 'Uzbekistan'
): Promise<WeatherData> {
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const startTime = Date.now();
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }

    const json = await res.json();
    const current = json.current;
    const daily = json.daily;
    const condition = mapWmoCodeToText(current.weather_code || 0);

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const forecast = (daily.time || []).slice(0, 5).map((dateStr: string, idx: number) => {
      const d = new Date(dateStr);
      const code = daily.weather_code[idx] || 0;
      return {
        date: dateStr,
        dayName: daysOfWeek[d.getDay()],
        maxTempC: Math.round(daily.temperature_2m_max[idx]),
        minTempC: Math.round(daily.temperature_2m_min[idx]),
        conditionText: mapWmoCodeToText(code).text
      };
    });

    const weatherData: WeatherData = {
      city,
      country,
      temperatureC: Math.round(current.temperature_2m),
      apparentTemperatureC: Math.round(current.apparent_temperature),
      conditionCode: current.weather_code,
      conditionText: condition.text,
      weatherIcon: condition.icon,
      windSpeedKmh: Math.round(current.wind_speed_10m),
      humidityPercent: Math.round(current.relative_humidity_2m),
      precipitationMm: current.precipitation || 0,
      lastUpdated: new Date().toISOString(),
      source: 'Open-Meteo (CC BY 4.0)',
      forecast
    };

    cache.set(cacheKey, { data: weatherData, timestamp: Date.now() });

    dbStore.updateProviderHealth('Open-Meteo Weather', {
      status: 'ONLINE',
      latencyMs: Date.now() - startTime,
      message: 'Active live forecast'
    });

    return weatherData;
  } catch (error) {
    dbStore.updateProviderHealth('Open-Meteo Weather', {
      status: 'DEGRADED',
      latencyMs: Date.now() - startTime,
      message: 'Network timeout / fallback snapshot used'
    });

    if (cached) {
      return cached.data;
    }

    return {
      city,
      country,
      temperatureC: 22,
      apparentTemperatureC: 21,
      conditionCode: 1,
      conditionText: 'Partly cloudy (Offline fallback)',
      weatherIcon: 'cloud-sun',
      windSpeedKmh: 12,
      humidityPercent: 45,
      precipitationMm: 0,
      lastUpdated: new Date().toISOString(),
      source: 'Offline fallback (Network disconnected)',
      forecast: [
        { date: '2026-10-24', dayName: 'Saturday', maxTempC: 23, minTempC: 11, conditionText: 'Partly cloudy' },
        { date: '2026-10-25', dayName: 'Sunday', maxTempC: 24, minTempC: 12, conditionText: 'Sunny' },
        { date: '2026-10-26', dayName: 'Monday', maxTempC: 22, minTempC: 10, conditionText: 'Clear sky' },
        { date: '2026-10-27', dayName: 'Tuesday', maxTempC: 20, minTempC: 9, conditionText: 'Cloudy' },
        { date: '2026-10-28', dayName: 'Wednesday', maxTempC: 19, minTempC: 8, conditionText: 'Light rain' }
      ]
    };
  }
}
