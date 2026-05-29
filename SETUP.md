# SETUP

## Requisitos
- Docker Desktop
- Node.js 18+

## Pasos

```powershell
cp .env.example .env
cd backend
cp env.example .env
cd ..
docker compose up -d
cd backend
npm install
npx prisma migrate deploy
npm run dev
```

## Verificar
- http://localhost:3000/health → `{ "api": "ok", "redis": "ok", "mongo": "ok" }`

## UIs

| URL | Usuario | Password |
|---|---|---|
| http://localhost:8080 (pgAdmin) | `admin@admin.com` | `admin` |
| http://localhost:8081 (mongo-express) | `admin` | `admin` |
| http://localhost:8082 (redis-commander) | — | — |

## Credenciales DBs

| DB | Host (Windows) | Host (Docker) | User | Pass | DB |
|---|---|---|---|---|---|
| Postgres | `localhost:5433` | `postgres:5432` | `postgres` | `postgres` | `ecommerce` |
| Mongo | `localhost:27017` | `mongo:27017` | `admin` | `admin` | `ecommerce` |
| Redis | `localhost:6379` | `redis:6379` | — | `redispass` | — |

## Si Prisma falla con `(not available)`

```powershell
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
npx prisma migrate deploy
```

## Reset total

```powershell
docker compose down -v
docker compose up -d
cd backend
npx prisma migrate deploy
```
