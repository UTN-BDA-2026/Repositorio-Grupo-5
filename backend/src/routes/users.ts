import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../prisma.js"; // o donde lo exportes
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ error: "Faltan campos: email y password" });
    }

    // Hasheo
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        // points: opcional, si querés permitirlo
      },
      // OJO: no devolver password
      select: { id: true, email: true, points: true, createdAt: true },
    });

    return res.status(201).json(user);
  } catch (err: any) {
    // Email duplicado (unique)
    if (err?.code === "P2002") {
      return res.status(409).json({ error: "El email ya está registrado" });
    }
    console.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const userId = (req as any).user?.sub;
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { id: true, email: true, points: true, createdAt: true }, // sin password
  });

  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  return res.json(user);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "ID inválido" });

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, points: true, createdAt: true },
  });

  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  return res.json(user);
});



export default router;
