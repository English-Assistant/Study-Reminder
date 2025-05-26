import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { UsersModuleService } from '../users-module/users-module.service';
import { UserWithoutPassword } from '../users-module/users-module.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthModuleService {
  private readonly logger = new Logger(AuthModuleService.name);

  constructor(
    private usersService: UsersModuleService,
    private jwtService: JwtService,
  ) {}

  /**
   * 验证用户凭据。
   * @param username 用户名
   * @param pass 原始密码
   * @returns 验证通过则返回用户信息 (不含密码)，否则返回 null
   */
  async validateUser(
    username: string,
    pass: string,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.usersService.findOneByUsername(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * 用户登录或注册。
   * 如果用户存在，则验证密码并登录；如果用户不存在，则自动创建新用户并登录。
   * @param username 用户名
   * @param passwordRaw 原始密码
   * @returns 包含 access_token 和用户信息的对象
   */
  async loginOrRegister(
    username: string,
    passwordRaw: string,
  ): Promise<{ access_token: string; user: UserWithoutPassword }> {
    const userRecord = await this.usersService.findOneByUsername(username);

    if (userRecord) {
      // 用户存在，验证密码
      const isValidPassword = await bcrypt.compare(
        passwordRaw,
        userRecord.password,
      );
      if (!isValidPassword) {
        this.logger.warn(`登录尝试失败，用户: ${username} - 密码无效`);
        throw new UnauthorizedException('用户名或密码错误');
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userResult } = userRecord;
      const payload = {
        username: userResult.username,
        sub: userResult.id,
        roles: ['user'],
      }; // 示例：添加角色信息到payload
      return {
        access_token: await this.jwtService.signAsync(payload),
        user: userResult,
      };
    } else {
      // 用户不存在，创建新用户
      this.logger.log(`用户 ${username} 未找到，尝试注册。`);
      try {
        const newUser = await this.usersService.createUser(
          username,
          passwordRaw,
        );
        const payload = {
          username: newUser.username,
          sub: newUser.id,
          roles: ['user'],
        }; // 示例：添加角色信息到payload
        return {
          access_token: await this.jwtService.signAsync(payload),
          user: newUser,
        };
      } catch (error) {
        this.logger.error(
          `用户自动注册过程中发生错误: ${username}`,
          error instanceof Error ? error.stack : String(error),
        );
        // 检查 Prisma 唯一约束冲突错误
        // PrismaClientKnownRequestError 具有 code 属性
        if (error && typeof error === 'object' && 'code' in error) {
          const prismaErrorCode = (error as { code?: string }).code;
          if (prismaErrorCode === 'P2002') {
            throw new ConflictException(
              '用户名已存在，但自动注册时发生冲突，请重试。',
            );
          }
        }
        throw new UnauthorizedException('注册或登录过程中发生内部错误。');
      }
    }
  }
}
