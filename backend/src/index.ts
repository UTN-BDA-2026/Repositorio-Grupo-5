import "dotenv/config";
import express from "express";
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
import cors from "cors";


const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.use("/users", usersRoutes);

app.use("/auth", authRoutes);

app.get("/", (_req, res) => {
  res.send("API funcionando");
});

app.use("/products", productsRoutes);

app.use("/categories", categoriesRoutes);

app.use("/cart", cartRoutes);

app.use("/orders", ordersRoutes);

app.use("/admin/orders", adminOrdersRoutes);

app.use("/payments", paymentsRoutes);

app.use("/webhooks", webhooksRoutes);

app.get("/payment/success", (_req, res) => res.send("Pago aprobado ✅"));
app.get("/payment/failure", (_req, res) => res.send("Pago fallido ❌"));
app.get("/payment/pending", (_req, res) => res.send("Pago pendiente ⏳"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/admin/payments", adminPaymentsRoutes);

app.listen(3000, () => {
  console.log("API escuchando en http://localhost:3000");
});
