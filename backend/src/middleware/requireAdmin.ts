import type { Request, Response, NextFunction } from "express";
import prisma from "../prisma.js";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.sub;
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return res.status(403).json({ error: "No autorizado (ADMIN requerido)" });
  }

  next();
}
