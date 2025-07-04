import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SetReviewRulesDto } from './dto/set-review-rules.dto';
import { ReviewRule } from '@prisma/client';

@Injectable()
export class ReviewSettingsService {
  private readonly logger = new Logger(ReviewSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取用户的所有复习规则
   */
  async getReviewRules(userId: string): Promise<ReviewRule[]> {
    this.logger.log(`正在获取用户 ${userId} 的复习规则`);
    try {
      return await this.prisma.reviewRule.findMany({
        where: { userId },
        orderBy: { id: 'asc' },
      });
    } catch (error) {
      this.logger.error(`获取用户 ${userId} 的复习规则失败: ${error.message}`);
      throw new InternalServerErrorException('获取复习规则失败。');
    }
  }

  /**
   * 设置用户复习规则（事务：先删后增）
   */
  async setReviewRules(
    userId: string,
    dto: SetReviewRulesDto,
  ): Promise<ReviewRule[]> {
    const { rules } = dto;
    this.logger.log(`正在为用户 ${userId} 设置 ${rules.length} 条复习规则`);

    try {
      return await this.prisma.$transaction(async (tx) => {
        this.logger.log(`用户 ${userId} 的事务: 正在删除旧规则`);
        await tx.reviewRule.deleteMany({
          where: { userId },
        });
        this.logger.log(`用户 ${userId} 的事务: 旧规则已删除`);

        if (rules && rules.length > 0) {
          this.logger.log(
            `用户 ${userId} 的事务: 正在创建 ${rules.length} 条新规则`,
          );
          for (const rule of rules) {
            await tx.reviewRule.create({
              data: {
                userId,
                value: rule.value,
                unit: rule.unit,
                mode: rule.mode,
                note: rule.note,
              },
            });
          }

          this.logger.log(
            `用户 ${userId} 的事务: 新规则已创建，正在获取更新后的规则`,
          );

          return tx.reviewRule.findMany({
            where: { userId },
            orderBy: { id: 'asc' },
          });
        }
        this.logger.log(`用户 ${userId} 的事务: 未提供新规则，返回空数组`);
        return [];
      });
    } catch (error) {
      this.logger.error(`设置用户 ${userId} 的复习规则失败: ${error.message}`);
      throw new InternalServerErrorException('设置复习规则失败。');
    }
  }
}
