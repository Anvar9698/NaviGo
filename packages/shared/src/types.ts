export type UserRole = 'USER' | 'EDITOR' | 'ANALYST' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export type ReportCategory = 
  | 'damage'        // Road damage / potholes
  | 'closure'       // Unexpected closure
  | 'construction'  // Road work / repairs
  | 'hazard'        // Fallen object / obstruction
  | 'signage'       // Missing or damaged signage
  | 'transit'       // Public transport disruption
  | 'map_error'     // Incorrect map info
  | 'other';

export type ReportStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'TRIAGED'
  | 'UNDER_REVIEW'
  | 'NEEDS_INFORMATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'RESOLVED'
  | 'EXPIRED';

export type ReportSeverity = 'low' | 'medium' | 'high' | 'urgent';

export interface Report {
  id: string;
  reporterId: string;
  category: ReportCategory;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  imageUrl?: string;
  severity: ReportSeverity;
  status: ReportStatus;
  statusNotes?: string;
  duplicateOfId?: string;
  createdAt: string;
  updatedAt: string;
}

export type DataSourceType = 'Live' | 'Reported by people' | 'Official';

export interface MapFeature {
  id: string;
  featureType: 'accident' | 'traffic' | 'roadwork' | 'closure' | 'hazard';
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  severity: ReportSeverity;
  source: DataSourceType;
  isActive: boolean;
  verifiedAt: string;
  expiresAt?: string;
  linkedReportId?: string;
}

export interface ProposedMapChange {
  id: string;
  reportId?: string;
  proposedByUserId: string;
  changeType: 'add_hazard' | 'closure' | 'lane_restriction' | 'correct_geometry';
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  validFrom: string;
  validUntil: string;
  createdAt: string;
  adminNotes?: string;
}

export interface WeatherData {
  city: string;
  country: string;
  temperatureC: number;
  apparentTemperatureC: number;
  conditionCode: number;
  conditionText: string;
  weatherIcon: string;
  windSpeedKmh: number;
  humidityPercent: number;
  precipitationMm: number;
  lastUpdated: string;
  source: string;
  forecast: {
    date: string;
    dayName: string;
    maxTempC: number;
    minTempC: number;
    conditionText: string;
  }[];
}

export interface AirQualityData {
  aqi: number;
  aqiLevel: 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  methodology: string; // e.g. "European AQI (Open-Meteo)"
  pm2_5: number;
  pm10: number;
  advice: string;
  lastUpdated: string;
  source: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  senderType: 'USER' | 'AI_ASSISTANT' | 'STAFF';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface GeocodeResult {
  displayName: string;
  latitude: number;
  longitude: number;
  type: string;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuverType?: 'turn-right' | 'turn-left' | 'straight' | 'u-turn' | 'arrive';
}

export interface RouteResult {
  originName?: string;
  destinationName?: string;
  distanceMeters: number;
  durationMinutes: number;
  mode: 'walk' | 'transit' | 'car' | 'bike';
  coordinates: [number, number][]; // [lon, lat]
  steps: RouteStep[];
  warnings: string[];
  nearbyRoads?: string[];
  nearbyIncidentsCount?: number;
  routeIncidents?: MapFeature[];
  destinationWeather?: WeatherData;
  destinationAirQuality?: AirQualityData;
}
