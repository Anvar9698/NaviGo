import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { CONFIG } from './config';
import { authMiddleware } from './middleware/auth.middleware';
import { createRateLimiter } from './middleware/rate-limit.middleware';
import { authRouter } from './routes/auth.routes';
import { mapRouter } from './routes/map.routes';
import { reportsRouter } from './routes/reports.routes';
import { editorRouter } from './routes/editor.routes';
import { adminRouter } from './routes/admin.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { supportRouter } from './routes/support.routes';

const app = express();

// Security and CORS
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));

// Custom Security Headers (Part 9 Threat Model)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=(self)');
  next();
});

// Global Rate Limiter
app.use(createRateLimiter(CONFIG.rateLimits.maxRequests, CONFIG.rateLimits.windowMs));

// Authentication Middleware
app.use(authMiddleware);

// Health Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'yol-malumoti-api',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// OpenAPI 3.1 Spec Endpoint
app.get('/api/v1/openapi.json', (req: Request, res: Response) => {
  res.json({
    openapi: '3.1.0',
    info: {
      title: "Yo'l Ma'lumoti API",
      version: '1.0.0',
      description: 'API for accessible road conditions, weather, air quality, community reporting, and municipal approval workflows.'
    },
    paths: {
      '/auth/login': { post: { summary: 'Authenticate user with email and password' } },
      '/auth/register': { post: { summary: 'Register citizen account' } },
      '/map/features': { get: { summary: 'Retrieve active public road incidents & closures' } },
      '/map/weather': { get: { summary: 'Fetch live weather from Open-Meteo' } },
      '/map/air-quality': { get: { summary: 'Fetch live European AQI from Open-Meteo' } },
      '/map/geocode': { get: { summary: 'Search places via OSM Nominatim' } },
      '/map/route': { get: { summary: 'Calculate route distance, duration, and steps' } },
      '/reports': { post: { summary: 'Submit community road incident report' } },
      '/reports/my': { get: { summary: 'List reports submitted by current citizen' } },
      '/editor/reports': { get: { summary: 'Triage inbox for road editors' } },
      '/editor/map-changes': { post: { summary: 'Draft proposed map change' } },
      '/admin/map-changes/{id}/approve': { post: { summary: 'Approve and publish map change' } },
      '/admin/features/{id}/rollback': { post: { summary: 'One-click rollback of map feature' } },
      '/analytics/overview': { get: { summary: 'Aggregated analytics for analysts' } },
      '/support/chat': { post: { summary: 'AI assistant road advisory' } }
    }
  });
});

// Mount V1 API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/map', mapRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/editor', editorRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/support', supportRouter);

// Global Error Handler (Hides internal stack traces in production)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.name || 'InternalServerError',
    message: CONFIG.nodeEnv === 'production' ? 'An unexpected error occurred.' : err.message
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(CONFIG.port, () => {
    console.log(`[Yol Ma'lumoti API] Running on http://localhost:${CONFIG.port}`);
  });
}

export default app;
