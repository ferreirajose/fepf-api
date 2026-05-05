import { Router } from 'express';
import { body, param, query } from 'express-validator';
import multer from 'multer';
import { validate } from '../middlewares/validator';
import {
  enviarMensagem,
  obterHistorico,
  limparHistorico,
  obterContextoFinanceiro
} from '../controllers/chatbot.controller';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimetypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];

    if (allowedMimetypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Apenas PDF, XLS, XLSX, PNG, JPG e JPEG são aceitos.'));
    }
  }
});

router.post(
  '/message',
  upload.array('files', 5),
  [
    body('sessionId')
      .trim()
      .notEmpty()
      .withMessage('SessionId é obrigatório')
      .isLength({ min: 10 })
      .withMessage('SessionId deve ter no mínimo 10 caracteres'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Mensagem é obrigatória')
      .isLength({ max: 5000 })
      .withMessage('Mensagem não pode ter mais de 5000 caracteres'),
    body('provider')
      .optional()
      .isIn(['deepseek', 'chatgpt', 'gemini'])
      .withMessage('Provider deve ser deepseek, chatgpt ou gemini'),
    body('model')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Nome do modelo não pode ter mais de 100 caracteres')
  ],
  validate,
  enviarMensagem
);

router.get(
  '/history/:sessionId',
  [
    param('sessionId')
      .trim()
      .notEmpty()
      .withMessage('SessionId é obrigatório'),
    query('limite')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve ser entre 1 e 100')
  ],
  validate,
  obterHistorico
);

router.delete(
  '/history/:sessionId',
  param('sessionId')
    .trim()
    .notEmpty()
    .withMessage('SessionId é obrigatório'),
  validate,
  limparHistorico
);

router.get(
  '/context',
  [
    query('dataInicio')
      .optional()
      .isISO8601()
      .withMessage('Data de início inválida'),
    query('dataFim')
      .optional()
      .isISO8601()
      .withMessage('Data de fim inválida'),
    query('limite')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve ser entre 1 e 100')
  ],
  validate,
  obterContextoFinanceiro
);

export default router;
