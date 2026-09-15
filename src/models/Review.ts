import { Schema, model, Document, Types, Query } from 'mongoose';

export interface IReview extends Document {
  book: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  comment?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

reviewSchema.pre(/^find/, function (this: Query<unknown, IReview>) {
  if (this.getFilter().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
});

export const Review = model<IReview>('Review', reviewSchema);
