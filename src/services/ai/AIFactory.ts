import { IAIProvider } from './IAIProvider';
import { DeepSeekProvider } from './DeepSeekProvider';
import { GeminiProvider } from './GeminiProvider';

export type AIProviderType = 'deepseek' | 'chatgpt' | 'gemini';

export class AIFactory {
  static getProvider(type?: AIProviderType, model?: string): IAIProvider {
    const providerType = type || (process.env.AI_PROVIDER as AIProviderType) || 'deepseek';

    switch (providerType) {
      case 'deepseek':
        return new DeepSeekProvider(undefined, model);

      case 'gemini':
        return new GeminiProvider(undefined, model);

      case 'chatgpt':
        throw new Error('ChatGPT provider ainda não implementado. Use "deepseek" ou "gemini".');

      default:
        console.warn(`Provider "${providerType}" não reconhecido. Usando DeepSeek como padrão.`);
        return new DeepSeekProvider(undefined, model);
    }
  }

  static getSupportedProviders(): AIProviderType[] {
    return ['deepseek', 'gemini'];
  }

  static isProviderSupported(type: string): boolean {
    return this.getSupportedProviders().includes(type as AIProviderType);
  }
}
