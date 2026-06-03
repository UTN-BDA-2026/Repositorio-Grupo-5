import { Router } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

router.post("/mercadopago/checkout", async (req, res) => {
  const userId = Number((req as any).user?.sub);
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  const { orderId } = req.body as { orderId?: number };
  if (!orderId) return res.status(400).json({ error: "orderId es requerido" });

  const order = await prisma.order.findUnique({
    where: { id: Number(orderId) },
    include: { items: { include: { product: { select: { name: true } } } } },
  });

  if (!order) return res.status(404).json({ error: "Orden no encontrada" });
  if (order.userId !== userId) return res.status(403).json({ error: "No autorizado" });
  if (order.status !== "PENDING") return res.status(409).json({ error: "La orden no está PENDING" });

  // Si ya existe una preferencia creada, devolvela
  const existing = await prisma.payment.findUnique({ where: { orderId: order.id } });
  if (existing?.preferenceId && existing.raw && (existing.raw as any).init_point) {
    return res.json({
      preferenceId: existing.preferenceId,
      init_point: (existing.raw as any).init_point,
      sandbox_init_point: (existing.raw as any).sandbox_init_point,
    });
  }

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;
  const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL!;
  const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || PUBLIC_BASE_URL;

  if (!MP_ACCESS_TOKEN || !PUBLIC_BASE_URL) {
    return res.status(500).json({ error: "Faltan env vars de MercadoPago" });
  }

  // MP espera números en unit_price
  const items = order.items.map((it) => ({
    title: it.product?.name ?? `Producto #${it.productId}`,
    quantity: it.quantity,
    unit_price: Number(it.unitPrice.toString()),
  }));

  const preferencePayload = {
    items,
    external_reference: String(order.id),
    notification_url: `${PUBLIC_BASE_URL}/webhooks/mercadopago`,
    back_urls: {
      success: `${FRONTEND_BASE_URL}/payment/success`,
      failure: `${FRONTEND_BASE_URL}/payment/failure`,
      pending: `${FRONTEND_BASE_URL}/payment/pending`,
    },
    auto_return: "approved",
    metadata: { order_id: order.id },
  };

  const resp = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferencePayload),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    return res.status(502).json({ error: "Error creando preferencia MercadoPago", details: txt });
  }

  const data = await resp.json(); // suele traer: id (preferenceId), init_point, sandbox_init_point

  await prisma.payment.upsert({
  where: { orderId: order.id },
  create: {
    provider: "MERCADOPAGO",
    orderId: order.id,
    preferenceId: data.id,
    status: "created",
    amount: order.total,
    currency: "ARS",
    raw: data, // preferencia
  },
  update: {
    preferenceId: data.id,
    status: "created",
    amount: order.total,
    currency: "ARS",
    raw: data, // preferencia
  },
});

  res.json({
    preferenceId: data.id,
    init_point: data.init_point,
    sandbox_init_point: data.sandbox_init_point,
  });
});

// POST /payments/local-pay — pago local sin MercadoPago (solo para desarrollo)
router.post("/local-pay", async (req, res) => {
  const userId = Number((req as any).user?.sub);
  if (!userId) return res.status(401).json({ error: "Token inválido" });

  const { orderId } = req.body as { orderId?: number };
  if (!orderId) return res.status(400).json({ error: "orderId es requerido" });

  const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
  if (!order) return res.status(404).json({ error: "Orden no encontrada" });
  if (order.userId !== userId) return res.status(403).json({ error: "No autorizado" });
  if (order.status !== "PENDING") return res.status(409).json({ error: "La orden no está PENDING" });

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
    });
    await tx.payment.upsert({
      where: { orderId: order.id },
      create: {
        provider: "MERCADOPAGO",
        orderId: order.id,
        status: "approved",
        amount: order.total,
        currency: "ARS",
        paidAt: new Date(),
      },
      update: {
        status: "approved",
        paidAt: new Date(),
      },
    });
  });

  res.json({ message: "Orden pagada exitosamente", orderId: order.id, status: "PAID" });
});

export default router;
