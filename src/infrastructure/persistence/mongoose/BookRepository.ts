import type { IBookRepository } from '../../../domain/book/book.repository';
import type { Book, CreateBookInput, UpdateBookInput, BookListFilter } from '../../../domain/book/book.entity';
import { BookModel } from './models/BookModel';
import { mapBook } from './mappers';
import { paginate } from '../../../shared/pagination';

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
      query.$or = [
        { title: { $regex: filter.q, $options: 'i' } },
        { author: { $regex: filter.q, $options: 'i' } },
      ];
    }
    if (filter.category) {
      query.categories = filter.category;
    }
    const [docs, total] = await Promise.all([
      BookModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      BookModel.countDocuments(query),
    ]);
    return { data: docs.map(mapBook), total };
  }

  async create(input: CreateBookInput): Promise<Book> {
    const doc = await BookModel.create(input);
    return mapBook(doc);
  }

  async update(id: string, input: UpdateBookInput): Promise<Book | null> {
    const doc = await BookModel.findByIdAndUpdate(id, input, { new: true, runValidators: true });
    return doc ? mapBook(doc) : null;
  }

  async softDelete(id: string): Promise<Book | null> {
    const doc = await BookModel.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
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
      new: true,
      setDefaultsOnInsert: true,
    });
    return mapBook(doc!);
  }

  async count(): Promise<number> {
    return BookModel.countDocuments();
  }
}
