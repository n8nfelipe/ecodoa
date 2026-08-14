# EcoDoa — Descarte Consciente e Doação P2P

Plataforma para conectar doadores a pessoas e ONGs, e mapear pontos de
descarte ecológico (lixo eletrônico, pilhas, óleo, lâmpadas).

## Estrutura

```
reciclagem/
├── backend/          # API REST (Node.js + Express + TypeScript + Prisma)
├── frontend/         # SPA (Vite + React + TailwindCSS + React-Leaflet)
├── Dockerfile        # backend e frontend containerizados
├── docker-compose.yml # PostgreSQL + backend + frontend (nginx)
└── README.md
```

## Stack

| Camada | Tecnologia |
| :--- | :--- |
| Frontend | React 18, Vite, TailwindCSS, React-Leaflet/OpenStreetMap |
| Backend | Node.js, Express, TypeScript |
| Banco | PostgreSQL + Prisma ORM |
| Auth | JWT (e-mail/senha; Google OAuth previsto) |
| Uploads | Multer (armazenamento local em `/uploads`) |
| Contato | Redirecionamento para WhatsApp |

## Pré-requisitos

- Docker + Docker Compose

## Como rodar (Docker Compose — recomendado)

Todo o projeto (banco, backend e frontend) roda via `docker compose`, usando
portas alternativas para não conflitar com serviços locais:

| Serviço | Porta do host | Porta interna |
| :--- | :--- | :--- |
| Frontend | `5174` | 80 (nginx) |
| Backend API | `3334` | 3333 |
| PostgreSQL | `5433` | 5432 |

### Subir tudo

```bash
docker compose up -d --build
```

- Frontend: <http://localhost:5174>
- Backend (health): <http://localhost:3334/api/health>
- Banco: `postgres://postgres:postgres@localhost:5433/reciclagem`

O backend roda `prisma migrate deploy` + seed automaticamente na inicialização
e os uploads ficam persistidos no volume `ecodoa_uploads`.

### Parar / limpar

```bash
docker compose down          # para os containers
docker compose down -v       # para e remove os volumes (dados + uploads)
```

## Desenvolvimento local (sem Docker)

### 1. Subir somente o banco

```bash
docker compose up -d db
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # ajuste se necessário
npm install
npx prisma migrate dev --name init
npm run seed            # popula as categorias padrão
npm run dev             # http://localhost:3333
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

Nesse modo o frontend roda em `http://localhost:5173` e o backend em
`http://localhost:3333` (banco na porta `5433`).

## Endpoints principais

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| POST | `/api/auth/register` | Cadastro |
| POST | `/api/auth/login` | Login (retorna JWT) |
| GET | `/api/auth/me` | Perfil e histórico |
| GET | `/api/listings` | Lista com filtros (`lat`, `lng`, `radiusKm`, `type`, `categoryId`) |
| POST | `/api/listings` | Cria anúncio (autenticado) |
| GET | `/api/listings/categories` | Categorias |
| GET | `/api/listings/:id` | Detalhes + link WhatsApp |
| PATCH | `/api/listings/:id/status` | Atualiza status (dono/moderador) |
| POST | `/api/upload` | Upload de imagens (autenticado) |
| POST | `/api/reviews` | Avaliar usuário |
| POST | `/api/reports` | Denunciar anúncio |
| GET | `/api/admin/listings/pending` | Fila de moderação (MODERATOR/ADMIN) |
| PATCH | `/api/admin/listings/:id/moderate` | Aprovar/rejeitar |
| GET | `/api/admin/reports` | Denúncias abertas |

## Status do MVP

- [x] Backend: autenticação, CRUD de anúncios, busca por raio (Haversine),
      upload, moderação, avaliações, denúncias
- [x] Frontend: mapa interativo, filtros, cadastro, perfil, detalhes com
      WhatsApp, painel de moderação
- [ ] Google OAuth
- [ ] Testes automatizados
- [ ] Deploy (Docker da app + volume para uploads)