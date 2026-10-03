import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { env } from '../config/env';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User.model';
import * as chatService from '../services/chat.service';
import { logger } from '../utils/logger';

let io: Server | null = null;

interface AckResponse {
  success: boolean;
  message?: unknown;
  error?: string;
}

export function initSocket(httpServer: HttpServer): Server {
  const allowedOrigins = [
    env.clientUrl,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:8080',
    'http://localhost:3000',
  ];

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isVercel = /\.vercel\.app$/.test(new URL(origin).hostname);
        if (
          allowedOrigins.includes(origin) ||
          isVercel ||
          (!env.isProd && /^http:\/\/localhost:\d+$/.test(origin))
        ) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    },
  });

  // Every socket connection must present the same JWT access token used
  // for REST calls — no separate auth mechanism to keep in sync.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('Authentication required'));

      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub).select('_id role isActive isBanned');
      if (!user || !user.isActive || user.isBanned) return next(new Error('Unauthorized'));

      socket.data.userId = user.id as string;
      socket.data.role = user.role;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`); // personal room for targeted notifications

    socket.on('join_conversation', async (conversationId: string, ack?: (res: AckResponse) => void) => {
      try {
        await chatService.assertConversationParticipant(conversationId, userId);
        socket.join(`conversation:${conversationId}`);
        ack?.({ success: true });
      } catch {
        ack?.({ success: false, error: 'Could not join this conversation' });
      }
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('typing', ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
      socket.to(`conversation:${conversationId}`).emit('typing', { userId, isTyping });
    });

    socket.on(
      'send_message',
      async (payload: { conversationId: string; text: string }, ack?: (res: AckResponse) => void) => {
        try {
          const message = await chatService.sendMessage(payload.conversationId, userId, payload.text);
          io!.to(`conversation:${payload.conversationId}`).emit('new_message', message);
          ack?.({ success: true, message });
        } catch (err) {
          const errMessage = err instanceof Error ? err.message : 'Could not send message';
          ack?.({ success: false, error: errMessage });
        }
      }
    );

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id} (user ${userId})`);
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

/** Emits an event to a specific user's personal room, if they're connected. No-op if the socket server hasn't started or the user is offline. */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload);
}
