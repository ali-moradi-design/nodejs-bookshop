export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  isbn?: string;
  price: number;
  currency: string;
  stock: number;
  coverImageUrl?: string;
  categories?: string[];
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookInput {
  title: string;
  author: string;
  description: string;
  isbn?: string;
  price: number;
  currency?: string;
  stock?: number;
  coverImageUrl?: string;
  categories?: string[];
}

export type UpdateBookInput = Partial<CreateBookInput>;

export interface BookListFilter {
  q?: string;
  category?: string;
  page?: number;
  limit?: number;
}
