import { Schema, model, Document, Types } from 'mongoose';

export interface IFavoriteDoc extends Document {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favoriteSchema = new Schema<IFavoriteDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
  },
  { timestamps: true },
);

favoriteSchema.index({ userId: 1, bookId: 1 }, { unique: true });

export const FavoriteModel = model<IFavoriteDoc>('Favorite', favoriteSchema);
