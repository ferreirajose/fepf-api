import { Router } from 'express';
import { obterSaldoAcumulado } from '../controllers/financeiro.controller';

const router = Router();

router.get('/saldo-acumulado', obterSaldoAcumulado);

export default router;
