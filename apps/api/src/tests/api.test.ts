import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateHaversineDistanceKm, dbStore } from '../db/store';
import { calculateRoute } from '../providers/routing.provider';
import { canTriageReports, canProposeMapChanges, canApproveMapChanges } from '@yol/shared';

describe('Spatial & Distance Verification', () => {
  it('correctly calculates distance between Amir Temur Square and Chilonzor (approx 7.8km)', () => {
    // Amir Temur: 41.3111, 69.2797
    // Chilonzor: 41.2725, 69.2045
    const dist = calculateHaversineDistanceKm(41.3111, 69.2797, 41.2725, 69.2045);
    assert.ok(dist > 7.0 && dist < 9.0, `Calculated distance ${dist}km should be around 7.8km`);
  });

  it('detects duplicate report within 150m threshold', () => {
    // 1st report
    const rep1 = dbStore.createReport({
      reporterId: 'usr-citizen-1',
      category: 'damage',
      title: 'Pothole on Main Street',
      description: 'First notice',
      latitude: 41.3110,
      longitude: 69.2795
    });

    // 2nd report 30m away, same category
    const rep2 = dbStore.createReport({
      reporterId: 'usr-citizen-1',
      category: 'damage',
      title: 'Large hole on road',
      description: 'Second notice',
      latitude: 41.3112,
      longitude: 69.2796
    });

    assert.ok(rep2.duplicateOf, 'Should be flagged as duplicate of rep1');
    assert.equal(rep2.duplicateOf?.id, rep1.report.id);
  });
});

describe('RBAC & Permission Policy Verification', () => {
  it('enforces least-privilege matrix across roles', () => {
    assert.equal(canTriageReports('USER'), false);
    assert.equal(canTriageReports('EDITOR'), true);
    assert.equal(canTriageReports('ADMIN'), true);

    assert.equal(canProposeMapChanges('USER'), false);
    assert.equal(canProposeMapChanges('EDITOR'), true);

    assert.equal(canApproveMapChanges('USER'), false);
    assert.equal(canApproveMapChanges('EDITOR'), false);
    assert.equal(canApproveMapChanges('ADMIN'), true);
  });
});

describe('Report-to-Map Safe Publication Pipeline', () => {
  it('progresses community report through Editor proposal and Admin publication', () => {
    // 1. Citizen submits report
    const { report } = dbStore.createReport({
      reporterId: 'usr-citizen-1',
      category: 'closure',
      title: 'Emergency gas pipeline repair',
      description: 'Street completely blocked',
      latitude: 41.3200,
      longitude: 69.2800,
      severity: 'urgent'
    });
    assert.equal(report.status, 'SUBMITTED');

    // 2. Editor triages report
    const triaged = dbStore.updateReportStatus(report.id, 'UNDER_REVIEW', 'Verified with utility service');
    assert.equal(triaged?.status, 'UNDER_REVIEW');

    // 3. Editor proposes map change
    const proposal = dbStore.createProposedChange({
      reportId: report.id,
      proposedByUserId: 'usr-editor-1',
      changeType: 'closure',
      title: 'Gas repair road closure',
      description: 'Street closed for 12 hours',
      latitude: 41.3200,
      longitude: 69.2800,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 12 * 3600 * 1000).toISOString()
    });
    assert.equal(proposal.status, 'PENDING_APPROVAL');

    // 4. Admin approves and publishes
    const approval = dbStore.approveProposedChange(proposal.id, 'usr-admin-1');
    assert.ok(approval, 'Approval should succeed');
    assert.equal(approval?.change.status, 'APPROVED');
    assert.equal(approval?.publishedFeature.featureType, 'closure');
    assert.equal(approval?.publishedFeature.source, 'Official');

    // 5. Check that report is now marked PUBLISHED
    const finalReport = dbStore.getReportById(report.id);
    assert.equal(finalReport?.status, 'PUBLISHED');

    // 6. Test Admin Rollback
    const rolledBack = dbStore.rollbackMapFeature(approval!.publishedFeature.id);
    assert.equal(rolledBack, true);
    const rolledBackFeature = dbStore.getMapFeatureById(approval!.publishedFeature.id);
    assert.equal(rolledBackFeature?.isActive, false);
  });

  it('instantly makes user-reported problems visible to all users, allowing editor and admin to edit or delete', () => {
    // 1. Citizen reports problem on the road
    const { report } = dbStore.createReport({
      reporterId: 'usr-citizen-1',
      category: 'hazard',
      title: 'Oil spill on intersection',
      description: 'Slippery asphalt near crosswalk',
      latitude: 41.3500,
      longitude: 69.2900,
      severity: 'high'
    });

    // 2. Immediately visible in active map features without admin approval
    const activeFeatures = dbStore.getActiveMapFeatures();
    const publishedFeat = activeFeatures.find(f => f.linkedReportId === report.id);
    assert.ok(publishedFeat, 'User-reported problem must be immediately active on the map for all users');
    assert.equal(publishedFeat?.title, 'Oil spill on intersection');
    assert.equal(publishedFeat?.source, 'Reported by people');

    // 3. Road Engineer or Admin edits the problem
    const updatedFeat = dbStore.updateMapFeature(publishedFeat!.id, {
      title: 'Oil spill cleaned - road drying',
      severity: 'low'
    });
    assert.equal(updatedFeat?.title, 'Oil spill cleaned - road drying');
    assert.equal(updatedFeat?.severity, 'low');

    // 4. Road Engineer or Admin deletes the problem from the map
    const deleted = dbStore.deleteMapFeature(publishedFeat!.id);
    assert.equal(deleted, true);

    // Verify it is no longer in active map features
    const remainingFeatures = dbStore.getActiveMapFeatures();
    assert.equal(remainingFeatures.some(f => f.id === publishedFeat!.id), false);
  });

  it('returns corridor road incidents along A-to-B route and destination weather', async () => {
    const route = await calculateRoute(
      41.3111,
      69.2797,
      41.0097,
      71.2289,
      'car',
      'Chust',
      'Toshkent'
    );

    assert.equal(route.originName, 'Toshkent');
    assert.equal(route.destinationName, 'Chust');
    assert.ok(route.routeIncidents && route.routeIncidents.length >= 3, 'Should detect corridor incidents along A373 towards Chust');
    assert.ok(route.destinationWeather, 'Should return destination weather');
    assert.equal(route.destinationWeather?.city, 'Chust');
    assert.ok(route.destinationAirQuality, 'Should return destination air quality');
  });
});
