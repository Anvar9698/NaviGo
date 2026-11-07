import { Router, Response } from 'express';
import { z } from 'zod';
import { dbStore } from '../db/store';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.middleware';

export const reportsRouter = Router();

const CreateReportSchema = z.object({
  category: z.enum([
    'damage',
    'closure',
    'construction',
    'hazard',
    'signage',
    'transit',
    'map_error',
    'other'
  ]),
  title: z.string().min(3).max(120),
  description: z.string().max(1000).optional().default(''),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().optional(),
  imageUrl: z.string().url().optional(),
  severity: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium')
});

// POST /api/v1/reports - Create new community report (All citizens can report)
reportsRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = CreateReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const reporterId = req.user?.id || 'usr-citizen-1';
    const reporterEmail = req.user?.email || 'citizen@yol.uz';
    const reporterRole = req.user?.role || 'USER';

    const { report, duplicateOf } = dbStore.createReport({
      reporterId,
      ...parsed.data
    });

    // Record audit event
    dbStore.appendAudit({
      id: `aud-${Date.now()}`,
      actorId: reporterId,
      actorEmail: reporterEmail,
      actorRole: reporterRole,
      action: 'SUBMIT_REPORT',
      entityType: 'REPORT',
      entityId: report.id,
      details: `Submitted report: ${report.title} (${report.category})`,
      timestamp: new Date().toISOString()
    });

    return res.status(201).json({
      report,
      duplicateNotice: duplicateOf 
        ? `Note: Similar report (${duplicateOf.id}) was previously reported nearby. An editor will link and review.`
        : null
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create report', message: err.message });
  }
});

// GET /api/v1/reports/my - Current user reports
reportsRouter.get('/my', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const reports = dbStore.getReportsByReporter(req.user!.id);
  return res.json({ reports });
});

// GET /api/v1/reports/:id - Single report details
reportsRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const report = dbStore.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  // Only the reporter or staff (Editor, Admin, Analyst) can view
  if (report.reporterId !== req.user!.id && !['EDITOR', 'ADMIN', 'ANALYST'].includes(req.user!.role)) {
    return res.status(403).json({ error: 'Forbidden', message: 'You do not own this report.' });
  }

  return res.json({ report });
});

const UpdateReportSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().max(1000).optional(),
  category: z.enum([
    'damage',
    'closure',
    'construction',
    'hazard',
    'signage',
    'transit',
    'map_error',
    'other'
  ]).optional(),
  severity: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'RESOLVED']).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
});

// PATCH /api/v1/reports/:id - Update report and its active map feature (Admin, Road Engineer / Editor, or Owner)
reportsRouter.patch('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const report = dbStore.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const isStaff = ['ADMIN', 'EDITOR'].includes(req.user!.role);
  const isOwner = report.reporterId === req.user!.id;

  if (!isStaff && !isOwner) {
    return res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to edit this report.' });
  }

  const parsed = UpdateReportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  const updated = dbStore.updateReport(req.params.id, parsed.data);
  if (!updated) {
    return res.status(404).json({ error: 'Failed to update report' });
  }

  dbStore.appendAudit({
    id: `aud-${Date.now()}`,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: 'UPDATE_REPORT',
    entityType: 'REPORT',
    entityId: updated.id,
    details: `Updated report ${updated.id} by ${req.user!.role} (${req.user!.email})`,
    timestamp: new Date().toISOString()
  });

  return res.json({ report: updated, message: 'Report and road map feature successfully updated.' });
});

// DELETE /api/v1/reports/:id - Delete report and remove from map (Admin, Road Engineer / Editor, or Owner)
reportsRouter.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const report = dbStore.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const isStaff = ['ADMIN', 'EDITOR'].includes(req.user!.role);
  const isOwner = report.reporterId === req.user!.id;

  if (!isStaff && !isOwner) {
    return res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to delete this report.' });
  }

  const success = dbStore.deleteReport(req.params.id);
  if (!success) {
    return res.status(500).json({ error: 'Failed to delete report' });
  }

  dbStore.appendAudit({
    id: `aud-${Date.now()}`,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: 'DELETE_REPORT',
    entityType: 'REPORT',
    entityId: req.params.id,
    details: `Deleted report ${req.params.id} and removed from public map`,
    timestamp: new Date().toISOString()
  });

  return res.json({ message: 'Report and road feature successfully removed from public map.' });
});
