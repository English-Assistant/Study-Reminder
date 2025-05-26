import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserWithoutPassword } from '../../users-module/users-module.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // 可以重写 handleRequest 方法来自定义认证成功或失败时的行为
  // 例如，如果 token 无效，可以抛出自定义的异常或返回特定的响应
  handleRequest<TUser = UserWithoutPassword>(
    err: any,
    user: TUser | undefined,
    info: any,
  ): TUser {
    if (err || !user) {
      // info 可能包含 JWT 过期或无效的详细信息
      // 例如：info.name === 'TokenExpiredError'
      // info.message === 'jwt expired'
      const errorMessage =
        info instanceof Error ? info.message : '无效或过期的Token';
      throw err || new UnauthorizedException(errorMessage);
    }
    return user; // 认证成功，返回 user 对象，它将被注入到 req.user
  }

  // 可选：如果需要允许某些公共路由跳过此守卫（例如使用 @Public() 装饰器时）
  // 你可能需要结合 Reflector 来检查元数据
  // canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
  //   // const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
  //   //   context.getHandler(),
  //   //   context.getClass(),
  //   // ]);
  //   // if (isPublic) {
  //   //   return true;
  //   // }
  //   return super.canActivate(context);
  // }
}
