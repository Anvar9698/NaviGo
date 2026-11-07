import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AmbulanceUnit, ApproachingEmergencyAlert } from '@yol/shared';
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

    const email = req.user.email?.toLowerCase() || '';
    const isDriver = email.includes('driver');
    const isDisp = email.includes('disp');

    if (role === 'DRIVER' && isDriver) {
      return next();
    }
    if (role === 'DISPATCHER' && isDisp) {
      return next();
    }
    if (role === 'ANY' && (isDriver || isDisp)) {
      return next();
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

// 1. GET /state - Live polled state for the current user and emergency service
ambulanceRouter.get('/state', (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role === 'EDITOR') {
    return res.status(403).json({ error: 'Forbidden', message: 'Editors have no access to emergency dispatch' });
  }

  const requestedService = (req.query.service as any) || undefined;
  const state = ambulanceService.getStateForUser(req.user, requestedService);
  res.json(state);
});

// 2. GET /stats - Overall performance stats
ambulanceRouter.get('/stats', (req: Request, res: Response) => {
  const requestedService = (req.query.service as any) || undefined;
  const stats = ambulanceService.getStats(requestedService);
  res.json(stats);
});

// 3. POST /requests - Citizen creates emergency request (103, 102, 101, 104, 1050)
const createRequestSchema = z.object({
  serviceType: z.enum(['103', '102', '101', '104', '1050']).optional().default('103'),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  description: z.string().max(1000).optional().default(''),
  severity: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().default(1),
  citizenPhone: z.string().optional(),
  citizenName: z.string().optional(),
  citizenId: z.string().optional(),
  mediaUrl: z.string().optional(),
  mediaType: z.enum(['image', 'video']).optional(),
  autoDispatchDemo: z.boolean().optional()
});

ambulanceRouter.post(
  '/requests',
  emergencyLimiter,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role === 'EDITOR') {
        return res.status(403).json({ error: 'Forbidden', message: 'Editors have no access to emergency dispatch' });
      }

      const parsed = createRequestSchema.parse(req.body);

      const citizenId = req.user ? req.user.id : (parsed.citizenId || 'usr-citizen-demo');
      const citizenName = req.user ? req.user.name : (parsed.citizenName || 'Fuqaro (Demo)');

      const serviceType = parsed.serviceType || '103';
      let desc = (parsed.description || '').trim();
      if (!desc) {
        if (serviceType === '101') desc = "101 Yong'in xavfsizligi shoshilinch chaqiruvi (Tezkor o't o'chirish)";
        else if (serviceType === '102') desc = "102 Ichki ishlar tezkor chaqiruvi";
        else if (serviceType === '104') desc = "104 Favqulodda gaz xizmati shoshilinch chaqiruvi (Gaz sizib chiqishi xavfi)";
        else if (serviceType === '1050') desc = "1050 FVV Maxsus qutqaruv xizmati chaqiruvi";
        else desc = "103 Tez tibbiy yordam chaqiruvi";
      }

      const result = await ambulanceService.createEmergencyRequest({
        serviceType,
        citizenId,
        citizenName,
        citizenPhone: parsed.citizenPhone,
        lat: parsed.lat,
        lon: parsed.lon,
        description: desc,
        severity: parsed.severity,
        mediaUrl: parsed.mediaUrl,
        mediaType: parsed.mediaType,
        autoDispatchDemo: Boolean(req.body.autoDispatchDemo)
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
        req.user!.id,
        req.body.ambulanceId
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
      const existing = ambulanceStore.getRequest(req.params.id);
      const ambulanceId = req.body.ambulanceId || existing?.assignedAmbulanceId || binding?.ambulanceId || 'amb-tash-101';

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
      const existing = ambulanceStore.getRequest(req.params.id);
      const ambulanceId = req.body.ambulanceId || existing?.assignedAmbulanceId || binding?.ambulanceId || 'amb-tash-101';

      const updated = ambulanceService.driverOnScene(req.params.id, ambulanceId, req.user!.id);
      res.json(updated);
    } catch (err: any) {
      console.error('[Driver OnScene Error]:', err.message || err);
      next(err);
    }
  }
);

// 9. POST /requests/:id/complete - Driver finishes call or Citizen confirms completion
ambulanceRouter.post(
  '/requests/:id/complete',
  requireAuth,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const binding = (req as any).staffBinding || ambulanceStore.getBinding(req.user!.id);
      const existing = ambulanceStore.getRequest(req.params.id);
      const ambulanceId = req.body.ambulanceId || existing?.assignedAmbulanceId || binding?.ambulanceId || 'amb-tash-101';

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

ambulanceRouter.post('/units', requireAuth, requireStaffRole('DISPATCHER'), (req: AuthenticatedRequest, res: Response) => {
  const body = req.body;
  const binding = (req as any).staffBinding || ambulanceStore.getBinding(req.user!.id);
  const hospitalId = body.hospitalId || binding?.hospitalId || 'hosp-tash-1';
  const hospital = ambulanceStore.getHospital(hospitalId);

  const newUnit: AmbulanceUnit = {
    id: body.id || `amb-${Date.now().toString().slice(-4)}`,
    hospitalId,
    serviceType: body.serviceType || hospital?.serviceType || '103',
    plateNumber: body.plateNumber || '01 105 TAA',
    lat: body.lat ?? (hospital?.lat || 41.2721),
    lon: body.lon ?? (hospital?.lon || 69.2155),
    baseLat: body.baseLat ?? (hospital?.lat || 41.2721),
    baseLon: body.baseLon ?? (hospital?.lon || 69.2155),
    status: 'free'
  };

  const unit = ambulanceStore.upsertAmbulance(newUnit);
  res.status(201).json(unit);
});

ambulanceRouter.delete('/units/:id', requireAuth, requireStaffRole('DISPATCHER'), (req: AuthenticatedRequest, res: Response) => {
  const existing = ambulanceStore.getAmbulance(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'NotFound', message: 'Mashina topilmadi' });
  }
  if (existing.status !== 'free') {
    return res.status(400).json({ error: 'BadRequest', message: 'Band yoki chaqiruvda bo\'lgan mashinani o\'chirib bo\'lmaydi' });
  }

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

// 13. V2X Green Corridor Alerts for Drivers & Municipalities
let demoV2XAlert: ApproachingEmergencyAlert | null = null;
let demoV2XTimer: any = null;

ambulanceRouter.get('/v2x-alert', (req: Request, res: Response) => {
  const userLat = parseFloat(req.query.lat as string);
  const userLon = parseFloat(req.query.lon as string);

  if (isNaN(userLat) || isNaN(userLon)) {
    return res.json({ alert: null });
  }

  // Check if active demo alert is running
  if (demoV2XAlert) {
    return res.json({ alert: demoV2XAlert });
  }

  // Check real emergency units in enroute or assigned
  const activeRequests = ambulanceStore.getAllRequests().filter(r => r.status === 'enroute' || r.status === 'assigned');
  for (const r of activeRequests) {
    if (!r.assignedAmbulanceId) continue;
    const amb = ambulanceStore.getAmbulance(r.assignedAmbulanceId);
    if (!amb) continue;

    const dLat = (amb.lat - userLat) * (Math.PI / 180);
    const dLon = (amb.lon - userLon) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLat * (Math.PI / 180)) *
        Math.cos(amb.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const distMeters = Math.round(6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

    if (distMeters <= 1200) {
      const hosp = amb.hospitalId ? ambulanceStore.getHospital(amb.hospitalId) : undefined;
      const serviceType = r.serviceType || '103';
      const alert: ApproachingEmergencyAlert = {
        id: `v2x-${r.id}`,
        serviceType,
        serviceTitle: serviceType === '101' ? "101 Yong'in xavfsizligi" : serviceType === '102' ? "102 Ichki ishlar (YPX)" : serviceType === '104' ? "104 Favqulodda Gaz" : serviceType === '1050' ? "1050 FVV Qutqaruv" : "103 Tez Yordam",
        plateNumber: amb.plateNumber,
        distanceMeters: distMeters,
        direction: 'approaching_behind',
        ambulanceLat: amb.lat,
        ambulanceLon: amb.lon,
        targetHospitalName: hosp?.name,
        messageUz: `DIQQAT: ${serviceType} Tezkor xizmat orqangizdan ${distMeters}m masofada kelmoqda! Iltimos, o'ng qatorga o'ting va yo'l bering!`,
        messageRu: `ВНИМАНИЕ: Спецтранспорт ${serviceType} приближается сзади (${distMeters}м)! Примите вправо и уступите дорогу!`,
        messageEn: `ALERT: Emergency vehicle ${serviceType} approaching behind (${distMeters}m)! Please pull over to the right and yield!`,
        isGreenCorridorActive: true
      };
      return res.json({ alert });
    }
  }

  res.json({ alert: null });
});

ambulanceRouter.post('/demo-v2x', (req: Request, res: Response) => {
  const userLat = typeof req.body.lat === 'number' ? req.body.lat : 41.3111;
  const userLon = typeof req.body.lon === 'number' ? req.body.lon : 69.2797;
  const serviceType = req.body.serviceType || '103';

  if (demoV2XTimer) clearInterval(demoV2XTimer);

  let currentDist = 480;
  demoV2XAlert = {
    id: `demo-v2x-${Date.now()}`,
    serviceType,
    serviceTitle: serviceType === '101' ? "101 Yong'in xavfsizligi" : serviceType === '102' ? "102 Ichki ishlar (YPX)" : serviceType === '104' ? "104 Favqulodda Gaz" : serviceType === '1050' ? "1050 FVV Qutqaruv" : "103 Tez Yordam",
    plateNumber: '01 103 TAA',
    distanceMeters: currentDist,
    direction: 'approaching_behind',
    ambulanceLat: userLat - 0.0035,
    ambulanceLon: userLon - 0.0035,
    targetHospitalName: "Respublika Shoshilinch Tibbiy Markazi (16)",
    messageUz: `DIQQAT: ${serviceType} Tezkor xizmat orqangizdan ${currentDist}m masofada kelmoqda! Iltimos, o'ng qatorga o'ting va yo'l bering!`,
    messageRu: `ВНИМАНИЕ: Спецтранспорт ${serviceType} приближается сзади (${currentDist}м)! Примите вправо и уступите дорогу!`,
    messageEn: `ALERT: Emergency vehicle ${serviceType} approaching behind (${currentDist}m)! Please pull over to the right and yield!`,
    isGreenCorridorActive: true
  };

  demoV2XTimer = setInterval(() => {
    if (!demoV2XAlert) {
      clearInterval(demoV2XTimer);
      return;
    }
    currentDist -= 60;
    if (currentDist <= 20) {
      demoV2XAlert.direction = 'passed';
      demoV2XAlert.distanceMeters = 0;
      demoV2XAlert.messageUz = "103 Tez Yordam o'tib ketdi. Yashil yo'lak uchun rahmat!";
      demoV2XAlert.messageRu = "Спецтранспорт 103 проехал. Спасибо за содействие!";
      demoV2XAlert.messageEn = "103 Emergency vehicle passed. Thank you for yielding!";
      setTimeout(() => {
        demoV2XAlert = null;
        clearInterval(demoV2XTimer);
      }, 4000);
    } else {
      demoV2XAlert.distanceMeters = currentDist;
      demoV2XAlert.messageUz = `DIQQAT: ${serviceType} Tezkor xizmat orqangizdan ${currentDist}m masofada kelmoqda! Iltimos, o'ng qatorga o'ting va yo'l bering!`;
    }
  }, 1200);

  res.json({ success: true, alert: demoV2XAlert });
});


