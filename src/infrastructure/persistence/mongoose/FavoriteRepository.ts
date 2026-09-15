import type { IFavoriteRepository } from '../../../domain/favorite/favorite.repository';
import type { Favorite, CreateFavoriteInput } from '../../../domain/favorite/favorite.entity';
import { FavoriteModel } from './models/FavoriteModel';
import { mapFavorite } from './mappers';

export class MongooseFavoriteRepository implements IFavoriteRepository {
  async listByUser(userId: string, populate = true): Promise<Favorite[]> {
    let q = FavoriteModel.find({ userId }).sort({ createdAt: -1 });
    if (populate) {
      q = q.populate('bookId', 'title author price coverImageUrl');
    }
    const docs = await q;
    return docs.map(mapFavorite);
  }

  async findByUserAndBook(userId: string, bookId: string): Promise<Favorite | null> {
    const doc = await FavoriteModel.findOne({ userId, bookId });
    return doc ? mapFavorite(doc) : null;
  }

  async create(input: CreateFavoriteInput): Promise<Favorite> {
    const doc = await FavoriteModel.create({
      userId: input.userId,
      bookId: input.bookId,
    });
    return mapFavorite(doc);
  }

  async deleteByUserAndBook(userId: string, bookId: string): Promise<boolean> {
    const result = await FavoriteModel.deleteOne({ userId, bookId });
    return result.deletedCount === 1;
  }
}
