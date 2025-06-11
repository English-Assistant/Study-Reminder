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
import { Setting } from '@prisma/client';
import * as _ from 'lodash';
import {
  VerificationCodeService,
  VerificationCodeType,
} from '../verification-code/verification-code.service';
import { defaultReviewRules } from '../common/constants/review.constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private verificationCodeService: VerificationCodeService,
  ) {}

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

  /**
   * 用户登录（仅需账号+密码）
   */
  async login(
    username: string,
    password: string,
  ): Promise<{ access_token: string; user: UserWithoutPassword }> {
    const userRecord = await this.usersService.findOneByUsername(username);
    if (!userRecord) {
      this.logger.warn(`登录尝试失败，用户: ${username} - 用户不存在`);
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, userRecord.password);
    if (!isValidPassword) {
      this.logger.warn(`登录尝试失败，用户: ${username} - 密码无效`);
      throw new UnauthorizedException('用户名或密码错误');
    }

    const userResult = _.omit(userRecord, ['password']);
    const payload = { username: userResult.username, sub: userResult.id };

    this.logger.log(`用户 ${username} 登录成功`);
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: userResult,
    };
  }

  /**
   * 用户注册（需要验证码）
   */
  async register(
    username: string,
    password: string,
    email: string,
    verificationCode: string,
  ): Promise<{ access_token: string; user: UserWithoutPassword }> {
    // 检查用户名是否已存在
    const existingUser = await this.usersService.findOneByUsername(username);
    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 检查邮箱是否已被使用
    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUserByEmail) {
      throw new ConflictException('此邮箱已被其他用户注册');
    }

    // 验证验证码
    await this.verificationCodeService.validateAndConsume(
      email,
      verificationCode,
      VerificationCodeType.REGISTER,
    );

    try {
      // 创建新用户
      const newUser = await this.usersService.createUser(
        username,
        password,
        email,
      );

      // 自动为新用户创建默认设置
      await this.getUserSettings(newUser.id);

      // 创建默认复习规则
      const defaultRulesData = defaultReviewRules.map((rule) => ({
        value: rule.value,
        unit: rule.unit,
        mode: rule.mode,
        note: rule.note,
        userId: newUser.id,
      }));
      await this.prisma.reviewRule.createMany({
        data: defaultRulesData,
      });

      const payload = { username: newUser.username, sub: newUser.id };

      this.logger.log(`用户 ${username} 注册成功`);
      return {
        access_token: await this.jwtService.signAsync(payload),
        user: newUser,
      };
    } catch (error) {
      this.logger.error(
        `用户注册过程中发生错误: ${username}, ${email}`,
        error instanceof Error ? error.stack : String(error),
      );

      // 处理 Prisma 唯一约束错误
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        const target = error.meta?.target;
        if (target && target.includes('username')) {
          throw new ConflictException('用户名已存在');
        }
        if (target && target.includes('email')) {
          throw new ConflictException('此邮箱已被其他用户注册');
        }
      }
      throw new BadRequestException('注册过程中发生内部错误');
    }
  }

  /**
   * 重置密码（需要验证码）
   */
  async resetPassword(
    email: string,
    newPassword: string,
    verificationCode: string,
  ): Promise<{ message: string }> {
    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new BadRequestException('该邮箱未注册');
    }

    // 验证验证码
    await this.verificationCodeService.validateAndConsume(
      email,
      verificationCode,
      VerificationCodeType.RESET_PASSWORD,
    );

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    this.logger.log(`用户 ${email} 密码重置成功`);
    return { message: '密码重置成功' };
  }

  /**
   * 发送验证码
   */
  async sendVerificationCode(
    email: string,
    type: VerificationCodeType,
    username?: string,
  ): Promise<{ message: string }> {
    // 检查发送频率限制
    const canSend = await this.verificationCodeService.canSendCode(email, type);
    if (!canSend) {
      throw new BadRequestException('发送过于频繁，请稍后再试');
    }

    // 根据类型进行额外验证
    if (type === VerificationCodeType.REGISTER) {
      // 注册验证码：检查邮箱是否已被使用
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException('此邮箱已被注册');
      }
    } else if (type === VerificationCodeType.RESET_PASSWORD) {
      // 重置密码验证码：检查邮箱是否存在
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (!existingUser) {
        throw new BadRequestException('该邮箱未注册');
      }
      username = existingUser.username;
    }

    await this.verificationCodeService.generateAndSendCode(
      email,
      type,
      username,
    );

    return { message: '验证码已发送' };
  }

  /**
   * 发送注销验证码
   */
  async sendUnregisterCode(userId: string): Promise<{ message: string }> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    const canSend = await this.verificationCodeService.canSendCode(
      user.email,
      VerificationCodeType.UNREGISTER,
    );
    if (!canSend) {
      throw new BadRequestException('发送过于频繁，请稍后再试');
    }

    await this.verificationCodeService.generateAndSendCode(
      user.email,
      VerificationCodeType.UNREGISTER,
      user.username,
    );

    return { message: '注销验证码已发送至您的邮箱' };
  }

  /**
   * 注销账户
   */
  async unregister(
    userId: string,
    verificationCode: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      // This should not happen if the user is authenticated via JWT
      throw new UnauthorizedException('用户不存在');
    }

    // 1. 验证验证码
    await this.verificationCodeService.validateAndConsume(
      user.email,
      verificationCode,
      VerificationCodeType.UNREGISTER,
    );

    // 2. 使用事务删除用户及所有相关数据
    try {
      await this.prisma.$transaction(async (tx) => {
        // 按依赖顺序删除
        await tx.reviewRule.deleteMany({ where: { userId } });
        await tx.setting.deleteMany({ where: { userId } });
        await tx.studyRecord.deleteMany({ where: { userId } });
        await tx.course.deleteMany({ where: { userId } });
        await tx.verificationCode.deleteMany({ where: { email: user.email } });

        // 最后删除用户
        await tx.user.delete({ where: { id: userId } });
      });

      this.logger.log(`用户 ${user.username} (ID: ${userId}) 已成功注销`);
      return { message: '账户已成功注销' };
    } catch (error) {
      this.logger.error(
        `注销用户 ${userId} 时发生错误`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException('注销过程中发生错误，请稍后重试');
    }
  }
}
