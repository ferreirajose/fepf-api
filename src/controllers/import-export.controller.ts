import { Request, Response } from 'express';
import Despesa from '../models/Despesa';
import Receita from '../models/Receita';
import Categoria from '../models/Categoria';
import Cartao from '../models/Cartao';
import { ApiResponse, ImportResult } from '../types';
import { generateDespesasExcel, generateReceitasExcel } from '../utils/excel-generator';
import * as XLSX from 'xlsx';

export const importarDespesas = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      const response: ApiResponse = {
        success: false,
        error: 'Arquivo não enviado'
      };
      res.status(400).json(response);
      return;
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const result: ImportResult = {
      total: data.length,
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      const rowNumber = i + 2;

      try {
        if (!row.descricao || !row.valor || !row.data || !row.categoria) {
          throw new Error('Campos obrigatórios faltando');
        }

        const categoria = await Categoria.findOne({ nome: row.categoria });
        if (!categoria) {
          throw new Error(`Categoria "${row.categoria}" não encontrada`);
        }

        let cartaoId;
        if (row.cartao) {
          const cartao = await Cartao.findOne({ nome: row.cartao });
          if (cartao) {
            cartaoId = cartao._id;
          }
        }

        await Despesa.create({
          descricao: row.descricao,
          valor: parseFloat(row.valor),
          data: new Date(row.data),
          categoriaId: categoria._id,
          cartaoId,
          recorrente: row.recorrente === true || row.recorrente === 'true',
          observacoes: row.observacoes
        });

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          message: error.message
        });
      }
    }

    const response: ApiResponse = {
      success: true,
      data: result
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

export const importarReceitas = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      const response: ApiResponse = {
        success: false,
        error: 'Arquivo não enviado'
      };
      res.status(400).json(response);
      return;
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const result: ImportResult = {
      total: data.length,
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      const rowNumber = i + 2;

      try {
        if (!row.descricao || !row.valor || !row.data || !row.categoria) {
          throw new Error('Campos obrigatórios faltando');
        }

        const categoria = await Categoria.findOne({ nome: row.categoria });
        if (!categoria) {
          throw new Error(`Categoria "${row.categoria}" não encontrada`);
        }

        await Receita.create({
          descricao: row.descricao,
          valor: parseFloat(row.valor),
          data: new Date(row.data),
          categoriaId: categoria._id,
          recorrente: row.recorrente === true || row.recorrente === 'true',
          observacoes: row.observacoes
        });

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          message: error.message
        });
      }
    }

    const response: ApiResponse = {
      success: true,
      data: result
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

export const exportarDespesas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dataInicio, dataFim, categoriaId } = req.query;

    const filtros: any = {};

    if (dataInicio || dataFim) {
      filtros.data = {};
      if (dataInicio) filtros.data.$gte = new Date(dataInicio as string);
      if (dataFim) filtros.data.$lte = new Date(dataFim as string);
    }

    if (categoriaId) filtros.categoriaId = categoriaId;

    const despesas = await Despesa.find(filtros)
      .populate('categoriaId', 'nome')
      .populate('cartaoId', 'nome')
      .sort({ data: -1 });

    const buffer = generateDespesasExcel(despesas);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=despesas.xlsx');
    res.send(buffer);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      error: error.message
    };
    res.status(500).json(response);
  }
};

export const exportarReceitas = async (req: Request, res: Response): Promise<void> => {
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
      .populate('categoriaId', 'nome')
      .sort({ data: -1 });

    const buffer = generateReceitasExcel(receitas);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=receitas.xlsx');
    res.send(buffer);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      error: error.message
    };
    res.status(500).json(response);
  }
};
