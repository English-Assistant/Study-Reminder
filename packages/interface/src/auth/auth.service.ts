import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserWithoutPassword } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Setting, ReviewRule, IntervalUnit, ReviewMode } from '@prisma/client';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import * as _ from 'lodash';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  /**
   * 用户登录或注册。
   * 如果用户存在，则验证密码并登录；如果用户不存在，则自动创建新用户并登录。
   * @param username 用户名
   * @param passwordRaw 原始密码
   * @param email 邮箱
   * @returns 包含 access_token 和用户信息的对象
   */
  async loginOrRegister(
    username: string,
    passwordRaw: string,
    email?: string,
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
      // 如果用户存在，并且用户提供了 email，则校验 email
      if (email && userRecord.email !== email) {
        this.logger.warn(
          `登录尝试失败，用户: ${username} - 提供的邮箱与记录不符。`,
        );
        throw new ConflictException('提供的邮箱与该用户记录不符。');
      }
      const userResult = _.omit(userRecord, ['password']);
      const payload = { username: userResult.username, sub: userResult.id };
      return {
        access_token: await this.jwtService.signAsync(payload),
        user: userResult,
      };
    } else {
      // 用户不存在，尝试注册
      // 注册时 email 是必需的
      if (!email) {
        this.logger.warn(`注册尝试失败，用户: ${username} - 未提供邮箱。`);
        throw new BadRequestException('注册新用户时，邮箱是必填项。');
      }
      this.logger.log(`用户 ${username} 未找到，使用邮箱 ${email} 尝试注册。`);
      try {
        // 检查邮箱是否已被其他用户使用
        const existingUserByEmail = await this.prisma.user.findUnique({
          where: { email },
        });
        if (existingUserByEmail) {
          throw new ConflictException('此邮箱已被其他用户注册。');
        }

        const newUser = await this.usersService.createUser(
          username,
          passwordRaw,
          email,
        );
        // 自动为新用户创建默认设置
        await this.getUserSettings(newUser.id);

        // 创建默认复习规则
        const defaultRulesData: Omit<ReviewRule, 'id' | 'note'>[] = [
          {
            userId: newUser.id,
            value: 1,
            unit: IntervalUnit.HOUR,
            mode: ReviewMode.ONCE,
          },
          {
            userId: newUser.id,
            value: 1,
            unit: IntervalUnit.DAY,
            mode: ReviewMode.ONCE,
          },
          {
            userId: newUser.id,
            value: 2,
            unit: IntervalUnit.DAY,
            mode: ReviewMode.ONCE,
          },
          {
            userId: newUser.id,
            value: 3,
            unit: IntervalUnit.DAY,
            mode: ReviewMode.ONCE,
          },
          {
            userId: newUser.id,
            value: 7,
            unit: IntervalUnit.DAY,
            mode: ReviewMode.ONCE,
          },
          {
            userId: newUser.id,
            value: 30,
            unit: IntervalUnit.DAY,
            mode: ReviewMode.ONCE,
          },
          {
            userId: newUser.id,
            value: 60,
            unit: IntervalUnit.DAY,
            mode: ReviewMode.ONCE,
          },
          {
            userId: newUser.id,
            value: 90,
            unit: IntervalUnit.DAY,
            mode: ReviewMode.ONCE,
          },
        ];
        try {
          await this.prisma.reviewRule.createMany({ data: defaultRulesData });
          this.logger.log(`为用户 ${newUser.id} 创建了默认复习规则。`);
        } catch (ruleError) {
          this.logger.error(
            `为用户 ${newUser.id} 创建默认复习规则失败:`,
            ruleError,
          );
          // 根据策略，这里可以选择是否因为规则创建失败而回滚用户创建或抛出错误
          // 当前选择仅记录错误，不影响用户注册流程
        }

        const payload = { username: newUser.username, sub: newUser.id };
        return {
          access_token: await this.jwtService.signAsync(payload),
          user: newUser,
        };
      } catch (error) {
        if (error instanceof ConflictException) throw error; // 重抛已知的 ConflictException
        this.logger.error(
          `用户自动注册过程中发生错误: ${username}, ${email}`,
          error instanceof Error ? error.stack : String(error),
        );
        // Prisma P2002 错误码表示唯一约束失败 (可能是 username 或 email)
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          (error as { code?: string }).code === 'P2002'
        ) {
          const target = error.meta?.target;
          if (target && target.includes('username')) {
            throw new ConflictException('用户名已存在。');
          }
          if (target && target.includes('email')) {
            throw new ConflictException('此邮箱已被其他用户注册。');
          }
        }
        throw new UnauthorizedException('注册或登录过程中发生内部错误。');
      }
    }
  }

  async getUserSettings(userId: string): Promise<Setting> {
    let settings = await this.prisma.setting.findUnique({
      where: { userId },
    });
    if (!settings) {
      this.logger.log(`用户 ${userId} 的设置未找到，创建默认设置。`);
      settings = await this.prisma.setting.create({
        data: {
          userId,
          // globalNotification: true, // 默认值由 Prisma schema 定义
          // emailNotification: true,
          // inAppNotification: true,
        },
      });
    }
    return settings;
  }

  async updateUserSettings(
    userId: string,
    dto: UpdateSettingsDto,
  ): Promise<Setting> {
    // 首先确保设置存在，如果不存在则创建（虽然 getUserSettings 通常会先被调用）
    await this.getUserSettings(userId);

    const updateData: Partial<Setting> = {};
    if (dto.globalNotification !== undefined) {
      updateData.globalNotification = dto.globalNotification;
    }
    if (dto.emailNotification !== undefined) {
      updateData.emailNotification = dto.emailNotification;
    }
    if (dto.inAppNotification !== undefined) {
      updateData.inAppNotification = dto.inAppNotification;
    }

    if (Object.keys(updateData).length === 0) {
      // 如果没有提供任何可更新的字段，直接返回当前设置
      return this.prisma.setting.findUniqueOrThrow({ where: { userId } });
    }

    return this.prisma.setting.update({
      where: { userId },
      data: updateData,
    });
  }
}
