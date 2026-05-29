import "dotenv/config";
import express from "express";
import cors from "cors";

import usersRoutes from "./routes/users.js";
import authRoutes from "./routes/auth.js";
import productsRoutes from "./routes/products.js";
import categoriesRoutes from "./routes/categories.js";
import cartRoutes from "./routes/cart.js";
import ordersRoutes from "./routes/orders.js";
import adminOrdersRoutes from "./routes/adminOrders.js";
import paymentsRoutes from "./routes/payments.js";
import webhooksRoutes from "./routes/webhooks.js";
import adminPaymentsRoutes from "./routes/adminPayments.js";
import profileRoutes from "./routes/profile.js";

import { connectMongo } from "./db/mongo.js";
import { pingRedis } from "./db/redis.js";

const app = express();

// ✅ Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS
const corsOptions: cors.CorsOptions = {
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ecommerce-5bt9.onrender.com",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// ✅ Health
app.get("/", (_req, res) => res.send("API funcionando"));
app.get("/health", async (_req, res) => {
  const redisOk = await pingRedis();
  res.json({
    api: "ok",
    redis: redisOk ? "ok" : "down",
    mongo: (await import("./db/mongo.js")).mongoose.connection.readyState === 1 ? "ok" : "down",
  });
});

// ✅ Routes
app.use("/users", usersRoutes);
app.use("/auth", authRoutes);
app.use("/products", productsRoutes);
app.use("/categories", categoriesRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", ordersRoutes);
app.use("/admin/orders", adminOrdersRoutes);
app.use("/payments", paymentsRoutes);
app.use("/webhooks", webhooksRoutes);
app.use("/admin/payments", adminPaymentsRoutes);
app.use("/profile", profileRoutes);

// ✅ Return URLs
app.get("/payment/success", (_req, res) => res.send("Pago aprobado ✅"));
app.get("/payment/failure", (_req, res) => res.send("Pago fallido ❌"));
app.get("/payment/pending", (_req, res) => res.send("Pago pendiente ⏳"));

// ✅ Boot
const PORT = Number(process.env.PORT) || 3000;

async function main() {
  // Mongo: conectar antes de aceptar tráfico
  await connectMongo();
  // Redis: el cliente conecta solo (ioredis lazy=false), solo pingueamos
  const redisOk = await pingRedis();
  if (!redisOk) console.warn("⚠️  Redis no respondió al ping (¿está levantado?)");

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 API escuchando en puerto ${PORT}`);
  });
}

main().catch((err) => {
  console.error("❌ Error al iniciar la app:", err);
  process.exit(1);
});
