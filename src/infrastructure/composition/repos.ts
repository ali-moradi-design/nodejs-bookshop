import {
  MongooseBookRepository,
  MongooseUserRepository,
  MongooseOrderRepository,
  MongooseReviewRepository,
  MongoosePermissionRepository,
  MongooseRoleRepository,
  MongooseRefreshTokenRepository,
  MongooseIssueReportRepository,
  MongooseCartRepository,
  MongooseFavoriteRepository,
  MongooseDiscountRepository,
} from '../persistence/mongoose';

export const bookRepo = new MongooseBookRepository();
export const userRepo = new MongooseUserRepository();
export const orderRepo = new MongooseOrderRepository();
export const reviewRepo = new MongooseReviewRepository();
export const permissionRepo = new MongoosePermissionRepository();
export const roleRepo = new MongooseRoleRepository();
export const refreshTokenRepo = new MongooseRefreshTokenRepository();
export const issueRepo = new MongooseIssueReportRepository();
export const cartRepo = new MongooseCartRepository();
export const favoriteRepo = new MongooseFavoriteRepository();
export const discountRepo = new MongooseDiscountRepository();

export const repos = {
  books: bookRepo,
  users: userRepo,
  orders: orderRepo,
  reviews: reviewRepo,
  permissions: permissionRepo,
  roles: roleRepo,
  refreshTokens: refreshTokenRepo,
  issues: issueRepo,
  carts: cartRepo,
  favorites: favoriteRepo,
  discounts: discountRepo,
};
