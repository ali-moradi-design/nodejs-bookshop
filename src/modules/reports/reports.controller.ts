import { Request, Response } from 'express';
import { IssueReport } from '../../models/IssueReport';
import { Order } from '../../models/Order';
import { AppError } from '../../utils/AppError';
import { asyncHandler } from '../../utils/asyncHandler';

export const createIssue = asyncHandler(async (req: Request, res: Response) => {
  const issue = await IssueReport.create({
    reporter: req.user!.id,
    type: req.body.type,
    targetId: req.body.targetId,
    subject: req.body.subject,
    body: req.body.body,
    status: 'open',
  });
  res.status(201).json({ data: issue });
});

export const listIssues = asyncHandler(async (req: Request, res: Response) => {
  const canManage = req.user!.permissions.includes('reports:manage');
  const filter = canManage ? {} : { reporter: req.user!.id };
  const issues = await IssueReport.find(filter)
    .populate('reporter', 'name email')
    .sort({ createdAt: -1 });
  res.json({ data: issues });
});

export const getIssue = asyncHandler(async (req: Request, res: Response) => {
  const issue = await IssueReport.findById(req.params.id).populate('reporter', 'name email');
  if (!issue) throw new AppError('Issue not found', 404);
  const canManage = req.user!.permissions.includes('reports:manage');
  if (!canManage && issue.reporter.toString() !== req.user!.id) {
    throw new AppError('Forbidden', 403);
  }
  res.json({ data: issue });
});

export const updateIssue = asyncHandler(async (req: Request, res: Response) => {
  const canManage = req.user!.permissions.includes('reports:manage');
  const issue = await IssueReport.findById(req.params.id);
  if (!issue) throw new AppError('Issue not found', 404);

  if (canManage) {
    if (req.body.status !== undefined) issue.status = req.body.status;
    if (req.body.adminNotes !== undefined) issue.adminNotes = req.body.adminNotes;
    if (req.body.subject !== undefined) issue.subject = req.body.subject;
    if (req.body.body !== undefined) issue.body = req.body.body;
  } else {
    if (issue.reporter.toString() !== req.user!.id) throw new AppError('Forbidden', 403);
    if (issue.status !== 'open') throw new AppError('Cannot edit issue after staff pickup', 400);
    if (req.body.subject !== undefined) issue.subject = req.body.subject;
    if (req.body.body !== undefined) issue.body = req.body.body;
  }

  await issue.save();
  res.json({ data: issue });
});

export const deleteIssue = asyncHandler(async (req: Request, res: Response) => {
  const canManage = req.user!.permissions.includes('reports:manage');
  const issue = await IssueReport.findById(req.params.id);
  if (!issue) throw new AppError('Issue not found', 404);
  if (!canManage && issue.reporter.toString() !== req.user!.id) {
    throw new AppError('Forbidden', 403);
  }
  issue.deletedAt = new Date();
  await issue.save();
  res.json({ message: 'Issue soft-deleted' });
});

function paidMatch(from?: string, to?: string) {
  const match: Record<string, unknown> = {
    'payment.status': 'paid',
    deletedAt: null,
  };
  if (from || to) {
    const range: Record<string, Date> = {};
    if (from) range.$gte = new Date(from);
    if (to) range.$lte = new Date(to);
    match['payment.paidAt'] = range;
  }
  return match;
}

export const revenueSummary = asyncHandler(async (req: Request, res: Response) => {
  const match = paidMatch(req.query.from as string | undefined, req.query.to as string | undefined);
  const [agg] = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 },
        avgOrderValue: { $avg: '$totalAmount' },
      },
    },
  ]);
  res.json({
    data: agg ?? { totalRevenue: 0, orderCount: 0, avgOrderValue: 0 },
  });
});

export const ordersByStatus = asyncHandler(async (_req: Request, res: Response) => {
  const data = await Order.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { status: '$_id', count: 1, _id: 0 } },
  ]);
  res.json({ data });
});

export const topBooks = asyncHandler(async (req: Request, res: Response) => {
  const match = paidMatch(req.query.from as string | undefined, req.query.to as string | undefined);
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const data = await Order.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.book',
        title: { $first: '$items.title' },
        quantitySold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { quantitySold: -1 } },
    { $limit: limit },
  ]);
  res.json({ data });
});

export const salesByDate = asyncHandler(async (req: Request, res: Response) => {
  const match = paidMatch(req.query.from as string | undefined, req.query.to as string | undefined);
  const data = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$payment.paidAt' },
        },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', revenue: 1, orders: 1, _id: 0 } },
  ]);
  res.json({ data });
});
