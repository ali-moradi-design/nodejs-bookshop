import { Router } from 'express';
import { authenticate, requirePermission, requireAnyPermission } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as ctrl from './reports.controller';
import {
  createIssueSchema,
  updateIssueSchema,
  idParamSchema,
  dateRangeQuerySchema,
} from './reports.validation';

const router = Router();
router.use(authenticate);

// Issues
router.post(
  '/issues',
  requirePermission('reports:issues:create'),
  validate({ body: createIssueSchema }),
  ctrl.createIssue,
);
router.get(
  '/issues',
  requireAnyPermission('reports:issues:create', 'reports:manage'),
  ctrl.listIssues,
);
router.get(
  '/issues/:id',
  requireAnyPermission('reports:issues:create', 'reports:manage'),
  validate({ params: idParamSchema }),
  ctrl.getIssue,
);
router.patch(
  '/issues/:id',
  requireAnyPermission('reports:issues:create', 'reports:manage'),
  validate({ params: idParamSchema, body: updateIssueSchema }),
  ctrl.updateIssue,
);
router.delete(
  '/issues/:id',
  requireAnyPermission('reports:issues:create', 'reports:manage'),
  validate({ params: idParamSchema }),
  ctrl.deleteIssue,
);

// Analytics
router.get(
  '/analytics/revenue',
  requirePermission('reports:analytics'),
  validate({ query: dateRangeQuerySchema }),
  ctrl.revenueSummary,
);
router.get(
  '/analytics/orders-by-status',
  requirePermission('reports:analytics'),
  ctrl.ordersByStatus,
);
router.get(
  '/analytics/top-books',
  requirePermission('reports:analytics'),
  validate({ query: dateRangeQuerySchema }),
  ctrl.topBooks,
);
router.get(
  '/analytics/sales-by-date',
  requirePermission('reports:analytics'),
  validate({ query: dateRangeQuerySchema }),
  ctrl.salesByDate,
);

export default router;
