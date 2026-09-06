# EcoDoa — Descarte Consciente e Doação P2P

Plataforma para conectar doadores a pessoas e ONGs, e mapear pontos de
descarte ecológico (lixo eletrônico, pilhas, óleo, lâmpadas).

## Funcionalidades

- Cadastro e autenticação com e-mail e senha
- Publicação de doações e ecopontos com imagens
- Busca por endereço, categoria, tipo e raio de distância
- Mapa interativo com OpenStreetMap
- Geocodificação automática do endereço informado
- Moderação de anúncios antes da exibição pública
- Controle administrativo dos perfis de usuários
- Contato entre usuários pelo WhatsApp
- Avaliações e denúncias

## Estrutura

```
reciclagem/
├── backend/           # API REST, Prisma e Dockerfile do backend
├── frontend/          # SPA React e Dockerfile do frontend
├── docker-compose.yml # PostgreSQL, backend e frontend (nginx)
├── LICENSE            # Licença MIT
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
| Geocodificação | Nominatim/OpenStreetMap |

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

> O seed cria somente as categorias iniciais. Contas de moderador e
> administrador devem ser definidas diretamente no banco ou por uma rotina
> administrativa própria.

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

## Variáveis de ambiente

Copie `backend/.env.example` para `backend/.env` no desenvolvimento local. As
principais configurações são:

| Variável | Descrição |
| :--- | :--- |
| `DATABASE_URL` | URL de conexão com o PostgreSQL |
| `JWT_SECRET` | Chave usada para assinar os tokens de acesso |
| `JWT_EXPIRES_IN` | Tempo de validade do token |
| `BASE_URL` | Endereço público do frontend |
| `UPLOAD_DIR` | Diretório de armazenamento das imagens |
| `MAX_FILE_SIZE_MB` | Tamanho máximo permitido por arquivo |
| `GEOCODING_BASE_URL` | Servidor Nominatim; opcional |

Em produção, altere obrigatoriamente `JWT_SECRET` e as credenciais padrão do
banco presentes no `docker-compose.yml`.

## Fluxo de publicação

1. O usuário informa os dados e confirma a localização no mapa.
2. O anúncio é criado com o status `PENDING`.
3. Um moderador ou administrador aprova ou rejeita a publicação.
4. Somente anúncios `APPROVED` aparecem na busca e no mapa públicos.

## Endpoints principais

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| POST | `/api/auth/register` | Cadastro |
| POST | `/api/auth/login` | Login (retorna JWT) |
| GET | `/api/auth/me` | Perfil e histórico |
| GET | `/api/listings` | Lista com filtros (`lat`, `lng`, `radiusKm`, `type`, `categoryId`) |
| GET | `/api/geocoding/search` | Converte um endereço (`q`) em latitude e longitude |
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
| GET | `/api/admin/users` | Lista usuários (ADMIN) |
| PATCH | `/api/admin/users/:id/role` | Altera perfil de acesso (ADMIN) |

O controle de usuários fica disponível em `/admin/users` para contas com o
perfil `ADMIN`.

## Status do MVP

- [x] Backend: autenticação, CRUD de anúncios, busca por raio (Haversine),
      upload, moderação, avaliações, denúncias
- [x] Frontend: mapa interativo, filtros, cadastro, perfil, detalhes com
      WhatsApp, painel de moderação
- [ ] Google OAuth
- [x] Testes automatizados para os utilitários geográficos
- [ ] Deploy (Docker da app + volume para uploads)

## Licença

Este projeto está disponível sob a [Licença MIT](LICENSE).

## Integração contínua e versões

O workflow `.github/workflows/ci-release.yml` executa os testes e a compilação
do backend, além da verificação e build do frontend, em pull requests e pushes
para `main`. Após todas as validações passarem em um push, o semantic-release
calcula a próxima versão, cria uma tag no formato `vX.Y.Z` e publica uma release
no GitHub.

As mensagens de commit devem seguir o padrão Conventional Commits:

- `fix: corrige filtro por endereço` gera uma versão patch (`1.0.1`)
- `feat: adiciona controle de usuários` gera uma versão minor (`1.1.0`)
- `feat!: altera contrato da API` ou um rodapé `BREAKING CHANGE:` gera uma
  versão major (`2.0.0`)
- Outros tipos, como `docs`, `test`, `refactor` e `chore`, não geram uma nova
  versão por padrão
