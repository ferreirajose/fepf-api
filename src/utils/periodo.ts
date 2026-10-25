// As datas das transações são gravadas à meia-noite UTC (ex.: '2026-10-25' -> 2026-10-25T00:00:00Z),
// então os limites de período também são calculados em UTC, independente do fuso do servidor.

const UM_DIA_MS = 24 * 60 * 60 * 1000;

export const inicioMesUTC = (ano: number, mes: number): Date =>
  new Date(Date.UTC(ano, mes - 1, 1));

export const fimMesUTC = (ano: number, mes: number): Date =>
  new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

const diasNoMes = (ano: number, mes: number): number =>
  new Date(Date.UTC(ano, mes, 0)).getUTCDate();

// Data de fechamento da fatura em um mês (dia 31 vira o último dia do mês quando necessário)
const fechamentoNoMes = (ano: number, mes: number, diaFechamento: number): Date => {
  const data = new Date(Date.UTC(ano, mes - 1, 1));
  const anoNormalizado = data.getUTCFullYear();
  const mesNormalizado = data.getUTCMonth() + 1;
  const dia = Math.min(diaFechamento, diasNoMes(anoNormalizado, mesNormalizado));
  return new Date(Date.UTC(anoNormalizado, mesNormalizado - 1, dia));
};

export interface CicloFatura {
  inicio: Date; // inclusivo
  fim: Date;    // exclusivo (dia do fechamento)
}

// Ciclo da fatura que contém a data de referência.
// Compras feitas no dia do fechamento entram na fatura seguinte.
export const cicloFatura = (diaFechamento: number, referencia: Date): CicloFatura => {
  const ano = referencia.getUTCFullYear();
  const mes = referencia.getUTCMonth() + 1;
  const dataRef = new Date(Date.UTC(ano, mes - 1, referencia.getUTCDate()));
  const fechamentoMes = fechamentoNoMes(ano, mes, diaFechamento);

  if (dataRef < fechamentoMes) {
    return { inicio: fechamentoNoMes(ano, mes - 1, diaFechamento), fim: fechamentoMes };
  }
  return { inicio: fechamentoMes, fim: fechamentoNoMes(ano, mes + 1, diaFechamento) };
};

export const diaAnterior = (data: Date): Date => new Date(data.getTime() - UM_DIA_MS);
