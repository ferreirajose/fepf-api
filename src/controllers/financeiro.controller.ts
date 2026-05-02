import { Request, Response } from 'express';
import Receita from '../models/Receita';
import Despesa from '../models/Despesa';
import { ApiResponse, SaldoAcumulado } from '../types';

export const obterSaldoAcumulado = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mes, ano } = req.query;

    if (!mes || !ano) {
      const response: ApiResponse = {
        success: false,
        error: 'Parâmetros mes e ano são obrigatórios'
      };
      res.status(400).json(response);
      return;
    }

    const mesNum = parseInt(mes as string);
    const anoNum = parseInt(ano as string);

    if (mesNum < 1 || mesNum > 12) {
      const response: ApiResponse = {
        success: false,
        error: 'Mês deve estar entre 1 e 12'
      };
      res.status(400).json(response);
      return;
    }

    // Calcular primeiro e último dia do mês atual
    const primeiroDiaMes = new Date(anoNum, mesNum - 1, 1);
    const ultimoDiaMes = new Date(anoNum, mesNum, 0, 23, 59, 59, 999);

    // Calcular saldo anterior (até o fim do mês anterior)
    const receitasAnteriores = await Receita.aggregate([
      { $match: { data: { $lt: primeiroDiaMes } } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);

    const despesasAnteriores = await Despesa.aggregate([
      { $match: { data: { $lt: primeiroDiaMes } } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);

    const saldoAnterior = (receitasAnteriores[0]?.total || 0) - (despesasAnteriores[0]?.total || 0);

    // Calcular transações do mês atual
    const receitasMesAtual = await Receita.aggregate([
      { $match: { data: { $gte: primeiroDiaMes, $lte: ultimoDiaMes } } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);

    const despesasMesAtual = await Despesa.aggregate([
      { $match: { data: { $gte: primeiroDiaMes, $lte: ultimoDiaMes } } },
      { $group: { _id: null, total: { $sum: '$valor' } } }
    ]);

    const receitasMes = receitasMesAtual[0]?.total || 0;
    const despesasMes = despesasMesAtual[0]?.total || 0;
    const saldoAtual = saldoAnterior + receitasMes - despesasMes;

    const dados: SaldoAcumulado = {
      mes: mesNum,
      ano: anoNum,
      saldoAnterior,
      receitasMes,
      despesasMes,
      saldoAtual
    };

    const response: ApiResponse<SaldoAcumulado> = {
      success: true,
      data: dados
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
