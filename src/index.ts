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

// CORS configuration for multiple origins
const allowedOrigins = [
  'http://localhost:4200',
  'https://fepf.vercel.app',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
      console.log(`📡 CORS habilitado para: ${allowedOrigins.join(', ')}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

export default app;
