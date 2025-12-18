import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization; // "Bearer <token>"
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Falta token" });
  }

  const token = header.slice("Bearer ".length);
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "JWT_SECRET no configurado" });

  try {
    const payload = jwt.verify(token, secret);
    (req as any).user = payload; // guardamos el payload para usarlo en las rutas
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o vencido" });
  }
}
