import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SetReviewRulesDto } from './dto/set-review-rules.dto';
import { ReviewRule, Prisma } from '@prisma/client';
import { InputReviewRuleDto } from './dto/input-review-rule.dto';

@Injectable()
export class ReviewSettingsService {
  private readonly logger = new Logger(ReviewSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getReviewRules(userId: string): Promise<ReviewRule[]> {
    this.logger.log(`Fetching review rules for user ${userId}`);
    try {
      return await this.prisma.reviewRule.findMany({
        where: { userId },
        orderBy: { value: 'asc' },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch review rules for user ${userId}: ${error.message}`,
      );
      throw new InternalServerErrorException('获取复习规则失败。');
    }
  }

  async setReviewRules(
    userId: string,
    dto: SetReviewRulesDto,
  ): Promise<ReviewRule[]> {
    const { rules } = dto;
    this.logger.log(
      `Setting review rules for user ${userId} with ${rules.length} rules.`,
    );

    try {
      return await this.prisma.$transaction(async (tx) => {
        this.logger.log(`Transaction for user ${userId}: Deleting old rules.`);
        await tx.reviewRule.deleteMany({
          where: { userId },
        });
        this.logger.log(`Transaction for user ${userId}: Old rules deleted.`);

        if (rules && rules.length > 0) {
          const dataToCreate: Prisma.ReviewRuleCreateManyInput[] = rules.map(
            (rule: InputReviewRuleDto) => ({
              userId,
              value: rule.value,
              unit: rule.unit,
              mode: rule.mode,
              note: rule.note,
            }),
          );
          this.logger.log(
            `Transaction for user ${userId}: Creating ${dataToCreate.length} new rules.`,
          );

          await tx.reviewRule.createMany({
            data: dataToCreate,
          });
          this.logger.log(
            `Transaction for user ${userId}: New rules created. Fetching updated rules.`,
          );

          return tx.reviewRule.findMany({
            where: { userId },
            orderBy: { value: 'asc' },
          });
        }
        this.logger.log(
          `Transaction for user ${userId}: No new rules provided. Returning empty array.`,
        );
        return [];
      });
    } catch (error) {
      this.logger.error(
        `Failed to set review rules for user ${userId}: ${error.message}`,
      );
      throw new InternalServerErrorException('设置复习规则失败。');
    }
  }
}
