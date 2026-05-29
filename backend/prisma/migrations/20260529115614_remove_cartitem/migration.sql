-- Bloque 3: el carrito se movió a Redis (key cart:{userId}, hash productId->qty, TTL 7d).
-- Ver: backend/src/db/redis.ts y backend/src/routes/cart.ts

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_userId_fkey";
ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_productId_fkey";

-- DropTable
DROP TABLE IF EXISTS "CartItem";
