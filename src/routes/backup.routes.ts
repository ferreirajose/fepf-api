import { Router } from 'express';
import { gerarBackup, restaurarBackup } from '../controllers/backup.controller';

const router = Router();

router.get('/', gerarBackup);
router.post('/restaurar', restaurarBackup);

export default router;
