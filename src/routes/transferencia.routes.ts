import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middlewares/validator';
import {
  listarTransferencias,
  buscarTransferenciaPorId,
  criarTransferencia,
  atualizarTransferencia,
  deletarTransferencia
} from '../controllers/transferencia.controller';

const router = Router();

router.get('/', listarTransferencias);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  validate,
  buscarTransferenciaPorId
);

router.post(
  '/',
  [
    body('contaOrigemId')
      .isMongoId()
      .withMessage('ID da conta de origem inválido'),
    body('contaDestinoId')
      .isMongoId()
      .withMessage('ID da conta de destino inválido'),
    body('valor')
      .isFloat({ min: 0.01 })
      .withMessage('Valor deve ser maior que zero'),
    body('data')
      .isISO8601()
      .withMessage('Data inválida'),
    body('descricao')
      .trim()
      .notEmpty()
      .withMessage('Descrição é obrigatória')
  ],
  validate,
  criarTransferencia
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('ID inválido'),
    body('contaOrigemId')
      .optional()
      .isMongoId()
      .withMessage('ID da conta de origem inválido'),
    body('contaDestinoId')
      .optional()
      .isMongoId()
      .withMessage('ID da conta de destino inválido'),
    body('valor')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('Valor deve ser maior que zero'),
    body('data')
      .optional()
      .isISO8601()
      .withMessage('Data inválida'),
    body('descricao')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Descrição não pode ser vazia')
  ],
  validate,
  atualizarTransferencia
);

router.delete(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  validate,
  deletarTransferencia
);

export default router;
