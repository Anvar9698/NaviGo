import { Router, Response } from 'express';
import { z } from 'zod';
import { dbStore } from '../db/store';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.middleware';

export const adminRouter = Router();

// Require strictly ADMIN role
adminRouter.use(requireRole(['ADMIN']));

// GET /api/v1/admin/users
adminRouter.get('/users', (req: AuthenticatedRequest, res: Response) => {
  const users = dbStore.getAllUsers();
  return res.json({ users });
});

// PATCH /api/v1/admin/users/:id/role
const RoleUpdateSchema = z.object({
  role: z.enum(['USER', 'EDITOR', 'ANALYST', 'ADMIN'])
});

adminRouter.patch('/users/:id/role', (req: AuthenticatedRequest, res: Response) => {
  const parsed = RoleUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  const updated = dbStore.updateUserRole(req.params.id, parsed.data.role);
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }

  dbStore.appendAudit({
    id: `aud-${Date.now()}`,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: 'ADMIN',
    action: 'USER_ROLE_CHANGE',
    entityType: 'USER',
    entityId: updated.id,
    details: `Updated role of ${updated.email} to ${parsed.data.role}`,
    timestamp: new Date().toISOString()
  });

  const { passwordHash: _, ...safeUser } = updated;
  return res.json({ user: safeUser });
});

// POST /api/v1/admin/map-changes/:id/approve - Transactional publication of map update
adminRouter.post('/map-changes/:id/approve', (req: AuthenticatedRequest, res: Response) => {
  const result = dbStore.approveProposedChange(req.params.id, req.user!.id);
  if (!result) {
    return res.status(400).json({ error: 'Proposal not found or not in PENDING status' });
  }

  return res.json({
    message: 'Proposed map change successfully approved and published to public map!',
    change: result.change,
    publishedFeature: result.publishedFeature
  });
});

// POST /api/v1/admin/map-changes/:id/reject
adminRouter.post('/map-changes/:id/reject', (req: AuthenticatedRequest, res: Response) => {
  const reason = (req.body.reason as string) || 'Rejected by Administrator';
  const result = dbStore.rejectProposedChange(req.params.id, req.user!.id, reason);
  if (!result) {
    return res.status(404).json({ error: 'Proposal not found' });
  }

  return res.json({ message: 'Proposed map change rejected', change: result });
});

// POST /api/v1/admin/features/:id/rollback - Rollback published map feature
adminRouter.post('/features/:id/rollback', (req: AuthenticatedRequest, res: Response) => {
  const success = dbStore.rollbackMapFeature(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Map feature not found' });
  }

  dbStore.appendAudit({
    id: `aud-${Date.now()}`,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: 'ADMIN',
    action: 'ROLLBACK_MAP_FEATURE',
    entityType: 'MAP_FEATURE',
    entityId: req.params.id,
    details: `Feature ${req.params.id} rolled back from active public map`,
    timestamp: new Date().toISOString()
  });

  return res.json({ message: 'Map feature successfully deactivated/rolled back.' });
});

// GET /api/v1/admin/audit-log
adminRouter.get('/audit-log', (req: AuthenticatedRequest, res: Response) => {
  const logs = dbStore.getAuditLogs(100);
  return res.json({ logs });
});

// GET /api/v1/admin/provider-health
adminRouter.get('/provider-health', (req: AuthenticatedRequest, res: Response) => {
  const providers = dbStore.getProviderHealth();
  return res.json({ providers });
});
