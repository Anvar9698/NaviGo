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

// POST /api/v1/reports - Create new community report
reportsRouter.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = CreateReportSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
    }

    const { report, duplicateOf } = dbStore.createReport({
      reporterId: req.user!.id,
      ...parsed.data
    });

    // Record audit event
    dbStore.appendAudit({
      id: `aud-${Date.now()}`,
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
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
