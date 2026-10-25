import { Request, Response } from 'express';
import { Model } from 'mongoose';
import Receita from '../models/Receita';
import Despesa from '../models/Despesa';
import Cartao from '../models/Cartao';
import Orcamento from '../models/Orcamento';
import {
  ApiResponse,
  SaldoAcumulado,
  DashboardFinanceiro,
  DashboardEvolucaoMes,
  DashboardCategoria,
  DashboardCartao,
  DashboardOrcamento,
  DashboardTransacao,
  DashboardLocal
} from '../types';
import { inicioMesUTC, fimMesUTC, cicloFatura, diaAnterior } from '../utils/periodo';

const COR_PADRAO = '#6e9fff';
const ANOS_EVOLUCAO = 5;
const LIMITE_TRANSACOES_RECENTES = 5;

// Formas de pagamento que não consomem o limite do cartão
const FORMAS_FORA_DO_CARTAO = ['dinheiro', 'debito', 'pix'];

const responderErro = (res: Response, status: number, error: string): void => {
  const response: ApiResponse = { success: false, error };
  res.status(status).json(response);
};

// Lê e valida os parâmetros mes/ano. Retorna null (e responde 400) se forem inválidos.
const lerMesAno = (req: Request, res: Response): { mes: number; ano: number } | null => {
  const { mes, ano } = req.query;

  if (!mes || !ano) {
    responderErro(res, 400, 'Parâmetros mes e ano são obrigatórios');
    return null;
  }

  const mesNum = parseInt(mes as string);
  const anoNum = parseInt(ano as string);

  if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
    responderErro(res, 400, 'Mês deve estar entre 1 e 12');
    return null;
  }
  if (isNaN(anoNum)) {
    responderErro(res, 400, 'Ano inválido');
    return null;
  }

  return { mes: mesNum, ano: anoNum };
};

// Soma, em uma única consulta, o total antes do mês e o total dentro do mês
const somarAnteriorEMes = async (
  model: Model<any>,
  inicioMes: Date,
  fimMes: Date
): Promise<{ anterior: number; mes: number }> => {
  const [resultado] = await model.aggregate([
    { $match: { data: { $lte: fimMes } } },
    {
      $group: {
        _id: null,
        anterior: { $sum: { $cond: [{ $lt: ['$data', inicioMes] }, '$valor', 0] } },
        mes: { $sum: { $cond: [{ $gte: ['$data', inicioMes] }, '$valor', 0] } }
      }
    }
  ]);
  return { anterior: resultado?.anterior || 0, mes: resultado?.mes || 0 };
};

const calcularSaldo = async (mes: number, ano: number): Promise<SaldoAcumulado> => {
  const inicioMes = inicioMesUTC(ano, mes);
  const fimMes = fimMesUTC(ano, mes);

  const [receitas, despesas] = await Promise.all([
    somarAnteriorEMes(Receita, inicioMes, fimMes),
    somarAnteriorEMes(Despesa, inicioMes, fimMes)
  ]);

  const saldoAnterior = receitas.anterior - despesas.anterior;

  return {
    mes,
    ano,
    saldoAnterior,
    receitasMes: receitas.mes,
    despesasMes: despesas.mes,
    saldoAtual: saldoAnterior + receitas.mes - despesas.mes
  };
};

const totaisPorMes = (model: Model<any>, inicio: Date, fim: Date) =>
  model.aggregate<{ _id: { ano: number; mes: number }; total: number }>([
    { $match: { data: { $gte: inicio, $lte: fim } } },
    {
      $group: {
        _id: { ano: { $year: '$data' }, mes: { $month: '$data' } },
        total: { $sum: '$valor' }
      }
    }
  ]);

// Série mensal contínua (meses sem movimento entram com zero)
const calcularEvolucao = async (mes: number, ano: number): Promise<DashboardEvolucaoMes[]> => {
  const anoInicial = ano - (ANOS_EVOLUCAO - 1);
  const inicio = inicioMesUTC(anoInicial, 1);
  const fim = fimMesUTC(ano, mes);

  const [receitas, despesas] = await Promise.all([
    totaisPorMes(Receita, inicio, fim),
    totaisPorMes(Despesa, inicio, fim)
  ]);

  const chave = (a: number, m: number) => `${a}-${m}`;
  const receitasMap = new Map(receitas.map(r => [chave(r._id.ano, r._id.mes), r.total]));
  const despesasMap = new Map(despesas.map(d => [chave(d._id.ano, d._id.mes), d.total]));

  const evolucao: DashboardEvolucaoMes[] = [];
  for (let a = anoInicial; a <= ano; a++) {
    const ultimoMes = a === ano ? mes : 12;
    for (let m = 1; m <= ultimoMes; m++) {
      evolucao.push({
        ano: a,
        mes: m,
        receitas: receitasMap.get(chave(a, m)) || 0,
        despesas: despesasMap.get(chave(a, m)) || 0
      });
    }
  }
  return evolucao;
};

const calcularDespesasPorCategoria = async (inicio: Date, fim: Date): Promise<DashboardCategoria[]> => {
  return Despesa.aggregate<DashboardCategoria>([
    { $match: { data: { $gte: inicio, $lte: fim } } },
    { $group: { _id: '$categoriaId', total: { $sum: '$valor' }, quantidade: { $sum: 1 } } },
    { $lookup: { from: 'categorias', localField: '_id', foreignField: '_id', as: 'categoria' } },
    // Despesas de categorias removidas continuam contando no total
    { $unwind: { path: '$categoria', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        categoriaId: '$_id',
        nome: { $ifNull: ['$categoria.nome', 'Sem categoria'] },
        cor: { $ifNull: ['$categoria.cor', COR_PADRAO] },
        total: 1,
        quantidade: 1
      }
    },
    { $sort: { total: -1 } }
  ]);
};

// Uso de cada cartão ativo no ciclo da fatura que contém a data de referência
const calcularCartoes = async (referencia: Date): Promise<DashboardCartao[]> => {
  const cartoes = await Cartao.find({ ativo: true }).sort({ nome: 1 }).lean();

  return Promise.all(
    cartoes.map(async (cartao) => {
      const ciclo = cicloFatura(cartao.diaFechamento, referencia);

      const [resultado] = await Despesa.aggregate([
        {
          $match: {
            cartaoId: cartao._id,
            data: { $gte: ciclo.inicio, $lt: ciclo.fim },
            formaPagamento: { $nin: FORMAS_FORA_DO_CARTAO }
          }
        },
        { $group: { _id: null, total: { $sum: '$valor' } } }
      ]);

      const utilizado = resultado?.total || 0;
      const limite = cartao.limite || 0;

      return {
        _id: String(cartao._id),
        nome: cartao.nome,
        limite,
        utilizado,
        disponivel: Math.max(0, limite - utilizado),
        percentualUtilizado: limite > 0 ? (utilizado / limite) * 100 : 0,
        cicloInicio: ciclo.inicio,
        cicloFim: diaAnterior(ciclo.fim)
      };
    })
  );
};

// Orçamentos do mês com o valor gasto (despesas pagas da categoria), em uma única agregação
const calcularOrcamentos = async (mes: number, ano: number): Promise<DashboardOrcamento[]> => {
  const orcamentos = await Orcamento.find({ mes, ano })
    .populate<{ categoriaId: { _id: any; nome: string; cor?: string } | null }>('categoriaId', 'nome cor')
    .lean();

  if (orcamentos.length === 0) return [];

  const categoriaIds = orcamentos
    .map(o => o.categoriaId?._id)
    .filter(Boolean);

  const gastos = await Despesa.aggregate<{ _id: any; total: number }>([
    {
      $match: {
        categoriaId: { $in: categoriaIds },
        data: { $gte: inicioMesUTC(ano, mes), $lte: fimMesUTC(ano, mes) },
        pago: true
      }
    },
    { $group: { _id: '$categoriaId', total: { $sum: '$valor' } } }
  ]);
  const gastosMap = new Map(gastos.map(g => [String(g._id), g.total]));

  return orcamentos.map((orcamento) => {
    const valorGasto = gastosMap.get(String(orcamento.categoriaId?._id)) || 0;
    return {
      _id: String(orcamento._id),
      categoriaNome: orcamento.categoriaId?.nome || 'Categoria',
      categoriaCor: orcamento.categoriaId?.cor || COR_PADRAO,
      valorPlanejado: orcamento.valor,
      valorGasto,
      valorRestante: orcamento.valor - valorGasto,
      percentualGasto: orcamento.valor > 0 ? (valorGasto / orcamento.valor) * 100 : 0
    };
  });
};

// Últimas transações até o fim do mês selecionado
const calcularTransacoesRecentes = async (fim: Date): Promise<DashboardTransacao[]> => {
  const buscar = (model: Model<any>) =>
    model.find({ data: { $lte: fim } })
      .sort({ data: -1, createdAt: -1 })
      .limit(LIMITE_TRANSACOES_RECENTES)
      .select('descricao valor data')
      .lean<{ _id: any; descricao: string; valor: number; data: Date }[]>();

  const [receitas, despesas] = await Promise.all([buscar(Receita), buscar(Despesa)]);

  const transacoes: DashboardTransacao[] = [
    ...receitas.map(r => ({ _id: String(r._id), tipo: 'receita' as const, descricao: r.descricao, valor: r.valor, data: r.data })),
    ...despesas.map(d => ({ _id: String(d._id), tipo: 'despesa' as const, descricao: d.descricao, valor: d.valor, data: d.data }))
  ];

  return transacoes
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, LIMITE_TRANSACOES_RECENTES);
};

// Despesas do mês que têm localização registrada
const calcularLocais = async (inicio: Date, fim: Date): Promise<DashboardLocal[]> => {
  const despesas = await Despesa.find({
    data: { $gte: inicio, $lte: fim },
    'localizacao.latitude': { $type: 'number' },
    'localizacao.longitude': { $type: 'number' }
  })
    .populate<{ categoriaId: { nome: string; cor?: string } | null }>('categoriaId', 'nome cor')
    .select('descricao valor data localizacao categoriaId')
    .sort({ data: -1 })
    .lean();

  return despesas.map((despesa) => {
    const latitude = despesa.localizacao!.latitude!;
    const longitude = despesa.localizacao!.longitude!;
    return {
      _id: String(despesa._id),
      descricao: despesa.descricao,
      valor: despesa.valor,
      data: despesa.data,
      latitude,
      longitude,
      endereco: despesa.localizacao?.endereco || `${latitude}, ${longitude}`,
      categoriaNome: despesa.categoriaId?.nome || 'Sem categoria',
      categoriaCor: despesa.categoriaId?.cor || COR_PADRAO
    };
  });
};

export const obterSaldoAcumulado = async (req: Request, res: Response): Promise<void> => {
  try {
    const periodo = lerMesAno(req, res);
    if (!periodo) return;

    const response: ApiResponse<SaldoAcumulado> = {
      success: true,
      data: await calcularSaldo(periodo.mes, periodo.ano)
    };
    res.json(response);
  } catch (error: any) {
    responderErro(res, 500, error.message);
  }
};

export const obterDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const periodo = lerMesAno(req, res);
    if (!periodo) return;

    const { mes, ano } = periodo;
    const inicioMes = inicioMesUTC(ano, mes);
    const fimMes = fimMesUTC(ano, mes);

    // No mês corrente o ciclo do cartão é o de hoje; em outros meses, o do último dia do mês
    const hoje = new Date();
    const referenciaCartoes = hoje >= inicioMes && hoje <= fimMes ? hoje : fimMes;

    const [saldo, evolucao, despesasPorCategoria, cartoes, orcamentos, transacoesRecentes, locais] =
      await Promise.all([
        calcularSaldo(mes, ano),
        calcularEvolucao(mes, ano),
        calcularDespesasPorCategoria(inicioMes, fimMes),
        calcularCartoes(referenciaCartoes),
        calcularOrcamentos(mes, ano),
        calcularTransacoesRecentes(fimMes),
        calcularLocais(inicioMes, fimMes)
      ]);

    const response: ApiResponse<DashboardFinanceiro> = {
      success: true,
      data: { saldo, evolucao, despesasPorCategoria, cartoes, orcamentos, transacoesRecentes, locais }
    };
    res.json(response);
  } catch (error: any) {
    responderErro(res, 500, error.message);
  }
};
