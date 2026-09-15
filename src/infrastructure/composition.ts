import {
  MongooseBookRepository,
  MongooseUserRepository,
  MongooseOrderRepository,
  MongooseReviewRepository,
  MongoosePermissionRepository,
  MongooseRoleRepository,
  MongooseRefreshTokenRepository,
  MongooseIssueReportRepository,
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

const bookRepo = new MongooseBookRepository();
const userRepo = new MongooseUserRepository();
const orderRepo = new MongooseOrderRepository();
const reviewRepo = new MongooseReviewRepository();
const permissionRepo = new MongoosePermissionRepository();
const roleRepo = new MongooseRoleRepository();
const refreshTokenRepo = new MongooseRefreshTokenRepository();
const issueRepo = new MongooseIssueReportRepository();
const tokenService = new JwtTokenService();
const passwordHasher = new BcryptPasswordHasher();

export const bookService = new BookService(bookRepo);
export const authService = new AuthService(
  userRepo,
  roleRepo,
  refreshTokenRepo,
  tokenService,
  passwordHasher,
);
export const userService = new UserService(userRepo, passwordHasher);
export const orderService = new OrderService(orderRepo, bookRepo);
export const reviewService = new ReviewService(reviewRepo, bookRepo);
export const permissionService = new PermissionService(permissionRepo);
export const roleService = new RoleService(roleRepo);
export const reportService = new ReportService(issueRepo, orderRepo);
export const authContextService = new AuthContextService(userRepo, roleRepo, tokenService);

export const repos = {
  books: bookRepo,
  users: userRepo,
  orders: orderRepo,
  reviews: reviewRepo,
  permissions: permissionRepo,
  roles: roleRepo,
  refreshTokens: refreshTokenRepo,
  issues: issueRepo,
};
