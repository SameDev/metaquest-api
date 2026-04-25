import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async sendPasswordReset(to: string, code: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to,
        subject: 'DisciplineOS — Redefinição de senha',
        text: `Seu código de redefinição de senha é: ${code}\n\nEle expira em 15 minutos.`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2 style="color:#7C3AED">DisciplineOS</h2>
            <p>Seu código de redefinição de senha é:</p>
            <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#7C3AED;padding:16px 0">${code}</div>
            <p style="color:#64748B;font-size:14px">Expira em 15 minutos. Se não foi você, ignore este email.</p>
          </div>
        `,
      });
    } catch {
      throw new InternalServerErrorException('Falha ao enviar email');
    }
  }
}
