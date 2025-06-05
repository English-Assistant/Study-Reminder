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

  async sendVerificationCodeEmail(
    email: string,
    userName: string,
    verificationCode: string,
    expirationTime?: number,
    type?: 'register',
  ): Promise<void> {
    // 动态导入邮件模板
    const { VerificationCodeEmail } = await import(
      '../../emails/verification-code'
    );

    const template = React.createElement(VerificationCodeEmail, {
      userName,
      verificationCode,
      expirationTime,
      type,
    });

    await this.sendMail({
      email,
      subject: `Study Reminder 注册验证码: ${verificationCode}`,
      template,
    });
  }

  async sendResetPasswordCodeEmail(
    email: string,
    userName: string,
    verificationCode: string,
    expirationTime?: number,
  ): Promise<void> {
    // 动态导入重置密码邮件模板
    const { ResetPasswordCodeEmail } = await import(
      '../../emails/reset-password-code'
    );

    const template = React.createElement(ResetPasswordCodeEmail, {
      userName,
      verificationCode,
      expirationTime,
    });

    await this.sendMail({
      email,
      subject: `【重要】Study Reminder 密码重置验证码: ${verificationCode}`,
      template,
    });
  }
}
