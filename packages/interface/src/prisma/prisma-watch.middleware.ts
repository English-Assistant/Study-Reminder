import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { InstantPlannerService } from '../planner/instant-planner.service';

@Injectable()
export class PrismaWatchMiddleware implements OnModuleInit {
  private readonly logger = new Logger(PrismaWatchMiddleware.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly planner: InstantPlannerService,
  ) {}

  onModuleInit() {
    this.prisma.$use(async (params, next) => {
      const result = await next(params);

      const affectModels = ['ReviewRule', 'StudyRecord'];
      if (!params.model || !affectModels.includes(params.model)) {
        return result;
      }

      try {
        let userId: string | undefined;
        switch (params.model) {
          case 'ReviewRule':
            if (params.action === 'create' || params.action === 'update') {
              userId = result.userId;
            } else if (params.action === 'delete') {
              // 删除操作 result 可能为 null，需要通过 where 条件查询
              const deletedId = params.args.where?.id;
              if (deletedId) {
                const rule = await this.prisma.reviewRule.findUnique({
                  where: { id: deletedId },
                });
                userId = rule?.userId;
              }
            }
            break;
          case 'StudyRecord':
            // 目前仅关心 create
            userId = result.userId;
            break;
        }

        if (userId) {
          const uid = userId; // 类型收窄为 string
          this.logger.log(
            `检测到 ${params.model} ${params.action}，刷新用户 ${uid} 计划缓存`,
          );
          await this.planner.refreshUserPlan(uid);
        }
      } catch (error) {
        this.logger.error('PrismaWatchMiddleware 处理变更时出错', error);
      }

      return result;
    });
  }
}
