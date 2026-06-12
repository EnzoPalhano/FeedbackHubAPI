# Feedback Hub API

API REST para uma plataforma de comunidade. Permite que usuários se cadastrem, autentiquem, criem posts, comentem e votem, com controle de permissões por papel (`USER` / `ADMIN`).

## Instalação passo a passo

### Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | 20.x |
| npm | 9.x |

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/ProjetoFeedBackHubAPI.git
cd ProjetoFeedBackHubAPI
```

### 2. Instale as dependências

```bash
npm install
```

O `postinstall` já executa `prisma generate` automaticamente.

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e ajuste os valores:

```bash
cp .env.example .env
```

Edite o `.env` com um segredo JWT forte:

```env
DATABASE_URL="file:../db/database.sqlite"
JWT_SECRET=troque-por-uma-chave-forte-e-secreta
PORT=3333
NODE_ENV=development
```

### 4. Crie o banco de dados e aplique o schema

```bash
npx prisma db push
```

### 5. (Opcional) Popule dados de teste

```bash
npm run seed
```

Isso cria três usuários, dois posts, dois comentários e cinco votos:

| E-mail | Senha | Papel |
|---|---|---|
| `admin@feedbackhub.com` | `admin123` | `ADMIN` |
| `alice@feedbackhub.com` | `user123` | `USER` |
| `bob@feedbackhub.com` | `user123` | `USER` |

### 6. Inicie o servidor

```bash
npm run dev
```

O servidor sobe em `http://localhost:3333` por padrão.

---

## Stack

- Node.js 20+
- TypeScript com `strict: true`, `noImplicitAny: true` e `exactOptionalPropertyTypes: true`
- Fastify
- Prisma ORM v6
- SQLite
- Zod
- JWT via `@fastify/jwt`
- `bcryptjs`
- Vitest
- tsup
- ESLint + Prettier
- dotenv

## Estrutura de diretórios

```text
.
├── db/
│   └── database.sqlite
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app.ts
│   ├── env.ts
│   ├── server.ts
│   ├── controllers/
│   │   ├── user.controller.ts
│   │   ├── post.controller.ts
│   │   ├── comment.controller.ts
│   │   └── vote.controller.ts
│   ├── enums/
│   │   └── user-role.ts
│   ├── lib/
│   │   └── prisma.ts
│   ├── middlewares/
│   │   └── verify-jwt.ts
│   ├── repositories/
│   │   ├── user-repository.ts
│   │   ├── prisma-user-repository.ts
│   │   ├── post-repository.ts
│   │   ├── prisma-post-repository.ts
│   │   ├── comment-repository.ts
│   │   ├── prisma-comment-repository.ts
│   │   └── prisma-vote-repository.ts
│   ├── routes/
│   │   ├── users.ts
│   │   ├── posts.ts
│   │   └── comments.ts
│   ├── schemas/
│   │   ├── create-user.schema.ts
│   │   ├── login.schema.ts
│   │   ├── update-user.schema.ts
│   │   ├── create-post.schema.ts
│   │   ├── update-post.schema.ts
│   │   ├── create-comment.schema.ts
│   │   ├── update-comment.schema.ts
│   │   └── vote.schema.ts
│   ├── services/
│   │   ├── user.service.ts
│   │   ├── post.service.ts
│   │   ├── comment.service.ts
│   │   └── vote.service.ts
│   ├── tests/
│   │   ├── users.spec.ts
│   │   ├── posts.spec.ts
│   │   ├── comments.spec.ts
│   │   └── votes.spec.ts
│   ├── types/
│   │   └── fastify.d.ts
│   └── utils/
│       └── app-error.ts
├── .env.example
├── .eslintrc.cjs
├── .gitignore
├── .prettierrc.json
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Arquitetura

### Fluxo por camadas

```text
Route
  -> Controller
    -> Service
      -> Repository (interface)
        -> Prisma Repository (implementation)
          -> Prisma Client
            -> SQLite
```

### Responsabilidades

- `routes/` — wiring HTTP, middlewares e composição das dependências
- `controllers/` — adaptação entre Fastify e casos de uso
- `services/` — regras de negócio e orquestração
- `repositories/` — contratos de persistência e implementação concreta
- `schemas/` — validação e normalização de entrada (Zod)
- `middlewares/` — políticas transversais como autenticação
- `lib/` — adaptadores de infraestrutura compartilhados
- `types/` — augmentation de tipos do Fastify/JWT
- `utils/` — erros de aplicação padronizados

### Por que Repository Pattern

O service não conhece Prisma. Isso evita que mudanças de persistência contaminem a regra de negócio. Cada domínio segue o mesmo padrão: contrato em `repositories/`, implementação concreta em Prisma, service desacoplado de detalhes de ORM.

## Modelo de dados

```prisma
enum UserRole {
  USER
  ADMIN
}

model User {
  id           String    @id @default(cuid())
  name         String
  email        String    @unique
  passwordHash String
  role         UserRole  @default(USER)
  karma        Int       @default(0)
  createdAt    DateTime  @default(now())
  posts        Post[]
  comments     Comment[]
  votes        Vote[]
}

model Post {
  id        String    @id @default(cuid())
  title     String
  content   String
  userId    String
  score     Int       @default(0)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  author    User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  comments  Comment[]
  votes     Vote[]
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  userId    String
  postId    String
  score     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  author    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  votes     Vote[]
}

model Vote {
  id        String   @id @default(cuid())
  userId    String
  postId    String?
  commentId String?
  value     Boolean
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post?    @relation(fields: [postId], references: [id], onDelete: Cascade)
  comment   Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)
}
```

### Observações de modelagem

- `id` usa `cuid()` para identificadores estáveis e URL-safe.
- `email` possui `@unique`, reforçando a regra também no banco.
- `passwordHash` jamais retorna na API.
- `role` controla as políticas de autorização.
- `karma` existe como campo preparado para evolução, sem automação neste escopo.
- `onDelete: Cascade` garante remoção em cascata ao deletar o autor.
- `updatedAt` é gerenciado automaticamente pelo Prisma.

## Variáveis de ambiente

```env
DATABASE_URL="file:../db/database.sqlite"
JWT_SECRET=your-very-strong-secret
PORT=3333
NODE_ENV=development
```

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Build incremental com tsup e hot-reload |
| `npm run build` | Gera `dist/` para produção |
| `npm start` | Executa a build de produção |
| `npm test` | Sincroniza schema e roda Vitest |
| `npm run test:watch` | Sincroniza schema e inicia Vitest em modo watch |
| `npm run lint` | Executa ESLint |

## Rodando os testes

```bash
npm test
```

O script sincroniza o schema antes de cada execução (`prisma db push --skip-generate`) e usa um banco separado (`db/test.database.sqlite`) para não interferir nos dados de desenvolvimento.

Para modo watch (re-executa a cada mudança):

```bash
npm run test:watch
```

## Autenticação

Rotas protegidas exigem o token JWT no cabeçalho:

```http
Authorization: Bearer <token>
```

O payload do token carrega `sub` (id do usuário) e `role`. Respostas sem token ou com token inválido retornam `401`.

### Papéis

| Papel | Permissões |
|---|---|
| `USER` | Cria posts e comentários; edita e deleta os próprios recursos e a própria conta |
| `ADMIN` | Tudo do USER, mais: gerenciar qualquer conta |

Todo usuário criado via `POST /users` começa como `USER`.

---

## Endpoints — Usuários

### `POST /users`

Cria um novo usuário.

#### Request body

```json
{
  "name": "João",
  "email": "joao@email.com",
  "password": "123456"
}
```

#### Validação

| Campo | Regra |
|---|---|
| `name` | string, mínimo 3 caracteres após trim |
| `email` | formato válido, trim + toLowerCase, único no sistema |
| `password` | string, mínimo 6 caracteres |

#### Response `201`

```json
{
  "id": "cm123...",
  "name": "João",
  "email": "joao@email.com",
  "role": "USER"
}
```

#### Erros

| Código | Mensagem |
|---|---|
| `400` | Mensagem de validação do campo inválido |
| `409` | `Email já cadastrado` |

---

### `POST /login`

Autentica e retorna um token JWT.

#### Request body

```json
{
  "email": "joao@email.com",
  "password": "123456"
}
```

#### Response `200`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Erros

| Código | Mensagem |
|---|---|
| `401` | `Credenciais invalidas` |

---

### `GET /users`

Lista todos os usuários. **Requer JWT.**

#### Response `200`

```json
[
  {
    "id": "cm123...",
    "name": "João",
    "email": "joao@email.com",
    "role": "USER",
    "karma": 0
  }
]
```

---

### `GET /users/:id`

Retorna um usuário pelo ID. **Requer JWT.**

#### Response `200`

```json
{
  "id": "cm123...",
  "name": "João",
  "email": "joao@email.com",
  "role": "USER",
  "karma": 0,
  "createdAt": "2026-05-29T20:00:00.000Z"
}
```

#### Erros

| Código | Mensagem |
|---|---|
| `404` | `Usuário não encontrado` |

---

### `PUT /users/:id`

Atualiza nome, e-mail ou senha. **Requer JWT. Permissão: próprio usuário ou admin.**

Envie apenas os campos que deseja alterar (mínimo um).

#### Request body

```json
{
  "name": "João Atualizado",
  "email": "novo@email.com",
  "password": "novasenha123"
}
```

#### Validação

| Campo | Regra |
|---|---|
| `name` | opcional, mínimo 3 caracteres após trim |
| `email` | opcional, formato válido |
| `password` | opcional, mínimo 6 caracteres |

#### Response `200`

Retorna o usuário atualizado (mesmo formato do `GET /users/:id`).

#### Erros

| Código | Mensagem |
|---|---|
| `400` | `Informe ao menos um campo para atualizar` |
| `403` | `Sem permissão para atualizar este usuário` |
| `404` | `Usuário não encontrado` |
| `409` | `Email já cadastrado` |

---

### `DELETE /users/:id`

Remove um usuário. **Requer JWT. Permissão: próprio usuário ou admin.**

#### Response `204`

Sem corpo.

#### Erros

| Código | Mensagem |
|---|---|
| `403` | `Sem permissão para deletar este usuário` |
| `404` | `Usuário não encontrado` |

---

## Endpoints — Posts

### `POST /posts`

Cria um post. **Requer JWT.** O autor é definido automaticamente pelo token.

#### Request body

```json
{
  "title": "Título do post",
  "content": "Conteúdo do post"
}
```

#### Response `201`

```json
{
  "id": "cm456...",
  "title": "Título do post",
  "content": "Conteúdo do post",
  "userId": "cm123...",
  "score": 0,
  "createdAt": "2026-05-29T20:00:00.000Z",
  "updatedAt": "2026-05-29T20:00:00.000Z"
}
```

---

### `GET /posts`

Lista todos os posts. **Rota pública.**

#### Response `200`

Array de posts, ordenados do mais recente ao mais antigo.

---

### `GET /posts/:id`

Retorna um post pelo ID. **Rota pública.**

#### Erros

| Código | Mensagem |
|---|---|
| `404` | `Post não encontrado` |

---

### `PUT /posts/:id`

Atualiza um post. **Requer JWT. Permissão: dono do post ou admin.**

#### Request body

```json
{
  "title": "Novo título",
  "content": "Novo conteúdo"
}
```

#### Erros

| Código | Mensagem |
|---|---|
| `403` | `Sem permissão para editar este post` |
| `404` | `Post não encontrado` |

---

### `DELETE /posts/:id`

Remove um post. **Requer JWT. Permissão: dono do post ou admin.**

#### Response `204`

Sem corpo.

#### Erros

| Código | Mensagem |
|---|---|
| `403` | `Sem permissão para deletar este post` |
| `404` | `Post não encontrado` |

---

## Endpoints — Comentários

### `POST /posts/:postId/comments`

Cria um comentário em um post. **Requer JWT.**

#### Request body

```json
{
  "content": "Conteúdo do comentário"
}
```

#### Response `201`

```json
{
  "id": "cm789...",
  "content": "Conteúdo do comentário",
  "userId": "cm123...",
  "postId": "cm456...",
  "score": 0,
  "createdAt": "2026-05-29T20:00:00.000Z",
  "updatedAt": "2026-05-29T20:00:00.000Z"
}
```

---

### `GET /posts/:postId/comments`

Lista comentários de um post.

---

### `PUT /comments/:id`

Atualiza um comentário. **Requer JWT. Permissão: dono do comentário ou admin.**

#### Request body

```json
{
  "content": "Conteúdo atualizado"
}
```

---

### `DELETE /comments/:id`

Remove um comentário. **Requer JWT. Permissão: dono do comentário ou admin.**

#### Response `204`

Sem corpo.

---

## Endpoints — Votos

### `POST /posts/:postId/vote`

Vota em um post. **Requer JWT.**

#### Request body

```json
{
  "value": true
}
```

`true` = upvote, `false` = downvote.

---

### `POST /comments/:commentId/vote`

Vota em um comentário. **Requer JWT.**

#### Request body

```json
{
  "value": true
}
```

---

## Tratamento de erros

Formato padrão de todas as respostas de erro:

```json
{
  "message": "Mensagem descritiva"
}
```

| Código | Significado |
|---|---|
| `400` | Falha de validação Zod ou campo faltando |
| `401` | Token ausente, inválido, expirado ou credenciais erradas |
| `403` | Autenticado, mas sem permissão para a ação |
| `404` | Recurso não encontrado |
| `409` | Conflito (e-mail já cadastrado) |
| `500` | Erro interno não tratado |

## JWT

Payload tipado em `src/types/fastify.d.ts`:

```ts
{
  sub: string;   // id do usuário
  role: UserRole;
}
```

## Estratégia de testes

Os testes usam `Fastify.inject()` para evitar dependência de porta TCP e cobrem o comportamento HTTP real da app. Os arquivos de teste rodam **em série** (`fileParallelism: false` no `vitest.config.ts`) por compartilharem o mesmo banco SQLite.

## Segurança implementada

- Senha criptografada com `bcryptjs` (12 rounds)
- JWT com payload tipado e verificação via middleware
- `passwordHash` nunca retorna na API
- Validação de payload antes da execução do service
- Autorização por papel em operações sensíveis
- Erros padronizados sem vazamento de detalhes internos
