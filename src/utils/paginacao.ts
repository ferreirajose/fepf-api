import { Request } from 'express';
import { Paginacao } from '../types';

const LIMITE_MAXIMO = 200;

// Paginação opcional: só é aplicada quando `limit` é informado na query
export const lerPaginacao = (req: Request): { page: number; limit: number; skip: number } | null => {
  if (req.query.limit === undefined) return null;

  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), LIMITE_MAXIMO);
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);

  return { page, limit, skip: (page - 1) * limit };
};

export const montarPaginacao = (page: number, limit: number, total: number): Paginacao => ({
  page,
  limit,
  total,
  totalPaginas: Math.ceil(total / limit)
});
