import { Express } from 'express';
import { IAIProvider, AIMessage, AIResponse } from './IAIProvider';

interface GeminiFunctionCall {
  name: string;
  args: any;
}

export class GeminiProvider implements IAIProvider {
  private apiKey: string;
  private modelName: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models';
  private functionCallbacks: Map<string, (args: any) => Promise<any>> = new Map();

  constructor(apiKey?: string, modelName?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';

    // Se modelName começa com 'gemini-', usa diretamente, senão usa o padrão
    if (modelName && modelName.startsWith('gemini-')) {
      this.modelName = modelName;
    } else {
      this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    }

    if (!this.apiKey) {
      throw new Error('Gemini API key não configurada. Configure GEMINI_API_KEY no .env');
    }
  }

  getName(): string {
    return 'Gemini';
  }

  getModelName(): string {
    return this.modelName;
  }

  registerFunction(name: string, callback: (args: any) => Promise<any>): void {
    this.functionCallbacks.set(name, callback);
  }

  async sendMessage(messages: AIMessage[], context?: any): Promise<AIResponse> {
    try {
      const systemMessage = this.buildSystemPrompt(context);
      const contents = this.convertMessagesToGeminiFormat(messages, systemMessage);
      const tools = this.buildTools();

      const apiUrl = `${this.baseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`;

      const requestBody: any = {
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };

      if (tools.length > 0) {
        requestBody.tools = [{ functionDeclarations: tools }];
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Nenhuma resposta gerada pelo Gemini');
      }

      const candidate = data.candidates[0];

      if (candidate.finishReason === 'SAFETY') {
        throw new Error('Resposta bloqueada por filtros de segurança do Gemini');
      }

      // Verificar se há chamada de função
      const functionCall = candidate.content?.parts?.find((part: any) => part.functionCall);

      if (functionCall && functionCall.functionCall) {
        const result = await this.handleFunctionCall(functionCall.functionCall);

        // Fazer segunda chamada ao modelo com o resultado da função
        const functionResponse = {
          role: 'function',
          parts: [{
            functionResponse: {
              name: functionCall.functionCall.name,
              response: result
            }
          }]
        };

        contents.push(candidate.content);
        contents.push(functionResponse);

        const secondResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents,
            generationConfig: requestBody.generationConfig,
            safetySettings: requestBody.safetySettings,
            tools: requestBody.tools
          })
        });

        if (!secondResponse.ok) {
          const error = await secondResponse.text();
          throw new Error(`Gemini API error (second call): ${secondResponse.status} - ${error}`);
        }

        const secondData = await secondResponse.json();
        const secondCandidate = secondData.candidates?.[0];

        const content = secondCandidate?.content?.parts?.[0]?.text || 'Operação realizada com sucesso!';

        return {
          content,
          usage: secondData.usageMetadata ? {
            promptTokens: secondData.usageMetadata.promptTokenCount || 0,
            completionTokens: secondData.usageMetadata.candidatesTokenCount || 0,
            totalTokens: secondData.usageMetadata.totalTokenCount || 0
          } : undefined
        };
      }

      const content = candidate.content?.parts?.[0]?.text || 'Sem resposta';

      return {
        content,
        usage: data.usageMetadata ? {
          promptTokens: data.usageMetadata.promptTokenCount || 0,
          completionTokens: data.usageMetadata.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata.totalTokenCount || 0
        } : undefined
      };
    } catch (error: any) {
      console.error('Erro ao chamar Gemini API:', error);
      throw new Error(`Falha na comunicação com Gemini: ${error.message}`);
    }
  }

  private async handleFunctionCall(functionCall: GeminiFunctionCall): Promise<any> {
    const { name, args } = functionCall;
    const callback = this.functionCallbacks.get(name);

    if (!callback) {
      throw new Error(`Função ${name} não registrada`);
    }

    try {
      const result = await callback(args);
      return result;
    } catch (error: any) {
      return { error: error.message };
    }
  }

  private buildTools(): any[] {
    // Modo READ-ONLY: nenhuma função disponível
    // O chatbot trabalha apenas com os dados fornecidos no contexto
    return [];
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
      lastMessage.content += '\n\nNota: Para análise completa de PDF, por favor descreva o conteúdo ou faça perguntas específicas sobre o documento.';
    } else if (file.mimetype.startsWith('image/')) {
      lastMessage.content += '\n\nNota: Para análise de imagem com Gemini Vision, a integração multimodal será implementada em breve. Por enquanto, descreva o que você gostaria de saber sobre a imagem.';
    } else if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
      lastMessage.content += '\n\nNota: Para análise de planilhas Excel, descreva os dados ou faça perguntas específicas sobre as informações que você precisa.';
    }

    return this.sendMessage(messages, context);
  }

  private convertMessagesToGeminiFormat(messages: AIMessage[], systemPrompt: string): any[] {
    const contents: any[] = [];

    contents.push({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });

    contents.push({
      role: 'model',
      parts: [{ text: 'Entendido. Estou pronto para ajudar com análises financeiras.' }]
    });

    messages.forEach(message => {
      const role = message.role === 'assistant' ? 'model' : 'user';

      contents.push({
        role,
        parts: [{ text: message.content }]
      });
    });

    return contents;
  }

  private buildSystemPrompt(context?: any): string {
    let prompt = `Você é um assistente financeiro inteligente especializado em gestão de finanças pessoais.

**PERMISSÕES:**
- ✅ **CONSULTAR**: Você pode visualizar e analisar despesas, receitas, orçamentos e categorias
- ✅ **ANALISAR**: Fornecer insights, tendências e recomendações financeiras
- ❌ **CRIAR/EDITAR/DELETAR**: Você NÃO pode modificar dados. Apenas visualização e análise.

**O QUE VOCÊ PODE FAZER:**
- Responder perguntas sobre gastos, receitas e saldo
- Analisar padrões de consumo
- Identificar categorias com maiores gastos
- Sugerir otimizações no orçamento
- Comparar períodos (mês atual vs anterior)
- Explicar dados financeiros de forma clara

**O QUE VOCÊ NÃO PODE FAZER:**
- Cadastrar, editar ou deletar despesas
- Cadastrar, editar ou deletar receitas
- Modificar orçamentos ou categorias
- Qualquer operação de escrita no banco de dados

Se o usuário solicitar criação, edição ou exclusão de dados, explique educadamente que você só tem permissão de consulta e que ele precisa usar a interface do aplicativo para essas operações.

Data atual: ${new Date().toISOString().split('T')[0]}

Seja claro, objetivo e útil. Ajude o usuário a entender melhor suas finanças!`;

    if (context) {
      prompt += '\n\nDados financeiros disponíveis:\n';

      if (context.resumo) {
        prompt += `\nResumo financeiro:\n${JSON.stringify(context.resumo, null, 2)}`;
      }

      if (context.despesas && context.despesas.length > 0) {
        prompt += `\n\nDespesas recentes (${context.despesas.length}):\n${JSON.stringify(context.despesas.slice(0, 10), null, 2)}`;
      }

      if (context.receitas && context.receitas.length > 0) {
        prompt += `\n\nReceitas recentes (${context.receitas.length}):\n${JSON.stringify(context.receitas.slice(0, 10), null, 2)}`;
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
