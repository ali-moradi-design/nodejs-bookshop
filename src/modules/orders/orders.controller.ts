import { Request, Response } from 'express';
import { Order } from '../../models/Order';
import { AppError } from '../../utils/AppError';
import { asyncHandler } from '../../utils/asyncHandler';
import * as ordersService from './orders.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.createOrder(
    req.user!.id,
    req.body.items,
    req.body.shippingAddress,
  );
  res.status(201).json({ data: order });
});

export const pay = asyncHandler(async (req: Request, res: Response) => {
  const isStaff = req.user!.permissions.includes('orders:update-status');
  const orderId = String(req.params.id);
  const order = await ordersService.payOrder(orderId, req.user!.id, isStaff);
  res.json({ data: order });
});

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const canReadAll = req.user!.permissions.includes('orders:read');
  const filter = canReadAll ? {} : { user: req.user!.id };
  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json({ data: orders });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  const canReadAll = req.user!.permissions.includes('orders:read');
  if (!canReadAll && order.user.toString() !== req.user!.id) {
    throw new AppError('Forbidden', 403);
  }
  res.json({ data: order });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const order = await ordersService.updateOrderStatus(
    String(req.params.id),
    req.body.status,
    req.body.note,
  );
  res.json({ data: order });
});
