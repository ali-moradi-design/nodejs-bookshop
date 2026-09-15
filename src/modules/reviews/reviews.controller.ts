import { Request, Response } from 'express';
import { Review } from '../../models/Review';
import { Book } from '../../models/Book';
import { AppError } from '../../utils/AppError';
import { asyncHandler } from '../../utils/asyncHandler';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const filter: Record<string, unknown> = {};
  if (req.query.book) filter.book = req.query.book;
  if (req.query.user) filter.user = req.query.user;

  const [data, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name email')
      .populate('book', 'title author')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments(filter),
  ]);
  res.json({ data, meta: { page, limit, total } });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.id)
    .populate('user', 'name email')
    .populate('book', 'title author');
  if (!review) throw new AppError('Review not found', 404);
  res.json({ data: review });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const book = await Book.findById(req.body.book);
  if (!book) throw new AppError('Book not found', 404);

  const review = await Review.create({
    book: req.body.book,
    user: req.user!.id,
    rating: req.body.rating,
    comment: req.body.comment,
  });
  res.status(201).json({ data: review });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);

  const isOwn = review.user.toString() === req.user!.id;
  const canUpdateAll = req.user!.permissions.includes('reviews:update');
  const canUpdateOwn = req.user!.permissions.includes('reviews:update-own');

  if (!isOwn && !canUpdateAll) throw new AppError('Forbidden', 403);
  if (isOwn && !canUpdateOwn && !canUpdateAll) throw new AppError('Forbidden', 403);

  if (req.body.rating !== undefined) review.rating = req.body.rating;
  if (req.body.comment !== undefined) review.comment = req.body.comment;
  await review.save();
  res.json({ data: review });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);

  const isOwn = review.user.toString() === req.user!.id;
  const canDeleteAll = req.user!.permissions.includes('reviews:delete');
  const canDeleteOwn = req.user!.permissions.includes('reviews:delete-own');

  if (!isOwn && !canDeleteAll) throw new AppError('Forbidden', 403);
  if (isOwn && !canDeleteOwn && !canDeleteAll) throw new AppError('Forbidden', 403);

  review.deletedAt = new Date();
  await review.save();
  res.json({ message: 'Review soft-deleted' });
});
