import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma'; // 确保路径正确

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      // log: ['query', 'info', 'warn', 'error'], // 可选：配置 Prisma 日志级别
      // errorFormat: 'pretty', // 可选：错误格式化
    });
  }

  async onModuleInit() {
    // 注意：这里不需要手动连接，PrismaClient 会在首次查询时延迟连接
    // 或者您可以明确调用 this.$connect()
    await this.$connect();
    console.log('Prisma Client connected to the database.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Prisma Client disconnected from the database.');
  }

  // 如果需要，可以在这里添加自定义的 Prisma 辅助方法
}
