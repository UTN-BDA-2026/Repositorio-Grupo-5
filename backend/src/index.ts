import "dotenv/config";
import express from "express";
import usersRoutes from "./routes/users.js";

const app = express();

app.get("/", (req, res) => {
  res.send("API funcionando");
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`escuchando en el puerto: ${PORT}`));

app.use("/users", usersRoutes);
