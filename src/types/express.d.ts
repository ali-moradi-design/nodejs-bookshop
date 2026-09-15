import { Types } from 'mongoose';

export interface AuthUser {
  id: string;
  email: string;
  roles: Types.ObjectId[] | string[];
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
