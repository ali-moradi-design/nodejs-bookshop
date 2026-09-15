import { Schema, model, Document, Types, Query } from 'mongoose';

export const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'processing',
  'shipped',
  'completed',
  'cancelled',
  'failed',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface IOrderItem {
  book: Types.ObjectId;
  title: string;
  price: number;
  quantity: number;
}

export interface IPayment {
  method: 'fake';
  status: 'pending' | 'paid' | 'failed';
  paidAt?: Date;
  transactionId?: string;
}

export interface IShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface IStatusHistory {
  status: OrderStatus;
  at: Date;
  note?: string;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  payment: IPayment;
  shippingAddress: IShippingAddress;
  statusHistory: IStatusHistory[];
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(v: IOrderItem[]) => v.length > 0, 'Order needs items'],
    },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending_payment' },
    payment: {
      method: { type: String, enum: ['fake'], default: 'fake' },
      status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
      paidAt: Date,
      transactionId: String,
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: String,
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES, required: true },
        at: { type: Date, default: Date.now },
        note: String,
      },
    ],
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

orderSchema.pre(/^find/, function (this: Query<unknown, IOrder>) {
  if (this.getFilter().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
});

export const Order = model<IOrder>('Order', orderSchema);
