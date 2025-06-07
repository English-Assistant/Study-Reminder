import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import cryptoRandomString from 'crypto-random-string';
import { addMinutes } from 'date-fns';

export enum VerificationCodeType {
  REGISTER = 'register',
  RESET_PASSWORD = 'reset_password',
  UNREGISTER = 'unregister',
}

@Injectable()
export class VerificationCodeService {
  private readonly logger = new Logger(VerificationCodeService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  /**
   * 生成并发送验证码
   */
  async generateAndSendCode(
    email: string,
    type: VerificationCodeType,
    userName?: string,
    expirationMinutes: number = 10,
  ): Promise<void> {
    // 清理该邮箱的旧验证码
    await this.cleanupOldCodes(email, type);

    // 生成新的验证码
    const code = cryptoRandomString({
      length: 6,
      type: 'numeric',
    });

    const expiresAt = addMinutes(new Date(), expirationMinutes);

    // 保存到数据库
    await this.prisma.verificationCode.create({
      data: {
        email,
        code,
        type,
        expiresAt,
      },
    });

    // 根据类型发送不同的邮件
    if (type === VerificationCodeType.RESET_PASSWORD) {
      await this.mailService.sendResetPasswordCodeEmail(
        email,
        userName || '用户',
        code,
        expirationMinutes,
      );
    } else if (type === VerificationCodeType.UNREGISTER) {
      await this.mailService.sendUnregisterCodeEmail(
        email,
        userName || '用户',
        code,
        expirationMinutes,
      );
    } else {
      await this.mailService.sendVerificationCodeEmail(
        email,
        userName || '用户',
        code,
        expirationMinutes,
        type as 'register',
      );
    }

    this.logger.log(`验证码已发送到 ${email}，类型: ${type}`);
  }

  /**
   * 验证验证码
   */
  async verifyCode(
    email: string,
    code: string,
    type: VerificationCodeType,
  ): Promise<boolean> {
    const verificationRecord = await this.prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verificationRecord) {
      this.logger.warn(`验证失败 - 邮箱: ${email}, 类型: ${type}`);
      return false;
    }

    // 标记为已使用
    await this.prisma.verificationCode.update({
      where: {
        id: verificationRecord.id,
      },
      data: {
        used: true,
      },
    });

    this.logger.log(`验证码验证成功 - 邮箱: ${email}, 类型: ${type}`);
    return true;
  }

  /**
   * 清理旧的验证码
   */
  private async cleanupOldCodes(
    email: string,
    type: VerificationCodeType,
  ): Promise<void> {
    await this.prisma.verificationCode.deleteMany({
      where: {
        email,
        type,
        OR: [{ used: true }, { expiresAt: { lt: new Date() } }],
      },
    });
  }

  /**
   * 检查是否可以发送验证码（防止频繁发送）
   */
  async canSendCode(
    email: string,
    type: VerificationCodeType,
    cooldownMinutes: number = 1,
  ): Promise<boolean> {
    const lastCode = await this.prisma.verificationCode.findFirst({
      where: {
        email,
        type,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!lastCode) {
      return true;
    }

    const cooldownTime = addMinutes(lastCode.createdAt, cooldownMinutes);
    return new Date() > cooldownTime;
  }

  /**
   * 验证并消费验证码（组合操作）
   */
  async validateAndConsume(
    email: string,
    code: string,
    type: VerificationCodeType,
  ): Promise<void> {
    const isValid = await this.verifyCode(email, code, type);
    if (!isValid) {
      throw new BadRequestException('验证码无效或已过期');
    }
  }
}
