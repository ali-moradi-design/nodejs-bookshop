import { z } from 'zod';

export const createBookSchema = z.object({
  title: z.string().min(1).max(300),
  author: z.string().min(1).max(200),
  description: z.string().min(1),
  isbn: z.string().min(5).max(20).optional(),
  price: z.number().nonnegative(),
  currency: z.string().length(3).optional(),
  stock: z.number().int().nonnegative().default(0),
  coverImageUrl: z.string().url().optional(),
  categories: z.array(z.string()).optional(),
});

export const updateBookSchema = createBookSchema.partial();

export const idParamSchema = z.object({ id: z.string().min(1) });

export const listBooksQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});
