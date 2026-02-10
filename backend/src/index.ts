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

const app = express();

// ✅ Body parsers (una sola vez)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS (local + Render frontend)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://ecommerce-5bt9.onrender.com", // 👈 tu frontend en Render
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Preflight
app.options("*", cors());

// ✅ Routes
app.get("/", (_req, res) => {
  res.send("API funcionando");
});

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

// ✅ Simple return URLs (si las usás)
app.get("/payment/success", (_req, res) => res.send("Pago aprobado ✅"));
app.get("/payment/failure", (_req, res) => res.send("Pago fallido ❌"));
app.get("/payment/pending", (_req, res) => res.send("Pago pendiente ⏳"));

// ✅ Port para Render
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API escuchando en puerto ${PORT}`);
});
