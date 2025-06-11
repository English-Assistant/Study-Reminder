import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEmailDto } from './dto/update-email.dto';
import { SettingDto } from './dto/setting.dto';
import { Prisma, StudyTimeWindow } from '@prisma/client';
import { ReviewSettingsService } from '../review-settings/review-settings.service';
import {
  CreateStudyTimeWindowDto,
  UpdateStudyTimeWindowDto,
} from './dto/study-time-window.dto';
import { UpdateNotificationFlagsDto } from './dto/update-notification-flags.dto';
import { ReviewRuleDto } from '../review-settings/dto/review-rule.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private prisma: PrismaService,
    private reviewSettingsService: ReviewSettingsService,
  ) {}

  async getSettings(userId: string): Promise<SettingDto> {
    this.logger.log(`正在获取用户 ${userId} 的设置`);
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          settings: true,
          reviewRules: { orderBy: { id: 'asc' } },
        },
      });

      if (!user) {
        this.logger.warn(`获取设置时未找到ID为 ${userId} 的用户`);

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
        `获取用户 ${userId} 的设置失败: ${error.message}`,
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
    this.logger.log(`正在更新用户 ${userId} 的邮箱`);
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { email: updateEmailDto.email },
      });
      return { message: '用户邮箱更新成功' };
    } catch (error) {
      this.logger.error(
        `更新用户 ${userId} 的邮箱失败: ${error.message}`,
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

  async updateNotificationFlags(
    userId: string,
    dto: UpdateNotificationFlagsDto,
  ): Promise<{ message: string }> {
    this.logger.log(`正在更新用户 ${userId} 的通知标志`);
    try {
      await this.prisma.setting.upsert({
        where: { userId },
        update: dto,
        create: {
          userId,
          ...dto,
        },
      });
      return { message: '通知设置更新成功' };
    } catch (error) {
      this.logger.error(
        `更新用户 ${userId} 的通知标志失败: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('更新通知设置失败');
    }
  }

  /**
   * 更新用户的复习规则
   * @param userId - 用户ID
   * @param rules - 复习规则数组
   */
  async updateReviewRules(
    userId: string,
    rules: ReviewRuleDto[],
  ): Promise<{ message: string }> {
    this.logger.log(`正在更新用户 ${userId} 的复习规则`);
    try {
      await this.reviewSettingsService.setReviewRules(userId, {
        rules: rules,
      });

      return { message: '复习规则更新成功' };
    } catch (error) {
      this.logger.error(
        `更新用户 ${userId} 的复习规则失败: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('更新复习规则失败');
    }
  }

  /**
   * 获取用户的所有学习时间段
   */
  async getStudyTimeWindows(userId: string): Promise<StudyTimeWindow[]> {
    return await this.prisma.studyTimeWindow.findMany({
      where: { userId },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * 创建新的学习时间段
   */
  async createStudyTimeWindow(
    userId: string,
    dto: CreateStudyTimeWindowDto,
  ): Promise<StudyTimeWindow> {
    // 验证结束时间是否晚于开始时间
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('结束时间必须晚于开始时间');
    }

    return await this.prisma.studyTimeWindow.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  /**
   * 更新学习时间段
   */
  async updateStudyTimeWindow(
    id: string,
    dto: UpdateStudyTimeWindowDto,
  ): Promise<StudyTimeWindow> {
    const existingWindow = await this.prisma.studyTimeWindow.findUnique({
      where: { id },
    });
    if (!existingWindow) {
      throw new NotFoundException('找不到指定的时间段');
    }

    const newStartTime = dto.startTime ?? existingWindow.startTime;
    const newEndTime = dto.endTime ?? existingWindow.endTime;

    if (newStartTime >= newEndTime) {
      throw new BadRequestException('结束时间必须晚于开始时间');
    }

    return this.prisma.studyTimeWindow.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * 删除学习时间段
   */
  async deleteStudyTimeWindow(id: string): Promise<{ message: string }> {
    try {
      await this.prisma.studyTimeWindow.delete({ where: { id } });
      return { message: '学习时间段已删除' };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('找不到要删除的时间段');
      }
      throw new InternalServerErrorException('删除失败');
    }
  }
}
