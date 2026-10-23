import { RouteResult, RouteStep } from '@yol/shared';
import { dbStore, calculateHaversineDistanceKm } from '../db/store';

export async function calculateRoute(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  mode: 'walk' | 'transit' | 'car' = 'car'
): Promise<RouteResult> {
  const profile = mode === 'walk' ? 'foot' : 'driving';
  const url = `https://router.project-osrm.org/route/v1/${profile}/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson&steps=true`;

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`OSRM status ${res.status}`);
    }

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    const steps: RouteStep[] = [];

    if (route.legs && route.legs[0] && route.legs[0].steps) {
      route.legs[0].steps.forEach((st: any) => {
        const maneuver = st.maneuver ? `${st.maneuver.type} ${st.maneuver.modifier || ''}`.trim() : '';
        const name = st.name ? `on ${st.name}` : '';
        const text = maneuver ? `${maneuver} ${name}`.trim() : `Continue on ${st.name || 'road'}`;
        steps.push({
          instruction: text,
          distanceMeters: Math.round(st.distance),
          durationSeconds: Math.round(st.duration)
        });
      });
    }

    dbStore.updateProviderHealth('OSRM Routing Machine', {
      status: 'ONLINE',
      latencyMs: Date.now() - startTime,
      message: 'Route calculated successfully'
    });

    return {
      distanceMeters: Math.round(route.distance),
      durationMinutes: Math.round(route.duration / 60),
      mode,
      coordinates: route.geometry.coordinates,
      steps,
      warnings: mode === 'walk' 
        ? ['Notice: Real-time sidewalk ramp data may be incomplete on secondary residential alleys.']
        : []
    };
  } catch (error) {
    dbStore.updateProviderHealth('OSRM Routing Machine', {
      status: 'DEGRADED',
      latencyMs: Date.now() - startTime,
      message: 'Fallback route geometry generated'
    });

    // Fallback: Calculate direct geodesic line and approximate travel time
    const distKm = calculateHaversineDistanceKm(startLat, startLon, endLat, endLon);
    const speedKmh = mode === 'walk' ? 4.5 : 30; // average city driving vs walking
    const durationMinutes = Math.round((distKm / speedKmh) * 60) + (mode === 'car' ? 5 : 0);

    return {
      distanceMeters: Math.round(distKm * 1000),
      durationMinutes: Math.max(durationMinutes, 2),
      mode,
      coordinates: [
        [startLon, startLat],
        [(startLon + endLon) / 2, (startLat + endLat) / 2],
        [endLon, endLat]
      ],
      steps: [
        {
          instruction: `Head towards destination (${distKm.toFixed(1)} km)`,
          distanceMeters: Math.round(distKm * 1000),
          durationSeconds: durationMinutes * 60
        }
      ],
      warnings: [
        'Direct estimate: Live turn-by-turn routing server is currently offline. Estimated travel time based on distance.'
      ]
    };
  }
}
