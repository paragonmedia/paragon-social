import { Injectable } from '@nestjs/common';
import { EmailInterface } from '@gitroom/nestjs-libraries/emails/email.interface';
import { ResendProvider } from '@gitroom/nestjs-libraries/emails/resend.provider';
import { EmptyProvider } from '@gitroom/nestjs-libraries/emails/empty.provider';
import { NodeMailerProvider } from '@gitroom/nestjs-libraries/emails/node.mailer.provider';
import { SesProvider } from '@gitroom/nestjs-libraries/emails/ses.provider';
import { TemporalService } from 'nestjs-temporal-core';
import { timer } from '@gitroom/helpers/utils/timer';
import { randomUUID } from 'crypto';

@Injectable()
export class EmailService {
  emailService: EmailInterface;
  constructor(private _temporalService: TemporalService) {
    this.emailService = this.selectProvider(process.env.EMAIL_PROVIDER!);
    console.log('Email service provider:', this.emailService.name);
    for (const key of this.emailService.validateEnvKeys) {
      if (!process.env[key]) {
        console.error(`Missing environment variable: ${key}`);
      }
    }
  }

  hasProvider() {
    return !(this.emailService instanceof EmptyProvider);
  }

  selectProvider(provider: string) {
    switch (provider) {
      case 'resend':
        return new ResendProvider();
      case 'nodemailer':
        return new NodeMailerProvider();
      case 'ses':
        return new SesProvider();
      default:
        return new EmptyProvider();
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    addTo: 'top' | 'bottom',
    replyTo?: string
  ) {
    if (!to || !subject) {
      return;
    }

    return this._temporalService.client
      .getRawClient()
      ?.workflow.start('sendSingleEmailWorkflow', {
        taskQueue: 'main',
        workflowId: `send_email_${randomUUID()}`,
        args: [{ to, subject, html, replyTo, addTo }],
      });
  }

  async sendEmailSync(
    to: string,
    subject: string,
    html: string,
    replyTo?: string
  ) {
    if (to.indexOf('@') === -1) {
      return;
    }

    if (!process.env.EMAIL_FROM_ADDRESS || !process.env.EMAIL_FROM_NAME) {
      console.log(
        'Email sender information not found in environment variables'
      );
      return;
    }

    const settingsUrl = `${process.env.FRONTEND_URL}/settings`;
    // Mail clients show an unsubscribe link next to the sender, it opens the
    // settings where the email notifications can be turned off
    const headers = process.env.FRONTEND_URL
      ? { 'List-Unsubscribe': `<${settingsUrl}>` }
      : undefined;

    // Paragon Social: plantilla con la marca de Paragon
    const modifiedHtml = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#f4f2ef">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f2ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<tr><td align="center" style="padding:36px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
<tr><td style="padding:0 6px 18px"><img src="https://weareparagonmedia.com/brand/social/email-lockup.png" width="178" height="28" alt="Paragon Social" style="display:block;border:0;width:178px;height:28px"></td></tr>
<tr><td style="background:#ffffff;border:1px solid #ebe7e2;border-radius:16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="height:4px;line-height:4px;font-size:0;background:#FA3D4F;border-radius:16px 16px 0 0">&nbsp;</td></tr>
<tr><td style="padding:34px 34px 32px">
<h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;font-weight:700;color:#141414;letter-spacing:-0.015em">${subject}</h1>
<div style="font-size:15px;line-height:1.65;color:#3d3a36">${html}</div>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:22px 10px 0;text-align:center;font-size:12px;line-height:1.6;color:#8a847c">
${process.env.EMAIL_FROM_NAME} · Paragon Media<br>
Puedes elegir qué correos recibes en tus <a href="${settingsUrl}" style="color:#8a847c;text-decoration:underline">ajustes de notificaciones</a>.
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const sends = await this.emailService.sendEmail(
          to,
          subject,
          modifiedHtml,
          process.env.EMAIL_FROM_NAME,
          process.env.EMAIL_FROM_ADDRESS,
          replyTo,
          headers
        );
        console.log(sends);
        return;
      } catch (err) {
        lastErr = err;
        console.log(`Email attempt ${attempt + 1}/3 failed:`, err);
        if (attempt < 2) {
          await timer(700);
        }
      }
    }
    console.log(`Email to ${to} failed after 3 attempts:`, lastErr);
  }
}
