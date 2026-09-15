import type { ICartRepository } from '../../../domain/cart/cart.repository';
import type { Cart, CartItem } from '../../../domain/cart/cart.entity';
import { CartModel } from './models/CartModel';
import { mapCart } from './mappers';

export class MongooseCartRepository implements ICartRepository {
  async findByUserId(userId: string): Promise<Cart | null> {
    const doc = await CartModel.findOne({ userId });
    return doc ? mapCart(doc) : null;
  }

  async getOrCreate(userId: string): Promise<Cart> {
    let doc = await CartModel.findOne({ userId });
    if (!doc) {
      doc = await CartModel.create({ userId, items: [] });
    }
    return mapCart(doc);
  }

  async save(cart: Cart): Promise<Cart> {
    const doc = await CartModel.findByIdAndUpdate(
      cart.id,
      {
        items: cart.items.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
      },
      { new: true },
    );
    if (!doc) throw new Error('Cart not found');
    return mapCart(doc);
  }

  async setItems(userId: string, items: CartItem[]): Promise<Cart> {
    const doc = await CartModel.findOneAndUpdate(
      { userId },
      {
        items: items.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
        $setOnInsert: { userId },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return mapCart(doc!);
  }

  async clear(userId: string): Promise<Cart | null> {
    const doc = await CartModel.findOneAndUpdate(
      { userId },
      { items: [] },
      { new: true },
    );
    return doc ? mapCart(doc) : null;
  }
}
