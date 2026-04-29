import { Request, Response } from 'express';
import Categoria from '../models/Categoria';
import { ApiResponse } from '../types';
import mongoose from 'mongoose';

export const listarCategorias = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categorias = await Categoria.find({ ativo: true }).sort({ nome: 1 });
    const response: ApiResponse = {
      success: true,
      data: categorias
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

export const buscarCategoriaPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      const response: ApiResponse = {
        success: false,
        error: 'Categoria não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: categoria
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

export const criarCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoria = await Categoria.create(req.body);
    const response: ApiResponse = {
      success: true,
      data: categoria
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

export const atualizarCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoria = await Categoria.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!categoria) {
      const response: ApiResponse = {
        success: false,
        error: 'Categoria não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: categoria
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

export const deletarCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoria = await Categoria.findByIdAndUpdate(
      req.params.id,
      { ativo: false },
      { new: true }
    );

    if (!categoria) {
      const response: ApiResponse = {
        success: false,
        error: 'Categoria não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: { message: 'Categoria desativada com sucesso' }
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

export const adicionarSubcategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome } = req.body;
    const categoriaId = req.params.id;

    const subcategoria = {
      id: new mongoose.Types.ObjectId().toString(),
      nome,
      categoriaId,
      ativo: true
    };

    const categoria = await Categoria.findByIdAndUpdate(
      categoriaId,
      { $push: { subcategorias: subcategoria } },
      { new: true, runValidators: true }
    );

    if (!categoria) {
      const response: ApiResponse = {
        success: false,
        error: 'Categoria não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: categoria
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

export const atualizarSubcategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoriaId, subcategoriaId } = req.params;
    const { nome, ativo } = req.body;

    const categoria = await Categoria.findOneAndUpdate(
      {
        _id: categoriaId,
        'subcategorias.id': subcategoriaId
      },
      {
        $set: {
          'subcategorias.$.nome': nome !== undefined ? nome : undefined,
          'subcategorias.$.ativo': ativo !== undefined ? ativo : undefined
        }
      },
      { new: true, runValidators: true }
    );

    if (!categoria) {
      const response: ApiResponse = {
        success: false,
        error: 'Categoria ou subcategoria não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: categoria
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

export const deletarSubcategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoriaId, subcategoriaId } = req.params;

    const categoria = await Categoria.findByIdAndUpdate(
      categoriaId,
      { $pull: { subcategorias: { id: subcategoriaId } } },
      { new: true }
    );

    if (!categoria) {
      const response: ApiResponse = {
        success: false,
        error: 'Categoria não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: { message: 'Subcategoria removida com sucesso' }
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
