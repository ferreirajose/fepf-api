export interface SubcategoriaType {
  id: string;
  nome: string;
  icone?: string;
  categoriaId: string;
  ativo: boolean;
}

export type TipoCategoria = 'receita' | 'despesa';
export type BandeiraCartao = 'visa' | 'mastercard' | 'elo' | 'amex' | 'outra';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  paginacao?: Paginacao;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface FilterQuery {
  dataInicio?: string;
  dataFim?: string;
  categoriaId?: string;
  subcategoriaId?: string;
  cartaoId?: string;
  formaPagamento?: string;
}

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

export interface SaldoAcumulado {
  mes: number;
  ano: number;
  saldoAnterior: number;
  receitasMes: number;
  despesasMes: number;
  saldoAtual: number;
}

export interface Paginacao {
  page: number;
  limit: number;
  total: number;
  totalPaginas: number;
}

export interface DashboardEvolucaoMes {
  ano: number;
  mes: number;
  receitas: number;
  despesas: number;
}

export interface DashboardCategoria {
  categoriaId: string | null;
  nome: string;
  cor: string;
  total: number;
  quantidade: number;
}

export interface DashboardCartao {
  _id: string;
  nome: string;
  limite: number;
  utilizado: number;
  disponivel: number;
  percentualUtilizado: number;
  cicloInicio: Date;
  cicloFim: Date;
}

export interface DashboardOrcamento {
  _id: string;
  categoriaNome: string;
  categoriaCor: string;
  valorPlanejado: number;
  valorGasto: number;
  valorRestante: number;
  percentualGasto: number;
}

export interface DashboardTransacao {
  _id: string;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  data: Date;
}

export interface DashboardLocal {
  _id: string;
  descricao: string;
  valor: number;
  data: Date;
  latitude: number;
  longitude: number;
  endereco: string;
  categoriaNome: string;
  categoriaCor: string;
}

export interface DashboardFinanceiro {
  saldo: SaldoAcumulado;
  evolucao: DashboardEvolucaoMes[];
  despesasPorCategoria: DashboardCategoria[];
  cartoes: DashboardCartao[];
  orcamentos: DashboardOrcamento[];
  transacoesRecentes: DashboardTransacao[];
  locais: DashboardLocal[];
}
