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
  User
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

// Checks if any active road hazards (closures, roadwork, accidents) lie within 50m of route
export function checkRouteHazards(coordinates: [number, number][]): string[] {
  if (!coordinates || coordinates.length === 0) return [];
  const activeFeatures = dbStore.getActiveMapFeatures();
  const warnings: string[] = [];

  for (const feature of activeFeatures) {
    // Only check road closures, construction, or high severity hazards
    if (!['closure', 'roadwork', 'hazard'].includes(feature.featureType)) continue;

    // Check distance against sampled route coordinates (every 5th point to stay fast)
    let minDistanceKm = Infinity;
    for (let i = 0; i < coordinates.length; i += 3) {
      const dist = calculateHaversineDistanceKm(
        feature.latitude,
        feature.longitude,
        coordinates[i][1],
        coordinates[i][0]
      );
      if (dist < minDistanceKm) {
        minDistanceKm = dist;
      }
      if (minDistanceKm <= 0.05) break; // within 50m
    }

    if (minDistanceKm <= 0.05) {
      warnings.push(`Road hazard alert: ${feature.title} (${feature.featureType}) near route`);
    }
  }

  return warnings;
}

class AmbulanceService {
  private manualDriverOverrides: Set<string> = new Set();
  private simulationInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startSimulationLoop();
  }

  // --- Dispatch Flow Methods ---

  public async createEmergencyRequest(data: {
    citizenId: string;
    citizenName: string;
    citizenPhone?: string;
    lat: number;
    lon: number;
    description: string;
    severity: EmergencySeverity;
  }): Promise<{ request: EmergencyRequest; isDuplicate?: boolean; message?: string }> {
    // Check 150m / 5-min duplicate
    const duplicate = ambulanceStore.findDuplicateRecentRequest(data.lat, data.lon);
    if (duplicate) {
      return {
        request: duplicate,
        isDuplicate: true,
        message: 'A similar emergency call was recently reported at this location and is already being handled.'
      };
    }

    // Find nearest hospital with at least one free ambulance
    const nearest = ambulanceStore.findNearestEligibleHospital(data.lat, data.lon, []);

    const id = `req-${uuidv4().slice(0, 8)}`;
    const nowIso = new Date().toISOString();

    if (!nearest) {
      // No hospital has a free unit
      const unassignedReq: EmergencyRequest = {
        id,
        citizenId: data.citizenId,
        citizenName: data.citizenName,
        citizenPhone: data.citizenPhone,
        lat: data.lat,
        lon: data.lon,
        description: data.description,
        severity: data.severity,
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
        details: `Emergency request ${id} created with severity ${data.severity}. No ambulance units currently free.`,
        timestamp: nowIso
      });

      return {
        request: unassignedReq,
        message: 'Hozirda barcha tez yordam mashinalari band. Iltimos zudlik bilan 103 raqamiga qo\'ng\'iroq qiling.'
      };
    }

    const timeoutMs = CONFIG.ambulance.acceptTimeoutSeconds * 1000;
    const timeoutAt = new Date(Date.now() + timeoutMs).toISOString();

    const newReq: EmergencyRequest = {
      id,
      citizenId: data.citizenId,
      citizenName: data.citizenName,
      citizenPhone: data.citizenPhone,
      lat: data.lat,
      lon: data.lon,
      description: data.description,
      severity: data.severity,
      status: 'pending',
      targetHospitalId: nearest.hospital.id,
      triedHospitalIds: [],
      timeoutAt,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    ambulanceStore.saveRequest(newReq);

    // Schedule acceptance timer
    ambulanceStore.setAcceptTimer(id, () => {
      this.handleAcceptTimeout(id);
    }, timeoutMs);

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
    dispatcherUserId: string
  ): Promise<EmergencyRequest> {
    const req = ambulanceStore.getRequest(requestId);
    if (!req) {
      throw new Error('Request not found');
    }
    if (req.status !== 'pending') {
      return req; // idempotent
    }
    if (req.targetHospitalId !== hospitalId) {
      throw new Error('This emergency call is assigned to another hospital');
    }

    ambulanceStore.clearAcceptTimer(requestId);

    // Get up to 3 nearest free ambulances of this hospital
    const freeUnits = ambulanceStore.getAmbulancesByHospital(hospitalId)
      .filter(a => a.status === 'free')
      .map(unit => ({
        unit,
        crowDistKm: calculateHaversineDistanceKm(unit.lat, unit.lon, req.lat, req.lon)
      }))
      .sort((a, b) => a.crowDistKm - b.crowDistKm)
      .slice(0, 3);

    if (freeUnits.length === 0) {
      // Re-dispatch if all units somehow became busy
      return this.declineEmergencyRequest(requestId, hospitalId, dispatcherUserId);
    }

    // Calculate road route for each of the up to 3 units, pick fastest
    let bestUnit = freeUnits[0].unit;
    let bestRoute: any = null;
    let minDurationSeconds = Infinity;

    for (const item of freeUnits) {
      try {
        const route = await calculateRoute(item.unit.lat, item.unit.lon, req.lat, req.lon, 'car');
        const durationSec = (route.durationMinutes || 1) * 60;
        if (durationSec < minDurationSeconds) {
          minDurationSeconds = durationSec;
          bestUnit = item.unit;
          bestRoute = route;
        }
      } catch {
        // Fallback to Haversine estimate
        const estSec = Math.round((item.crowDistKm / 40) * 3600);
        if (estSec < minDurationSeconds) {
          minDurationSeconds = estSec;
          bestUnit = item.unit;
          bestRoute = {
            distanceMeters: Math.round(item.crowDistKm * 1000),
            durationMinutes: Math.max(1, Math.round(estSec / 60)),
            coordinates: [
              [item.unit.lon, item.unit.lat],
              [req.lon, req.lat]
            ],
            steps: [
              {
                instruction: 'Proceed to emergency site',
                distanceMeters: Math.round(item.crowDistKm * 1000),
                durationSeconds: estSec,
                maneuverType: 'straight'
              }
            ],
            warnings: []
          };
        }
      }
    }

    // Step positions and hazards
    const stepsWithCoords = calculateStepPositions(bestRoute.coordinates, bestRoute.steps);
    const hazardWarnings = checkRouteHazards(bestRoute.coordinates);

    // Assign unit
    bestUnit.status = 'assigned';
    bestUnit.currentRequestId = req.id;
    ambulanceStore.upsertAmbulance(bestUnit);

    // Update request
    req.status = 'assigned';
    req.assignedAmbulanceId = bestUnit.id;
    req.assignedHospitalId = hospitalId;
    req.routeGeometry = bestRoute.coordinates;
    req.routeSteps = stepsWithCoords;
    req.etaMinutes = bestRoute.durationMinutes;
    req.distanceMeters = bestRoute.distanceMeters;
    req.hazardWarnings = hazardWarnings;
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

    // Forward to next nearest hospital with a free unit
    const nextHospital = ambulanceStore.findNearestEligibleHospital(req.lat, req.lon, req.triedHospitalIds);

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

    const nextHospital = ambulanceStore.findNearestEligibleHospital(req.lat, req.lon, req.triedHospitalIds);
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

  public driverGo(requestId: string, ambulanceId: string, driverUserId: string): EmergencyRequest {
    const req = ambulanceStore.getRequest(requestId);
    if (!req) throw new Error('Request not found');
    if (req.assignedAmbulanceId !== ambulanceId) throw new Error('Ambulance mismatch');

    req.status = 'enroute';
    ambulanceStore.saveRequest(req);

    const unit = ambulanceStore.getAmbulance(ambulanceId);
    if (unit) {
      unit.status = 'enroute';
      ambulanceStore.upsertAmbulance(unit);
    }

    dbStore.appendAudit({
      id: uuidv4(),
      actorId: driverUserId,
      actorEmail: dbStore.getUserById(driverUserId)?.email || 'driver@103.uz',
      actorRole: 'USER',
      action: 'DRIVER_GO',
      entityType: 'EMERGENCY_REQUEST',
      entityId: req.id,
      details: `Ambulance ${unit?.plateNumber || ambulanceId} enroute to emergency scene.`,
      timestamp: new Date().toISOString()
    });

    return req;
  }

  public driverOnScene(requestId: string, ambulanceId: string, driverUserId: string): EmergencyRequest {
    const req = ambulanceStore.getRequest(requestId);
    if (!req) throw new Error('Request not found');
    if (req.assignedAmbulanceId !== ambulanceId) throw new Error('Ambulance mismatch');

    req.status = 'onscene';
    ambulanceStore.saveRequest(req);

    const unit = ambulanceStore.getAmbulance(ambulanceId);
    if (unit) {
      unit.status = 'onscene';
      ambulanceStore.upsertAmbulance(unit);
    }

    dbStore.appendAudit({
      id: uuidv4(),
      actorId: driverUserId,
      actorEmail: dbStore.getUserById(driverUserId)?.email || 'driver@103.uz',
      actorRole: 'USER',
      action: 'DRIVER_ONSCENE',
      entityType: 'EMERGENCY_REQUEST',
      entityId: req.id,
      details: `Ambulance ${unit?.plateNumber || ambulanceId} arrived on scene.`,
      timestamp: new Date().toISOString()
    });

    return req;
  }

  public driverComplete(requestId: string, ambulanceId: string, driverUserId: string): EmergencyRequest {
    const req = ambulanceStore.getRequest(requestId);
    if (!req) throw new Error('Request not found');
    if (req.assignedAmbulanceId !== ambulanceId) throw new Error('Ambulance mismatch');

    const nowIso = new Date().toISOString();
    req.status = 'done';
    req.resolvedAt = nowIso;

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

    // Free the ambulance
    const unit = ambulanceStore.getAmbulance(ambulanceId);
    if (unit) {
      unit.status = 'free';
      unit.currentRequestId = undefined;
      ambulanceStore.upsertAmbulance(unit);
      this.manualDriverOverrides.delete(ambulanceId);
    }

    dbStore.appendAudit({
      id: uuidv4(),
      actorId: driverUserId,
      actorEmail: dbStore.getUserById(driverUserId)?.email || 'driver@103.uz',
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

    // Release ambulance if assigned
    if (req.assignedAmbulanceId) {
      const unit = ambulanceStore.getAmbulance(req.assignedAmbulanceId);
      if (unit) {
        unit.status = 'free';
        unit.currentRequestId = undefined;
        ambulanceStore.upsertAmbulance(unit);
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

  public getStats(): AmbulanceStats {
    const all = ambulanceStore.getAllRequests();
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

  public getStateForUser(user?: User | null): AmbulanceStatePayload {
    const nowIso = new Date().toISOString();
    const hospitals = ambulanceStore.getHospitals();
    const stats = this.getStats();

    if (!user) {
      return {
        role: 'ANONYMOUS',
        hospitals,
        ambulances: [],
        stats,
        timestamp: nowIso
      };
    }

    // Check Staff Binding
    const binding = ambulanceStore.getBinding(user.id);

    // ADMIN Role
    if (user.role === 'ADMIN') {
      return {
        role: 'ADMIN',
        binding,
        hospitals,
        ambulances: ambulanceStore.getAmbulances(),
        pendingRequests: ambulanceStore.getAllRequests().filter(r => r.status === 'pending'),
        stats,
        timestamp: nowIso
      };
    }

    // ANALYST Role (Read-only aggregate stats, no citizen personal descriptions)
    if (user.role === 'ANALYST') {
      const sanitizedAmbulances = ambulanceStore.getAmbulances().map(a => ({
        ...a,
        currentRequestId: undefined // hide specific call reference
      }));

      return {
        role: 'ANALYST',
        hospitals,
        ambulances: sanitizedAmbulances,
        stats,
        timestamp: nowIso
      };
    }

    // Staff: DISPATCHER
    if (binding && binding.staffRole === 'DISPATCHER') {
      const hospitalAmbulances = ambulanceStore.getAmbulancesByHospital(binding.hospitalId);
      const pendingRequests = ambulanceStore.getPendingRequestsForHospital(binding.hospitalId);
      const activeRequests = ambulanceStore.getActiveRequestsForHospital(binding.hospitalId);

      return {
        role: 'DISPATCHER',
        binding,
        hospitals,
        ambulances: hospitalAmbulances,
        pendingRequests,
        activeRequest: activeRequests[0] || null,
        stats,
        timestamp: nowIso
      };
    }

    // Staff: DRIVER
    if (binding && binding.staffRole === 'DRIVER') {
      const driverUnit = binding.ambulanceId
        ? ambulanceStore.getAmbulance(binding.ambulanceId)
        : undefined;

      const assignedRequest = binding.ambulanceId
        ? ambulanceStore.getAssignedRequestForAmbulance(binding.ambulanceId)
        : undefined;

      return {
        role: 'DRIVER',
        binding,
        hospitals,
        ambulances: driverUnit ? [driverUnit] : [],
        assignedRequest: assignedRequest || null,
        stats,
        timestamp: nowIso
      };
    }

    // Regular Citizen (USER)
    const activeReq = ambulanceStore.getActiveRequestForCitizen(user.id);
    let assignedAmbulances: AmbulanceUnit[] = [];
    if (activeReq && activeReq.assignedAmbulanceId) {
      const unit = ambulanceStore.getAmbulance(activeReq.assignedAmbulanceId);
      if (unit) assignedAmbulances = [unit];
    }

    return {
      role: 'CITIZEN',
      hospitals,
      ambulances: assignedAmbulances,
      activeRequest: activeReq || null,
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

      // If at end of route or close to destination (within 25 meters), transition to onscene
      if (closestIdx >= coords.length - 1 || minD < 0.025) {
        amb.lat = req.lat;
        amb.lon = req.lon;
        amb.status = 'onscene';
        req.status = 'onscene';
        ambulanceStore.upsertAmbulance(amb);
        ambulanceStore.saveRequest(req);
        continue;
      }

      // Advance along coordinates
      const nextIdx = Math.min(coords.length - 1, closestIdx + 1);
      const targetLon = coords[nextIdx][0];
      const targetLat = coords[nextIdx][1];

      const stepRatio = Math.min(1, Math.max(0.15, speedFactor));
      amb.lat = Number((amb.lat + (targetLat - amb.lat) * stepRatio).toFixed(6));
      amb.lon = Number((amb.lon + (targetLon - amb.lon) * stepRatio).toFixed(6));
      amb.lastLocationUpdate = new Date().toISOString();

      ambulanceStore.upsertAmbulance(amb);
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
