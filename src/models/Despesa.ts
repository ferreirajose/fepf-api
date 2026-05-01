import mongoose, { Schema, Document } from 'mongoose';

interface ILocalizacao {
  latitude?: number;
  longitude?: number;
  endereco?: string;
}

export interface IDespesa extends Document {
  descricao: string;
  valor: number;
  data: Date;
  categoriaId: mongoose.Types.ObjectId;
  subcategoriaId?: string;
  cartaoId?: mongoose.Types.ObjectId;
  recorrente: boolean;
  observacoes?: string;
  formaPagamento?: string;
  pago?: boolean;
  localizacao?: ILocalizacao;
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
    subcategoriaId: {
      type: String,
      required: false
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
    },
    formaPagamento: {
      type: String,
      enum: ['dinheiro', 'debito', 'credito', 'pix'],
      trim: true
    },
    pago: {
      type: Boolean,
      default: false
    },
    localizacao: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude deve estar entre -90 e 90'],
        max: [90, 'Latitude deve estar entre -90 e 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude deve estar entre -180 e 180'],
        max: [180, 'Longitude deve estar entre -180 e 180']
      },
      endereco: {
        type: String,
        trim: true,
        maxlength: [500, 'Endereço não pode ter mais de 500 caracteres']
      }
    }
  },
  {
    timestamps: true
  }
);

DespesaSchema.index({ data: 1 });
DespesaSchema.index({ categoriaId: 1 });
DespesaSchema.index({ cartaoId: 1 });
DespesaSchema.index({ 'localizacao.latitude': 1, 'localizacao.longitude': 1 });

export default mongoose.model<IDespesa>('Despesa', DespesaSchema);
