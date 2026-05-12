import { Express } from 'express';
import ChatMessage, { IChatMessage } from '../models/ChatMessage';
import Despesa from '../models/Despesa';
import Receita from '../models/Receita';
import Categoria from '../models/Categoria';
import Cartao from '../models/Cartao';
import Orcamento from '../models/Orcamento';
import { AIFactory, AIProviderType } from './ai/AIFactory';
import { AIMessage } from './ai/IAIProvider';
import { GeminiProvider } from './ai/GeminiProvider';

export interface ProcessMessageOptions {
  sessionId: string;
  message: string;
  files?: Express.Multer.File[];
  provider?: AIProviderType;
  model?: string;
}

export interface ChatbotContext {
  resumo?: {
    totalDespesas: number;
    totalReceitas: number;
    saldo: number;
    periodo: string;
  };
  despesas?: any[];
  receitas?: any[];
  categorias?: any[];
  cartoes?: any[];
  orcamentos?: any[];
}

export class ChatbotService {
  async consultarDadosFinanceiros(filtros?: {
    dataInicio?: Date;
    dataFim?: Date;
    limite?: number;
  }): Promise<ChatbotContext> {
    try {
      const dataInicio = filtros?.dataInicio || new Date(new Date().setMonth(new Date().getMonth() - 1));
      const dataFim = filtros?.dataFim || new Date();

      const [despesas, receitas, categorias, cartoes, orcamentos] = await Promise.all([
        Despesa.find({
          data: { $gte: dataInicio, $lte: dataFim }
        })
          .populate('categoriaId', 'nome cor icone')
          .populate('cartaoId', 'nome bandeira')
          .sort({ data: -1 })
          .lean(),

        Receita.find({
          data: { $gte: dataInicio, $lte: dataFim }
        })
          .populate('categoriaId', 'nome cor icone')
          .sort({ data: -1 })
          .lean(),

        Categoria.find({ ativo: true })
          .select('nome tipo cor icone')
          .lean(),

        Cartao.find({ ativo: true })
          .select('nome bandeira limite diaFechamento diaVencimento')
          .lean(),

        Orcamento.find({
          $or: [
            { vigenciaInicio: { $lte: dataFim } },
            { vigenciaFim: { $gte: dataInicio } }
          ]
        })
          .populate('categoriaId', 'nome')
          .lean()
      ]);

      const totalDespesas = despesas.reduce((sum, d: any) => sum + d.valor, 0);
      const totalReceitas = receitas.reduce((sum, r: any) => sum + r.valor, 0);
      const saldo = totalReceitas - totalDespesas;

      return {
        resumo: {
          totalDespesas,
          totalReceitas,
          saldo,
          periodo: `${dataInicio.toLocaleDateString('pt-BR')} - ${dataFim.toLocaleDateString('pt-BR')}`
        },
        despesas,
        receitas,
        categorias,
        cartoes,
        orcamentos
      };
    } catch (error: any) {
      console.error('Erro ao consultar dados financeiros:', error);
      throw new Error(`Falha ao consultar dados: ${error.message}`);
    }
  }

  async processarMensagem(options: ProcessMessageOptions): Promise<IChatMessage> {
    const { sessionId, message, files, provider: providerType, model } = options;

    try {
      const mensagemUsuario = await ChatMessage.create({
        sessionId,
        role: 'user',
        content: message,
        attachments: files?.map(f => ({
          filename: f.originalname,
          mimetype: f.mimetype,
          size: f.size
        }))
      });

      const historico = await this.obterHistorico(sessionId, 10);

      const context = await this.consultarDadosFinanceiros();

      const aiMessages: AIMessage[] = historico
        .filter(m => m._id?.toString() !== mensagemUsuario._id?.toString())
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }));

      aiMessages.push({
        role: 'user',
        content: message
      });

      const provider = AIFactory.getProvider(providerType, model);

      // Registrar funções para Gemini
      if (provider instanceof GeminiProvider) {
        this.registrarFuncoesGemini(provider);
      }

      let aiResponse;
      if (files && files.length > 0) {
        aiResponse = await provider.sendMessageWithFile(aiMessages, files[0], context);
      } else {
        aiResponse = await provider.sendMessage(aiMessages, context);
      }

      const mensagemAssistente = await ChatMessage.create({
        sessionId,
        role: 'assistant',
        content: aiResponse.content
      });

      return mensagemAssistente;
    } catch (error: any) {
      console.error('Erro ao processar mensagem:', error);

      const mensagemErro = await ChatMessage.create({
        sessionId,
        role: 'assistant',
        content: `Desculpe, ocorreu um erro ao processar sua mensagem: ${error.message}`
      });

      return mensagemErro;
    }
  }

  async obterHistorico(sessionId: string, limite: number = 50): Promise<IChatMessage[]> {
    try {
      return await ChatMessage.find({ sessionId })
        .sort({ createdAt: -1 })
        .limit(limite)
        .lean();
    } catch (error: any) {
      console.error('Erro ao obter histórico:', error);
      return [];
    }
  }

  async limparHistorico(sessionId: string): Promise<{ deletedCount: number }> {
    try {
      const result = await ChatMessage.deleteMany({ sessionId });
      return { deletedCount: result.deletedCount || 0 };
    } catch (error: any) {
      console.error('Erro ao limpar histórico:', error);
      throw new Error(`Falha ao limpar histórico: ${error.message}`);
    }
  }

  private registrarFuncoesGemini(provider: GeminiProvider): void {
    // Por enquanto, nenhuma função registrada
    // O chatbot funciona apenas em modo READ-ONLY
    // Futuras funções de consulta podem ser adicionadas aqui
  }
}
