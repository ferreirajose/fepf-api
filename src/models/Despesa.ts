import mongoose, { Schema, Document } from 'mongoose';

export interface IDespesa extends Document {
  descricao: string;
  valor: number;
  data: Date;
  categoriaId: mongoose.Types.ObjectId;
  cartaoId?: mongoose.Types.ObjectId;
  recorrente: boolean;
  observacoes?: string;
}

const DespesaSchema = new Schema<IDespesa>(
  {
    descricao: {
      type: String,
      required: [true, 'Descrição é obrigatória'],
      trim: true,
      maxlength: [200, 'Descrição não pode ter mais de 200 caracteres']
    },
    valor: {
      type: Number,
      required: [true, 'Valor é obrigatório'],
      min: [0.01, 'Valor deve ser maior que zero']
    },
    data: {
      type: Date,
      required: [true, 'Data é obrigatória']
    },
    categoriaId: {
      type: Schema.Types.ObjectId,
      ref: 'Categoria',
      required: [true, 'Categoria é obrigatória']
    },
    cartaoId: {
      type: Schema.Types.ObjectId,
      ref: 'Cartao'
    },
    recorrente: {
      type: Boolean,
      default: false
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

DespesaSchema.index({ data: 1 });
DespesaSchema.index({ categoriaId: 1 });
DespesaSchema.index({ cartaoId: 1 });

export default mongoose.model<IDespesa>('Despesa', DespesaSchema);
