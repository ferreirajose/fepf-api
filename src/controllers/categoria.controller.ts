import { Request, Response } from 'express';
import Categoria from '../models/Categoria';
import Despesa from '../models/Despesa';
import Receita from '../models/Receita';
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
    const categoriaData = { ...req.body };

    // Se houver subcategorias, gerar IDs automaticamente
    if (categoriaData.subcategorias && Array.isArray(categoriaData.subcategorias)) {
      categoriaData.subcategorias = categoriaData.subcategorias.map((sub: any) => ({
        id: sub.id || new mongoose.Types.ObjectId().toString(),
        nome: sub.nome,
        icone: sub.icone || 'tag',
        categoriaId: '', // Será preenchido após criar a categoria
        ativo: sub.ativo !== undefined ? sub.ativo : true
      }));
    }

    const categoria = await Categoria.create(categoriaData);

    // Atualizar categoriaId das subcategorias após criação
    if (categoria.subcategorias && categoria.subcategorias.length > 0) {
      categoria.subcategorias = categoria.subcategorias.map(sub => ({
        ...sub,
        categoriaId: categoria._id.toString()
      }));
      await categoria.save();
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

export const atualizarCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoriaData = { ...req.body };

    // Se houver subcategorias, gerar IDs para as novas (sem id)
    if (categoriaData.subcategorias && Array.isArray(categoriaData.subcategorias)) {
      categoriaData.subcategorias = categoriaData.subcategorias.map((sub: any) => ({
        id: sub.id || new mongoose.Types.ObjectId().toString(),
        nome: sub.nome,
        icone: sub.icone || 'tag',
        categoriaId: sub.categoriaId || req.params.id,
        ativo: sub.ativo !== undefined ? sub.ativo : true
      }));
    }

    const categoria = await Categoria.findByIdAndUpdate(
      req.params.id,
      categoriaData,
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
    const categoriaId = req.params.id;

    // Verificar se a categoria existe
    const categoria = await Categoria.findById(categoriaId);

    if (!categoria) {
      const response: ApiResponse = {
        success: false,
        error: 'Categoria não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    // Deletar todas as despesas associadas à categoria
    await Despesa.deleteMany({ categoriaId: categoriaId });

    // Deletar todas as receitas associadas à categoria
    await Receita.deleteMany({ categoriaId: categoriaId });

    // Deletar a categoria (isso também remove todas as subcategorias automaticamente)
    await Categoria.findByIdAndDelete(categoriaId);

    const response: ApiResponse = {
      success: true,
      data: { message: 'Categoria e todos os registros associados foram removidos com sucesso' }
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
    const { nome, icone } = req.body;
    const categoriaId = req.params.id;

    const subcategoria = {
      id: new mongoose.Types.ObjectId().toString(),
      nome,
      icone: icone || 'tag',
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
    const { nome, icone, ativo } = req.body;

    const updateFields: any = {};
    if (nome !== undefined) updateFields['subcategorias.$.nome'] = nome;
    if (icone !== undefined) updateFields['subcategorias.$.icone'] = icone;
    if (ativo !== undefined) updateFields['subcategorias.$.ativo'] = ativo;

    const categoria = await Categoria.findOneAndUpdate(
      {
        _id: categoriaId,
        'subcategorias.id': subcategoriaId
      },
      {
        $set: updateFields
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

    // Deletar todas as despesas associadas à subcategoria
    await Despesa.deleteMany({ subcategoriaId: subcategoriaId });

    // Deletar todas as receitas associadas à subcategoria
    await Receita.deleteMany({ subcategoriaId: subcategoriaId });

    // Remover a subcategoria da categoria
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
      data: { message: 'Subcategoria e todos os registros associados foram removidos com sucesso' }
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
