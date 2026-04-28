import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middlewares/validator';
import {
  listarDespesas,
  buscarDespesaPorId,
  criarDespesa,
  atualizarDespesa,
  deletarDespesa,
  obterEstatisticas
} from '../controllers/despesa.controller';

const router = Router();

router.get('/', listarDespesas);

router.get('/estatisticas', obterEstatisticas);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  validate,
  buscarDespesaPorId
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
    body('cartaoId')
      .optional()
      .isMongoId()
      .withMessage('ID do cartão inválido'),
    body('recorrente')
      .optional()
      .isBoolean()
      .withMessage('Recorrente deve ser booleano'),
    body('observacoes')
      .optional()
      .trim(),
    body('formaPagamento')
      .optional()
      .isIn(['dinheiro', 'debito', 'credito', 'pix'])
      .withMessage('Forma de pagamento inválida'),
    body('pago')
      .optional()
      .isBoolean()
      .withMessage('Pago deve ser booleano'),
    body('localizacao.latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude deve estar entre -90 e 90'),
    body('localizacao.longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude deve estar entre -180 e 180'),
    body('localizacao.endereco')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Endereço não pode ter mais de 500 caracteres')
  ],
  validate,
  criarDespesa
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
    body('cartaoId')
      .optional()
      .isMongoId()
      .withMessage('ID do cartão inválido'),
    body('recorrente')
      .optional()
      .isBoolean()
      .withMessage('Recorrente deve ser booleano'),
    body('formaPagamento')
      .optional()
      .isIn(['dinheiro', 'debito', 'credito', 'pix'])
      .withMessage('Forma de pagamento inválida'),
    body('pago')
      .optional()
      .isBoolean()
      .withMessage('Pago deve ser booleano'),
    body('localizacao.latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude deve estar entre -90 e 90'),
    body('localizacao.longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude deve estar entre -180 e 180'),
    body('localizacao.endereco')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Endereço não pode ter mais de 500 caracteres')
  ],
  validate,
  atualizarDespesa
);

router.delete(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  validate,
  deletarDespesa
);

export default router;
