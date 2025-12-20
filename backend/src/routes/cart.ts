import { Router } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// todo /cart requiere auth
router.use(requireAuth);

// GET /cart  -> devuelve items + totales
router.get("/", async (req, res) => {
  const userId = (req as any).user?.sub;
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  const items = await prisma.cartItem.findMany({
    where: { userId: Number(userId) },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          category: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  let total = new Prisma.Decimal(0);

  const mapped = items.map((it) => {
    const unitPrice = it.product.price; // Decimal
    const subtotal = unitPrice.mul(it.quantity);
    total = total.add(subtotal);

    return {
      id: it.id,
      productId: it.productId,
      quantity: it.quantity,
      product: it.product,
      unitPrice: unitPrice.toFixed(2),
      subtotal: subtotal.toFixed(2),
    };
  });

  res.json({
    items: mapped,
    total: total.toFixed(2),
  });
});

// POST /cart  -> agrega (o incrementa) item
router.post("/", async (req, res) => {
  const userId = (req as any).user?.sub;
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  const { productId, quantity } = req.body as { productId?: number; quantity?: number };
  if (!productId) return res.status(400).json({ error: "productId es requerido" });

  const qty = quantity ?? 1;
  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({ error: "quantity debe ser entero > 0" });
  }

  const product = await prisma.product.findUnique({
    where: { id: Number(productId) },
    select: { id: true, stock: true },
  });
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });

  // (opcional) validar stock acá, o dejarlo para checkout
  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId: Number(userId), productId: Number(productId) } },
    create: { userId: Number(userId), productId: Number(productId), quantity: qty },
    update: { quantity: { increment: qty } },
  });

  res.status(201).json(item);
});

// PATCH /cart/:productId -> set cantidad (si 0, borra)
router.patch("/:productId", async (req, res) => {
  const userId = (req as any).user?.sub;
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  const productId = Number(req.params.productId);
  if (!Number.isFinite(productId)) return res.status(400).json({ error: "productId inválido" });

  const { quantity } = req.body as { quantity?: number };
  if (quantity === undefined) return res.status(400).json({ error: "quantity es requerido" });
  if (!Number.isInteger(quantity)) return res.status(400).json({ error: "quantity debe ser entero" });

  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({
      where: { userId: Number(userId), productId },
    });
    return res.status(204).send();
  }

  try {
    const updated = await prisma.cartItem.update({
      where: { userId_productId: { userId: Number(userId), productId } },
      data: { quantity },
    });
    res.json(updated);
  } catch (err: any) {
    if (err?.code === "P2025") return res.status(404).json({ error: "Item no encontrado en carrito" });
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
});

// DELETE /cart/:productId -> borrar item
router.delete("/:productId", async (req, res) => {
  const userId = (req as any).user?.sub;
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  const productId = Number(req.params.productId);
  if (!Number.isFinite(productId)) return res.status(400).json({ error: "productId inválido" });

  await prisma.cartItem.deleteMany({
    where: { userId: Number(userId), productId },
  });

  res.status(204).send();
});

// DELETE /cart -> vaciar carrito
router.delete("/", async (req, res) => {
  const userId = (req as any).user?.sub;
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  await prisma.cartItem.deleteMany({ where: { userId: Number(userId) } });
  res.status(204).send();
});

export default router;
