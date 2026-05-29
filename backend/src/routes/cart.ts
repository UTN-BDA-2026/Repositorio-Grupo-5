import { Router } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../prisma.js";
import { redis, cartKey, CART_TTL_SECONDS } from "../db/redis.js";
import { requireAuth } from "../middleware/requireAuth.js";

/**
 * CARRITO EN REDIS
 * --------------------------------
 * Key:     cart:{userId}
 * Tipo:    HASH
 * Campos:  productId (string) -> quantity (string entero)
 * TTL:     7 días (se renueva en cada modificación)
 *
 * El producto y precio se hidratan desde Postgres (Prisma) al hacer GET.
 */

const router = Router();
router.use(requireAuth);

// helper: leer el carrito como [{productId, quantity}]
async function readCart(userId: number) {
  const raw = await redis.hgetall(cartKey(userId));
  return Object.entries(raw).map(([productId, quantity]) => ({
    productId: Number(productId),
    quantity: Number(quantity),
  }));
}

// GET /cart -> items hidratados + total
router.get("/", async (req, res) => {
  const userId = Number((req as any).user?.sub);
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  const entries = await readCart(userId);
  if (entries.length === 0) {
    return res.json({ items: [], total: "0.00" });
  }

  const productIds = entries.map((e) => e.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      stock: true,
      category: { select: { id: true, name: true } },
    },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let total = new Prisma.Decimal(0);
  const items = entries
    .map((e) => {
      const product = productMap.get(e.productId);
      if (!product) return null; // producto borrado; lo ignoramos
      const unitPrice = product.price;
      const subtotal = unitPrice.mul(e.quantity);
      total = total.add(subtotal);
      return {
        productId: e.productId,
        quantity: e.quantity,
        product,
        unitPrice: unitPrice.toFixed(2),
        subtotal: subtotal.toFixed(2),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  res.json({ items, total: total.toFixed(2) });
});

// POST /cart -> agrega (o incrementa) item
router.post("/", async (req, res) => {
  const userId = Number((req as any).user?.sub);
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  const { productId, quantity } = req.body as { productId?: number; quantity?: number };
  if (!productId) return res.status(400).json({ error: "productId es requerido" });

  const qty = quantity ?? 1;
  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({ error: "quantity debe ser entero > 0" });
  }

  // Validar existencia del producto en Postgres
  const product = await prisma.product.findUnique({
    where: { id: Number(productId) },
    select: { id: true, stock: true },
  });
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });

  const key = cartKey(userId);
  const newQty = await redis.hincrby(key, String(productId), qty);
  await redis.expire(key, CART_TTL_SECONDS);

  res.status(201).json({ productId: Number(productId), quantity: newQty });
});

// PATCH /cart/:productId -> set cantidad (si <=0, borra)
router.patch("/:productId", async (req, res) => {
  const userId = Number((req as any).user?.sub);
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  const productId = Number(req.params.productId);
  if (!Number.isFinite(productId)) return res.status(400).json({ error: "productId inválido" });

  const { quantity } = req.body as { quantity?: number };
  if (quantity === undefined) return res.status(400).json({ error: "quantity es requerido" });
  if (!Number.isInteger(quantity)) return res.status(400).json({ error: "quantity debe ser entero" });

  const key = cartKey(userId);

  if (quantity <= 0) {
    await redis.hdel(key, String(productId));
    return res.status(204).send();
  }

  await redis.hset(key, String(productId), String(quantity));
  await redis.expire(key, CART_TTL_SECONDS);
  res.json({ productId, quantity });
});

// DELETE /cart/:productId -> borrar item
router.delete("/:productId", async (req, res) => {
  const userId = Number((req as any).user?.sub);
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  const productId = Number(req.params.productId);
  if (!Number.isFinite(productId)) return res.status(400).json({ error: "productId inválido" });

  await redis.hdel(cartKey(userId), String(productId));
  res.status(204).send();
});

// DELETE /cart -> vaciar carrito
router.delete("/", async (req, res) => {
  const userId = Number((req as any).user?.sub);
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  await redis.del(cartKey(userId));
  res.status(204).send();
});

export default router;
