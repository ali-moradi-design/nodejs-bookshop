import type { IOrderRepository } from '../../domain/order/order.repository';
import type { IBookRepository } from '../../domain/book/book.repository';
import type {
  Order,
  OrderStatus,
  ShippingAddress,
} from '../../domain/order/order.entity';
import type { DiscountService } from '../discount/discount.service';
import { assertTransition } from '../../domain/order/order.transitions';
import { AppError } from '../../shared/AppError';

export class OrderService {
  constructor(
    private readonly orders: IOrderRepository,
    private readonly books: IBookRepository,
    private readonly discounts?: DiscountService,
  ) {}

  async create(
    userId: string,
    items: { book: string; quantity: number }[],
    shippingAddress: ShippingAddress,
    discountCode?: string,
  ): Promise<Order> {
    const bookIds = items.map((i) => i.book);
    const books = await this.books.findByIds(bookIds);
    if (books.length !== new Set(bookIds).size) {
      throw new AppError('One or more books not found', 404);
    }

    const bookMap = new Map(books.map((b) => [b.id, b]));
    const orderItems = items.map((item) => {
      const book = bookMap.get(item.book)!;
      if (book.stock < item.quantity) {
        throw new AppError(`Insufficient stock for "${book.title}"`, 409);
      }
      return {
        book: book.id,
        title: book.title,
        price: book.price,
        quantity: item.quantity,
      };
    });

    const subtotalAmount =
      Math.round(orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;

    let discountAmount = 0;
    let appliedCode: string | undefined;
    let discountId: string | undefined;

    if (this.discounts) {
      const result = await this.discounts.computeDiscount(discountCode, subtotalAmount);
      discountAmount = result.discountAmount;
      appliedCode = result.discount?.code;
      discountId = result.discount?.id;
    } else if (discountCode) {
      throw new AppError('Discount codes are not available', 400);
    }

    const totalAmount = Math.max(0, Math.round((subtotalAmount - discountAmount) * 100) / 100);

    const order = await this.orders.create({
      userId,
      items: orderItems,
      subtotalAmount,
      discountCode: appliedCode,
      discountAmount,
      totalAmount,
      shippingAddress,
    });

    if (discountId && this.discounts) {
      await this.discounts.recordUse(discountId);
    }

    return order;
  }

  async pay(orderId: string, userId: string, isStaff: boolean): Promise<Order> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (!isStaff && order.user !== userId) {
      throw new AppError('Forbidden', 403);
    }
    if (order.status !== 'pending_payment') {
      throw new AppError('Order is not awaiting payment', 400);
    }

    const decremented: { bookId: string; quantity: number }[] = [];

    try {
      for (const item of order.items) {
        const ok = await this.books.decrementStock(item.book, item.quantity);
        if (!ok) {
          throw new AppError(`Insufficient stock for book ${item.title}`, 409);
        }
        decremented.push({ bookId: item.book, quantity: item.quantity });
      }

      order.status = 'paid';
      order.payment = {
        method: 'fake',
        status: 'paid',
        paidAt: new Date(),
        transactionId: `fake_${Date.now()}`,
      };
      order.statusHistory.push({
        status: 'paid',
        at: new Date(),
        note: 'Fake payment confirmed',
      });
      return this.orders.save(order);
    } catch (err) {
      for (const d of decremented) {
        await this.books.incrementStock(d.bookId, d.quantity);
      }

      if (err instanceof AppError && err.statusCode === 409) {
        order.status = 'failed';
        order.payment.status = 'failed';
        order.statusHistory.push({
          status: 'failed',
          at: new Date(),
          note: err.message,
        });
        await this.orders.save(order);
      }
      throw err;
    }
  }

  async list(userId: string, canReadAll: boolean): Promise<Order[]> {
    return this.orders.list(canReadAll ? {} : { userId });
  }

  async getById(orderId: string, userId: string, canReadAll: boolean): Promise<Order> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    if (!canReadAll && order.user !== userId) {
      throw new AppError('Forbidden', 403);
    }
    return order;
  }

  async updateStatus(orderId: string, nextStatus: OrderStatus, note?: string): Promise<Order> {
    const order = await this.orders.findById(orderId);
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
        await this.books.incrementStock(item.book, item.quantity);
      }
    }

    order.status = nextStatus;
    order.statusHistory.push({ status: nextStatus, at: new Date(), note });
    return this.orders.save(order);
  }
}
