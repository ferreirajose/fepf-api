import mongoose, { Schema, Document } from 'mongoose';

interface IAttachment {
  filename: string;
  mimetype: string;
  size: number;
  url?: string;
}

export interface IChatMessage extends Document {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: IAttachment[];
  createdAt?: Date;
  updatedAt?: Date;
}

const AttachmentSchema = new Schema<IAttachment>({
  filename: {
    type: String,
    required: true,
    trim: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  url: {
    type: String,
    trim: true
  }
}, { _id: false });

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    sessionId: {
      type: String,
      required: [true, 'Session ID é obrigatório'],
      trim: true,
      index: true
    },
    role: {
      type: String,
      required: [true, 'Role é obrigatório'],
      enum: {
        values: ['user', 'assistant'],
        message: 'Role deve ser "user" ou "assistant"'
      }
    },
    content: {
      type: String,
      required: [true, 'Conteúdo é obrigatório'],
      trim: true,
      maxlength: [10000, 'Conteúdo não pode ter mais de 10000 caracteres']
    },
    attachments: {
      type: [AttachmentSchema],
      default: undefined
    }
  },
  {
    timestamps: true
  }
);

ChatMessageSchema.index({ sessionId: 1, createdAt: -1 });

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
