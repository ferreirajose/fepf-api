import mongoose, { Schema, Document } from 'mongoose';
import { TipoConta, Banco } from '../types';

export interface IConta extends Document {
  nome: string;
  tipoConta: TipoConta;
  banco: Banco;
  subTipoConta?: string;
  saldoInicial: number;
  saldoAtual: number;
  ativo: boolean;
}

const ContaSchema = new Schema<IConta>(
  {
    nome: {
      type: String,
      required: [true, 'Nome da conta é obrigatório'],
      trim: true,
      maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
    },
    tipoConta: {
      type: String,
      required: [true, 'Tipo de conta é obrigatório'],
      enum: {
        values: ['conta_corrente', 'poupanca', 'investimentos', 'conta_beneficios'],
        message: '{VALUE} não é um tipo válido'
      }
    },
    banco: {
      type: String,
      enum: {
        values: ['inter', 'bradesco', 'itau', 'caixa', 'nubank', 'santander', 'pan'],
        message: '{VALUE} não é um banco válido'
      },
      validate: {
        validator: function(this: IConta) {
          if (['conta_corrente', 'poupanca', 'investimentos'].includes(this.tipoConta) && !this.banco) {
            return false;
          }
          return true;
        },
        message: 'Banco é obrigatório para este tipo de conta'
      }
    },
    subTipoConta: {
      type: String,
      trim: true,
      maxlength: [50, 'Subtipo não pode ter mais de 50 caracteres'],
      validate: {
        validator: function(this: IConta, value: string | undefined) {
          if (value && this.tipoConta !== 'conta_beneficios') {
            return false;
          }
          return true;
        },
        message: 'Subtipo só pode ser informado para Conta Benefícios'
      }
    },
    saldoInicial: {
      type: Number,
      required: [true, 'Saldo inicial é obrigatório'],
      default: 0
    },
    saldoAtual: {
      type: Number,
      default: 0
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

ContaSchema.index({ nome: 1 });
ContaSchema.index({ ativo: 1 });

export default mongoose.model<IConta>('Conta', ContaSchema);
