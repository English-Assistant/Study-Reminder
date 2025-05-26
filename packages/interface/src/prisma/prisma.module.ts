import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 将此模块设为全局模块，PrismaService 可以在任何地方注入而无需导入 PrismaModule
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
