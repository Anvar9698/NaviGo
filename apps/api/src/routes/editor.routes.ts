import { Router, Response } from 'express';
import { z } from 'zod';
import { dbStore } from '../db/store';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.middleware';

export const editorRouter = Router();

// Require at least EDITOR role
editorRouter.use(requireRole(['EDITOR', 'ADMIN']));

// GET /api/v1/editor/reports - Report triage inbox
editorRouter.get('/reports', (req: AuthenticatedRequest, res: Response) => {
  const reports = dbStore.getAllReports();
  return res.json({ reports });
});

const TriageSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'NEEDS_INFORMATION', 'REJECTED', 'APPROVED']),
  notes: z.string().optional()
});

// POST /api/v1/editor/reports/:id/triage - Update report status
editorRouter.post('/reports/:id/triage', (req: AuthenticatedRequest, res: Response) => {
  const parsed = TriageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  const { status, notes } = parsed.data;
  const updated = dbStore.updateReportStatus(req.params.id, status, notes);
  if (!updated) {
    return res.status(404).json({ error: 'Report not found' });
  }

  dbStore.appendAudit({
    id: `aud-${Date.now()}`,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: 'TRIAGE_REPORT',
    entityType: 'REPORT',
    entityId: updated.id,
    details: `Triage updated to ${status}. Notes: ${notes || 'None'}`,
    timestamp: new Date().toISOString()
  });

  return res.json({ report: updated });
});

const ProposeChangeSchema = z.object({
  reportId: z.string().optional(),
  changeType: z.enum(['add_hazard', 'closure', 'lane_restriction', 'correct_geometry']),
  title: z.string().min(3),
  description: z.string().min(5),
  latitude: z.number(),
  longitude: z.number(),
  validFrom: z.string(),
  validUntil: z.string()
});

// POST /api/v1/editor/map-changes - Create proposed map change for admin review
editorRouter.post('/map-changes', (req: AuthenticatedRequest, res: Response) => {
  const parsed = ProposeChangeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  const proposal = dbStore.createProposedChange({
    ...parsed.data,
    proposedByUserId: req.user!.id
  });

  dbStore.appendAudit({
    id: `aud-${Date.now()}`,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: 'PROPOSE_MAP_CHANGE',
    entityType: 'PROPOSED_CHANGE',
    entityId: proposal.id,
    details: `Proposed map change: ${proposal.title}`,
    timestamp: new Date().toISOString()
  });

  return res.status(201).json({ proposal });
});

// GET /api/v1/editor/map-changes - List proposals
editorRouter.get('/map-changes', (req: AuthenticatedRequest, res: Response) => {
  const proposals = dbStore.getProposedChanges();
  return res.json({ proposals });
});
