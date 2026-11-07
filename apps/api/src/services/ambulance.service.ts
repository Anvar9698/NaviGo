import { v4 as uuidv4 } from 'uuid';
import {
  Hospital,
  AmbulanceUnit,
  EmergencyRequest,
  EmergencySeverity,
  AmbulanceStats,
  AmbulanceStatePayload,
  AmbulanceRouteStep,
  RouteStep,
  User,
  EmergencyServiceType,
  MapFeature
} from '@yol/shared';
import { ambulanceStore } from '../db/ambulance.store';
import { dbStore, calculateHaversineDistanceKm } from '../db/store';
import { calculateRoute } from '../providers/routing.provider';
import { CONFIG } from '../config';

// Accumulates step distances along coordinates to position turn steps accurately
export function calculateStepPositions(
  coordinates: [number, number][],
  steps: RouteStep[]
): AmbulanceRouteStep[] {
  if (!coordinates || coordinates.length === 0 || !steps || steps.length === 0) {
    return (steps || []).map(s => ({ ...s }));
  }

  // Precalculate cumulative distances in meters along coordinate segments
  const cumDist: number[] = [0];
  for (let i = 0; i < coordinates.length - 1; i++) {
    const d = calculateHaversineDistanceKm(
      coordinates[i][1], coordinates[i][0],
      coordinates[i + 1][1], coordinates[i + 1][0]
    ) * 1000;
    cumDist.push(cumDist[i] + d);
  }

  let accumulatedMeters = 0;
  return steps.map(step => {
    const targetMeters = accumulatedMeters;
    accumulatedMeters += step.distanceMeters;

    // Find coordinate point matching targetMeters
    let assignedCoord: [number, number] = coordinates[0];
    for (let j = 0; j < cumDist.length - 1; j++) {
      if (targetMeters >= cumDist[j] && targetMeters <= cumDist[j + 1]) {
        const segLen = cumDist[j + 1] - cumDist[j];
        if (segLen > 0) {
          const t = (targetMeters - cumDist[j]) / segLen;
          const lon = coordinates[j][0] + t * (coordinates[j + 1][0] - coordinates[j][0]);
          const lat = coordinates[j][1] + t * (coordinates[j + 1][1] - coordinates[j][1]);
          assignedCoord = [Number(lon.toFixed(6)), Number(lat.toFixed(6))];
        } else {
          assignedCoord = coordinates[j];
        }
        break;
      } else if (targetMeters > cumDist[cumDist.length - 1]) {
        assignedCoord = coordinates[coordinates.length - 1];
      }
    }

    return {
      ...step,
      coordinate: assignedCoord
    };
  });
}

// Smoothly interpolates coordinates so emergency routes have plenty of waypoints for steady real-time driving
export function interpolateRouteCoordinates(coords: [number, number][], targetPoints = 42): [number, number][] {
  if (!coords || coords.length === 0) return coords;
  if (coords.length >= targetPoints || coords.length < 2) return coords;

  const result: [number, number][] = [];
  const segments = coords.length - 1;
  const extraPointsNeeded = targetPoints - coords.length;
  const pointsPerSegment = Math.ceil(extraPointsNeeded / segments);

  for (let i = 0; i < segments; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    result.push([Number(p1[0].toFixed(6)), Number(p1[1].toFixed(6))]);

    for (let step = 1; step <= pointsPerSegment; step++) {
      if (result.length >= targetPoints - (segments - i)) break;
      const t = step / (pointsPerSegment + 1);
      const lon = p1[0] + (p2[0] - p1[0]) * t;
      const lat = p1[1] + (p2[1] - p1[1]) * t;
      result.push([Number(lon.toFixed(6)), Number(lat.toFixed(6))]);
    }
  }
  const last = coords[coords.length - 1];
  result.push([Number(last[0].toFixed(6)), Number(last[1].toFixed(6))]);
  return result;
}

function distancePointToSegmentKm(
  pLat: number,
  pLon: number,
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number
): number {
  const cosLat = Math.cos(((aLat + bLat) / 2) * (Math.PI / 180));
  const px = (pLon - aLon) * cosLat * 111.32;
  const py = (pLat - aLat) * 111.32;
  const bx = (bLon - aLon) * cosLat * 111.32;
  const by = (bLat - aLat) * 111.32;

  const segLenSq = bx * bx + by * by;
  if (segLenSq === 0) {
    return Math.sqrt(px * px + py * py);
  }
  const t = Math.max(0, Math.min(1, (px * bx + py * by) / segLenSq));
  const projX = t * bx;
  const projY = t * by;
  return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}

export function analyzeEmergencyRouteCorridor(coordinates: [number, number][]): {
  routeIncidents: MapFeature[];
  hazardWarnings: string[];
  trafficDelayMinutes: number;
} {
  if (!coordinates || coordinates.length === 0) {
    return { routeIncidents: [], hazardWarnings: [], trafficDelayMinutes: 5 };
  }

  const activeFeatures = dbStore.getActiveMapFeatures();
  const scored: { feature: MapFeature; minDistKm: number }[] = [];

  for (const feature of activeFeatures) {
    if (!['traffic', 'roadwork', 'accident', 'closure', 'hazard'].includes(feature.featureType)) {
      continue;
    }

    let minDistKm = Infinity;
    if (coordinates.length === 1) {
      minDistKm = calculateHaversineDistanceKm(
        feature.latitude,
        feature.longitude,
        coordinates[0][1],
        coordinates[0][0]
      );
    } else {
      for (let i = 0; i < coordinates.length - 1; i++) {
        const d = distancePointToSegmentKm(
          feature.latitude,
          feature.longitude,
          coordinates[i][1],
          coordinates[i][0],
          coordinates[i + 1][1],
          coordinates[i + 1][0]
        );
        if (d < minDistKm) minDistKm = d;
      }
    }

    scored.push({ feature, minDistKm });
  }

  scored.sort((a, b) => a.minDistKm - b.minDistKm);

  // Pick all incidents within 2.2 km of the emergency route corridor; if fewer than 2, include closest city incidents within 7 km
  let matched = scored.filter(s => s.minDistKm <= 2.2).map(s => s.feature);
  if (matched.length < 2) {
    const fallback = scored.filter(s => s.minDistKm <= 7.5).slice(0, 3).map(s => s.feature);
    const seen = new Set(matched.map(m => m.id));
    for (const f of fallback) {
      if (!seen.has(f.id)) {
        matched.push(f);
        seen.add(f.id);
      }
      if (matched.length >= 3) break;
    }
  }

  const typeLabelUz: Record<string, string> = {
    traffic: 'Tirbandlik',
    roadwork: "Yo'l ta'miri",
    accident: 'YTH / Avtohalokat',
    closure: "Yopiq yo'l",
    hazard: "Xavfli to'siq"
  };

  let trafficDelayMinutes = 4;
  const warnings: string[] = matched.map(f => {
    if (f.featureType === 'traffic') trafficDelayMinutes += f.severity === 'high' || f.severity === 'urgent' ? 5 : 3;
    else if (f.featureType === 'closure' || f.featureType === 'accident') trafficDelayMinutes += 4;
    else trafficDelayMinutes += 2;

    const label = typeLabelUz[f.featureType] || f.featureType;
    return `${label}: ${f.title} — ${f.description}`;
  });

  return {
    routeIncidents: matched,
    hazardWarnings: warnings,
    trafficDelayMinutes: Math.min(18, Math.max(4, trafficDelayMinutes))
  };
}

// Checks if any active road hazards (closures, roadwork, accidents, traffic) lie along route
export function checkRouteHazards(coordinates: [number, number][]): string[] {
  return analyzeEmergencyRouteCorridor(coordinates).hazardWarnings;
}

class AmbulanceService {
  private manualDriverOverrides: Set<string> = new Set();
  private simulationInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startSimulationLoop();
  }

  private async buildEmergencyRouteTelemetry(
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number,
    serviceType: EmergencyServiceType = '103'
  ) {
    let bestRoute: any = null;
    try {
      bestRoute = await calculateRoute(startLat, startLon, endLat, endLon, 'car');
    } catch {
      const crowDistKm = Math.max(2.5, calculateHaversineDistanceKm(startLat, startLon, endLat, endLon));
      const estSec = Math.round((crowDistKm / 42) * 3600);
      bestRoute = {
        distanceMeters: Math.round(crowDistKm * 1000),
        durationMinutes: Math.max(4, Math.round(estSec / 60)),
        coordinates: [
          [startLon, startLat],
          [(startLon * 2 + endLon) / 3, (startLat * 2 + endLat) / 3],
          [(startLon + endLon * 2) / 3, (startLat + endLat * 2) / 3],
          [endLon, endLat]
        ],
        steps: [],
        warnings: []
      };
    }

    bestRoute.coordinates = interpolateRouteCoordinates(bestRoute.coordinates, 42);

    const stationPrefix =
      serviceType === '102' ? 'IIB navbatchilik qismidan' :
      serviceType === '101' ? "Yong'in-qutqaruv qismidan" :
      serviceType === '104' ? '104 Gaz avariya markazidan' :
      serviceType === '1050' ? 'FVV qutqaruv markazidan' :
      'Shoshilinch shifoxonadan';

    if (!bestRoute.steps || bestRoute.steps.length < 3) {
      bestRoute.steps = [
        {
          instruction: `${stationPrefix} asosiy shoh ko'cha bo'ylab harakatlaning`,
          distanceMeters: Math.round((bestRoute.distanceMeters || 3500) * 0.3),
          durationSeconds: Math.round((bestRoute.durationMinutes || 6) * 60 * 0.3),
          maneuverType: 'straight'
        },
        {
          instruction: "Yashil yo'lak orqali chorrahadan o'ngga buriling",
          distanceMeters: Math.round((bestRoute.distanceMeters || 3500) * 0.4),
          durationSeconds: Math.round((bestRoute.durationMinutes || 6) * 60 * 0.4),
          maneuverType: 'turn-right'
        },
        {
          instruction: "Chaqiruv manziliga chapga buriling va to'xtang",
          distanceMeters: Math.round((bestRoute.distanceMeters || 3500) * 0.3),
          durationSeconds: Math.round((bestRoute.durationMinutes || 6) * 60 * 0.3),
          maneuverType: 'turn-left'
        }
      ];
    }

    const stepsWithCoords = calculateStepPositions(bestRoute.coordinates, bestRoute.steps);
    const corridor = analyzeEmergencyRouteCorridor(bestRoute.coordinates);
    // Priority emergency response saves ~25-30% travel time compared to regular congested traffic
    const rawMinutes = bestRoute.durationMinutes || 6;
    const emergencyEtaMinutes = Math.max(3, Math.round(rawMinutes * 0.78));

    return {
      coordinates: bestRoute.coordinates as [number, number][],
      steps: stepsWithCoords,
      distanceMeters: bestRoute.distanceMeters || 3800,
      etaMinutes: emergencyEtaMinutes,
      routeIncidents: corridor.routeIncidents,
      hazardWarnings: corridor.hazardWarnings,
      trafficDelayMinutes: corridor.trafficDelayMinutes
    };
  }

  // --- Dispatch Flow Methods ---

  public async createEmergencyRequest(data: {
    serviceType?: EmergencyServiceType;
    citizenId: string;
    citizenName: string;
    citizenPhone?: string;
    lat: number;
    lon: number;
    description: string;
    severity: EmergencySeverity;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    autoDispatchDemo?: boolean;
  }): Promise<{ request: EmergencyRequest; isDuplicate?: boolean; message?: string }> {
    const serviceType = data.serviceType || '103';

    // If identical call is already pending at this exact spot, return it; otherwise create fresh real call
    const duplicate = ambulanceStore.findDuplicateRecentRequest(data.lat, data.lon, serviceType);
    if (duplicate && duplicate.status === 'pending') {
      return {
        request: duplicate,
        isDuplicate: true,
        message: 'Ushbu manzil bo\'yicha chaqiruv allaqachon dispetcher navbatida turibdi.'
      };
    }

    // Reset previous demo request if any to allow seamless fresh demo replay
    const prevDemo = ambulanceStore.getActiveRequestForCitizen(data.citizenId, serviceType);
    if (prevDemo) {
      try {
        this.cancelEmergencyRequest(prevDemo.id, data.citizenId);
      } catch (e) {}
    }

    // Find nearest station with at least one free unit of this service type
    const nearest = ambulanceStore.findNearestEligibleHospital(data.lat, data.lon, [], serviceType);

    const id = `req-${uuidv4().slice(0, 8)}`;
    const nowIso = new Date().toISOString();

    if (!nearest) {
      // No station has a free unit
      const unassignedReq: EmergencyRequest = {
        id,
        serviceType,
        citizenId: data.citizenId,
        citizenName: data.citizenName,
        citizenPhone: data.citizenPhone,
        lat: data.lat,
        lon: data.lon,
        description: data.description,
        severity: data.severity,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        status: 'unassigned',
        triedHospitalIds: [],
        createdAt: nowIso,
        updatedAt: nowIso
      };

      ambulanceStore.saveRequest(unassignedReq);

      dbStore.appendAudit({
        id: uuidv4(),
        actorId: data.citizenId,
        actorEmail: data.citizenName,
        actorRole: 'USER',
        action: 'EMERGENCY_REQUEST_UNASSIGNED',
        entityType: 'EMERGENCY_REQUEST',
        entityId: id,
        details: `Emergency request ${id} (${serviceType}) created. No units currently free.`,
        timestamp: nowIso
      });

      return {
        request: unassignedReq,
        message: `Hozirda barcha ${serviceType} navbatchi ekipajlari band. Iltimos zudlik bilan ${serviceType} raqamiga qo'ng'iroq qiling.`
      };
    }

    const timeoutMs = CONFIG.ambulance.acceptTimeoutSeconds * 1000;
    const timeoutAt = new Date(Date.now() + timeoutMs).toISOString();

    const previewUnit = ambulanceStore
      .getAmbulancesByHospital(nearest.hospital.id)
      .find(a => a.status === 'free');
    const startLat = previewUnit ? previewUnit.lat : nearest.hospital.lat;
    const startLon = previewUnit ? previewUnit.lon : nearest.hospital.lon;
    const routeTelemetry = await this.buildEmergencyRouteTelemetry(
      startLat,
      startLon,
      data.lat,
      data.lon,
      serviceType
    );

    const newReq: EmergencyRequest = {
      id,
      serviceType,
      citizenId: data.citizenId,
      citizenName: data.citizenName,
      citizenPhone: data.citizenPhone,
      lat: data.lat,
      lon: data.lon,
      description: data.description,
      severity: data.severity,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      status: 'pending',
      targetHospitalId: nearest.hospital.id,
      triedHospitalIds: [],
      routeGeometry: routeTelemetry.coordinates,
      routeSteps: routeTelemetry.steps,
      etaMinutes: routeTelemetry.etaMinutes,
      distanceMeters: routeTelemetry.distanceMeters,
      routeIncidents: routeTelemetry.routeIncidents,
      hazardWarnings: routeTelemetry.hazardWarnings,
      trafficDelayMinutes: routeTelemetry.trafficDelayMinutes,
      minutesSaved: routeTelemetry.trafficDelayMinutes,
      timeoutAt,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    ambulanceStore.saveRequest(newReq);

    // Schedule acceptance timer
    ambulanceStore.setAcceptTimer(id, () => {
      this.handleAcceptTimeout(id);
    }, timeoutMs);

    // Demo automated dispatch simulation:
    // 1. Dispatcher automatically accepts after 2 seconds
    // 2. Driver automatically starts journey ("GO") after 1.5 seconds
    // 3. Ambulance moves along real road route to the patient
    if (data.autoDispatchDemo) {
      const autoAcceptTimer = setTimeout(async () => {
        try {
          const reqCheck = ambulanceStore.getRequest(id);
          if (reqCheck && reqCheck.status === 'pending') {
            const accepted = await this.acceptEmergencyRequest(id, nearest.hospital.id, 'usr-disp-1');
            if (accepted && accepted.assignedAmbulanceId) {
              const autoGoTimer = setTimeout(() => {
                try {
                  const reqCheck2 = ambulanceStore.getRequest(id);
                  if (reqCheck2 && reqCheck2.status === 'assigned') {
                    this.driverGo(id, accepted.assignedAmbulanceId!, 'usr-driver-1');
                  }
                } catch (e) {}
              }, 1500);
              if (autoGoTimer && typeof autoGoTimer.unref === 'function') autoGoTimer.unref();
            }
          }
        } catch (e) {}
      }, 2000);
      if (autoAcceptTimer && typeof autoAcceptTimer.unref === 'function') autoAcceptTimer.unref();
    }

    dbStore.appendAudit({
      id: uuidv4(),
      actorId: data.citizenId,
      actorEmail: data.citizenName,
      actorRole: 'USER',
      action: 'EMERGENCY_REQUEST_CREATED',
      entityType: 'EMERGENCY_REQUEST',
      entityId: id,
      details: `Emergency request ${id} created with severity ${data.severity}, routed to hospital ${nearest.hospital.name}.`,
      timestamp: nowIso
    });

    return { request: newReq };
  }

  public async acceptEmergencyRequest(
    requestId: string,
    hospitalId: string,
    dispatcherUserId: string,
    preferredAmbulanceId?: string
  ): Promise<EmergencyRequest> {
    const req = ambulanceStore.getRequest(requestId);
    if (!req) {
      throw new Error('Request not found');
    }
    if (req.status !== 'pending') {
      return req; // idempotent
    }

    ambulanceStore.clearAcceptTimer(requestId);

    // If dispatcher explicitly chose a free ambulance, honor that selection
    let bestUnit: AmbulanceUnit | undefined;
    if (preferredAmbulanceId) {
      const match = ambulanceStore.getAmbulance(preferredAmbulanceId);
      if (match && match.status === 'free') {
        bestUnit = match;
        hospitalId = match.hospitalId;
        req.targetHospitalId = match.hospitalId;
      }
    }

    if (!bestUnit) {
      // Get free ambulances of this hospital
      const freeUnits = ambulanceStore.getAmbulancesByHospital(hospitalId)
        .filter(a => a.status === 'free')
        .map(unit => ({
          unit,
          crowDistKm: calculateHaversineDistanceKm(unit.lat, unit.lon, req.lat, req.lon)
        }))
        .sort((a, b) => a.crowDistKm - b.crowDistKm);

      if (freeUnits.length > 0) {
        bestUnit = freeUnits[0].unit;
      } else {
        // Fallback across any free unit of the same serviceType in the city
        const reqService = req.serviceType || '103';
        const anyFree = ambulanceStore.getAmbulances(reqService)
          .filter(a => a.status === 'free')
          .map(unit => ({
            unit,
            crowDistKm: calculateHaversineDistanceKm(unit.lat, unit.lon, req.lat, req.lon)
          }))
          .sort((a, b) => a.crowDistKm - b.crowDistKm);

        if (anyFree.length > 0) {
          bestUnit = anyFree[0].unit;
          hospitalId = bestUnit.hospitalId;
          req.targetHospitalId = bestUnit.hospitalId;
        } else {
          return this.declineEmergencyRequest(requestId, hospitalId, dispatcherUserId);
        }
      }
    }

    // Ensure unit has a realistic starting location at the hospital base if it was previously at destination
    const currentDistKm = calculateHaversineDistanceKm(bestUnit.lat, bestUnit.lon, req.lat, req.lon);
    if (currentDistKm < 0.8) {
      const hosp = ambulanceStore.getHospital(bestUnit.hospitalId) || ambulanceStore.getHospitals(req.serviceType || '103')[0];
      if (hosp) {
        bestUnit.lat = hosp.lat;
        bestUnit.lon = hosp.lon;
      }
    }

    const routeTelemetry = await this.buildEmergencyRouteTelemetry(
      bestUnit.lat,
      bestUnit.lon,
      req.lat,
      req.lon,
      req.serviceType || '103'
    );

    // Assign unit
    bestUnit.status = 'assigned';
    bestUnit.currentRequestId = req.id;
    ambulanceStore.upsertAmbulance(bestUnit);

    // Update request
    req.status = 'assigned';
    req.assignedAmbulanceId = bestUnit.id;
    req.assignedHospitalId = hospitalId;
    req.routeGeometry = routeTelemetry.coordinates;
    req.routeSteps = routeTelemetry.steps;
    req.etaMinutes = routeTelemetry.etaMinutes;
    req.distanceMeters = routeTelemetry.distanceMeters;
    req.routeIncidents = routeTelemetry.routeIncidents;
    req.hazardWarnings = routeTelemetry.hazardWarnings;
    req.trafficDelayMinutes = routeTelemetry.trafficDelayMinutes;
    req.minutesSaved = routeTelemetry.trafficDelayMinutes;
    req.timeoutAt = undefined;

    ambulanceStore.saveRequest(req);

    const dispatcherUser = dbStore.getUserById(dispatcherUserId);
    dbStore.appendAudit({
      id: uuidv4(),
      actorId: dispatcherUserId,
      actorEmail: dispatcherUser?.email || 'dispatcher@103.uz',
      actorRole: 'USER',
      action: 'DISPATCHER_ACCEPT',
      entityType: 'EMERGENCY_REQUEST',
      entityId: req.id,
      details: `Dispatcher accepted request ${req.id}. Assigned fastest ambulance ${bestUnit.plateNumber} (ETA ${req.etaMinutes}m).`,
      timestamp: new Date().toISOString()
    });

    return req;
  }

  public async declineEmergencyRequest(
    requestId: string,
    hospitalId: string,
    dispatcherUserId: string
  ): Promise<EmergencyRequest> {
    const req = ambulanceStore.getRequest(requestId);
    if (!req || req.status !== 'pending') {
      return req || ({} as EmergencyRequest);
    }

    ambulanceStore.clearAcceptTimer(requestId);

    if (!req.triedHospitalIds.includes(hospitalId)) {
      req.triedHospitalIds.push(hospitalId);
    }

    // Forward to next nearest hospital with a free unit of the same serviceType
    const nextHospital = ambulanceStore.findNearestEligibleHospital(req.lat, req.lon, req.triedHospitalIds, req.serviceType || '103');

    const nowIso = new Date().toISOString();

    if (nextHospital) {
      const timeoutMs = CONFIG.ambulance.acceptTimeoutSeconds * 1000;
      req.targetHospitalId = nextHospital.hospital.id;
      req.timeoutAt = new Date(Date.now() + timeoutMs).toISOString();

      ambulanceStore.setAcceptTimer(requestId, () => {
        this.handleAcceptTimeout(requestId);
      }, timeoutMs);

      ambulanceStore.saveRequest(req);

      dbStore.appendAudit({
        id: uuidv4(),
        actorId: dispatcherUserId,
        actorEmail: dbStore.getUserById(dispatcherUserId)?.email || 'dispatcher@103.uz',
        actorRole: 'USER',
        action: 'DISPATCHER_DECLINE',
        entityType: 'EMERGENCY_REQUEST',
        entityId: req.id,
        details: `Declined by hospital ${hospitalId}. Forwarded to next hospital ${nextHospital.hospital.name}.`,
        timestamp: nowIso
      });
    } else {
      req.status = 'unassigned';
      req.targetHospitalId = undefined;
      req.timeoutAt = undefined;
      ambulanceStore.saveRequest(req);

      dbStore.appendAudit({
        id: uuidv4(),
        actorId: dispatcherUserId,
        actorEmail: dbStore.getUserById(dispatcherUserId)?.email || 'dispatcher@103.uz',
        actorRole: 'USER',
        action: 'DISPATCHER_DECLINE_UNASSIGNED',
        entityType: 'EMERGENCY_REQUEST',
        entityId: req.id,
        details: `Declined by hospital ${hospitalId}. No further hospitals with free ambulances available.`,
        timestamp: nowIso
      });
    }

    return req;
  }

  public handleAcceptTimeout(requestId: string): void {
    const req = ambulanceStore.getRequest(requestId);
    if (!req || req.status !== 'pending') return;

    const currentHospitalId = req.targetHospitalId;
    if (currentHospitalId && !req.triedHospitalIds.includes(currentHospitalId)) {
      req.triedHospitalIds.push(currentHospitalId);
    }

    const nextHospital = ambulanceStore.findNearestEligibleHospital(req.lat, req.lon, req.triedHospitalIds, req.serviceType || '103');
    const nowIso = new Date().toISOString();

    if (nextHospital) {
      const timeoutMs = CONFIG.ambulance.acceptTimeoutSeconds * 1000;
      req.targetHospitalId = nextHospital.hospital.id;
      req.timeoutAt = new Date(Date.now() + timeoutMs).toISOString();

      ambulanceStore.setAcceptTimer(requestId, () => {
        this.handleAcceptTimeout(requestId);
      }, timeoutMs);

      ambulanceStore.saveRequest(req);

      dbStore.appendAudit({
        id: uuidv4(),
        actorId: 'system-timer',
        actorEmail: 'system@103.uz',
        actorRole: 'ADMIN',
        action: 'DISPATCH_TIMEOUT_FORWARDED',
        entityType: 'EMERGENCY_REQUEST',
        entityId: req.id,
        details: `Acceptance timed out for hospital ${currentHospitalId}. Forwarded to ${nextHospital.hospital.name}.`,
        timestamp: nowIso
      });
    } else {
      req.status = 'unassigned';
      req.targetHospitalId = undefined;
      req.timeoutAt = undefined;
      ambulanceStore.saveRequest(req);

      dbStore.appendAudit({
        id: uuidv4(),
        actorId: 'system-timer',
        actorEmail: 'system@103.uz',
        actorRole: 'ADMIN',
        action: 'DISPATCH_TIMEOUT_UNASSIGNED',
        entityType: 'EMERGENCY_REQUEST',
        entityId: req.id,
        details: `Acceptance timed out. No remaining hospitals with free units.`,
        timestamp: nowIso
      });
    }
  }

  public driverGo(requestId: string, ambulanceId?: string, driverUserId?: string): EmergencyRequest {
    const req = ambulanceStore.getRequest(requestId);
    if (!req) throw new Error('Request not found');
    const finalAmbId = ambulanceId || req.assignedAmbulanceId || 'amb-tash-101';

    req.status = 'enroute';
    req.assignedAmbulanceId = finalAmbId;
    ambulanceStore.saveRequest(req);

    const unit = ambulanceStore.getAmbulance(finalAmbId);
    if (unit) {
      unit.status = 'enroute';
      unit.currentRequestId = req.id;
      // Guarantee ambulance starts at the beginning coordinate of the road route
      if (req.routeGeometry && req.routeGeometry.length > 0) {
        unit.lon = req.routeGeometry[0][0];
        unit.lat = req.routeGeometry[0][1];
      }
      ambulanceStore.upsertAmbulance(unit);
    }

    dbStore.appendAudit({
      id: uuidv4(),
      actorId: driverUserId || 'driver-sys',
      actorEmail: (driverUserId && dbStore.getUserById(driverUserId)?.email) || 'driver@103.uz',
      actorRole: 'USER',
      action: 'DRIVER_GO',
      entityType: 'EMERGENCY_REQUEST',
      entityId: req.id,
      details: `Ambulance ${unit?.plateNumber || finalAmbId} enroute to emergency scene.`,
      timestamp: new Date().toISOString()
    });

    return req;
  }

  public driverOnScene(requestId: string, ambulanceId?: string, driverUserId?: string): EmergencyRequest {
    const req = ambulanceStore.getRequest(requestId);
    if (!req) throw new Error('Request not found');
    const finalAmbId = ambulanceId || req.assignedAmbulanceId || 'amb-tash-101';

    req.status = 'onscene';
    req.etaMinutes = 0;
    req.assignedAmbulanceId = finalAmbId;
    ambulanceStore.saveRequest(req);

    const unit = ambulanceStore.getAmbulance(finalAmbId);
    if (unit) {
      unit.status = 'onscene';
      unit.currentRequestId = req.id;
      ambulanceStore.upsertAmbulance(unit);
    }

    dbStore.appendAudit({
      id: uuidv4(),
      actorId: driverUserId || 'driver-sys',
      actorEmail: (driverUserId && dbStore.getUserById(driverUserId)?.email) || 'driver@103.uz',
      actorRole: 'USER',
      action: 'DRIVER_ONSCENE',
      entityType: 'EMERGENCY_REQUEST',
      entityId: req.id,
      details: `Ambulance ${unit?.plateNumber || finalAmbId} arrived on scene.`,
      timestamp: new Date().toISOString()
    });

    return req;
  }

  public driverComplete(requestId: string, ambulanceId?: string, driverUserId?: string): EmergencyRequest {
    const req = ambulanceStore.getRequest(requestId);
    if (!req) throw new Error('Request not found');
    const finalAmbId = ambulanceId || req.assignedAmbulanceId || 'amb-tash-101';

    const nowIso = new Date().toISOString();
    req.status = 'done';
    req.resolvedAt = nowIso;
    req.etaMinutes = 0;

    // Calculate baseline minutes saved vs legacy single-hospital queue penalty
    const actualElapsedMinutes = Math.max(
      1,
      Math.round((Date.now() - new Date(req.createdAt).getTime()) / 60000)
    );
    const queuePenaltyMinutes = Math.round(CONFIG.ambulance.queuePenaltySeconds / 60); // default 12 mins
    const baselineMinutes = (req.etaMinutes || 10) + queuePenaltyMinutes;
    const minutesSaved = Math.max(1, baselineMinutes - actualElapsedMinutes);
    req.minutesSaved = minutesSaved;

    ambulanceStore.saveRequest(req);

    // Free the ambulance and return to base hospital station
    const unit = ambulanceStore.getAmbulance(finalAmbId);
    if (unit) {
      unit.status = 'free';
      unit.currentRequestId = undefined;
      const hosp = ambulanceStore.getHospital(unit.hospitalId);
      if (hosp) {
        unit.lat = hosp.lat;
        unit.lon = hosp.lon;
      }
      ambulanceStore.upsertAmbulance(unit);
      this.manualDriverOverrides.delete(finalAmbId);
    }

    dbStore.appendAudit({
      id: uuidv4(),
      actorId: driverUserId || 'driver-sys',
      actorEmail: (driverUserId && dbStore.getUserById(driverUserId)?.email) || 'driver@103.uz',
      actorRole: 'USER',
      action: 'EMERGENCY_REQUEST_DONE',
      entityType: 'EMERGENCY_REQUEST',
      entityId: req.id,
      details: `Emergency call ${req.id} completed. Minutes saved vs baseline: ${minutesSaved}m.`,
      timestamp: nowIso
    });

    return req;
  }

  public cancelEmergencyRequest(requestId: string, userId: string): EmergencyRequest {
    const req = ambulanceStore.getRequest(requestId);
    if (!req) throw new Error('Request not found');
    if (['done', 'cancelled'].includes(req.status)) return req;

    ambulanceStore.clearAcceptTimer(requestId);

    // Release ambulance if assigned and return to base hospital station
    if (req.assignedAmbulanceId) {
      const unit = ambulanceStore.getAmbulance(req.assignedAmbulanceId);
      if (unit) {
        unit.status = 'free';
        unit.currentRequestId = undefined;
        const hosp = ambulanceStore.getHospital(unit.hospitalId);
        if (hosp) {
          unit.lat = hosp.lat;
          unit.lon = hosp.lon;
        }
        ambulanceStore.upsertAmbulance(unit);
        this.manualDriverOverrides.delete(req.assignedAmbulanceId);
      }
    }

    req.status = 'cancelled';
    req.resolvedAt = new Date().toISOString();
    ambulanceStore.saveRequest(req);

    dbStore.appendAudit({
      id: uuidv4(),
      actorId: userId,
      actorEmail: dbStore.getUserById(userId)?.email || 'citizen@yol.uz',
      actorRole: 'USER',
      action: 'EMERGENCY_REQUEST_CANCELLED',
      entityType: 'EMERGENCY_REQUEST',
      entityId: req.id,
      details: `Emergency request ${req.id} was cancelled by user.`,
      timestamp: new Date().toISOString()
    });

    return req;
  }

  public updateAmbulanceGps(ambulanceId: string, lat: number, lon: number): AmbulanceUnit {
    this.manualDriverOverrides.add(ambulanceId);
    const unit = ambulanceStore.updateAmbulanceLocation(ambulanceId, lat, lon);
    if (!unit) throw new Error('Ambulance not found');
    return unit;
  }

  // --- Statistics & Aggregation ---

  public getStats(serviceType?: EmergencyServiceType): AmbulanceStats {
    const all = ambulanceStore.getAllRequests(serviceType);
    const completed = all.filter(r => r.status === 'done' && typeof r.minutesSaved === 'number');
    const totalMinutesSaved = completed.reduce((acc, r) => acc + (r.minutesSaved || 0), 0);
    const avgMinutesSaved = completed.length > 0 ? Math.round((totalMinutesSaved / completed.length) * 10) / 10 : 9.5;

    return {
      totalCalls: all.length,
      activeCalls: all.filter(r => ['pending', 'assigned', 'enroute', 'onscene'].includes(r.status)).length,
      completedCalls: completed.length,
      averageMinutesSaved: avgMinutesSaved,
      baselineQueuePenaltyMinutes: Math.round(CONFIG.ambulance.queuePenaltySeconds / 60)
    };
  }

  // --- Role-Tailored State Generation ---

  public getStateForUser(user?: User | null, requestedService?: EmergencyServiceType): AmbulanceStatePayload {
    const nowIso = new Date().toISOString();

    const validServices: EmergencyServiceType[] = ['103', '102', '101', '104', '1050'];
    let activeService: EmergencyServiceType =
      requestedService && validServices.includes(requestedService) ? requestedService : '103';

    if (!requestedService && user?.email) {
      if (user.email.includes('1050')) activeService = '1050';
      else if (user.email.includes('104')) activeService = '104';
      else if (user.email.includes('102')) activeService = '102';
      else if (user.email.includes('101')) activeService = '101';
      else if (user.email.includes('103')) activeService = '103';
    }

    const hospitals = ambulanceStore.getHospitals(activeService);
    const ambulances = ambulanceStore.getAmbulances(activeService);
    const stats = this.getStats(activeService);

    if (!user) {
      const demoActiveReq = ambulanceStore.getActiveRequestForCitizen('usr-citizen-demo', activeService) ||
                            ambulanceStore.getActiveRequestForCitizen('usr-citizen-1', activeService) ||
                            ambulanceStore.getAllRequests(activeService).find(r => ['pending', 'assigned', 'enroute', 'onscene'].includes(r.status));
      const pendingReqs = ambulanceStore.getAllRequests(activeService).filter(r => r.status === 'pending');

      return {
        serviceType: activeService,
        role: 'CITIZEN',
        hospitals,
        ambulances,
        activeRequest: demoActiveReq || null,
        pendingRequests: pendingReqs,
        stats,
        timestamp: nowIso
      };
    }

    // Check Staff Binding
    const binding = ambulanceStore.getBinding(user.id);

    // ADMIN Role
    if (user.role === 'ADMIN') {
      return {
        serviceType: activeService,
        role: 'ADMIN',
        binding,
        hospitals,
        ambulances,
        pendingRequests: ambulanceStore.getAllRequests(activeService).filter(r => r.status === 'pending'),
        stats,
        timestamp: nowIso
      };
    }

    // ANALYST Role (Read-only aggregate stats, no citizen personal descriptions)
    if (user.role === 'ANALYST') {
      const sanitizedAmbulances = ambulances.map(a => ({
        ...a,
        currentRequestId: undefined // hide specific call reference
      }));

      return {
        serviceType: activeService,
        role: 'ANALYST',
        hospitals,
        ambulances: sanitizedAmbulances,
        stats,
        timestamp: nowIso
      };
    }

    // Staff: DISPATCHER (Sees all city pending requests and all units of active service)
    const isDispatcher = (binding && binding.staffRole === 'DISPATCHER') ||
                         Boolean(user.email && user.email.toLowerCase().includes('disp'));
    if (isDispatcher) {
      const allPending = ambulanceStore.getAllRequests(activeService).filter(r => r.status === 'pending');
      const activeRequests = ambulanceStore.getAllRequests(activeService).filter(r => ['assigned', 'enroute', 'onscene'].includes(r.status));

      return {
        serviceType: activeService,
        role: 'DISPATCHER',
        binding: binding || {
          userId: user.id,
          staffRole: 'DISPATCHER',
          hospitalId: hospitals[0]?.id || 'hosp-tash-1'
        },
        hospitals,
        ambulances,
        pendingRequests: allPending,
        activeRequest: activeRequests[0] || null,
        stats,
        timestamp: nowIso
      };
    }

    // Staff: DRIVER
    const isDriver = (binding && binding.staffRole === 'DRIVER') ||
                     Boolean(user.email && user.email.toLowerCase().includes('driver'));
    if (isDriver) {
      const driverUnit = (binding?.ambulanceId ? ambulances.find(a => a.id === binding.ambulanceId) : null) ||
                         ambulances[0];

      let assignedRequest = driverUnit
        ? ambulanceStore.getAssignedRequestForAmbulance(driverUnit.id)
        : undefined;

      // Fallback: if driver unit doesn't have an assigned request directly, check system assigned requests of this serviceType
      if (!assignedRequest || (assignedRequest.serviceType || '103') !== activeService) {
        assignedRequest = ambulanceStore.getAllRequests(activeService).find(r => ['assigned', 'enroute', 'onscene'].includes(r.status));
      }

      return {
        serviceType: activeService,
        role: 'DRIVER',
        binding: binding || {
          userId: user.id,
          staffRole: 'DRIVER',
          hospitalId: driverUnit ? driverUnit.hospitalId : hospitals[0]?.id || 'hosp-tash-1',
          ambulanceId: driverUnit ? driverUnit.id : ambulances[0]?.id
        },
        hospitals,
        ambulances: driverUnit ? [driverUnit] : ambulances,
        assignedRequest: assignedRequest || null,
        stats,
        timestamp: nowIso
      };
    }

    // Regular Citizen (USER)
    let activeReq = ambulanceStore.getActiveRequestForCitizen(user.id, activeService);
    if (!activeReq) {
      activeReq = ambulanceStore.getActiveRequestForCitizen('usr-citizen-demo', activeService) ||
                  ambulanceStore.getAllRequests(activeService).find(r => ['pending', 'assigned', 'enroute', 'onscene'].includes(r.status));
    }
    let assignedAmbulances: AmbulanceUnit[] = [];
    if (activeReq && activeReq.assignedAmbulanceId) {
      const unit = ambulanceStore.getAmbulance(activeReq.assignedAmbulanceId);
      if (unit) assignedAmbulances = [unit];
    } else {
      assignedAmbulances = ambulances;
    }
    const allPending = ambulanceStore.getAllRequests(activeService).filter(r => r.status === 'pending');

    return {
      serviceType: activeService,
      role: 'CITIZEN',
      hospitals,
      ambulances: assignedAmbulances,
      activeRequest: activeReq || null,
      pendingRequests: allPending,
      stats,
      timestamp: nowIso
    };
  }

  // --- Real-time Simulation Engine ---

  private startSimulationLoop() {
    if (!CONFIG.ambulance.simulateAmbulances) return;

    // Ticks every 1.5 seconds
    this.simulationInterval = setInterval(() => {
      this.tickSimulation();
    }, 1500);

    if (this.simulationInterval && typeof this.simulationInterval.unref === 'function') {
      this.simulationInterval.unref();
    }
  }

  private tickSimulation() {
    const enrouteAmbulances = ambulanceStore.getAmbulances().filter(a => a.status === 'enroute');
    const speedFactor = (CONFIG.ambulance.simSpeedup || 8) * 0.0003; // step proportion per tick

    for (const amb of enrouteAmbulances) {
      if (!amb.currentRequestId || this.manualDriverOverrides.has(amb.id)) {
        continue;
      }

      const req = ambulanceStore.getRequest(amb.currentRequestId);
      if (!req || !req.routeGeometry || req.routeGeometry.length < 2) continue;

      const coords = req.routeGeometry;

      // Find closest segment to current ambulance location
      let closestIdx = 0;
      let minD = Infinity;
      for (let i = 0; i < coords.length; i++) {
        const d = calculateHaversineDistanceKm(amb.lat, amb.lon, coords[i][1], coords[i][0]);
        if (d < minD) {
          minD = d;
          closestIdx = i;
        }
      }

      // Advance strictly 1 waypoint point per 1.5s tick along the 40+ coordinate path for steady driving
      const nextIdx = closestIdx + 1;

      // Only transition to onscene when the vehicle has completely reached the final coordinate of the route
      if (nextIdx >= coords.length - 1) {
        amb.lat = req.lat;
        amb.lon = req.lon;
        amb.status = 'onscene';
        req.status = 'onscene';
        req.etaMinutes = 0;
        ambulanceStore.upsertAmbulance(amb);
        ambulanceStore.saveRequest(req);
        continue;
      }

      const targetLon = coords[nextIdx][0];
      const targetLat = coords[nextIdx][1];

      amb.lat = Number(targetLat.toFixed(6));
      amb.lon = Number(targetLon.toFixed(6));
      amb.lastLocationUpdate = new Date().toISOString();

      // Recalculate remaining ETA minutes
      const remainingProgress = (coords.length - 1 - nextIdx) / (coords.length - 1);
      req.etaMinutes = Math.max(1, Math.round(remainingProgress * 7));

      ambulanceStore.upsertAmbulance(amb);
      ambulanceStore.saveRequest(req);
    }
  }

  public stopSimulationLoop() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }
}

export const ambulanceService = new AmbulanceService();
