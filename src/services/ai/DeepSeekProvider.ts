import { Express } from 'express';
import { IAIProvider, AIMessage, AIResponse } from './IAIProvider';

export class DeepSeekProvider implements IAIProvider {
  private apiKey: string;
  private apiUrl: string = 'https://api.deepseek.com/v1/chat/completions';
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || '';

    // Se modelName começa com 'deepseek-', usa diretamente, senão usa o padrão
    if (modelName && modelName.startsWith('deepseek-')) {
      this.modelName = modelName;
    } else {
      this.modelName = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    }

    if (!this.apiKey) {
      throw new Error('DeepSeek API key não configurada. Configure DEEPSEEK_API_KEY no .env');
    }
  }

  getName(): string {
    return 'DeepSeek';
  }

  getModelName(): string {
    return this.modelName;
  }

  async sendMessage(messages: AIMessage[], context?: any): Promise<AIResponse> {
    try {
      const systemMessage: AIMessage = {
        role: 'system',
        content: this.buildSystemPrompt(context)
      };

      const allMessages = [systemMessage, ...messages];

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: allMessages,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      return {
        content: data.choices[0]?.message?.content || 'Sem resposta',
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        } : undefined
      };
    } catch (error: any) {
      console.error('Erro ao chamar DeepSeek API:', error);
      throw new Error(`Falha na comunicação com DeepSeek: ${error.message}`);
    }
  }

  async sendMessageWithFile(
    messages: AIMessage[],
    file: Express.Multer.File,
    context?: any
  ): Promise<AIResponse> {
    const fileInfo = `\n\n[Arquivo anexado: ${file.originalname} (${file.mimetype}, ${(file.size / 1024).toFixed(2)}KB)]`;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      lastMessage.content += fileInfo;
    }

    if (file.mimetype === 'application/pdf') {
      lastMessage.content += '\n\nNota: Análise de PDF ainda não implementada. Por favor, descreva o conteúdo do arquivo.';
    } else if (file.mimetype.startsWith('image/')) {
      lastMessage.content += '\n\nNota: Análise de imagem ainda não implementada. Por favor, descreva o que você gostaria de saber sobre a imagem.';
    } else if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
      lastMessage.content += '\n\nNota: Análise de planilhas Excel ainda não implementada. Por favor, descreva os dados que você gostaria de analisar.';
    }

    return this.sendMessage(messages, context);
  }

  private buildSystemPrompt(context?: any): string {
    let prompt = `Você é um assistente financeiro inteligente especializado em gestão de finanças pessoais.
Você tem acesso aos dados financeiros do usuário e pode responder perguntas sobre:
- Despesas e receitas
- Orçamentos e categorias
- Análises e insights financeiros
- Cartões de crédito

IMPORTANTE: Você NÃO pode modificar, criar ou deletar dados. Apenas consultar e analisar.

Seja claro, objetivo e forneça insights úteis. Quando possível, sugira ações que o usuário pode tomar.`;

    if (context) {
      prompt += '\n\nDados financeiros disponíveis:\n';

      if (context.resumo) {
        prompt += `\nResumo financeiro:\n${JSON.stringify(context.resumo, null, 2)}`;
      }

      if (context.despesas && context.despesas.length > 0) {
        prompt += `\n\nDespesas (${context.despesas.length}):\n${JSON.stringify(context.despesas, null, 2)}`;
      }

      if (context.receitas && context.receitas.length > 0) {
        prompt += `\n\nReceitas (${context.receitas.length}):\n${JSON.stringify(context.receitas, null, 2)}`;
      }

      if (context.categorias && context.categorias.length > 0) {
        prompt += `\n\nCategorias disponíveis:\n${JSON.stringify(context.categorias, null, 2)}`;
      }

      if (context.orcamentos && context.orcamentos.length > 0) {
        prompt += `\n\nOrçamentos:\n${JSON.stringify(context.orcamentos, null, 2)}`;
      }
    }

    return prompt;
  }
}
