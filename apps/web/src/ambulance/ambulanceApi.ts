import {
  AmbulanceStatePayload,
  AmbulanceStats,
  EmergencyRequest,
  EmergencySeverity,
  Hospital,
  AmbulanceUnit,
  AmbulanceStaffBinding,
  EmergencyServiceType,
  AmbulanceRouteStep
} from '@yol/shared';

const API_BASE = '/api/v1/ambulance';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('yol_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const FALLBACK_STATIONS: Hospital[] = [
  // 103 (Tez Tibbiy Yordam)
  {
    id: 'hosp-tash-1',
    name: 'Respublika Shoshilinch Tibbiy Yordam Ilmiy Markazi (16-shifoxona)',
    type: 'state',
    serviceType: '103',
    lat: 41.2721,
    lon: 69.2155,
    isDemo: true,
    address: "Kichik Xalqa Yo'li 2, Chilonzor, Toshkent"
  },
  {
    id: 'hosp-tash-2',
    name: "Toshkent Shahar 1-son Shoshilinch Tibbiy Yordam Klinikasi",
    type: 'state',
    serviceType: '103',
    lat: 41.3340,
    lon: 69.2845,
    isDemo: true,
    address: "Farobiy ko'chasi 2, Olmazor, Toshkent"
  },
  // 102 (Ichki Ishlar)
  {
    id: 'dept-tash-102-1',
    name: "Toshkent Shahar IIBB Navbatchilik Qismi (102 Markazi)",
    type: 'state',
    serviceType: '102',
    lat: 41.2985,
    lon: 69.2785,
    isDemo: true,
    address: "Sayilgoh ko'chasi 9, Yunusobod, Toshkent"
  },
  {
    id: 'dept-tash-102-2',
    name: "Chilonzor Tumani IIO FMB Patrul-Post Xizmati",
    type: 'state',
    serviceType: '102',
    lat: 41.2780,
    lon: 69.2080,
    isDemo: true,
    address: "Chilonzor 2-mavze, Toshkent"
  },
  // 101 (Yong'in Xavfsizligi)
  {
    id: 'fire-tash-101-1',
    name: "Toshkent Shahar FVB 1-harbiylashtirilgan Yong'in-Qutqaruv Qismi",
    type: 'state',
    serviceType: '101',
    lat: 41.3150,
    lon: 69.2600,
    isDemo: true,
    address: "Amir Temur shox ko'chasi 15, Toshkent"
  },
  {
    id: 'fire-tash-101-2',
    name: "Yakkasaroy Tumani 4-son Yong'in Xavfsizligi Qismi",
    type: 'state',
    serviceType: '101',
    lat: 41.2820,
    lon: 69.2520,
    isDemo: true,
    address: "Shota Rustaveli ko'chasi 45, Toshkent"
  },
  // 104 (Favqulodda Gaz Xizmati)
  {
    id: 'gas-tash-104-1',
    name: '"Hududgaz Poytaxt" Markaziy Avariya-Dispetcherlik Xizmati (104 Markazi)',
    type: 'state',
    serviceType: '104',
    lat: 41.2945,
    lon: 69.2285,
    isDemo: true,
    address: "Muqimiy ko'chasi 98, Chilonzor, Toshkent"
  },
  {
    id: 'gas-tash-104-2',
    name: "Yunusobod Tumani Gaz Ta'minoti Avariya Xizmati (104 Bo'limi)",
    type: 'state',
    serviceType: '104',
    lat: 41.3480,
    lon: 69.2860,
    isDemo: true,
    address: "Amir Temur shoh ko'chasi 112, Yunusobod, Toshkent"
  },
  // 1050 (FVV Favqulodda Vaziyatlar)
  {
    id: 'fvv-tash-1050-1',
    name: "FVV Maxsus Vazifalar Bo'yicha Respublika Qutqaruv Markazi",
    type: 'state',
    serviceType: '1050',
    lat: 41.2750,
    lon: 69.2310,
    isDemo: true,
    address: "Qatortol ko'chasi 60, Chilonzor, Toshkent"
  },
  {
    id: 'fvv-tash-1050-2',
    name: "FVV Toshkent Shahar Qutqaruv Otryadi Tezkor Bo'limi",
    type: 'state',
    serviceType: '1050',
    lat: 41.3280,
    lon: 69.2620,
    isDemo: true,
    address: "Sebzor ko'chasi 21, Olmazor, Toshkent"
  }
];

export const FALLBACK_UNITS: AmbulanceUnit[] = [
  // 103
  {
    id: 'amb-tash-101',
    hospitalId: 'hosp-tash-1',
    serviceType: '103',
    plateNumber: '01 103 TAA',
    lat: 41.2721,
    lon: 69.2155,
    baseLat: 41.2721,
    baseLon: 69.2155,
    status: 'free'
  },
  {
    id: 'amb-tash-102',
    hospitalId: 'hosp-tash-1',
    serviceType: '103',
    plateNumber: '01 104 TAA',
    lat: 41.2740,
    lon: 69.2180,
    baseLat: 41.2721,
    baseLon: 69.2155,
    status: 'free'
  },
  // 102
  {
    id: 'pol-tash-101',
    hospitalId: 'dept-tash-102-1',
    serviceType: '102',
    plateNumber: '01 102 PPA',
    lat: 41.2985,
    lon: 69.2785,
    baseLat: 41.2985,
    baseLon: 69.2785,
    status: 'free'
  },
  {
    id: 'pol-tash-102',
    hospitalId: 'dept-tash-102-2',
    serviceType: '102',
    plateNumber: '01 104 PPA',
    lat: 41.2780,
    lon: 69.2080,
    baseLat: 41.2780,
    baseLon: 69.2080,
    status: 'free'
  },
  // 101
  {
    id: 'fire-tash-101',
    hospitalId: 'fire-tash-101-1',
    serviceType: '101',
    plateNumber: '01 101 FVV',
    lat: 41.3150,
    lon: 69.2600,
    baseLat: 41.3150,
    baseLon: 69.2600,
    status: 'free'
  },
  {
    id: 'fire-tash-102',
    hospitalId: 'fire-tash-101-2',
    serviceType: '101',
    plateNumber: '01 102 FVV',
    lat: 41.2820,
    lon: 69.2520,
    baseLat: 41.2820,
    baseLon: 69.2520,
    status: 'free'
  },
  // 104
  {
    id: 'gas-tash-101',
    hospitalId: 'gas-tash-104-1',
    serviceType: '104',
    plateNumber: '01 104 GAZ',
    lat: 41.2945,
    lon: 69.2285,
    baseLat: 41.2945,
    baseLon: 69.2285,
    status: 'free'
  },
  {
    id: 'gas-tash-102',
    hospitalId: 'gas-tash-104-2',
    serviceType: '104',
    plateNumber: '01 105 GAZ',
    lat: 41.3480,
    lon: 69.2860,
    baseLat: 41.3480,
    baseLon: 69.2860,
    status: 'free'
  },
  // 1050
  {
    id: 'res-tash-101',
    hospitalId: 'fvv-tash-1050-1',
    serviceType: '1050',
    plateNumber: '01 1050 FVV',
    lat: 41.2750,
    lon: 69.2310,
    baseLat: 41.2750,
    baseLon: 69.2310,
    status: 'free'
  },
  {
    id: 'res-tash-102',
    hospitalId: 'fvv-tash-1050-2',
    serviceType: '1050',
    plateNumber: '01 1052 FVV',
    lat: 41.3280,
    lon: 69.2620,
    baseLat: 41.3280,
    baseLon: 69.2620,
    status: 'free'
  }
];

function getPendingKey(service: EmergencyServiceType) {
  return `yol_${service}_pending_requests`;
}
function getActiveKey(service: EmergencyServiceType) {
  return `yol_${service}_active_request`;
}
function getUnitsKey(service: EmergencyServiceType) {
  return `yol_${service}_units`;
}

function loadStoredPending(service: EmergencyServiceType): EmergencyRequest[] {
  try {
    const raw = localStorage.getItem(getPendingKey(service));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredPending(service: EmergencyServiceType, list: EmergencyRequest[]) {
  try {
    localStorage.setItem(getPendingKey(service), JSON.stringify(list));
  } catch {}
}

function loadStoredActive(service: EmergencyServiceType): EmergencyRequest | null {
  try {
    const raw = localStorage.getItem(getActiveKey(service));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredActive(service: EmergencyServiceType, req: EmergencyRequest | null) {
  try {
    if (req) {
      localStorage.setItem(getActiveKey(service), JSON.stringify(req));
    } else {
      localStorage.removeItem(getActiveKey(service));
    }
  } catch {}
}

function loadStoredUnits(service: EmergencyServiceType): AmbulanceUnit[] {
  try {
    const raw = localStorage.getItem(getUnitsKey(service));
    if (raw) return JSON.parse(raw);
  } catch {}
  return FALLBACK_UNITS.filter(u => (u.serviceType || '103') === service);
}

function saveStoredUnits(service: EmergencyServiceType, units: AmbulanceUnit[]) {
  try {
    localStorage.setItem(getUnitsKey(service), JSON.stringify(units));
  } catch {}
}

let fallbackSimulationSteps: Record<string, number> = {};

export const ambulanceApi = {
  async fetchState(serviceType: EmergencyServiceType = '103'): Promise<AmbulanceStatePayload> {
    try {
      const res = await fetch(`${API_BASE}/state?service=${serviceType}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const serverState: AmbulanceStatePayload = await res.json();
        
        // Synchronize with local cache
        const storedPending = loadStoredPending(serviceType);
        const serverPending = serverState.pendingRequests || [];
        const pendingMap = new Map<string, EmergencyRequest>();

        serverPending.forEach(r => pendingMap.set(r.id, r));
        storedPending.forEach(r => {
          if (!pendingMap.has(r.id) && r.status === 'pending') {
            pendingMap.set(r.id, r);
          }
        });

        const mergedPending = Array.from(pendingMap.values());
        saveStoredPending(serviceType, mergedPending);

        const currentActive = serverState.activeRequest !== undefined 
          ? serverState.activeRequest 
          : loadStoredActive(serviceType);
        if (serverState.activeRequest === null) {
          saveStoredActive(serviceType, null);
        } else if (currentActive) {
          saveStoredActive(serviceType, currentActive);
        }

        const isAssigned = (r: EmergencyRequest | null | undefined) => 
          Boolean(r && ['assigned', 'enroute', 'onscene'].includes(r.status));

        const assignedToDriver = isAssigned(serverState.assignedRequest) 
          ? serverState.assignedRequest 
          : (isAssigned(currentActive) ? currentActive : null);

        return {
          ...serverState,
          pendingRequests: mergedPending,
          activeRequest: currentActive,
          assignedRequest: assignedToDriver
        };
      }
    } catch {
      // Local client fallback demo engine
    }

    // Local client demo fallback
    const userRaw = localStorage.getItem('yol_user');
    let clientRole = 'CITIZEN';
    if (userRaw) {
      try {
        const u = JSON.parse(userRaw);
        if (u.email?.includes('disp')) clientRole = 'DISPATCHER';
        else if (u.email?.includes('driver')) clientRole = 'DRIVER';
        else if (u.role === 'ADMIN') clientRole = 'ADMIN';
      } catch {}
    }

    const currentUnits = loadStoredUnits(serviceType);
    let currentActive = loadStoredActive(serviceType);

    // Simulation step if enroute
    if (currentActive && currentActive.status === 'enroute') {
      const coords = currentActive.routeGeometry || [];
      if (coords.length > 2) {
        const step = (fallbackSimulationSteps[serviceType] || 0) + 1;
        fallbackSimulationSteps[serviceType] = Math.min(coords.length - 1, step);
        const currCoord = coords[fallbackSimulationSteps[serviceType]];
        
        const unit = currentUnits.find(a => a.id === currentActive?.assignedAmbulanceId) || currentUnits[0];
        if (unit) {
          unit.lat = currCoord[1];
          unit.lon = currCoord[0];
          unit.status = 'enroute';
          saveStoredUnits(serviceType, currentUnits);
        }

        const remainingProgress = (coords.length - 1 - fallbackSimulationSteps[serviceType]) / (coords.length - 1);
        currentActive.etaMinutes = Math.max(1, Math.round(remainingProgress * 7));

        if (fallbackSimulationSteps[serviceType] >= coords.length - 1) {
          currentActive.status = 'onscene';
          currentActive.etaMinutes = 0;
          if (unit) unit.status = 'onscene';
          saveStoredUnits(serviceType, currentUnits);
        }
        saveStoredActive(serviceType, currentActive);
      }
    }

    const pendingList = loadStoredPending(serviceType).filter(r => r.status === 'pending');
    if (currentActive && currentActive.status === 'pending' && !pendingList.some(r => r.id === currentActive?.id)) {
      pendingList.unshift(currentActive);
      saveStoredPending(serviceType, pendingList);
    }

    const serviceHospitals = FALLBACK_STATIONS.filter(h => (h.serviceType || '103') === serviceType);

    const isAssignedFallback = (r: EmergencyRequest | null | undefined) => 
      Boolean(r && ['assigned', 'enroute', 'onscene'].includes(r.status));

    const assignedToDriverFallback = isAssignedFallback(currentActive) ? currentActive : null;

    return {
      role: clientRole as any,
      hospitals: serviceHospitals,
      ambulances: currentUnits,
      activeRequest: currentActive,
      assignedRequest: assignedToDriverFallback,
      pendingRequests: pendingList,
      stats: {
        totalCalls: 16,
        activeCalls: currentActive ? 1 : 0,
        completedCalls: 15,
        averageMinutesSaved: 10.4,
        baselineQueuePenaltyMinutes: 12
      },
      timestamp: new Date().toISOString()
    };
  },

  async fetchStats(): Promise<AmbulanceStats> {
    try {
      const res = await fetch(`${API_BASE}/stats`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    return {
      totalCalls: 16,
      activeCalls: 1,
      completedCalls: 15,
      averageMinutesSaved: 10.4,
      baselineQueuePenaltyMinutes: 12
    };
  },

  async createRequest(data: {
    lat: number;
    lon: number;
    description?: string;
    severity?: EmergencySeverity;
    citizenPhone?: string;
    citizenName?: string;
    citizenId?: string;
    serviceType?: EmergencyServiceType;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
  }): Promise<{ request: EmergencyRequest; isDuplicate?: boolean; message?: string }> {
    const serviceType = data.serviceType || '103';

    let citizenId = data.citizenId || 'usr-citizen-demo';
    let citizenName = data.citizenName || 'Fuqaro (Siz)';
    try {
      const saved = localStorage.getItem('yol_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.name) citizenName = u.name;
        if (u.id) citizenId = u.id;
      }
    } catch {}

    try {
      const res = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...data,
          citizenId,
          citizenName,
          serviceType,
          description: data.description || (serviceType === '101' ? "Tezkor yong'in chaqiruvi (1-bosqich signal)" : "Tezkor chaqiruv"),
          severity: data.severity || (serviceType === '101' ? 1 : 2),
          autoDispatchDemo: false
        })
      });
      if (res.ok) {
        const json = await res.json();
        saveStoredActive(serviceType, json.request);
        const stored = loadStoredPending(serviceType);
        saveStoredPending(serviceType, [json.request, ...stored.filter(r => r.id !== json.request.id)]);
        return json;
      }
    } catch {
      // Local client fallback
    }

    const endLat = data.lat;
    const endLon = data.lon;

    const sampleRouteWaypoints: [number, number][] = [
      [69.2155, 41.2721],
      [69.2185, 41.2735],
      [69.2240, 41.2760],
      [69.2310, 41.2790],
      [69.2380, 41.2825],
      [69.2450, 41.2860],
      [69.2520, 41.2895],
      [69.2590, 41.2930],
      [69.2640, 41.2965],
      [69.2680, 41.3000],
      [69.2720, 41.3040],
      [69.2755, 41.3075],
      [69.2780, 41.3095],
      [endLon, endLat]
    ];

    const demoTurnSteps: AmbulanceRouteStep[] = [
      {
        instruction: "Boshlang'ich markazdan harakatlanish boshlandi",
        distanceMeters: 400,
        durationSeconds: 30,
        maneuverType: 'straight',
        coordinate: [69.2185, 41.2735]
      },
      {
        instruction: "Chorraha bo'ylab to'g'riga harakatlaning",
        distanceMeters: 850,
        durationSeconds: 65,
        maneuverType: 'straight',
        coordinate: [69.2310, 41.2790]
      },
      {
        instruction: "O'ngga buriling va shoh ko'cha bo'ylab davom eting",
        distanceMeters: 1200,
        durationSeconds: 85,
        maneuverType: 'turn-right',
        coordinate: [69.2450, 41.2860]
      },
      {
        instruction: "Chapga buriling — Chaqiruv manziliga yaqinlashish",
        distanceMeters: 900,
        durationSeconds: 70,
        maneuverType: 'turn-left',
        coordinate: [69.2590, 41.2930]
      },
      {
        instruction: "Chaqiruv manziliga yetib kelindi",
        distanceMeters: 250,
        durationSeconds: 20,
        maneuverType: 'arrive',
        coordinate: [endLon, endLat]
      }
    ];

    const reqId = `req-${serviceType}-${Math.random().toString(36).substring(2, 8)}`;
    const nowIso = new Date().toISOString();

    const stations = FALLBACK_STATIONS.filter(s => (s.serviceType || '103') === serviceType);
    const stationId = stations[0]?.id || 'hosp-tash-1';

    const newReq: EmergencyRequest = {
      id: reqId,
      serviceType,
      citizenId,
      citizenName,
      citizenPhone: data.citizenPhone || '+998 90 123 45 67',
      lat: data.lat,
      lon: data.lon,
      description: data.description || (serviceType === '101' ? "Tezkor yong'in signali" : "Shoshilinch chaqiruv"),
      severity: data.severity || (serviceType === '101' ? 1 : 2),
      status: 'pending',
      targetHospitalId: stationId,
      triedHospitalIds: [],
      routeGeometry: sampleRouteWaypoints,
      routeSteps: demoTurnSteps,
      etaMinutes: 6,
      distanceMeters: 4800,
      trafficDelayMinutes: 8,
      minutesSaved: 8.5,
      routeIncidents: [
        {
          id: 'feat-3',
          featureType: 'traffic',
          title: 'Bunyodkor shoh ko\'chasida tirbandlik',
          description: 'Xalqlar do\'stligi saroyi yo\'nalishida zich tirbandlik (+5 daqiqa kechikish).',
          latitude: 41.3032,
          longitude: 69.2435,
          severity: 'high',
          source: 'Live',
          isActive: true,
          verifiedAt: nowIso
        },
        {
          id: 'feat-5',
          featureType: 'roadwork',
          title: 'Navoiy ko\'chasida yerosti quvurlari ta\'miri',
          description: 'O\'rta ikki qator vaqtincha cheklangan, yashil yo\'lak ochiq.',
          latitude: 41.3241,
          longitude: 69.2558,
          severity: 'medium',
          source: 'Official',
          isActive: true,
          verifiedAt: nowIso
        }
      ],
      hazardWarnings: [
        "Tirbandlik: Bunyodkor shoh ko'chasida tirbandlik (+5 daq kechikish)",
        "Yo'l ta'miri: Navoiy ko'chasida yerosti quvurlari ta'miri"
      ],
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    saveStoredActive(serviceType, newReq);
    const stored = loadStoredPending(serviceType);
    saveStoredPending(serviceType, [newReq, ...stored.filter(r => r.id !== newReq.id)]);
    fallbackSimulationSteps[serviceType] = 0;

    return { request: newReq };
  },

  async cancelRequest(id: string, serviceType: EmergencyServiceType = '103'): Promise<EmergencyRequest> {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const stored = loadStoredPending(serviceType).filter(r => r.id !== id);
        saveStoredPending(serviceType, stored);
        saveStoredActive(serviceType, null);
        return await res.json();
      }
    } catch {}

    const stored = loadStoredPending(serviceType).filter(r => r.id !== id);
    saveStoredPending(serviceType, stored);
    saveStoredActive(serviceType, null);
    return {} as EmergencyRequest;
  },

  async acceptRequest(id: string, hospitalId?: string, ambulanceId?: string, serviceType: EmergencyServiceType = '103'): Promise<EmergencyRequest> {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/accept`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ hospitalId, ambulanceId })
      });
      if (res.ok) {
        const updated = await res.json();
        const stored = loadStoredPending(serviceType).filter(r => r.id !== id);
        saveStoredPending(serviceType, stored);
        saveStoredActive(serviceType, updated);
        const ambs = loadStoredUnits(serviceType);
        const amb = ambs.find(a => a.id === (ambulanceId || updated.assignedAmbulanceId));
        if (amb) {
          amb.status = 'assigned';
          amb.currentRequestId = id;
          saveStoredUnits(serviceType, ambs);
        }
        return updated;
      }
    } catch {}

    const stored = loadStoredPending(serviceType).filter(r => r.id !== id);
    saveStoredPending(serviceType, stored);
    const active = loadStoredActive(serviceType);
    if (active && active.id === id) {
      active.status = 'assigned';
      const ambs = loadStoredUnits(serviceType);
      const assignedAmb = ambulanceId
        ? ambs.find(a => a.id === ambulanceId) || ambs[0]
        : ambs[0];
      active.assignedAmbulanceId = assignedAmb?.id;
      active.assignedHospitalId = hospitalId || FALLBACK_STATIONS.find(s => (s.serviceType || '103') === serviceType)?.id;
      if (assignedAmb) {
        assignedAmb.status = 'assigned';
        assignedAmb.currentRequestId = id;
      }
      saveStoredActive(serviceType, active);
      saveStoredUnits(serviceType, ambs);
      return active;
    }
    return {} as EmergencyRequest;
  },

  async declineRequest(id: string, hospitalId?: string, serviceType: EmergencyServiceType = '103'): Promise<EmergencyRequest> {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/decline`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ hospitalId })
      });
      if (res.ok) {
        const stored = loadStoredPending(serviceType).filter(r => r.id !== id);
        saveStoredPending(serviceType, stored);
        return await res.json();
      }
    } catch {}

    const stored = loadStoredPending(serviceType).filter(r => r.id !== id);
    saveStoredPending(serviceType, stored);
    return {} as EmergencyRequest;
  },

  async driverGo(id: string, ambulanceId?: string, serviceType: EmergencyServiceType = '103'): Promise<EmergencyRequest> {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/go`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ambulanceId })
      });
      if (res.ok) {
        const updated = await res.json();
        saveStoredActive(serviceType, updated);
        const ambs = loadStoredUnits(serviceType);
        const amb = ambs.find(a => a.id === (ambulanceId || updated.assignedAmbulanceId));
        if (amb) {
          amb.status = 'enroute';
          saveStoredUnits(serviceType, ambs);
        }
        return updated;
      }
    } catch {}

    const active = loadStoredActive(serviceType);
    if (active) {
      active.status = 'enroute';
      saveStoredActive(serviceType, active);
      const ambs = loadStoredUnits(serviceType);
      const amb = ambs.find(a => a.id === (ambulanceId || active.assignedAmbulanceId));
      if (amb) {
        amb.status = 'enroute';
        saveStoredUnits(serviceType, ambs);
      }
      return active;
    }
    return {} as EmergencyRequest;
  },

  async driverOnScene(id: string, ambulanceId?: string, serviceType: EmergencyServiceType = '103'): Promise<EmergencyRequest> {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/onscene`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ambulanceId })
      });
      if (res.ok) {
        const updated = await res.json();
        saveStoredActive(serviceType, updated);
        const ambs = loadStoredUnits(serviceType);
        const amb = ambs.find(a => a.id === (ambulanceId || updated.assignedAmbulanceId));
        if (amb) {
          amb.status = 'onscene';
          saveStoredUnits(serviceType, ambs);
        }
        return updated;
      }
    } catch {}

    const active = loadStoredActive(serviceType);
    if (active) {
      active.status = 'onscene';
      saveStoredActive(serviceType, active);
      const ambs = loadStoredUnits(serviceType);
      const amb = ambs.find(a => a.id === (ambulanceId || active.assignedAmbulanceId));
      if (amb) {
        amb.status = 'onscene';
        saveStoredUnits(serviceType, ambs);
      }
      return active;
    }
    return {} as EmergencyRequest;
  },

  async driverComplete(id: string, ambulanceId?: string, serviceType: EmergencyServiceType = '103'): Promise<EmergencyRequest> {
    saveStoredActive(serviceType, null);
    const stored = loadStoredPending(serviceType).filter(r => r.id !== id);
    saveStoredPending(serviceType, stored);

    const ambs = loadStoredUnits(serviceType);
    const amb = ambs.find(a => a.id === (ambulanceId || ambs[0]?.id));
    if (amb) {
      amb.status = 'free';
      amb.currentRequestId = undefined;
      amb.lat = amb.baseLat;
      amb.lon = amb.baseLon;
      saveStoredUnits(serviceType, ambs);
    }

    try {
      const res = await fetch(`${API_BASE}/requests/${id}/complete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ambulanceId })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    return {} as EmergencyRequest;
  },

  async addAmbulance(unit: Partial<AmbulanceUnit>, serviceType: EmergencyServiceType = '103'): Promise<AmbulanceUnit> {
    try {
      const res = await fetch(`${API_BASE}/units`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...unit, serviceType })
      });
      if (res.ok) {
        const created = await res.json();
        const ambs = loadStoredUnits(serviceType);
        ambs.push(created);
        saveStoredUnits(serviceType, ambs);
        return created;
      }
    } catch {}

    const newUnit: AmbulanceUnit = {
      id: unit.id || `unit-${serviceType}-${Date.now().toString().slice(-4)}`,
      hospitalId: unit.hospitalId || FALLBACK_STATIONS.find(s => (s.serviceType || '103') === serviceType)?.id || 'hosp-tash-1',
      serviceType,
      plateNumber: unit.plateNumber || `01 ${serviceType} TAA`,
      lat: unit.lat || 41.2721,
      lon: unit.lon || 69.2155,
      baseLat: unit.lat || 41.2721,
      baseLon: unit.lon || 69.2155,
      status: 'free'
    };
    const ambs = loadStoredUnits(serviceType);
    ambs.push(newUnit);
    saveStoredUnits(serviceType, ambs);
    return newUnit;
  },

  async deleteAmbulance(id: string, serviceType: EmergencyServiceType = '103'): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/units/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const ambs = loadStoredUnits(serviceType).filter(a => a.id !== id);
        saveStoredUnits(serviceType, ambs);
        return true;
      }
    } catch {}

    const ambs = loadStoredUnits(serviceType).filter(a => a.id !== id);
    saveStoredUnits(serviceType, ambs);
    return true;
  },

  async updateLocation(ambulanceId: string, lat: number, lon: number): Promise<AmbulanceUnit> {
    try {
      const res = await fetch(`${API_BASE}/units/${ambulanceId}/location`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ lat, lon })
      });
      if (res.ok) return await res.json();
    } catch {}

    const unit = FALLBACK_UNITS.find(a => a.id === ambulanceId);
    if (unit) {
      unit.lat = lat;
      unit.lon = lon;
      return unit;
    }
    return {} as AmbulanceUnit;
  },

  async fetchHospitals(serviceType: EmergencyServiceType = '103'): Promise<Hospital[]> {
    try {
      const res = await fetch(`${API_BASE}/hospitals?service=${serviceType}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch {}
    return FALLBACK_STATIONS.filter(s => (s.serviceType || '103') === serviceType);
  },

  async fetchUnits(serviceType: EmergencyServiceType = '103'): Promise<AmbulanceUnit[]> {
    try {
      const res = await fetch(`${API_BASE}/units?service=${serviceType}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch {}
    return loadStoredUnits(serviceType);
  },

  async fetchBindings(): Promise<AmbulanceStaffBinding[]> {
    try {
      const res = await fetch(`${API_BASE}/bindings`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async saveBinding(binding: AmbulanceStaffBinding): Promise<AmbulanceStaffBinding> {
    const res = await fetch(`${API_BASE}/bindings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(binding)
    });
    return res.json();
  },

  async deleteBinding(userId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/bindings/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return res.json();
  }
};
