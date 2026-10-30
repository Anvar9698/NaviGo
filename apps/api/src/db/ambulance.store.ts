import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  Hospital,
  AmbulanceUnit,
  AmbulanceStaffBinding,
  EmergencyRequest,
  EmergencySeverity,
  EmergencyRequestStatus,
  AmbulanceStats
} from '@yol/shared';
import { dbStore, calculateHaversineDistanceKm } from './store';
import { CONFIG } from '../config';

class AmbulanceDataStore {
  private hospitals: Map<string, Hospital> = new Map();
  private ambulances: Map<string, AmbulanceUnit> = new Map();
  private requests: Map<string, EmergencyRequest> = new Map();
  private bindings: Map<string, AmbulanceStaffBinding> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Seed Tashkent & Fergana Hospitals
    const seededHospitals: Hospital[] = [
      // Tashkent
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
      // Fergana Region
      {
        id: 'hosp-ferg-1',
        name: 'Fergana Regional Emergency Medical Center',
        type: 'state',
        lat: 40.3842,
        lon: 71.7843,
        isDemo: true,
        address: "Al-Farg'oniy ko'chasi 45, Fergana"
      },
      {
        id: 'hosp-ferg-2',
        name: 'Margilan City Emergency Department',
        type: 'state',
        lat: 40.4722,
        lon: 71.7134,
        isDemo: true,
        address: "Mustaqillik ko'chasi 12, Margilan"
      },
      {
        id: 'hosp-ferg-3',
        name: 'Kokand City Emergency Medical Center',
        type: 'state',
        lat: 40.5283,
        lon: 70.9426,
        isDemo: true,
        address: "Turkiston ko'chasi 28, Kokand"
      },
      {
        id: 'hosp-ferg-4',
        name: 'Quvasoy City Central Hospital',
        type: 'state',
        lat: 40.2974,
        lon: 71.9723,
        isDemo: true,
        address: "Ziyokorlar 5, Quvasoy"
      },
      {
        id: 'hosp-ferg-5',
        name: 'Rishton District Medical Association',
        type: 'state',
        lat: 40.3582,
        lon: 71.2831,
        isDemo: true,
        address: "Farg'ona yo'li 1, Rishton"
      },
      {
        id: 'hosp-ferg-6',
        name: 'Oltiariq District Central Hospital',
        type: 'state',
        lat: 40.4000,
        lon: 71.5000,
        isDemo: true,
        address: "Ipak yo'li 77, Oltiariq"
      },
      {
        id: 'hosp-ferg-7',
        name: 'Fergana Med Line Emergency Clinic (Private)',
        type: 'private',
        lat: 40.3890,
        lon: 71.7780,
        isDemo: true,
        address: "B. Marg'inoniy 15, Fergana"
      }
    ];
    seededHospitals.forEach(h => this.hospitals.set(h.id, h));

    // 2. Seed Ambulances for each hospital
    const seededAmbulances: AmbulanceUnit[] = [
      // Tashkent 1
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
        lat: 41.2725,
        lon: 69.2160,
        baseLat: 41.2721,
        baseLon: 69.2155,
        status: 'free'
      },
      // Tashkent 2
      {
        id: 'amb-tash-201',
        hospitalId: 'hosp-tash-2',
        plateNumber: '01 201 TBA',
        lat: 41.3340,
        lon: 69.2845,
        baseLat: 41.3340,
        baseLon: 69.2845,
        status: 'free'
      },
      {
        id: 'amb-tash-202',
        hospitalId: 'hosp-tash-2',
        plateNumber: '01 202 TBA',
        lat: 41.3342,
        lon: 69.2850,
        baseLat: 41.3340,
        baseLon: 69.2845,
        status: 'free'
      },
      // Tashkent 3
      {
        id: 'amb-tash-301',
        hospitalId: 'hosp-tash-3',
        plateNumber: '01 301 TCA',
        lat: 41.3050,
        lon: 69.3400,
        baseLat: 41.3050,
        baseLon: 69.3400,
        status: 'free'
      },
      // Tashkent 4
      {
        id: 'amb-tash-401',
        hospitalId: 'hosp-tash-4',
        plateNumber: '01 401 TDA',
        lat: 41.2850,
        lon: 69.2600,
        baseLat: 41.2850,
        baseLon: 69.2600,
        status: 'free'
      },
      // Fergana 1
      {
        id: 'amb-ferg-101',
        hospitalId: 'hosp-ferg-1',
        plateNumber: '40 101 FAA',
        lat: 40.3842,
        lon: 71.7843,
        baseLat: 40.3842,
        baseLon: 71.7843,
        status: 'free'
      },
      {
        id: 'amb-ferg-102',
        hospitalId: 'hosp-ferg-1',
        plateNumber: '40 102 FAA',
        lat: 40.3845,
        lon: 71.7848,
        baseLat: 40.3842,
        baseLon: 71.7843,
        status: 'free'
      },
      // Fergana 2
      {
        id: 'amb-ferg-201',
        hospitalId: 'hosp-ferg-2',
        plateNumber: '40 201 FBA',
        lat: 40.4722,
        lon: 71.7134,
        baseLat: 40.4722,
        baseLon: 71.7134,
        status: 'free'
      },
      // Fergana 3
      {
        id: 'amb-ferg-301',
        hospitalId: 'hosp-ferg-3',
        plateNumber: '40 301 FCA',
        lat: 40.5283,
        lon: 70.9426,
        baseLat: 40.5283,
        baseLon: 70.9426,
        status: 'free'
      },
      // Fergana 4
      {
        id: 'amb-ferg-401',
        hospitalId: 'hosp-ferg-4',
        plateNumber: '40 401 FDA',
        lat: 40.2974,
        lon: 71.9723,
        baseLat: 40.2974,
        baseLon: 71.9723,
        status: 'free'
      },
      // Fergana 5
      {
        id: 'amb-ferg-501',
        hospitalId: 'hosp-ferg-5',
        plateNumber: '40 501 FEA',
        lat: 40.3582,
        lon: 71.2831,
        baseLat: 40.3582,
        baseLon: 71.2831,
        status: 'free'
      },
      // Fergana 6
      {
        id: 'amb-ferg-601',
        hospitalId: 'hosp-ferg-6',
        plateNumber: '40 601 FFA',
        lat: 40.4000,
        lon: 71.5000,
        baseLat: 40.4000,
        baseLon: 71.5000,
        status: 'free'
      },
      // Fergana 7
      {
        id: 'amb-ferg-701',
        hospitalId: 'hosp-ferg-7',
        plateNumber: '40 701 FGA',
        lat: 40.3890,
        lon: 71.7780,
        baseLat: 40.3890,
        baseLon: 71.7780,
        status: 'free'
      }
    ];
    seededAmbulances.forEach(a => this.ambulances.set(a.id, a));

    // 3. Seed Demo Staff Users into dbStore
    const salt = bcrypt.genSaltSync(10);
    const defaultHash = bcrypt.hashSync('Password123!', salt);

    const ensureUser = (email: string, name: string) => {
      let u = dbStore.getUserByEmail(email);
      if (!u) {
        u = dbStore.createUser({
          email,
          name,
          passwordHash: defaultHash,
          role: 'USER'
        });
      }
      return u;
    };

    const dispTash = ensureUser('dispatcher@103.uz', 'Dilshod Aliyev (Tashkent 103 Dispatcher)');
    const driverTash = ensureUser('driver@103.uz', 'Rustam Qodirov (Ambulance Driver #101)');
    const dispFerg = ensureUser('dispatcher-fergana@103.uz', 'Malika Yusupova (Fergana 103 Dispatcher)');
    const driverFerg = ensureUser('driver-fergana@103.uz', 'Bobur Turgunov (Fergana Ambulance Driver #201)');

    // 4. Bind staff
    this.bindings.set(dispTash.id, {
      userId: dispTash.id,
      staffRole: 'DISPATCHER',
      hospitalId: 'hosp-tash-1'
    });

    this.bindings.set(driverTash.id, {
      userId: driverTash.id,
      staffRole: 'DRIVER',
      hospitalId: 'hosp-tash-1',
      ambulanceId: 'amb-tash-101'
    });

    this.bindings.set(dispFerg.id, {
      userId: dispFerg.id,
      staffRole: 'DISPATCHER',
      hospitalId: 'hosp-ferg-1'
    });

    this.bindings.set(driverFerg.id, {
      userId: driverFerg.id,
      staffRole: 'DRIVER',
      hospitalId: 'hosp-ferg-1',
      ambulanceId: 'amb-ferg-101'
    });
  }

  // --- Hospital Methods ---
  public getHospitals(): Hospital[] {
    return Array.from(this.hospitals.values());
  }

  public getHospital(id: string): Hospital | undefined {
    return this.hospitals.get(id);
  }

  public upsertHospital(hospital: Hospital): Hospital {
    this.hospitals.set(hospital.id, hospital);
    return hospital;
  }

  public deleteHospital(id: string): boolean {
    return this.hospitals.delete(id);
  }

  // --- Ambulance Methods ---
  public getAmbulances(): AmbulanceUnit[] {
    return Array.from(this.ambulances.values());
  }

  public getAmbulance(id: string): AmbulanceUnit | undefined {
    return this.ambulances.get(id);
  }

  public getAmbulancesByHospital(hospitalId: string): AmbulanceUnit[] {
    return Array.from(this.ambulances.values()).filter(a => a.hospitalId === hospitalId);
  }

  public upsertAmbulance(ambulance: AmbulanceUnit): AmbulanceUnit {
    this.ambulances.set(ambulance.id, ambulance);
    return ambulance;
  }

  public deleteAmbulance(id: string): boolean {
    return this.ambulances.delete(id);
  }

  public updateAmbulanceLocation(id: string, lat: number, lon: number): AmbulanceUnit | undefined {
    const amb = this.ambulances.get(id);
    if (!amb) return undefined;
    amb.lat = lat;
    amb.lon = lon;
    amb.lastLocationUpdate = new Date().toISOString();
    this.ambulances.set(id, amb);
    return amb;
  }

  // --- Staff Binding Methods ---
  public getBindings(): AmbulanceStaffBinding[] {
    return Array.from(this.bindings.values());
  }

  public getBinding(userId: string): AmbulanceStaffBinding | undefined {
    return this.bindings.get(userId);
  }

  public setBinding(binding: AmbulanceStaffBinding): AmbulanceStaffBinding {
    this.bindings.set(binding.userId, binding);
    return binding;
  }

  public deleteBinding(userId: string): boolean {
    return this.bindings.delete(userId);
  }

  // --- Emergency Request Methods ---
  public getRequest(id: string): EmergencyRequest | undefined {
    return this.requests.get(id);
  }

  public getAllRequests(): EmergencyRequest[] {
    return Array.from(this.requests.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getActiveRequestForCitizen(citizenId: string): EmergencyRequest | undefined {
    return Array.from(this.requests.values()).find(
      r => r.citizenId === citizenId && !['done', 'cancelled'].includes(r.status)
    );
  }

  public getPendingRequestsForHospital(hospitalId: string): EmergencyRequest[] {
    return Array.from(this.requests.values()).filter(
      r => r.targetHospitalId === hospitalId && r.status === 'pending'
    );
  }

  public getActiveRequestsForHospital(hospitalId: string): EmergencyRequest[] {
    return Array.from(this.requests.values()).filter(
      r => (r.targetHospitalId === hospitalId || r.assignedHospitalId === hospitalId) &&
           !['done', 'cancelled'].includes(r.status)
    );
  }

  public getAssignedRequestForAmbulance(ambulanceId: string): EmergencyRequest | undefined {
    return Array.from(this.requests.values()).find(
      r => r.assignedAmbulanceId === ambulanceId && !['done', 'cancelled'].includes(r.status)
    );
  }

  public findDuplicateRecentRequest(lat: number, lon: number): EmergencyRequest | undefined {
    const now = Date.now();
    const fiveMinutesMs = 5 * 60 * 1000;
    return Array.from(this.requests.values()).find(r => {
      if (['done', 'cancelled'].includes(r.status)) return false;
      const createdTime = new Date(r.createdAt).getTime();
      if (now - createdTime > fiveMinutesMs) return false;
      const distKm = calculateHaversineDistanceKm(lat, lon, r.lat, r.lon);
      return distKm <= 0.15; // 150 meters
    });
  }

  public findNearestEligibleHospital(
    lat: number,
    lon: number,
    triedHospitalIds: string[] = []
  ): { hospital: Hospital; distanceKm: number } | null {
    const candidates = Array.from(this.hospitals.values()).filter(
      h => !triedHospitalIds.includes(h.id)
    );

    let nearest: { hospital: Hospital; distanceKm: number } | null = null;

    for (const hospital of candidates) {
      // Check if hospital has at least 1 free ambulance
      const freeUnits = this.getAmbulancesByHospital(hospital.id).filter(a => a.status === 'free');
      if (freeUnits.length === 0) continue;

      const distKm = calculateHaversineDistanceKm(lat, lon, hospital.lat, hospital.lon);
      if (!nearest || distKm < nearest.distanceKm) {
        nearest = { hospital, distanceKm: distKm };
      }
    }

    return nearest;
  }

  public saveRequest(request: EmergencyRequest): EmergencyRequest {
    request.updatedAt = new Date().toISOString();
    this.requests.set(request.id, request);
    return request;
  }

  // --- Timer Management for Request Acceptance ---
  public setAcceptTimer(requestId: string, callback: () => void, timeoutMs: number) {
    this.clearAcceptTimer(requestId);
    const timer = setTimeout(callback, timeoutMs);
    if (timer && typeof timer.unref === 'function') {
      timer.unref();
    }
    this.timers.set(requestId, timer);
  }

  public clearAcceptTimer(requestId: string) {
    const existing = this.timers.get(requestId);
    if (existing) {
      clearTimeout(existing);
      this.timers.delete(requestId);
    }
  }

  // --- Retention Purge ---
  public purgeOldRequests(retentionDays: number = 30): number {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    let purgedCount = 0;
    for (const [id, req] of this.requests.entries()) {
      if (['done', 'cancelled'].includes(req.status)) {
        const reqTime = new Date(req.resolvedAt || req.updatedAt).getTime();
        if (reqTime < cutoff) {
          this.requests.delete(id);
          purgedCount++;
        }
      }
    }
    return purgedCount;
  }
}

export const ambulanceStore = new AmbulanceDataStore();
