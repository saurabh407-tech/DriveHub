import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '');

let socket: Socket | null = null;

/**
 * Returns a shared, authenticated Socket.io connection. Reconnects with a
 * fresh token if called again after login (e.g. after a token refresh),
 * since the token is only read once at connection time.
 */
export function getSocket(): Socket {
  const token = getAccessToken();

  if (socket && socket.connected) return socket;

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      withCredentials: true,
    });
  } else {
    socket.auth = { token };
    socket.connect();
  }

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
