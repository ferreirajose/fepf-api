import { Request, Response } from 'express';
import Transferencia from '../models/Transferencia';
import Conta from '../models/Conta';
import { ApiResponse } from '../types';

export const listarTransferencias = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dataInicio, dataFim, contaId } = req.query;

    const filtros: any = { ativo: true };

    if (dataInicio || dataFim) {
      filtros.data = {};
      if (dataInicio) filtros.data.$gte = new Date(dataInicio as string);
      if (dataFim) filtros.data.$lte = new Date(dataFim as string);
    }

    if (contaId) {
      filtros.$or = [
        { contaOrigemId: contaId },
        { contaDestinoId: contaId }
      ];
    }

    const transferencias = await Transferencia.find(filtros)
      .populate('contaOrigemId', 'nome')
      .populate('contaDestinoId', 'nome')
      .sort({ data: -1 });

    const response: ApiResponse = {
      success: true,
      data: transferencias
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

export const buscarTransferenciaPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const transferencia = await Transferencia.findById(req.params.id)
      .populate('contaOrigemId', 'nome')
      .populate('contaDestinoId', 'nome');

    if (!transferencia) {
      const response: ApiResponse = {
        success: false,
        error: 'Transferência não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: transferencia
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

export const criarTransferencia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contaOrigemId, contaDestinoId, valor, data, descricao } = req.body;

    if (contaOrigemId === contaDestinoId) {
      const response: ApiResponse = {
        success: false,
        error: 'Conta de origem e destino não podem ser iguais'
      };
      res.status(400).json(response);
      return;
    }

    const contaOrigem = await Conta.findById(contaOrigemId);
    const contaDestino = await Conta.findById(contaDestinoId);

    if (!contaOrigem || !contaDestino) {
      const response: ApiResponse = {
        success: false,
        error: 'Conta de origem ou destino não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    if (!contaOrigem.ativo || !contaDestino.ativo) {
      const response: ApiResponse = {
        success: false,
        error: 'Não é possível transferir para/de contas inativas'
      };
      res.status(400).json(response);
      return;
    }

    if (contaOrigem.saldoAtual < valor) {
      const response: ApiResponse = {
        success: false,
        error: 'Saldo insuficiente na conta de origem'
      };
      res.status(400).json(response);
      return;
    }

    const transferencia = await Transferencia.create({
      contaOrigemId,
      contaDestinoId,
      valor,
      data,
      descricao,
      ativo: true
    });

    contaOrigem.saldoAtual -= valor;
    await contaOrigem.save();

    contaDestino.saldoAtual += valor;
    await contaDestino.save();

    const transferenciaPopulada = await Transferencia.findById(transferencia._id)
      .populate('contaOrigemId', 'nome')
      .populate('contaDestinoId', 'nome');

    const response: ApiResponse = {
      success: true,
      data: transferenciaPopulada
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

export const atualizarTransferencia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { contaOrigemId, contaDestinoId, valor, data, descricao } = req.body;

    if (contaOrigemId === contaDestinoId) {
      const response: ApiResponse = {
        success: false,
        error: 'Conta de origem e destino não podem ser iguais'
      };
      res.status(400).json(response);
      return;
    }

    const transferenciaAnterior = await Transferencia.findById(id);
    if (!transferenciaAnterior) {
      const response: ApiResponse = {
        success: false,
        error: 'Transferência não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const valorAnterior = transferenciaAnterior.valor;
    const valorNovo = valor;

    const origemMudou = contaOrigemId !== transferenciaAnterior.contaOrigemId.toString();
    const destinoMudou = contaDestinoId !== transferenciaAnterior.contaDestinoId.toString();

    let contaOrigemAnterior;
    let contaDestinoAnterior;
    let contaOrigemNova;
    let contaDestinoNova;

    if (origemMudou) {
      contaOrigemAnterior = await Conta.findById(transferenciaAnterior.contaOrigemId);
      contaOrigemNova = await Conta.findById(contaOrigemId);
    } else {
      contaOrigemAnterior = await Conta.findById(contaOrigemId);
      contaOrigemNova = contaOrigemAnterior;
    }

    if (destinoMudou) {
      contaDestinoAnterior = await Conta.findById(transferenciaAnterior.contaDestinoId);
      contaDestinoNova = await Conta.findById(contaDestinoId);
    } else {
      contaDestinoAnterior = await Conta.findById(contaDestinoId);
      contaDestinoNova = contaDestinoAnterior;
    }

    if (!contaOrigemAnterior || !contaOrigemNova || !contaDestinoAnterior || !contaDestinoNova) {
      const response: ApiResponse = {
        success: false,
        error: 'Uma ou mais contas não foram encontradas'
      };
      res.status(404).json(response);
      return;
    }

    if (!contaOrigemNova.ativo || !contaDestinoNova.ativo) {
      const response: ApiResponse = {
        success: false,
        error: 'Não é possível transferir de/para contas inativas'
      };
      res.status(400).json(response);
      return;
    }

    if (origemMudou) {
      contaOrigemAnterior.saldoAtual += valorAnterior;
      await contaOrigemAnterior.save();
    }

    if (destinoMudou) {
      contaDestinoAnterior.saldoAtual -= valorAnterior;
      await contaDestinoAnterior.save();
    }

    if (origemMudou || destinoMudou) {
      const saldoAposTransferencia = contaOrigemNova.saldoAtual - valorNovo;
      if (saldoAposTransferencia < 0) {
        if (origemMudou) {
          contaOrigemAnterior.saldoAtual -= valorAnterior;
          await contaOrigemAnterior.save();
        }
        if (destinoMudou) {
          contaDestinoAnterior.saldoAtual += valorAnterior;
          await contaDestinoAnterior.save();
        }

        const response: ApiResponse = {
          success: false,
          error: 'Saldo insuficiente na conta de origem'
        };
        res.status(400).json(response);
        return;
      }

      contaOrigemNova.saldoAtual -= valorNovo;
      await contaOrigemNova.save();

      contaDestinoNova.saldoAtual += valorNovo;
      await contaDestinoNova.save();
    } else {
      const diferenca = valorNovo - valorAnterior;

      const saldoAposTransferencia = contaOrigemNova.saldoAtual - diferenca;
      if (saldoAposTransferencia < 0) {
        const response: ApiResponse = {
          success: false,
          error: 'Saldo insuficiente na conta de origem'
        };
        res.status(400).json(response);
        return;
      }

      contaOrigemNova.saldoAtual -= diferenca;
      contaDestinoNova.saldoAtual += diferenca;

      await contaOrigemNova.save();
      if (contaOrigemNova._id.toString() !== contaDestinoNova._id.toString()) {
        await contaDestinoNova.save();
      }
    }

    const transferenciaAtualizada = await Transferencia.findByIdAndUpdate(
      id,
      { contaOrigemId, contaDestinoId, valor, data, descricao },
      { new: true, runValidators: true }
    )
      .populate('contaOrigemId', 'nome')
      .populate('contaDestinoId', 'nome');

    const response: ApiResponse<typeof transferenciaAtualizada> = {
      success: true,
      data: transferenciaAtualizada
    };
    res.status(200).json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar transferência'
    };
    res.status(400).json(response);
  }
};

export const deletarTransferencia = async (req: Request, res: Response): Promise<void> => {
  try {
    const transferencia = await Transferencia.findById(req.params.id);

    if (!transferencia) {
      const response: ApiResponse = {
        success: false,
        error: 'Transferência não encontrada'
      };
      res.status(404).json(response);
      return;
    }

    const contaOrigem = await Conta.findById(transferencia.contaOrigemId);
    const contaDestino = await Conta.findById(transferencia.contaDestinoId);

    if (contaOrigem) {
      contaOrigem.saldoAtual += transferencia.valor;
      await contaOrigem.save();
    }

    if (contaDestino) {
      contaDestino.saldoAtual -= transferencia.valor;
      await contaDestino.save();
    }

    transferencia.ativo = false;
    await transferencia.save();

    const response: ApiResponse = {
      success: true,
      data: { message: 'Transferência desativada com sucesso' }
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
