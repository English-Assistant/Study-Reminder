import { Request } from 'express';
import { UserWithoutPassword } from '../../users/users.service'; // 确保路径正确

// AuthenticatedUser 接口不再需要，已被 UserWithoutPassword 替代

export interface AuthenticatedRequest extends Request {
  user: UserWithoutPassword;
}
