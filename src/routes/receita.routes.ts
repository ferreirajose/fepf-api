import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middlewares/validator';
import {
  listarReceitas,
  buscarReceitaPorId,
  criarReceita,
  atualizarReceita,
  deletarReceita,
  obterEstatisticas
} from '../controllers/receita.controller';

const router = Router();

router.get('/', listarReceitas);

router.get('/estatisticas', obterEstatisticas);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  validate,
  buscarReceitaPorId
);

router.post(
  '/',
  [
    body('descricao').trim().notEmpty().withMessage('Descrição é obrigatória'),
    body('valor')
      .isFloat({ min: 0.01 })
      .withMessage('Valor deve ser maior que zero'),
    body('data')
      .isISO8601()
      .withMessage('Data inválida'),
    body('categoriaId')
      .isMongoId()
      .withMessage('ID da categoria inválido'),
    body('recorrente')
      .optional()
      .isBoolean()
      .withMessage('Recorrente deve ser booleano'),
    body('observacoes')
      .optional()
      .trim()
  ],
  validate,
  criarReceita
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('ID inválido'),
    body('descricao').optional().trim().notEmpty().withMessage('Descrição não pode ser vazia'),
    body('valor')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Valor deve ser maior que zero'),
    body('data')
      .optional()
      .isISO8601()
      .withMessage('Data inválida'),
    body('categoriaId')
      .optional()
      .isMongoId()
      .withMessage('ID da categoria inválido'),
    body('recorrente')
      .optional()
      .isBoolean()
      .withMessage('Recorrente deve ser booleano')
  ],
  validate,
  atualizarReceita
);

router.delete(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  validate,
  deletarReceita
);

export default router;
