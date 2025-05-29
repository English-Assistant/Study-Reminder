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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
