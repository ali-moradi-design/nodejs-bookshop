import type { Book, CreateBookInput, UpdateBookInput, BookListFilter } from './book.entity';

export interface IBookRepository {
  findById(id: string): Promise<Book | null>;
  findByIds(ids: string[]): Promise<Book[]>;
  list(filter: BookListFilter): Promise<{ data: Book[]; total: number }>;
  create(input: CreateBookInput): Promise<Book>;
  update(id: string, input: UpdateBookInput): Promise<Book | null>;
  softDelete(id: string): Promise<Book | null>;
  decrementStock(bookId: string, quantity: number): Promise<boolean>;
  incrementStock(bookId: string, quantity: number): Promise<void>;
  upsertByIsbn(isbn: string, data: CreateBookInput & { coverImageUrl: string }): Promise<Book>;
  count(): Promise<number>;
}
