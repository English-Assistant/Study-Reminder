import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ReviewRuleUnit,
  ReviewRuleRepetition,
  UserGlobalSettings as PrismaUserGlobalSettings,
  ReviewRule as PrismaReviewRule,
} from '@prisma/client';
import { SetGlobalReviewRulesDto } from './dto/set-global-review-rules.dto';
import { GlobalReviewSettingsDto } from './dto/global-review-settings.dto';

@Injectable()
export class ReviewSettingsService {
  private readonly logger = new Logger(ReviewSettingsService.name);

  constructor(private prisma: PrismaService) {}

  // Helper to get the fully typed UserGlobalSettings with its rules
  private async getFullGlobalSettings(
    userId: string,
  ): Promise<
    (PrismaUserGlobalSettings & { reviewRules: PrismaReviewRule[] }) | null
  > {
    return await this.prisma.userGlobalSettings.findUnique({
      where: { userId },
      include: { reviewRules: { orderBy: { createdAt: 'asc' } } },
    });
  }

  private async findOrCreateGlobalSettings(
    userId: string,
  ): Promise<PrismaUserGlobalSettings & { reviewRules: PrismaReviewRule[] }> {
    const settings = await this.getFullGlobalSettings(userId);

    if (!settings) {
      this.logger.log(
        `用户 ${userId} 的全局复习设置不存在，正在创建默认设置...`,
      );
      // Prisma create with nested create for rules returns the full object with includes
      const createdSettings = await this.prisma.userGlobalSettings.create({
        data: {
          userId,
          enabled: true,
          emailNotifications: false,
          appNotifications: true,
          reviewRules: {
            create: [
              {
                value: 1,
                unit: ReviewRuleUnit.HOURS,
                repetition: ReviewRuleRepetition.ONCE,
                description: '',
              },
              {
                value: 3,
                unit: ReviewRuleUnit.HOURS,
                repetition: ReviewRuleRepetition.ONCE,
                description: '',
              },
              {
                value: 1,
                unit: ReviewRuleUnit.DAYS,
                repetition: ReviewRuleRepetition.ONCE,
                description: '',
              },
              {
                value: 2,
                unit: ReviewRuleUnit.DAYS,
                repetition: ReviewRuleRepetition.ONCE,
                description: '',
              },
              {
                value: 3,
                unit: ReviewRuleUnit.DAYS,
                repetition: ReviewRuleRepetition.ONCE,
                description: '',
              },
              {
                value: 7,
                unit: ReviewRuleUnit.DAYS,
                repetition: ReviewRuleRepetition.ONCE,
                description: '',
              },
              {
                value: 15,
                unit: ReviewRuleUnit.DAYS,
                repetition: ReviewRuleRepetition.ONCE,
                description: '',
              },
              {
                value: 30,
                unit: ReviewRuleUnit.DAYS,
                repetition: ReviewRuleRepetition.ONCE,
                description: '',
              },
              {
                value: 90,
                unit: ReviewRuleUnit.DAYS,
                repetition: ReviewRuleRepetition.ONCE,
                description: '',
              },
            ],
          },
        },
        include: { reviewRules: { orderBy: { createdAt: 'asc' } } },
      });
      this.logger.log(
        `为用户 ${userId} 创建了ID为 ${createdSettings.id} 的全局复习设置。`,
      );
      return createdSettings; // Explicitly return the typed result of create
    }
    return settings;
  }

  async getGlobalSettings(userId: string): Promise<GlobalReviewSettingsDto> {
    const settings = await this.findOrCreateGlobalSettings(userId);
    return {
      enabled: settings.enabled,
      emailNotifications: settings.emailNotifications,
      appNotifications: settings.appNotifications,
      rules: settings.reviewRules.map((rule) => ({
        id: rule.id,
        value: rule.value,
        unit: rule.unit,
        repetition: rule.repetition,
        description: rule.description ?? undefined,
      })),
    };
  }

  async setGlobalSettings(
    userId: string,
    settingsDto: SetGlobalReviewRulesDto,
  ): Promise<GlobalReviewSettingsDto> {
    // Ensure settings exist and get ID
    const existingSettings = await this.findOrCreateGlobalSettings(userId);
    const globalSettingsId = existingSettings.id;

    const { rules, enabled, emailNotifications, appNotifications } =
      settingsDto;

    const transactionResults = await this.prisma.$transaction(async (tx) => {
      const updateSettingsData: Partial<
        Omit<
          PrismaUserGlobalSettings,
          'id' | 'userId' | 'createdAt' | 'reviewRules'
        >
      > = {};
      if (enabled !== undefined) updateSettingsData.enabled = enabled;
      if (emailNotifications !== undefined)
        updateSettingsData.emailNotifications = emailNotifications;
      if (appNotifications !== undefined)
        updateSettingsData.appNotifications = appNotifications;

      if (Object.keys(updateSettingsData).length > 0) {
        await tx.userGlobalSettings.update({
          where: { id: globalSettingsId },
          data: updateSettingsData,
        });
        this.logger.log(
          `用户 ${userId} (settingsId: ${globalSettingsId}) 的全局布尔型设置已更新。`,
        );
      }

      if (rules !== undefined) {
        await tx.reviewRule.deleteMany({
          where: { globalSettingsId: globalSettingsId },
        });
        this.logger.log(
          `已删除用户 ${userId} (settingsId: ${globalSettingsId}) 的旧复习规则。`,
        );

        if (rules.length > 0) {
          const newRulesData = rules.map((ruleDto) => ({
            value: ruleDto.value,
            unit: ruleDto.unit,
            repetition: ruleDto.repetition,
            description: ruleDto.description,
            globalSettingsId: globalSettingsId,
          }));
          await tx.reviewRule.createMany({
            data: newRulesData,
          });
          this.logger.log(
            `为用户 ${userId} (settingsId: ${globalSettingsId}) 创建了 ${newRulesData.length} 条新复习规则。`,
          );
        }
      }

      const finalSettingsWithRules =
        await tx.userGlobalSettings.findUniqueOrThrow({
          where: { id: globalSettingsId },
          include: { reviewRules: { orderBy: { createdAt: 'asc' } } },
        });
      return finalSettingsWithRules;
    });

    return {
      enabled: transactionResults.enabled,
      emailNotifications: transactionResults.emailNotifications,
      appNotifications: transactionResults.appNotifications,
      rules: transactionResults.reviewRules.map((rule) => ({
        id: rule.id,
        value: rule.value,
        unit: rule.unit,
        repetition: rule.repetition,
        description: rule.description ?? undefined,
      })),
    };
  }
}
