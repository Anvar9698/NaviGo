import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { createRateLimiter } from '../middleware/rate-limit.middleware';
import { ambulanceService } from '../services/ambulance.service';
import { ambulanceStore } from '../db/ambulance.store';
import { CONFIG } from '../config';

export const ambulanceRouter = Router();

// Rate limiter for creating emergency requests
const emergencyLimiter = createRateLimiter(
  CONFIG.rateLimits.emergencyMax,
  CONFIG.rateLimits.windowMs
);

// Staff Authorization Middleware
function requireStaffRole(role: 'DISPATCHER' | 'DRIVER' | 'ANY') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    if (req.user.role === 'ADMIN') {
      return next(); // Admins bypass staff restrictions
    }

    if (req.user.role === 'EDITOR') {
      return res.status(403).json({ error: 'Forbidden', message: 'Editors have no access to ambulance dispatch' });
    }

    const binding = ambulanceStore.getBinding(req.user.id);
    if (!binding) {
      return res.status(403).json({ error: 'Forbidden', message: 'No ambulance staff binding found' });
    }

    if (role === 'ANY' || binding.staffRole === role) {
      (req as any).staffBinding = binding;
      return next();
    }

    return res.status(403).json({
      error: 'Forbidden',
      message: `Action requires ${role} role, but user has ${binding.staffRole}`
    });
  };
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
  }
  next();
}

// 1. GET /state - Live polled state for the current user
ambulanceRouter.get('/state', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'EDITOR') {
    return res.status(403).json({ error: 'Forbidden', message: 'Editors have no access to ambulance dispatch' });
  }

  const state = ambulanceService.getStateForUser(req.user);
  res.json(state);
});

// 2. GET /stats - Overall performance stats
ambulanceRouter.get('/stats', (req: Request, res: Response) => {
  const stats = ambulanceService.getStats();
  res.json(stats);
});

// 3. POST /requests - Citizen creates emergency request
const createRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  description: z.string().min(3).max(500),
  severity: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  citizenPhone: z.string().optional()
});

ambulanceRouter.post(
  '/requests',
  emergencyLimiter,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role === 'EDITOR') {
        return res.status(403).json({ error: 'Forbidden', message: 'Editors have no access to ambulance dispatch' });
      }

      const parsed = createRequestSchema.parse(req.body);

      const citizenId = req.user ? req.user.id : 'usr-citizen-demo';
      const citizenName = req.user ? req.user.name : 'Fuqaro (Demo)';

      const result = await ambulanceService.createEmergencyRequest({
        citizenId,
        citizenName,
        citizenPhone: parsed.citizenPhone,
        lat: parsed.lat,
        lon: parsed.lon,
        description: parsed.description,
        severity: parsed.severity,
        autoDispatchDemo: true
      });

      res.status(201).json(result);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'ValidationError', details: err.errors });
      }
      // Never log sensitive patient description
      console.error('[Emergency Request Error]:', err.message || err);
      next(err);
    }
  }
);

// 4. POST /requests/:id/cancel - Citizen cancels own request
ambulanceRouter.post(
  '/requests/:id/cancel',
  (req: AuthenticatedRequest, res: Response) => {
    const existing = ambulanceStore.getRequest(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'NotFound', message: 'Request not found' });
    }

    if (req.user && req.user.role !== 'ADMIN' && existing.citizenId !== req.user.id && existing.citizenId !== 'usr-citizen-demo') {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only cancel your own emergency call' });
    }

    const updated = ambulanceService.cancelEmergencyRequest(req.params.id, req.user?.id || 'usr-citizen-demo');
    res.json(updated);
  }
);

// 5. POST /requests/:id/accept - Dispatcher accepts pending request
ambulanceRouter.post(
  '/requests/:id/accept',
  requireAuth,
  requireStaffRole('DISPATCHER'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const binding = (req as any).staffBinding;
      const targetHospitalId = binding?.hospitalId || req.body.hospitalId;

      if (!targetHospitalId) {
        return res.status(400).json({ error: 'BadRequest', message: 'Hospital id required' });
      }

      const updated = await ambulanceService.acceptEmergencyRequest(
        req.params.id,
        targetHospitalId,
        req.user!.id
      );

      res.json(updated);
    } catch (err: any) {
      console.error('[Dispatcher Accept Error]:', err.message || err);
      next(err);
    }
  }
);

// 6. POST /requests/:id/decline - Dispatcher declines pending request
ambulanceRouter.post(
  '/requests/:id/decline',
  requireAuth,
  requireStaffRole('DISPATCHER'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const binding = (req as any).staffBinding;
      const targetHospitalId = binding?.hospitalId || req.body.hospitalId;

      if (!targetHospitalId) {
        return res.status(400).json({ error: 'BadRequest', message: 'Hospital id required' });
      }

      const updated = await ambulanceService.declineEmergencyRequest(
        req.params.id,
        targetHospitalId,
        req.user!.id
      );

      res.json(updated);
    } catch (err: any) {
      console.error('[Dispatcher Decline Error]:', err.message || err);
      next(err);
    }
  }
);

// 7. POST /requests/:id/go - Driver starts transit
ambulanceRouter.post(
  '/requests/:id/go',
  requireAuth,
  requireStaffRole('DRIVER'),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const binding = (req as any).staffBinding;
      const ambulanceId = binding?.ambulanceId || req.body.ambulanceId;

      if (!ambulanceId) {
        return res.status(400).json({ error: 'BadRequest', message: 'Ambulance id required' });
      }

      const updated = ambulanceService.driverGo(req.params.id, ambulanceId, req.user!.id);
      res.json(updated);
    } catch (err: any) {
      console.error('[Driver Go Error]:', err.message || err);
      next(err);
    }
  }
);

// 8. POST /requests/:id/onscene - Driver marks arrival on scene
ambulanceRouter.post(
  '/requests/:id/onscene',
  requireAuth,
  requireStaffRole('DRIVER'),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const binding = (req as any).staffBinding;
      const ambulanceId = binding?.ambulanceId || req.body.ambulanceId;

      if (!ambulanceId) {
        return res.status(400).json({ error: 'BadRequest', message: 'Ambulance id required' });
      }

      const updated = ambulanceService.driverOnScene(req.params.id, ambulanceId, req.user!.id);
      res.json(updated);
    } catch (err: any) {
      console.error('[Driver OnScene Error]:', err.message || err);
      next(err);
    }
  }
);

// 9. POST /requests/:id/complete - Driver finishes call
ambulanceRouter.post(
  '/requests/:id/complete',
  requireAuth,
  requireStaffRole('DRIVER'),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const binding = (req as any).staffBinding;
      const ambulanceId = binding?.ambulanceId || req.body.ambulanceId;

      if (!ambulanceId) {
        return res.status(400).json({ error: 'BadRequest', message: 'Ambulance id required' });
      }

      const updated = ambulanceService.driverComplete(req.params.id, ambulanceId, req.user!.id);
      res.json(updated);
    } catch (err: any) {
      console.error('[Driver Complete Error]:', err.message || err);
      next(err);
    }
  }
);

// 10. POST /units/:id/location - Driver updates live GPS
const locationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180)
});

ambulanceRouter.post(
  '/units/:id/location',
  requireAuth,
  requireStaffRole('DRIVER'),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = locationUpdateSchema.parse(req.body);
      const binding = (req as any).staffBinding;

      if (binding && binding.ambulanceId && binding.ambulanceId !== req.params.id && req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden', message: 'You can only update your assigned ambulance location' });
      }

      const updated = ambulanceService.updateAmbulanceGps(req.params.id, parsed.lat, parsed.lon);
      res.json(updated);
    } catch (err: any) {
      console.error('[GPS Update Error]:', err.message || err);
      next(err);
    }
  }
);

// 11. Hospital & Fleet Management (ADMIN or Staff lookup)
ambulanceRouter.get('/hospitals', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json(ambulanceStore.getHospitals());
});

ambulanceRouter.post('/hospitals', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const hospital = ambulanceStore.upsertHospital(req.body);
  res.json(hospital);
});

ambulanceRouter.delete('/hospitals/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = ambulanceStore.deleteHospital(req.params.id);
  res.json({ success });
});

ambulanceRouter.get('/units', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role === 'ADMIN') {
    return res.json(ambulanceStore.getAmbulances());
  }

  const binding = ambulanceStore.getBinding(req.user!.id);
  if (binding && binding.hospitalId) {
    return res.json(ambulanceStore.getAmbulancesByHospital(binding.hospitalId));
  }

  res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
});

ambulanceRouter.post('/units', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const unit = ambulanceStore.upsertAmbulance(req.body);
  res.json(unit);
});

ambulanceRouter.delete('/units/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = ambulanceStore.deleteAmbulance(req.params.id);
  res.json({ success });
});

// 12. Staff Bindings (ADMIN only)
ambulanceRouter.get('/bindings', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json(ambulanceStore.getBindings());
});

ambulanceRouter.post('/bindings', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const binding = ambulanceStore.setBinding(req.body);
  res.json(binding);
});

ambulanceRouter.delete('/bindings/:userId', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = ambulanceStore.deleteBinding(req.params.userId);
  res.json({ success });
});

