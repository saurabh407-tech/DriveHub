import { Conversation, Message, IConversation, IMessage } from '../models/Chat.model';
import { Booking } from '../models/Booking.model';
import { ApiError } from '../utils/ApiError';

export async function getOrCreateConversationForBooking(bookingId: string, userId: string): Promise<IConversation> {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found');

  const isParticipant = booking.customer.toString() === userId || booking.owner.toString() === userId;
  if (!isParticipant) throw ApiError.forbidden('You are not part of this booking');

  let conversation = await Conversation.findOne({ booking: booking._id });
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [booking.customer, booking.owner],
      booking: booking._id,
    });
  }
  return conversation;
}

export async function listMyConversations(userId: string): Promise<IConversation[]> {
  return Conversation.find({ participants: userId })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .populate('participants', 'name avatar')
    .populate('booking', 'bookingCode vehicle startDate endDate status');
}

export async function assertConversationParticipant(conversationId: string, userId: string): Promise<IConversation> {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound('Conversation not found');
  const isParticipant = conversation.participants.some((p) => p.toString() === userId);
  if (!isParticipant) throw ApiError.forbidden('You are not part of this conversation');
  return conversation;
}

interface ListMessagesResult {
  messages: IMessage[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function listMessages(
  conversationId: string,
  userId: string,
  page: number,
  limit: number
): Promise<ListMessagesResult> {
  await assertConversationParticipant(conversationId, userId);

  const [messagesDesc, total] = await Promise.all([
    Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'name avatar'),
    Message.countDocuments({ conversation: conversationId }),
  ]);

  return {
    messages: messagesDesc.reverse(), // chronological order for rendering
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function sendMessage(conversationId: string, senderId: string, text: string): Promise<IMessage> {
  const conversation = await assertConversationParticipant(conversationId, senderId);
  if (!text.trim()) throw ApiError.badRequest('Message cannot be empty');

  const message = await Message.create({ conversation: conversationId, sender: senderId, text: text.trim() });

  conversation.lastMessageAt = message.createdAt;
  conversation.lastMessagePreview = text.trim().slice(0, 140);
  await conversation.save();

  return message.populate('sender', 'name avatar');
}

export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  await assertConversationParticipant(conversationId, userId);
  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, isRead: false },
    { $set: { isRead: true } }
  );
}
