/**
 * User Roles Constants
 */

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  ADVISOR: 'advisor',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: ['all'],
  [USER_ROLES.USER]: ['read', 'create'],
  [USER_ROLES.ADVISOR]: ['read', 'create', 'update'],
} as const;

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.USER]: 'User',
  [USER_ROLES.ADVISOR]: 'Advisor',
} as const;
