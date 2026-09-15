import { Schema, model, Document, Query } from 'mongoose';

export interface IBookDoc extends Document {
  title: string;
  author: string;
  description: string;
  isbn?: string;
  price: number;
  currency: string;
  stock: number;
  coverImageUrl?: string;
  categories?: string[];
  featured: boolean;
  featuredOrder?: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const bookSchema = new Schema<IBookDoc>(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    isbn: { type: String, unique: true, sparse: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    coverImageUrl: { type: String },
    categories: [{ type: String, trim: true }],
    featured: { type: Boolean, default: false, index: true },
    featuredOrder: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Text search: regex on title/author/description (documented alternative to text index;
// text index also available for production-scale search).
bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index({ price: 1 });
bookSchema.index({ featured: 1, featuredOrder: 1 });

bookSchema.pre(/^find/, function (this: Query<unknown, IBookDoc>) {
  if (this.getFilter().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
});

export const BookModel = model<IBookDoc>('Book', bookSchema);
