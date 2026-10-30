import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { Hospital, AmbulanceUnit, EmergencyRequest } from '@yol/shared';
import { mapRegistry } from '../lib/mapRegistry';

interface AmbulanceMapLayerProps {
  hospitals: Hospital[];
  ambulances: AmbulanceUnit[];
  activeRequest?: EmergencyRequest | null;
  onSelectHospital?: (hospital: Hospital) => void;
  onSelectAmbulance?: (ambulance: AmbulanceUnit) => void;
}

export const AmbulanceMapLayer: React.FC<AmbulanceMapLayerProps> = ({
  hospitals,
  ambulances,
  activeRequest,
  onSelectHospital,
  onSelectAmbulance
}) => {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hospitalMarkersRef = useRef<maplibregl.Marker[]>([]);
  const ambulanceMarkersRef = useRef<maplibregl.Marker[]>([]);
  const requestMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Subscribe to Map Instance
  useEffect(() => {
    const unsubscribe = mapRegistry.subscribe((map) => {
      mapRef.current = map;
      if (map) {
        setupRouteLayers(map);
      }
    });

    return () => {
      unsubscribe();
      clearAllMarkers();
      removeRouteLayers(mapRef.current);
    };
  }, []);

  const setupRouteLayers = (map: maplibregl.Map) => {
    try {
      if (!map.isStyleLoaded()) {
        map.once('load', () => setupRouteLayers(map));
        return;
      }

      if (!map.getSource('ambulance-route-source')) {
        map.addSource('ambulance-route-source', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          }
        });
      }

      if (!map.getLayer('ambulance-route-casing')) {
        map.addLayer({
          id: 'ambulance-route-casing',
          type: 'line',
          source: 'ambulance-route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#FFFFFF',
            'line-width': 8,
            'line-opacity': 0.8
          }
        });
      }

      if (!map.getLayer('ambulance-route-line')) {
        map.addLayer({
          id: 'ambulance-route-line',
          type: 'line',
          source: 'ambulance-route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#EF4444', // Emergency red
            'line-width': 5,
            'line-opacity': 0.95
          }
        });
      }
    } catch (e) {
      console.warn('Map layer setup deferred:', e);
    }
  };

  const removeRouteLayers = (map: maplibregl.Map | null) => {
    if (!map) return;
    try {
      if (map.getLayer('ambulance-route-line')) map.removeLayer('ambulance-route-line');
      if (map.getLayer('ambulance-route-casing')) map.removeLayer('ambulance-route-casing');
      if (map.getSource('ambulance-route-source')) map.removeSource('ambulance-route-source');
    } catch {
      // Ignored if map was already destroyed
    }
  };

  const clearAllMarkers = () => {
    hospitalMarkersRef.current.forEach(m => m.remove());
    hospitalMarkersRef.current = [];
    ambulanceMarkersRef.current.forEach(m => m.remove());
    ambulanceMarkersRef.current = [];
    if (requestMarkerRef.current) {
      requestMarkerRef.current.remove();
      requestMarkerRef.current = null;
    }
  };

  // Sync route geometry
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    try {
      const source = map.getSource('ambulance-route-source') as maplibregl.GeoJSONSource;
      if (!source) return;

      if (activeRequest && activeRequest.routeGeometry && activeRequest.routeGeometry.length > 0) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: activeRequest.routeGeometry
          }
        });
      } else {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        });
      }
    } catch (e) {
      // Ignored
    }
  }, [activeRequest?.routeGeometry]);

  // Sync Emergency Destination Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (requestMarkerRef.current) {
      requestMarkerRef.current.remove();
      requestMarkerRef.current = null;
    }

    if (activeRequest && ['pending', 'assigned', 'enroute', 'onscene'].includes(activeRequest.status)) {
      const el = document.createElement('div');
      el.className = 'cursor-pointer transform hover:scale-110 transition-transform';
      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div class="flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-1 rounded-full shadow-lg border-2 border-white text-xs font-bold whitespace-nowrap animate-pulse">
            <span>🚨</span>
            <span>Chaqiruv #${activeRequest.id.slice(4, 8)}</span>
          </div>
          <div class="w-3 h-3 bg-red-600 rotate-45 -mt-1.5 border-r border-b border-white"></div>
        </div>
      `;

      requestMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([activeRequest.lon, activeRequest.lat])
        .addTo(map);
    }
  }, [activeRequest?.id, activeRequest?.lat, activeRequest?.lon, activeRequest?.status]);

  // Sync Hospitals Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    hospitalMarkersRef.current.forEach(m => m.remove());
    hospitalMarkersRef.current = [];

    hospitals.forEach(hosp => {
      const el = document.createElement('div');
      el.className = 'cursor-pointer transform hover:scale-110 transition-transform select-none';

      const isTarget = activeRequest?.targetHospitalId === hosp.id || activeRequest?.assignedHospitalId === hosp.id;
      const ringClass = isTarget ? 'ring-4 ring-red-500 animate-pulse' : 'ring-1 ring-gray-200';
      const badgeColor = hosp.type === 'private' ? 'bg-purple-600' : 'bg-blue-600';

      el.innerHTML = `
        <div class="flex items-center gap-1.5 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-full shadow-md ${ringClass} text-xs font-bold border border-gray-100">
          <span class="w-4 h-4 rounded-full ${badgeColor} text-white flex items-center justify-center text-[10px] font-black">H</span>
          <span class="text-gray-800 dark:text-gray-100 max-w-[130px] truncate">${hosp.name}</span>
        </div>
      `;

      el.addEventListener('click', () => {
        onSelectHospital?.(hosp);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([hosp.lon, hosp.lat])
        .addTo(map);

      hospitalMarkersRef.current.push(marker);
    });
  }, [hospitals, activeRequest?.targetHospitalId, activeRequest?.assignedHospitalId]);

  // Sync Ambulance Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    ambulanceMarkersRef.current.forEach(m => m.remove());
    ambulanceMarkersRef.current = [];

    ambulances.forEach(amb => {
      const el = document.createElement('div');
      el.className = 'cursor-pointer transform hover:scale-125 transition-transform select-none';

      const isEnroute = amb.status === 'enroute';
      const isAssigned = amb.status === 'assigned' || amb.status === 'onscene';

      let statusBg = 'bg-emerald-500'; // free
      if (isEnroute) statusBg = 'bg-red-500 animate-bounce';
      else if (isAssigned) statusBg = 'bg-amber-500';
      else if (amb.status === 'busy' || amb.status === 'offline') statusBg = 'bg-gray-400';

      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          ${isEnroute ? '<span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-red-400 opacity-75"></span>' : ''}
          <div class="relative flex items-center gap-1 px-2 py-1 rounded-full text-white text-[10px] font-extrabold shadow-float ${statusBg} border-2 border-white">
            <span class="text-xs">🚑</span>
            <span>${amb.plateNumber.split(' ')[1] || amb.plateNumber}</span>
          </div>
        </div>
      `;

      el.addEventListener('click', () => {
        onSelectAmbulance?.(amb);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([amb.lon, amb.lat])
        .addTo(map);

      ambulanceMarkersRef.current.push(marker);
    });
  }, [ambulances]);

  return null;
};
