import "dotenv/config";
import express from "express";
import usersRoutes from "./routes/users.js";
import authRoutes from "./routes/auth.js";

const app = express();
app.use(express.json());

app.use("/users", usersRoutes);

app.use("/auth", authRoutes);

app.get("/", (_req, res) => {
  res.send("API funcionando");
});

app.listen(3000, () => {
  console.log("API escuchando en http://localhost:3000");
});
