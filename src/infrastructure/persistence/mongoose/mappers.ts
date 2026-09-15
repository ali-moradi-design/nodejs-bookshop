import type { Book } from '../../../domain/book/book.entity';
import type { User } from '../../../domain/user/user.entity';
import type { Order, OrderItem } from '../../../domain/order/order.entity';
import type { Review } from '../../../domain/review/review.entity';
import type { Permission } from '../../../domain/rbac/permission.entity';
import type { Role } from '../../../domain/rbac/role.entity';
import type { IssueReport } from '../../../domain/report/report.entity';
import type { RefreshTokenRecord } from '../../../domain/auth/auth.types';
import type { Cart } from '../../../domain/cart/cart.entity';
import type { Favorite } from '../../../domain/favorite/favorite.entity';
import type { Discount } from '../../../domain/discount/discount.entity';

function idOf(doc: { id?: string; _id?: { toString(): string } }): string {
  return doc.id ?? doc._id!.toString();
}

export function mapBook(doc: {
  id?: string;
  _id?: { toString(): string };
  title: string;
  author: string;
  description: string;
  isbn?: string;
  price: number;
  currency: string;
  stock: number;
  coverImageUrl?: string;
  categories?: string[];
  featured?: boolean;
  featuredOrder?: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Book {
  return {
    id: idOf(doc),
    title: doc.title,
    author: doc.author,
    description: doc.description,
    isbn: doc.isbn,
    price: doc.price,
    currency: doc.currency,
    stock: doc.stock,
    coverImageUrl: doc.coverImageUrl,
    categories: doc.categories,
    featured: Boolean(doc.featured),
    featuredOrder: doc.featuredOrder,
    deletedAt: doc.deletedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapUser(doc: {
  id?: string;
  _id?: { toString(): string };
  name: string;
  email: string;
  passwordHash?: string;
  roles: unknown[];
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): User {
  const roles = (doc.roles ?? []).map((r) => {
    if (r && typeof r === 'object' && '_id' in (r as object)) {
      return (r as { _id: { toString(): string } })._id.toString();
    }
    return String(r);
  });
  return {
    id: idOf(doc),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    roles,
    isActive: doc.isActive,
    deletedAt: doc.deletedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapOrder(doc: {
  id?: string;
  _id?: { toString(): string };
  user: { toString(): string };
  items: {
    book: { toString(): string };
    title: string;
    price: number;
    quantity: number;
  }[];
  subtotalAmount?: number;
  discountCode?: string;
  discountAmount?: number;
  totalAmount: number;
  status: Order['status'];
  payment: Order['payment'];
  shippingAddress: Order['shippingAddress'];
  statusHistory: Order['statusHistory'];
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Order {
  const items: OrderItem[] = doc.items.map((i) => ({
    book: i.book.toString(),
    title: i.title,
    price: i.price,
    quantity: i.quantity,
  }));
  const discountAmount = doc.discountAmount ?? 0;
  const subtotalAmount = doc.subtotalAmount ?? doc.totalAmount + discountAmount;
  return {
    id: idOf(doc),
    user: doc.user.toString(),
    items,
    subtotalAmount,
    discountCode: doc.discountCode,
    discountAmount,
    totalAmount: doc.totalAmount,
    status: doc.status,
    payment: doc.payment,
    shippingAddress: doc.shippingAddress,
    statusHistory: doc.statusHistory,
    deletedAt: doc.deletedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapReview(doc: {
  id?: string;
  _id?: { toString(): string };
  book: unknown;
  user: unknown;
  rating: number;
  comment?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Review {
  const bookObj = doc.book as { _id?: { toString(): string }; id?: string; title?: string; author?: string; toString?: () => string };
  const userObj = doc.user as { _id?: { toString(): string }; id?: string; name?: string; email?: string; toString?: () => string };

  const bookId =
    bookObj && typeof bookObj === 'object' && (bookObj._id || bookObj.id)
      ? (bookObj.id ?? bookObj._id!.toString())
      : String(doc.book);
  const userId =
    userObj && typeof userObj === 'object' && (userObj._id || userObj.id)
      ? (userObj.id ?? userObj._id!.toString())
      : String(doc.user);

  const review: Review = {
    id: idOf(doc),
    book: bookId,
    user: userId,
    rating: doc.rating,
    comment: doc.comment,
    deletedAt: doc.deletedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  if (bookObj?.title || userObj?.name) {
    review.populated = {};
    if (userObj?.name) {
      review.populated.user = { name: userObj.name, email: userObj.email ?? '' };
    }
    if (bookObj?.title) {
      review.populated.book = { title: bookObj.title, author: bookObj.author ?? '' };
    }
  }
  return review;
}

export function mapPermission(doc: {
  id?: string;
  _id?: { toString(): string };
  slug: string;
  name: string;
  description?: string;
  section: string;
  createdAt: Date;
  updatedAt: Date;
}): Permission {
  return {
    id: idOf(doc),
    slug: doc.slug,
    name: doc.name,
    description: doc.description,
    section: doc.section,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapRole(doc: {
  id?: string;
  _id?: { toString(): string };
  name: string;
  description?: string;
  permissions: unknown[];
  createdAt: Date;
  updatedAt: Date;
}): Role {
  const raw = doc.permissions ?? [];
  const populated = raw.length > 0 && typeof raw[0] === 'object' && raw[0] !== null && 'slug' in (raw[0] as object);
  let permissions: Role['permissions'];
  if (populated) {
    permissions = raw.map((p) => {
      const perm = p as {
        _id?: { toString(): string };
        id?: string;
        slug: string;
        name?: string;
        description?: string;
        section?: string;
      };
      return {
        id: perm.id ?? perm._id!.toString(),
        slug: perm.slug,
        name: perm.name,
        description: perm.description,
        section: perm.section,
      };
    });
  } else {
    permissions = raw.map((p) => String(p));
  }
  return {
    id: idOf(doc),
    name: doc.name,
    description: doc.description,
    permissions,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapIssue(doc: {
  id?: string;
  _id?: { toString(): string };
  reporter: unknown;
  type: IssueReport['type'];
  targetId?: { toString(): string };
  subject: string;
  body: string;
  status: IssueReport['status'];
  adminNotes?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): IssueReport {
  const reporterObj = doc.reporter as {
    _id?: { toString(): string };
    id?: string;
    name?: string;
    email?: string;
    toString?: () => string;
  };
  const reporterId =
    reporterObj && typeof reporterObj === 'object' && (reporterObj._id || reporterObj.id)
      ? (reporterObj.id ?? reporterObj._id!.toString())
      : String(doc.reporter);

  const issue: IssueReport = {
    id: idOf(doc),
    reporter: reporterId,
    type: doc.type,
    targetId: doc.targetId?.toString(),
    subject: doc.subject,
    body: doc.body,
    status: doc.status,
    adminNotes: doc.adminNotes,
    deletedAt: doc.deletedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  if (reporterObj?.name) {
    issue.populated = {
      reporter: { name: reporterObj.name, email: reporterObj.email ?? '' },
    };
  }
  return issue;
}

export function mapRefreshToken(doc: {
  id?: string;
  _id?: { toString(): string };
  user: { toString(): string };
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  replacedByHash?: string | null;
}): RefreshTokenRecord {
  return {
    id: idOf(doc),
    userId: doc.user.toString(),
    tokenHash: doc.tokenHash,
    expiresAt: doc.expiresAt,
    revokedAt: doc.revokedAt,
    replacedByHash: doc.replacedByHash,
  };
}

export function mapCart(doc: {
  id?: string;
  _id?: { toString(): string };
  userId: { toString(): string };
  items: { bookId: { toString(): string }; quantity: number }[];
  createdAt: Date;
  updatedAt: Date;
}): Cart {
  return {
    id: idOf(doc),
    userId: doc.userId.toString(),
    items: doc.items.map((i) => ({
      bookId: i.bookId.toString(),
      quantity: i.quantity,
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapFavorite(doc: {
  id?: string;
  _id?: { toString(): string };
  userId: { toString(): string };
  bookId: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Favorite {
  const bookObj = doc.bookId as {
    _id?: { toString(): string };
    id?: string;
    title?: string;
    author?: string;
    price?: number;
    coverImageUrl?: string;
    toString?: () => string;
  };
  const bookId =
    bookObj && typeof bookObj === 'object' && (bookObj._id || bookObj.id)
      ? (bookObj.id ?? bookObj._id!.toString())
      : String(doc.bookId);

  const fav: Favorite = {
    id: idOf(doc),
    userId: doc.userId.toString(),
    bookId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };

  if (bookObj?.title) {
    fav.populated = {
      book: {
        id: bookId,
        title: bookObj.title,
        author: bookObj.author ?? '',
        price: bookObj.price ?? 0,
        coverImageUrl: bookObj.coverImageUrl,
      },
    };
  }
  return fav;
}

export function mapDiscount(doc: {
  id?: string;
  _id?: { toString(): string };
  code: string;
  type: Discount['type'];
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Discount {
  return {
    id: idOf(doc),
    code: doc.code,
    type: doc.type,
    value: doc.value,
    minOrderAmount: doc.minOrderAmount,
    maxUses: doc.maxUses,
    usedCount: doc.usedCount,
    startsAt: doc.startsAt,
    endsAt: doc.endsAt,
    isActive: doc.isActive,
    deletedAt: doc.deletedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
