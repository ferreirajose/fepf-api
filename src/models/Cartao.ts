import mongoose, { Schema, Document } from 'mongoose';
import { BandeiraCartao } from '../types';

export interface ICartao extends Document {
  nome: string;
  bandeira: BandeiraCartao;
  dono?: string;
  limite: number;
  diaVencimento: number;
  diaFechamento: number;
  ativo: boolean;
}

const CartaoSchema = new Schema<ICartao>(
  {
    nome: {
      type: String,
      required: [true, 'Nome do cartão é obrigatório'],
      trim: true,
      maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
    },
    bandeira: {
      type: String,
      required: [true, 'Bandeira é obrigatória'],
      enum: {
        values: ['visa', 'mastercard', 'elo', 'amex', 'outra'],
        message: '{VALUE} não é uma bandeira válida'
      }
    },
    dono: {
      type: String,
      trim: true,
      maxlength: [100, 'Nome do dono não pode ter mais de 100 caracteres']
    },
    limite: {
      type: Number,
      required: [true, 'Limite é obrigatório'],
      min: [0, 'Limite não pode ser negativo']
    },
    diaVencimento: {
      type: Number,
      required: [true, 'Dia de vencimento é obrigatório'],
      min: [1, 'Dia deve estar entre 1 e 31'],
      max: [31, 'Dia deve estar entre 1 e 31']
    },
    diaFechamento: {
      type: Number,
      required: [true, 'Dia de fechamento é obrigatório'],
      min: [1, 'Dia deve estar entre 1 e 31'],
      max: [31, 'Dia deve estar entre 1 e 31']
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

export default mongoose.model<ICartao>('Cartao', CartaoSchema);
