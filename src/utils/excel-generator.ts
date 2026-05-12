import * as XLSX from 'xlsx';

interface DespesaData {
  descricao: string;
  valor: number;
  data: Date;
  categoria: string;
  cartao?: string;
  recorrente: boolean;
  observacoes?: string;
}

interface ReceitaData {
  descricao: string;
  valor: number;
  data: Date;
  categoria: string;
  recorrente: boolean;
  observacoes?: string;
}

export const generateDespesasExcel = (despesas: any[]): Buffer => {
  const data: DespesaData[] = despesas.map(despesa => ({
    descricao: despesa.descricao,
    valor: despesa.valor,
    data: new Date(despesa.data),
    categoria: despesa.categoriaId?.nome || '',
    cartao: despesa.cartaoId?.nome || '',
    recorrente: despesa.recorrente,
    observacoes: despesa.observacoes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 30 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
    { wch: 40 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Despesas');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

export const generateReceitasExcel = (receitas: any[]): Buffer => {
  const data: ReceitaData[] = receitas.map(receita => ({
    descricao: receita.descricao,
    valor: receita.valor,
    data: new Date(receita.data),
    categoria: receita.categoriaId?.nome || '',
    recorrente: receita.recorrente,
    observacoes: receita.observacoes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 30 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 12 },
    { wch: 40 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Receitas');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

interface CategoriaData {
  nome: string;
  tipo: string;
  cor: string;
  icone: string;
  ativo: boolean;
  subcategorias: string;
}

export const generateCategoriasExcel = (categorias: any[]): Buffer => {
  const data: CategoriaData[] = categorias.map(categoria => ({
    nome: categoria.nome,
    tipo: categoria.tipo || '',
    cor: categoria.cor || '',
    icone: categoria.icone || '',
    ativo: categoria.ativo,
    subcategorias: categoria.subcategorias && categoria.subcategorias.length > 0
      ? categoria.subcategorias
          .filter((sub: any) => sub.ativo)
          .map((sub: any) => sub.nome)
          .join('; ')
      : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 25 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 10 },
    { wch: 50 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Categorias');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};
