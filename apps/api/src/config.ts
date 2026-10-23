import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-yol-malumoti-architect-key',
  jwtExpiresIn: '24h',
  nominatimUserAgent: process.env.NOMINATIM_USER_AGENT || 'YolMalumotiUzbekistan/1.0',
  rateLimits: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 300,
    reportSubmitMax: 10
  },
  defaultLocation: {
    city: 'Tashkent',
    country: 'Uzbekistan',
    latitude: 41.2995,
    longitude: 69.2401
  }
};
