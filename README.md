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
- `backup.sh` — genera un dump de PostgreSQL con `pg_dump`
- `restore.sh` — restaura desde un dump con `pg_restore`

### 4. NoSQL — MongoDB + Redis

**MongoDB** almacena perfiles extendidos de usuarios (`UserProfile`):
- Preferencias
- Historial de búsqueda
- Direcciones de envío

**Redis** maneja:
- Carrito de compras (`cart:{userId}` → HASH con TTL de 7 días)
- Sesiones activas

### 5. Particionado

*(próximamente)*

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
