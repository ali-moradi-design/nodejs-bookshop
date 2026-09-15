import { Order, OrderStatus, IOrder } from '../../models/Order';
import { Book } from '../../models/Book';
import { AppError } from '../../utils/AppError';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ['cancelled', 'failed', 'paid'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: [],
  failed: [],
};

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new AppError(`Illegal status transition: ${from} → ${to}`, 400);
  }
}

export async function createOrder(
  userId: string,
  items: { book: string; quantity: number }[],
  shippingAddress: IOrder['shippingAddress'],
) {
  const bookIds = items.map((i) => i.book);
  const books = await Book.find({ _id: { $in: bookIds } });
  if (books.length !== new Set(bookIds).size) {
    throw new AppError('One or more books not found', 404);
  }

  const bookMap = new Map(books.map((b) => [b.id, b]));
  const orderItems = items.map((item) => {
    const book = bookMap.get(item.book)!;
    return {
      book: book._id,
      title: book.title,
      price: book.price,
      quantity: item.quantity,
    };
  });

  const totalAmount = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const order = await Order.create({
    user: userId,
    items: orderItems,
    totalAmount,
    status: 'pending_payment',
    payment: { method: 'fake', status: 'pending' },
    shippingAddress,
    statusHistory: [{ status: 'pending_payment', at: new Date(), note: 'Order created' }],
  });

  return order;
}

export async function payOrder(orderId: string, userId: string, isStaff: boolean) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);
  if (!isStaff && order.user.toString() !== userId) {
    throw new AppError('Forbidden', 403);
  }
  if (order.status !== 'pending_payment') {
    throw new AppError('Order is not awaiting payment', 400);
  }

  const decremented: { bookId: string; quantity: number }[] = [];

  try {
    for (const item of order.items) {
      const result = await Book.updateOne(
        { _id: item.book, stock: { $gte: item.quantity }, deletedAt: null },
        { $inc: { stock: -item.quantity } },
      );
      if (result.modifiedCount !== 1) {
        throw new AppError(`Insufficient stock for book ${item.title}`, 409);
      }
      decremented.push({ bookId: item.book.toString(), quantity: item.quantity });
    }

    order.status = 'paid';
    order.payment = {
      method: 'fake',
      status: 'paid',
      paidAt: new Date(),
      transactionId: `fake_${Date.now()}`,
    };
    order.statusHistory.push({ status: 'paid', at: new Date(), note: 'Fake payment confirmed' });
    await order.save();
    return order;
  } catch (err) {
    for (const d of decremented) {
      await Book.updateOne({ _id: d.bookId }, { $inc: { stock: d.quantity } });
    }

    if (err instanceof AppError && err.statusCode === 409) {
      order.status = 'failed';
      order.payment.status = 'failed';
      order.statusHistory.push({
        status: 'failed',
        at: new Date(),
        note: err.message,
      });
      await order.save();
    }
    throw err;
  }
}

export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
  note?: string,
) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);

  assertTransition(order.status, nextStatus);

  if (
    nextStatus === 'cancelled' &&
    !['pending_payment', 'paid', 'processing'].includes(order.status)
  ) {
    throw new AppError('Cannot cancel order in current status', 400);
  }

  if (nextStatus === 'cancelled' && ['paid', 'processing'].includes(order.status)) {
    for (const item of order.items) {
      await Book.updateOne({ _id: item.book }, { $inc: { stock: item.quantity } });
    }
  }

  order.status = nextStatus;
  order.statusHistory.push({ status: nextStatus, at: new Date(), note });
  await order.save();
  return order;
}
