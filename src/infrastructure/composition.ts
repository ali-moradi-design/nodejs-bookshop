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
} from './persistence/mongoose';

import { JwtTokenService } from './security/token.service';
import { BcryptPasswordHasher } from './security/password.service';

import { BookService } from '../application/book/book.service';
import { AuthService } from '../application/auth/auth.service';
import { UserService } from '../application/user/user.service';
import { OrderService } from '../application/order/order.service';
import { ReviewService } from '../application/review/review.service';
import { PermissionService } from '../application/rbac/permission.service';
import { RoleService } from '../application/rbac/role.service';
import { ReportService } from '../application/report/report.service';
import { AuthContextService } from '../application/rbac/auth-context.service';
import { DiscountService } from '../application/discount/discount.service';
import { CartService } from '../application/cart/cart.service';
import { FavoriteService } from '../application/favorite/favorite.service';
import { DashboardService } from '../application/admin/dashboard.service';

const bookRepo = new MongooseBookRepository();
const userRepo = new MongooseUserRepository();
const orderRepo = new MongooseOrderRepository();
const reviewRepo = new MongooseReviewRepository();
const permissionRepo = new MongoosePermissionRepository();
const roleRepo = new MongooseRoleRepository();
const refreshTokenRepo = new MongooseRefreshTokenRepository();
const issueRepo = new MongooseIssueReportRepository();
const cartRepo = new MongooseCartRepository();
const favoriteRepo = new MongooseFavoriteRepository();
const discountRepo = new MongooseDiscountRepository();
const tokenService = new JwtTokenService();
const passwordHasher = new BcryptPasswordHasher();

export const bookService = new BookService(bookRepo);
export const discountService = new DiscountService(discountRepo);
export const authService = new AuthService(
  userRepo,
  roleRepo,
  refreshTokenRepo,
  tokenService,
  passwordHasher,
);
export const userService = new UserService(userRepo, passwordHasher);
export const orderService = new OrderService(orderRepo, bookRepo, discountService);
export const reviewService = new ReviewService(reviewRepo, bookRepo);
export const permissionService = new PermissionService(permissionRepo);
export const roleService = new RoleService(roleRepo);
export const reportService = new ReportService(issueRepo, orderRepo);
export const authContextService = new AuthContextService(userRepo, roleRepo, tokenService);
export const cartService = new CartService(cartRepo, bookRepo, orderRepo, discountService);
export const favoriteService = new FavoriteService(favoriteRepo, bookRepo);
export const dashboardService = new DashboardService(userRepo, bookRepo, orderRepo, issueRepo);

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
