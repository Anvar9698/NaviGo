import { Request, Response, NextFunction } from 'express';
import { CONFIG } from '../config';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipMap = new Map<string, RateLimitRecord>();

export function clearRateLimits() {
  ipMap.clear();
}

export function createRateLimiter(maxRequests = 50000, windowMs = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    // In development or local access, do not block users or polling
    if (CONFIG.nodeEnv !== 'production') {
      return next();
    }

    // Always exempt auth and emergency service calls from strict limits
    if (req.path.startsWith('/api/v1/auth') || req.path.startsWith('/api/v1/ambulance')) {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip.includes('127.0.0.1') ||
      ip.includes('::ffff:127.0.0.1') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.') ||
      ip === 'localhost' ||
      req.hostname === 'localhost'
    ) {
      return next();
    }

    const now = Date.now();
    const record = ipMap.get(ip);

    if (!record || now > record.resetTime) {
      ipMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please wait a moment before trying again.'
      });
    }

    record.count++;
    next();
  };
}
