import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    return null; // not configured — caller falls back to console logging
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email via SMTP if configured. In local dev without SMTP
 * credentials, it logs the email to the console instead of failing,
 * so the auth flow is fully testable without a mail provider.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const t = getTransporter();
  if (!t) {
    logger.warn(`SMTP not configured — logging email instead of sending to ${to}`);
    logger.info(`[DEV EMAIL] Subject: ${subject}\n${html}`);
    return;
  }
  await t.sendMail({ from: env.smtp.from, to, subject, html });
}

export function otpEmailTemplate(name: string, otp: string, purpose: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#0E1420;">DriveHub</h2>
      <p>Hi ${name},</p>
      <p>Your verification code for <strong>${purpose.replace('_', ' ')}</strong> is:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color:#FFB020;">${otp}</p>
      <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      <p>— The DriveHub Team</p>
    </div>
  `;
}

export function passwordResetEmailTemplate(name: string, resetUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#0E1420;">DriveHub</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click below to choose a new one:</p>
      <p><a href="${resetUrl}" style="background:#FFB020;color:#0E1420;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">Reset Password</a></p>
      <p>This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
      <p>— The DriveHub Team</p>
    </div>
  `;
}
