import mongoose, { Schema, Document } from 'mongoose';
import { TipoCategoria, SubcategoriaType } from '../types';

export interface ICategoria extends Document {
  nome: string;
  tipo?: TipoCategoria;
  cor?: string;
  icone?: string;
  subcategorias?: SubcategoriaType[];
  ativo: boolean;
  dataCriacao: Date;
}

const SubcategoriaSchema = new Schema<SubcategoriaType>(
  {
    id: {
      type: String,
      required: true
    },
    nome: {
      type: String,
      required: [true, 'Nome da subcategoria é obrigatório'],
      trim: true
    },
    categoriaId: {
      type: String,
      required: true
    },
    ativo: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const CategoriaSchema = new Schema<ICategoria>(
  {
    nome: {
      type: String,
      required: [true, 'Nome da categoria é obrigatório'],
      trim: true,
      maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
    },
    tipo: {
      type: String,
      required: false,
      enum: {
        values: ['receita', 'despesa'],
        message: '{VALUE} não é um tipo válido'
      }
    },
    cor: {
      type: String,
      trim: true,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (#RRGGBB)']
    },
    icone: {
      type: String,
      trim: true
    },
    subcategorias: {
      type: [SubcategoriaSchema],
      default: []
    },
    ativo: {
      type: Boolean,
      default: true
    },
    dataCriacao: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<ICategoria>('Categoria', CategoriaSchema);
