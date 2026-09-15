import { Request, Response } from 'express';
import { asyncHandler } from '../../../shared/asyncHandler';
import { AppError } from '../../../shared/AppError';

export const uploadBookCover = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded (field name: file)', 400);
  }
  const url = `/uploads/books/${req.file.filename}`;
  res.status(201).json({ url });
});
