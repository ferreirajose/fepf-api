import { Request, Response } from 'express';
import Orcamento from '../models/Orcamento';
import { ApiResponse } from '../types';

export const listarOrcamentos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mes, ano } = req.query;

    const filtros: any = {};
    if (mes) filtros.mes = parseInt(mes as string);
    if (ano) filtros.ano = parseInt(ano as string);

    const orcamentos = await Orcamento.find(filtros)
      .populate('categoriaId', 'nome tipo cor')
      .sort({ ano: -1, mes: -1 });

    const response: ApiResponse = {
      success: true,
      data: orcamentos
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
      .populate('categoriaId', 'nome tipo cor');

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
