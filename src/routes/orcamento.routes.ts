import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middlewares/validator';
import {
  listarOrcamentos,
  buscarOrcamentoPorId,
  criarOrcamento,
  atualizarOrcamento,
  deletarOrcamento
} from '../controllers/orcamento.controller';

const router = Router();

router.get('/', listarOrcamentos);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  validate,
  buscarOrcamentoPorId
);

router.post(
  '/',
  [
    body('categoriaId')
      .isMongoId()
      .withMessage('ID da categoria inválido'),
    body('valor')
      .isFloat({ min: 0 })
      .withMessage('Valor deve ser maior ou igual a zero'),
    body('mes')
      .isInt({ min: 1, max: 12 })
      .withMessage('Mês deve estar entre 1 e 12'),
    body('ano')
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Ano deve estar entre 2000 e 2100'),
    body('observacoes')
      .optional()
      .trim()
  ],
  validate,
  criarOrcamento
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('ID inválido'),
    body('categoriaId')
      .optional()
      .isMongoId()
      .withMessage('ID da categoria inválido'),
    body('valor')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Valor deve ser maior ou igual a zero'),
    body('mes')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('Mês deve estar entre 1 e 12'),
    body('ano')
      .optional()
      .isInt({ min: 2000, max: 2100 })
      .withMessage('Ano deve estar entre 2000 e 2100')
  ],
  validate,
  atualizarOrcamento
);

router.delete(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  validate,
  deletarOrcamento
);

export default router;
