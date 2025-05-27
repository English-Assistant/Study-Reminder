import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  MailerModule,
  // EjsAdapter, // Linter says this is not exported
  // TemplateAdapter, // Removed as unused and to clear linter error temporarily
} from '@nestjs-modules/mailer';
// We need to find the correct way to import/use EJS adapter for the installed version
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter'; // Reverting to a previous attempt while user investigates

import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModuleModule } from './auth-module/auth-module.module';
import { UsersModuleModule } from './users-module/users-module.module';
import { CoursesModuleModule } from './courses-module/courses-module.module';
import { ReviewSettingsModuleModule } from './review-settings-module/review-settings-module.module';
import { ScheduledReviewsModuleModule } from './scheduled-reviews-module/scheduled-reviews-module.module';
import { ManualReviewEntriesModule } from './manual-review-entries-module/manual-review-entries.module';
// import { LearningActivitiesModuleModule } from './learning-activities-module/learning-activities-module.module'; // REMOVED
// import { UserCourseProgressModuleModule } from './user-course-progress-module/user-course-progress-module.module'; // REMOVED
// import { UserStatisticsModuleModule } from './user-statistics-module/user-statistics-module.module'; // REMOVED
import { PrismaModule } from './prisma/prisma.module';
import { NotificationsModule } from './notifications/notifications.module';
// import { UserPreferencesModule } from './user-preferences/user-preferences.module'; // REMOVED
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
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
        template: {
          dir: join(__dirname, '..', 'templates', 'email'),
          adapter: new EjsAdapter(), // This line will still cause an error until EjsAdapter is correctly imported
          options: {
            strict: false,
          },
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModuleModule,
    UsersModuleModule,
    CoursesModuleModule,
    ReviewSettingsModuleModule,
    ScheduledReviewsModuleModule,
    ManualReviewEntriesModule,
    // LearningActivitiesModuleModule, // REMOVED
    // UserCourseProgressModuleModule, // REMOVED
    // UserStatisticsModuleModule, // REMOVED
    // UserPreferencesModule, // REMOVED
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
