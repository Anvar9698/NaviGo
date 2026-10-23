import { UserRole } from './types';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER: 1,
  ANALYST: 2,
  EDITOR: 3,
  ADMIN: 4
};

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canTriageReports(role?: UserRole): boolean {
  return role === 'EDITOR' || role === 'ADMIN';
}

export function canProposeMapChanges(role?: UserRole): boolean {
  return role === 'EDITOR' || role === 'ADMIN';
}

export function canApproveMapChanges(role?: UserRole): boolean {
  return role === 'ADMIN';
}

export function canViewAnalytics(role?: UserRole): boolean {
  return role === 'ANALYST' || role === 'ADMIN';
}

export function canManageUsers(role?: UserRole): boolean {
  return role === 'ADMIN';
}

export function canViewAuditLog(role?: UserRole): boolean {
  return role === 'ADMIN';
}
