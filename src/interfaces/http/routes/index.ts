import { Router } from 'express';
import authRoutes from './auth.routes';
import permissionsRoutes from './permissions.routes';
import rolesRoutes from './roles.routes';
import usersRoutes from './users.routes';
import booksRoutes from './books.routes';
import reviewsRoutes from './reviews.routes';
import ordersRoutes from './orders.routes';
import reportsRoutes from './reports.routes';

const api = Router();

api.use('/auth', authRoutes);
api.use('/permissions', permissionsRoutes);
api.use('/roles', rolesRoutes);
api.use('/users', usersRoutes);
api.use('/books', booksRoutes);
api.use('/reviews', reviewsRoutes);
api.use('/orders', ordersRoutes);
api.use('/reports', reportsRoutes);

export default api;
