import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { Hospital, AmbulanceUnit, EmergencyRequest, EmergencyServiceType } from '@yol/shared';
import { mapRegistry } from '../lib/mapRegistry';

interface CachedHospitalMarker {
  marker: maplibregl.Marker;
  el: HTMLElement;
  lastBorderClass: string;
}

interface CachedAmbulanceMarker {
  marker: maplibregl.Marker;
  el: HTMLElement;
  lastLon: number;
  lastLat: number;
  lastStatusBg: string;
}

interface AmbulanceMapLayerProps {
  serviceType?: EmergencyServiceType;
  hospitals: Hospital[];
  ambulances: AmbulanceUnit[];
  activeRequest?: EmergencyRequest | null;
  onSelectHospital?: (hospital: Hospital) => void;
  onSelectAmbulance?: (ambulance: AmbulanceUnit) => void;
  onSelectIncident?: (incident: any) => void;
}

export const AmbulanceMapLayer: React.FC<AmbulanceMapLayerProps> = ({
  serviceType = '103',
  hospitals,
  ambulances,
  activeRequest,
  onSelectHospital,
  onSelectAmbulance,
  onSelectIncident
}) => {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hospitalMarkersMapRef = useRef<Map<string, CachedHospitalMarker>>(new Map());
  const ambulanceMarkersMapRef = useRef<Map<string, CachedAmbulanceMarker>>(new Map());
  const incidentMarkersMapRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const requestMarkerRef = useRef<maplibregl.Marker | null>(null);
  const lastRequestMarkerCoordRef = useRef<{ lon: number; lat: number } | null>(null);
  const lastFittedReqIdRef = useRef<string | null>(null);
  const lastRouteGeometryStrRef = useRef<string>('');

  const routeColor = 
    serviceType === '102' ? '#2563EB' : // Police Blue
    serviceType === '101' ? '#DC2626' : // Fire Red
    serviceType === '104' ? '#0D9488' : // Gas Service Teal
    serviceType === '1050' ? '#D97706' : // Rescue Amber
    '#EF4444'; // Ambulance Red

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
            'line-color': routeColor,
            'line-width': 5,
            'line-opacity': 0.95
          }
        });
      } else {
        map.setPaintProperty('ambulance-route-line', 'line-color', routeColor);
      }
    } catch (e) {
      console.warn('Map layer setup deferred:', e);
    }
  };

  // Update line color if serviceType changes
  useEffect(() => {
    const map = mapRef.current;
    if (map && map.getLayer('ambulance-route-line')) {
      try {
        map.setPaintProperty('ambulance-route-line', 'line-color', routeColor);
      } catch {}
    }
  }, [routeColor]);

  const removeRouteLayers = (map: maplibregl.Map | null) => {
    if (!map) return;
    try {
      if (map.getLayer('ambulance-route-line')) map.removeLayer('ambulance-route-line');
      if (map.getLayer('ambulance-route-casing')) map.removeLayer('ambulance-route-casing');
      if (map.getSource('ambulance-route-source')) map.removeSource('ambulance-route-source');
    } catch {}
  };

  const clearAllMarkers = () => {
    hospitalMarkersMapRef.current.forEach(item => item.marker.remove());
    hospitalMarkersMapRef.current.clear();
    ambulanceMarkersMapRef.current.forEach(item => item.marker.remove());
    ambulanceMarkersMapRef.current.clear();
    incidentMarkersMapRef.current.forEach(marker => marker.remove());
    incidentMarkersMapRef.current.clear();
    if (requestMarkerRef.current) {
      requestMarkerRef.current.remove();
      requestMarkerRef.current = null;
      lastRequestMarkerCoordRef.current = null;
    }
  };

  // Clear markers on serviceType change to prevent cross-service residual markers
  useEffect(() => {
    clearAllMarkers();
    lastFittedReqIdRef.current = null;
    lastRouteGeometryStrRef.current = '';
  }, [serviceType]);

  // Sync route geometry without jittering or continuous zoom loops
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    try {
      const source = map.getSource('ambulance-route-source') as maplibregl.GeoJSONSource;
      if (!source) return;

      const currentGeom = activeRequest?.routeGeometry || [];
      const geomStr = JSON.stringify(currentGeom);

      if (currentGeom.length > 0) {
        if (geomStr !== lastRouteGeometryStrRef.current) {
          lastRouteGeometryStrRef.current = geomStr;
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: currentGeom
            }
          });
        }

        if (
          ['pending', 'assigned', 'enroute'].includes(activeRequest?.status || '') &&
          lastFittedReqIdRef.current !== activeRequest?.id
        ) {
          lastFittedReqIdRef.current = activeRequest?.id || null;
          const bounds = new maplibregl.LngLatBounds();
          currentGeom.forEach(coord => bounds.extend(coord));
          map.fitBounds(bounds, { padding: 90, maxZoom: 15, duration: 0 });
        }
      } else {
        if (lastRouteGeometryStrRef.current !== '') {
          lastRouteGeometryStrRef.current = '';
          lastFittedReqIdRef.current = null;
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          });
        }
      }
    } catch {}
  }, [activeRequest?.id, activeRequest?.status, activeRequest?.routeGeometry]);

  // Sync Emergency Destination Marker (Zero-jitter: no CSS transitions on marker)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const isActive = activeRequest && ['pending', 'assigned', 'enroute', 'onscene'].includes(activeRequest.status);

    if (isActive) {
      const lastCoord = lastRequestMarkerCoordRef.current;
      const coordChanged = !lastCoord || 
        Math.abs(lastCoord.lon - activeRequest.lon) > 0.000005 || 
        Math.abs(lastCoord.lat - activeRequest.lat) > 0.000005;

      if (requestMarkerRef.current) {
        if (coordChanged) {
          requestMarkerRef.current.setLngLat([activeRequest.lon, activeRequest.lat]);
          lastRequestMarkerCoordRef.current = { lon: activeRequest.lon, lat: activeRequest.lat };
        }
      } else {
        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none';
        el.innerHTML = `
          <div class="relative flex flex-col items-center">
            <div class="flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-1 rounded-full shadow-lg border-2 border-white text-xs font-black whitespace-nowrap">
              <span class="w-2 h-2 rounded-full bg-white"></span>
              <span>Chaqiruv #${activeRequest.id.slice(-6).toUpperCase()}</span>
            </div>
            <div class="w-2.5 h-2.5 bg-red-600 rotate-45 -mt-1 border-r border-b border-white"></div>
          </div>
        `;

        requestMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([activeRequest.lon, activeRequest.lat])
          .addTo(map);

        lastRequestMarkerCoordRef.current = { lon: activeRequest.lon, lat: activeRequest.lat };
      }
    } else {
      if (requestMarkerRef.current) {
        requestMarkerRef.current.remove();
        requestMarkerRef.current = null;
        lastRequestMarkerCoordRef.current = null;
      }
    }
  }, [activeRequest?.id, activeRequest?.lat, activeRequest?.lon, activeRequest?.status]);

  // Sync Stations Markers (Zero-jitter: no CSS transitions)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentMap = hospitalMarkersMapRef.current;

    hospitals.forEach(hosp => {
      const isTarget = activeRequest?.targetHospitalId === hosp.id || activeRequest?.assignedHospitalId === hosp.id;
      const borderClass = isTarget 
        ? 'border-2 border-red-500 shadow-md ring-2 ring-red-300' 
        : 'border border-gray-200 dark:border-gray-700 shadow-sm';
      const badgeLetter =
        serviceType === '102' ? 'P' :
        serviceType === '101' ? 'F' :
        serviceType === '104' ? 'G' :
        serviceType === '1050' ? 'Q' : 'H';
      const badgeColor =
        serviceType === '102' ? 'bg-blue-700' :
        serviceType === '101' ? 'bg-rose-700' :
        serviceType === '104' ? 'bg-teal-600' :
        serviceType === '1050' ? 'bg-amber-600' : 'bg-red-600';

      const existing = currentMap.get(hosp.id);
      if (existing) {
        if (existing.lastBorderClass !== borderClass) {
          existing.lastBorderClass = borderClass;
          const pill = existing.el.querySelector('.hospital-pill');
          if (pill) {
            pill.className = `hospital-pill flex items-center gap-1.5 bg-white dark:bg-gray-900 px-2.5 py-1 rounded-full ${borderClass} text-xs font-bold`;
          }
        }
      } else {
        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none';
        el.innerHTML = `
          <div class="hospital-pill flex items-center gap-1.5 bg-white dark:bg-gray-900 px-2.5 py-1 rounded-full ${borderClass} text-xs font-bold">
            <span class="w-4 h-4 rounded-full ${badgeColor} text-white flex items-center justify-center text-[10px] font-black">${badgeLetter}</span>
            <span class="text-gray-900 dark:text-gray-100 max-w-[140px] truncate">${hosp.name}</span>
          </div>
        `;

        el.addEventListener('click', () => {
          onSelectHospital?.(hosp);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([hosp.lon, hosp.lat])
          .addTo(map);

        currentMap.set(hosp.id, { marker, el, lastBorderClass: borderClass });
      }
    });
  }, [hospitals, activeRequest?.targetHospitalId, activeRequest?.assignedHospitalId, serviceType]);

  // Sync Unit / Vehicle Markers (Strictly zero-jitter: updates setLngLat only on real movement, zero CSS transitions)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentMap = ambulanceMarkersMapRef.current;
    const activeIds = new Set(ambulances.map(a => a.id));

    // Remove deleted units
    for (const [id, item] of currentMap.entries()) {
      if (!activeIds.has(id)) {
        item.marker.remove();
        currentMap.delete(id);
      }
    }

    ambulances.forEach(amb => {
      const isEnroute = amb.status === 'enroute';
      const isAssigned = amb.status === 'assigned' || amb.status === 'onscene';

      let statusBg = 'bg-emerald-600';
      if (isEnroute) statusBg = 'bg-red-600';
      else if (isAssigned) statusBg = 'bg-amber-600';
      else if (amb.status === 'busy' || amb.status === 'offline') statusBg = 'bg-gray-500';

      const existing = currentMap.get(amb.id);

      if (existing) {
        // Only update coordinate if it changed significantly (avoiding micro-jittering)
        const posChanged = 
          Math.abs(existing.lastLon - amb.lon) > 0.000005 || 
          Math.abs(existing.lastLat - amb.lat) > 0.000005;

        if (posChanged) {
          existing.marker.setLngLat([amb.lon, amb.lat]);
          existing.lastLon = amb.lon;
          existing.lastLat = amb.lat;
        }

        // Only update class if status changed
        if (existing.lastStatusBg !== statusBg) {
          existing.lastStatusBg = statusBg;
          const badge = existing.el.querySelector('.ambulance-badge');
          if (badge) {
            badge.className = `ambulance-badge flex items-center gap-1.5 px-2 py-0.5 rounded-full text-white text-[10px] font-black shadow-md ${statusBg} border-2 border-white`;
          }
        }
      } else {
        const el = document.createElement('div');
        // IMPORTANT: Strictly avoid CSS transition on marker element to prevent projection matrix conflict & shaking!
        el.className = 'cursor-pointer select-none';
        el.innerHTML = `
          <div class="relative flex flex-col items-center">
            <div class="ambulance-badge flex items-center gap-1.5 px-2 py-0.5 rounded-full text-white text-[10px] font-black shadow-md ${statusBg} border-2 border-white">
              <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
              <span>${amb.plateNumber}</span>
            </div>
            <div class="w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-0.5"></div>
          </div>
        `;

        el.addEventListener('click', () => {
          onSelectAmbulance?.(amb);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([amb.lon, amb.lat])
          .addTo(map);

        currentMap.set(amb.id, { 
          marker, 
          el, 
          lastLon: amb.lon, 
          lastLat: amb.lat, 
          lastStatusBg: statusBg 
        });
      }
    });
  }, [ambulances, serviceType]);

  // Sync Route Corridor Road Problems & Traffic Jam Markers on Map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIncidentMap = incidentMarkersMapRef.current;
    const isActive = activeRequest && ['pending', 'assigned', 'enroute', 'onscene'].includes(activeRequest.status);
    const incidents = isActive ? (activeRequest?.routeIncidents || []) : [];
    const activeIncidentIds = new Set(incidents.map(inc => inc.id));

    for (const [id, marker] of currentIncidentMap.entries()) {
      if (!activeIncidentIds.has(id)) {
        marker.remove();
        currentIncidentMap.delete(id);
      }
    }

    incidents.forEach(inc => {
      if (currentIncidentMap.has(inc.id)) return;

      const badgeLabel =
        inc.featureType === 'traffic' ? 'Tirbandlik' :
        inc.featureType === 'roadwork' ? "Yo'l ta'miri" :
        inc.featureType === 'closure' ? "Yopiq yo'l" : 'YTH / Xavf';

      const badgeBg =
        inc.featureType === 'traffic' ? 'bg-amber-500' :
        inc.featureType === 'roadwork' ? 'bg-orange-600' :
        inc.featureType === 'closure' ? 'bg-red-700' : 'bg-red-600';

      const cleanTitle = (inc.title || '')
        .replace(/Collision near Amir Temur Square/gi, "Amir Temur xiyoboni yaqinida YTH")
        .replace(/Collision near/gi, "Yaqinida YTH")
        .replace(/Slow flow on Mustaqillik Avenue/gi, "Mustaqillik shoh ko'chasida tirbandlik")
        .replace(/Slow flow on/gi, "Shoh ko'chada tirbandlik")
        .replace(/Underground utility pipe repair/gi, "Yer osti muhandislik ta'miri")
        .replace(/Road closure on/gi, "Yo'l yopilishi");

      const el = document.createElement('div');
      el.className = 'cursor-pointer select-none group';
      el.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div class="absolute -inset-1 rounded-full ${badgeBg} opacity-40 animate-ping"></div>
          <div class="relative flex items-center gap-1.5 ${badgeBg} text-white px-2.5 py-1 rounded-full shadow-lg border-2 border-white text-[10px] font-black whitespace-nowrap transform group-hover:scale-110 transition-transform">
            <span>⚠ ${badgeLabel}:</span>
            <span class="max-w-[150px] truncate">${cleanTitle}</span>
          </div>
          <div class="w-2 h-2 ${badgeBg} rotate-45 -mt-1 border-r border-b border-white"></div>
        </div>
      `;

      el.onclick = (e) => {
        e.stopPropagation();
        onSelectIncident?.(inc);
      };

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([inc.longitude, inc.latitude])
        .addTo(map);

      currentIncidentMap.set(inc.id, marker);
    });
  }, [activeRequest?.id, activeRequest?.status, activeRequest?.routeIncidents, serviceType]);

  return null;
};
