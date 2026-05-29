import { Router } from "express";
import { UserProfile } from "../models/UserProfile.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

// GET /profile -> mi perfil (lo crea vacío si no existe)
router.get("/", async (req, res) => {
  const userId = Number((req as any).user?.sub);
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  let profile = await UserProfile.findOne({ userId });
  if (!profile) {
    profile = await UserProfile.create({ userId });
  }
  res.json(profile);
});

// PUT /profile -> actualizar datos básicos / preferencias
router.put("/", async (req, res) => {
  const userId = Number((req as any).user?.sub);
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  const { firstName, lastName, phone, avatarUrl, preferences } = req.body ?? {};
  const update: Record<string, unknown> = {};
  if (firstName !== undefined) update.firstName = firstName;
  if (lastName !== undefined) update.lastName = lastName;
  if (phone !== undefined) update.phone = phone;
  if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;
  if (preferences !== undefined) update.preferences = preferences;

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: update, $setOnInsert: { userId } },
    { new: true, upsert: true }
  );
  res.json(profile);
});

// POST /profile/addresses -> agregar dirección
router.post("/addresses", async (req, res) => {
  const userId = Number((req as any).user?.sub);
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  const { label, street, number, city, province, zip, country } = req.body ?? {};
  if (!label || !street || !number || !city) {
    return res.status(400).json({ error: "label, street, number y city son requeridos" });
  }

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    {
      $push: { addresses: { label, street, number, city, province, zip, country } },
      $setOnInsert: { userId },
    },
    { new: true, upsert: true }
  );
  res.status(201).json(profile);
});

// DELETE /profile/addresses/:addressId -> borrar dirección
router.delete("/addresses/:addressId", async (req, res) => {
  const userId = Number((req as any).user?.sub);
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { $pull: { addresses: { _id: req.params.addressId } } },
    { new: true }
  );
  if (!profile) return res.status(404).json({ error: "Perfil no encontrado" });
  res.json(profile);
});

export default router;
