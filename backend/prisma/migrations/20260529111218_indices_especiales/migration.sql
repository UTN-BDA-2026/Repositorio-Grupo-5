-- Índice PARCIAL: solo indexa órdenes PENDING
-- Más liviano que un índice completo — útil para queries de órdenes pendientes
-- Ejemplo: SELECT * FROM "Order" WHERE status = 'PENDING' AND "userId" = 5
CREATE INDEX IF NOT EXISTS "Order_pending_idx"
  ON "Order" ("userId", "createdAt")
  WHERE status = 'PENDING';

-- Índice BRIN (Block Range INdex): para columnas con datos ordenados naturalmente
-- Muy liviano (ocupa mucho menos espacio que B+Tree)
-- Ideal para fechas de creación que crecen cronológicamente
-- También útil para el particionado por fecha que haremos después
CREATE INDEX IF NOT EXISTS "Order_createdAt_brin_idx"
  ON "Order" USING BRIN ("createdAt");
