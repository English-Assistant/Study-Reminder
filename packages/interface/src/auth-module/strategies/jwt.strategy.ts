import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants';
import {
  UsersModuleService,
  // UserWithoutPassword, // 不再直接返回 UserWithoutPassword，而是映射后的对象
} from '../../users-module/users-module.service';

export interface JwtPayload {
  username: string;
  sub: string;
  roles?: string[];
}

// 定义期望附加到请求上的用户对象结构
// 这应该与控制器中 AuthenticatedRequest 定义的 user 结构一致
export interface AuthenticatedUserPayload {
  userId: string;
  username: string;
  // 可以根据需要从 UserWithoutPassword 中添加其他安全字段
  // email?: string; // 示例
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersModuleService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  /**
   * JWT 验证回调。
   * Passport 会在验证 JWT 签名后调用此方法，并将解析后的 payload 作为参数传入。
   * @param payload JWT 载荷
   * @returns 返回的用户对象将被 NestJS 附加到 Request 对象上 (例如 req.user)
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUserPayload> {
    // 修改返回类型
    const userFromDb = await this.usersService.findOneById(payload.sub);
    if (!userFromDb) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }
    // 将从数据库获取的用户对象映射到 AuthenticatedUserPayload 结构
    return {
      userId: userFromDb.id, // 使用数据库中的 id 作为 userId
      username: userFromDb.username,
      // 如果 UserWithoutPassword 有其他需要暴露给 req.user 的安全字段，可以在此添加
      // email: userFromDb.email, // 示例，前提是 userFromDb 有 email 字段
    };
  }
}
