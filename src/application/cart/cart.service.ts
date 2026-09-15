import type { ICartRepository } from '../../domain/cart/cart.repository';
import type { IBookRepository } from '../../domain/book/book.repository';
import type { IOrderRepository } from '../../domain/order/order.repository';
import type { Cart } from '../../domain/cart/cart.entity';
import type { Order, ShippingAddress } from '../../domain/order/order.entity';
import type { DiscountService } from '../discount/discount.service';
import { AppError } from '../../shared/AppError';

export class CartService {
  constructor(
    private readonly carts: ICartRepository,
    private readonly books: IBookRepository,
    private readonly orders: IOrderRepository,
    private readonly discounts: DiscountService,
  ) {}

  async get(userId: string): Promise<Cart> {
    return this.carts.getOrCreate(userId);
  }

  async addItem(userId: string, bookId: string, quantity: number): Promise<Cart> {
    const book = await this.books.findById(bookId);
    if (!book) throw new AppError('Book not found', 404);
    if (quantity < 1) throw new AppError('Quantity must be at least 1', 400);
    if (book.stock < quantity) {
      throw new AppError(`Insufficient stock for "${book.title}"`, 409);
    }

    const cart = await this.carts.getOrCreate(userId);
    const existing = cart.items.find((i) => i.bookId === bookId);
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (book.stock < newQty) {
        throw new AppError(`Insufficient stock for "${book.title}"`, 409);
      }
      existing.quantity = newQty;
    } else {
      cart.items.push({ bookId, quantity });
    }
    return this.carts.save(cart);
  }

  async updateItem(userId: string, bookId: string, quantity: number): Promise<Cart> {
    if (quantity < 1) throw new AppError('Quantity must be at least 1', 400);
    const book = await this.books.findById(bookId);
    if (!book) throw new AppError('Book not found', 404);
    if (book.stock < quantity) {
      throw new AppError(`Insufficient stock for "${book.title}"`, 409);
    }

    const cart = await this.carts.getOrCreate(userId);
    const item = cart.items.find((i) => i.bookId === bookId);
    if (!item) throw new AppError('Item not in cart', 404);
    item.quantity = quantity;
    return this.carts.save(cart);
  }

  async removeItem(userId: string, bookId: string): Promise<Cart> {
    const cart = await this.carts.getOrCreate(userId);
    const before = cart.items.length;
    cart.items = cart.items.filter((i) => i.bookId !== bookId);
    if (cart.items.length === before) throw new AppError('Item not in cart', 404);
    return this.carts.save(cart);
  }

  async clear(userId: string): Promise<Cart> {
    const cart = await this.carts.clear(userId);
    if (!cart) return this.carts.getOrCreate(userId);
    return cart;
  }

  async checkout(
    userId: string,
    shippingAddress: ShippingAddress,
    discountCode?: string,
  ): Promise<Order> {
    const cart = await this.carts.getOrCreate(userId);
    if (cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    const bookIds = cart.items.map((i) => i.bookId);
    const books = await this.books.findByIds(bookIds);
    if (books.length !== new Set(bookIds).size) {
      throw new AppError('One or more books in cart not found', 404);
    }

    const bookMap = new Map(books.map((b) => [b.id, b]));
    const orderItems = cart.items.map((item) => {
      const book = bookMap.get(item.bookId)!;
      if (book.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${book.title}" (available: ${book.stock})`,
          409,
        );
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

    const { discount, discountAmount } = await this.discounts.computeDiscount(
      discountCode,
      subtotalAmount,
    );

    const totalAmount = Math.max(0, Math.round((subtotalAmount - discountAmount) * 100) / 100);

    const order = await this.orders.create({
      userId,
      items: orderItems,
      subtotalAmount,
      discountCode: discount?.code,
      discountAmount,
      totalAmount,
      shippingAddress,
    });

    if (discount) {
      await this.discounts.recordUse(discount.id);
    }

    await this.carts.clear(userId);
    return order;
  }
}
