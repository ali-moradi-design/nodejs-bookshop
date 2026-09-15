import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../../models/User';
import { AppError } from '../../utils/AppError';
import { asyncHandler } from '../../utils/asyncHandler';

function toPublic(user: {
  id: string;
  name: string;
  email: string;
  roles: unknown;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find().populate('roles').sort({ createdAt: -1 });
  res.json({ data: users.map(toPublic) });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const isOwn = req.user?.id === req.params.id;
  const canReadAll = req.user?.permissions.includes('users:read');
  const canReadOwn = req.user?.permissions.includes('users:read-own');

  if (!isOwn && !canReadAll) {
    throw new AppError('Forbidden', 403);
  }
  if (isOwn && !canReadOwn && !canReadAll) {
    throw new AppError('Forbidden', 403);
  }

  const user = await User.findById(req.params.id).populate('roles');
  if (!user) throw new AppError('User not found', 404);
  res.json({ data: toPublic(user) });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id).populate('roles');
  if (!user) throw new AppError('User not found', 404);
  res.json({ data: toPublic(user) });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await User.create({
    name: req.body.name,
    email: req.body.email.toLowerCase(),
    passwordHash,
    roles: req.body.roles ?? [],
    isActive: req.body.isActive ?? true,
  });
  await user.populate('roles');
  res.status(201).json({ data: toPublic(user) });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const isOwn = req.user?.id === req.params.id;
  const canUpdateAll = req.user?.permissions.includes('users:update');
  const canUpdateOwn = req.user?.permissions.includes('users:update-own');

  if (!isOwn && !canUpdateAll) {
    throw new AppError('Forbidden', 403);
  }
  if (isOwn && !canUpdateOwn && !canUpdateAll) {
    throw new AppError('Forbidden', 403);
  }

  const updates: Record<string, unknown> = {};
  if (isOwn && !canUpdateAll) {
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.password) updates.passwordHash = await bcrypt.hash(req.body.password, 12);
  } else {
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.email !== undefined) updates.email = req.body.email.toLowerCase();
    if (req.body.roles !== undefined) updates.roles = req.body.roles;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;
    if (req.body.password) updates.passwordHash = await bcrypt.hash(req.body.password, 12);
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('roles');
  if (!user) throw new AppError('User not found', 404);
  res.json({ data: toPublic(user) });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { deletedAt: new Date(), isActive: false },
    { new: true },
  );
  if (!user) throw new AppError('User not found', 404);
  res.json({ message: 'User soft-deleted' });
});
