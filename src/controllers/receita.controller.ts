import { Request, Response } from 'express';
import Receita from '../models/Receita';
import { ApiResponse } from '../types';

export const listarReceitas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dataInicio, dataFim, categoriaId } = req.query;

    const filtros: any = {};

    if (dataInicio || dataFim) {
      filtros.data = {};
      if (dataInicio) filtros.data.$gte = new Date(dataInicio as string);
      if (dataFim) filtros.data.$lte = new Date(dataFim as string);
    }

    if (categoriaId) filtros.categoriaId = categoriaId;

    const receitas = await Receita.find(filtros)
      .populate('categoriaId', 'nome tipo cor')
      .sort({ data: -1 });

    const response: ApiResponse = {
      success: true,
      data: receitas
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

export const buscarReceitaPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const receita = await Receita.findById(req.params.id)
      .populate('categoriaId', 'nome tipo cor');

    if (!receita) {
      const response: ApiResponse = {
        success: false,
        error: 'Receita não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: receita
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

export const criarReceita = async (req: Request, res: Response): Promise<void> => {
  try {
    const receita = await Receita.create(req.body);
    const receitaPopulada = await Receita.findById(receita._id)
      .populate('categoriaId', 'nome tipo cor');

    const response: ApiResponse = {
      success: true,
      data: receitaPopulada
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

export const atualizarReceita = async (req: Request, res: Response): Promise<void> => {
  try {
    const receita = await Receita.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('categoriaId', 'nome tipo cor');

    if (!receita) {
      const response: ApiResponse = {
        success: false,
        error: 'Receita não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: receita
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

export const deletarReceita = async (req: Request, res: Response): Promise<void> => {
  try {
    const receita = await Receita.findByIdAndDelete(req.params.id);

    if (!receita) {
      const response: ApiResponse = {
        success: false,
        error: 'Receita não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: { message: 'Receita deletada com sucesso' }
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

export const obterEstatisticas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dataInicio, dataFim } = req.query;

    const filtros: any = {};
    if (dataInicio || dataFim) {
      filtros.data = {};
      if (dataInicio) filtros.data.$gte = new Date(dataInicio as string);
      if (dataFim) filtros.data.$lte = new Date(dataFim as string);
    }

    const total = await Receita.aggregate([
      { $match: filtros },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);

    const porCategoria = await Receita.aggregate([
      { $match: filtros },
      {
        $group: {
          _id: '$categoriaId',
          total: { $sum: '$valor' },
          quantidade: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categorias',
          localField: '_id',
          foreignField: '_id',
          as: 'categoria'
        }
      },
      { $unwind: '$categoria' },
      {
        $project: {
          categoriaId: '$_id',
          categoriaNome: '$categoria.nome',
          total: 1,
          quantidade: 1
        }
      },
      { $sort: { total: -1 } }
    ]);

    const porMes = await Receita.aggregate([
      { $match: filtros },
      {
        $group: {
          _id: {
            mes: { $month: '$data' },
            ano: { $year: '$data' }
          },
          total: { $sum: '$valor' },
          quantidade: { $sum: 1 }
        }
      },
      { $sort: { '_id.ano': 1, '_id.mes': 1 } }
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        total: total[0]?.total || 0,
        porCategoria,
        porMes
      }
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
