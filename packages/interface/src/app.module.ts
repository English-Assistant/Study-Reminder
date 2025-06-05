import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { ReviewSettingsModule } from './review-settings/review-settings.module';
// import { ScheduledReviewsModule } from './scheduled-reviews/scheduled-reviews.module'; // REMOVED
// import { ManualReviewEntriesModule } from './manual-review-entries/manual-review-entries.module'; // REMOVED
import { StudyRecordsModule } from './study-records/study-records.module';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationsModule } from './notifications/notifications.module';
// import { UserPreferencesModule } from './user-preferences/user-preferences.module'; // REMOVED
import { ScheduleModule } from '@nestjs/schedule';
import { UpcomingReviewsModule } from './upcoming-reviews/upcoming-reviews.module';
import { SettingsModule } from './settings/settings.module';
import { MailModule } from './mail/mail.module';
import { VerificationCodeModule } from './verification-code/verification-code.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    ScheduleModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          port: configService.get<number>('MAIL_PORT'),
          secure: configService.get<string>('MAIL_SECURE', 'true') === 'true',
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"${configService.get<string>('MAIL_FROM_NAME')}" <${configService.get<string>('MAIL_FROM_ADDRESS')}>`,
        },
        // 移除模板配置，现在直接通过React Email生成HTML
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    ReviewSettingsModule,
    StudyRecordsModule,
    // ScheduledReviewsModule, // REMOVED
    // ManualReviewEntriesModule, // REMOVED
    NotificationsModule,
    UpcomingReviewsModule,
    SettingsModule,
    MailModule,
    VerificationCodeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
