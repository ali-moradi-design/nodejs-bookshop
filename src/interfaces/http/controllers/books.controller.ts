import { Request, Response } from 'express';
import { bookService } from '../../../infrastructure/composition';
import { asyncHandler } from '../../../shared/asyncHandler';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await bookService.list({
    q: req.query.q as string | undefined,
    category: req.query.category as string | undefined,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
  });
  res.json(result);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const book = await bookService.getById(String(req.params.id));
  res.json({ data: book });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const book = await bookService.create(req.body);
  res.status(201).json({ data: book });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const book = await bookService.update(String(req.params.id), req.body);
  res.json({ data: book });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await bookService.remove(String(req.params.id));
  res.json({ message: 'Book soft-deleted' });
});
