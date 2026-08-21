import { api } from './api';

export interface ChatUserRef {
  _id: string;
  name: string;
  avatar?: { url: string };
}

export interface ConversationSummary {
  _id: string;
  participants: ChatUserRef[];
  booking?: { _id: string; bookingCode: string; startDate: string; endDate: string; status: string };
  lastMessageAt?: string;
  lastMessagePreview?: string;
}

export interface ChatMessage {
  _id: string;
  conversation: string;
  sender: ChatUserRef | string;
  text?: string;
  isRead: boolean;
  createdAt: string;
}

export async function getOrCreateConversation(bookingId: string) {
  const res = await api.post('/chat/conversations', { bookingId });
  return res.data as { success: boolean; data: { conversation: ConversationSummary } };
}

export async function listConversations() {
  const res = await api.get('/chat/conversations');
  return res.data as { success: boolean; data: { conversations: ConversationSummary[] } };
}

export async function listMessages(conversationId: string, page = 1) {
  const res = await api.get(`/chat/conversations/${conversationId}/messages`, { params: { page, limit: 30 } });
  return res.data as {
    success: boolean;
    data: { messages: ChatMessage[]; pagination: { page: number; totalPages: number } };
  };
}

export async function markConversationRead(conversationId: string) {
  await api.post(`/chat/conversations/${conversationId}/read`);
}
