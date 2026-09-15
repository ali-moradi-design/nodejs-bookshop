import { Request, Response } from 'express';
import { Book } from '../../models/Book';
import { AppError } from '../../utils/AppError';
import { asyncHandler } from '../../utils/asyncHandler';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const filter: Record<string, unknown> = {};
  if (req.query.q) {
    const q = String(req.query.q);
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { author: { $regex: q, $options: 'i' } },
    ];
  }
  if (req.query.category) {
    filter.categories = String(req.query.category);
  }
  const [data, total] = await Promise.all([
    Book.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Book.countDocuments(filter),
  ]);
  res.json({ data, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new AppError('Book not found', 404);
  res.json({ data: book });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const book = await Book.create(req.body);
  res.status(201).json({ data: book });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!book) throw new AppError('Book not found', 404);
  res.json({ data: book });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const book = await Book.findByIdAndUpdate(
    req.params.id,
    { deletedAt: new Date() },
    { new: true },
  );
  if (!book) throw new AppError('Book not found', 404);
  res.json({ message: 'Book soft-deleted' });
});
