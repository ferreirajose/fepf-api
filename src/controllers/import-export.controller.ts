import { Request, Response } from 'express';
import Despesa from '../models/Despesa';
import Receita from '../models/Receita';
import Categoria from '../models/Categoria';
import Cartao from '../models/Cartao';
import { ApiResponse, ImportResult } from '../types';
import { generateDespesasExcel, generateReceitasExcel, generateCategoriasExcel } from '../utils/excel-generator';
import * as XLSX from 'xlsx';
import mongoose from 'mongoose';

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

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

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

        let subcategoriaId;
        if (row.subcategoria && categoria.subcategorias) {
          const subcategoria = categoria.subcategorias.find(
            (sub: any) => sub.nome === row.subcategoria && sub.ativo
          );
          if (subcategoria) {
            subcategoriaId = subcategoria.id;
          }
        }

        const despesaData: any = {
          descricao: row.descricao,
          valor: parseFloat(row.valor),
          data: new Date(row.data),
          categoriaId: categoria._id,
          cartaoId,
          subcategoriaId,
          recorrente: row.recorrente === true || row.recorrente === 'true',
          observacoes: row.observacoes
        };

        if (row.formaPagamento) {
          despesaData.formaPagamento = row.formaPagamento;
        }

        if (row.pago !== undefined && row.pago !== null) {
          despesaData.pago = row.pago === true || row.pago === 'true';
        }

        if (row.latitude && row.longitude) {
          despesaData.localizacao = {
            latitude: parseFloat(row.latitude),
            longitude: parseFloat(row.longitude),
            endereco: row.endereco || `${row.latitude}, ${row.longitude}`
          };
        }

        await Despesa.create(despesaData);

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

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

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

        let subcategoriaId;
        if (row.subcategoria && categoria.subcategorias) {
          const subcategoria = categoria.subcategorias.find(
            (sub: any) => sub.nome === row.subcategoria && sub.ativo
          );
          if (subcategoria) {
            subcategoriaId = subcategoria.id;
          }
        }

        await Receita.create({
          descricao: row.descricao,
          valor: parseFloat(row.valor),
          data: new Date(row.data),
          categoriaId: categoria._id,
          subcategoriaId,
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

export const importarCategorias = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      const response: ApiResponse = {
        success: false,
        error: 'Arquivo não enviado'
      };
      res.status(400).json(response);
      return;
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

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
        if (!row.nome) {
          throw new Error('Nome da categoria é obrigatório');
        }

        const categoriaExistente = await Categoria.findOne({ nome: row.nome });
        if (categoriaExistente) {
          throw new Error(`Categoria "${row.nome}" já existe`);
        }

        const ativoValue = row.ativo;
        let ativo = true;

        if (ativoValue !== undefined && ativoValue !== null) {
          if (typeof ativoValue === 'boolean') {
            ativo = ativoValue;
          } else if (typeof ativoValue === 'string') {
            const ativoStr = ativoValue.toLowerCase().trim();
            ativo = ativoStr === 'true' || ativoStr === '1' || ativoStr === 'yes' || ativoStr === 'sim';
          } else {
            ativo = Boolean(ativoValue);
          }
        }

        const categoriaData: any = {
          nome: row.nome,
          ativo: ativo
        };

        if (row.tipo && row.tipo.trim() !== '') {
          const tipoNormalizado = row.tipo.trim().toLowerCase();
          if (!['receita', 'despesa'].includes(tipoNormalizado)) {
            throw new Error(`Tipo "${row.tipo}" inválido. Use "receita" ou "despesa"`);
          }
          categoriaData.tipo = tipoNormalizado;
        }

        if (row.cor) {
          if (!/^#[0-9A-Fa-f]{6}$/.test(row.cor)) {
            throw new Error('Cor deve estar no formato hexadecimal (#RRGGBB)');
          }
          categoriaData.cor = row.cor;
        }

        if (row.icone) {
          categoriaData.icone = row.icone;
        }

        if (row.subcategorias && typeof row.subcategorias === 'string') {
          const subcategoriasNomes = row.subcategorias
            .split(';')
            .map((nome: string) => nome.trim())
            .filter((nome: string) => nome.length > 0);

          categoriaData.subcategorias = subcategoriasNomes.map((nome: string) => ({
            id: new mongoose.Types.ObjectId().toString(),
            nome,
            icone: 'tag',
            categoriaId: '',
            ativo: true
          }));
        }

        const categoria = await Categoria.create(categoriaData);

        if (categoria.subcategorias && categoria.subcategorias.length > 0) {
          categoria.subcategorias = categoria.subcategorias.map(sub => ({
            ...sub,
            categoriaId: categoria._id.toString()
          }));
          await categoria.save();
        }

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

export const exportarCategorias = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categorias = await Categoria.find().sort({ nome: 1 });

    const buffer = generateCategoriasExcel(categorias);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="categorias.xlsx"');
    res.setHeader('Content-Length', buffer.length.toString());
    res.status(200).send(buffer);
  } catch (error: any) {
    const response: ApiResponse = {
      success: false,
      error: error.message
    };
    res.status(500).json(response);
  }
};
