import { User } from '../user/schemas/user.schema';

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

export {};
