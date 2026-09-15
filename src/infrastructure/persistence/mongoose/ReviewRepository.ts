import type { IReviewRepository } from '../../../domain/review/review.repository';
import type {
  Review,
  CreateReviewInput,
  UpdateReviewInput,
  ReviewListFilter,
} from '../../../domain/review/review.entity';
import { ReviewModel } from './models/ReviewModel';
import { mapReview } from './mappers';
import { paginate } from '../../../shared/pagination';

export class MongooseReviewRepository implements IReviewRepository {
  async findById(id: string, populate = false): Promise<Review | null> {
    let q = ReviewModel.findById(id);
    if (populate) {
      q = q.populate('user', 'name email').populate('book', 'title author');
    }
    const doc = await q;
    return doc ? mapReview(doc) : null;
  }

  async list(filter: ReviewListFilter): Promise<{ data: Review[]; total: number }> {
    const { limit, skip } = paginate(filter.page, filter.limit);
    const query: Record<string, unknown> = {};
    if (filter.book) query.book = filter.book;
    if (filter.user) query.user = filter.user;
    const [docs, total] = await Promise.all([
      ReviewModel.find(query)
        .populate('user', 'name email')
        .populate('book', 'title author')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ReviewModel.countDocuments(query),
    ]);
    return { data: docs.map(mapReview), total };
  }

  async create(input: CreateReviewInput): Promise<Review> {
    const doc = await ReviewModel.create(input);
    return mapReview(doc);
  }

  async update(id: string, input: UpdateReviewInput): Promise<Review | null> {
    const doc = await ReviewModel.findById(id);
    if (!doc) return null;
    if (input.rating !== undefined) doc.rating = input.rating;
    if (input.comment !== undefined) doc.comment = input.comment;
    await doc.save();
    return mapReview(doc);
  }

  async softDelete(id: string): Promise<Review | null> {
    const doc = await ReviewModel.findById(id);
    if (!doc) return null;
    doc.deletedAt = new Date();
    await doc.save();
    return mapReview(doc);
  }
}
