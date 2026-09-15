import { Request, Response } from 'express';
import { orderService } from '../../../infrastructure/composition';
import { asyncHandler } from '../../../shared/asyncHandler';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.create(
    req.user!.id,
    req.body.items,
    req.body.shippingAddress,
    req.body.discountCode,
  );
  res.status(201).json({ data: order });
});

export const pay = asyncHandler(async (req: Request, res: Response) => {
  const isStaff = req.user!.permissions.includes('orders:update-status');
  const order = await orderService.pay(String(req.params.id), req.user!.id, isStaff);
  res.json({ data: order });
});

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const canReadAll = req.user!.permissions.includes('orders:read');
  const orders = await orderService.list(req.user!.id, canReadAll);
  res.json({ data: orders });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const canReadAll = req.user!.permissions.includes('orders:read');
  const order = await orderService.getById(String(req.params.id), req.user!.id, canReadAll);
  res.json({ data: order });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.updateStatus(
    String(req.params.id),
    req.body.status,
    req.body.note,
  );
  res.json({ data: order });
});
