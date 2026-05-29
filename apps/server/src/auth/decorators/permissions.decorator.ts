import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@repo/db';

export const PERMISSIONS_KEY = 'permissions';

export interface PermissionRequirement {
  role?: UserRole;
  permissions?: string[];
}

export const RequirePermissions = (requirement: PermissionRequirement) => SetMetadata(PERMISSIONS_KEY, requirement);
