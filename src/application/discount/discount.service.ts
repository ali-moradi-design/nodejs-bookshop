import type { IDiscountRepository } from '../../domain/discount/discount.repository';
import type {
  Discount,
  CreateDiscountInput,
  UpdateDiscountInput,
} from '../../domain/discount/discount.entity';
import { AppError } from '../../shared/AppError';

export class DiscountService {
  constructor(private readonly discounts: IDiscountRepository) {}

  async list(): Promise<Discount[]> {
    return this.discounts.list();
  }

  async getById(id: string): Promise<Discount> {
    const d = await this.discounts.findById(id);
    if (!d) throw new AppError('Discount not found', 404);
    return d;
  }

  async create(input: CreateDiscountInput): Promise<Discount> {
    const code = input.code.toUpperCase().trim();
    const existing = await this.discounts.findByCode(code);
    if (existing) throw new AppError('Discount code already exists', 409);
    if (input.type === 'percent' && (input.value < 0 || input.value > 100)) {
      throw new AppError('Percent discount must be between 0 and 100', 400);
    }
    return this.discounts.create({ ...input, code });
  }

  async update(id: string, input: UpdateDiscountInput): Promise<Discount> {
    if (input.code) {
      const code = input.code.toUpperCase().trim();
      const existing = await this.discounts.findByCode(code);
      if (existing && existing.id !== id) {
        throw new AppError('Discount code already exists', 409);
      }
      input = { ...input, code };
    }
    if (input.type === 'percent' && input.value !== undefined && (input.value < 0 || input.value > 100)) {
      throw new AppError('Percent discount must be between 0 and 100', 400);
    }
    const d = await this.discounts.update(id, input);
    if (!d) throw new AppError('Discount not found', 404);
    return d;
  }

  async remove(id: string): Promise<void> {
    const d = await this.discounts.softDelete(id);
    if (!d) throw new AppError('Discount not found', 404);
  }

  /**
   * Validate a discount code against a subtotal and return the discount amount.
   */
  async computeDiscount(
    code: string | undefined,
    subtotal: number,
  ): Promise<{ discount: Discount | null; discountAmount: number }> {
    if (!code) return { discount: null, discountAmount: 0 };

    const discount = await this.discounts.findByCode(code.toUpperCase().trim());
    if (!discount) throw new AppError('Invalid discount code', 400);
    if (!discount.isActive) throw new AppError('Discount code is inactive', 400);

    const now = new Date();
    if (discount.startsAt && now < discount.startsAt) {
      throw new AppError('Discount code is not yet active', 400);
    }
    if (discount.endsAt && now > discount.endsAt) {
      throw new AppError('Discount code has expired', 400);
    }
    if (discount.maxUses !== undefined && discount.usedCount >= discount.maxUses) {
      throw new AppError('Discount code has reached maximum uses', 400);
    }
    if (discount.minOrderAmount !== undefined && subtotal < discount.minOrderAmount) {
      throw new AppError(
        `Order subtotal must be at least ${discount.minOrderAmount} to use this code`,
        400,
      );
    }

    let amount = 0;
    if (discount.type === 'percent') {
      amount = Math.round(((subtotal * discount.value) / 100) * 100) / 100;
    } else {
      amount = discount.value;
    }
    amount = Math.min(amount, subtotal);
    amount = Math.max(0, amount);

    return { discount, discountAmount: amount };
  }

  async recordUse(discountId: string): Promise<void> {
    await this.discounts.incrementUsedCount(discountId);
  }
}
