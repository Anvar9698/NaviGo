import { GeocodeResult } from '@yol/shared';
import { CONFIG } from '../config';
import { dbStore } from '../db/store';

const cache = new Map<string, GeocodeResult[]>();
let lastRequestTime = 0;

// Enforces OSM Nominatim 1-req/sec rate limit
async function enforceRateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1000) {
    await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
  }
  lastRequestTime = Date.now();
}

export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return [];

  if (cache.has(trimmed)) {
    return cache.get(trimmed)!;
  }

  await enforceRateLimit();

  const startTime = Date.now();
  try {
    // Focus search with Tashkent / Uzbekistan viewbox
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&countrycodes=uz&limit=5&addressdetails=1`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': CONFIG.nominatimUserAgent,
        Accept: 'application/json'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Nominatim error: ${res.status}`);
    }

    const items = await res.json();
    const results: GeocodeResult[] = items.map((item: any) => ({
      displayName: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      type: item.type || 'place'
    }));

    cache.set(trimmed, results);

    dbStore.updateProviderHealth('OSM Nominatim Geocoder', {
      status: 'ONLINE',
      latencyMs: Date.now() - startTime,
      message: 'Active place search'
    });

    return results;
  } catch (error) {
    dbStore.updateProviderHealth('OSM Nominatim Geocoder', {
      status: 'DEGRADED',
      latencyMs: Date.now() - startTime,
      message: 'Network error or rate limit'
    });

    // Provide localized fallback suggestions for common Tashkent destinations
    const mockTashkentLocations: GeocodeResult[] = [
      {
        displayName: 'Amir Temur Square, Yunusobod District, Tashkent',
        latitude: 41.3111,
        longitude: 69.2797,
        type: 'square'
      },
      {
        displayName: 'Chorsu Bazaar, Shayxontohur District, Tashkent',
        latitude: 41.3274,
        longitude: 69.2346,
        type: 'market'
      },
      {
        displayName: 'Tashkent Central Railway Station (Severny)',
        latitude: 41.2917,
        longitude: 69.2842,
        type: 'station'
      },
      {
        displayName: 'Islom Karimov Tashkent International Airport',
        latitude: 41.2581,
        longitude: 69.2812,
        type: 'aeroway'
      }
    ];

    return mockTashkentLocations.filter(loc =>
      loc.displayName.toLowerCase().includes(trimmed)
    );
  }
}
