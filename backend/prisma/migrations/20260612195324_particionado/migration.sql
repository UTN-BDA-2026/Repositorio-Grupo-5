-- ============================================================
-- PARTICIONADO 1: Order por estado (LIST)
-- Divide la tabla Order en 3 particiones según el estado
-- de la orden: PENDING, PAID o CANCELLED
-- ============================================================

-- 0) Eliminar foreign keys que apuntan a Order antes de renombrar
ALTER TABLE "Payment"   DROP CONSTRAINT IF EXISTS "Payment_orderId_fkey";
ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_orderId_fkey";

-- 0b) Eliminar índices existentes sobre Order (vienen de la migración de índices)
DROP INDEX IF EXISTS "Order_userId_idx";
DROP INDEX IF EXISTS "Order_userId_status_idx";
DROP INDEX IF EXISTS "Order_status_createdAt_idx";
DROP INDEX IF EXISTS "Order_createdAt_brin_idx";
DROP INDEX IF EXISTS "Order_pending_idx";

-- 1) Guardar datos actuales
ALTER TABLE "Order" RENAME TO "Order_old";

-- 2) Crear nueva tabla particionada por estado
CREATE TABLE "Order" (
  id          SERIAL,
  "userId"    INTEGER NOT NULL,
  status      "OrderStatus" NOT NULL DEFAULT 'PENDING',
  total       NUMERIC(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
) PARTITION BY LIST (status);

-- 3) Crear las 3 particiones
CREATE TABLE "Order_pending"   PARTITION OF "Order" FOR VALUES IN ('PENDING');
CREATE TABLE "Order_paid"      PARTITION OF "Order" FOR VALUES IN ('PAID');
CREATE TABLE "Order_cancelled" PARTITION OF "Order" FOR VALUES IN ('CANCELLED');

-- 4) Migrar datos de la tabla vieja a la nueva
INSERT INTO "Order" SELECT * FROM "Order_old";

-- 5) Recrear índices
CREATE INDEX "Order_userId_idx"           ON "Order" ("userId");
CREATE INDEX "Order_userId_status_idx"    ON "Order" ("userId", status);
CREATE INDEX "Order_status_createdAt_idx" ON "Order" (status, "createdAt");
CREATE INDEX IF NOT EXISTS "Order_createdAt_brin_idx"
  ON "Order" USING BRIN ("createdAt");
CREATE INDEX IF NOT EXISTS "Order_pending_idx"
  ON "Order" ("userId", "createdAt") WHERE status = 'PENDING';

-- Nota: las FK hacia Order (Payment, OrderItem) no se recrean porque
-- PostgreSQL no permite FK apuntando a tablas particionadas sin incluir
-- la columna de partición. La integridad se mantiene a nivel de aplicación.

-- 6) Eliminar tabla vieja
DROP TABLE "Order_old";


-- ============================================================
-- PARTICIONADO 2: OrderItem por rango de precio (RANGE)
-- Divide OrderItem en 3 particiones según el precio unitario:
-- low (< $1000), mid ($1000-$10000), high (> $10000)
-- ============================================================

-- 0) Eliminar índices existentes sobre OrderItem (vienen de la migración de índices)
DROP INDEX IF EXISTS "OrderItem_orderId_idx";
DROP INDEX IF EXISTS "OrderItem_productId_idx";

-- 1) Guardar datos actuales
ALTER TABLE "OrderItem" RENAME TO "OrderItem_old";

-- 2) Crear nueva tabla particionada por unitPrice
CREATE TABLE "OrderItem" (
  id          SERIAL,
  "orderId"   INTEGER NOT NULL,
  "productId" INTEGER NOT NULL,
  quantity    INTEGER NOT NULL,
  "unitPrice" NUMERIC(10,2) NOT NULL,
  subtotal    NUMERIC(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE ("unitPrice");

-- 3) Crear las 3 particiones
CREATE TABLE "OrderItem_low"  PARTITION OF "OrderItem"
  FOR VALUES FROM (MINVALUE) TO (1000);
CREATE TABLE "OrderItem_mid"  PARTITION OF "OrderItem"
  FOR VALUES FROM (1000) TO (10000);
CREATE TABLE "OrderItem_high" PARTITION OF "OrderItem"
  FOR VALUES FROM (10000) TO (MAXVALUE);

-- 4) Migrar datos
INSERT INTO "OrderItem" SELECT * FROM "OrderItem_old";

-- 5) Recrear índices
CREATE INDEX "OrderItem_orderId_idx"   ON "OrderItem" ("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem" ("productId");

-- 6) Eliminar tabla vieja
DROP TABLE "OrderItem_old";
