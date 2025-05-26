import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants';
import {
  UsersModuleService,
  UserWithoutPassword,
} from '../../users-module/users-module.service'; // 确保路径正确

export interface JwtPayload {
  username: string;
  sub: string; // 通常是用户ID
  roles?: string[]; // 可选：角色信息
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersModuleService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 从 Authorization header (Bearer token) 中提取 JWT
      ignoreExpiration: false, // 确保 token 未过期
      secretOrKey: jwtConstants.secret, // 使用我们定义的密钥
    });
  }

  /**
   * JWT 验证回调。
   * Passport 会在验证 JWT 签名后调用此方法，并将解析后的 payload 作为参数传入。
   * @param payload JWT 载荷
   * @returns 返回的用户对象将被 NestJS 附加到 Request 对象上 (例如 req.user)
   */
  async validate(payload: JwtPayload): Promise<UserWithoutPassword> {
    // 可以在这里根据 payload 中的用户ID去数据库查找更完整的用户信息
    // 或者如果 payload 中信息足够，直接返回部分信息
    // 这里我们假设 sub 字段是用户ID
    const user = await this.usersService.findOneById(payload.sub);
    if (!user) {
      // 如果根据 payload 中的信息找不到用户 (例如用户已被删除)，则抛出未授权异常
      throw new UnauthorizedException('用户不存在或已被禁用');
    }
    // 返回的用户信息不应包含密码等敏感数据
    return user;
  }
}
