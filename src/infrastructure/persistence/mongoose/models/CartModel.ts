import { Schema, model, Document, Types } from 'mongoose';

export interface ICartItemDoc {
  bookId: Types.ObjectId;
  quantity: number;
}

export interface ICartDoc extends Document {
  userId: Types.ObjectId;
  items: ICartItemDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItemDoc>(
  {
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const cartSchema = new Schema<ICartDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

export const CartModel = model<ICartDoc>('Cart', cartSchema);
