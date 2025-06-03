import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { render } from '@react-email/render';
import * as React from 'react';

interface SendMailConfiguration {
  email: string;
  subject: string;
  text?: string;
  template: React.ReactElement;
}

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  private generateEmail = async (
    template: React.ReactElement,
  ): Promise<string> => {
    return await render(template);
  };

  async sendMail({ email, subject, template, text }: SendMailConfiguration) {
    const html = await this.generateEmail(template);

    await this.mailerService.sendMail({
      to: email,
      subject,
      html,
      text, // 可选的纯文本版本
    });
  }

  async sendReviewReminderEmail(
    email: string,
    userName: string,
    itemName: string,
    courseName: string,
  ): Promise<void> {
    // 动态导入邮件模板
    const { ReviewReminderEmail } = await import(
      '../../emails/review-reminder'
    );

    const template = React.createElement(ReviewReminderEmail, {
      userName,
      itemName,
      courseName,
    });

    await this.sendMail({
      email,
      subject: `复习提醒: ${itemName}`,
      template,
    });
  }
}
