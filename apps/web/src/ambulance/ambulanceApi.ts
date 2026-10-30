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

export const ambulanceApi = {
  async fetchState(): Promise<AmbulanceStatePayload> {
    const res = await fetch(`${API_BASE}/state`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch state: ${res.statusText}`);
    }
    return res.json();
  },

  async fetchStats(): Promise<AmbulanceStats> {
    const res = await fetch(`${API_BASE}/stats`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch stats: ${res.statusText}`);
    }
    return res.json();
  },

  async createRequest(data: {
    lat: number;
    lon: number;
    description: string;
    severity: EmergencySeverity;
    citizenPhone?: string;
  }): Promise<{ request: EmergencyRequest; isDuplicate?: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to submit emergency request');
    }
    return res.json();
  },

  async cancelRequest(id: string): Promise<EmergencyRequest> {
    const res = await fetch(`${API_BASE}/requests/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to cancel request');
    }
    return res.json();
  },

  async acceptRequest(id: string, hospitalId?: string): Promise<EmergencyRequest> {
    const res = await fetch(`${API_BASE}/requests/${id}/accept`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ hospitalId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to accept request');
    }
    return res.json();
  },

  async declineRequest(id: string, hospitalId?: string): Promise<EmergencyRequest> {
    const res = await fetch(`${API_BASE}/requests/${id}/decline`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ hospitalId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to decline request');
    }
    return res.json();
  },

  async driverGo(id: string, ambulanceId?: string): Promise<EmergencyRequest> {
    const res = await fetch(`${API_BASE}/requests/${id}/go`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ambulanceId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to start transit');
    }
    return res.json();
  },

  async driverOnScene(id: string, ambulanceId?: string): Promise<EmergencyRequest> {
    const res = await fetch(`${API_BASE}/requests/${id}/onscene`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ambulanceId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to mark arrival');
    }
    return res.json();
  },

  async driverComplete(id: string, ambulanceId?: string): Promise<EmergencyRequest> {
    const res = await fetch(`${API_BASE}/requests/${id}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ambulanceId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to complete call');
    }
    return res.json();
  },

  async updateLocation(ambulanceId: string, lat: number, lon: number): Promise<AmbulanceUnit> {
    const res = await fetch(`${API_BASE}/units/${ambulanceId}/location`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ lat, lon })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update location');
    }
    return res.json();
  },

  async fetchHospitals(): Promise<Hospital[]> {
    const res = await fetch(`${API_BASE}/hospitals`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async fetchUnits(): Promise<AmbulanceUnit[]> {
    const res = await fetch(`${API_BASE}/units`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async fetchBindings(): Promise<AmbulanceStaffBinding[]> {
    const res = await fetch(`${API_BASE}/bindings`, {
      headers: getAuthHeaders()
    });
    return res.json();
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
