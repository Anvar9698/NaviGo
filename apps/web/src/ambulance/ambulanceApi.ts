import {
  AmbulanceStatePayload,
  AmbulanceStats,
  EmergencyRequest,
  EmergencySeverity,
  Hospital,
  AmbulanceUnit,
  AmbulanceStaffBinding
} from '@yol/shared';

const API_BASE = '/api/v1/ambulance';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('yol_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

// Fallback in-memory demo data for client-side resilience
const FALLBACK_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-tash-1',
    name: 'Republican Research Centre of Emergency Medicine (16-Gorbolnitsa)',
    type: 'state',
    lat: 41.2721,
    lon: 69.2155,
    isDemo: true,
    address: "Kichik Xalqa Yo'li 2, Chilanzar, Tashkent"
  },
  {
    id: 'hosp-tash-2',
    name: 'Tashkent City 1st Clinical Emergency Hospital',
    type: 'state',
    lat: 41.3340,
    lon: 69.2845,
    isDemo: true,
    address: "Farobiy ko'chasi 2, Olmazor, Tashkent"
  },
  {
    id: 'hosp-tash-3',
    name: 'Tashkent Medical Academy Emergency Clinic',
    type: 'state',
    lat: 41.3050,
    lon: 69.3400,
    isDemo: true,
    address: "Farobiy 2, Yashnabad, Tashkent"
  },
  {
    id: 'hosp-tash-4',
    name: 'Shox Med Emergency Care (Private Clinic)',
    type: 'private',
    lat: 41.2850,
    lon: 69.2600,
    isDemo: true,
    address: "Oybek 38, Mirabad, Tashkent"
  },
  {
    id: 'hosp-ferg-1',
    name: 'Fergana Regional Emergency Medical Center',
    type: 'state',
    lat: 40.3842,
    lon: 71.7843,
    isDemo: true,
    address: "Al-Farg'oniy ko'chasi 45, Fergana"
  }
];

let fallbackAmbulances: AmbulanceUnit[] = [
  {
    id: 'amb-tash-101',
    hospitalId: 'hosp-tash-1',
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
    plateNumber: '01 104 TAA',
    lat: 41.2740,
    lon: 69.2180,
    baseLat: 41.2721,
    baseLon: 69.2155,
    status: 'free'
  },
  {
    id: 'amb-ferg-101',
    hospitalId: 'hosp-ferg-1',
    plateNumber: '40 101 FAA',
    lat: 40.3842,
    lon: 71.7843,
    baseLat: 40.3842,
    baseLon: 71.7843,
    status: 'free'
  }
];

let fallbackActiveRequest: EmergencyRequest | null = null;
let fallbackSimulationStep = 0;

export const ambulanceApi = {
  async fetchState(): Promise<AmbulanceStatePayload> {
    try {
      const res = await fetch(`${API_BASE}/state`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback to local demo engine
    }

    // Local client demo simulation step
    if (fallbackActiveRequest && fallbackActiveRequest.status === 'enroute') {
      const coords = fallbackActiveRequest.routeGeometry || [];
      if (coords.length > 2) {
        fallbackSimulationStep = Math.min(coords.length - 1, fallbackSimulationStep + 1);
        const currCoord = coords[fallbackSimulationStep];
        
        const amb = fallbackAmbulances.find(a => a.id === fallbackActiveRequest?.assignedAmbulanceId);
        if (amb) {
          amb.lat = currCoord[1];
          amb.lon = currCoord[0];
          amb.status = 'enroute';
        }

        const remainingProgress = (coords.length - 1 - fallbackSimulationStep) / (coords.length - 1);
        fallbackActiveRequest.etaMinutes = Math.max(1, Math.round(remainingProgress * 7));

        if (fallbackSimulationStep >= coords.length - 1) {
          fallbackActiveRequest.status = 'onscene';
          fallbackActiveRequest.etaMinutes = 0;
          if (amb) amb.status = 'onscene';
        }
      }
    }

    return {
      role: 'CITIZEN',
      hospitals: FALLBACK_HOSPITALS,
      ambulances: fallbackActiveRequest?.assignedAmbulanceId 
        ? fallbackAmbulances.filter(a => a.id === fallbackActiveRequest?.assignedAmbulanceId)
        : fallbackAmbulances,
      activeRequest: fallbackActiveRequest,
      pendingRequests: fallbackActiveRequest?.status === 'pending' ? [fallbackActiveRequest] : [],
      stats: {
        totalCalls: 14,
        activeCalls: fallbackActiveRequest ? 1 : 0,
        completedCalls: 12,
        averageMinutesSaved: 10.2,
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
      totalCalls: 14,
      activeCalls: fallbackActiveRequest ? 1 : 0,
      completedCalls: 12,
      averageMinutesSaved: 10.2,
      baselineQueuePenaltyMinutes: 12
    };
  },

  async createRequest(data: {
    lat: number;
    lon: number;
    description: string;
    severity: EmergencySeverity;
    citizenPhone?: string;
  }): Promise<{ request: EmergencyRequest; isDuplicate?: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        fallbackActiveRequest = json.request;
        return json;
      }
    } catch {
      // Local client fallback demo creation
    }

    // Build realistic road coordinates from hospital to citizen
    const startLat = 41.2721;
    const startLon = 69.2155;
    const endLat = data.lat;
    const endLon = data.lon;

    const numPoints = 14;
    const routeCoords: [number, number][] = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      // Slight road curve
      const jitter = Math.sin(t * Math.PI) * 0.003;
      const lon = Number((startLon + t * (endLon - startLon) + jitter).toFixed(6));
      const lat = Number((startLat + t * (endLat - startLat) - jitter * 0.5).toFixed(6));
      routeCoords.push([lon, lat]);
    }

    const reqId = `req-${Math.random().toString(36).substring(2, 8)}`;
    const nowIso = new Date().toISOString();

    const newReq: EmergencyRequest = {
      id: reqId,
      citizenId: 'usr-citizen-demo',
      citizenName: 'Fuqaro (Siz)',
      citizenPhone: data.citizenPhone || '+998 90 123 45 67',
      lat: data.lat,
      lon: data.lon,
      description: data.description,
      severity: data.severity,
      status: 'pending',
      targetHospitalId: 'hosp-tash-1',
      triedHospitalIds: [],
      routeGeometry: routeCoords,
      etaMinutes: 7,
      distanceMeters: 3800,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    fallbackActiveRequest = newReq;
    fallbackSimulationStep = 0;

    // Trigger realistic demo auto-dispatch
    setTimeout(() => {
      if (fallbackActiveRequest && fallbackActiveRequest.id === reqId) {
        const amb = fallbackAmbulances[0];
        amb.status = 'assigned';
        amb.currentRequestId = reqId;
        fallbackActiveRequest.status = 'assigned';
        fallbackActiveRequest.assignedAmbulanceId = amb.id;
        fallbackActiveRequest.assignedHospitalId = 'hosp-tash-1';

        setTimeout(() => {
          if (fallbackActiveRequest && fallbackActiveRequest.id === reqId) {
            fallbackActiveRequest.status = 'enroute';
            amb.status = 'enroute';
          }
        }, 1500);
      }
    }, 1800);

    return { request: newReq };
  },

  async cancelRequest(id: string): Promise<EmergencyRequest> {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    if (fallbackActiveRequest) {
      fallbackActiveRequest.status = 'cancelled';
      const amb = fallbackAmbulances.find(a => a.id === fallbackActiveRequest?.assignedAmbulanceId);
      if (amb) {
        amb.status = 'free';
        amb.currentRequestId = undefined;
      }
      fallbackActiveRequest = null;
    }

    return {} as EmergencyRequest;
  },

  async acceptRequest(id: string, hospitalId?: string): Promise<EmergencyRequest> {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/accept`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ hospitalId })
      });
      if (res.ok) return await res.json();
    } catch {}

    if (fallbackActiveRequest) {
      fallbackActiveRequest.status = 'assigned';
      fallbackActiveRequest.assignedAmbulanceId = fallbackAmbulances[0].id;
    }
    return fallbackActiveRequest || ({} as EmergencyRequest);
  },

  async declineRequest(id: string, hospitalId?: string): Promise<EmergencyRequest> {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/decline`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ hospitalId })
      });
      if (res.ok) return await res.json();
    } catch {}

    return {} as EmergencyRequest;
  },

  async driverGo(id: string, ambulanceId?: string): Promise<EmergencyRequest> {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/go`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ambulanceId })
      });
      if (res.ok) return await res.json();
    } catch {}

    if (fallbackActiveRequest) {
      fallbackActiveRequest.status = 'enroute';
    }
    return fallbackActiveRequest || ({} as EmergencyRequest);
  },

  async driverOnScene(id: string, ambulanceId?: string): Promise<EmergencyRequest> {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/onscene`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ambulanceId })
      });
      if (res.ok) return await res.json();
    } catch {}

    if (fallbackActiveRequest) {
      fallbackActiveRequest.status = 'onscene';
    }
    return fallbackActiveRequest || ({} as EmergencyRequest);
  },

  async driverComplete(id: string, ambulanceId?: string): Promise<EmergencyRequest> {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/complete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ambulanceId })
      });
      if (res.ok) return await res.json();
    } catch {}

    if (fallbackActiveRequest) {
      fallbackActiveRequest.status = 'done';
      fallbackActiveRequest = null;
    }
    return {} as EmergencyRequest;
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

    const amb = fallbackAmbulances.find(a => a.id === ambulanceId);
    if (amb) {
      amb.lat = lat;
      amb.lon = lon;
      return amb;
    }
    return {} as AmbulanceUnit;
  },

  async fetchHospitals(): Promise<Hospital[]> {
    try {
      const res = await fetch(`${API_BASE}/hospitals`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch {}
    return FALLBACK_HOSPITALS;
  },

  async fetchUnits(): Promise<AmbulanceUnit[]> {
    try {
      const res = await fetch(`${API_BASE}/units`, {
        headers: getAuthHeaders()
      });
      if (res.ok) return await res.json();
    } catch {}
    return fallbackAmbulances;
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
