import { Request, Response } from 'express';
import { Permission } from '../../models/Permission';
import { AppError } from '../../utils/AppError';
import { asyncHandler } from '../../utils/asyncHandler';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const items = await Permission.find().sort({ section: 1, slug: 1 });
  res.json({ data: items });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const item = await Permission.findById(req.params.id);
  if (!item) throw new AppError('Permission not found', 404);
  res.json({ data: item });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const item = await Permission.create(req.body);
  res.status(201).json({ data: item });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const item = await Permission.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!item) throw new AppError('Permission not found', 404);
  res.json({ data: item });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const item = await Permission.findByIdAndDelete(req.params.id);
  if (!item) throw new AppError('Permission not found', 404);
  res.json({ message: 'Permission deleted' });
});
