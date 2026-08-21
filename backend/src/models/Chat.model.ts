import { Schema, model, Document, Types } from 'mongoose';

export interface IConversation extends Document {
  participants: Types.ObjectId[]; // exactly 2 for direct owner<->customer chat
  booking?: Types.ObjectId; // conversations are usually scoped to a booking
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    booking: { type: Schema.Types.ObjectId, ref: 'Booking' },
    lastMessageAt: Date,
    lastMessagePreview: { type: String, maxlength: 140 },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

export const Conversation = model<IConversation>('Conversation', conversationSchema);

export interface IMessage extends Document {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  text?: string;
  attachment?: { url: string; publicId: string; type: 'image' | 'document' };
  isRead: boolean;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, maxlength: 2000 },
    attachment: {
      url: String,
      publicId: String,
      type: { type: String, enum: ['image', 'document'] },
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

export const Message = model<IMessage>('Message', messageSchema);
