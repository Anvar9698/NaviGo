import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateHaversineDistanceKm, dbStore } from '../db/store';
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
});
