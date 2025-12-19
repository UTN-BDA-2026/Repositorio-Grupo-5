import { Router } from "express";
import prisma from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

// GET /categories (público)
router.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  res.json(categories);
});

// POST /categories (ADMIN)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body as { name?: string };
    if (!name?.trim()) return res.status(400).json({ error: "name es requerido" });

    const category = await prisma.category.create({ data: { name: name.trim() } });
    res.status(201).json(category);
  } catch (err: any) {
    if (err?.code === "P2002") return res.status(409).json({ error: "La categoría ya existe" });
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;
