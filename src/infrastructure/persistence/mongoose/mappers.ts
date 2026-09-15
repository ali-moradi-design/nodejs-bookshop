import type { Book } from '../../../domain/book/book.entity';
import type { User } from '../../../domain/user/user.entity';
import type { Order, OrderItem } from '../../../domain/order/order.entity';
import type { Review } from '../../../domain/review/review.entity';
import type { Permission } from '../../../domain/rbac/permission.entity';
import type { Role } from '../../../domain/rbac/role.entity';
import type { IssueReport } from '../../../domain/report/report.entity';
import type { RefreshTokenRecord } from '../../../domain/auth/auth.types';

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
  return {
    id: idOf(doc),
    user: doc.user.toString(),
    items,
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
