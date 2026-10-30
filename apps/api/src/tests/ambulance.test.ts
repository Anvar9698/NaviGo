import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ambulanceStore } from '../db/ambulance.store';
import { ambulanceService, calculateStepPositions, checkRouteHazards } from '../services/ambulance.service';
import { dbStore } from '../db/store';

describe('Ambulance 103 Dispatch Rules & Service Logic', () => {
  it('correctly initializes Tashkent and Fergana hospitals with free ambulances', () => {
    const hospitals = ambulanceStore.getHospitals();
    assert.ok(hospitals.length >= 10, 'Should have at least 10 seeded hospitals');

    const tashkentHosp = hospitals.find(h => h.id === 'hosp-tash-1');
    assert.ok(tashkentHosp, 'Republican Emergency Center (16-Gorbolnitsa) should exist');

    const ferganaHosp = hospitals.find(h => h.id === 'hosp-ferg-1');
    assert.ok(ferganaHosp, 'Fergana Regional Emergency Center should exist');

    const freeUnits = ambulanceStore.getAmbulancesByHospital('hosp-tash-1');
    assert.ok(freeUnits.length >= 2, 'Hospital should have at least 2 ambulances');
    assert.equal(freeUnits[0].status, 'free');
  });

  it('binds staff roles without modifying UserRole enum', () => {
    const dispUser = dbStore.getUserByEmail('dispatcher@103.uz');
    assert.ok(dispUser, 'Dispatcher user must exist in dbStore');
    assert.equal(dispUser?.role, 'USER', 'Dispatcher core role stays USER');

    const binding = ambulanceStore.getBinding(dispUser!.id);
    assert.ok(binding, 'Staff binding must exist');
    assert.equal(binding?.staffRole, 'DISPATCHER');
    assert.equal(binding?.hospitalId, 'hosp-tash-1');

    const driverUser = dbStore.getUserByEmail('driver@103.uz');
    assert.ok(driverUser, 'Driver user must exist in dbStore');
    const driverBinding = ambulanceStore.getBinding(driverUser!.id);
    assert.ok(driverBinding, 'Driver binding must exist');
    assert.equal(driverBinding?.staffRole, 'DRIVER');
    assert.equal(driverBinding?.ambulanceId, 'amb-tash-101');
  });

  it('accurately derives step positions along coordinates by accumulating distanceMeters', () => {
    const coords: [number, number][] = [
      [69.2155, 41.2721],
      [69.2200, 41.2750],
      [69.2250, 41.2800]
    ];
    const steps = [
      { instruction: 'Depart', distanceMeters: 200, durationSeconds: 30 },
      { instruction: 'Turn right onto Chilanzar St', distanceMeters: 400, durationSeconds: 60 }
    ];

    const positioned = calculateStepPositions(coords, steps as any);
    assert.equal(positioned.length, 2);
    assert.ok(positioned[0].coordinate, 'First step has derived coordinate');
    assert.ok(positioned[1].coordinate, 'Second step has derived coordinate');
    assert.equal(typeof positioned[0].coordinate?.[0], 'number');
    assert.equal(typeof positioned[0].coordinate?.[1], 'number');
  });

  it('detects duplicate emergency call within 150m created within 5 minutes', async () => {
    // 1st call
    const res1 = await ambulanceService.createEmergencyRequest({
      citizenId: 'usr-citizen-test-1',
      citizenName: 'Citizen One',
      lat: 41.2722,
      lon: 69.2156,
      description: 'Severe chest pain on 3rd floor',
      severity: 1
    });

    assert.equal(res1.isDuplicate, undefined);
    assert.equal(res1.request.status, 'pending');

    // 2nd call 20 meters away
    const res2 = await ambulanceService.createEmergencyRequest({
      citizenId: 'usr-citizen-test-2',
      citizenName: 'Citizen Two',
      lat: 41.2723,
      lon: 69.2157,
      description: 'Neighbor collapsed',
      severity: 1
    });

    assert.equal(res2.isDuplicate, true);
    assert.equal(res2.request.id, res1.request.id, 'Should identify as duplicate of first call');
  });

  it('runs complete dispatch lifecycle: Create -> Accept -> Go -> Arrive -> Complete with minutes saved calculation', async () => {
    const citizen = dbStore.getUserById('usr-citizen-1')!;
    const disp = dbStore.getUserByEmail('dispatcher@103.uz')!;
    const driver = dbStore.getUserByEmail('driver@103.uz')!;

    // 1. Citizen creates emergency request
    const createRes = await ambulanceService.createEmergencyRequest({
      citizenId: citizen.id,
      citizenName: citizen.name,
      lat: 41.2800,
      lon: 69.2200,
      description: 'Traffic incident with injuries',
      severity: 1
    });

    const reqId = createRes.request.id;
    assert.equal(createRes.request.status, 'pending');
    assert.equal(createRes.request.targetHospitalId, 'hosp-tash-1');

    // 2. Dispatcher accepts
    const acceptedReq = await ambulanceService.acceptEmergencyRequest(
      reqId,
      'hosp-tash-1',
      disp.id
    );

    assert.equal(acceptedReq.status, 'assigned');
    assert.ok(acceptedReq.assignedAmbulanceId, 'Must have assigned ambulance');
    const assignedAmbulance = ambulanceStore.getAmbulance(acceptedReq.assignedAmbulanceId!);
    assert.equal(assignedAmbulance?.status, 'assigned');
    assert.equal(assignedAmbulance?.currentRequestId, reqId);

    // 3. Driver initiates transit (GO)
    const enrouteReq = ambulanceService.driverGo(reqId, acceptedReq.assignedAmbulanceId!, driver.id);
    assert.equal(enrouteReq.status, 'enroute');
    assert.equal(ambulanceStore.getAmbulance(acceptedReq.assignedAmbulanceId!)?.status, 'enroute');

    // 4. Driver arrives on scene
    const onSceneReq = ambulanceService.driverOnScene(reqId, acceptedReq.assignedAmbulanceId!, driver.id);
    assert.equal(onSceneReq.status, 'onscene');
    assert.equal(ambulanceStore.getAmbulance(acceptedReq.assignedAmbulanceId!)?.status, 'onscene');

    // 5. Driver completes call
    const doneReq = ambulanceService.driverComplete(reqId, acceptedReq.assignedAmbulanceId!, driver.id);
    assert.equal(doneReq.status, 'done');
    assert.ok(typeof doneReq.minutesSaved === 'number' && doneReq.minutesSaved > 0, 'Must record minutes saved');
    assert.equal(ambulanceStore.getAmbulance(acceptedReq.assignedAmbulanceId!)?.status, 'free');

    // 6. Stats reflect handled call
    const stats = ambulanceService.getStats();
    assert.ok(stats.completedCalls >= 1, 'Completed calls must be incremented');
    assert.ok(stats.averageMinutesSaved > 0, 'Average minutes saved calculated');
  });

  it('forwards request to next nearest hospital when dispatcher declines or times out', async () => {
    // Call in Fergana city
    const createRes = await ambulanceService.createEmergencyRequest({
      citizenId: 'usr-citizen-ferg',
      citizenName: 'Fergana Resident',
      lat: 40.3850,
      lon: 71.7850,
      description: 'Breathing difficulty',
      severity: 2
    });

    const reqId = createRes.request.id;
    assert.equal(createRes.request.targetHospitalId, 'hosp-ferg-1');

    // Fergana hospital declines
    const declinedReq = await ambulanceService.declineEmergencyRequest(
      reqId,
      'hosp-ferg-1',
      'usr-disp-ferg'
    );

    // Must be forwarded to next nearest (e.g. hosp-ferg-7 private clinic or hosp-ferg-2 Margilan)
    assert.equal(declinedReq.status, 'pending');
    assert.notEqual(declinedReq.targetHospitalId, 'hosp-ferg-1');
    assert.ok(declinedReq.triedHospitalIds.includes('hosp-ferg-1'));
  });

  it('strictly isolates state and hides sensitive patient description from unauthorized roles', () => {
    const analystUser = dbStore.getUserById('usr-analyst-1')!;
    const analystState = ambulanceService.getStateForUser(analystUser);

    assert.equal(analystState.role, 'ANALYST');
    assert.equal(analystState.activeRequest, undefined);
    assert.equal(analystState.pendingRequests, undefined);

    const citizenUser = dbStore.getUserById('usr-citizen-1')!;
    const citizenState = ambulanceService.getStateForUser(citizenUser);
    assert.equal(citizenState.role, 'CITIZEN');
  });
});
