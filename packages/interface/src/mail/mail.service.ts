import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { render } from '@react-email/render';
import * as React from 'react';
import { ReviewItem } from '../notifications/types/review-item.type';

interface SendMailConfiguration {
  email: string;
  subject: string;
  text?: string;
  template: React.ReactElement;
}

/**
 * 邮件服务
 * ------------------------------------------------------------
 * 基于 Nest Mailer + React Email 进行所有模板邮件的发送。
 * 提供统一 sendMail 封装，其他业务方法只需组装模板与主题。
 */
@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 将 React 组件模板渲染为 HTML 字符串
   */
  private generateEmail = async (
    template: React.ReactElement,
  ): Promise<string> => {
    return await render(template);
  };

  /**
   * 发送邮件（底层统一出口）
   */
  async sendMail({ email, subject, template, text }: SendMailConfiguration) {
    const html = await this.generateEmail(template);

    await this.mailerService.sendMail({
      to: email,
      subject,
      html,
      text, // 可选的纯文本版本
    });
  }

  /** 发送单条复习提醒邮件 */
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

    const subject = `复习提醒: ${itemName} - ${courseName}`;

    await this.sendMail({
      email,
      subject,
      template,
      text: subject,
    });
  }

  /** 发送批量复习提醒邮件（合并模板） */
  async sendBulkReviewReminderEmail(
    email: string,
    userName: string,
    items: ReviewItem[],
  ): Promise<void> {
    /**
     * 发送「合并复习提醒」邮件。
     * 为什么要合并？
     * - 当 5 分钟窗口内有多个待复习项时，如果逐条发送邮件会造成用户收件箱轰炸。
     * - 因此将同一窗口内的所有复习项整合到一封邮件的列表中，一次性提醒。
     * - 该方法由 NotificationsService.sendBulkReminder() 调用，必要时会降级到单条发送。
     */
    const { ReviewReminderBulkEmail } = await import(
      '../../emails/review-reminder-bulk'
    );

    const template = React.createElement(ReviewReminderBulkEmail, {
      userName,
      items,
    });

    const subject = `您有 ${items.length} 个待复习任务`;

    const plainLines = items.map(
      (it) => `${it.itemName} - ${it.courseName} (${it.time})`,
    );
    const text = [subject, ...plainLines].join('\n');

    await this.sendMail({
      email,
      subject,
      template,
      text,
    });
  }

  /** 发送注册 / 绑定邮箱验证码 */
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

  /** 发送重置密码验证码邮件 */
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

  /** 发送注销账号验证码邮件 */
  async sendUnregisterCodeEmail(
    email: string,
    userName: string,
    verificationCode: string,
    expirationTime?: number,
  ): Promise<void> {
    const { UnregisterCodeEmail } = await import(
      '../../emails/unregister-code'
    );

    const template = React.createElement(UnregisterCodeEmail, {
      userName,
      verificationCode,
      expirationTime,
    });

    await this.sendMail({
      email,
      subject: `【重要】Study Reminder 注销账户验证码: ${verificationCode}`,
      template,
    });
  }
}
