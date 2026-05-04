import { Request, Response } from 'express';
import Orcamento from '../models/Orcamento';
import Despesa from '../models/Despesa';
import { ApiResponse } from '../types';

export const listarOrcamentos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mes, ano } = req.query;

    const filtros: any = {};
    if (mes) filtros.mes = parseInt(mes as string);
    if (ano) filtros.ano = parseInt(ano as string);

    const orcamentos = await Orcamento.find(filtros)
      .populate('categoriaId', 'nome tipo cor icone')
      .sort({ ano: -1, mes: -1 });

    // Calcular valor gasto para cada orçamento
    const orcamentosComGasto = await Promise.all(
      orcamentos.map(async (orcamento) => {
        const orcamentoObj = orcamento.toObject();

        // Calcular data início e fim do mês
        const dataInicio = new Date(orcamento.ano, orcamento.mes - 1, 1);
        const dataFim = new Date(orcamento.ano, orcamento.mes, 0, 23, 59, 59);

        // Buscar despesas pagas da categoria no período
        const despesas = await Despesa.find({
          categoriaId: orcamento.categoriaId,
          data: {
            $gte: dataInicio,
            $lte: dataFim
          },
          pago: true
        });

        // Somar valores das despesas
        const valorGasto = despesas.reduce((total, despesa) => total + despesa.valor, 0);

        return {
          ...orcamentoObj,
          valorPlanejado: orcamento.valor,
          valorGasto: valorGasto,
          valorRestante: orcamento.valor - valorGasto,
          percentualGasto: orcamento.valor > 0 ? (valorGasto / orcamento.valor) * 100 : 0
        };
      })
    );

    const response: ApiResponse = {
      success: true,
      data: orcamentosComGasto
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      error: error.message
    };
    res.status(500).json(response);
  }
};

export const buscarOrcamentoPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const orcamento = await Orcamento.findById(req.params.id)
      .populate('categoriaId', 'nome tipo cor icone');

    if (!orcamento) {
      const response: ApiResponse = {
        success: false,
        error: 'Orçamento não encontrado'
      };
      res.status(404).json(response);
      return;
    }

    const orcamentoObj = orcamento.toObject();

    // Calcular data início e fim do mês
    const dataInicio = new Date(orcamento.ano, orcamento.mes - 1, 1);
    const dataFim = new Date(orcamento.ano, orcamento.mes, 0, 23, 59, 59);

    // Buscar despesas pagas da categoria no período
    const despesas = await Despesa.find({
      categoriaId: orcamento.categoriaId,
      data: {
        $gte: dataInicio,
        $lte: dataFim
      },
      pago: true
    });

    // Somar valores das despesas
    const valorGasto = despesas.reduce((total, despesa) => total + despesa.valor, 0);

    const orcamentoComGasto = {
      ...orcamentoObj,
      valorPlanejado: orcamento.valor,
      valorGasto: valorGasto,
      valorRestante: orcamento.valor - valorGasto,
      percentualGasto: orcamento.valor > 0 ? (valorGasto / orcamento.valor) * 100 : 0
    };

    const response: ApiResponse = {
      success: true,
      data: orcamentoComGasto
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      error: error.message
    };
    res.status(500).json(response);
  }
};

export const criarOrcamento = async (req: Request, res: Response): Promise<void> => {
  try {
    const orcamento = await Orcamento.create(req.body);
    const orcamentoPopulado = await Orcamento.findById(orcamento._id)
      .populate('categoriaId', 'nome tipo cor');

    const response: ApiResponse = {
      success: true,
      data: orcamentoPopulado
    };
    res.status(201).json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      error: error.message
    };
    res.status(400).json(response);
  }
};

export const atualizarOrcamento = async (req: Request, res: Response): Promise<void> => {
  try {
    const orcamento = await Orcamento.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('categoriaId', 'nome tipo cor');

    if (!orcamento) {
      const response: ApiResponse = {
        success: false,
        error: 'Orçamento não encontrado'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: orcamento
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      error: error.message
    };
    res.status(400).json(response);
  }
};

export const deletarOrcamento = async (req: Request, res: Response): Promise<void> => {
  try {
    const orcamento = await Orcamento.findByIdAndDelete(req.params.id);

    if (!orcamento) {
      const response: ApiResponse = {
        success: false,
        error: 'Orçamento não encontrado'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: { message: 'Orçamento deletado com sucesso' }
    };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      error: error.message
    };
    res.status(500).json(response);
  }
};
