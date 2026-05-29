import { Router } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../prisma.js";
import { redis, cartKey } from "../db/redis.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

// POST /orders -> crea orden desde carrito (Redis)
router.post("/", async (req, res) => {
  const userId = Number((req as any).user?.sub);
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  try {
    // 1) Leer carrito desde Redis
    const raw = await redis.hgetall(cartKey(userId));
    const cartEntries = Object.entries(raw).map(([pid, qty]) => ({
      productId: Number(pid),
      quantity: Number(qty),
    }));

    if (cartEntries.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío" });
    }

    // 2) Transacción atómica en Postgres
    const result = await prisma.$transaction(async (tx) => {
      const productIds = cartEntries.map((c) => c.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, price: true, stock: true },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      // Validar existencia + stock
      for (const c of cartEntries) {
        const p = productMap.get(c.productId);
        if (!p) {
          return { kind: "not_found" as const, productId: c.productId };
        }
        if (c.quantity > p.stock) {
          return {
            kind: "no_stock" as const,
            productId: p.id,
            productName: p.name,
            stock: p.stock,
            requested: c.quantity,
          };
        }
      }

      // Calcular total + items
      let total = new Prisma.Decimal(0);
      const itemsData = cartEntries.map((c) => {
        const p = productMap.get(c.productId)!;
        const unitPrice = p.price;
        const subtotal = unitPrice.mul(c.quantity);
        total = total.add(subtotal);
        return {
          productId: c.productId,
          quantity: c.quantity,
          unitPrice,
          subtotal,
        };
      });

      // Crear orden + items
      const order = await tx.order.create({
        data: {
          userId,
          total,
          items: { create: itemsData },
        },
        include: { items: true },
      });

      // Descontar stock
      for (const c of cartEntries) {
        await tx.product.update({
          where: { id: c.productId },
          data: { stock: { decrement: c.quantity } },
        });
      }

      return { kind: "ok" as const, order };
    });

    if (result.kind === "not_found") {
      return res.status(404).json({ error: "Producto no encontrado", ...result });
    }
    if (result.kind === "no_stock") {
      return res.status(409).json({ error: "Stock insuficiente", ...result });
    }

    // 3) Vaciar carrito en Redis solo si la transacción tuvo éxito
    await redis.del(cartKey(userId));

    res.status(201).json(result.order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
});

// GET /orders -> mis órdenes
router.get("/", async (req, res) => {
  const userId = Number((req as any).user?.sub);
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

// GET /orders/:id -> detalle (solo dueño)
router.get("/:id", async (req, res) => {
  const userId = Number((req as any).user?.sub);
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "ID inválido" });

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: { select: { id: true, name: true } } } } },
  });

  if (!order) return res.status(404).json({ error: "Orden no encontrada" });
  if (order.userId !== userId) return res.status(403).json({ error: "No autorizado" });

  res.json(order);
});

export default router;
