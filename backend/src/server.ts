import http from 'http';
import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';
import { initSocket } from './socket';

async function bootstrap() {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);
  initSocket(httpServer);

  const server = httpServer.listen(env.port, () => {
    logger.info(`DriveHub API running in ${env.nodeEnv} mode on port ${env.port}`);
    logger.info(`Health check: http://localhost:${env.port}/health`);
    logger.info('Socket.io ready for real-time chat connections');
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection', reason);
    server.close(() => process.exit(1));
  });
}

bootstrap();
