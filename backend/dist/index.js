import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
    res.send("API funcionando");
});
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));
//# sourceMappingURL=index.js.map