import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middlewares/validator';
import {
  listarContas,
  buscarContaPorId,
  criarConta,
  atualizarConta,
  deletarConta,
  calcularSaldoAtual
} from '../controllers/conta.controller';

const router = Router();

router.get('/', listarContas);

router.get(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  validate,
  buscarContaPorId
);

router.get(
  '/:id/saldo',
  param('id').isMongoId().withMessage('ID inválido'),
  validate,
  calcularSaldoAtual
);

router.post(
  '/',
  [
    body('nome').trim().notEmpty().withMessage('Nome da conta é obrigatório'),
    body('tipoConta')
      .isIn(['conta_corrente', 'poupanca', 'investimentos', 'conta_beneficios'])
      .withMessage('Tipo de conta inválido'),
    body('banco')
      .custom((value, { req }) => {
        const tipo = req.body.tipoConta;

        // Se for conta_beneficios, banco deve ser null ou undefined
        if (tipo === 'conta_beneficios') {
          if (value !== null && value !== undefined && value !== '') {
            throw new Error('Conta Benefícios não deve ter banco associado');
          }
          return true;
        }

        // Para outros tipos, banco é obrigatório
        if (['conta_corrente', 'poupanca', 'investimentos'].includes(tipo)) {
          if (!value || value === null || value === '') {
            throw new Error('Banco é obrigatório para este tipo de conta');
          }
        }

        // Validar se o banco está na lista de valores permitidos
        const bancosValidos = ['inter', 'bradesco', 'itau', 'caixa', 'nubank', 'santander', 'pan'];
        if (value && !bancosValidos.includes(value)) {
          throw new Error('Banco inválido');
        }

        return true;
      }),
    body('subTipoConta')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Subtipo não pode ser vazio')
      .custom((value, { req }) => {
        if (value && req.body.tipoConta !== 'conta_beneficios') {
          throw new Error('Subtipo só pode ser informado para Conta Benefícios');
        }
        return true;
      }),
    body('saldoInicial')
      .isFloat()
      .withMessage('Saldo inicial deve ser um número')
  ],
  validate,
  criarConta
);

router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('ID inválido'),
    body('nome').optional().trim().notEmpty().withMessage('Nome não pode ser vazio'),
    body('tipoConta')
      .optional()
      .isIn(['conta_corrente', 'poupanca', 'investimentos', 'conta_beneficios'])
      .withMessage('Tipo de conta inválido'),
    body('banco')
      .custom((value, { req }) => {
        const tipo = req.body.tipoConta;

        // Se tipo não foi especificado no update, skip validação
        if (!tipo) {
          return true;
        }

        // Se for conta_beneficios, banco deve ser null
        if (tipo === 'conta_beneficios') {
          if (value !== null && value !== undefined && value !== '') {
            throw new Error('Conta Benefícios não deve ter banco associado');
          }
          return true;
        }

        // Para outros tipos (se especificado), banco é obrigatório
        if (['conta_corrente', 'poupanca', 'investimentos'].includes(tipo)) {
          if (!value || value === null || value === '') {
            throw new Error('Banco é obrigatório para este tipo de conta');
          }
        }

        // Validar se o banco está na lista de valores permitidos
        const bancosValidos = ['inter', 'bradesco', 'itau', 'caixa', 'nubank', 'santander', 'pan'];
        if (value && !bancosValidos.includes(value)) {
          throw new Error('Banco inválido');
        }

        return true;
      }),
    body('subTipoConta')
      .optional()
      .trim()
      .custom((value, { req }) => {
        if (value && req.body.tipoConta && req.body.tipoConta !== 'conta_beneficios') {
          throw new Error('Subtipo só pode ser informado para Conta Benefícios');
        }
        return true;
      }),
    body('saldoInicial')
      .optional()
      .isFloat()
      .withMessage('Saldo inicial deve ser um número'),
    body('saldoAtual')
      .optional()
      .isFloat()
      .withMessage('Saldo atual deve ser um número')
  ],
  validate,
  atualizarConta
);

router.delete(
  '/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  validate,
  deletarConta
);

export default router;
