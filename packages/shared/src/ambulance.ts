import { RouteStep } from './types';

export interface AmbulanceRouteStep extends RouteStep {
  coordinate?: [number, number]; // [lon, lat]
}

export type AmbulanceStaffRole = 'DISPATCHER' | 'DRIVER';

export interface AmbulanceStaffBinding {
  userId: string;
  staffRole: AmbulanceStaffRole;
  hospitalId: string;
  ambulanceId?: string;
}

import { MapFeature } from './types';

export type EmergencyServiceType = '103' | '102' | '101' | '104' | '1050';

export type HospitalType = 'state' | 'private';

export interface Hospital {
  id: string;
  name: string;
  type: HospitalType;
  serviceType?: EmergencyServiceType;
  lat: number;
  lon: number;
  isDemo: boolean;
  address?: string;
}

export type AmbulanceStatus = 'free' | 'assigned' | 'enroute' | 'onscene' | 'busy' | 'offline';

export interface AmbulanceUnit {
  id: string;
  hospitalId: string;
  serviceType?: EmergencyServiceType;
  plateNumber: string;
  lat: number;
  lon: number;
  baseLat: number;
  baseLon: number;
  status: AmbulanceStatus;
  currentRequestId?: string;
  lastLocationUpdate?: string;
}

export type EmergencySeverity = 1 | 2 | 3; // 1: Life-threatening, 2: Serious, 3: Not urgent

export type EmergencyRequestStatus = 
  | 'pending'
  | 'assigned'
  | 'enroute'
  | 'onscene'
  | 'done'
  | 'unassigned'
  | 'cancelled';

export interface EmergencyRequest {
  id: string;
  serviceType?: EmergencyServiceType;
  citizenId: string;
  citizenName: string;
  citizenPhone?: string;
  lat: number;
  lon: number;
  description: string;
  severity: EmergencySeverity;
  status: EmergencyRequestStatus;
  mediaUrl?: string; // For 1050 photo/video upload
  mediaType?: 'image' | 'video';
  targetHospitalId?: string;
  triedHospitalIds: string[];
  assignedAmbulanceId?: string;
  assignedHospitalId?: string;
  routeGeometry?: [number, number][];
  routeSteps?: AmbulanceRouteStep[];
  hazardWarnings?: string[];
  routeIncidents?: MapFeature[];
  trafficDelayMinutes?: number;
  etaMinutes?: number;
  distanceMeters?: number;
  timeoutAt?: string;
  minutesSaved?: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface AmbulanceStats {
  totalCalls: number;
  activeCalls: number;
  completedCalls: number;
  averageMinutesSaved: number;
  baselineQueuePenaltyMinutes: number;
}

export interface AmbulanceStatePayload {
  serviceType?: EmergencyServiceType;
  role: 'CITIZEN' | 'DISPATCHER' | 'DRIVER' | 'ADMIN' | 'ANALYST' | 'ANONYMOUS';
  binding?: AmbulanceStaffBinding;
  hospitals: Hospital[];
  ambulances: AmbulanceUnit[];
  activeRequest?: EmergencyRequest | null;
  pendingRequests?: EmergencyRequest[];
  assignedRequest?: EmergencyRequest | null;
  stats?: AmbulanceStats;
  timestamp: string;
}
