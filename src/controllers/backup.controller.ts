import { Request, Response } from 'express';
import Despesa from '../models/Despesa';
import Receita from '../models/Receita';
import Categoria from '../models/Categoria';
import Cartao from '../models/Cartao';
import Orcamento from '../models/Orcamento';
import Conta from '../models/Conta';
import Transferencia from '../models/Transferencia';
import { ApiResponse } from '../types';

export const gerarBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    // Buscar todos os dados de todas as coleções
    const [despesas, receitas, categorias, cartoes, orcamentos, contas, transferencias] = await Promise.all([
      Despesa.find().populate('categoriaId').populate('cartaoId').populate('contaId'),
      Receita.find().populate('categoriaId').populate('contaId'),
      Categoria.find(),
      Cartao.find(),
      Orcamento.find().populate('categoriaId'),
      Conta.find(),
      Transferencia.find().populate('contaOrigemId').populate('contaDestinoId')
    ]);

    const backup = {
      metadata: {
        dataExportacao: new Date().toISOString(),
        versao: '2.0',
        totalRegistros: {
          despesas: despesas.length,
          receitas: receitas.length,
          categorias: categorias.length,
          cartoes: cartoes.length,
          orcamentos: orcamentos.length,
          contas: contas.length,
          transferencias: transferencias.length
        }
      },
      data: {
        categorias: categorias,
        cartoes: cartoes,
        contas: contas,
        despesas: despesas,
        receitas: receitas,
        orcamentos: orcamentos,
        transferencias: transferencias
      }
    };

    const response: ApiResponse = {
      success: true,
      data: backup
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

export const restaurarBackup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data } = req.body;

    if (!data) {
      const response: ApiResponse = {
        success: false,
        error: 'Dados de backup não fornecidos'
      };
      res.status(400).json(response);
      return;
    }

    const resultados = {
      categorias: 0,
      cartoes: 0,
      contas: 0,
      despesas: 0,
      receitas: 0,
      orcamentos: 0,
      transferencias: 0
    };

    // Restaurar categorias primeiro (pois despesas/receitas dependem delas)
    if (data.categorias && Array.isArray(data.categorias)) {
      for (const cat of data.categorias) {
        await Categoria.findByIdAndUpdate(
          cat._id,
          cat,
          { upsert: true, new: true }
        );
        resultados.categorias++;
      }
    }

    // Restaurar cartões
    if (data.cartoes && Array.isArray(data.cartoes)) {
      for (const cartao of data.cartoes) {
        await Cartao.findByIdAndUpdate(
          cartao._id,
          cartao,
          { upsert: true, new: true }
        );
        resultados.cartoes++;
      }
    }

    // Restaurar contas (antes de despesas/receitas/transferências)
    if (data.contas && Array.isArray(data.contas)) {
      for (const conta of data.contas) {
        await Conta.findByIdAndUpdate(
          conta._id,
          conta,
          { upsert: true, new: true }
        );
        resultados.contas++;
      }
    }

    // Restaurar despesas
    if (data.despesas && Array.isArray(data.despesas)) {
      for (const despesa of data.despesas) {
        await Despesa.findByIdAndUpdate(
          despesa._id,
          despesa,
          { upsert: true, new: true }
        );
        resultados.despesas++;
      }
    }

    // Restaurar receitas
    if (data.receitas && Array.isArray(data.receitas)) {
      for (const receita of data.receitas) {
        await Receita.findByIdAndUpdate(
          receita._id,
          receita,
          { upsert: true, new: true }
        );
        resultados.receitas++;
      }
    }

    // Restaurar orçamentos
    if (data.orcamentos && Array.isArray(data.orcamentos)) {
      for (const orcamento of data.orcamentos) {
        await Orcamento.findByIdAndUpdate(
          orcamento._id,
          orcamento,
          { upsert: true, new: true }
        );
        resultados.orcamentos++;
      }
    }

    // Restaurar transferências (por último, pois dependem de contas)
    if (data.transferencias && Array.isArray(data.transferencias)) {
      for (const transferencia of data.transferencias) {
        await Transferencia.findByIdAndUpdate(
          transferencia._id,
          transferencia,
          { upsert: true, new: true }
        );
        resultados.transferencias++;
      }
    }

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'Backup restaurado com sucesso',
        resultados
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
