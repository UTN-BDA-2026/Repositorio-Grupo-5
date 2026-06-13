# Proyecto BD — Ecommerce (Grupo 5)

Backend de ecommerce desarrollado como proyecto final de la materia **Bases de Datos Avanzadas**.

> Para levantar el proyecto localmente ver [SETUP.md](./SETUP.md).

---

## Arquitectura de bases de datos

El proyecto usa **tres bases de datos** con distintos propósitos (polyglot persistence):

| Base de datos | Uso | Tecnología |
|---|---|---|
| **PostgreSQL** | Productos, órdenes, pagos, usuarios (auth) | Prisma ORM |
| **MongoDB** | Perfiles de usuario extendidos | Mongoose |
| **Redis** | Carrito de compras y sesiones | ioredis |

---

## Schema PostgreSQL

```
User          → id, email, password, points, role, timestamps
Category      → id, name
Product       → id, name, description, price, stock, imageUrl, categoryId
Order         → id, userId, status (PENDING/PAID/CANCELLED), total, timestamps
OrderItem     → id, orderId, productId, quantity, unitPrice, subtotal
Payment       → id, orderId, provider, status, amount, rawPayment (JSON)
```

---

## Ítems implementados

### 1. Índices

Índices aplicados sobre las tablas de PostgreSQL:

| Tabla | Índice | Tipo |
|---|---|---|
| `Order` | `userId` | B+Tree simple |
| `Order` | `(userId, status)` | Compuesto |
| `Order` | `(status, createdAt)` | Compuesto |
| `Order` | `createdAt` | BRIN |
| `Order` | `userId, createdAt WHERE status='PENDING'` | Parcial |
| `OrderItem` | `orderId` | B+Tree simple |
| `OrderItem` | `productId` | B+Tree simple |
| `Product` | `categoryId` | B+Tree simple |
| `Product` | `price` | B+Tree simple |

Los índices B+Tree y compuestos están definidos en `backend/prisma/schema.prisma`.
Los índices BRIN y parcial están en `backend/prisma/migrations/`.

### 2. Transacciones

El checkout (`POST /orders`) ejecuta una transacción atómica en PostgreSQL que:
- Valida stock de cada producto
- Crea la `Order` y los `OrderItem`
- Descuenta el stock
- Vacía el carrito en Redis

Si cualquier paso falla, se hace rollback completo.

### 3. Backup & Restore

Scripts disponibles en `backend/scripts/`:

#### Hacer un backup

```bash
# Desde la raíz del proyecto (con Docker levantado)
bash backend/scripts/backup.sh
```

El archivo se guarda en `backend/scripts/backups/` con el nombre `backup_ecommerce_<fecha_hora>.sql`.

#### Restaurar desde un backup

```bash
bash backend/scripts/restore.sh backend/scripts/backups/backup_ecommerce_YYYYMMDD_HHMMSS.sql
```

> El contenedor `ecommerce-postgres` debe estar corriendo antes de ejecutar cualquiera de los dos scripts.

#### Variables de entorno usadas por los scripts

| Variable        | Valor por defecto | Descripción       |
|-----------------|-------------------|-------------------|
| `POSTGRES_USER` | `postgres`        | Usuario de la BD  |
| `POSTGRES_DB`   | `ecommerce`       | Nombre de la base |

Si usás valores distintos en tu `.env`, exportalos antes de correr el script:

```bash
export POSTGRES_USER=mi_usuario
export POSTGRES_DB=mi_base
bash backend/scripts/backup.sh
```

### 4. NoSQL — MongoDB + Redis

**MongoDB** almacena perfiles extendidos de usuarios (`UserProfile`):
- Preferencias
- Historial de búsqueda
- Direcciones de envío

**Redis** maneja:
- Carrito de compras (`cart:{userId}` → HASH con TTL de 7 días)
- Sesiones activas

### 5. Particionado

Particionado implementado en dos tablas de PostgreSQL:

| Tabla       | Estrategia | Columna     | Particiones                                               |
|-------------|------------|-------------|-----------------------------------------------------------|
| `Order`     | LIST       | `status`    | PENDING, PAID, CANCELLED                                  |
| `OrderItem` | RANGE      | `unitPrice` | low (< $1000), mid ($1000–$10000), high (> $10000)        |

La migración correspondiente está en `backend/prisma/migrations/`.

> **Nota técnica:** PostgreSQL no permite foreign keys apuntando a tablas particionadas a menos que la clave referenciada incluya la columna de partición. Por eso las FK de `Payment → Order` y `OrderItem → Order` fueron eliminadas en la migración de particionado. La integridad referencial se mantiene a nivel de aplicación (Prisma valida que el `orderId` exista antes de insertar).

Para verificar las particiones desde pgAdmin (`http://localhost:8080`):

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

---

## Endpoints principales

### Healthcheck
```
GET /health
```

### Usuarios y Auth
```
POST /users          — registro
POST /auth/login     — login, devuelve JWT
GET  /users/me       — perfil (requiere token)
```

### Productos
```
GET  /products              — listar (público)
GET  /products?categoryId=1 — filtrar por categoría
GET  /products/:id          — detalle
POST /products              — crear (ADMIN)
```

### Carrito (requiere token)
```
GET    /cart                — ver carrito
POST   /cart                — agregar producto
PATCH  /cart/:productId     — cambiar cantidad
DELETE /cart/:productId     — eliminar producto
DELETE /cart                — vaciar carrito
```

### Órdenes (requiere token)
```
POST /orders        — checkout (crea orden desde carrito)
GET  /orders        — mis órdenes
GET  /orders/:id    — detalle de orden
```

### Admin (requiere token ADMIN)
```
GET   /admin/orders              — todas las órdenes
GET   /admin/orders?status=PAID  — filtrar por estado
PATCH /admin/orders/:id/status   — cambiar estado
```
