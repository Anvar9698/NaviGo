import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  port: parseInt(process.env.PORT || '4001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-yol-malumoti-architect-key',
  jwtExpiresIn: '24h',
  nominatimUserAgent: process.env.NOMINATIM_USER_AGENT || 'YolMalumotiUzbekistan/1.0',
  rateLimits: {
    windowMs: 60 * 1000,
    maxRequests: 50000,
    reportSubmitMax: 500,
    emergencyMax: 500
  },
  ambulance: {
    acceptTimeoutSeconds: parseInt(process.env.AMBULANCE_ACCEPT_TIMEOUT_SECONDS || '60', 10),
    queuePenaltySeconds: parseInt(process.env.AMBULANCE_QUEUE_PENALTY_SECONDS || '720', 10),
    simulateAmbulances: process.env.SIMULATE_AMBULANCES !== 'false',
    simSpeedup: parseFloat(process.env.AMBULANCE_SIM_SPEEDUP || '8'),
    retentionDays: parseInt(process.env.AMBULANCE_RETENTION_DAYS || '30', 10)
  },
  defaultLocation: {
    city: 'Tashkent',
    country: 'Uzbekistan',
    latitude: 41.2995,
    longitude: 69.2401
  }
};
