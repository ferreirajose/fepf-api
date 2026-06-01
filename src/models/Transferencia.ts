import mongoose, { Schema, Document } from 'mongoose';

export interface ITransferencia extends Document {
  contaOrigemId: mongoose.Types.ObjectId;
  contaDestinoId: mongoose.Types.ObjectId;
  valor: number;
  data: Date;
  descricao: string;
  ativo: boolean;
}

const TransferenciaSchema = new Schema<ITransferencia>(
  {
    contaOrigemId: {
      type: Schema.Types.ObjectId,
      ref: 'Conta',
      required: [true, 'Conta de origem é obrigatória']
    },
    contaDestinoId: {
      type: Schema.Types.ObjectId,
      ref: 'Conta',
      required: [true, 'Conta de destino é obrigatória']
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
    descricao: {
      type: String,
      required: [true, 'Descrição é obrigatória'],
      trim: true,
      maxlength: [200, 'Descrição não pode ter mais de 200 caracteres']
    },
    ativo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

TransferenciaSchema.index({ contaOrigemId: 1 });
TransferenciaSchema.index({ contaDestinoId: 1 });
TransferenciaSchema.index({ data: 1 });
TransferenciaSchema.index({ ativo: 1 });

export default mongoose.model<ITransferencia>('Transferencia', TransferenciaSchema);
