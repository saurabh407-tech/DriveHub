import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendEmail, contactInquiryEmailTemplate } from '../services/email.service';
import { logger } from '../utils/logger';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sourabhshukla8318@gmail.com';

export const sendContactMessage = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, message } = req.body;

  logger.info(`Received contact dispatch from ${name} (${email}). Forwarding to admin ${ADMIN_EMAIL}...`);

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `🚗 DriveHub Inquiry from ${name}`,
    html: contactInquiryEmailTemplate(name, email, message),
    replyTo: email,
  });

  res.status(200).json({
    success: true,
    message: 'Your message has been delivered to DriveHub Concierge Admin successfully.',
  });
});
