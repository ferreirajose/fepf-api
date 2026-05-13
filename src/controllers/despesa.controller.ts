import { Request, Response } from 'express';
import Despesa from '../models/Despesa';
import { ApiResponse } from '../types';

export const listarDespesas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dataInicio, dataFim, categoriaId, subcategoriaId, cartaoId, formaPagamento, pago } = req.query;

    const filtros: any = {};

    if (dataInicio || dataFim) {
      filtros.data = {};
      if (dataInicio) filtros.data.$gte = new Date(dataInicio as string);
      if (dataFim) filtros.data.$lte = new Date(dataFim as string);
    }

    if (categoriaId) filtros.categoriaId = categoriaId;
    if (subcategoriaId) filtros.subcategoriaId = subcategoriaId;
    if (cartaoId) filtros.cartaoId = cartaoId;
    if (formaPagamento) filtros.formaPagamento = formaPagamento;
    if (pago !== undefined) filtros.pago = pago === 'true';

    const despesas = await Despesa.find(filtros)
      .populate('categoriaId', 'nome tipo cor icone subcategorias')
      .populate('cartaoId', 'nome bandeira')
      .sort({ data: -1 });

    const response: ApiResponse = {
      success: true,
      data: despesas
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

export const buscarDespesaPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const despesa = await Despesa.findById(req.params.id)
      .populate('categoriaId', 'nome tipo cor')
      .populate('cartaoId', 'nome bandeira');

    if (!despesa) {
      const response: ApiResponse = {
        success: false,
        error: 'Despesa não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: despesa
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

export const criarDespesa = async (req: Request, res: Response): Promise<void> => {
  try {
    const dadosDespesa = { ...req.body };

    // Se não informou localização, usar coordenadas padrão
    if (!dadosDespesa.localizacao || (!dadosDespesa.localizacao.latitude && !dadosDespesa.localizacao.longitude)) {
      dadosDespesa.localizacao = {
        latitude: -7.165104,
        longitude: -34.855471,
        endereco: '-7.165104, -34.855471'
      };
    }

    const despesa = await Despesa.create(dadosDespesa);
    const despesaPopulada = await Despesa.findById(despesa._id)
      .populate('categoriaId', 'nome tipo cor')
      .populate('cartaoId', 'nome bandeira');

    const response: ApiResponse = {
      success: true,
      data: despesaPopulada
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

export const atualizarDespesa = async (req: Request, res: Response): Promise<void> => {
  try {
    const dadosDespesa = { ...req.body };

    // Se não informou localização, usar coordenadas padrão
    if (dadosDespesa.localizacao && !dadosDespesa.localizacao.latitude && !dadosDespesa.localizacao.longitude) {
      dadosDespesa.localizacao = {
        latitude: -7.165104,
        longitude: -34.855471,
        endereco: '-7.165104, -34.855471'
      };
    }

    const despesa = await Despesa.findByIdAndUpdate(
      req.params.id,
      dadosDespesa,
      { new: true, runValidators: true }
    )
      .populate('categoriaId', 'nome tipo cor')
      .populate('cartaoId', 'nome bandeira');

    if (!despesa) {
      const response: ApiResponse = {
        success: false,
        error: 'Despesa não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: despesa
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

export const deletarDespesa = async (req: Request, res: Response): Promise<void> => {
  try {
    const despesa = await Despesa.findByIdAndDelete(req.params.id);

    if (!despesa) {
      const response: ApiResponse = {
        success: false,
        error: 'Despesa não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: { message: 'Despesa deletada com sucesso' }
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

    const total = await Despesa.aggregate([
      { $match: filtros },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);

    const porCategoria = await Despesa.aggregate([
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

    const porMes = await Despesa.aggregate([
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
