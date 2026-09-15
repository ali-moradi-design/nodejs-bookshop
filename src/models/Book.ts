import { Schema, model, Document, Query } from 'mongoose';

export interface IBook extends Document {
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

const bookSchema = new Schema<IBook>(
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
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

bookSchema.pre(/^find/, function (this: Query<unknown, IBook>) {
  if (this.getFilter().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
});

export const Book = model<IBook>('Book', bookSchema);
