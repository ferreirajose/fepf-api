import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middlewares/validator';
import {
  listarCategorias,
  buscarCategoriaPorId,
  criarCategoria,
  atualizarCategoria,
  deletarCategoria,
  adicionarSubcategoria,
  atualizarSubcategoria,
  deletarSubcategoria
} from '../controllers/categoria.controller';

const router = Router();

router.get('/', listarCategorias);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  validate,
  buscarCategoriaPorId
);

router.post(
  '/',
  [
    body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('tipo')
      .isIn(['receita', 'despesa'])
      .withMessage('Tipo deve ser "receita" ou "despesa"'),
    body('cor')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Cor deve estar no formato hexadecimal (#RRGGBB)'),
    body('icone').optional().trim()
  ],
  validate,
  criarCategoria
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('ID inválido'),
    body('nome').optional().trim().notEmpty().withMessage('Nome não pode ser vazio'),
    body('tipo')
      .optional()
      .isIn(['receita', 'despesa'])
      .withMessage('Tipo deve ser "receita" ou "despesa"'),
    body('cor')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Cor deve estar no formato hexadecimal (#RRGGBB)')
  ],
  validate,
  atualizarCategoria
);

router.delete(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  validate,
  deletarCategoria
);

router.post(
  '/:id/subcategorias',
  [
    param('id').isMongoId().withMessage('ID inválido'),
    body('nome').trim().notEmpty().withMessage('Nome da subcategoria é obrigatório')
  ],
  validate,
  adicionarSubcategoria
);

router.put(
  '/:categoriaId/subcategorias/:subcategoriaId',
  [
    param('categoriaId').isMongoId().withMessage('ID da categoria inválido'),
    param('subcategoriaId').notEmpty().withMessage('ID da subcategoria é obrigatório'),
    body('nome').optional().trim().notEmpty().withMessage('Nome não pode ser vazio'),
    body('ativo').optional().isBoolean().withMessage('Ativo deve ser booleano')
  ],
  validate,
  atualizarSubcategoria
);

router.delete(
  '/:categoriaId/subcategorias/:subcategoriaId',
  [
    param('categoriaId').isMongoId().withMessage('ID da categoria inválido'),
    param('subcategoriaId').notEmpty().withMessage('ID da subcategoria é obrigatório')
  ],
  validate,
  deletarSubcategoria
);

export default router;
