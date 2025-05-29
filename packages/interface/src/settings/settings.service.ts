import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdateReviewNotificationSettingsDto } from './dto/update-review-notification-settings.dto';
import { SettingDto } from './dto/setting.dto';
import { Prisma } from '@prisma/client';
import { ReviewSettingsService } from '../review-settings/review-settings.service'; // 导入 ReviewSettingsService

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private prisma: PrismaService,
    private reviewSettingsService: ReviewSettingsService, // 注入 ReviewSettingsService
  ) {}

  async getSettings(userId: string): Promise<SettingDto> {
    this.logger.log(`Fetching settings for user ${userId}`);
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          settings: true,
          reviewRules: { orderBy: { value: 'asc' } },
        },
      });

      if (!user) {
        this.logger.warn(
          `User with ID ${userId} not found while fetching settings.`,
        );
        throw new NotFoundException('用户不存在');
      }

      // 确保 settings 存在，如果不存在则使用默认值
      const userSettings = user.settings || {
        globalNotification: true, // 默认值
        emailNotification: true, // 默认值
        inAppNotification: true, // 默认值
      };

      return {
        email: user.email,
        reviewRules: user.reviewRules.map((rule) => ({
          id: rule.id,
          value: rule.value,
          unit: rule.unit,
          mode: rule.mode,
          note: rule.note ?? undefined,
        })),
        notificationSettings: {
          globalNotification: userSettings.globalNotification,
          emailNotification: userSettings.emailNotification,
          inAppNotification: userSettings.inAppNotification,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch settings for user ${userId}: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('获取用户设置失败');
    }
  }

  async updateEmail(
    userId: string,
    updateEmailDto: UpdateEmailDto,
  ): Promise<{ message: string }> {
    this.logger.log(`Updating email for user ${userId}`);
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { email: updateEmailDto.email },
      });
      return { message: '用户邮箱更新成功' };
    } catch (error) {
      this.logger.error(
        `Failed to update email for user ${userId}: ${error.message}`,
        error.stack,
      );
      // Prisma P2025: Record to update not found.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('用户不存在');
      }
      // Prisma P2002: Unique constraint failed (e.g. email already taken)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new InternalServerErrorException('该邮箱已被使用');
      }
      throw new InternalServerErrorException('更新邮箱失败');
    }
  }

  async updateReviewNotificationSettings(
    userId: string,
    dto: UpdateReviewNotificationSettingsDto,
  ): Promise<{ message: string }> {
    this.logger.log(`Updating review/notification settings for user ${userId}`);
    try {
      // 1. 更新复习规则 (dto.reviewRules 现在是必填的)
      // setReviewRules 需要的 DTO 结构是 { rules: InputReviewRuleDto[] }
      await this.reviewSettingsService.setReviewRules(userId, {
        rules: dto.reviewRules,
      });
      this.logger.log(`Review rules updated for user ${userId}`);

      // 2. 更新通知设置 (dto.notificationSettings 对象现在是必填的)
      // 其内部属性 (globalNotification, etc.) 仍然是可选的。
      const { globalNotification, emailNotification, inAppNotification } =
        dto.notificationSettings;

      const updateData: Prisma.SettingUpdateInput = {};
      if (globalNotification !== undefined) {
        updateData.globalNotification = globalNotification;
      }
      if (emailNotification !== undefined) {
        updateData.emailNotification = emailNotification;
      }
      if (inAppNotification !== undefined) {
        updateData.inAppNotification = inAppNotification;
      }

      await this.prisma.setting.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          // 如果 dto.notificationSettings 中的字段为 undefined (即客户端未提供该可选字段),
          // Prisma 将使用 schema.prisma 中定义的 @default 值。
          // 如果 schema.prisma 中没有定义 @default，并且你希望在此处有显式默认值(例如 true),
          // 则应使用: globalNotification: globalNotification ?? true,
          // 这里假设 Prisma Schema 已为这些字段设置了合适的默认值。
          globalNotification: globalNotification,
          emailNotification: emailNotification,
          inAppNotification: inAppNotification,
        },
      });
      this.logger.log(`Notification settings processed for user ${userId}`);

      return { message: '用户设置更新成功' };
    } catch (error) {
      this.logger.error(
        `Failed to update review/notification settings for user ${userId}: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('更新用户设置失败');
    }
  }
}
