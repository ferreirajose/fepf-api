import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e: any) => e.message);
    const response: ApiResponse = {
      success: false,
      error: 'Erro de validação',
      details: errors
    };
    res.status(400).json(response);
    return;
  }

  if (err.name === 'CastError') {
    const response: ApiResponse = {
      success: false,
      error: 'ID inválido',
      details: err.message
    };
    res.status(400).json(response);
    return;
  }

  if (err.code === 11000) {
    const response: ApiResponse = {
      success: false,
      error: 'Registro duplicado',
      details: 'Este registro já existe no sistema'
    };
    res.status(409).json(response);
    return;
  }

  const response: ApiResponse = {
    success: false,
    error: err.message || 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };

  res.status(err.statusCode || 500).json(response);
};

export const notFound = (_req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: 'Rota não encontrada'
  };
  res.status(404).json(response);
};
