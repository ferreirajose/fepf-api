import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Conta from '../models/Conta';
import Receita from '../models/Receita';
import Despesa from '../models/Despesa';
import Transferencia from '../models/Transferencia';
import { ApiResponse } from '../types';

export const listarContas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ativo } = req.query;

    const filtros: any = {};
    if (ativo !== undefined) {
      filtros.ativo = ativo === 'true';
    }

    const contas = await Conta.find(filtros)
      .sort({ nome: 1 });

    const response: ApiResponse = {
      success: true,
      data: contas
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

export const buscarContaPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const conta = await Conta.findById(req.params.id);

    if (!conta) {
      const response: ApiResponse = {
        success: false,
        error: 'Conta não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: conta
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

export const criarConta = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, tipoConta, banco, subTipoConta, saldoInicial } = req.body;

    if (req.body.tipoConta === 'conta_beneficios') {
      req.body.banco = null;
    }

    const conta = await Conta.create({
      nome,
      tipoConta,
      banco: req.body.banco,
      subTipoConta,
      saldoInicial,
      saldoAtual: saldoInicial,
      ativo: true
    });

    const response: ApiResponse = {
      success: true,
      data: conta
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

export const atualizarConta = async (req: Request, res: Response): Promise<void> => {
  try {
    const { saldoAtual, ...dadosPermitidos } = req.body;

    if (dadosPermitidos.subTipoConta) {
      const tipoEnviado = dadosPermitidos.tipoConta;

      if (!tipoEnviado) {
        const conta = await Conta.findById(req.params.id);
        if (!conta) {
          const response: ApiResponse = {
            success: false,
            error: 'Conta não encontrada'
          };
          res.status(404).json(response);
          return;
        }

        if (conta.tipoConta !== 'conta_beneficios') {
          const response: ApiResponse = {
            success: false,
            error: 'Subtipo só pode ser informado para Conta Benefícios'
          };
          res.status(400).json(response);
          return;
        }
      } else {
        if (tipoEnviado !== 'conta_beneficios') {
          const response: ApiResponse = {
            success: false,
            error: 'Subtipo só pode ser informado para Conta Benefícios'
          };
          res.status(400).json(response);
          return;
        }
      }
    }

    if (dadosPermitidos.tipoConta && dadosPermitidos.tipoConta !== 'conta_beneficios') {
      dadosPermitidos.subTipoConta = undefined;
    }

    if (dadosPermitidos.tipoConta === 'conta_beneficios') {
      dadosPermitidos.banco = null;
    }

    if (dadosPermitidos.tipoConta && dadosPermitidos.tipoConta !== 'conta_beneficios') {
      const conta = await Conta.findById(req.params.id);
      if (conta && conta.tipoConta === 'conta_beneficios' && !dadosPermitidos.banco) {
        const response: ApiResponse = {
          success: false,
          error: 'Banco é obrigatório ao mudar de Conta Benefícios para outro tipo'
        };
        res.status(400).json(response);
        return;
      }
    }

    const conta = await Conta.findByIdAndUpdate(
      req.params.id,
      dadosPermitidos,
      { new: true, runValidators: true }
    );

    if (!conta) {
      const response: ApiResponse = {
        success: false,
        error: 'Conta não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: conta
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

export const deletarConta = async (req: Request, res: Response): Promise<void> => {
  try {
    const conta = await Conta.findById(req.params.id);

    if (!conta) {
      const response: ApiResponse = {
        success: false,
        error: 'Conta não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    conta.ativo = false;
    await conta.save();

    const response: ApiResponse = {
      success: true,
      data: { message: 'Conta desativada com sucesso' }
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

export const calcularSaldoAtual = async (req: Request, res: Response): Promise<void> => {
  try {
    const contaId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

    const conta = await Conta.findById(contaId);

    if (!conta) {
      const response: ApiResponse = {
        success: false,
        error: 'Conta não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const contaObjectId = new mongoose.Types.ObjectId(contaId);

    const [receitas, despesas, transferenciasRecebidas, transferenciasEnviadas] = await Promise.all([
      Receita.aggregate([
        { $match: { contaId: contaObjectId, ativo: true } },
        { $group: { _id: null, total: { $sum: '$valor' } } }
      ]),
      Despesa.aggregate([
        { $match: { contaId: contaObjectId, ativo: true } },
        { $group: { _id: null, total: { $sum: '$valor' } } }
      ]),
      Transferencia.aggregate([
        { $match: { contaDestinoId: contaObjectId, ativo: true } },
        { $group: { _id: null, total: { $sum: '$valor' } } }
      ]),
      Transferencia.aggregate([
        { $match: { contaOrigemId: contaObjectId, ativo: true } },
        { $group: { _id: null, total: { $sum: '$valor' } } }
      ])
    ]);

    const totalReceitas = receitas[0]?.total || 0;
    const totalDespesas = despesas[0]?.total || 0;
    const totalRecebido = transferenciasRecebidas[0]?.total || 0;
    const totalEnviado = transferenciasEnviadas[0]?.total || 0;

    const saldoCalculado = conta.saldoInicial + totalReceitas - totalDespesas + totalRecebido - totalEnviado;

    conta.saldoAtual = saldoCalculado;
    await conta.save();

    const response: ApiResponse = {
      success: true,
      data: {
        contaId: conta._id,
        nome: conta.nome,
        saldoInicial: conta.saldoInicial,
        totalReceitas,
        totalDespesas,
        totalRecebido,
        totalEnviado,
        saldoAtual: saldoCalculado
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
