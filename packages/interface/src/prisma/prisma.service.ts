import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // log: ['query', 'info', 'warn', 'error'], // 可选：配置 Prisma 日志级别
      // errorFormat: 'pretty', // 可选：错误格式化
    });
  }

  async onModuleInit() {
    this.logger.log(`当前应用连接的数据库地址是: ${process.env.DATABASE_URL}`);
    try {
      await this.$connect();
      this.logger.log('Prisma Client 已成功连接到数据库。');
    } catch (error) {
      this.logger.error('Prisma Client 连接数据库失败:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma Client 已断开与数据库的连接。');
  }

  // 如果需要，可以在这里添加自定义的 Prisma 辅助方法
}
