/**
 * Permission System Types (Placeholder)
 *
 * This file defines the permission model for multi-client access control.
 * Currently a placeholder - implementation pending user authentication.
 *
 * TODO: Implement when user auth is added:
 * - User roles (Admin, Planner, Viewer)
 * - Client/Brand access permissions
 * - Feature-level permissions
 * - Team/organization structure
 */

// User roles in the system
export type UserRole = 'ADMIN' | 'PLANNER' | 'VIEWER' | 'GUEST';

// Permission levels for actions
export type PermissionLevel = 'READ' | 'WRITE' | 'ADMIN' | 'NONE';

// Brand-level permissions
export interface BrandPermission {
  brandId: string;
  level: PermissionLevel;
  grantedAt: string;
  grantedBy?: string;
}

// User permissions structure
export interface UserPermissions {
  userId: string;
  role: UserRole;
  brandPermissions: BrandPermission[];
  canCreateBrands: boolean;
  canManageUsers: boolean;
  canAccessAnalytics: boolean;
  canExportData: boolean;
}

// Permission check result
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredLevel?: PermissionLevel;
  userLevel?: PermissionLevel;
}

/**
 * Check if a user has permission to access a brand
 * TODO: Implement with actual auth system
 */
export function canAccessBrand(
  _userPermissions: UserPermissions | null,
  _brandId: string
): PermissionCheckResult {
  // Placeholder: Allow all access until auth is implemented
  return {
    allowed: true,
    reason: 'Permission system not yet implemented - allowing all access'
  };
}

/**
 * Check if a user can edit a brand's campaigns/flights
 * TODO: Implement with actual auth system
 */
export function canEditBrand(
  _userPermissions: UserPermissions | null,
  _brandId: string
): PermissionCheckResult {
  // Placeholder: Allow all edits until auth is implemented
  return {
    allowed: true,
    reason: 'Permission system not yet implemented - allowing all edits'
  };
}

/**
 * Check if a user can view the client list (multi-client mode)
 * TODO: Implement with actual auth system
 */
export function canViewAllClients(
  _userPermissions: UserPermissions | null
): PermissionCheckResult {
  // Placeholder: Allow all client views until auth is implemented
  return {
    allowed: true,
    reason: 'Permission system not yet implemented - allowing all client views'
  };
}

/**
 * Default permissions for unauthenticated users
 * In production, this would be 'GUEST' with no brand access
 */
export const DEFAULT_PERMISSIONS: UserPermissions = {
  userId: 'anonymous',
  role: 'ADMIN', // Placeholder: full access until auth is implemented
  brandPermissions: [],
  canCreateBrands: true,
  canManageUsers: false,
  canAccessAnalytics: true,
  canExportData: true
};
