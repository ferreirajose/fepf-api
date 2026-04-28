import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middlewares/validator';
import {
  listarCartoes,
  buscarCartaoPorId,
  criarCartao,
  atualizarCartao,
  deletarCartao
} from '../controllers/cartao.controller';

const router = Router();

router.get('/', listarCartoes);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  validate,
  buscarCartaoPorId
);

router.post(
  '/',
  [
    body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('bandeira')
      .isIn(['visa', 'mastercard', 'elo', 'amex', 'outra'])
      .withMessage('Bandeira inválida'),
    body('limite')
      .isFloat({ min: 0 })
      .withMessage('Limite deve ser maior ou igual a zero'),
    body('diaVencimento')
      .isInt({ min: 1, max: 31 })
      .withMessage('Dia de vencimento deve estar entre 1 e 31'),
    body('diaFechamento')
      .isInt({ min: 1, max: 31 })
      .withMessage('Dia de fechamento deve estar entre 1 e 31')
  ],
  validate,
  criarCartao
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('ID inválido'),
    body('nome').optional().trim().notEmpty().withMessage('Nome não pode ser vazio'),
    body('bandeira')
      .optional()
      .isIn(['visa', 'mastercard', 'elo', 'amex', 'outra'])
      .withMessage('Bandeira inválida'),
    body('limite')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Limite deve ser maior ou igual a zero'),
    body('diaVencimento')
      .optional()
      .isInt({ min: 1, max: 31 })
      .withMessage('Dia de vencimento deve estar entre 1 e 31'),
    body('diaFechamento')
      .optional()
      .isInt({ min: 1, max: 31 })
      .withMessage('Dia de fechamento deve estar entre 1 e 31')
  ],
  validate,
  atualizarCartao
);

router.delete(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  validate,
  deletarCartao
);

export default router;
