import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store';
import { fetchWeatherData } from '../providers/weather.provider';
import { fetchAirQualityData } from '../providers/airquality.provider';
import { searchPlaces } from '../providers/geocoding.provider';
import { calculateRoute } from '../providers/routing.provider';
import { CONFIG } from '../config';

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
    const mode = (req.query.mode as 'walk' | 'transit' | 'car') || 'car';

    if (isNaN(startLat) || isNaN(startLon) || isNaN(endLat) || isNaN(endLon)) {
      return res.status(400).json({ error: 'Invalid coordinate parameters' });
    }

    const route = await calculateRoute(startLat, startLon, endLat, endLon, mode);
    return res.json(route);
  } catch (err: any) {
    return res.status(500).json({ error: 'Route calculation failed', message: err.message });
  }
});
