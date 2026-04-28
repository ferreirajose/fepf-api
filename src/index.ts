import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { errorHandler, notFound } from './middlewares/error-handler';

import categoriaRoutes from './routes/categoria.routes';
import despesaRoutes from './routes/despesa.routes';
import receitaRoutes from './routes/receita.routes';
import cartaoRoutes from './routes/cartao.routes';
import orcamentoRoutes from './routes/orcamento.routes';
import importExportRoutes from './routes/import-export.routes';

dotenv.config({ path: '.env.local' });

const app: Application = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'FePF API'
  });
});

app.use('/api/categorias', categoriaRoutes);
app.use('/api/despesas', despesaRoutes);
app.use('/api/receitas', receitaRoutes);
app.use('/api/cartoes', cartaoRoutes);
app.use('/api/orcamentos', orcamentoRoutes);
app.use('/api', importExportRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📡 CORS habilitado para: ${CORS_ORIGIN}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;
