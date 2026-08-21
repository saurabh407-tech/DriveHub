import express, { Application, Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
// xss-clean has no @types package; requiring it is safe in CommonJS output.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const xssClean = require('xss-clean');

import { env } from './config/env';
import { apiLimiter } from './middlewares/rateLimiter';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import vehicleRoutes from './routes/vehicle.routes';
import bookingRoutes from './routes/booking.routes';
import paymentRoutes from './routes/payment.routes';
import chatRoutes from './routes/chat.routes';
import notificationRoutes from './routes/notification.routes';
import analyticsRoutes from './routes/analytics.routes';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);

  // ---- Security ----
  app.use(helmet());
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );
  app.use(mongoSanitize()); // strips $ / . operators from user input to block NoSQL injection
  app.use(xssClean()); // sanitizes user input against basic XSS payloads
  app.use(hpp()); // guards against HTTP parameter pollution

  // ---- Parsers ----
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser(env.cookieSecret));
  app.use(compression());

  // ---- Logging ----
  if (!env.isProd) {
    app.use(morgan('dev'));
  }

  // ---- Rate limiting ----
  app.use('/api', apiLimiter);

  // ---- Health check ----
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ success: true, message: 'DriveHub API is healthy', timestamp: new Date().toISOString() });
  });

  // ---- Static file serving (used only when Cloudinary isn't configured) ----
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

  // ---- API routes ----
  const API_PREFIX = '/api/v1';
  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/users`, userRoutes);
  app.use(`${API_PREFIX}/vehicles`, vehicleRoutes);
  app.use(`${API_PREFIX}/bookings`, bookingRoutes);
  app.use(`${API_PREFIX}/payments`, paymentRoutes);
  app.use(`${API_PREFIX}/chat`, chatRoutes);
  app.use(`${API_PREFIX}/notifications`, notificationRoutes);
  app.use(`${API_PREFIX}/analytics`, analyticsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
