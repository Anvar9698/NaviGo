import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  UserRole,
  Report,
  ReportCategory,
  ReportStatus,
  ReportSeverity,
  MapFeature,
  ProposedMapChange,
  AuditLogEntry,
  SupportMessage,
  WeatherData,
  AirQualityData
} from '@yol/shared';

// Spatial distance calculation (Haversine Formula) in kilometers
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface UserEntity extends User {
  passwordHash: string;
}

export interface ProviderHealth {
  providerName: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  lastSync: string;
  latencyMs: number;
  message: string;
}

class ResilientDataStore {
  private users: Map<string, UserEntity> = new Map();
  private reports: Map<string, Report> = new Map();
  private mapFeatures: Map<string, MapFeature> = new Map();
  private proposedChanges: Map<string, ProposedMapChange> = new Map();
  private auditLogs: AuditLogEntry[] = [];
  private supportMessages: Map<string, SupportMessage[]> = new Map();
  private providerHealthStatus: Map<string, ProviderHealth> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const defaultHash = bcrypt.hashSync('Password123!', salt);

    // 1. Seed Roles and Users
    const adminUser: UserEntity = {
      id: 'usr-admin-1',
      email: 'admin@yol.uz',
      name: 'Aziz Rakhimov (Chief Administrator)',
      role: 'ADMIN',
      twoFactorEnabled: true,
      createdAt: new Date().toISOString(),
      passwordHash: defaultHash
    };

    const editorUser: UserEntity = {
      id: 'usr-editor-1',
      email: 'editor@yol.uz',
      name: 'Nigora Karimova (Road Verification Editor)',
      role: 'EDITOR',
      twoFactorEnabled: true,
      createdAt: new Date().toISOString(),
      passwordHash: defaultHash
    };

    const analystUser: UserEntity = {
      id: 'usr-analyst-1',
      email: 'analyst@yol.uz',
      name: 'Jasur Umarov (Mobility Analyst)',
      role: 'ANALYST',
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      passwordHash: defaultHash
    };

    const citizenUser: UserEntity = {
      id: 'usr-citizen-1',
      email: 'citizen@yol.uz',
      name: 'Malika Alimova (Citizen)',
      role: 'USER',
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      passwordHash: defaultHash
    };

    [adminUser, editorUser, analystUser, citizenUser].forEach(u => this.users.set(u.id, u));

    // 2. Seed Verified Tashkent Map Features
    const nowIso = new Date().toISOString();
    const seededFeatures: MapFeature[] = [
      {
        id: 'feat-1',
        featureType: 'accident',
        title: "Amir Temur xiyoboni yaqinida YTH / To'qnashuv",
        description: "Ikki avtomobil to'qnashuvi. O'ng qator to'silgan, YPX va tez yordam joyida.",
        latitude: 41.3111,
        longitude: 69.2797,
        severity: 'high',
        source: 'Live',
        isActive: true,
        verifiedAt: nowIso
      },
      {
        id: 'feat-2',
        featureType: 'accident',
        title: "Chilonzor ko'chasida to'qnashuv",
        description: "Yengil to'qnashuv sodir bo'lgan. O'ng qator bo'ylab harakat sekinlashgan.",
        latitude: 41.2725,
        longitude: 69.2045,
        severity: 'medium',
        source: 'Reported by people',
        isActive: true,
        verifiedAt: nowIso
      },
      {
        id: 'feat-3',
        featureType: 'traffic',
        title: "Bunyodkor shoh ko'chasida kuchli tirbandlik",
        description: "Xalqlar do'stligi maydoni tomon kuchli tirbandlik kuzatilmoqda.",
        latitude: 41.3032,
        longitude: 69.2435,
        severity: 'high',
        source: 'Live',
        isActive: true,
        verifiedAt: nowIso
      },
      {
        id: 'feat-4',
        featureType: 'traffic',
        title: "Mustaqillik shoh ko'chasida tirbandlik",
        description: "Tig'iz vaqt kechikishi (taxminan +12 daqiqa).",
        latitude: 41.3195,
        longitude: 69.2885,
        severity: 'medium',
        source: 'Reported by people',
        isActive: true,
        verifiedAt: nowIso
      },
      {
        id: 'feat-5',
        featureType: 'roadwork',
        title: "Navoiy shoh ko'chasida yer osti ta'miri",
        description: "Muhandislik quvurlari ta'miri sababli ikki qator qisman yopilgan.",
        latitude: 41.3241,
        longitude: 69.2558,
        severity: 'medium',
        source: 'Official',
        isActive: true,
        verifiedAt: nowIso
      },
      {
        id: 'feat-6',
        featureType: 'closure',
        title: "Buyuk Ipak Yo'lida vaqtincha ta'mir",
        description: "Asfalt yotqizish ishlari sababli qisman to'silgan. Aylanma yo'l Mirzo Ulug'bek orqali.",
        latitude: 41.3289,
        longitude: 69.3350,
        severity: 'urgent',
        source: 'Official',
        isActive: true,
        verifiedAt: nowIso
      },
      // Regional & Intercity Highway Features (A373 towards Chust/Namangan, M39 towards Samarkand, Chirchiq)
      {
        id: 'feat-7',
        featureType: 'roadwork',
        title: "Ohangaron trassasida asfalt yotqizish ishlari",
        description: "A373 trassasida o'ng qator yopilgan. Harakat tezligi 50 km/soatgacha cheklangan.",
        latitude: 40.9086,
        longitude: 69.6384,
        severity: 'medium',
        source: 'Reported by people',
        isActive: true,
        verifiedAt: nowIso
      },
      {
        id: 'feat-8',
        featureType: 'traffic',
        title: "Angren aylanma trassasida tirbandlik",
        description: "Yuk transportlari oqimi va aylanma yo'ldagi tirbandlik (+15 daqiqa kechikish).",
        latitude: 41.0094,
        longitude: 70.0753,
        severity: 'medium',
        source: 'Reported by people',
        isActive: true,
        verifiedAt: nowIso
      },
      {
        id: 'feat-9',
        featureType: 'hazard',
        title: "Qamchiq dovonida tuman va ta'mirlash ishlari",
        description: "A373 Qamchiq dovoni qismida ko'rish masofasi cheklangan va xavfli burilishlarda ta'mir olib borilmoqda.",
        latitude: 41.0928,
        longitude: 70.5194,
        severity: 'urgent',
        source: 'Official',
        isActive: true,
        verifiedAt: nowIso
      },
      {
        id: 'feat-10',
        featureType: 'roadwork',
        title: "Chust shahriga kirish yo'lida ta'mirlash",
        description: "Chust markaziy kirish ko'chasida yo'l qoplamasi yangilanmoqda. Haydovchilardan ehtiyotkorlik so'raladi.",
        latitude: 41.0097,
        longitude: 71.2289,
        severity: 'medium',
        source: 'Reported by people',
        isActive: true,
        verifiedAt: nowIso
      },
      {
        id: 'feat-11',
        featureType: 'roadwork',
        title: "M39 Chinoz ko'prigi yaqinida yo'l ta'miri",
        description: "M39 magistralida ko'prik usti ta'miri sababli chap qator vaqtincha to'silgan.",
        latitude: 40.9412,
        longitude: 68.7510,
        severity: 'medium',
        source: 'Official',
        isActive: true,
        verifiedAt: nowIso
      },
      {
        id: 'feat-12',
        featureType: 'traffic',
        title: "Samarqand shahriga kirish trassasida tirbandlik",
        description: "M39 Samarqand kirish qismida tig'iz soatdagi transport tirbandligi (+12 daqiqa).",
        latitude: 39.6542,
        longitude: 66.9597,
        severity: 'medium',
        source: 'Reported by people',
        isActive: true,
        verifiedAt: nowIso
      },
      {
        id: 'feat-13',
        featureType: 'roadwork',
        title: "Chirchiq yo'nalishida yo'l kengaytirish",
        description: "Chirchiq shahriga kirish ko'chasida qo'shimcha qator qurilishi davom etmoqda.",
        latitude: 41.4688,
        longitude: 69.5822,
        severity: 'low',
        source: 'Official',
        isActive: true,
        verifiedAt: nowIso
      }
    ];

    seededFeatures.forEach(f => this.mapFeatures.set(f.id, f));

    // 3. Seed Initial Community Reports
    const seededReports: Report[] = [
      {
        id: 'rep-1',
        reporterId: citizenUser.id,
        category: 'damage',
        title: 'Deep pothole on Beruniy Metro exit',
        description: 'Substantial pothole causing wheel damage for lower sedans.',
        latitude: 41.3442,
        longitude: 69.2065,
        accuracyMeters: 6,
        severity: 'medium',
        status: 'SUBMITTED',
        createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString()
      },
      {
        id: 'rep-2',
        reporterId: citizenUser.id,
        category: 'hazard',
        title: 'Fallen tree branch on Minor Canal road',
        description: 'Large willow branch obstructing cyclist and pedestrian path.',
        latitude: 41.3320,
        longitude: 69.2830,
        accuracyMeters: 4,
        severity: 'high',
        status: 'UNDER_REVIEW',
        statusNotes: 'Editor Nigora verified via Municipal CCTV.',
        createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString()
      }
    ];

    seededReports.forEach(r => this.reports.set(r.id, r));

    // 4. Seed Proposed Map Change for Admin Review
    const proposedChange: ProposedMapChange = {
      id: 'prop-1',
      reportId: 'rep-2',
      proposedByUserId: editorUser.id,
      changeType: 'add_hazard',
      title: 'Pedestrian and bike lane obstruction near Minor Canal',
      description: 'Mark lane obstruction until municipal cleanup arrives.',
      latitude: 41.3320,
      longitude: 69.2830,
      status: 'PENDING_APPROVAL',
      validFrom: nowIso,
      validUntil: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString()
    };
    this.proposedChanges.set(proposedChange.id, proposedChange);

    // 5. Seed Audit Log Entries
    this.appendAudit({
      id: uuidv4(),
      actorId: adminUser.id,
      actorEmail: adminUser.email,
      actorRole: 'ADMIN',
      action: 'SYSTEM_BOOTSTRAP',
      entityType: 'SYSTEM',
      entityId: 'global',
      details: 'System initialized with verified Tashkent base map data',
      timestamp: nowIso
    });

    // 6. Provider Health Initial Status
    this.providerHealthStatus.set('Open-Meteo Weather', {
      providerName: 'Open-Meteo Weather',
      status: 'ONLINE',
      lastSync: nowIso,
      latencyMs: 142,
      message: 'Operating normally. CC BY 4.0'
    });
    this.providerHealthStatus.set('Open-Meteo Air Quality', {
      providerName: 'Open-Meteo Air Quality',
      status: 'ONLINE',
      lastSync: nowIso,
      latencyMs: 158,
      message: 'European AQI stream operational'
    });
    this.providerHealthStatus.set('OSM Nominatim Geocoder', {
      providerName: 'OSM Nominatim Geocoder',
      status: 'ONLINE',
      lastSync: nowIso,
      latencyMs: 210,
      message: 'Rate limit strictly respected (1 req/sec)'
    });
    this.providerHealthStatus.set('OSRM Routing Machine', {
      providerName: 'OSRM Routing Machine',
      status: 'ONLINE',
      lastSync: nowIso,
      latencyMs: 180,
      message: 'Pedestrian and motor vehicle routing active'
    });
    this.providerHealthStatus.set('Traffic Continuous Feed', {
      providerName: 'Traffic Continuous Feed',
      status: 'DEGRADED',
      lastSync: nowIso,
      latencyMs: 0,
      message: 'Continuous sensor feed offline; displaying verified community & official alerts'
    });
  }

  // --- User Methods ---
  public getUserByEmail(email: string): UserEntity | undefined {
    return Array.from(this.users.values()).find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );
  }

  public getUserById(id: string): UserEntity | undefined {
    return this.users.get(id);
  }

  public createUser(userData: {
    email: string;
    name: string;
    passwordHash: string;
    role?: UserRole;
  }): UserEntity {
    const newUser: UserEntity = {
      id: `usr-${uuidv4().slice(0, 8)}`,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'USER',
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      passwordHash: userData.passwordHash
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  public updateUserRole(userId: string, newRole: UserRole): UserEntity | undefined {
    const user = this.users.get(userId);
    if (!user) return undefined;
    user.role = newRole;
    this.users.set(userId, user);
    return user;
  }

  public getAllUsers(): User[] {
    return Array.from(this.users.values()).map(({ passwordHash, ...user }) => user);
  }

  // --- Report Methods ---
  public createReport(reportData: {
    reporterId: string;
    category: ReportCategory;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    imageUrl?: string;
    severity?: ReportSeverity;
  }): { report: Report; duplicateOf?: Report } {
    const id = `rep-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    // Duplicate detection: check if there's an existing open report in the same category within 150m
    const allReports = Array.from(this.reports.values());
    let duplicateOf: Report | undefined;

    for (const r of allReports) {
      if (
        r.category === reportData.category &&
        ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED'].includes(r.status)
      ) {
        const distKm = calculateHaversineDistanceKm(
          reportData.latitude,
          reportData.longitude,
          r.latitude,
          r.longitude
        );
        if (distKm <= 0.15) {
          // Within 150 meters
          duplicateOf = r;
          break;
        }
      }
    }

    const report: Report = {
      id,
      reporterId: reportData.reporterId,
      category: reportData.category,
      title: reportData.title,
      description: reportData.description,
      latitude: reportData.latitude,
      longitude: reportData.longitude,
      accuracyMeters: reportData.accuracyMeters,
      imageUrl: reportData.imageUrl,
      severity: reportData.severity || 'medium',
      status: 'SUBMITTED',
      duplicateOfId: duplicateOf ? duplicateOf.id : undefined,
      createdAt: now,
      updatedAt: now
    };

    // Immediately publish as an active map feature so ALL users see it immediately on the map!
    let featureType: MapFeature['featureType'] = 'hazard';
    if (reportData.category === 'closure') featureType = 'closure';
    else if (reportData.category === 'construction' || reportData.category === 'damage') featureType = 'roadwork';
    else if (reportData.category === 'transit') featureType = 'traffic';
    else if (reportData.category === 'hazard') featureType = 'hazard';

    const mapFeature: MapFeature = {
      id: `feat-rep-${id.replace('rep-', '')}`,
      featureType,
      title: reportData.title,
      description: reportData.description || 'Reported by people on the road',
      latitude: reportData.latitude,
      longitude: reportData.longitude,
      severity: reportData.severity || 'medium',
      source: 'Reported by people',
      isActive: true,
      verifiedAt: now,
      linkedReportId: id
    };
    this.mapFeatures.set(mapFeature.id, mapFeature);

    this.reports.set(id, report);
    return { report, duplicateOf };
  }

  public getReportById(id: string): Report | undefined {
    return this.reports.get(id);
  }

  public getReportsByReporter(reporterId: string): Report[] {
    return Array.from(this.reports.values())
      .filter(r => r.reporterId === reporterId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllReports(): Report[] {
    return Array.from(this.reports.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public updateReportStatus(
    reportId: string,
    status: ReportStatus,
    notes?: string
  ): Report | undefined {
    const report = this.reports.get(reportId);
    if (!report) return undefined;
    report.status = status;
    if (notes) report.statusNotes = notes;
    report.updatedAt = new Date().toISOString();
    this.reports.set(reportId, report);
    return report;
  }

  // --- Map Feature Methods ---
  public getActiveMapFeatures(): MapFeature[] {
    return Array.from(this.mapFeatures.values()).filter(f => f.isActive);
  }

  public getMapFeatureById(id: string): MapFeature | undefined {
    return this.mapFeatures.get(id);
  }

  public addMapFeature(feature: Omit<MapFeature, 'id' | 'verifiedAt' | 'isActive'>): MapFeature {
    const id = `feat-${uuidv4().slice(0, 8)}`;
    const newFeature: MapFeature = {
      ...feature,
      id,
      isActive: true,
      verifiedAt: new Date().toISOString()
    };
    this.mapFeatures.set(id, newFeature);
    return newFeature;
  }

  public rollbackMapFeature(featureId: string): boolean {
    const feature = this.mapFeatures.get(featureId);
    if (!feature) return false;
    feature.isActive = false;
    this.mapFeatures.set(featureId, feature);
    return true;
  }

  public updateMapFeature(featureId: string, updates: Partial<MapFeature>): MapFeature | undefined {
    const feat = this.mapFeatures.get(featureId);
    if (!feat) return undefined;
    const updated: MapFeature = {
      ...feat,
      ...updates,
      id: feat.id,
      verifiedAt: new Date().toISOString()
    };
    this.mapFeatures.set(featureId, updated);

    // Synchronize with linked report if present
    if (feat.linkedReportId) {
      const rep = this.reports.get(feat.linkedReportId);
      if (rep) {
        if (updates.title) rep.title = updates.title;
        if (updates.description) rep.description = updates.description;
        if (updates.severity) rep.severity = updates.severity;
        if (updates.latitude !== undefined) rep.latitude = updates.latitude;
        if (updates.longitude !== undefined) rep.longitude = updates.longitude;
        rep.updatedAt = new Date().toISOString();
        this.reports.set(rep.id, rep);
      }
    }
    return updated;
  }

  public deleteMapFeature(featureId: string): boolean {
    const feat = this.mapFeatures.get(featureId);
    if (!feat) return false;
    feat.isActive = false;
    this.mapFeatures.delete(featureId);

    // Also mark linked report as resolved/rejected so it's removed
    if (feat.linkedReportId) {
      const rep = this.reports.get(feat.linkedReportId);
      if (rep) {
        rep.status = 'RESOLVED';
        rep.statusNotes = 'Removed from map by road engineer / admin';
        rep.updatedAt = new Date().toISOString();
        this.reports.set(rep.id, rep);
      }
    }
    return true;
  }

  public updateReport(reportId: string, updates: Partial<Report>): Report | undefined {
    const rep = this.reports.get(reportId);
    if (!rep) return undefined;
    const updated: Report = {
      ...rep,
      ...updates,
      id: rep.id,
      updatedAt: new Date().toISOString()
    };
    this.reports.set(reportId, updated);

    // Synchronize with linked MapFeature
    const linkedFeat = Array.from(this.mapFeatures.values()).find(f => f.linkedReportId === reportId);
    if (linkedFeat) {
      if (updates.title) linkedFeat.title = updates.title;
      if (updates.description) linkedFeat.description = updates.description;
      if (updates.severity) linkedFeat.severity = updates.severity;
      if (updates.latitude !== undefined) linkedFeat.latitude = updates.latitude;
      if (updates.longitude !== undefined) linkedFeat.longitude = updates.longitude;
      if (updates.status === 'REJECTED' || updates.status === 'RESOLVED') {
        linkedFeat.isActive = false;
        this.mapFeatures.delete(linkedFeat.id);
      } else {
        this.mapFeatures.set(linkedFeat.id, linkedFeat);
      }
    }
    return updated;
  }

  public deleteReport(reportId: string): boolean {
    const rep = this.reports.get(reportId);
    if (!rep) return false;
    this.reports.delete(reportId);

    // Delete linked MapFeature
    const linkedFeat = Array.from(this.mapFeatures.values()).find(f => f.linkedReportId === reportId);
    if (linkedFeat) {
      linkedFeat.isActive = false;
      this.mapFeatures.delete(linkedFeat.id);
    }
    return true;
  }

  // --- Proposed Changes & Approval Methods ---
  public createProposedChange(data: Omit<ProposedMapChange, 'id' | 'createdAt' | 'status'>): ProposedMapChange {
    const id = `prop-${uuidv4().slice(0, 8)}`;
    const change: ProposedMapChange = {
      ...data,
      id,
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString()
    };
    this.proposedChanges.set(id, change);
    return change;
  }

  public getProposedChanges(): ProposedMapChange[] {
    return Array.from(this.proposedChanges.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public approveProposedChange(changeId: string, adminUserId: string): { change: ProposedMapChange; publishedFeature: MapFeature } | null {
    const change = this.proposedChanges.get(changeId);
    if (!change || change.status !== 'PENDING_APPROVAL') return null;

    change.status = 'APPROVED';
    this.proposedChanges.set(changeId, change);

    // Map the change into a published MapFeature
    let featureType: MapFeature['featureType'] = 'hazard';
    if (change.changeType === 'closure') featureType = 'closure';
    else if (change.changeType === 'lane_restriction') featureType = 'roadwork';

    const publishedFeature = this.addMapFeature({
      featureType,
      title: change.title,
      description: change.description,
      latitude: change.latitude,
      longitude: change.longitude,
      severity: 'high',
      source: 'Official',
      linkedReportId: change.reportId
    });

    // If linked to a report, clean up temporary community feature and mark report PUBLISHED
    if (change.reportId) {
      const existingCommunityFeat = Array.from(this.mapFeatures.values()).find(
        f => f.linkedReportId === change.reportId && f.source === 'Reported by people'
      );
      if (existingCommunityFeat) {
        existingCommunityFeat.isActive = false;
        this.mapFeatures.delete(existingCommunityFeat.id);
      }
      this.updateReportStatus(change.reportId, 'PUBLISHED', 'Approved and published to public map');
    }

    this.appendAudit({
      id: uuidv4(),
      actorId: adminUserId,
      actorEmail: this.getUserById(adminUserId)?.email || 'admin@yol.uz',
      actorRole: 'ADMIN',
      action: 'APPROVE_MAP_CHANGE',
      entityType: 'PROPOSED_CHANGE',
      entityId: changeId,
      details: `Published map feature ${publishedFeature.id}: ${publishedFeature.title}`,
      timestamp: new Date().toISOString()
    });

    return { change, publishedFeature };
  }

  public rejectProposedChange(changeId: string, adminUserId: string, reason: string): ProposedMapChange | null {
    const change = this.proposedChanges.get(changeId);
    if (!change) return null;
    change.status = 'REJECTED';
    change.adminNotes = reason;
    this.proposedChanges.set(changeId, change);

    if (change.reportId) {
      this.updateReportStatus(change.reportId, 'REJECTED', `Editor proposal rejected by Admin: ${reason}`);
    }

    this.appendAudit({
      id: uuidv4(),
      actorId: adminUserId,
      actorEmail: this.getUserById(adminUserId)?.email || 'admin@yol.uz',
      actorRole: 'ADMIN',
      action: 'REJECT_MAP_CHANGE',
      entityType: 'PROPOSED_CHANGE',
      entityId: changeId,
      details: `Rejected change: ${reason}`,
      timestamp: new Date().toISOString()
    });

    return change;
  }

  // --- Audit Log Methods ---
  public appendAudit(entry: AuditLogEntry) {
    this.auditLogs.unshift(entry);
    // Keep max 1000 in memory
    if (this.auditLogs.length > 1000) {
      this.auditLogs.pop();
    }
  }

  public getAuditLogs(limit = 100): AuditLogEntry[] {
    return this.auditLogs.slice(0, limit);
  }

  // --- Provider Health Methods ---
  public getProviderHealth(): ProviderHealth[] {
    return Array.from(this.providerHealthStatus.values());
  }

  public updateProviderHealth(name: string, update: Partial<ProviderHealth>) {
    const existing = this.providerHealthStatus.get(name) || {
      providerName: name,
      status: 'ONLINE',
      lastSync: new Date().toISOString(),
      latencyMs: 100,
      message: 'Operational'
    };
    this.providerHealthStatus.set(name, { ...existing, ...update, lastSync: new Date().toISOString() });
  }

  // --- Support Chat Methods ---
  public addSupportMessage(convId: string, msg: Omit<SupportMessage, 'id' | 'timestamp'>): SupportMessage {
    const fullMsg: SupportMessage = {
      ...msg,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    };
    const list = this.supportMessages.get(convId) || [];
    list.push(fullMsg);
    this.supportMessages.set(convId, list);
    return fullMsg;
  }

  public getSupportMessages(convId: string): SupportMessage[] {
    return this.supportMessages.get(convId) || [];
  }
}

export const dbStore = new ResilientDataStore();
