import { Router } from 'express';
import multer from 'multer';
import {
  importarDespesas,
  importarReceitas,
  exportarDespesas,
  exportarReceitas
} from '../controllers/import-export.controller';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos Excel (.xlsx, .xls) são permitidos'));
    }
  }
});

router.post('/import/despesas', upload.single('file'), importarDespesas);

router.post('/import/receitas', upload.single('file'), importarReceitas);

router.get('/export/despesas', exportarDespesas);

router.get('/export/receitas', exportarReceitas);

export default router;
