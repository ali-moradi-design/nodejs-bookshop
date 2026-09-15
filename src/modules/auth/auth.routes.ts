import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate';
import * as ctrl from './auth.controller';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from './auth.validation';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, try again later' },
});

const router = Router();

router.use(authLimiter);

router.post('/register', validate({ body: registerSchema }), ctrl.register);
router.post('/login', validate({ body: loginSchema }), ctrl.login);
router.post('/refresh', validate({ body: refreshSchema }), ctrl.refresh);
router.post('/logout', validate({ body: logoutSchema }), ctrl.logout);

export default router;
