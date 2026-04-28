import mongoose, { Schema, Document } from 'mongoose';

export interface IOrcamento extends Document {
  categoriaId: mongoose.Types.ObjectId;
  valor: number;
  mes: number;
  ano: number;
  observacoes?: string;
}

const OrcamentoSchema = new Schema<IOrcamento>(
  {
    categoriaId: {
      type: Schema.Types.ObjectId,
      ref: 'Categoria',
      required: [true, 'Categoria é obrigatória']
    },
    valor: {
      type: Number,
      required: [true, 'Valor é obrigatório'],
      min: [0, 'Valor não pode ser negativo']
    },
    mes: {
      type: Number,
      required: [true, 'Mês é obrigatório'],
      min: [1, 'Mês deve estar entre 1 e 12'],
      max: [12, 'Mês deve estar entre 1 e 12']
    },
    ano: {
      type: Number,
      required: [true, 'Ano é obrigatório'],
      min: [2000, 'Ano deve ser maior ou igual a 2000'],
      max: [2100, 'Ano deve ser menor ou igual a 2100']
    },
    observacoes: {
      type: String,
      trim: true,
      maxlength: [500, 'Observações não podem ter mais de 500 caracteres']
    }
  },
  {
    timestamps: true
  }
);

OrcamentoSchema.index({ categoriaId: 1, mes: 1, ano: 1 }, { unique: true });

export default mongoose.model<IOrcamento>('Orcamento', OrcamentoSchema);
