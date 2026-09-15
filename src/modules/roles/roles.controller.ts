import { Request, Response } from 'express';
import { Role } from '../../models/Role';
import { AppError } from '../../utils/AppError';
import { asyncHandler } from '../../utils/asyncHandler';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const items = await Role.find().populate('permissions').sort({ name: 1 });
  res.json({ data: items });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const item = await Role.findById(req.params.id).populate('permissions');
  if (!item) throw new AppError('Role not found', 404);
  res.json({ data: item });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const item = await Role.create({
    name: req.body.name,
    description: req.body.description,
    permissions: req.body.permissions ?? [],
  });
  await item.populate('permissions');
  res.status(201).json({ data: item });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const item = await Role.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('permissions');
  if (!item) throw new AppError('Role not found', 404);
  res.json({ data: item });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const item = await Role.findByIdAndDelete(req.params.id);
  if (!item) throw new AppError('Role not found', 404);
  res.json({ message: 'Role deleted' });
});
