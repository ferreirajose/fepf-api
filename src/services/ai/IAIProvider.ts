import { Express } from 'express';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface IAIProvider {
  sendMessage(messages: AIMessage[], context?: any): Promise<AIResponse>;

  sendMessageWithFile(
    messages: AIMessage[],
    file: Express.Multer.File,
    context?: any
  ): Promise<AIResponse>;

  getName(): string;
}
