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
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface FilterQuery {
  dataInicio?: string;
  dataFim?: string;
  categoriaId?: string;
  cartaoId?: string;
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
