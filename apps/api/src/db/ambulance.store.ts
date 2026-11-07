import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  Hospital,
  AmbulanceUnit,
  AmbulanceStaffBinding,
  EmergencyRequest,
  EmergencySeverity,
  EmergencyRequestStatus,
  AmbulanceStats,
  EmergencyServiceType
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
    // 1. Seed Tashkent & Fergana Stations (103 Medical, 102 Police, 101 Fire, 1050 Rescue)
    const seededHospitals: Hospital[] = [
      // --- 103: Tez Tibbiy Yordam (Medical Hospitals) ---
      {
        id: 'hosp-tash-1',
        name: 'Respublika Shoshilinch Tibbiy Yordam Ilmiy Markazi (16-Gorbolnitsa)',
        type: 'state',
        serviceType: '103',
        lat: 41.2721,
        lon: 69.2155,
        isDemo: true,
        address: "Kichik Xalqa Yo'li 2, Chilonzor, Toshkent"
      },
      {
        id: 'hosp-tash-2',
        name: 'Toshkent shahar 1-son Klinik Shoshilinch Shifoxonasi',
        type: 'state',
        serviceType: '103',
        lat: 41.3340,
        lon: 69.2845,
        isDemo: true,
        address: "Farobiy ko'chasi 2, Olmazor, Toshkent"
      },
      {
        id: 'hosp-tash-3',
        name: 'Toshkent Tibbiyot Akademiyasi Shoshilinch Klinikasi',
        type: 'state',
        serviceType: '103',
        lat: 41.3050,
        lon: 69.3400,
        isDemo: true,
        address: "Farobiy 2, Yashnobod, Toshkent"
      },
      {
        id: 'hosp-tash-4',
        name: 'Shox Med Shoshilinch Tibbiy Yordam (Xususiy)',
        type: 'private',
        serviceType: '103',
        lat: 41.2850,
        lon: 69.2600,
        isDemo: true,
        address: "Oybek 38, Mirobod, Toshkent"
      },

      // --- 102: Ichki Ishlar Organlari (Police & Public Safety) ---
      {
        id: 'dept-tash-102-1',
        name: 'Toshkent shahar IIBB Tezkor Boshqaruv Markazi',
        type: 'state',
        serviceType: '102',
        lat: 41.2985,
        lon: 69.2785,
        isDemo: true,
        address: "Sayilgoh ko'chasi 9, Mirobod, Toshkent"
      },
      {
        id: 'dept-tash-102-2',
        name: 'Chilonzor tumani IIB 2-sonli Ichki Ishlar Bo\'limi',
        type: 'state',
        serviceType: '102',
        lat: 41.2780,
        lon: 69.2080,
        isDemo: true,
        address: "Cho'ponota ko'chasi 42, Chilonzor, Toshkent"
      },
      {
        id: 'dept-tash-102-3',
        name: 'Olmazor tumani IIB Patrul-Post Xizmati Maskani',
        type: 'state',
        serviceType: '102',
        lat: 41.3410,
        lon: 69.2290,
        isDemo: true,
        address: "Kichik Xalqa Yo'li 18, Olmazor, Toshkent"
      },

      // --- 101: Davlat Yong'in Xavfsizligi Xizmati (Fire & Rescue) ---
      {
        id: 'fire-tash-101-1',
        name: 'Toshkent shahar FVB 1-Yong\'in-Qutqaruv Qismi (Chilonzor)',
        type: 'state',
        serviceType: '101',
        lat: 41.2825,
        lon: 69.2190,
        isDemo: true,
        address: "Bunyodkor shoh ko'chasi 15, Chilonzor, Toshkent"
      },
      {
        id: 'fire-tash-101-2',
        name: 'Toshkent shahar FVB 4-Yong\'in-Qutqaruv Qismi (Shayxontohur)',
        type: 'state',
        serviceType: '101',
        lat: 41.3210,
        lon: 69.2450,
        isDemo: true,
        address: "Navoiy ko'chasi 32, Shayxontohur, Toshkent"
      },
      {
        id: 'fire-tash-101-3',
        name: 'Toshkent shahar FVB 7-Yong\'in-Qutqaruv Qismi (Mirobod)',
        type: 'state',
        serviceType: '101',
        lat: 41.2910,
        lon: 69.2820,
        isDemo: true,
        address: "Nukus ko'chasi 71, Mirobod, Toshkent"
      },

      // --- 104: Favqulodda Gaz Xizmati ("Hududgaz Poytaxt" Avariya-Dispetcherlik Xizmati) ---
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
        name: 'Yunusobod Tumani Gaz Ta\'minoti Avariya Xizmati (104 Bo\'limi)',
        type: 'state',
        serviceType: '104',
        lat: 41.3480,
        lon: 69.2860,
        isDemo: true,
        address: "Amir Temur shoh ko'chasi 112, Yunusobod, Toshkent"
      },
      {
        id: 'gas-tash-104-3',
        name: 'Yashnobod va Mirobod Tumanlararo 104 Avariya Guruhi',
        type: 'state',
        serviceType: '104',
        lat: 41.2880,
        lon: 69.3140,
        isDemo: true,
        address: "Farg'ona yo'li ko'chasi 25, Yashnobod, Toshkent"
      },

      // --- 1050: FVV Qutqaruv Xizmati (Disaster & Special Rescue) ---
      {
        id: 'fvv-tash-1050-1',
        name: 'FVV Maxsus Vazifalar Bo\'yicha Respublika Qutqaruv Markazi',
        type: 'state',
        serviceType: '1050',
        lat: 41.2750,
        lon: 69.2310,
        isDemo: true,
        address: "Qatortol ko'chasi 60, Chilonzor, Toshkent"
      },
      {
        id: 'fvv-tash-1050-2',
        name: 'FVV Toshkent Shahar Qutqaruv Otryadi Tezkor Bo\'limi',
        type: 'state',
        serviceType: '1050',
        lat: 41.3280,
        lon: 69.2620,
        isDemo: true,
        address: "Sebzor ko'chasi 21, Olmazor, Toshkent"
      },

      // Fergana Region 103 Medical
      {
        id: 'hosp-ferg-1',
        name: 'Fergana Regional Emergency Medical Center',
        type: 'state',
        serviceType: '103',
        lat: 40.3842,
        lon: 71.7843,
        isDemo: true,
        address: "Al-Farg'oniy ko'chasi 45, Fergana"
      },
      {
        id: 'hosp-ferg-2',
        name: 'Margilan City Emergency Department',
        type: 'state',
        serviceType: '103',
        lat: 40.4722,
        lon: 71.7134,
        isDemo: true,
        address: "Mustaqillik ko'chasi 12, Margilan"
      }
    ];
    seededHospitals.forEach(h => this.hospitals.set(h.id, h));

    // 2. Seed Response Vehicles for each service
    const seededAmbulances: AmbulanceUnit[] = [
      // --- 103 Medical Ambulances ---
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
        lat: 41.2725,
        lon: 69.2160,
        baseLat: 41.2721,
        baseLon: 69.2155,
        status: 'free'
      },
      {
        id: 'amb-tash-201',
        hospitalId: 'hosp-tash-2',
        serviceType: '103',
        plateNumber: '01 201 TBA',
        lat: 41.3340,
        lon: 69.2845,
        baseLat: 41.3340,
        baseLon: 69.2845,
        status: 'free'
      },

      // --- 102 Police Patrol Units (Ichki Ishlar) ---
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
      {
        id: 'pol-tash-103',
        hospitalId: 'dept-tash-102-3',
        serviceType: '102',
        plateNumber: '01 106 PPA',
        lat: 41.3410,
        lon: 69.2290,
        baseLat: 41.3410,
        baseLon: 69.2290,
        status: 'free'
      },

      // --- 101 Fire & Rescue Trucks (Yong'in Xavfsizligi) ---
      {
        id: 'fire-tash-101',
        hospitalId: 'fire-tash-101-1',
        serviceType: '101',
        plateNumber: '01 101 FVV',
        lat: 41.2825,
        lon: 69.2190,
        baseLat: 41.2825,
        baseLon: 69.2190,
        status: 'free'
      },
      {
        id: 'fire-tash-102',
        hospitalId: 'fire-tash-101-2',
        serviceType: '101',
        plateNumber: '01 103 FVV',
        lat: 41.3210,
        lon: 69.2450,
        baseLat: 41.3210,
        baseLon: 69.2450,
        status: 'free'
      },
      {
        id: 'fire-tash-103',
        hospitalId: 'fire-tash-101-3',
        serviceType: '101',
        plateNumber: '01 107 FVV',
        lat: 41.2910,
        lon: 69.2820,
        baseLat: 41.2910,
        baseLon: 69.2820,
        status: 'free'
      },

      // --- 104 Emergency Gas Service Vehicles (Favqulodda Gaz Xizmati) ---
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
      {
        id: 'gas-tash-103',
        hospitalId: 'gas-tash-104-3',
        serviceType: '104',
        plateNumber: '01 106 GAZ',
        lat: 41.2880,
        lon: 69.3140,
        baseLat: 41.2880,
        baseLon: 69.3140,
        status: 'free'
      },

      // --- 1050 Disaster Rescue Vehicles (FVV Maxsus Qutqaruv) ---
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
      },

      // Fergana 103
      {
        id: 'amb-ferg-101',
        hospitalId: 'hosp-ferg-1',
        serviceType: '103',
        plateNumber: '40 101 FAA',
        lat: 40.3842,
        lon: 71.7843,
        baseLat: 40.3842,
        baseLon: 71.7843,
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

    // 103 Staff
    const disp103 = ensureUser('dispatcher@103.uz', 'Dilshod Aliyev (103 Tibbiyot Dispetcheri)');
    const driver103 = ensureUser('driver@103.uz', 'Rustam Qodirov (103 Haydovchi #101)');

    // 102 Staff
    const disp102 = ensureUser('dispatcher@102.uz', 'Otabek Zokirov (102 IIB Navbatchi Dispetcher)');
    const driver102 = ensureUser('driver@102.uz', 'Sherzod Jo\'rayev (102 Patrul Haydovchisi #102)');

    // 101 Staff
    const disp101 = ensureUser('dispatcher@101.uz', 'Jasur Rahimov (101 Yong\'in-Qutqaruv Dispetcheri)');
    const driver101 = ensureUser('driver@101.uz', 'Anvar Karimov (101 O\'t O\'chirish Ekipaji #101)');

    // 104 Staff
    const disp104 = ensureUser('dispatcher@104.uz', 'Sardor Toshmatov (104 Gaz Avariya Dispetcheri)');
    const driver104 = ensureUser('driver@104.uz', 'Ulug\'bek Xolmatov (104 Gaz Avariya Ekipaji #104)');

    // 1050 Staff
    const disp1050 = ensureUser('dispatcher@1050.uz', 'Temur Soliyev (1050 FVV Qutqaruv Dispetcheri)');
    const driver1050 = ensureUser('driver@1050.uz', 'Farhod Nazarov (1050 FVV Qutqaruvchi Haydovchi #1050)');

    // Fergana
    const dispFerg = ensureUser('dispatcher-fergana@103.uz', 'Malika Yusupova (Fergana 103 Dispatcher)');
    const driverFerg = ensureUser('driver-fergana@103.uz', 'Bobur Turgunov (Fergana Ambulance Driver #201)');

    // 4. Bind staff to respective departments and emergency vehicles
    this.bindings.set(disp103.id, {
      userId: disp103.id,
      staffRole: 'DISPATCHER',
      hospitalId: 'hosp-tash-1'
    });
    this.bindings.set(driver103.id, {
      userId: driver103.id,
      staffRole: 'DRIVER',
      hospitalId: 'hosp-tash-1',
      ambulanceId: 'amb-tash-101'
    });

    this.bindings.set(disp102.id, {
      userId: disp102.id,
      staffRole: 'DISPATCHER',
      hospitalId: 'dept-tash-102-1'
    });
    this.bindings.set(driver102.id, {
      userId: driver102.id,
      staffRole: 'DRIVER',
      hospitalId: 'dept-tash-102-1',
      ambulanceId: 'pol-tash-101'
    });

    this.bindings.set(disp101.id, {
      userId: disp101.id,
      staffRole: 'DISPATCHER',
      hospitalId: 'fire-tash-101-1'
    });
    this.bindings.set(driver101.id, {
      userId: driver101.id,
      staffRole: 'DRIVER',
      hospitalId: 'fire-tash-101-1',
      ambulanceId: 'fire-tash-101'
    });

    this.bindings.set(disp104.id, {
      userId: disp104.id,
      staffRole: 'DISPATCHER',
      hospitalId: 'gas-tash-104-1'
    });
    this.bindings.set(driver104.id, {
      userId: driver104.id,
      staffRole: 'DRIVER',
      hospitalId: 'gas-tash-104-1',
      ambulanceId: 'gas-tash-101'
    });

    this.bindings.set(disp1050.id, {
      userId: disp1050.id,
      staffRole: 'DISPATCHER',
      hospitalId: 'fvv-tash-1050-1'
    });
    this.bindings.set(driver1050.id, {
      userId: driver1050.id,
      staffRole: 'DRIVER',
      hospitalId: 'fvv-tash-1050-1',
      ambulanceId: 'res-tash-101'
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
  public getHospitals(serviceType?: EmergencyServiceType): Hospital[] {
    const list = Array.from(this.hospitals.values());
    if (!serviceType) return list;
    return list.filter(h => (h.serviceType || '103') === serviceType);
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
  public getAmbulances(serviceType?: EmergencyServiceType): AmbulanceUnit[] {
    const list = Array.from(this.ambulances.values());
    if (!serviceType) return list;
    return list.filter(a => (a.serviceType || '103') === serviceType);
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

  public getAllRequests(serviceType?: EmergencyServiceType): EmergencyRequest[] {
    const list = Array.from(this.requests.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (!serviceType) return list;
    return list.filter(r => (r.serviceType || '103') === serviceType);
  }

  public getActiveRequestForCitizen(citizenId: string, serviceType?: EmergencyServiceType): EmergencyRequest | undefined {
    return Array.from(this.requests.values()).find(
      r => r.citizenId === citizenId &&
           (!serviceType || (r.serviceType || '103') === serviceType) &&
           !['done', 'cancelled'].includes(r.status)
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

  public findDuplicateRecentRequest(lat: number, lon: number, serviceType: EmergencyServiceType = '103'): EmergencyRequest | undefined {
    const now = Date.now();
    const fiveMinutesMs = 5 * 60 * 1000;
    return Array.from(this.requests.values()).find(r => {
      if ((r.serviceType || '103') !== serviceType) return false;
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
    triedHospitalIds: string[] = [],
    serviceType: EmergencyServiceType = '103'
  ): { hospital: Hospital; distanceKm: number } | null {
    const candidates = Array.from(this.hospitals.values()).filter(
      h => (h.serviceType || '103') === serviceType && !triedHospitalIds.includes(h.id)
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
