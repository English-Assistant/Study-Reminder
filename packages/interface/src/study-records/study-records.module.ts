import { Module } from '@nestjs/common';
import { StudyRecordsService } from './study-records.service';
import { StudyRecordsController } from './study-records.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module'; // For JWT Guard dependency
import { ReviewLogicModule } from '../review-logic/review-logic.module';

@Module({
  imports: [PrismaModule, AuthModule, ReviewLogicModule],
  controllers: [StudyRecordsController],
  providers: [StudyRecordsService],
})
export class StudyRecordsModule {}
