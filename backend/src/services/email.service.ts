import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    return null; // not configured — caller falls back to console logging
  }
  if (!transporter) {
    const isGmail = env.smtp.host.includes('gmail') || env.smtp.user.endsWith('@gmail.com');
    const cleanPassword = env.smtp.pass.replace(/\s+/g, '');

    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        auth: {
          user: env.smtp.user,
          pass: cleanPassword,
        },
        connectionTimeout: 8000,
        greetingTimeout: 5000,
        socketTimeout: 12000,
      });
    } else {
      transporter = nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.port === 465,
        pool: true,
        maxConnections: 5,
        auth: {
          user: env.smtp.user,
          pass: cleanPassword,
        },
        connectionTimeout: 8000,
        greetingTimeout: 5000,
        socketTimeout: 12000,
      });
    }
  }
  return transporter;
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

async function sendViaResend({ to, subject, html, replyTo }: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'DriveHub <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      logger.info(`Resend API: email successfully dispatched to ${to} (${subject})`);
      return true;
    } else {
      logger.error('Resend API returned error, will try SMTP fallback:', data);
      return false;
    }
  } catch (err) {
    logger.error('Resend API call failed, will try SMTP fallback:', err);
    return false;
  }
}

/**
 * Sends an email via Resend HTTPS API or SMTP if configured. In local dev without SMTP
 * credentials, it logs the email to the console instead of failing,
 * so the auth flow is fully testable without a mail provider.
 */
export async function sendEmail({ to, subject, html, replyTo }: SendEmailInput): Promise<void> {
  // 1. Try Resend HTTPS API first (Bypasses Render free tier SMTP blocks)
  const sentViaResend = await sendViaResend({ to, subject, html, replyTo });
  if (sentViaResend) return;

  // 2. Fall back to SMTP
  const t = getTransporter();
  if (!t) {
    logger.warn(`SMTP not configured — logging email instead of sending to ${to}`);
    logger.info(`[DEV EMAIL] Subject: ${subject}\n${html}`);
    return;
  }

  // Ensure RFC 5322 compliant friendly display name for Gmail
  const fromAddress = env.smtp.from && env.smtp.from.includes('<')
    ? env.smtp.from
    : `"DriveHub" <${env.smtp.user}>`;

  try {
    await t.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    logger.info(`Email successfully dispatched to ${to} (${subject})`);
  } catch (err) {
    logger.error(`SMTP delivery failed for ${to}:`, err);
    logger.info(`[DEV EMAIL FALLBACK] Subject: ${subject}\n${html}`);
  }
}

export function contactInquiryEmailTemplate(name: string, email: string, message: string): string {
  const sanitizedMsg = message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #0e1420 0%, #1e293b 100%); padding: 24px; border-radius: 12px; color: #ffffff; text-align: center; border-bottom: 3px solid #f59e0b;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #f59e0b; letter-spacing: 1px;">DriveHub Concierge</h2>
        <p style="margin: 6px 0 0 0; font-size: 14px; color: #94a3b8; font-weight: 500;">New Customer Portal Inquiry</p>
      </div>

      <div style="padding: 24px 8px;">
        <p style="font-size: 15px; color: #475569; margin-top: 0;">
          A visitor has submitted a new inquiry via the <strong>DriveHub Concierge Support</strong> form:
        </p>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; width: 110px;">Sender Name:</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 700;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">Email Address:</td>
              <td style="padding: 8px 0; color: #0284c7; font-size: 15px; font-weight: 700;">
                <a href="mailto:${email}" style="color: #0284c7; text-decoration: none;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">Received At:</td>
              <td style="padding: 8px 0; color: #475569; font-size: 13px;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 24px;">
          <h4 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700;">Message Content:</h4>
          <div style="background-color: #0f172a; color: #f1f5f9; padding: 18px 20px; border-radius: 12px; font-size: 15px; line-height: 1.7; border-left: 4px solid #f59e0b;">
            ${sanitizedMsg}
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0 10px 0;">
          <a href="mailto:${email}?subject=Re:%20DriveHub%20Concierge%20Inquiry" style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: #000000; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 28px; border-radius: 9999px; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
            Reply to ${name} Directly
          </a>
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
        DriveHub Automated Dispatch Desk • Recipient: sourabhshukla8318@gmail.com
      </div>
    </div>
  `;
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

export const ADMIN_NOTIFICATION_EMAIL = 'sourabhshukla8318@gmail.com';

export function vehicleApprovalEmailTemplate(params: {
  vehicle: any;
  owner: any;
  approveUrl: string;
  rejectUrl: string;
  dashboardUrl: string;
}): string {
  const { vehicle, owner, approveUrl, rejectUrl, dashboardUrl } = params;
  const price = vehicle.pricing?.perDay ? `₹${vehicle.pricing.perDay.toLocaleString('en-IN')} / day` : 'Price not set';
  const location = vehicle.location?.address || vehicle.location?.city || 'Location not specified';

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 24px; border-radius: 12px; color: #ffffff; text-align: center; border-bottom: 3px solid #f59e0b;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #f59e0b; letter-spacing: 0.5px;">DriveHub Admin Dispatch</h2>
        <p style="margin: 6px 0 0 0; font-size: 14px; color: #cbd5e1; font-weight: 500;">🚗 New Vehicle Listing Waiting For Approval</p>
      </div>

      <div style="padding: 24px 8px;">
        <p style="font-size: 15px; color: #475569; margin-top: 0;">
          A vehicle owner has submitted a new vehicle for verification on <strong>DriveHub</strong>. You can review the details below and approve or reject it with 1 click directly from this email:
        </p>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px 20px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px; font-weight: 700;">${vehicle.title}</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 140px;">Make & Model:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${vehicle.make || ''} ${vehicle.vehicleModel || ''} (${vehicle.year || ''})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Category & Fuel:</td>
              <td style="padding: 6px 0; color: #0f172a;">${vehicle.category || 'Standard'} • ${vehicle.fuelType || 'Petrol'} (${vehicle.transmission || 'Manual'})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Registration:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: bold; font-family: monospace;">${vehicle.registrationNumber || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Rental Rate:</td>
              <td style="padding: 6px 0; color: #16a34a; font-weight: 700; font-size: 15px;">${price}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Location:</td>
              <td style="padding: 6px 0; color: #0f172a;">${location}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Owner:</td>
              <td style="padding: 6px 0; color: #0f172a;">${owner?.name || 'Owner'} (${owner?.email || ''})</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; text-align: center;">
          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #92400e;">
            ⚡ Quick Admin Action: Click below to make this vehicle live immediately or reject it.
          </p>
        </div>

        <div style="text-align: center; margin: 24px 0; display: flex; justify-content: center; gap: 16px;">
          <a href="${approveUrl}" style="background-color: #16a34a; color: #ffffff; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 10px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3); margin-right: 12px;">
            ✅ Approve & Publish
          </a>
          <a href="${rejectUrl}" style="background-color: #dc2626; color: #ffffff; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 10px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
            ❌ Reject Listing
          </a>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <a href="${dashboardUrl}" style="color: #4f46e5; font-size: 13px; font-weight: 600; text-decoration: none;">
            📋 Or Open Vehicle in Admin Dashboard →
          </a>
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
        DriveHub Admin Dispatch • Sent to ${ADMIN_NOTIFICATION_EMAIL}
      </div>
    </div>
  `;
}

export function bookingCreatedAdminEmailTemplate(params: {
  booking: any;
  vehicle: any;
  customer: any;
}): string {
  const { booking, vehicle, customer } = params;
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 20px; border-radius: 12px; color: #ffffff; text-align: center; border-bottom: 3px solid #3b82f6;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #38bdf8;">DriveHub Booking Notification</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">New Customer Rental Booking</p>
      </div>
      <div style="padding: 20px 8px;">
        <p style="font-size: 14px; color: #475569; margin-top: 0;">A new vehicle booking has been placed:</p>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; font-size: 14px;">
          <p style="margin: 4px 0;"><strong>Booking Reference:</strong> ${booking.bookingCode}</p>
          <p style="margin: 4px 0;"><strong>Vehicle:</strong> ${vehicle?.title || 'Vehicle'}</p>
          <p style="margin: 4px 0;"><strong>Customer:</strong> ${customer?.name || 'Customer'} (${customer?.email || ''})</p>
          <p style="margin: 4px 0;"><strong>Rental Period:</strong> ${new Date(booking.startDate).toLocaleDateString('en-IN')} → ${new Date(booking.endDate).toLocaleDateString('en-IN')}</p>
          <p style="margin: 4px 0;"><strong>Total Fare:</strong> ₹${booking.pricing?.totalAmount?.toLocaleString('en-IN')}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Pending Payment</span></p>
        </div>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 12px; color: #94a3b8;">
        DriveHub Dispatch • Recipient: ${ADMIN_NOTIFICATION_EMAIL}
      </div>
    </div>
  `;
}

export function paymentReceivedAdminEmailTemplate(params: {
  payment: any;
  booking: any;
  vehicle: any;
  customer: any;
}): string {
  const { payment, booking, vehicle, customer } = params;
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); padding: 20px; border-radius: 12px; color: #ffffff; text-align: center; border-bottom: 3px solid #10b981;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #34d399;">💰 Payment Received & Verified</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #a7f3d0;">Booking Confirmed via Razorpay</p>
      </div>
      <div style="padding: 20px 8px;">
        <p style="font-size: 14px; color: #475569; margin-top: 0;">Payment was successfully captured and verified:</p>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; font-size: 14px;">
          <p style="margin: 4px 0;"><strong>Amount Received:</strong> <span style="font-size: 18px; font-weight: 800; color: #059669;">₹${payment.amount?.toLocaleString('en-IN')}</span></p>
          <p style="margin: 4px 0;"><strong>Booking Reference:</strong> ${booking.bookingCode}</p>
          <p style="margin: 4px 0;"><strong>Vehicle:</strong> ${vehicle?.title || 'Vehicle'}</p>
          <p style="margin: 4px 0;"><strong>Customer:</strong> ${customer?.name || 'Customer'} (${customer?.email || ''})</p>
          <p style="margin: 4px 0;"><strong>Razorpay Payment ID:</strong> <code>${payment.razorpayPaymentId || 'N/A'}</code></p>
          <p style="margin: 4px 0;"><strong>Invoice Reference:</strong> ${payment.invoiceNumber || 'Generated'}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">Captured & Confirmed</span></p>
        </div>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 12px; color: #94a3b8;">
        DriveHub Dispatch • Recipient: ${ADMIN_NOTIFICATION_EMAIL}
      </div>
    </div>
  `;
}

