import { Router } from 'express';
import { obterSaldoAcumulado, obterDashboard } from '../controllers/financeiro.controller';

const router = Router();

router.get('/saldo-acumulado', obterSaldoAcumulado);
router.get('/dashboard', obterDashboard);

export default router;
