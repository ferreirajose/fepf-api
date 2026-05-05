import { Request, Response } from 'express';
import { ChatbotService } from '../services/chatbot.service';
import { ApiResponse } from '../types';

const chatbotService = new ChatbotService();

export const enviarMensagem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, message, provider, model } = req.body;

    if (!sessionId || !message) {
      const response: ApiResponse = {
        success: false,
        error: 'SessionId e message são obrigatórios'
      };
      res.status(400).json(response);
      return;
    }

    const files = req.files as Express.Multer.File[] | undefined;

    const resposta = await chatbotService.processarMensagem({
      sessionId,
      message,
      files,
      provider,
      model
    });

    const response: ApiResponse = {
      success: true,
      data: {
        message: resposta,
        timestamp: new Date().toISOString()
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('Erro em enviarMensagem:', error);
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro ao processar mensagem'
    };
    res.status(500).json(response);
  }
};

export const obterHistorico = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const limite = parseInt(req.query.limite as string) || 50;

    if (!sessionId) {
      const response: ApiResponse = {
        success: false,
        error: 'SessionId é obrigatório'
      };
      res.status(400).json(response);
      return;
    }

    const historico = await chatbotService.obterHistorico(sessionId, limite);

    const response: ApiResponse = {
      success: true,
      data: {
        messages: historico.reverse(),
        count: historico.length
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('Erro em obterHistorico:', error);
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro ao obter histórico'
    };
    res.status(500).json(response);
  }
};

export const limparHistorico = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      const response: ApiResponse = {
        success: false,
        error: 'SessionId é obrigatório'
      };
      res.status(400).json(response);
      return;
    }

    const resultado = await chatbotService.limparHistorico(sessionId);

    const response: ApiResponse = {
      success: true,
      data: {
        deletedCount: resultado.deletedCount,
        message: `${resultado.deletedCount} mensagens foram removidas`
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('Erro em limparHistorico:', error);
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro ao limpar histórico'
    };
    res.status(500).json(response);
  }
};

export const obterContextoFinanceiro = async (req: Request, res: Response): Promise<void> => {
  try {
    const dataInicio = req.query.dataInicio ? new Date(req.query.dataInicio as string) : undefined;
    const dataFim = req.query.dataFim ? new Date(req.query.dataFim as string) : undefined;
    const limite = req.query.limite ? parseInt(req.query.limite as string) : undefined;

    const context = await chatbotService.consultarDadosFinanceiros({
      dataInicio,
      dataFim,
      limite
    });

    const response: ApiResponse = {
      success: true,
      data: context
    };

    res.json(response);
  } catch (error: any) {
    console.error('Erro em obterContextoFinanceiro:', error);
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Erro ao obter contexto financeiro'
    };
    res.status(500).json(response);
  }
};
