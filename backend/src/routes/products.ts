import { Router } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

// GET /products (público)
// opcional: /products?categoryId=1
router.get("/", async (req, res) => {
  const raw = req.query.categoryId;

  let categoryId: number | undefined;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n)) categoryId = n;
  }

  const args: Prisma.ProductFindManyArgs = {
    include: { category: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  };

  if (categoryId !== undefined) {
    args.where = { categoryId };
  }

  const products = await prisma.product.findMany(args);
  res.json(products);
});

// GET /products/:id (público)
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "ID inválido" });

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { id: true, name: true } } },
  });

  if (!product) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(product);
});

// POST /products (ADMIN)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, stock, categoryId } = req.body as {
      name?: string;
      description?: string;
      price?: string | number;
      stock?: number;
      categoryId?: number | null;
    };

    if (!name?.trim()) return res.status(400).json({ error: "name es requerido" });
    if (price === undefined || price === null) return res.status(400).json({ error: "price es requerido" });

    const priceStr = typeof price === "number" ? String(price) : price;
    const priceNum = Number(priceStr);
    if (!Number.isFinite(priceNum)) return res.status(400).json({ error: "price inválido" });

    const stockInt = stock ?? 0;

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: priceStr, // Decimal -> ok como string
        stock: stockInt,
        categoryId: categoryId ?? null,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    res.status(201).json(product);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
});

// PATCH /products/:id (ADMIN)
router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "ID inválido" });

  const { name, description, price, stock, categoryId } = req.body as {
    name?: string;
    description?: string | null;
    price?: string | number;
    stock?: number;
    categoryId?: number | null;
  };

  const data: Prisma.ProductUpdateInput = {};

  if (name !== undefined) data.name = name.trim();
  if (description !== undefined) data.description = description === null ? null : description.trim();

  if (price !== undefined) {
    const priceStr = typeof price === "number" ? String(price) : price;
    const priceNum = Number(priceStr);
    if (!Number.isFinite(priceNum)) return res.status(400).json({ error: "price inválido" });
    data.price = priceStr as any; // Prisma acepta string para Decimal
  }

  if (stock !== undefined) data.stock = stock;
  if (categoryId !== undefined) data.category = categoryId === null ? { disconnect: true } : { connect: { id: categoryId } };

  try {
    const updated = await prisma.product.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true } } },
    });
    res.json(updated);
  } catch (err: any) {
    if (err?.code === "P2025") return res.status(404).json({ error: "Producto no encontrado" });
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
