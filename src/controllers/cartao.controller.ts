import { Request, Response } from 'express';
import Cartao from '../models/Cartao';
import { ApiResponse } from '../types';

export const listarCartoes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cartoes = await Cartao.find().sort({ nome: 1 });
    const response: ApiResponse = {
      success: true,
      data: cartoes
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

export const buscarCartaoPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const cartao = await Cartao.findById(req.params.id);

    if (!cartao) {
      const response: ApiResponse = {
        success: false,
        error: 'Cartão não encontrado'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: cartao
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

export const criarCartao = async (req: Request, res: Response): Promise<void> => {
  try {
    const cartao = await Cartao.create(req.body);
    const response: ApiResponse = {
      success: true,
      data: cartao
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

export const atualizarCartao = async (req: Request, res: Response): Promise<void> => {
  try {
    const cartao = await Cartao.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!cartao) {
      const response: ApiResponse = {
        success: false,
        error: 'Cartão não encontrado'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: cartao
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

export const deletarCartao = async (req: Request, res: Response): Promise<void> => {
  try {
    const cartao = await Cartao.findByIdAndUpdate(
      req.params.id,
      { ativo: false },
      { new: true }
    );

    if (!cartao) {
      const response: ApiResponse = {
        success: false,
        error: 'Cartão não encontrado'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: { message: 'Cartão desativado com sucesso' }
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
