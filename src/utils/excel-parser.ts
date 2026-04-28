import * as XLSX from 'xlsx';
import { ImportResult } from '../types';
import Categoria from '../models/Categoria';

interface DespesaRow {
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  cartao?: string;
  recorrente: boolean;
  observacoes?: string;
}

interface ReceitaRow {
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  recorrente: boolean;
  observacoes?: string;
}

export const parseDespesasExcel = async (buffer: Buffer): Promise<ImportResult> => {
  const result: ImportResult = {
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  };

  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: DespesaRow[] = XLSX.utils.sheet_to_json(worksheet);

    result.total = data.length;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;

      try {
        if (!row.descricao || !row.valor || !row.data || !row.categoria) {
          throw new Error('Campos obrigatórios faltando');
        }

        const categoria = await Categoria.findOne({ nome: row.categoria });
        if (!categoria) {
          throw new Error(`Categoria "${row.categoria}" não encontrada`);
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

    return result;
  } catch (error: any) {
    throw new Error(`Erro ao processar arquivo Excel: ${error.message}`);
  }
};

export const parseReceitasExcel = async (buffer: Buffer): Promise<ImportResult> => {
  const result: ImportResult = {
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  };

  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: ReceitaRow[] = XLSX.utils.sheet_to_json(worksheet);

    result.total = data.length;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;

      try {
        if (!row.descricao || !row.valor || !row.data || !row.categoria) {
          throw new Error('Campos obrigatórios faltando');
        }

        const categoria = await Categoria.findOne({ nome: row.categoria });
        if (!categoria) {
          throw new Error(`Categoria "${row.categoria}" não encontrada`);
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

    return result;
  } catch (error: any) {
    throw new Error(`Erro ao processar arquivo Excel: ${error.message}`);
  }
};
