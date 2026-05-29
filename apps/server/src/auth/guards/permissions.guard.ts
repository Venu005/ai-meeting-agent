import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionRequirement, PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<PermissionRequirement>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const userWithPermissions = await this.prisma.user.findUnique({
      where: { id: user.id, userAuth: { isDeleted: false } },
      include: {
        rolePermission: true,
      },
    });

    if (!userWithPermissions) {
      throw new ForbiddenException('User not found');
    }

    const userPermissions = userWithPermissions.rolePermission.permissions;
    const userRole = userWithPermissions.rolePermission.role;

    if (requirement.role && userRole !== requirement.role) {
      throw new ForbiddenException('User is not allowed to access this resource');
    }

    if (requirement.permissions && requirement.permissions.length === 0) {
      return true;
    }

    const hasAllPermissions =
      !requirement.permissions || requirement.permissions.every((permission) => userPermissions.includes(permission));

    if (!hasAllPermissions) {
      throw new ForbiddenException("You don't have sufficient permissions to access");
    }

    return true;
  }
}
