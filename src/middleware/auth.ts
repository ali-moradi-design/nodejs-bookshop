import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { verifyAccessToken } from '../utils/tokens';
import { AppError } from '../utils/AppError';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { asyncHandler } from '../utils/asyncHandler';

export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }
  const token = header.slice(7);
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError('Invalid or expired access token', 401);
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new AppError('User not found or inactive', 401);
  }

  const roles = await Role.find({ _id: { $in: user.roles } }).populate('permissions');
  const permissionSlugs = new Set<string>();
  for (const role of roles) {
    for (const perm of role.permissions) {
      if (typeof perm === 'object' && perm !== null && 'slug' in perm) {
        permissionSlugs.add((perm as { slug: string }).slug);
      } else if (perm) {
        const p = await Permission.findById(perm);
        if (p) permissionSlugs.add(p.slug);
      }
    }
  }

  req.user = {
    id: user.id,
    email: user.email,
    roles: user.roles.map((r: Types.ObjectId) => r.toString()),
    permissions: Array.from(permissionSlugs),
  };
  next();
});

export function requirePermission(...required: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }
    const hasAll = required.every((p) => req.user!.permissions.includes(p));
    if (!hasAll) {
      next(new AppError('Forbidden: insufficient permissions', 403));
      return;
    }
    next();
  };
}

export function requireAnyPermission(...required: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }
    const hasAny = required.some((p) => req.user!.permissions.includes(p));
    if (!hasAny) {
      next(new AppError('Forbidden: insufficient permissions', 403));
      return;
    }
    next();
  };
}
