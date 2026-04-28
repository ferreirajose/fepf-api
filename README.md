# FePF API - Backend

API REST para o sistema de gestão financeira pessoal FePF (Financial Personal Finance).

## Tecnologias

- **Node.js** - Runtime JavaScript
- **TypeScript** - Superset tipado do JavaScript
- **Express** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **Express Validator** - Validação de requisições
- **XLSX** - Manipulação de arquivos Excel
- **Multer** - Upload de arquivos

## Requisitos

- Node.js 18+
- MongoDB 6+ (local ou Atlas)
- npm ou yarn

## Instalação

```bash
# Clonar repositório (se aplicável)
git clone <url-do-repositorio>

# Entrar no diretório
cd fepf-api

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env.local

# Editar variáveis de ambiente
nano .env.local
```

## Variáveis de Ambiente

Edite o arquivo `.env.local`:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/fepf
CORS_ORIGIN=http://localhost:4200
```

Para produção na Vercel, configure as seguintes variáveis no dashboard:

- `MONGODB_URI` - Connection string do MongoDB Atlas
- `NODE_ENV` - production
- `CORS_ORIGIN` - URL do front-end deployado

## Scripts

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Build para produção
npm run build

# Iniciar servidor de produção
npm start
```

## Estrutura do Projeto

```
fepf-api/
├── src/
│   ├── config/
│   │   └── database.ts          # Configuração MongoDB
│   ├── models/
│   │   ├── Categoria.ts         # Schema de categorias
│   │   ├── Despesa.ts           # Schema de despesas
│   │   ├── Receita.ts           # Schema de receitas
│   │   ├── Cartao.ts            # Schema de cartões
│   │   └── Orcamento.ts         # Schema de orçamentos
│   ├── controllers/
│   │   ├── categoria.controller.ts
│   │   ├── despesa.controller.ts
│   │   ├── receita.controller.ts
│   │   ├── cartao.controller.ts
│   │   ├── orcamento.controller.ts
│   │   └── import-export.controller.ts
│   ├── routes/
│   │   ├── categoria.routes.ts
│   │   ├── despesa.routes.ts
│   │   ├── receita.routes.ts
│   │   ├── cartao.routes.ts
│   │   ├── orcamento.routes.ts
│   │   └── import-export.routes.ts
│   ├── middlewares/
│   │   ├── error-handler.ts    # Tratamento de erros
│   │   └── validator.ts        # Validação de requisições
│   ├── utils/
│   │   ├── excel-parser.ts     # Parser de Excel
│   │   └── excel-generator.ts  # Gerador de Excel
│   ├── types/
│   │   └── index.ts            # Tipos TypeScript
│   └── index.ts                # Entry point
├── .env.example
├── .env.local
├── .gitignore
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```

## API Endpoints

### Health Check

```
GET /health
```

Retorna o status da API.

### Categorias

```
GET    /api/categorias              # Listar todas
GET    /api/categorias/:id          # Buscar por ID
POST   /api/categorias              # Criar nova
PUT    /api/categorias/:id          # Atualizar
DELETE /api/categorias/:id          # Deletar (soft delete)

POST   /api/categorias/:id/subcategorias                           # Adicionar subcategoria
PUT    /api/categorias/:categoriaId/subcategorias/:subcategoriaId  # Atualizar subcategoria
DELETE /api/categorias/:categoriaId/subcategorias/:subcategoriaId  # Remover subcategoria
```

**Exemplo de criação:**
```json
{
  "nome": "Alimentação",
  "tipo": "despesa",
  "cor": "#FF5733",
  "icone": "utensils"
}
```

### Despesas

```
GET    /api/despesas                # Listar (com filtros)
GET    /api/despesas/:id            # Buscar por ID
POST   /api/despesas                # Criar nova
PUT    /api/despesas/:id            # Atualizar
DELETE /api/despesas/:id            # Deletar
GET    /api/despesas/estatisticas   # Obter estatísticas
```

**Filtros disponíveis (query params):**
- `dataInicio` - Data inicial (ISO 8601)
- `dataFim` - Data final (ISO 8601)
- `categoriaId` - ID da categoria
- `cartaoId` - ID do cartão

**Exemplo de criação:**
```json
{
  "descricao": "Compra no supermercado",
  "valor": 150.50,
  "data": "2026-04-28T00:00:00.000Z",
  "categoriaId": "60d5ec49f1b2c72b8c8e4f1a",
  "cartaoId": "60d5ec49f1b2c72b8c8e4f1b",
  "recorrente": false,
  "observacoes": "Compras do mês"
}
```

### Receitas

```
GET    /api/receitas                # Listar (com filtros)
GET    /api/receitas/:id            # Buscar por ID
POST   /api/receitas                # Criar nova
PUT    /api/receitas/:id            # Atualizar
DELETE /api/receitas/:id            # Deletar
GET    /api/receitas/estatisticas   # Obter estatísticas
```

**Filtros disponíveis (query params):**
- `dataInicio` - Data inicial (ISO 8601)
- `dataFim` - Data final (ISO 8601)
- `categoriaId` - ID da categoria

**Exemplo de criação:**
```json
{
  "descricao": "Salário",
  "valor": 5000.00,
  "data": "2026-04-01T00:00:00.000Z",
  "categoriaId": "60d5ec49f1b2c72b8c8e4f1a",
  "recorrente": true
}
```

### Cartões de Crédito

```
GET    /api/cartoes              # Listar todos
GET    /api/cartoes/:id          # Buscar por ID
POST   /api/cartoes              # Criar novo
PUT    /api/cartoes/:id          # Atualizar
DELETE /api/cartoes/:id          # Deletar (soft delete)
```

**Exemplo de criação:**
```json
{
  "nome": "Nubank",
  "bandeira": "mastercard",
  "limite": 5000.00,
  "diaVencimento": 10,
  "diaFechamento": 3
}
```

**Bandeiras disponíveis:** `visa`, `mastercard`, `elo`, `amex`, `outra`

### Orçamentos

```
GET    /api/orcamentos           # Listar (com filtros)
GET    /api/orcamentos/:id       # Buscar por ID
POST   /api/orcamentos           # Criar novo
PUT    /api/orcamentos/:id       # Atualizar
DELETE /api/orcamentos/:id       # Deletar
```

**Filtros disponíveis (query params):**
- `mes` - Mês (1-12)
- `ano` - Ano (2000-2100)

**Exemplo de criação:**
```json
{
  "categoriaId": "60d5ec49f1b2c72b8c8e4f1a",
  "valor": 1000.00,
  "mes": 4,
  "ano": 2026,
  "observacoes": "Orçamento mensal"
}
```

### Import/Export

```
POST /api/import/despesas    # Importar despesas (Excel)
POST /api/import/receitas    # Importar receitas (Excel)
GET  /api/export/despesas    # Exportar despesas (Excel)
GET  /api/export/receitas    # Exportar receitas (Excel)
```

**Importação:**
- Enviar arquivo Excel (.xlsx) via form-data
- Campo do formulário: `file`
- Tamanho máximo: 5MB

**Formato Excel esperado (Despesas):**

| descricao | valor | data | categoria | cartao | recorrente | observacoes |
|-----------|-------|------|-----------|--------|------------|-------------|
| Compra    | 100.00| 2026-04-28 | Alimentação | Nubank | false | Obs |

**Formato Excel esperado (Receitas):**

| descricao | valor | data | categoria | recorrente | observacoes |
|-----------|-------|------|-----------|------------|-------------|
| Salário   | 5000.00| 2026-04-01 | Salário | true | Obs |

**Exportação:**
- Retorna arquivo Excel para download
- Aceita mesmos filtros de listagem

## Respostas da API

Todas as respostas seguem o formato:

**Sucesso:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Erro:**
```json
{
  "success": false,
  "error": "Mensagem de erro",
  "details": [ ... ]
}
```

## Deploy na Vercel

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Login

```bash
vercel login
```

### 3. Configurar Projeto

```bash
vercel
```

### 4. Configurar Variáveis de Ambiente

No dashboard da Vercel:
1. Ir para Settings > Environment Variables
2. Adicionar:
   - `MONGODB_URI` - Connection string do MongoDB Atlas
   - `NODE_ENV` - production
   - `CORS_ORIGIN` - URL do front-end

### 5. Deploy

```bash
vercel --prod
```

## MongoDB Atlas

Para produção, use MongoDB Atlas:

1. Criar conta em https://www.mongodb.com/cloud/atlas
2. Criar cluster
3. Criar database user
4. Whitelist IP (ou permitir de qualquer lugar: 0.0.0.0/0)
5. Copiar connection string
6. Configurar na Vercel como `MONGODB_URI`

## Testes

Para testar a API localmente:

1. Instale uma ferramenta de teste de API (Postman, Insomnia, Thunder Client)
2. Inicie o servidor: `npm run dev`
3. Teste o health check: `GET http://localhost:3000/health`
4. Teste os endpoints conforme documentação acima

## Troubleshooting

### Erro de conexão MongoDB

- Verifique se o MongoDB está rodando
- Verifique a connection string no `.env.local`
- Para Atlas, verifique whitelist de IPs

### Erro CORS

- Verifique a variável `CORS_ORIGIN`
- Certifique-se que corresponde ao URL do front-end

### Erro de validação

- Verifique o formato dos dados enviados
- Consulte a documentação dos endpoints
- Veja o campo `details` na resposta de erro

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Licença

ISC
