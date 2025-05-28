import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from '../constants';
import { UsersService } from '../../users/users.service';
import type { UserWithoutPassword } from '../../users/users.service'; // Import UserWithoutPassword

export interface JwtPayload {
  username: string;
  sub: string;
  roles?: string[];
}

// AuthenticatedUserPayload 接口不再需要，将被移除

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
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
  async validate(payload: JwtPayload): Promise<UserWithoutPassword> {
    // 返回 UserWithoutPassword
    const userFromDb = await this.usersService.findOneById(payload.sub);
    if (!userFromDb) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }
    return userFromDb; // 返回完整的 UserWithoutPassword 对象
  }
}
