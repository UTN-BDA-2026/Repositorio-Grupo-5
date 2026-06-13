# Guía de setup — Proyecto BD Ecommerce

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- [Node.js 18+](https://nodejs.org/)
- Git

> **Importante:** si tenés PostgreSQL instalado localmente (por ejemplo con pgAdmin), puede estar ocupando el puerto 5432. El proyecto usa el puerto **5433** para evitar ese conflicto.

---

## Paso 1 — Clonar el repo

```bash
git clone https://github.com/UTN-BDA-2026/Repositorio-Grupo-5.git
cd Repositorio-Grupo-5
```

---

## Paso 2 — Configurar los archivos de entorno

El proyecto tiene **dos** archivos `.env` que necesitás crear:

### 2a) `.env` en la raíz del proyecto (para Docker)

Copiá el archivo de ejemplo:
```bash
cp .env.example .env
```

Este archivo define las credenciales que usa `docker-compose.yml` para crear los contenedores. No necesitás cambiar nada.

Contenido:
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ecommerce

MONGO_USER=admin
MONGO_PASSWORD=admin

REDIS_PASSWORD=redispass
```

### 2b) `.env` dentro de la carpeta `backend/` (para el servidor Node)

```bash
cd backend
cp env.example .env
cd ..
```

Este archivo define las URLs de conexión que usa el backend para conectarse a las bases de datos. Tampoco necesitás cambiar nada.

Contenido relevante:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ecommerce"
MONGO_URL="mongodb://admin:admin@localhost:27017/ecommerce?authSource=admin"
REDIS_URL="redis://:redispass@localhost:6379"
JWT_SECRET="una_clave_larga_y_dificil_de_adivinar_123456"
```

---

## Paso 3 — Levantar los contenedores Docker

Desde la raíz del proyecto:
```bash
docker compose up -d
```

Esto levanta 6 contenedores:
| Contenedor | Puerto | Descripción |
|---|---|---|
| `postgres` | 5433 | Base de datos principal (PostgreSQL) |
| `mongo` | 27017 | Base de datos de usuarios (MongoDB) |
| `redis` | 6379 | Carrito y sesiones (Redis) |
| `pgAdmin` | 8080 | UI web para PostgreSQL |
| `mongo-express` | 8081 | UI web para MongoDB |
| `redis-commander` | 8082 | UI web para Redis |

Esperá a que todos los contenedores estén **healthy** (verde en Docker Desktop).

---

## Paso 4 — Instalar dependencias y aplicar migraciones

```bash
cd backend
npm install
npx prisma migrate deploy
```

El comando `prisma migrate deploy` crea todas las tablas e índices en PostgreSQL automáticamente.

---

## Paso 5 — Cargar datos de prueba (seed)

```bash
# Desde la carpeta backend/
npx tsx prisma/seed.ts
```

Esto inserta: 20 categorías, 500 usuarios, 5000 productos, 5000 órdenes y 15000 order items.

---

## Paso 6 — Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

---

## Paso 7 — Iniciar el backend y el frontend

Abrir **dos terminales**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
El servidor queda disponible en `http://localhost:3000`.

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
La app queda disponible en `http://localhost:5173`.

---

## Paso 8 — Verificar que todo funciona

### Backend
```
GET http://localhost:3000/health
```
Respuesta esperada:
```json
{ "api": "ok", "redis": "ok", "mongo": "ok" }
```

### UIs web para explorar las bases de datos

| UI | URL | Usuario | Contraseña |
|---|---|---|---|
| pgAdmin (PostgreSQL) | http://localhost:8080 | admin@admin.com | admin |
| Mongo Express (MongoDB) | http://localhost:8081 | admin | admin |
| Redis Commander | http://localhost:8082 | — | — |

### Credenciales directas a las BDs

| Base de datos | Host | Puerto | Usuario | Contraseña | DB |
|---|---|---|---|---|---|
| PostgreSQL | localhost | 5433 | postgres | postgres | ecommerce |
| MongoDB | localhost | 27017 | admin | admin | ecommerce |
| Redis | localhost | 6379 | — | redispass | — |

---

---

## Verificar los ítems del proyecto

### 1. Índices

En pgAdmin (`http://localhost:8080`) → Query Tool:

```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

Deberían aparecer 11 índices sobre `Order`, `OrderItem` y `Product`.

### 2. Transacciones

Registrarse en `http://localhost:5173`, agregar productos al carrito y hacer clic en **"✅ Pagar (local)"**. La orden pasa a estado `PAID` en una única transacción atómica.

### 3. Backup & Restore

**En Linux/Mac o Git Bash:**
```bash
bash backend/scripts/backup.sh
bash backend/scripts/restore.sh backend/scripts/backups/backup_ecommerce_<fecha_hora>.sql
```

**En Windows (PowerShell), si no tenés Git Bash ni WSL:**
```powershell
# Backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backend\scripts\backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
docker exec ecommerce-postgres pg_dump -U postgres -d ecommerce --no-password | Out-File -Encoding utf8 "$backupDir\backup_ecommerce_$timestamp.sql"
Write-Host "Backup guardado en: $backupDir\backup_ecommerce_$timestamp.sql"

# Restore (reemplazar el nombre del archivo)
Get-Content "backend\scripts\backups\backup_ecommerce_<fecha_hora>.sql" | docker exec -i ecommerce-postgres psql -U postgres -d ecommerce
```

> **Nota:** el restore está pensado para ejecutarse sobre una base vacía (caso de recuperación ante desastre). Si la base ya tiene datos, aparecen errores de "ya existe" que son esperados — los datos existentes no se modifican. Para un restore limpio, primero hacer `docker compose down -v && docker compose up -d` y luego restaurar el backup sin correr `prisma migrate deploy` ni el seed.

### 4. NoSQL — MongoDB + Redis

- **Redis** (carrito): agregar un producto al carrito y verificar en Redis Commander (`http://localhost:8082`) la clave `cart:{userId}`.
- **MongoDB** (perfiles): verificar en Mongo Express (`http://localhost:8081`) la colección `userprofiles`.

### 5. Particionado

En pgAdmin → Query Tool:

```sql
SELECT
    parent.relname AS tabla_padre,
    child.relname  AS particion,
    pg_get_expr(child.relpartbound, child.oid) AS rango
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child  ON pg_inherits.inhrelid  = child.oid
WHERE parent.relname IN ('Order', 'OrderItem')
ORDER BY parent.relname, child.relname;
```

Deben aparecer 6 filas: 3 particiones de `Order` (por status) y 3 de `OrderItem` (por rango de precio).

---

## Reset total (si algo falla)

```bash
# Desde la raíz del proyecto
docker compose down -v
docker compose up -d

# Desde backend/
npx prisma migrate deploy
```

El flag `-v` borra los volúmenes y recrea las BDs desde cero.

---

## Solución de problemas comunes

**Error: port is already allocated (5432 o 6379)**
> Tenés PostgreSQL o Redis corriendo localmente. Detenerlos o reiniciar Docker Desktop.

**Error: Authentication failed / (not available)**
> Verificar que el `.env` de `backend/` existe y tiene `DATABASE_URL` con puerto 5433.

**Prisma no conecta después de `docker compose up`**
> Los contenedores tardan unos segundos en estar listos. Esperar a que estén en estado `healthy` y volver a intentar.
