-- DropIndex
DROP INDEX "Order_createdAt_brin_idx";

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_price_idx" ON "Product"("price");

-- Índice BRIN: muy liviano, ideal para fechas que crecen cronológicamente
-- Prisma no lo soporta en el schema, se agrega manualmente
CREATE INDEX IF NOT EXISTS "Order_createdAt_brin_idx"
  ON "Order" USING BRIN ("createdAt");
