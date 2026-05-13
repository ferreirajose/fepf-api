import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Despesa from '../models/Despesa';
import Receita from '../models/Receita';
import Categoria from '../models/Categoria';
import Cartao from '../models/Cartao';
import Orcamento from '../models/Orcamento';

dotenv.config({ path: '.env.local' });

const limparDatabase = async () => {
  try {
    console.log('🔗 Conectando ao MongoDB...');

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI não encontrada no .env.local');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Conectado ao MongoDB');

    console.log('\n⚠️  LIMPANDO TODAS AS COLEÇÕES...\n');

    // Deletar todas as coleções
    const resultados = await Promise.all([
      Despesa.deleteMany({}),
      Receita.deleteMany({}),
      Categoria.deleteMany({}),
      Cartao.deleteMany({}),
      Orcamento.deleteMany({})
    ]);

    console.log('📊 Resultados da limpeza:');
    console.log(`   - Despesas removidas: ${resultados[0].deletedCount}`);
    console.log(`   - Receitas removidas: ${resultados[1].deletedCount}`);
    console.log(`   - Categorias removidas: ${resultados[2].deletedCount}`);
    console.log(`   - Cartões removidos: ${resultados[3].deletedCount}`);
    console.log(`   - Orçamentos removidos: ${resultados[4].deletedCount}`);

    const totalRemovido = resultados.reduce((acc, r) => acc + r.deletedCount, 0);
    console.log(`\n✅ Total de ${totalRemovido} registros removidos com sucesso!`);

    await mongoose.connection.close();
    console.log('🔌 Desconectado do MongoDB');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao limpar database:', error);
    process.exit(1);
  }
};

limparDatabase();
