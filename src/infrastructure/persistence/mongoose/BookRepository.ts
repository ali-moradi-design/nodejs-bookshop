import type { IBookRepository } from '../../../domain/book/book.repository';
import type { Book, CreateBookInput, UpdateBookInput, BookListFilter } from '../../../domain/book/book.entity';
import { BookModel } from './models/BookModel';
import { mapBook } from './mappers';
import { paginate } from '../../../shared/pagination';

/**
 * Book search strategy:
 * - Prefer MongoDB text index ($text) when `q` is provided (index on title/author/description).
 * - Fall back to case-insensitive regex on title/author/description if text search fails
 *   or yields no usable results for short/special queries.
 */
export class MongooseBookRepository implements IBookRepository {
  async findById(id: string): Promise<Book | null> {
    const doc = await BookModel.findById(id);
    return doc ? mapBook(doc) : null;
  }

  async findByIds(ids: string[]): Promise<Book[]> {
    const docs = await BookModel.find({ _id: { $in: ids } });
    return docs.map(mapBook);
  }

  async list(filter: BookListFilter): Promise<{ data: Book[]; total: number }> {
    const { limit, skip } = paginate(filter.page, filter.limit);
    const query: Record<string, unknown> = {};

    if (filter.q) {
      // Use text index when available; also keep regex OR for partial matches
      query.$or = [
        { $text: { $search: filter.q } },
        { title: { $regex: escapeRegex(filter.q), $options: 'i' } },
        { author: { $regex: escapeRegex(filter.q), $options: 'i' } },
        { description: { $regex: escapeRegex(filter.q), $options: 'i' } },
      ];
    }
    if (filter.category) {
      query.categories = filter.category;
    }
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      const price: Record<string, number> = {};
      if (filter.minPrice !== undefined) price.$gte = filter.minPrice;
      if (filter.maxPrice !== undefined) price.$lte = filter.maxPrice;
      query.price = price;
    }
    if (filter.inStock === true) {
      query.stock = { $gt: 0 };
    } else if (filter.inStock === false) {
      query.stock = { $lte: 0 };
    }
    if (filter.featured !== undefined) {
      query.featured = filter.featured;
    }

    const sortField = filter.sort ?? 'createdAt';
    const sortDir = filter.order === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortDir };

    // $text cannot be mixed with other $or conditions easily in some Mongo versions;
    // use regex-only query when q is set (text index still helps future dedicated search).
    const finalQuery = buildSearchQuery(filter, query);

    const [docs, total] = await Promise.all([
      BookModel.find(finalQuery).sort(sort).skip(skip).limit(limit),
      BookModel.countDocuments(finalQuery),
    ]);
    return { data: docs.map(mapBook), total };
  }

  async listFeatured(limit = 20): Promise<Book[]> {
    const docs = await BookModel.find({ featured: true })
      .sort({ featuredOrder: 1, createdAt: -1 })
      .limit(limit);
    return docs.map(mapBook);
  }

  async create(input: CreateBookInput): Promise<Book> {
    const doc = await BookModel.create({
      ...input,
      featured: input.featured ?? false,
      featuredOrder: input.featuredOrder ?? 0,
    });
    return mapBook(doc);
  }

  async update(id: string, input: UpdateBookInput): Promise<Book | null> {
    const doc = await BookModel.findByIdAndUpdate(id, input, { returnDocument: 'after', runValidators: true });
    return doc ? mapBook(doc) : null;
  }

  async softDelete(id: string): Promise<Book | null> {
    const doc = await BookModel.findByIdAndUpdate(id, { deletedAt: new Date() }, { returnDocument: 'after' });
    return doc ? mapBook(doc) : null;
  }

  async decrementStock(bookId: string, quantity: number): Promise<boolean> {
    const result = await BookModel.updateOne(
      { _id: bookId, stock: { $gte: quantity }, deletedAt: null },
      { $inc: { stock: -quantity } },
    );
    return result.modifiedCount === 1;
  }

  async incrementStock(bookId: string, quantity: number): Promise<void> {
    await BookModel.updateOne({ _id: bookId }, { $inc: { stock: quantity } });
  }

  async upsertByIsbn(
    isbn: string,
    data: CreateBookInput & { coverImageUrl: string },
  ): Promise<Book> {
    const doc = await BookModel.findOneAndUpdate({ isbn }, data, {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    });
    return mapBook(doc!);
  }

  async count(): Promise<number> {
    return BookModel.countDocuments();
  }

  async countLowStock(threshold: number): Promise<number> {
    return BookModel.countDocuments({ stock: { $lte: threshold } });
  }

  async findLowStock(threshold: number, limit = 50): Promise<Book[]> {
    const docs = await BookModel.find({ stock: { $lte: threshold } })
      .sort({ stock: 1 })
      .limit(limit);
    return docs.map(mapBook);
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSearchQuery(
  filter: BookListFilter,
  base: Record<string, unknown>,
): Record<string, unknown> {
  // Documented choice: case-insensitive regex on title/author/description for `q`
  // (works for partial matches). Text index on those fields supports future $text queries.
  const query: Record<string, unknown> = { ...base };
  if (filter.q) {
    delete query.$or;
    query.$or = [
      { title: { $regex: escapeRegex(filter.q), $options: 'i' } },
      { author: { $regex: escapeRegex(filter.q), $options: 'i' } },
      { description: { $regex: escapeRegex(filter.q), $options: 'i' } },
    ];
  }
  return query;
}
