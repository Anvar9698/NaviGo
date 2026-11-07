import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { dbStore } from '../db/store';
import { fetchWeatherData } from '../providers/weather.provider';
import { fetchAirQualityData } from '../providers/airquality.provider';
import { searchPlaces } from '../providers/geocoding.provider';
import { calculateRoute } from '../providers/routing.provider';
import { CONFIG } from '../config';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/auth.middleware';

export const mapRouter = Router();

// GET /api/v1/map/features - Returns active road features (accidents, traffic, roadwork, closures)
mapRouter.get('/features', (req: Request, res: Response) => {
  const features = dbStore.getActiveMapFeatures();
  return res.json({
    features,
    total: features.length,
    timestamp: new Date().toISOString()
  });
});

const UpdateFeatureSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().max(1000).optional(),
  featureType: z.enum(['accident', 'traffic', 'roadwork', 'closure', 'hazard']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isActive: z.boolean().optional()
});

// PATCH /api/v1/map/features/:id - Edit road problem/hazard (Admin or Road Engineer / Editor)
mapRouter.patch('/features/:id', requireAuth, requireRole(['ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const parsed = UpdateFeatureSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues });
  }

  const updated = dbStore.updateMapFeature(req.params.id, parsed.data);
  if (!updated) {
    return res.status(404).json({ error: 'Map feature not found' });
  }

  dbStore.appendAudit({
    id: `aud-${Date.now()}`,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: 'UPDATE_MAP_FEATURE',
    entityType: 'MAP_FEATURE',
    entityId: updated.id,
    details: `Road feature updated: ${updated.title} by ${req.user!.role}`,
    timestamp: new Date().toISOString()
  });

  return res.json({ feature: updated, message: 'Map feature successfully updated.' });
});

// DELETE /api/v1/map/features/:id - Delete / remove road problem from map (Admin or Road Engineer / Editor)
mapRouter.delete('/features/:id', requireAuth, requireRole(['ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const success = dbStore.deleteMapFeature(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Map feature not found' });
  }

  dbStore.appendAudit({
    id: `aud-${Date.now()}`,
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: 'DELETE_MAP_FEATURE',
    entityType: 'MAP_FEATURE',
    entityId: req.params.id,
    details: `Road feature ${req.params.id} deleted from map by ${req.user!.role}`,
    timestamp: new Date().toISOString()
  });

  return res.json({ message: 'Road feature successfully removed from public map.' });
});

// GET /api/v1/map/weather - Real Open-Meteo weather
mapRouter.get('/weather', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : CONFIG.defaultLocation.latitude;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : CONFIG.defaultLocation.longitude;
    const city = (req.query.city as string) || CONFIG.defaultLocation.city;

    const weather = await fetchWeatherData(lat, lon, city);
    return res.json(weather);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch weather', message: err.message });
  }
});

// GET /api/v1/map/air-quality - Real Open-Meteo European AQI & PM2.5/PM10
mapRouter.get('/air-quality', async (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : CONFIG.defaultLocation.latitude;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : CONFIG.defaultLocation.longitude;

    const airQuality = await fetchAirQualityData(lat, lon);
    return res.json(airQuality);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch air quality', message: err.message });
  }
});

// GET /api/v1/map/districts-weather - Mode A District Weather Points for Tashkent
mapRouter.get('/districts-weather', async (req: Request, res: Response) => {
  const districts = [
    { name: 'Yunusobod District', lat: 41.3644, lon: 69.2882, temp: 19, aqi: 28, aqiLevel: 'Good', wind: 8 },
    { name: 'Chilonzor District', lat: 41.2725, lon: 69.2045, temp: 20, aqi: 35, aqiLevel: 'Moderate', wind: 11 },
    { name: "Mirzo Ulug'bek District", lat: 41.3350, lon: 69.3400, temp: 19, aqi: 26, aqiLevel: 'Good', wind: 7 },
    { name: 'Shayxontohur (Chorsu)', lat: 41.3274, lon: 69.2346, temp: 20, aqi: 38, aqiLevel: 'Moderate', wind: 10 },
    { name: 'Sergeli District', lat: 41.2215, lon: 69.2155, temp: 21, aqi: 42, aqiLevel: 'Moderate', wind: 12 },
    { name: 'Mirobod District', lat: 41.2980, lon: 69.2850, temp: 20, aqi: 34, aqiLevel: 'Moderate', wind: 9 },
    { name: 'Yakkasaroy District', lat: 41.2850, lon: 69.2550, temp: 20, aqi: 31, aqiLevel: 'Good', wind: 9 }
  ];

  return res.json({ districts });
});

// GET /api/v1/map/geocode - Search addresses and places via OSM Nominatim
mapRouter.get('/geocode', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json([]);
    const results = await searchPlaces(q);
    return res.json(results);
  } catch (err: any) {
    return res.status(500).json({ error: 'Geocoding failed', message: err.message });
  }
});

// GET /api/v1/map/route - Calculate route using OSRM
mapRouter.get('/route', async (req: Request, res: Response) => {
  try {
    const startLat = parseFloat(req.query.startLat as string);
    const startLon = parseFloat(req.query.startLon as string);
    const endLat = parseFloat(req.query.endLat as string);
    const endLon = parseFloat(req.query.endLon as string);
    const mode = (req.query.mode as 'walk' | 'transit' | 'bike' | 'car') || 'car';
    const destinationName = (req.query.destinationName as string) || undefined;
    const originName = (req.query.originName as string) || undefined;

    if (isNaN(startLat) || isNaN(startLon) || isNaN(endLat) || isNaN(endLon)) {
      return res.status(400).json({ error: 'Invalid coordinate parameters' });
    }

    const route = await calculateRoute(startLat, startLon, endLat, endLon, mode, destinationName, originName);
    return res.json(route);
  } catch (err: any) {
    return res.status(500).json({ error: 'Route calculation failed', message: err.message });
  }
});
