import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get<string>('SMTP_PORT')) || 587,
        secure: this.config.get<string>('SMTP_SECURE') === 'true',
        auth: { user, pass },
        tls: { rejectUnauthorized: false }
      });
      this.logger.log('SMTP configured');
    } else {
      this.logger.warn('SMTP not configured — emails will be logged to console only');
    }
  }

  async sendResetCode(email: string, code: string, fullName: string): Promise<void> {
    const text = `Hola ${fullName},

Has solicitado restablecer tu contraseña en SAPAY.

Tu código de verificación es: ${code}

Este código expira en 15 minutos.

Si no solicitaste este cambio, ignora este mensaje.`;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_FROM'),
        to: email,
        subject: 'Código de restablecimiento - SAPAY',
        text
      });
      this.logger.log(`Reset code sent to ${email}`);
    } else {
      this.logger.warn(`[EMAIL NOT SENT] To: ${email} | Code: ${code}`);
    }
  }
}
